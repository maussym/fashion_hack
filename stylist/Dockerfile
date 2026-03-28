FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends libgl1 libglib2.0-0 git && \
    rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY embeddings.py utils.py ./
COPY module1/ ./module1/

EXPOSE 7860

CMD ["uvicorn", "module1.main:app", "--host", "0.0.0.0", "--port", "7860"]
