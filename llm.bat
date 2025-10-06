@echo off
cd /d C:\xampp\htdocs\hoanghuy\project\llm-rag\haystack-service

start cmd /k "rag-env\Scripts\activate && python app.py"

cd /d C:\xampp\htdocs\hoanghuy\project\viton

start cmd /k "viton-env\Scripts\activate && cd /d C:\xampp\htdocs\hoanghuy\project\llm-rag\langchain-service && python main.py"

start cmd /k "viton-env\Scripts\activate && cd /d C:\xampp\htdocs\hoanghuy\project\nlm-search && uvicorn main:app --host 0.0.0.0 --port 8000"