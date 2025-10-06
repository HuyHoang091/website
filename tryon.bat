@echo off
cd /d C:\xampp\htdocs\hoanghuy\project\viton

start cmd /k "viton-env\Scripts\activate && uvicorn api:app --reload --host 0.0.0.0 --port 8001"

start cmd /k "viton-env\Scripts\activate && uvicorn router:app --reload --host 0.0.0.0 --port 8002"

cd /d C:\xampp\htdocs\hoanghuy\project\viton\gpu\openpose

start cmd /k ""C:\Users\HUY HOANG\AppData\Local\Programs\Python\Python37\python.exe" -m uvicorn python.api:app --reload --host 0.0.0.0 --port 8003"
