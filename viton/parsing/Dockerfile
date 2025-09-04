FROM ubuntu:18.04

ENV DEBIAN_FRONTEND=noninteractive

# Cài Python 3.6 (không cần deadsnakes PPA)
RUN apt-get update && apt-get install -y python3.6 python3.6-venv python3.6-distutils wget curl git build-essential && curl -sS https://bootstrap.pypa.io/pip/3.6/get-pip.py | python3.6

RUN update-alternatives --install /usr/bin/python python /usr/bin/python3.6 1 && update-alternatives --install /usr/bin/pip pip /usr/local/bin/pip 1

WORKDIR /app

COPY requirements.txt .

RUN pip install --default-timeout=1000 --no-cache-dir torch==1.2.0 torchvision==0.4.0

RUN apt-get update && apt-get install -y python3.6-dev libpython3.6-dev

RUN pip install --no-cache-dir git+https://github.com/facebookresearch/maskrcnn-benchmark.git

RUN pip install --no-cache-dir -r requirements.txt || true

COPY . .

CMD ["uvicorn", "api1:app", "--host", "0.0.0.0", "--port", "8000"]
