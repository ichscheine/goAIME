#!/bin/bash

# Test script to verify the user progress API endpoint
# This will attempt to fetch progress data for a test user

# Define variables
USERNAME="test_user"
BACKEND_URL="http://localhost:5001"

# Test health endpoint first
echo "Testing health endpoint..."
curl -i "$BACKEND_URL/health"

# Test the user progress endpoint
echo -e "\nTesting user progress endpoint for user: $USERNAME"
curl -i "$BACKEND_URL/api/user/progress/$USERNAME"

echo -e "\nAPI test complete."
