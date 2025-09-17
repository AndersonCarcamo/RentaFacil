#!/usr/bin/env python3
"""
Test script for Verification & Moderation and Notifications endpoints
EasyRent API - Complete system testing

This script tests:
- Verification system (create, update, moderation)
- Notification system (create, read, settings)
- Admin functions for both systems
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
    print(f"\n{Colors.BOLD}{Colors.CYAN}{'='*50}")
    print(f"🧪 {title}")
    print(f"{'='*50}{Colors.END}")

def print_warning(message: str):
    print(f"{Colors.YELLOW}⚠️  {message}{Colors.END}")

class EasyRentAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.token = None
        self.admin_token = None
        self.current_user_id = None
        self.admin_user_id = None
        self.verification_id = None
        self.notification_id = None
        
    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, 
                    params: Optional[Dict] = None, use_admin: bool = False) -> requests.Response:
        """Make HTTP request with authentication"""
        url = f"{self.base_url}/{API_VERSION}{endpoint}"
        headers = {"Content-Type": "application/json"}
        
        # Add authentication
        token = self.admin_token if use_admin else self.token
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
    
    def login_user(self):
        """Login as regular user"""
        print_info("Logging in as regular user...")
        
        # Try to login with existing user
        login_data = {
            "email": "user@test.com",
            "password": "testpassword123"
        }
        
        response = self.make_request("POST", "/auth/login", login_data)
        
        if response and response.status_code == 200:
            data = response.json()
            self.token = data.get("access_token")
            self.current_user_id = data.get("user", {}).get("id")
            print_success("Regular user login successful")
            return True
        
        # If login fails, try to register first
        print_info("Regular user not found, attempting to register...")
        register_data = {
            "email": "user@test.com",
            "password": "testpassword123",
            "full_name": "Test User",
            "phone_number": "+1234567890"
        }
        
        response = self.make_request("POST", "/auth/register", register_data)
        if response and response.status_code == 201:
            print_success("Regular user registration successful")
            # Now login
            response = self.make_request("POST", "/auth/login", login_data)
            if response and response.status_code == 200:
                data = response.json()
                self.token = data.get("access_token")
                self.current_user_id = data.get("user", {}).get("id")
                print_success("Regular user login after registration successful")
                return True
        
        print_error("Failed to login as regular user")
        return False
    
    def login_admin(self):
        """Login as admin user"""
        print_info("Logging in as admin user...")
        
        # Try to login with admin user
        login_data = {
            "email": "admin@test.com", 
            "password": "adminpassword123"
        }
        
        response = self.make_request("POST", "/auth/login", login_data)
        
        if response and response.status_code == 200:
            data = response.json()
            self.admin_token = data.get("access_token")
            self.admin_user_id = data.get("user", {}).get("id")
            print_success("Admin user login successful")
            return True
        
        # If login fails, try to register first
        print_info("Admin user not found, attempting to register...")
        register_data = {
            "email": "admin@test.com",
            "password": "adminpassword123",
            "full_name": "Admin User",
            "phone_number": "+1234567891",
            "role": "admin"  # This might need to be set differently depending on your system
        }
        
        response = self.make_request("POST", "/auth/register", register_data)
        if response and response.status_code == 201:
            print_success("Admin user registration successful")
            # Now login
            response = self.make_request("POST", "/auth/login", login_data)
            if response and response.status_code == 200:
                data = response.json()
                self.admin_token = data.get("access_token")
                self.admin_user_id = data.get("user", {}).get("id")
                print_success("Admin user login after registration successful")
                return True
        
        print_error("Failed to login as admin user")
        return False
    
    # Verification & Moderation Tests
    def test_verification_system(self):
        """Test verification and moderation system"""
        print_section("VERIFICATION & MODERATION SYSTEM TESTS")
        
        # Test 1: Create verification request
        print_info("Testing verification request creation...")
        verification_data = {
            "target_type": "listing",
            "target_id": str(uuid4()),
            "priority": "medium",
            "requester_notes": "Please verify my property listing. All documents are attached and accurate.",
            "documents": [],
            "verification_data": {
                "property_type": "apartment",
                "location": "downtown"
            }
        }
        
        response = self.make_request("POST", "/verifications/", verification_data)
        if response and response.status_code == 201:
            data = response.json()
            self.verification_id = data.get("id")
            print_success(f"Verification request created: {self.verification_id}")
        else:
            print_error("Failed to create verification request")
            if response:
                print_error(f"Status: {response.status_code}, Response: {response.text}")
        
        # Test 2: Get verification list
        print_info("Testing verification list retrieval...")
        response = self.make_request("GET", "/verifications/")
        if response and response.status_code == 200:
            data = response.json()
            print_success(f"Retrieved {data.get('total', 0)} verifications")
        else:
            print_error("Failed to retrieve verification list")
        
        # Test 3: Get specific verification
        if self.verification_id:
            print_info("Testing specific verification retrieval...")
            response = self.make_request("GET", f"/verifications/{self.verification_id}")
            if response and response.status_code == 200:
                print_success("Retrieved specific verification details")
            else:
                print_error("Failed to retrieve specific verification")
        
        # Test 4: Get verification stats
        print_info("Testing verification statistics...")
        response = self.make_request("GET", "/verifications/stats")
        if response and response.status_code == 200:
            data = response.json()
            print_success(f"Stats - Total: {data.get('total_verifications', 0)}, Pending: {data.get('pending_verifications', 0)}")
        else:
            print_error("Failed to retrieve verification stats")
        
        # Admin-only tests
        if self.admin_token:
            self.test_moderation_admin_functions()
        else:
            print_warning("Skipping admin verification tests - no admin token")
    
    def test_moderation_admin_functions(self):
        """Test admin functions for moderation"""
        print_info("Testing admin moderation functions...")
        
        # Test 1: Get moderation queue
        print_info("Testing moderation queue...")
        response = self.make_request("GET", "/verifications/moderation/queue", use_admin=True)
        if response and response.status_code == 200:
            data = response.json()
            print_success(f"Retrieved moderation queue with {len(data)} items")
        else:
            print_error("Failed to retrieve moderation queue")
        
        # Test 2: Get moderation dashboard
        print_info("Testing moderation dashboard...")
        response = self.make_request("GET", "/verifications/moderation/dashboard", use_admin=True)
        if response and response.status_code == 200:
            print_success("Retrieved moderation dashboard")
        else:
            print_error("Failed to retrieve moderation dashboard")
        
        # Test 3: Update verification (if we have one)
        if self.verification_id:
            print_info("Testing verification update...")
            update_data = {
                "status": "under_review",
                "moderator_notes": "Starting review process. Documents look good so far.",
                "priority": "high"
            }
            response = self.make_request("PUT", f"/verifications/{self.verification_id}", update_data, use_admin=True)
            if response and response.status_code == 200:
                print_success("Verification updated successfully")
            else:
                print_error("Failed to update verification")
                if response:
                    print_error(f"Status: {response.status_code}, Response: {response.text}")
        
        # Test 4: Get moderation actions
        print_info("Testing moderation actions...")
        response = self.make_request("GET", "/verifications/actions", use_admin=True)
        if response and response.status_code == 200:
            data = response.json()
            print_success(f"Retrieved {len(data)} moderation actions")
        else:
            print_error("Failed to retrieve moderation actions")
    
    # Notification Tests
    def test_notification_system(self):
        """Test notification system"""
        print_section("NOTIFICATION SYSTEM TESTS")
        
        # Test 1: Get current notifications
        print_info("Testing notification list retrieval...")
        response = self.make_request("GET", "/notifications/")
        if response and response.status_code == 200:
            data = response.json()
            print_success(f"Retrieved {data.get('total', 0)} notifications")
            if data.get('items'):
                self.notification_id = data['items'][0].get('id')
        else:
            print_error("Failed to retrieve notifications")
        
        # Test 2: Get unread count
        print_info("Testing unread count...")
        response = self.make_request("GET", "/notifications/unread-count")
        if response and response.status_code == 200:
            data = response.json()
            print_success(f"Unread notifications: {data.get('unread_count', 0)}")
        else:
            print_error("Failed to retrieve unread count")
        
        # Test 3: Get notification stats
        print_info("Testing notification statistics...")
        response = self.make_request("GET", "/notifications/stats")
        if response and response.status_code == 200:
            data = response.json()
            print_success(f"Notification stats - Total: {data.get('total_notifications', 0)}, Unread: {data.get('unread_notifications', 0)}")
        else:
            print_error("Failed to retrieve notification stats")
        
        # Test 4: Get notification settings
        print_info("Testing notification settings...")
        response = self.make_request("GET", "/notifications/settings")
        if response and response.status_code == 200:
            print_success("Retrieved notification settings")
        else:
            print_error("Failed to retrieve notification settings")
        
        # Test 5: Update notification settings
        print_info("Testing notification settings update...")
        settings_update = {
            "enabled": True,
            "quiet_hours_enabled": True,
            "quiet_hours_start": "22:00",
            "quiet_hours_end": "08:00",
            "marketing_emails": False,
            "system_notifications": {
                "in_app": True,
                "email": True,
                "sms": False,
                "push": True
            }
        }
        response = self.make_request("PUT", "/notifications/settings", settings_update)
        if response and response.status_code == 200:
            print_success("Notification settings updated")
        else:
            print_error("Failed to update notification settings")
            if response:
                print_error(f"Status: {response.status_code}, Response: {response.text}")
        
        # Test 6: Mark all as read
        print_info("Testing mark all notifications as read...")
        response = self.make_request("POST", "/notifications/read-all")
        if response and response.status_code == 200:
            data = response.json()
            print_success(f"Marked {data.get('count', 0)} notifications as read")
        else:
            print_error("Failed to mark notifications as read")
        
        # Admin notification tests
        if self.admin_token:
            self.test_notification_admin_functions()
        else:
            print_warning("Skipping admin notification tests - no admin token")
    
    def test_notification_admin_functions(self):
        """Test admin functions for notifications"""
        print_info("Testing admin notification functions...")
        
        # Test 1: Create notification for user
        print_info("Testing admin notification creation...")
        notification_data = {
            "user_id": self.current_user_id,
            "title": "System Maintenance Notice",
            "message": "We will be performing system maintenance tomorrow from 2 AM to 4 AM UTC. During this time, some features may be unavailable.",
            "notification_type": "system",
            "category": "maintenance",
            "priority": "high",
            "delivery_methods": ["in_app", "email"],
            "expires_at": (datetime.utcnow() + timedelta(days=7)).isoformat()
        }
        
        response = self.make_request("POST", "/notifications/admin/create", notification_data, use_admin=True)
        if response and response.status_code == 201:
            data = response.json()
            print_success(f"Admin notification created: {data.get('id')}")
        else:
            print_error("Failed to create admin notification")
            if response:
                print_error(f"Status: {response.status_code}, Response: {response.text}")
        
        # Test 2: Create bulk notifications
        print_info("Testing bulk notification creation...")
        bulk_data = {
            "user_ids": [self.current_user_id],  # Send to specific user
            "title": "Welcome to EasyRent!",
            "message": "Thank you for joining EasyRent. We're excited to help you find your perfect home!",
            "notification_type": "system",
            "category": "welcome",
            "priority": "medium",
            "delivery_methods": ["in_app", "email"]
        }
        
        response = self.make_request("POST", "/notifications/admin/bulk", bulk_data, use_admin=True)
        if response and response.status_code == 200:
            data = response.json()
            print_success(f"Bulk notifications created: {data.get('notifications_created', 0)} successful")
        else:
            print_error("Failed to create bulk notifications")
            if response:
                print_error(f"Status: {response.status_code}, Response: {response.text}")
        
        # Test 3: Cleanup expired notifications
        print_info("Testing expired notifications cleanup...")
        response = self.make_request("POST", "/notifications/admin/cleanup/expired", use_admin=True)
        if response and response.status_code == 200:
            data = response.json()
            print_success(f"Cleanup completed: {data.get('count', 0)} expired notifications removed")
        else:
            print_error("Failed to cleanup expired notifications")
    
    def test_notification_interaction(self):
        """Test notification interaction (read, delete)"""
        print_info("Testing notification interactions...")
        
        # First, get a notification to interact with
        response = self.make_request("GET", "/notifications/")
        if response and response.status_code == 200:
            data = response.json()
            if data.get('items'):
                notification_id = data['items'][0].get('id')
                
                # Test specific notification retrieval
                print_info(f"Testing specific notification retrieval: {notification_id}")
                response = self.make_request("GET", f"/notifications/{notification_id}")
                if response and response.status_code == 200:
                    print_success("Retrieved specific notification")
                else:
                    print_error("Failed to retrieve specific notification")
                
                # Test mark as read
                print_info(f"Testing mark notification as read: {notification_id}")
                response = self.make_request("POST", f"/notifications/{notification_id}/read")
                if response and response.status_code == 200:
                    print_success("Notification marked as read")
                else:
                    print_error("Failed to mark notification as read")
                    if response:
                        print_error(f"Status: {response.status_code}, Response: {response.text}")
            else:
                print_warning("No notifications available for interaction testing")
        else:
            print_error("Failed to retrieve notifications for interaction testing")
    
    def run_all_tests(self):
        """Run all tests"""
        print(f"{Colors.BOLD}{Colors.BLUE}")
        print("=" * 70)
        print("🚀 EASYRENT API - VERIFICATION & NOTIFICATIONS TEST SUITE")
        print("=" * 70)
        print(f"{Colors.END}")
        
        # Login users
        if not self.login_user():
            print_error("Cannot proceed without regular user authentication")
            return
        
        if not self.login_admin():
            print_warning("Some admin tests will be skipped")
        
        # Run all test suites
        try:
            self.test_verification_system()
            self.test_notification_system()
            self.test_notification_interaction()
            
            print_section("TEST SUMMARY")
            print_success("All available tests completed!")
            print_info("Check the output above for any failures or issues")
            
        except Exception as e:
            print_error(f"Test execution failed: {str(e)}")
        
        print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*70}")
        print("🏁 TEST EXECUTION COMPLETED")
        print(f"{'='*70}{Colors.END}")

if __name__ == "__main__":
    tester = EasyRentAPITester()
    tester.run_all_tests()
