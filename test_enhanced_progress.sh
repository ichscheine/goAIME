#!/bin/bash

# Test script for enhanced progress dashboard functionality
# This script tests the new trend data and cohort comparison features

echo "🚀 Testing Enhanced Progress Dashboard API"
echo "========================================="

# Test 1: Check API health
echo -e "\n📋 Test 1: API Health Check"
curl -s http://localhost:5001/api/health | jq '.'

# Test 2: Test user progress endpoint with empty user
echo -e "\n📋 Test 2: Progress Data for Non-existent User"
curl -s "http://localhost:5001/api/user/progress/nonexistent_user" | jq '.'

# Test 3: Test user progress endpoint with potential real user
echo -e "\n📋 Test 3: Progress Data for Test User 'goamy'"
curl -s "http://localhost:5001/api/user/progress/goamy" | jq '.'

# Test 4: Validate response structure
echo -e "\n📋 Test 4: Validating Response Structure"
response=$(curl -s "http://localhost:5001/api/user/progress/testuser")
echo "Response contains trendData: $(echo $response | jq '.data.trendData != null')"
echo "Response contains cohortComparison: $(echo $response | jq '.data.cohortComparison != null')"
echo "TrendData has required fields: $(echo $response | jq '.data.trendData | has("accuracy") and has("score") and has("dates")')"
echo "CohortComparison has required fields: $(echo $response | jq '.data.cohortComparison | has("userPercentile") and has("averageAccuracy") and has("topPerformerAccuracy") and has("userAccuracy")')"

echo -e "\n✅ Enhanced Progress Dashboard API Tests Complete!"
echo "Frontend is running at: http://localhost:3000"
echo "Backend is running at: http://localhost:5001"
echo -e "\nTo test the frontend:"
echo "1. Open http://localhost:3000 in your browser"
echo "2. Navigate to the Progress Tracking page"
echo "3. Verify the new Performance Trend and Cohort Comparison sections"
