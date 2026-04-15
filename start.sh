#!/bin/bash
# Stake App Launcher - Run this before opening the app in your browser
cd "$(dirname "$0")"

echo "========================================"
echo "  STAKE STEWARD APP LAUNCHER"
echo "========================================"
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "[ERROR] .env.local file not found!"
    echo "Please create it first using the template or instructions."
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "[INFO] node_modules not found. Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "[ERROR] npm install failed."
        exit 1
    fi
else
    echo "[INFO] Dependencies found."
fi

echo ""
echo "========================================"
echo "  STARTING APPLICATION..."
echo "========================================"
echo ""
echo "Open your browser to: http://localhost:3000"
echo ""
echo "(Press Ctrl+C to stop the server)"
echo ""

npm run dev
