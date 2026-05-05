#!/usr/bin/env python3
"""
API Endpoint Tests using HTTP
Tests key functionality without needing Django setup:
1. Organization opportunity posting with minimal payload
2. Registration and authentication
3. Supervisor list endpoint
4. Activity history endpoint
"""

import requests
import json
from datetime import datetime

BASE_URL = 'http://localhost:8000/api'

# Track authentication tokens
auth_tokens = {}

def log_test(test_name, status, message=""):
    """Log test result"""
    status_icon = "✓ PASS" if status else "✗ FAIL"
    print(f"{status_icon}: {test_name}")
    if message:
        print(f"         {message}")
    return status

def test_1_health_check():
    """Test if API server is responding"""
    print("\n" + "="*60)
    print("TEST 1: API Health Check")
    print("="*60)
    
    try:
        response = requests.get(f'{BASE_URL}/organizations/opportunities/', timeout=5)
        print(f"Status Code: {response.status_code}")
        return log_test("Server Responding", response.status_code in [200, 401, 403])
    except Exception as e:
        return log_test("Server Responding", False, str(e))

def test_2_register_users():
    """Register test users for later tests"""
    print("\n" + "="*60)
    print("TEST 2: User Registration")
    print("="*60)
    
    users_to_create = [
        {'email': f'student_{datetime.now().timestamp()}@test.com', 'role': 'student'},
        {'email': f'org_{datetime.now().timestamp()}@test.com', 'role': 'organization'},
        {'email': f'coordinator_{datetime.now().timestamp()}@test.com', 'role': 'coordinator'},
        {'email': f'supervisor_{datetime.now().timestamp()}@test.com', 'role': 'supervisor'},
    ]
    
    results = []
    for user_data in users_to_create:
        try:
            payload = {
                'email': user_data['email'],
                'password': 'TestPass123!',
                'role': user_data['role']
            }
            
            response = requests.post(
                f'{BASE_URL}/auth/register/',
                json=payload,
                timeout=5
            )
            
            if response.status_code in [200, 201]:
                auth_tokens[user_data['role']] = {
                    'email': user_data['email'],
                    'password': 'TestPass123!'
                }
                print(f"  ✓ Registered {user_data['role']}: {user_data['email']}")
                results.append(True)
            else:
                print(f"  ✗ Failed to register {user_data['role']}: {response.status_code}")
                if response.text:
                    print(f"    Response: {response.text[:100]}")
                results.append(False)
        except Exception as e:
            print(f"  ✗ Error registering {user_data['role']}: {e}")
            results.append(False)
    
    return log_test("User Registration", all(results), f"{sum(results)}/{len(results)} registrations successful")

def test_3_login():
    """Login and get authentication tokens"""
    print("\n" + "="*60)
    print("TEST 3: User Login & Token Generation")
    print("="*60)
    
    results = []
    for role, creds in auth_tokens.items():
        try:
            payload = {
                'email': creds['email'],
                'password': creds['password']
            }
            
            response = requests.post(
                f'{BASE_URL}/auth/login/',
                json=payload,
                timeout=5
            )
            
            if response.status_code in [200, 201]:
                data = response.json()
                auth_tokens[role]['token'] = data.get('access')
                print(f"  ✓ Logged in {role}")
                results.append(True)
            else:
                print(f"  ✗ Failed to login {role}: {response.status_code}")
                results.append(False)
        except Exception as e:
            print(f"  ✗ Error logging in {role}: {e}")
            results.append(False)
    
    return log_test("Login & Token Generation", all(results))

def test_4_organization_posting():
    """Test organization opportunity posting with minimal payload"""
    print("\n" + "="*60)
    print("TEST 4: Organization Opportunity Posting (Minimal Payload)")
    print("="*60)
    
    if 'organization' not in auth_tokens or 'token' not in auth_tokens['organization']:
        return log_test("Organization Posting", False, "Organization user not logged in")
    
    try:
        token = auth_tokens['organization']['token']
        headers = {'Authorization': f'Bearer {token}'}
        
        # Minimal payload (only required fields from frontend)
        payload = {
            'title': 'Junior Developer Position',
            'description': 'Help build amazing web applications'
        }
        
        response = requests.post(
            f'{BASE_URL}/organizations/opportunities/',
            json=payload,
            headers=headers,
            timeout=5
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 201:
            data = response.json()
            print(f"  ✓ Opportunity created:")
            print(f"    - Title: {data.get('title')}")
            print(f"    - Sector (default): {data.get('sector', 'N/A')}")
            print(f"    - State (default): {data.get('location_state', 'N/A')}")
            print(f"    - Duration (default): {data.get('duration_weeks', 'N/A')} weeks")
            print(f"    - Slots: {data.get('slots_available', 'N/A')}")
            return log_test("Organization Posting", True, "Minimal payload accepted with defaults")
        else:
            print(f"Response: {response.text[:200]}")
            return log_test("Organization Posting", False, f"HTTP {response.status_code}")
    except Exception as e:
        return log_test("Organization Posting", False, str(e))

def test_5_supervisor_list():
    """Test supervisor list endpoint (coordinator-only)"""
    print("\n" + "="*60)
    print("TEST 5: Supervisor List Endpoint (Coordinator-Only)")
    print("="*60)
    
    if 'coordinator' not in auth_tokens or 'token' not in auth_tokens['coordinator']:
        return log_test("Supervisor List", False, "Coordinator user not logged in")
    
    try:
        token = auth_tokens['coordinator']['token']
        headers = {'Authorization': f'Bearer {token}'}
        
        response = requests.get(
            f'{BASE_URL}/auth/supervisors/',
            headers=headers,
            timeout=5
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                print(f"  ✓ Retrieved {len(data)} supervisor(s)")
                for supervisor in data[:3]:
                    print(f"    - {supervisor.get('email')} (ID: {supervisor.get('id')})")
                return log_test("Supervisor List", True)
            else:
                return log_test("Supervisor List", False, "Response not a list")
        else:
            return log_test("Supervisor List", False, f"HTTP {response.status_code}: {response.text[:100]}")
    except Exception as e:
        return log_test("Supervisor List", False, str(e))

def test_6_activity_history():
    """Test activity history endpoint"""
    print("\n" + "="*60)
    print("TEST 6: Activity History Endpoint")
    print("="*60)
    
    if 'student' not in auth_tokens or 'token' not in auth_tokens['student']:
        return log_test("Activity History", False, "Student user not logged in")
    
    try:
        token = auth_tokens['student']['token']
        headers = {'Authorization': f'Bearer {token}'}
        
        response = requests.get(
            f'{BASE_URL}/placements/activity/',
            headers=headers,
            timeout=5
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                print(f"  ✓ Retrieved {len(data)} activity record(s)")
                for activity in data[:3]:
                    print(f"    - {activity.get('title', 'N/A')}")
                return log_test("Activity History", True)
            else:
                return log_test("Activity History", False, "Response not a list")
        else:
            return log_test("Activity History", False, f"HTTP {response.status_code}")
    except Exception as e:
        return log_test("Activity History", False, str(e))

def test_7_role_case_insensitivity():
    """Test that permissions work regardless of role casing"""
    print("\n" + "="*60)
    print("TEST 7: Role Case-Insensitivity")
    print("="*60)
    
    try:
        # Register with mixed-case role
        payload = {
            'email': f'mixedcase_{datetime.now().timestamp()}@test.com',
            'password': 'TestPass123!',
            'role': 'Organization'  # Mixed case
        }
        
        response = requests.post(
            f'{BASE_URL}/auth/register/',
            json=payload,
            timeout=5
        )
        
        if response.status_code not in [200, 201]:
            return log_test("Role Case Registration", False, f"Registration failed: {response.status_code}")
        
        # Try to login
        login_payload = {
            'email': payload['email'],
            'password': payload['password']
        }
        
        response = requests.post(
            f'{BASE_URL}/auth/login/',
            json=login_payload,
            timeout=5
        )
        
        if response.status_code not in [200, 201]:
            return log_test("Role Case Login", False, f"Login failed: {response.status_code}")
        
        token = response.json().get('access')
        headers = {'Authorization': f'Bearer {token}'}
        
        # Try to make a request that requires organization permission
        opp_payload = {
            'title': 'Case Test Position',
            'description': 'Testing mixed-case role'
        }
        
        response = requests.post(
            f'{BASE_URL}/organizations/opportunities/',
            json=opp_payload,
            headers=headers,
            timeout=5
        )
        
        if response.status_code == 201:
            return log_test("Role Case-Insensitivity", True, "Mixed-case role accepted")
        elif response.status_code == 403:
            return log_test("Role Case-Insensitivity", False, "Permission denied (role not normalized)")
        else:
            return log_test("Role Case-Insensitivity", False, f"Unexpected status: {response.status_code}")
    except Exception as e:
        return log_test("Role Case-Insensitivity", False, str(e))

def main():
    """Run all tests"""
    print("\n")
    print("#" * 60)
    print("# API FUNCTIONALITY TEST SUITE")
    print("#" * 60)
    print(f"Base URL: {BASE_URL}\n")
    
    results = []
    
    # Run tests in sequence
    results.append(("Health Check", test_1_health_check()))
    
    if not results[-1][1]:  # If health check failed, stop
        print("\n⚠️  Server not responding. Stopping tests.")
        return
    
    results.append(("User Registration", test_2_register_users()))
    results.append(("User Login", test_3_login()))
    results.append(("Organization Posting (Minimal)", test_4_organization_posting()))
    results.append(("Supervisor List (Coordinator)", test_5_supervisor_list()))
    results.append(("Activity History Feed", test_6_activity_history()))
    results.append(("Role Case-Insensitivity", test_7_role_case_insensitivity()))
    
    # Print summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! System is working correctly.")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Review above for details.")

if __name__ == '__main__':
    main()
