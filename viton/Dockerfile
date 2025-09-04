FROM python:3.10-slim

WORKDIR /app

# Copy requirements
COPY requirements.txt .

# Cài torch CUDA 11.8 và các lib
RUN pip install --no-cache-dir torch==2.5.1 torchvision==0.20.1 torchaudio==2.5.1 --extra-index-url https://download.pytorch.org/whl/cu118 \
    && pip install --no-cache-dir -r requirements.txt || true

# Copy code
COPY . .

# Run uvicorn
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]
