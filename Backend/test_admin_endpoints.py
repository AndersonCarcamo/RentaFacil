#!/usr/bin/env python3
"""
Test script for Admin endpoints
EasyRent API - Administrative functions testing

This script tests:
- Admin dashboard and metrics
- User management (suspend/unsuspend)
- Listing management and flagging
- System health monitoring
- Audit log functionality
"""

import requests
import json
from datetime import datetime, timedelta
from uuid import uuid4
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "http://localhost:8000"
API_VERSION = "v1"

# Colors for output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    BOLD = '\033[1m'
    END = '\033[0m'

def print_success(message: str):
    print(f"{Colors.GREEN}✅ {message}{Colors.END}")

def print_error(message: str):
    print(f"{Colors.RED}❌ {message}{Colors.END}")

def print_info(message: str):
    print(f"{Colors.BLUE}ℹ️  {message}{Colors.END}")

def print_section(title: str):
    print(f"\n{Colors.BOLD}{Colors.CYAN}{'='*60}")
    print(f"🔧 {title}")
    print(f"{'='*60}{Colors.END}")

def print_warning(message: str):
    print(f"{Colors.YELLOW}⚠️  {message}{Colors.END}")

class AdminAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.admin_token = None
        self.regular_token = None
        self.admin_user_id = None
        self.regular_user_id = None
        self.test_listing_id = None
        
    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, 
                    params: Optional[Dict] = None, use_admin: bool = True) -> requests.Response:
        """Make HTTP request with authentication"""
        url = f"{self.base_url}/{API_VERSION}{endpoint}"
        headers = {"Content-Type": "application/json"}
        
        # Add authentication
        token = self.admin_token if use_admin else self.regular_token
        if token:
            headers["Authorization"] = f"Bearer {token}"
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=headers, params=params)
            elif method.upper() == "POST":
                response = requests.post(url, headers=headers, json=data, params=params)
            elif method.upper() == "PUT":
                response = requests.put(url, headers=headers, json=data, params=params)
            elif method.upper() == "DELETE":
                response = requests.delete(url, headers=headers, params=params)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except requests.exceptions.RequestException as e:
            print_error(f"Request failed: {str(e)}")
            return None
    
    def setup_test_environment(self):
        """Setup test users and data"""
        print_section("SETTING UP TEST ENVIRONMENT")
        
        # Login/create admin user
        if not self.login_admin():
            print_error("Cannot proceed without admin authentication")
            return False
        
        # Login/create regular user for testing
        if not self.login_regular_user():
            print_warning("Some tests will be limited without regular user")
        
        # Create test listing for listing management tests
        self.create_test_listing()
        
        return True
    
    def login_admin(self):
        """Login as admin user"""
        print_info("Setting up admin user...")
        
        # Try to login first
        login_data = {
            "email": "admin@easyrent.test",
            "password": "AdminPass123!@#"
        }
        
        response = self.make_request("POST", "/auth/login", login_data, use_admin=False)
        
        if response and response.status_code == 200:
            data = response.json()
            self.admin_token = data.get("access_token")
            self.admin_user_id = data.get("user", {}).get("id")
            print_success("Admin user login successful")
            return True
        
        # If login fails, try to register
        print_info("Admin user not found, attempting to register...")
        register_data = {
            "email": "admin@easyrent.test",
            "password": "AdminPass123!@#",
            "full_name": "Admin User",
            "phone_number": "+1234567890",
            "role": "admin"
        }
        
        response = self.make_request("POST", "/auth/register", register_data, use_admin=False)
        if response and response.status_code == 201:
            print_success("Admin user registration successful")
            # Now login
            response = self.make_request("POST", "/auth/login", login_data, use_admin=False)
            if response and response.status_code == 200:
                data = response.json()
                self.admin_token = data.get("access_token")
                self.admin_user_id = data.get("user", {}).get("id")
                print_success("Admin user login after registration successful")
                return True
        
        print_error("Failed to setup admin user")
        return False
    
    def login_regular_user(self):
        """Login as regular user for testing purposes"""
        print_info("Setting up regular test user...")
        
        login_data = {
            "email": "testuser@easyrent.test",
            "password": "TestPass123!@#"
        }
        
        response = self.make_request("POST", "/auth/login", login_data, use_admin=False)
        
        if response and response.status_code == 200:
            data = response.json()
            self.regular_token = data.get("access_token")
            self.regular_user_id = data.get("user", {}).get("id")
            print_success("Regular user login successful")
            return True
        
        # If login fails, try to register
        print_info("Regular user not found, attempting to register...")
        register_data = {
            "email": "testuser@easyrent.test",
            "password": "TestPass123!@#",
            "full_name": "Test User",
            "phone_number": "+1234567891"
        }
        
        response = self.make_request("POST", "/auth/register", register_data, use_admin=False)
        if response and response.status_code == 201:
            print_success("Regular user registration successful")
            # Now login
            response = self.make_request("POST", "/auth/login", login_data, use_admin=False)
            if response and response.status_code == 200:
                data = response.json()
                self.regular_token = data.get("access_token")
                self.regular_user_id = data.get("user", {}).get("id")
                print_success("Regular user login after registration successful")
                return True
        
        print_warning("Could not setup regular user")
        return False
    
    def create_test_listing(self):
        """Create a test listing for management tests"""
        if not self.regular_token:
            print_warning("Skipping test listing creation - no regular user")
            return
        
        print_info("Creating test listing...")
        listing_data = {
            "title": "Test Property for Admin Testing",
            "description": "This is a test property created for admin functionality testing",
            "property_type": "apartment",
            "listing_type": "rent",
            "price": 1500.0,
            "currency": "USD",
            "location": "Test City, Test State",
            "bedrooms": 2,
            "bathrooms": 1,
            "area_sqm": 75.0
        }
        
        response = self.make_request("POST", "/listings/", listing_data, use_admin=False)
        if response and response.status_code == 201:
            data = response.json()
            self.test_listing_id = data.get("id")
            print_success(f"Test listing created: {self.test_listing_id}")
        else:
            print_warning("Could not create test listing")
    
    # Admin Dashboard Tests
    def test_admin_dashboard(self):
        """Test admin dashboard functionality"""
        print_section("ADMIN DASHBOARD TESTS")
        
        print_info("Testing admin dashboard...")
        response = self.make_request("GET", "/admin/dashboard")
        
        if response and response.status_code == 200:
            data = response.json()
            stats = data.get("stats", {})
            
            print_success("Admin dashboard retrieved successfully")
            print_info(f"Total users: {stats.get('total_users', 0)}")
            print_info(f"Active users: {stats.get('active_users', 0)}")
            print_info(f"Total listings: {stats.get('total_listings', 0)}")
            print_info(f"Active listings: {stats.get('active_listings', 0)}")
            print_info(f"System status: {data.get('system_health', {}).get('overall_status', 'unknown')}")
        else:
            print_error("Failed to retrieve admin dashboard")
            if response:
                print_error(f"Status: {response.status_code}, Response: {response.text}")
    
    # User Management Tests
    def test_user_management(self):
        """Test user management functionality"""
        print_section("USER MANAGEMENT TESTS")
        
        # Test 1: Get all users
        print_info("Testing user list retrieval...")
        response = self.make_request("GET", "/admin/users")
        
        if response and response.status_code == 200:
            data = response.json()
            print_success(f"Retrieved {data.get('total', 0)} users")
            
            # Store a user ID for suspension tests
            users = data.get('items', [])
            test_user_id = None
            for user in users:
                if user.get('email') == 'testuser@easyrent.test':
                    test_user_id = user.get('id')
                    break
            
            if test_user_id:
                self.test_user_suspension(test_user_id)
        else:
            print_error("Failed to retrieve user list")
        
        # Test 2: User search
        print_info("Testing user search...")
        params = {"search": "test"}
        response = self.make_request("GET", "/admin/users", params=params)
        
        if response and response.status_code == 200:
            data = response.json()
            print_success(f"Search returned {data.get('total', 0)} users")
        else:
            print_error("Failed to search users")
    
    def test_user_suspension(self, user_id: str):
        """Test user suspension functionality"""
        print_info(f"Testing user suspension for user: {user_id}")
        
        # Test suspend user
        suspension_data = {
            "reason": "Testing admin suspension functionality - this is a test suspension",
            "duration": 7,
            "notes": "This is a test suspension created by the admin API test suite"
        }
        
        response = self.make_request("POST", f"/admin/users/{user_id}/suspend", suspension_data)
        
        if response and response.status_code == 200:
            print_success("User suspended successfully")
            
            # Test unsuspend user
            print_info("Testing user unsuspension...")
            response = self.make_request("POST", f"/admin/users/{user_id}/unsuspend")
            
            if response and response.status_code == 200:
                print_success("User unsuspended successfully")
            else:
                print_error("Failed to unsuspend user")
        else:
            print_error("Failed to suspend user")
            if response:
                print_error(f"Status: {response.status_code}, Response: {response.text}")
    
    # Listing Management Tests
    def test_listing_management(self):
        """Test listing management functionality"""
        print_section("LISTING MANAGEMENT TESTS")
        
        # Test 1: Get all listings
        print_info("Testing listing list retrieval...")
        response = self.make_request("GET", "/admin/listings")
        
        if response and response.status_code == 200:
            data = response.json()
            print_success(f"Retrieved {data.get('total', 0)} listings")
        else:
            print_error("Failed to retrieve listing list")
        
        # Test 2: Flag listing
        if self.test_listing_id:
            print_info(f"Testing listing flagging for: {self.test_listing_id}")
            
            flag_data = {
                "reason": "spam",
                "notes": "This is a test flag created by the admin API test suite"
            }
            
            response = self.make_request("POST", f"/admin/listings/{self.test_listing_id}/flag", flag_data)
            
            if response and response.status_code == 200:
                print_success("Listing flagged successfully")
            else:
                print_error("Failed to flag listing")
                if response:
                    print_error(f"Status: {response.status_code}, Response: {response.text}")
        else:
            print_warning("Skipping listing flag test - no test listing available")
    
    # System Health Tests
    def test_system_health(self):
        """Test system health monitoring"""
        print_section("SYSTEM HEALTH TESTS")
        
        # Test 1: System health
        print_info("Testing system health retrieval...")
        response = self.make_request("GET", "/admin/system/health")
        
        if response and response.status_code == 200:
            data = response.json()
            overall_status = data.get("overall_status", "unknown")
            components = data.get("components", [])
            
            print_success(f"System health retrieved - Overall status: {overall_status}")
            print_info(f"Components monitored: {len(components)}")
            
            for component in components[:3]:  # Show first 3 components
                comp_name = component.get("component_name", "unknown")
                comp_status = component.get("status", "unknown")
                print_info(f"  - {comp_name}: {comp_status}")
        else:
            print_error("Failed to retrieve system health")
        
        # Test 2: System metrics
        print_info("Testing system metrics retrieval...")
        response = self.make_request("GET", "/admin/system/metrics")
        
        if response and response.status_code == 200:
            data = response.json()
            metrics = data.get("metrics", [])
            summary = data.get("summary", {})
            
            print_success(f"System metrics retrieved - {len(metrics)} metrics")
            print_info(f"Total metrics: {summary.get('total_metrics', 0)}")
        else:
            print_error("Failed to retrieve system metrics")
    
    # Audit Log Tests
    def test_audit_log(self):
        """Test audit log functionality"""
        print_section("AUDIT LOG TESTS")
        
        # Test 1: Get audit logs
        print_info("Testing audit log retrieval...")
        response = self.make_request("GET", "/admin/audit-log")
        
        if response and response.status_code == 200:
            data = response.json()
            print_success(f"Retrieved {data.get('total', 0)} audit log entries")
            
            # Show recent activities
            items = data.get('items', [])
            if items:
                print_info("Recent activities:")
                for item in items[:3]:  # Show first 3 entries
                    action = item.get('action_type', 'unknown')
                    description = item.get('action_description', '')
                    user_email = item.get('user_email', 'unknown')
                    print_info(f"  - {action}: {description} (by {user_email})")
        else:
            print_error("Failed to retrieve audit log")
        
        # Test 2: Filtered audit log
        print_info("Testing audit log with filters...")
        params = {
            "action": ["user_login", "user_register"],
            "page": 1,
            "size": 10
        }
        response = self.make_request("GET", "/admin/audit-log", params=params)
        
        if response and response.status_code == 200:
            data = response.json()
            print_success(f"Filtered audit log returned {data.get('total', 0)} entries")
        else:
            print_error("Failed to retrieve filtered audit log")
    
    # Security Tests
    def test_admin_security(self):
        """Test admin endpoint security"""
        print_section("ADMIN SECURITY TESTS")
        
        if not self.regular_token:
            print_warning("Skipping security tests - no regular user token")
            return
        
        # Test 1: Regular user trying to access admin dashboard
        print_info("Testing unauthorized access to admin dashboard...")
        response = self.make_request("GET", "/admin/dashboard", use_admin=False)
        
        if response and response.status_code == 403:
            print_success("Admin dashboard properly protected - access denied")
        elif response and response.status_code == 401:
            print_success("Admin dashboard properly protected - unauthorized")
        else:
            print_error("Admin dashboard security issue - unauthorized access allowed")
            if response:
                print_error(f"Status: {response.status_code}")
        
        # Test 2: Regular user trying to access user management
        print_info("Testing unauthorized access to user management...")
        response = self.make_request("GET", "/admin/users", use_admin=False)
        
        if response and response.status_code in [401, 403]:
            print_success("User management properly protected")
        else:
            print_error("User management security issue")
    
    def run_all_tests(self):
        """Run all admin API tests"""
        print(f"{Colors.BOLD}{Colors.BLUE}")
        print("=" * 70)
        print("🔧 EASYRENT API - ADMIN ENDPOINTS TEST SUITE")
        print("=" * 70)
        print(f"{Colors.END}")
        
        # Setup
        if not self.setup_test_environment():
            print_error("Failed to setup test environment")
            return
        
        # Run all test suites
        try:
            self.test_admin_dashboard()
            self.test_user_management()
            self.test_listing_management()
            self.test_system_health()
            self.test_audit_log()
            self.test_admin_security()
            
            print_section("TEST SUMMARY")
            print_success("All admin tests completed!")
            print_info("Check the output above for any failures or issues")
            
        except Exception as e:
            print_error(f"Test execution failed: {str(e)}")
        
        print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*70}")
        print("🏁 ADMIN TEST EXECUTION COMPLETED")
        print(f"{'='*70}{Colors.END}")

if __name__ == "__main__":
    tester = AdminAPITester()
    tester.run_all_tests()
