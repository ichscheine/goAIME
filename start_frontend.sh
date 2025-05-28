#!/bin/bash

# Start script for goAIME frontend with correct proxy settings
# This script ensures the frontend is properly connected to the backend

# Set the current directory to the project root
cd "$(dirname "$0")"

# Define the backend port
BACKEND_PORT=5001

echo "Setting up proxy to backend on port $BACKEND_PORT..."

# Verify the proxy setting in package.json
if grep -q "\"proxy\": \"http://localhost:$BACKEND_PORT\"" frontend/package.json; then
    echo "Proxy configuration is correct in package.json"
else
    echo "Adding/updating proxy configuration in package.json..."
    # Create a temporary file
    TMP_FILE=$(mktemp)
    # Use jq to update the JSON properly if available
    if command -v jq >/dev/null 2>&1; then
        jq --arg port "$BACKEND_PORT" '.proxy = "http://localhost:" + $port' frontend/package.json > "$TMP_FILE"
        mv "$TMP_FILE" frontend/package.json
    else
        # Fallback to sed for basic replacement
        sed -i '' "s/\"private\": true,/\"private\": true,\n  \"proxy\": \"http:\/\/localhost:$BACKEND_PORT\",/" frontend/package.json
    fi
    echo "Proxy configuration updated"
fi

# Make sure the backend is running
echo "Checking if backend is running on port $BACKEND_PORT..."
if curl -s http://localhost:$BACKEND_PORT/health >/dev/null 2>&1; then
    echo "Backend is running on port $BACKEND_PORT"
else
    echo "WARNING: Backend does not appear to be running on port $BACKEND_PORT"
    echo "Please start the backend first with: ./start_backend.sh"
    echo "Continue anyway? (y/n)"
    read -r response
    if [[ "$response" != "y" ]]; then
        echo "Exiting..."
        exit 1
    fi
fi

# Clear any node modules cache issues
echo "Clearing React cache..."
cd frontend
npm cache clean --force
rm -rf node_modules/.cache

# Start the frontend
echo "Starting frontend with proxy to http://localhost:$BACKEND_PORT..."
PORT=3001 npm start
