FROM python:3.12-slim

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements first for layer caching
COPY requirements.txt .

# Install Python deps (no crawl4ai in prod — only needed for ingestion)
RUN pip install --no-cache-dir \
    fastapi \
    "uvicorn[standard]" \
    qdrant-client \
    fastembed \
    rank-bm25 \
    python-dotenv \
    groq \
    httpx

# Copy application code
COPY . .

# Pre-download FastEmbed model so it's baked into image
RUN python -c "from fastembed import TextEmbedding; TextEmbedding(model_name='BAAI/bge-small-en-v1.5')"

EXPOSE 8000

CMD ["uvicorn", "api.chat:app", "--host", "0.0.0.0", "--port", "8000"]
