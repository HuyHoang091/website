# main.py
import os
import sys
import cv2
import json
import uuid
import shutil
from fastapi import FastAPI, UploadFile, Form
from fastapi.responses import JSONResponse
import torch
import numpy as np

# === OpenPose setup ===
try:
    dir_path = os.path.dirname(os.path.realpath(__file__))
    sys.path.append(os.path.join(dir_path, 'openpose', 'python', 'Release'))
    os.environ['PATH'] += ';' + os.path.join(dir_path, 'x64', 'Release') + ';' + os.path.join(dir_path, 'bin') + ';'
    import pyopenpose as op
except ImportError as e:
    print("Error: OpenPose library not found.")
    raise e

# === Human Parsing imports ===
from collections import OrderedDict
import networks
from utils.transforms import transform_logits
from datasets.simple_extractor_dataset import SimpleFolderDataset
import torchvision.transforms as transforms
from torch.utils.data import DataLoader
import gc

# === VITON imports ===
from networks import SegGenerator, GMM, ALIASGenerator
from datasets import VITONDataset, VITONDataLoader
from utils import load_checkpoint, save_images, gen_noise
from torch import nn
from torch.nn import functional as F
from torch.cuda.amp import autocast
import torchgeometry as tgm

app = FastAPI(title="Unified Try-On API")

# === Paths ===
DATASET_DIR = './datasets/test/image/'
TEST_PAIR_FILE = './datasets/test/test_pairs.txt'

# === Helper functions ===
def ndarray_to_list(arr):
    if arr is None or len(arr) == 0:
        return []
    return arr.flatten().tolist()

def get_palette(num_cls):
    n = num_cls
    palette = [0]*(n*3)
    for j in range(n):
        lab = j
        i = 0
        while lab:
            palette[j*3+0] |= (((lab>>0)&1)<<(7-i))
            palette[j*3+1] |= (((lab>>1)&1)<<(7-i))
            palette[j*3+2] |= (((lab>>2)&1)<<(7-i))
            i += 1
            lab >>= 3
    return palette

# === Unified API ===
@app.post("/try-on/")
async def try_on(file: UploadFile, cloth_name: str = Form(...)):
    try:
        # 1. Save uploaded image
        os.makedirs(DATASET_DIR, exist_ok=True)
        img_name = f"{uuid.uuid4().hex}.jpg"
        img_path = os.path.join(DATASET_DIR, img_name)
        with open(img_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        # 2. Update test_pairs.txt
        with open(TEST_PAIR_FILE, "w") as f:
            f.write(f"{img_name} {cloth_name}\n")

        # === OpenPose ===
        params = dict()
        params["model_folder"] = "./models/"
        params["render_pose"] = 1
        params["disable_blending"] = True
        params["hand"] = True
        params["num_gpu"] = 1
        params["num_gpu_start"] = 0

        opWrapper = op.WrapperPython()
        opWrapper.configure(params)
        opWrapper.start()

        datum = op.Datum()
        imageToProcess = cv2.imread(img_path)
        if imageToProcess.shape[2] == 4:
            imageToProcess = cv2.cvtColor(imageToProcess, cv2.COLOR_BGRA2BGR)
        datum.cvInputData = imageToProcess
        opWrapper.emplaceAndPop(op.VectorDatum([datum]))
        opWrapper.stop()

        openpose_img_path = os.path.join(DATASET_DIR, "openpose_" + img_name)
        cv2.imwrite(openpose_img_path, datum.cvOutputData)
        openpose_json_path = os.path.join(DATASET_DIR, "openpose_" + img_name.replace(".jpg",".json"))
        with open(openpose_json_path, "w") as f:
            json.dump({"people":[{"pose_keypoints_2d":ndarray_to_list(datum.poseKeypoints)}]}, f)

        # === Human Parsing ===
        # Load model
        dataset = 'lip'
        num_classes = 20
        input_size = [473, 473]
        model_restore = './ckpt/exp-schp-201908261155-lip.pth'
        model = networks.init_model('resnet101_1', num_classes=num_classes, pretrained=None)
        state_dict = torch.load(model_restore, map_location='cuda' if torch.cuda.is_available() else 'cpu')['state_dict']
        new_state_dict = OrderedDict()
        for k,v in state_dict.items():
            name = k[7:] if k.startswith("module.") else k
            new_state_dict[name] = v
        model.load_state_dict(new_state_dict)
        model.eval()
        if torch.cuda.is_available():
            model.cuda()

        transform = transforms.Compose([
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.406,0.456,0.485], std=[0.225,0.224,0.229])
        ])
        dataset_obj = SimpleFolderDataset(root=DATASET_DIR, input_size=input_size, transform=transform)
        dataloader = DataLoader(dataset_obj)
        palette = get_palette(num_classes)

        with torch.no_grad():
            for batch in dataloader:
                image, meta = batch
                c = meta['center'].numpy()[0]
                s = meta['scale'].numpy()[0]
                w = meta['width'].numpy()[0]
                h = meta['height'].numpy()[0]

                output = model(image.cuda() if torch.cuda.is_available() else image)
                upsample = nn.Upsample(size=input_size, mode='bilinear', align_corners=True)
                upsample_output = upsample(output[0].unsqueeze(0)).squeeze().permute(1,2,0)
                upsample_output_np = upsample_output.cpu().numpy() if torch.cuda.is_available() else upsample_output.numpy()
                logits_result = transform_logits(upsample_output_np, c, s, w, h, input_size=input_size)
                parsing_result = np.argmax(logits_result, axis=2)

        # === VITON ===
        opt = type("Opt", (), {})()  # dummy args object
        opt.name = "viton_run"
        opt.load_height = 1024
        opt.load_width = 768
        opt.dataset_dir = './datasets/'
        opt.dataset_mode = 'test'
        opt.dataset_list = 'test_pairs.txt'
        opt.checkpoint_dir = './checkpoints/'
        opt.save_dir = './results/'
        opt.seg_checkpoint = 'seg_final.pth'
        opt.gmm_checkpoint = 'gmm_final.pth'
        opt.alias_checkpoint = 'alias_final.pth'
        opt.batch_size = 1
        opt.workers = 1
        opt.fp16 = False
        opt.channels_last = False
        opt.no_blur = True
        opt.disable_spectral = True
        opt.cudnn_benchmark = False
        os.makedirs(os.path.join(opt.save_dir,opt.name), exist_ok=True)

        seg = SegGenerator(opt, input_nc=13+8, output_nc=13)
        gmm = GMM(opt, inputA_nc=7, inputB_nc=3)
        alias = ALIASGenerator(opt, input_nc=9)
        load_checkpoint(seg, os.path.join(opt.checkpoint_dir, opt.seg_checkpoint))
        load_checkpoint(gmm, os.path.join(opt.checkpoint_dir, opt.gmm_checkpoint))
        load_checkpoint(alias, os.path.join(opt.checkpoint_dir, opt.alias_checkpoint))
        seg.cuda().eval()
        gmm.cuda().eval()
        alias.cuda().eval()

        # Run VITON test
        test_dataset = VITONDataset(opt)
        test_loader = VITONDataLoader(opt, test_dataset)
        with torch.no_grad():
            for i, inputs in enumerate(test_loader.data_loader):
                img_agnostic = inputs['img_agnostic'].cuda(non_blocking=True)
                parse_agnostic = inputs['parse_agnostic'].cuda(non_blocking=True)
                pose = inputs['pose'].cuda(non_blocking=True)
                c = inputs['cloth']['unpaired'].cuda(non_blocking=True)
                cm = inputs['cloth_mask']['unpaired'].cuda(non_blocking=True)
                # Seg -> GMM -> ALIAS forward (simplified)
                # Save final image
                unpaired_names = inputs['img_name']
                output = alias(torch.cat((img_agnostic, pose, c), dim=1), parse_agnostic, parse_agnostic, cm)
                save_images(output, unpaired_names, os.path.join(opt.save_dir,opt.name))

        final_image = os.path.join(opt.save_dir,opt.name, unpaired_names[0])
        return {"status": "success", "final_image": final_image}

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

    finally:
        gc.collect()
        torch.cuda.empty_cache()
