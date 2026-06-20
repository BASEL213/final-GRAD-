FROM python:3.11-slim

WORKDIR /app

# System deps: tesseract + Arabic language pack for OCR, poppler for PDF→image
RUN apt-get update && apt-get install -y --no-install-recommends \
        tesseract-ocr \
        tesseract-ocr-ara \
        tesseract-ocr-eng \
        poppler-utils \
        libgl1-mesa-glx \
        libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY Backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY Backend/ ./Backend/
COPY data/     ./data/

ENV PYTHONUNBUFFERED=1

WORKDIR /app/Backend

EXPOSE 5000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000"]
