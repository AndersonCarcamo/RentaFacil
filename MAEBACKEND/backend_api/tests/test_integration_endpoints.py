#!/usr/bin/env python3
"""
Test script for External Integrations endpoints
EasyRent API - External integrations testing

This script tests:
- Webhook processing (WhatsApp, Stripe, Culqi, MercadoPago, PayPal)
- Geocoding and reverse geocoding
- Nearby places search
- Integration health checks
"""

import requests
import json
import hashlib
import hmac
from datetime import datetime
from typing import Dict, Any, Optional
import time

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
    print(f"🔗 {title}")
    print(f"{'='*60}{Colors.END}")

def print_warning(message: str):
    print(f"{Colors.YELLOW}⚠️  {message}{Colors.END}")

class IntegrationAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        
    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, 
                    params: Optional[Dict] = None, headers: Optional[Dict] = None) -> requests.Response:
        """Make HTTP request"""
        url = f"{self.base_url}/{API_VERSION}{endpoint}"
        request_headers = {"Content-Type": "application/json"}
        
        if headers:
            request_headers.update(headers)
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=request_headers, params=params)
            elif method.upper() == "POST":
                response = requests.post(url, headers=request_headers, json=data, params=params)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except requests.exceptions.RequestException as e:
            print_error(f"Request failed: {str(e)}")
            return None
    
    # Webhook Tests
    def test_whatsapp_webhook(self):
        """Test WhatsApp webhook processing"""
        print_section("WHATSAPP WEBHOOK TESTS")
        
        # Test 1: Valid WhatsApp message webhook
        print_info("Testing WhatsApp message webhook...")
        
        whatsapp_payload = {
            "entry": [{
                "id": "PHONE_NUMBER_ID",
                "changes": [{
                    "value": {
                        "messaging_product": "whatsapp",
                        "metadata": {
                            "display_phone_number": "15550001234",
                            "phone_number_id": "PHONE_NUMBER_ID"
                        },
                        "messages": [{
                            "from": "51987654321",
                            "id": "wamid.message_id",
                            "timestamp": "1234567890",
                            "type": "text",
                            "text": {
                                "body": "Hello, I'm interested in property listing"
                            }
                        }]
                    },
                    "field": "messages"
                }]
            }]
        }
        
        headers = {
            "x-hub-signature-256": "sha256=test_signature"
        }
        
        response = self.make_request("POST", "/integrations/whatsapp/webhook", whatsapp_payload, headers=headers)
        
        if response and response.status_code == 200:
            data = response.json()
            print_success("WhatsApp webhook processed successfully")
            print_info(f"Response: {data.get('message', 'No message')}")
        else:
            print_error("Failed to process WhatsApp webhook")
            if response:
                print_error(f"Status: {response.status_code}, Response: {response.text}")
        
        # Test 2: Invalid payload
        print_info("Testing invalid WhatsApp webhook...")
        invalid_payload = {"invalid": "payload"}
        
        response = self.make_request("POST", "/integrations/whatsapp/webhook", invalid_payload)
        
        if response and response.status_code in [400, 422]:
            print_success("Invalid WhatsApp webhook properly rejected")
        else:
            print_warning("Invalid webhook validation may need improvement")
    
    def test_payment_webhooks(self):
        """Test payment webhooks from different providers"""
        print_section("PAYMENT WEBHOOK TESTS")
        
        # Test Stripe webhook
        print_info("Testing Stripe payment webhook...")
        stripe_payload = {
            "id": "evt_test_webhook",
            "object": "event",
            "api_version": "2020-08-27",
            "created": int(time.time()),
            "data": {
                "object": {
                    "id": "pi_test_payment",
                    "object": "payment_intent",
                    "amount": 5000,  # $50.00
                    "currency": "usd",
                    "status": "succeeded",
                    "metadata": {
                        "user_id": "test_user_123"
                    }
                }
            },
            "livemode": False,
            "pending_webhooks": 1,
            "request": {
                "id": "req_test_request",
                "idempotency_key": None
            },
            "type": "payment_intent.succeeded"
        }
        
        headers = {"stripe-signature": "t=timestamp,v1=signature"}
        response = self.make_request("POST", "/integrations/payment/stripe/webhook", stripe_payload, headers=headers)
        
        if response and response.status_code == 200:
            print_success("Stripe webhook processed successfully")
        else:
            print_error("Failed to process Stripe webhook")
        
        # Test Culqi webhook
        print_info("Testing Culqi payment webhook...")
        culqi_payload = {
            "event": "charge.succeeded",
            "data": {
                "id": "chr_test_charge",
                "amount": 5000,  # 50 soles
                "currency_code": "PEN",
                "state": "paid",
                "metadata": {
                    "user_id": "test_user_123"
                }
            }
        }
        
        response = self.make_request("POST", "/integrations/payment/culqi/webhook", culqi_payload)
        
        if response and response.status_code == 200:
            print_success("Culqi webhook processed successfully")
        else:
            print_error("Failed to process Culqi webhook")
        
        # Test MercadoPago webhook
        print_info("Testing MercadoPago payment webhook...")
        mercadopago_payload = {
            "id": "12345678901",
            "live_mode": False,
            "type": "payment",
            "date_created": "2024-01-01T10:00:00.000-04:00",
            "user_id": "user_test_123456789",
            "api_version": "v1",
            "action": "payment.created",
            "data": {
                "id": "payment_id_123456789"
            }
        }
        
        response = self.make_request("POST", "/integrations/payment/mercadopago/webhook", mercadopago_payload)
        
        if response and response.status_code == 200:
            print_success("MercadoPago webhook processed successfully")
        else:
            print_error("Failed to process MercadoPago webhook")
        
        # Test PayPal webhook
        print_info("Testing PayPal payment webhook...")
        paypal_payload = {
            "id": "WH-2WR32451HC0233532-67976317FL4543714",
            "event_version": "1.0",
            "create_time": "2018-19-12T22:20:32.000Z",
            "resource_type": "sale",
            "event_type": "PAYMENT.SALE.COMPLETED",
            "summary": "Payment completed for $ 20.0 USD",
            "resource": {
                "id": "WH-2WR32451HC0233532-67976317FL4543714",
                "state": "completed",
                "amount": {
                    "total": "20.00",
                    "currency": "USD"
                }
            }
        }
        
        response = self.make_request("POST", "/integrations/payment/paypal/webhook", paypal_payload)
        
        if response and response.status_code == 200:
            print_success("PayPal webhook processed successfully")
        else:
            print_error("Failed to process PayPal webhook")
    
    def test_geocoding_services(self):
        """Test geocoding and reverse geocoding"""
        print_section("GEOCODING SERVICES TESTS")
        
        # Test 1: Address geocoding
        print_info("Testing address geocoding...")
        
        params = {
            "address": "Av. Javier Prado Este 4200, San Borja, Lima, Peru",
            "country": "PE",
            "language": "es"
        }
        
        response = self.make_request("GET", "/integrations/maps/geocode", params=params)
        
        if response and response.status_code == 200:
            data = response.json()
            print_success("Address geocoding successful")
            if data.get("results"):
                result = data["results"][0]
                print_info(f"Coordinates: {result.get('latitude')}, {result.get('longitude')}")
                print_info(f"Address: {result.get('formatted_address')}")
                print_info(f"Cached: {data.get('cached', False)}")
        else:
            print_error("Failed to geocode address")
            if response:
                print_error(f"Status: {response.status_code}, Response: {response.text}")
        
        # Test 2: Invalid address
        print_info("Testing invalid address geocoding...")
        
        params = {"address": "xyz"}
        response = self.make_request("GET", "/integrations/maps/geocode", params=params)
        
        if response and response.status_code == 400:
            print_success("Invalid address properly rejected")
        else:
            print_warning("Address validation may need improvement")
        
        # Test 3: Reverse geocoding
        print_info("Testing reverse geocoding...")
        
        params = {
            "lat": -12.0464,
            "lng": -77.0428,
            "language": "es"
        }
        
        response = self.make_request("GET", "/integrations/maps/reverse-geocode", params=params)
        
        if response and response.status_code == 200:
            data = response.json()
            print_success("Reverse geocoding successful")
            if data.get("results"):
                result = data["results"][0]
                print_info(f"Address: {result.get('formatted_address')}")
                print_info(f"City: {result.get('city')}")
                print_info(f"Country: {result.get('country')}")
        else:
            print_error("Failed to reverse geocode coordinates")
        
        # Test 4: Invalid coordinates
        print_info("Testing invalid coordinates...")
        
        params = {"lat": 91, "lng": -77.0428}  # Invalid latitude
        response = self.make_request("GET", "/integrations/maps/reverse-geocode", params=params)
        
        if response and response.status_code == 400:
            print_success("Invalid coordinates properly rejected")
        else:
            print_warning("Coordinate validation may need improvement")
    
    def test_nearby_places(self):
        """Test nearby places search"""
        print_section("NEARBY PLACES TESTS")
        
        # Test 1: Find nearby restaurants
        print_info("Testing nearby restaurants search...")
        
        params = {
            "lat": -12.0464,
            "lng": -77.0428,
            "radius": 1000,
            "type": "restaurant",
            "limit": 10
        }
        
        response = self.make_request("GET", "/integrations/maps/nearby-places", params=params)
        
        if response and response.status_code == 200:
            data = response.json()
            print_success("Nearby restaurants search successful")
            places = data.get("places", [])
            print_info(f"Found {len(places)} restaurants")
            print_info(f"Search radius: {data.get('search_radius')} meters")
            print_info(f"Cached: {data.get('cached', False)}")
            
            # Show first few places
            for i, place in enumerate(places[:3]):
                print_info(f"  {i+1}. {place.get('name')} - {place.get('distance_meters')}m away")
        else:
            print_error("Failed to find nearby restaurants")
        
        # Test 2: Find nearby schools
        print_info("Testing nearby schools search...")
        
        params = {
            "lat": -12.0464,
            "lng": -77.0428,
            "radius": 2000,
            "type": "school",
            "limit": 5
        }
        
        response = self.make_request("GET", "/integrations/maps/nearby-places", params=params)
        
        if response and response.status_code == 200:
            data = response.json()
            print_success("Nearby schools search successful")
            print_info(f"Found {len(data.get('places', []))} schools")
        else:
            print_error("Failed to find nearby schools")
        
        # Test 3: Invalid parameters
        print_info("Testing invalid search parameters...")
        
        params = {
            "lat": -12.0464,
            "lng": -77.0428,
            "radius": 100000,  # Too large radius
            "type": "restaurant"
        }
        
        response = self.make_request("GET", "/integrations/maps/nearby-places", params=params)
        
        if response and response.status_code == 400:
            print_success("Invalid search radius properly rejected")
        else:
            print_warning("Parameter validation may need improvement")
    
    def test_integration_health(self):
        """Test integration health check"""
        print_section("INTEGRATION HEALTH TESTS")
        
        print_info("Testing integration health check...")
        
        response = self.make_request("GET", "/integrations/health")
        
        if response and response.status_code == 200:
            data = response.json()
            overall_health = data.get("overall_health", "unknown")
            services = data.get("services", {})
            
            print_success(f"Integration health check successful - Status: {overall_health}")
            print_info("Service statuses:")
            for service, status in services.items():
                print_info(f"  - {service}: {status}")
        else:
            print_error("Failed to get integration health status")
    
    def test_error_handling(self):
        """Test error handling and edge cases"""
        print_section("ERROR HANDLING TESTS")
        
        # Test 1: Malformed JSON webhook
        print_info("Testing malformed webhook payload...")
        
        try:
            url = f"{self.base_url}/{API_VERSION}/integrations/whatsapp/webhook"
            response = requests.post(
                url, 
                data="invalid json",
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 422:
                print_success("Malformed JSON properly handled")
            else:
                print_warning("JSON validation may need improvement")
        except Exception as e:
            print_info(f"Request handling: {str(e)}")
        
        # Test 2: Missing required parameters
        print_info("Testing missing required parameters...")
        
        response = self.make_request("GET", "/integrations/maps/geocode", params={})
        
        if response and response.status_code == 422:
            print_success("Missing parameters properly validated")
        else:
            print_warning("Parameter validation may need improvement")
        
        # Test 3: Unsupported place type
        print_info("Testing unsupported place type...")
        
        params = {
            "lat": -12.0464,
            "lng": -77.0428,
            "type": "invalid_type"
        }
        
        response = self.make_request("GET", "/integrations/maps/nearby-places", params=params)
        
        if response and response.status_code == 422:
            print_success("Unsupported place type properly rejected")
        else:
            print_warning("Place type validation may need improvement")
    
    def run_all_tests(self):
        """Run all integration API tests"""
        print(f"{Colors.BOLD}{Colors.BLUE}")
        print("=" * 70)
        print("🔗 EASYRENT API - EXTERNAL INTEGRATIONS TEST SUITE")
        print("=" * 70)
        print(f"{Colors.END}")
        
        try:
            self.test_whatsapp_webhook()
            self.test_payment_webhooks()
            self.test_geocoding_services()
            self.test_nearby_places()
            self.test_integration_health()
            self.test_error_handling()
            
            print_section("TEST SUMMARY")
            print_success("All integration tests completed!")
            print_info("Check the output above for any failures or issues")
            print_info("Note: Some tests may show warnings for edge cases that need attention")
            
        except Exception as e:
            print_error(f"Test execution failed: {str(e)}")
        
        print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*70}")
        print("🏁 INTEGRATION TEST EXECUTION COMPLETED")
        print(f"{'='*70}{Colors.END}")

if __name__ == "__main__":
    tester = IntegrationAPITester()
    tester.run_all_tests()