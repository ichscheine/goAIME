#!/bin/bash

# This script tests the real cohort metrics API endpoint

echo "Testing cohort metrics API endpoint..."
echo "Fetching metrics for test user 'testuser'..."

# Make API request to the cohort metrics endpoint
curl -s http://localhost:5000/api/cohort/metrics/testuser | jq .

echo ""
echo "Testing complete."
