from fastapi import FastAPI, APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse, JSONResponse
import requests
import os
import uuid
import shutil
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

router = APIRouter()

DATASET_TEST_IMAGE = "./datasets/test/image/"
TEST_PAIR_FILE = "./datasets/test_pairs.txt"
OPENPOSE_API = "http://localhost:8003/openpose/"
PARSE_API = "http://localhost:8000/parse-image/"
VITON_API = "http://localhost:8001/viton/"

@router.post("/try-on/")
async def try_on(file: UploadFile = File(...), cloth_name: str = Form(...)):
    try:
        os.makedirs(DATASET_TEST_IMAGE, exist_ok=True)

        # Lưu file upload
        img_filename = file.filename
        img_path = os.path.join(DATASET_TEST_IMAGE, img_filename)
        with open(img_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        # Cập nhật test_pair.txt
        with open(TEST_PAIR_FILE, "w") as f:
            f.write(f"{img_filename} {cloth_name}\n")

        # 1. Gọi API OpenPose
        with open(img_path, "rb") as f:
            r_openpose = requests.post(OPENPOSE_API, files={"file": f})
        if r_openpose.status_code != 200:
            raise HTTPException(status_code=500, detail=f"OpenPose API error: {r_openpose.text}")

        # 2. Gọi API parse-image
        with open(img_path, "rb") as f:
            r_parse = requests.post(PARSE_API, files={"file": f})
        if r_parse.status_code != 200:
            raise HTTPException(status_code=500, detail=f"Parse-image API error: {r_parse.text}")

        # 3. Gọi API Viton (GET)
        r_viton = requests.get(VITON_API)
        if r_viton.status_code != 200:
            raise HTTPException(status_code=500, detail=f"Viton API error: {r_viton.text}")

        viton_result = r_viton.json()
        viton_image = viton_result.get("image_base64")
        if not viton_image:
            raise HTTPException(status_code=500, detail="Viton API did not return base64 image")

        return {"status": "success", "image_base64": viton_image}

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/results", StaticFiles(directory="./results/viton_hd_test"), name="viton_hd_test")

app.include_router(router)