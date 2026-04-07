FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/ ./backend/
COPY data/policy.txt ./data/policy.txt

RUN pip install --no-cache-dir -r backend/requirements.txt

RUN mkdir -p data/images

EXPOSE 8000

CMD ["sh", "-c", "cd backend && uvicorn app:app --host 0.0.0.0 --port ${PORT:-8000}"]
