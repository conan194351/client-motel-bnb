#!/usr/bin/env python3
"""
Test script for DSS API endpoints
Run after starting the FastAPI server
"""

import requests
import json
import sys

BASE_URL = "http://localhost:8000"

def test_health():
    """Test health endpoint"""
    print("\n" + "="*80)
    print("TEST 1: Health Check")
    print("="*80)
    
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    return response.status_code == 200

def test_stats():
    """Test stats endpoint"""
    print("\n" + "="*80)
    print("TEST 2: Statistics")
    print("="*80)
    
    response = requests.get(f"{BASE_URL}/stats")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    return response.status_code == 200

def test_simple_search():
    """Test simple room search"""
    print("\n" + "="*80)
    print("TEST 3: Simple Room Search")
    print("="*80)
    
    params = {
        "min_rating": 4.0,
        "limit": 5
    }
    
    response = requests.get(f"{BASE_URL}/api/v1/rooms", params=params)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Found {data['total']} rooms")
        
        if data['rooms']:
            print("\nSample Room:")
            room = data['rooms'][0]
            print(f"  ID: {room['room_id']}")
            print(f"  Name: {room['name']}")
            print(f"  Price: ${room['price']}")
            print(f"  Rating: {room.get('review_scores_rating', 'N/A')}")
    else:
        print(f"Error: {response.text}")
    
    return response.status_code == 200

def test_dss_recommendation():
    """Test DSS recommendation endpoint (Main feature!)"""
    print("\n" + "="*80)
    print("TEST 4: DSS Recommendation (TOPSIS)")
    print("="*80)
    
    payload = {
        "preferences": {
            "price_sensitivity": 0.8,
            "comfort_priority": 0.6,
            "distance_tolerance": 0.4,
            "view_importance": 0.7,
            "cleanliness_priority": 0.9
        },
        "filters": {
            "min_rating": 4.0,
            "min_accommodates": 2
        },
        "limit": 5
    }
    
    print(f"\nRequest Payload:")
    print(json.dumps(payload, indent=2))
    
    response = requests.post(
        f"{BASE_URL}/api/v1/dss/recommend",
        json=payload,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"\nStatus Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        
        print(f"\nSession ID: {data['session_id']}")
        print(f"Total Evaluated: {data['total_evaluated']}")
        print(f"Processing Time: {data['processing_time_ms']:.2f}ms")
        
        print(f"\nComputed Weights:")
        for criterion, weight in data['computed_weights'].items():
            print(f"  {criterion}: {weight:.4f}")
        
        print(f"\nTop {len(data['ranked_results'])} Recommendations:")
        for result in data['ranked_results']:
            room = result['room']
            print(f"\n  Rank {result['rank']}: {room['name']}")
            print(f"    TOPSIS Score: {result['topsis_score']:.4f}")
            print(f"    Price: ${room['price']}")
            print(f"    Rating: {room.get('review_scores_rating', 'N/A')}")
            print(f"    Explanation: {result['explanation']}")
    else:
        print(f"Error: {response.text}")
    
    return response.status_code == 200

def test_room_details():
    """Test room details endpoint"""
    print("\n" + "="*80)
    print("TEST 5: Room Details")
    print("="*80)
    
    # First get a room ID from search
    search_response = requests.get(f"{BASE_URL}/api/v1/rooms", params={"limit": 1})
    
    if search_response.status_code == 200:
        rooms = search_response.json().get('rooms', [])
        if rooms:
            room_id = rooms[0]['room_id']
            print(f"Testing with room_id: {room_id}")
            
            response = requests.get(f"{BASE_URL}/api/v1/rooms/{room_id}")
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                room = data['room']
                print(f"\nRoom: {room['name']}")
                print(f"Price: ${room['price']}")
                print(f"Type: {room['room_type']}")
                
                print(f"\nAttributes: {len(data.get('attributes', []))}")
                if data.get('normalized_values'):
                    print(f"Normalized Values: {list(data['normalized_values'].keys())}")
            else:
                print(f"Error: {response.text}")
            
            return response.status_code == 200
    
    print("Could not find a room to test with")
    return False

def test_criteria():
    """Test criteria endpoint"""
    print("\n" + "="*80)
    print("TEST 6: Evaluation Criteria")
    print("="*80)
    
    response = requests.get(f"{BASE_URL}/api/v1/criteria")
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"\nFound {len(data['criteria'])} criteria:")
        for criterion in data['criteria']:
            print(f"  - {criterion['code']}: {criterion['name']}")
            print(f"    Type: {'Benefit' if criterion['is_benefit'] else 'Cost'}")
            print(f"    Weight: {criterion['default_weight']}")
    else:
        print(f"Error: {response.text}")
    
    return response.status_code == 200

def main():
    print("\n" + "🚀"*40)
    print("BnB SmartChoice DSS API Test Suite")
    print("🚀"*40)
    
    tests = [
        ("Health Check", test_health),
        ("Statistics", test_stats),
        ("Simple Search", test_simple_search),
        ("DSS Recommendation (TOPSIS)", test_dss_recommendation),
        ("Room Details", test_room_details),
        ("Evaluation Criteria", test_criteria),
    ]
    
    results = []
    
    for name, test_func in tests:
        try:
            success = test_func()
            results.append((name, success))
        except Exception as e:
            print(f"\n❌ Test failed with exception: {e}")
            results.append((name, False))
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    for name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! API is working correctly.")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Please check the logs above.")
        return 1

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\n⚠️  Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

