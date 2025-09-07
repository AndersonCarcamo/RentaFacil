#!/usr/bin/env python3
"""
🏢 Simple Agency Test
"""

import requests
import json

BASE_URL = "http://localhost:8000/v1"

def test_simple():
    print("Testing simple agency endpoint...")
    
    # Test health check first
    try:
        response = requests.get("http://localhost:8000/health")
        print(f"Health check: {response.status_code}")
        if response.status_code == 200:
            print("✅ Server is running")
        else:
            print("❌ Server not responding correctly")
            return
    except Exception as e:
        print(f"❌ Cannot connect to server: {e}")
        return
    
    # Test agencies endpoint
    try:
        response = requests.get(f"{BASE_URL}/agencies/")
        print(f"Agencies endpoint: {response.status_code}")
        print(f"Response: {response.text[:200]}...")
    except Exception as e:
        print(f"❌ Error testing agencies: {e}")

if __name__ == "__main__":
    test_simple()
