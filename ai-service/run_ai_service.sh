#!/usr/bin/env bash
# Start the AI service
uvicorn main:app --host 0.0.0.0 --port 8001
