# ==============================================================================
# SwarmGuard Production Container for Cloud Run
# Stage 1: Build React 19 Mission Control Dashboard
# Stage 2: Python 3.11 FastAPI Engine + Static SPA Distribution
# ==============================================================================

# Stage 1: Frontend Builder
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# Stage 2: Python Production Engine
FROM python:3.11-slim
WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8080

# Install runtime and build dependencies if needed
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy application backend, contracts, and configurations
COPY swarmguard/ ./swarmguard/
COPY contracts/ ./contracts/

# Copy compiled frontend assets from Stage 1 into frontend/dist
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose default Cloud Run port
EXPOSE 8080

# Launch Uvicorn server bound to $PORT (Cloud Run dynamically sets $PORT)
CMD ["sh", "-c", "uvicorn swarmguard.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
