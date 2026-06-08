#!/usr/bin/env bash
set -e

PROJECT_PATH="/home/induser1/giri/AIProjects/asm_engagement_cockpit"
BACKEND_PORT="8020"

echo "============================================"
echo "ASM Engagement Cockpit - Start Backend"
echo "============================================"

cd "$PROJECT_PATH"

echo ""
echo "Starting PostgreSQL Docker container if needed..."
docker compose up -d

echo ""
echo "Checking backend files..."
test -f "$PROJECT_PATH/backend/app/main.py"
test -f "$PROJECT_PATH/backend/app/__init__.py"

echo ""
echo "Testing Python import for app.main..."
cd "$PROJECT_PATH/backend"
uv run python -c "import app.main; print('app.main import OK')"

echo ""
echo "Starting backend on port $BACKEND_PORT..."
echo "Health URL: http://localhost:$BACKEND_PORT/api/health"
uv run uvicorn app.main:app --host 0.0.0.0 --port "$BACKEND_PORT"