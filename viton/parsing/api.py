from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
import os
import uuid
import shutil
import torch
import numpy as np
from PIL import Image
from torch.utils.data import DataLoader
import torchvision.transforms as transforms
from collections import OrderedDict
import networks
from utils.transforms import transform_logits
from datasets.simple_extractor_dataset import SimpleFolderDataset
import gc

app = FastAPI(title="Human Parsing API")

checkpoints_path = './ckpt/'
dataset_settings = {
    'lip': {'input_size':[473,473], 'num_classes':20},
    'atr': {'input_size':[512,512], 'num_classes':18},
    'pascal': {'input_size':[512,512], 'num_classes':7},
    'torso_pascal': {'input_size':[512,512], 'num_classes':2},
}

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

def load_model(model_restore:str, dataset:str):
    num_classes = dataset_settings[dataset]['num_classes']
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
    return model

@app.post("/parse-image/")
async def parse_image(
    file: UploadFile = File(...),
    dataset: str = Form(...),
    model_restore: str = Form(...),
    output_dir: str = Form("./outputs/")
):
    try:
        # tạo folder tạm
        temp_folder = f"./temp_{uuid.uuid4().hex}/"
        os.makedirs(temp_folder, exist_ok=True)
        file_path = os.path.join(temp_folder, file.filename)
        with open(file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        # load model
        model = load_model(model_restore, dataset)
        num_classes = dataset_settings[dataset]['num_classes']
        input_size = dataset_settings[dataset]['input_size']

        # dataset & dataloader
        transform = transforms.Compose([
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.406,0.456,0.485], std=[0.225,0.224,0.229])
        ])
        dataset_obj = SimpleFolderDataset(root=temp_folder, input_size=input_size, transform=transform)
        dataloader = DataLoader(dataset_obj)

        # chuẩn bị output
        os.makedirs(output_dir, exist_ok=True)
        palette = get_palette(num_classes)

        with torch.no_grad():
            for idx, batch in enumerate(dataloader):
                image, meta = batch
                img_name = meta['name'][0]
                c = meta['center'].numpy()[0]
                s = meta['scale'].numpy()[0]
                w = meta['width'].numpy()[0]
                h = meta['height'].numpy()[0]

                output = model(image.cuda() if torch.cuda.is_available() else image)
                upsample = torch.nn.Upsample(size=input_size, mode='bilinear', align_corners=True)
                upsample_output = upsample(output[0].unsqueeze(0)).squeeze().permute(1,2,0)
                upsample_output_np = upsample_output.cpu().numpy() if torch.cuda.is_available() else upsample_output.numpy()

                logits_result = transform_logits(upsample_output_np, c, s, w, h, input_size=input_size)
                parsing_result = np.argmax(logits_result, axis=2)

                parsing_result_path = os.path.join(output_dir, img_name[:-4]+".png")
                out_img = Image.fromarray(parsing_result.astype(np.uint8))
                out_img.putpalette(palette)
                out_img.save(parsing_result_path)

        # xóa folder tạm
        os.remove(file_path)
        shutil.rmtree(temp_folder)
        # del model
        # model = None

        return {"status":"success", "output_image": parsing_result_path}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

    finally:
        # giải phóng tài nguyên
        if model is not None:
            if torch.cuda.is_available():
                model.cpu()
            del model
        if temp_folder and os.path.exists(temp_folder):
            shutil.rmtree(temp_folder)
        torch.cuda.empty_cache()
        gc.collect()