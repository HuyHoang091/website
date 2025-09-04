# file: main.py
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
import uuid, shutil, os
from multiprocessing import Process, Queue
from worker import subprocess_worker

app = FastAPI(title="Human Parsing API")

dataset_settings_map = {
    'lip': {'input_size':[473,473], 'num_classes':20},
    'atr': {'input_size':[512,512], 'num_classes':18},
    'pascal': {'input_size':[512,512], 'num_classes':7},
    'torso_pascal': {'input_size':[512,512], 'num_classes':2},
}

@app.post("/parse-image/")
async def parse_image(file: UploadFile = File(...),
                      dataset: str = Form(...),
                      model_restore: str = Form(...),
                      output_dir: str = Form("./outputs/")):

    try:
        # tạo folder tạm
        temp_folder = f"./temp_{uuid.uuid4().hex}/"
        os.makedirs(temp_folder, exist_ok=True)
        file_path = os.path.join(temp_folder, file.filename)
        with open(file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        os.makedirs(output_dir, exist_ok=True)

        q = Queue()
        p = Process(target=subprocess_worker, args=(file_path, model_restore, dataset_settings_map[dataset], output_dir, q))
        p.start()
        p.join()

        result_path = q.get()

        shutil.rmtree(temp_folder)

        return {"status": "success", "output_image": result_path}

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
