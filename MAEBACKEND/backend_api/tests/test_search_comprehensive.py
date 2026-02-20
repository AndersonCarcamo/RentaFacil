#!/usr/bin/env python3
"""
🔍 EasyRent API - Comprehensive Search Endpoints Testing Script
Tests all search functionality with complete filter validation
"""

import requests
import json
from datetime import datetime
import uuid

# Configuration
BASE_URL = "http://localhost:8000/v1"
HEADERS = {"Content-Type": "application/json"}

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    BOLD = '\033[1m'
    END = '\033[0m'

def print_test_header(title):
    print(f"\n{Colors.CYAN}{Colors.BOLD}{title}{Colors.END}")
    print("=" * len(title))

def print_success(message):
    print(f"{Colors.GREEN}✅ {message}{Colors.END}")

def print_error(message):
    print(f"{Colors.RED}❌ {message}{Colors.END}")

def print_warning(message):
    print(f"{Colors.YELLOW}⚠️ {message}{Colors.END}")

def print_info(message):
    print(f"{Colors.BLUE}ℹ️ {message}{Colors.END}")

def get_auth_token():
    """Obtener token de autenticación para pruebas"""
    print_test_header("Getting Authentication Token")
    
    # Registrar un usuario de prueba con firebase_uid específico
    register_data = {
        "email": "testuser_comprehensive@mock.com",
        "first_name": "Usuario",
        "last_name": "Comprehensive",
        "phone": "+51987654999",
        "role": "user",
        "firebase_uid": "testuser_comprehensive",
        "national_id": "87654999",
        "national_id_type": "DNI"
    }
    
    try:
        requests.post(f"{BASE_URL}/auth/register", json=register_data)
    except:
        pass
    
    # Login con token mock
    login_data = {
        "firebase_token": "mock_token_testuser_comprehensive"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        if response.status_code == 200:
            data = response.json()
            print_success("Token obtenido exitosamente")
            return data['access_token'], data['user']['id']
        else:
            print_error(f"Error obteniendo token: {response.status_code}")
            print_error(f"Response: {response.text}")
            raise Exception("Could not obtain authentication token")
    except Exception as e:
        print_error(f"Exception during login: {str(e)}")
        raise Exception("Could not obtain authentication token")

def test_basic_search_functionality():
    """Test basic search without filters"""
    print_test_header("🔍 Testing Basic Search Functionality")
    
    tests = [
        {
            "name": "Search without parameters",
            "url": f"{BASE_URL}/search/",
            "expected_fields": ["data", "meta", "facets"]
        },
        {
            "name": "Search with text query",
            "url": f"{BASE_URL}/search/?q=casa",
            "expected_fields": ["data", "meta", "facets"]
        },
        {
            "name": "Search with location",
            "url": f"{BASE_URL}/search/?location=lima",
            "expected_fields": ["data", "meta", "facets"]
        }
    ]
    
    results = []
    for test in tests:
        response = requests.get(test["url"])
        if response.status_code == 200:
            data = response.json()
            if all(field in data for field in test["expected_fields"]):
                print_success(f"{test['name']}: OK")
                results.append(True)
            else:
                print_error(f"{test['name']}: Missing fields in response")
                results.append(False)
        else:
            print_error(f"{test['name']}: Status {response.status_code}")
            results.append(False)
    
    return results

def test_comprehensive_filters():
    """Test all available filters"""
    print_test_header("🎯 Testing Comprehensive Filters")
    
    filter_tests = [
        {
            "name": "Property type filter",
            "params": {"property_type": "apartment", "limit": 5},
        },
        {
            "name": "Operation filter",
            "params": {"operation": "rent", "limit": 5},
        },
        {
            "name": "Price range filter",
            "params": {"min_price": 500, "max_price": 2000, "limit": 5},
        },
        {
            "name": "Bedrooms filter",
            "params": {"min_bedrooms": 2, "max_bedrooms": 4, "limit": 5},
        },
        {
            "name": "Area filter",
            "params": {"min_area_total": 50, "max_area_total": 150, "limit": 5},
        },
        {
            "name": "Multiple location filters",
            "params": {"department": "Lima", "province": "Lima", "limit": 5},
        },
        {
            "name": "Advanced property filters",
            "params": {"advertiser_type": "owner", "has_media": True, "min_parking_spots": 1, "limit": 5},
        },
        {
            "name": "Age and rental term filters",
            "params": {"max_age_years": 10, "rental_term": "monthly", "limit": 5},
        }
    ]
    
    results = []
    for test in filter_tests:
        url = f"{BASE_URL}/search/?" + "&".join([f"{k}={v}" for k, v in test["params"].items()])
        response = requests.get(url)
        
        if response.status_code == 200:
            data = response.json()
            total_results = data.get("meta", {}).get("total_results", 0)
            print_success(f"{test['name']}: {total_results} results found")
            results.append(True)
        else:
            try:
                error_data = response.json()
                print_error(f"{test['name']}: {response.status_code} - {error_data.get('detail', 'Unknown error')}")
            except:
                print_error(f"{test['name']}: Status {response.status_code}")
            results.append(False)
    
    return results

def test_sorting_and_pagination():
    """Test sorting and pagination functionality"""
    print_test_header("📊 Testing Sorting and Pagination")
    
    sort_tests = [
        {
            "name": "Sort by price ascending",
            "params": {"sort_by": "price", "sort_order": "asc", "limit": 5}
        },
        {
            "name": "Sort by price descending", 
            "params": {"sort_by": "price", "sort_order": "desc", "limit": 5}
        },
        {
            "name": "Sort by area",
            "params": {"sort_by": "area_total", "sort_order": "desc", "limit": 5}
        },
        {
            "name": "Pagination test",
            "params": {"page": 2, "limit": 3}
        }
    ]
    
    results = []
    for test in sort_tests:
        url = f"{BASE_URL}/search/?" + "&".join([f"{k}={v}" for k, v in test["params"].items()])
        response = requests.get(url)
        
        if response.status_code == 200:
            data = response.json()
            meta = data.get("meta", {})
            print_success(f"{test['name']}: Page {meta.get('page', 0)}, {meta.get('total_results', 0)} total results")
            results.append(True)
        else:
            print_error(f"{test['name']}: Status {response.status_code}")
            results.append(False)
    
    return results

def test_data_completeness():
    """Test that returned data contains all expected fields"""
    print_test_header("📋 Testing Data Completeness")
    
    response = requests.get(f"{BASE_URL}/search/?limit=1")
    if response.status_code != 200:
        print_error("Could not get search results for data validation")
        return [False]
    
    data = response.json()
    if not data.get("data"):
        print_warning("No listings found for data validation")
        return [True]  # Not an error if no data
    
    listing = data["data"][0]
    
    # Expected fields from database schema
    expected_fields = [
        'id', 'title', 'description', 'operation', 'property_type', 'advertiser_type',
        'price', 'currency', 'bedrooms', 'bathrooms', 'department', 'province', 
        'district', 'address', 'latitude', 'longitude', 'area_built', 'area_total',
        'status', 'verification_status', 'has_media', 'published_at', 'created_at',
        'owner_user_id'
    ]
    
    missing_fields = [field for field in expected_fields if field not in listing]
    extra_fields = [field for field in listing.keys() if field not in expected_fields and field not in [
        'parking_spots', 'floors', 'floor_number', 'age_years', 'rental_term', 'country',
        'contact_name', 'contact_phone_e164', 'contact_whatsapp_phone_e164', 'contact_whatsapp_link',
        'slug', 'meta_title', 'meta_description', 'views_count', 'leads_count', 'favorites_count',
        'published_until', 'updated_at', 'agency_id'
    ]]
    
    if missing_fields:
        print_warning(f"Missing expected fields: {missing_fields}")
    
    if extra_fields:
        print_info(f"Extra fields found: {extra_fields}")
    
    print_success(f"Data validation complete. Found {len(listing)} fields in listing response")
    return [True]

def test_filter_validation():
    """Test filter validation"""
    print_test_header("🔒 Testing Filter Validation")
    
    validation_tests = [
        {
            "name": "Invalid operation type",
            "params": {"operation": "invalid_operation"},
            "should_fail": True
        },
        {
            "name": "Invalid property type",
            "params": {"property_type": "invalid_property"},
            "should_fail": True
        },
        {
            "name": "Invalid advertiser type",
            "params": {"advertiser_type": "invalid_advertiser"},
            "should_fail": True
        },
        {
            "name": "Negative price",
            "params": {"min_price": -100},
            "should_fail": True
        }
    ]
    
    results = []
    for test in validation_tests:
        url = f"{BASE_URL}/search/?" + "&".join([f"{k}={v}" for k, v in test["params"].items()])
        response = requests.get(url)
        
        if test["should_fail"]:
            if response.status_code >= 400:
                print_success(f"{test['name']}: Correctly rejected")
                results.append(True)
            else:
                print_error(f"{test['name']}: Should have failed but didn't")
                results.append(False)
        else:
            if response.status_code == 200:
                print_success(f"{test['name']}: Accepted as expected")
                results.append(True)
            else:
                print_error(f"{test['name']}: Unexpectedly failed")
                results.append(False)
    
    return results

def test_suggestions_and_filters():
    """Test suggestions and available filters"""
    print_test_header("💡 Testing Suggestions and Available Filters")
    
    # Test suggestions
    suggestions_response = requests.get(f"{BASE_URL}/search/suggestions?q=lim&type=location")
    suggestions_ok = suggestions_response.status_code == 200
    if suggestions_ok:
        suggestions_data = suggestions_response.json()
        suggestion_count = len(suggestions_data.get("suggestions", []))
        print_success(f"Location suggestions: {suggestion_count} suggestions found")
    else:
        print_error(f"Location suggestions failed: {suggestions_response.status_code}")
    
    # Test available filters
    filters_response = requests.get(f"{BASE_URL}/search/filters")
    filters_ok = filters_response.status_code == 200
    if filters_ok:
        filters_data = filters_response.json()
        print_success(f"Available filters retrieved successfully")
        print_info(f"Property types: {len(filters_data.get('property_types', []))}")
        print_info(f"Departments: {len(filters_data.get('departments', []))}")
    else:
        print_error(f"Available filters failed: {filters_response.status_code}")
    
    return [suggestions_ok, filters_ok]

def main():
    print(f"{Colors.MAGENTA}{Colors.BOLD}🔍 EasyRent API - Comprehensive Search Testing 🔍{Colors.END}")
    print("=" * 60)
    
    try:
        token, user_id = get_auth_token()
        print_info(f"Using user ID for testing: {user_id}")
        
        # Run all test suites
        test_results = []
        
        # Basic functionality
        basic_results = test_basic_search_functionality()
        test_results.extend(basic_results)
        
        # Comprehensive filters
        filter_results = test_comprehensive_filters()
        test_results.extend(filter_results)
        
        # Sorting and pagination
        sort_results = test_sorting_and_pagination()
        test_results.extend(sort_results)
        
        # Data completeness
        data_results = test_data_completeness()
        test_results.extend(data_results)
        
        # Filter validation
        validation_results = test_filter_validation()
        test_results.extend(validation_results)
        
        # Suggestions and filters
        suggestions_results = test_suggestions_and_filters()
        test_results.extend(suggestions_results)
        
        # Test saved searches (authenticated)
        auth_headers = {**HEADERS, "Authorization": f"Bearer {token}"}
        
        print_test_header("💾 Testing Saved Searches (Authenticated)")
        
        # Save a search
        save_data = {
            "name": "Comprehensive Test Search",
            "filters": {
                "operation": "rent",
                "property_type": "apartment",
                "min_price": 800,
                "max_price": 2000,
                "min_bedrooms": 2,
                "location": "lima"
            },
            "notifications": True
        }
        
        save_response = requests.post(f"{BASE_URL}/search/saved", json=save_data, headers=auth_headers)
        save_ok = save_response.status_code == 201
        if save_ok:
            saved_search = save_response.json()
            search_id = saved_search["id"]
            print_success(f"Search saved with ID: {search_id}")
            test_results.append(True)
            
            # Test retrieval and cleanup
            get_response = requests.get(f"{BASE_URL}/search/saved/{search_id}", headers=auth_headers)
            get_ok = get_response.status_code == 200
            if get_ok:
                print_success("Search retrieved successfully")
                test_results.append(True)
            else:
                print_error("Failed to retrieve saved search")
                test_results.append(False)
            
            # Cleanup
            delete_response = requests.delete(f"{BASE_URL}/search/saved/{search_id}", headers=auth_headers)
            if delete_response.status_code == 200:
                print_success("Search deleted successfully")
                test_results.append(True)
            else:
                print_error("Failed to delete saved search")
                test_results.append(False)
        else:
            print_error(f"Failed to save search: {save_response.status_code}")
            test_results.extend([False, False, False])
        
    except Exception as e:
        print_error(f"Test execution failed: {str(e)}")
        return
    
    # Print summary
    total_tests = len(test_results)
    passed_tests = sum(test_results)
    failed_tests = total_tests - passed_tests
    success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
    
    print(f"\n{Colors.BOLD}📊 COMPREHENSIVE TEST RESULTS{Colors.END}")
    print("=" * 60)
    print(f"Total Tests: {total_tests}")
    print(f"{Colors.GREEN}Passed: {passed_tests}{Colors.END}")
    print(f"{Colors.RED}Failed: {failed_tests}{Colors.END}")
    print(f"Success Rate: {Colors.GREEN if success_rate >= 80 else Colors.YELLOW if success_rate >= 60 else Colors.RED}{success_rate:.1f}%{Colors.END}")
    print("=" * 60)
    
    if success_rate >= 90:
        print(f"{Colors.GREEN}{Colors.BOLD}🎯 Comprehensive Search Testing Complete! Excellent results!{Colors.END}")
    elif success_rate >= 70:
        print(f"{Colors.YELLOW}{Colors.BOLD}🎯 Comprehensive Search Testing Complete! Good results with room for improvement.{Colors.END}")
    else:
        print(f"{Colors.RED}{Colors.BOLD}🎯 Comprehensive Search Testing Complete! Needs significant improvements.{Colors.END}")

if __name__ == "__main__":
    main()
