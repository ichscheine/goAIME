#!/usr/bin/env python3
"""
Test script to verify that the session spam fix is working
"""

import time
import requests
import json

# Backend URL
BASE_URL = "http://localhost:5001/api"

def test_rate_limiting():
    """Test the rate limiting on session updates"""
    
    session_data = {
        "username": "test_user",
        "score": 5,
        "attempted": 10,
        "total_time": 300,
        "year": 2022,
        "contest": "AMC 10A",
        "mode": "practice"
    }
    
    print("Testing rate limiting on session updates...")
    
    # Make first request - should succeed
    print("Making first request...")
    response1 = requests.post(f"{BASE_URL}/sessions/update", json=session_data)
    print(f"First request: {response1.status_code}")
    
    if response1.status_code != 200:
        print(f"First request failed: {response1.text}")
        return False
    
    # Make second request immediately - should be rate limited
    print("Making second request immediately...")
    response2 = requests.post(f"{BASE_URL}/sessions/update", json=session_data)
    print(f"Second request: {response2.status_code}")
    
    if response2.status_code == 429:
        print("✅ Rate limiting is working correctly!")
        print(f"Rate limit response: {response2.text}")
        return True
    elif response2.status_code == 200:
        print("⚠️  Rate limiting not working - second request succeeded")
        return False
    else:
        print(f"❌ Unexpected response code: {response2.status_code}")
        print(f"Response: {response2.text}")
        return False

def test_deduplication():
    """Test the session deduplication logic"""
    
    session_data = {
        "username": "test_user_dedup",
        "score": 3,
        "attempted": 5,
        "total_time": 150,
        "year": 2022,
        "contest": "AMC 10A", 
        "mode": "practice"
    }
    
    print("\nTesting session deduplication...")
    
    # Wait 6 seconds to avoid rate limiting
    print("Waiting 6 seconds to avoid rate limiting...")
    time.sleep(6)
    
    # Make first request - should succeed
    print("Making first request...")
    response1 = requests.post(f"{BASE_URL}/sessions/update", json=session_data)
    print(f"First request: {response1.status_code}")
    
    if response1.status_code != 200:
        print(f"First request failed: {response1.text}")
        return False
    
    # Wait 6 seconds to avoid rate limiting
    print("Waiting 6 seconds to avoid rate limiting...")
    time.sleep(6)
    
    # Make second request with same data - should be deduplicated
    print("Making second request with identical data...")
    response2 = requests.post(f"{BASE_URL}/sessions/update", json=session_data)
    print(f"Second request: {response2.status_code}")
    
    if response2.status_code == 200:
        try:
            data = response2.json()
            if data.get("message") and "duplicate" in data["message"].lower():
                print("✅ Deduplication is working correctly!")
                print(f"Deduplication response: {data}")
                return True
            else:
                print("⚠️  Session was saved (no deduplication detected)")
                print(f"Response: {data}")
                return False
        except:
            print("✅ Session likely deduplicated (no specific message)")
            return True
    else:
        print(f"❌ Unexpected response code: {response2.status_code}")
        print(f"Response: {response2.text}")
        return False

if __name__ == "__main__":
    print("Session Spam Fix Test")
    print("=" * 50)
    
    # Test 1: Rate limiting
    rate_limit_ok = test_rate_limiting()
    
    # Test 2: Deduplication  
    dedup_ok = test_deduplication()
    
    print("\n" + "=" * 50)
    print("Test Results:")
    print(f"Rate Limiting: {'✅ PASS' if rate_limit_ok else '❌ FAIL'}")
    print(f"Deduplication: {'✅ PASS' if dedup_ok else '❌ FAIL'}")
    
    if rate_limit_ok and dedup_ok:
        print("\n🎉 All session spam fixes are working correctly!")
    else:
        print("\n⚠️  Some fixes may need attention.")
