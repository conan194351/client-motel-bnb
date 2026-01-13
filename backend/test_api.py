#!/usr/bin/env python3
"""
Quick API test script
Run after starting the API server to verify everything works
"""

import requests
import json
import time

BASE_URL = "http://localhost:8000"


def test_health():
    """Test health endpoint"""
    print("🏥 Testing health endpoint...")
    response = requests.get(f"{BASE_URL}/health")
    
    assert response.status_code == 200, f"Health check failed: {response.status_code}"
    
    data = response.json()
    print(f"✅ Health check passed!")
    print(f"   Status: {data['status']}")
    print(f"   Database: {data['database']}")
    print(f"   Rooms: {data['rooms_count']}")
    print(f"   Criteria: {data['criteria_count']}")
    
    assert data['status'] == 'healthy'
    assert data['database'] == 'connected'
    assert data['rooms_count'] > 0


def test_stats():
    """Test statistics endpoint"""
    print("\n📊 Testing stats endpoint...")
    response = requests.get(f"{BASE_URL}/stats")
    
    assert response.status_code == 200, f"Stats failed: {response.status_code}"
    
    data = response.json()
    print(f"✅ Stats retrieved!")
    print(f"   Total Rooms: {data['total_rooms']}")
    print(f"   Available: {data['available_rooms']}")
    print(f"   Price Range: ${data['price_range']['min']:.2f} - ${data['price_range']['max']:.2f}")
    if data['average_rating']:
        print(f"   Avg Rating: {data['average_rating']:.2f}")
    
    assert data['total_rooms'] > 0
    assert data['available_rooms'] >= 0
    assert 'price_range' in data


def test_criteria():
    """Test criteria endpoint"""
    print("\n🎯 Testing criteria endpoint...")
    response = requests.get(f"{BASE_URL}/api/v1/criteria")
    
    assert response.status_code == 200, f"Criteria failed: {response.status_code}"
    
    data = response.json()
    print(f"✅ Criteria retrieved!")
    print(f"   Count: {len(data['criteria'])}")
    for c in data['criteria'][:3]:
        print(f"   - {c['name']} ({c['code']})")
    
    assert 'criteria' in data
    assert len(data['criteria']) > 0


def test_influence_diagram():
    """Test influence diagram endpoint"""
    print("\n🌳 Testing influence diagram endpoint...")
    response = requests.get(f"{BASE_URL}/api/v1/influence-diagram")
    
    assert response.status_code == 200, f"Influence diagram failed: {response.status_code}"
    
    data = response.json()
    print(f"✅ Influence diagram retrieved!")
    print(f"   Edges: {len(data['influence_tree'])}")
    
    assert 'influence_tree' in data
    assert len(data['influence_tree']) > 0


def test_recommendations():
    """Test recommendation endpoint"""
    print("\n🎯 Testing recommendation endpoint...")
    
    payload = {
        "preferences": {
            "convenience_importance": 0.7,
            "comfort_importance": 0.9,
            "value_importance": 0.8
        },
        "filters": {
            "max_price": 150,
            "min_rating": 4.0
        },
        "limit": 5
    }
    
    print("   Request:")
    print(f"   - Convenience: {payload['preferences']['convenience_importance']}")
    print(f"   - Comfort: {payload['preferences']['comfort_importance']}")
    print(f"   - Value: {payload['preferences']['value_importance']}")
    print(f"   - Max Price: ${payload['filters']['max_price']}")
    print(f"   - Min Rating: {payload['filters']['min_rating']}")
    
    start_time = time.time()
    response = requests.post(f"{BASE_URL}/api/v1/dss/recommend", json=payload)
    elapsed = (time.time() - start_time) * 1000
    
    assert response.status_code == 200, f"Recommendations failed: {response.status_code} - {response.text}"
    
    data = response.json()
    print(f"\n✅ Recommendations received!")
    print(f"   Session ID: {data['session_id']}")
    print(f"   Evaluated: {data['total_evaluated']} rooms")
    print(f"   Processing Time: {elapsed:.1f}ms (Server: {data['processing_time_ms']:.1f}ms)")
    
    # Assertions
    assert 'session_id' in data
    assert 'computed_weights' in data
    assert 'ranked_results' in data
    assert data['total_evaluated'] >= 0
    
    print(f"\n   📊 Computed Weights:")
    for code, weight in sorted(data['computed_weights'].items(), key=lambda x: x[1], reverse=True):
        print(f"      {code}: {weight:.4f} ({weight*100:.1f}%)")
    
    print(f"\n   🏆 Top Recommendations:")
    for result in data['ranked_results'][:5]:
        room = result['room']
        print(f"\n      #{result['rank']}: {room['name'][:50]}")
        print(f"         Price: ${room['price']:.2f} | Rating: {room['review_scores_rating']:.2f}" if room['review_scores_rating'] else f"         Price: ${room['price']:.2f}")
        print(f"         TOPSIS Score: {result['topsis_score']:.4f}")
        print(f"         {result['explanation']}")
        
        # Validate result structure
        assert 'rank' in result
        assert 'room' in result
        assert 'topsis_score' in result
        assert 0 <= result['topsis_score'] <= 1


def main():
    """Main function for running tests manually (not via pytest)"""
    print("=" * 60)
    print("🧪 BnB SmartChoice DSS - API Test Suite")
    print("=" * 60)
    print()
    
    # Check if API is running
    try:
        requests.get(BASE_URL, timeout=2)
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to API!")
        print(f"   Make sure the API is running at {BASE_URL}")
        print("   Run: make dev")
        return
    
    # Run tests
    tests = [
        ("Health Check", test_health),
        ("Statistics", test_stats),
        ("Criteria", test_criteria),
        ("Influence Diagram", test_influence_diagram),
        ("Recommendations", test_recommendations)
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            test_func()
            results.append((test_name, True))
        except AssertionError as e:
            print(f"   ❌ Assertion failed: {e}")
            results.append((test_name, False))
        except Exception as e:
            print(f"   ❌ Error: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 60)
    print("📋 Test Summary")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print(f"\nTotal: {passed}/{total} passed")
    
    if passed == total:
        print("\n🎉 All tests passed!")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")


if __name__ == '__main__':
    main()

