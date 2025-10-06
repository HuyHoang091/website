from fastapi import FastAPI, Query
from fastapi.responses import JSONResponse
import traceback, base64

from test import test, get_opt
from networks import SegGenerator, GMM, ALIASGenerator
from utils import load_checkpoint
import torch, os
import shutil

app = FastAPI()

@app.get("/viton/")
async def viton_api():
    try:
        opt = get_opt([
            "--name", "viton_hd_test"
        ])

        # khởi tạo model
        seg = SegGenerator(opt, input_nc=opt.semantic_nc + 8, output_nc=opt.semantic_nc)
        gmm = GMM(opt, inputA_nc=7, inputB_nc=3)
        opt.semantic_nc = 7
        alias = ALIASGenerator(opt, input_nc=9)
        opt.semantic_nc = 13

        load_checkpoint(seg, os.path.join(opt.checkpoint_dir, opt.seg_checkpoint))
        load_checkpoint(gmm, os.path.join(opt.checkpoint_dir, opt.gmm_checkpoint))
        load_checkpoint(alias, os.path.join(opt.checkpoint_dir, opt.alias_checkpoint))

        seg.cuda().eval()
        gmm.cuda().eval()
        alias.cuda().eval()

        output_dir = os.path.join(opt.save_dir, opt.name)
        if os.path.exists(output_dir):
            shutil.rmtree(output_dir)
        os.makedirs(output_dir, exist_ok=True)

        # chạy thử
        test(opt, seg, gmm, alias)

        # lấy ảnh kết quả cuối cùng
        output_dir = os.path.join(opt.save_dir, opt.name)
        files = [os.path.join(output_dir, f) for f in os.listdir(output_dir)]
        files.sort()
        if not files:
            return JSONResponse(content={"error": "No output image found"}, status_code=500)

        last_file = files[-1]

        # encode base64
        with open(last_file, "rb") as f:
            img_base64 = base64.b64encode(f.read()).decode("utf-8")

        # dọn bộ nhớ sau khi xong
        del seg, gmm, alias
        torch.cuda.empty_cache()

        return {"status": "success", "image_base64": img_base64}

    except Exception as e:
        print("=== ERROR in /viton/ ===")
        print(traceback.format_exc())
        return JSONResponse(content={"error": str(e)}, status_code=500)
