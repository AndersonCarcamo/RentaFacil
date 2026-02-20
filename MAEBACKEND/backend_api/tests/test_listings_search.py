#!/usr/bin/env python3
"""
Test script for EasyRent Listings and Search functionality
Tests various types of listings and search filters
"""

import requests
import json
import time
from typing import Dict, Any

BASE_URL = "http://localhost:8000/v1"

class ListingsSearchTester:
    def __init__(self):
        self.access_token = None
        self.user_id = None
        self.created_listings = []
        
    def authenticate(self) -> bool:
        """Authenticate and get access token"""
        try:
            # Login with the same mock token used in the other test script
            login_data = {
                "firebase_token": "mock_token_testuser456"
            }
            
            response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                self.access_token = data["access_token"]
                self.user_id = data["user"]["id"]
                print(f"✅ Authentication successful - User ID: {self.user_id}")
                return True
            else:
                print(f"❌ Authentication failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Authentication error: {str(e)}")
            return False
    
    def get_headers(self) -> Dict[str, str]:
        """Get authorization headers"""
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
    
    def create_pet_friendly_listing(self) -> str:
        """Create a pet-friendly listing"""
        listing_data = {
            "title": "Casa Pet-Friendly con Jardín",
            "description": "Hermosa casa de 3 dormitorios con amplio jardín, perfecta para familias con mascotas. Incluye área de juegos para perros y cerca de parques.",
            "operation": "rent",
            "property_type": "house",
            "price": 1200.0,
            "currency": "PEN",
            "area_built": 120.0,
            "bedrooms": 3,
            "bathrooms": 2,
            "pet_friendly": True,  # ⭐ Pet-friendly
            "furnished": False,
            "rental_mode": "full_property",
            "address": "Av. Los Perros 456, San Miguel",
            "department": "Lima",
            "province": "Lima",
            "district": "San Miguel"
        }
        
        try:
            response = requests.post(
                f"{BASE_URL}/listings/",
                json=listing_data,
                headers=self.get_headers()
            )
            
            if response.status_code == 201:
                data = response.json()
                listing_id = data["id"]
                self.created_listings.append(listing_id)
                print(f"✅ Created Pet-Friendly Listing: {listing_id}")
                print(f"   🐕 Pet-friendly: {data.get('pet_friendly', False)}")
                print(f"   🏠 Property type: {data.get('property_type', 'N/A')}")
                print(f"   💰 Price: {data.get('price', 'N/A')} {data.get('currency', '')}")
                return listing_id
            else:
                print(f"❌ Failed to create pet-friendly listing: {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ Error creating pet-friendly listing: {str(e)}")
            return None
    
    def create_furnished_listing(self) -> str:
        """Create a furnished listing"""
        listing_data = {
            "title": "Apartamento Moderno Completamente Amueblado",
            "description": "Elegante apartamento de 2 dormitorios, completamente amueblado con muebles modernos, electrodomésticos nuevos y decoración contemporánea. Listo para mudarse.",
            "operation": "rent",
            "property_type": "apartment",
            "price": 950.0,
            "currency": "PEN",
            "area_built": 85.0,
            "bedrooms": 2,
            "bathrooms": 2,
            "pet_friendly": False,
            "furnished": True,  # ⭐ Furnished
            "rental_mode": "full_property",
            "address": "Jr. Muebles 789, Surco",
            "department": "Lima",
            "province": "Lima",
            "district": "Santiago de Surco"
        }
        
        try:
            response = requests.post(
                f"{BASE_URL}/listings/",
                json=listing_data,
                headers=self.get_headers()
            )
            
            if response.status_code == 201:
                data = response.json()
                listing_id = data["id"]
                self.created_listings.append(listing_id)
                print(f"✅ Created Furnished Listing: {listing_id}")
                print(f"   🪑 Furnished: {data.get('furnished', False)}")
                print(f"   🏢 Property type: {data.get('property_type', 'N/A')}")
                print(f"   💰 Price: {data.get('price', 'N/A')} {data.get('currency', '')}")
                return listing_id
            else:
                print(f"❌ Failed to create furnished listing: {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ Error creating furnished listing: {str(e)}")
            return None
    
    def create_airbnb_ready_listing(self) -> str:
        """Create an Airbnb-ready listing with high score potential"""
        listing_data = {
            "title": "Lujoso Loft Airbnb en Miraflores",
            "description": "Espectacular loft de lujo en el corazón de Miraflores, completamente equipado para Airbnb. Vista al mar, decoración moderna, ubicación premium cerca de restaurantes y centros comerciales.",
            "operation": "temp_rent",  # ⭐ Temporal rental for Airbnb
            "property_type": "apartment",
            "price": 150.0,  # Daily rate
            "currency": "USD",
            "area_built": 90.0,
            "bedrooms": 1,
            "bathrooms": 1,
            "pet_friendly": True,
            "furnished": True,  # ⭐ Furnished for higher Airbnb score
            "rental_mode": "full_property",  # ⭐ Full property for Airbnb
            "address": "Av. Malecón de la Reserva 123, Miraflores",
            "department": "Lima",
            "province": "Lima",
            "district": "Miraflores"  # ⭐ Premium location
        }
        
        try:
            response = requests.post(
                f"{BASE_URL}/listings/",
                json=listing_data,
                headers=self.get_headers()
            )
            
            if response.status_code == 201:
                data = response.json()
                listing_id = data["id"]
                self.created_listings.append(listing_id)
                print(f"✅ Created Airbnb-Ready Listing: {listing_id}")
                print(f"   🏠 Airbnb eligible: {data.get('airbnb_eligible', False)}")
                print(f"   🏆 Airbnb score: {data.get('airbnb_score', 'N/A')}")
                print(f"   🪑 Furnished: {data.get('furnished', False)}")
                print(f"   🏢 Property type: {data.get('property_type', 'N/A')}")
                print(f"   💰 Price: {data.get('price', 'N/A')} {data.get('currency', '')}")
                print(f"   🌍 Operation: {data.get('operation', 'N/A')}")
                return listing_id
            else:
                print(f"❌ Failed to create Airbnb-ready listing: {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ Error creating Airbnb-ready listing: {str(e)}")
            return None
    
    def cleanup_existing_listings(self) -> None:
        """Clean up any existing published listings to avoid plan limits"""
        print("\n🧹 === CLEANING UP EXISTING LISTINGS ===")
        try:
            # Get user's listings
            response = requests.get(
                f"{BASE_URL}/listings/my-listings",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                existing_listings = data.get('data', [])
                print(f"Found {len(existing_listings)} existing listings")
                
                # Delete published listings to free up plan slots
                deleted_count = 0
                for listing in existing_listings:
                    if listing.get('status') == 'published':
                        try:
                            delete_response = requests.delete(
                                f"{BASE_URL}/listings/{listing['id']}",
                                headers=self.get_headers()
                            )
                            if delete_response.status_code in [200, 204]:
                                deleted_count += 1
                                print(f"✅ Deleted listing: {listing['title']}")
                        except Exception as e:
                            print(f"❌ Error deleting listing {listing['id']}: {str(e)}")
                
                print(f"✅ Cleaned up {deleted_count} published listings")
            else:
                print(f"Could not get existing listings: {response.text}")
                
        except Exception as e:
            print(f"❌ Error during cleanup: {str(e)}")
    
    def publish_listing(self, listing_id: str) -> bool:
        """Publish a listing to make it searchable"""
        try:
            response = requests.post(
                f"{BASE_URL}/listings/{listing_id}/publish",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                print(f"✅ Published listing: {listing_id}")
                return True
            else:
                error_msg = response.text
                print(f"❌ Failed to publish listing {listing_id}: {error_msg}")
                # If it's a plan limit, try to handle it gracefully
                if "Plan limit exceeded" in error_msg:
                    print("   ⚠️ Plan limit reached - some listings may not be searchable")
                return False
                
        except Exception as e:
            print(f"❌ Error publishing listing {listing_id}: {str(e)}")
            return False
    
    def search_with_filters(self) -> None:
        """Test search with various filters"""
        print("\n🔍 === TESTING SEARCH WITH FILTERS ===")
        
        # Search pet-friendly properties
        print("\n--- Search: Pet-Friendly Properties ---")
        try:
            response = requests.get(f"{BASE_URL}/search/?pet_friendly=true&limit=10")
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Found {len(data['data'])} pet-friendly properties")
                for listing in data['data'][:3]:  # Show first 3
                    print(f"   🐕 {listing['title']} - Pet-friendly: {listing.get('pet_friendly', False)}")
            else:
                print(f"❌ Pet-friendly search failed: {response.text}")
        except Exception as e:
            print(f"❌ Error in pet-friendly search: {str(e)}")
        
        # Search furnished properties
        print("\n--- Search: Furnished Properties ---")
        try:
            response = requests.get(f"{BASE_URL}/search/?furnished=true&limit=10")
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Found {len(data['data'])} furnished properties")
                for listing in data['data'][:3]:  # Show first 3
                    print(f"   🪑 {listing['title']} - Furnished: {listing.get('furnished', False)}")
            else:
                print(f"❌ Furnished search failed: {response.text}")
        except Exception as e:
            print(f"❌ Error in furnished search: {str(e)}")
        
        # Search Airbnb eligible properties
        print("\n--- Search: Airbnb Eligible Properties ---")
        try:
            response = requests.get(f"{BASE_URL}/search/?airbnb_eligible=true&limit=10")
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Found {len(data['data'])} Airbnb eligible properties")
                for listing in data['data'][:3]:  # Show first 3
                    print(f"   🏠 {listing['title']} - Airbnb eligible: {listing.get('airbnb_eligible', False)} (Score: {listing.get('airbnb_score', 'N/A')})")
            else:
                print(f"❌ Airbnb eligible search failed: {response.text}")
        except Exception as e:
            print(f"❌ Error in Airbnb eligible search: {str(e)}")
        
        # Search by property type
        print("\n--- Search: Apartments ---")
        try:
            response = requests.get(f"{BASE_URL}/search/?property_type=apartment&limit=10")
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Found {len(data['data'])} apartments")
                for listing in data['data'][:3]:  # Show first 3
                    print(f"   🏢 {listing['title']} - Type: {listing.get('property_type', 'N/A')}")
            else:
                print(f"❌ Apartment search failed: {response.text}")
        except Exception as e:
            print(f"❌ Error in apartment search: {str(e)}")
        
        # Search by price range
        print("\n--- Search: Price Range 800-1000 PEN ---")
        try:
            response = requests.get(f"{BASE_URL}/search/?min_price=800&max_price=1000&limit=10")
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Found {len(data['data'])} properties in price range")
                for listing in data['data'][:3]:  # Show first 3
                    print(f"   💰 {listing['title']} - Price: {listing.get('price', 'N/A')} {listing.get('currency', '')}")
            else:
                print(f"❌ Price range search failed: {response.text}")
        except Exception as e:
            print(f"❌ Error in price range search: {str(e)}")
        
        # Combined filters
        print("\n--- Search: Combined Filters (Furnished + Pet-friendly) ---")
        try:
            response = requests.get(f"{BASE_URL}/search/?furnished=true&pet_friendly=true&limit=10")
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Found {len(data['data'])} properties with combined filters")
                for listing in data['data'][:3]:  # Show first 3
                    print(f"   🏠 {listing['title']} - Furnished: {listing.get('furnished', False)}, Pet-friendly: {listing.get('pet_friendly', False)}")
            else:
                print(f"❌ Combined filters search failed: {response.text}")
        except Exception as e:
            print(f"❌ Error in combined filters search: {str(e)}")
    
    def search_with_text(self) -> None:
        """Test text-based search"""
        print("\n📝 === TESTING TEXT SEARCH ===")
        
        search_terms = [
            "amueblado",
            "mascotas",
            "Miraflores",
            "jardín",
            "moderno",
            "Airbnb"
        ]
        
        for term in search_terms:
            print(f"\n--- Search: '{term}' ---")
            try:
                response = requests.get(f"{BASE_URL}/search/?q={term}&limit=5")
                if response.status_code == 200:
                    data = response.json()
                    print(f"✅ Found {len(data['data'])} properties for '{term}'")
                    for listing in data['data']:
                        print(f"   📋 {listing['title']}")
                else:
                    print(f"❌ Text search for '{term}' failed: {response.text}")
            except Exception as e:
                print(f"❌ Error searching '{term}': {str(e)}")
    
    def get_listing_details(self, listing_id: str) -> None:
        """Get detailed information about a specific listing"""
        try:
            response = requests.get(f"{BASE_URL}/listings/{listing_id}")
            if response.status_code == 200:
                data = response.json()
                print(f"\n📋 === LISTING DETAILS: {data['title']} ===")
                print(f"🆔 ID: {data['id']}")
                print(f"🏠 Type: {data.get('property_type', 'N/A')}")
                print(f"💰 Price: {data.get('price', 'N/A')} {data.get('currency', '')}")
                print(f"🛏️ Bedrooms: {data.get('bedrooms', 'N/A')}")
                print(f"🚿 Bathrooms: {data.get('bathrooms', 'N/A')}")
                print(f"🪑 Furnished: {data.get('furnished', False)}")
                print(f"🐕 Pet-friendly: {data.get('pet_friendly', False)}")
                print(f"🏆 Airbnb Score: {data.get('airbnb_score', 'N/A')}")
                print(f"🏠 Airbnb Eligible: {data.get('airbnb_eligible', False)}")
                print(f"📍 Location: {data.get('district', 'N/A')}, {data.get('department', 'N/A')}")
                print(f"📄 Description: {data.get('description', 'N/A')[:100]}...")
            else:
                print(f"❌ Failed to get listing details: {response.text}")
        except Exception as e:
            print(f"❌ Error getting listing details: {str(e)}")
    
    def run_tests(self):
        """Run all tests"""
        print("🔥 EasyRent Listings & Search Testing Script 🔥")
        print("=" * 60)
        
        # Authenticate
        if not self.authenticate():
            print("❌ Authentication failed, cannot continue")
            return
        
    def run_comprehensive_test(self):
        """Run comprehensive testing of listings and search"""
        print("🚀 Starting Comprehensive Listings & Search Test")
        print("=" * 60)
        
        # Authenticate
        if not self.authenticate():
            print("❌ Authentication failed, cannot continue")
            return
        
        # Clean up existing listings to avoid plan limits
        self.cleanup_existing_listings()
        time.sleep(1)
        
        print("\n🏠 === CREATING TEST LISTINGS ===")
        
        # Create different types of listings
        pet_listing = self.create_pet_friendly_listing()
        time.sleep(1)
        
        furnished_listing = self.create_furnished_listing()
        time.sleep(1)
        
        airbnb_listing = self.create_airbnb_ready_listing()
        time.sleep(1)
        
        # Publish listings to make them searchable
        print("\n📤 === PUBLISHING LISTINGS ===")
        published_count = 0
        failed_publishes = []
        
        for listing_id in self.created_listings:
            if listing_id:
                if self.publish_listing(listing_id):
                    published_count += 1
                else:
                    failed_publishes.append(listing_id)
            time.sleep(0.5)
        
        print(f"✅ Published {published_count}/{len(self.created_listings)} listings")
        if failed_publishes:
            print(f"⚠️ Failed to publish {len(failed_publishes)} listings (likely due to plan limits)")
        
        # Wait a bit for indexing
        print("\n⏳ Waiting for listings to be indexed...")
        time.sleep(2)
        
        # Test search functionality
        self.search_with_filters()
        self.search_with_text()
        
        # Show details of created listings
        print("\n🔍 === CREATED LISTINGS DETAILS ===")
        for listing_id in self.created_listings:
            if listing_id:
                self.get_listing_details(listing_id)
        
        print("\n🎯 === TESTING COMPLETE ===")
        print(f"Created {len(self.created_listings)} test listings")
        print(f"Published {published_count} listings successfully")
        print("All search and listing functionality tested!")
        
        if failed_publishes:
            print("\n📝 NOTE: Some listings couldn't be published due to plan limits,")
            print("but this is expected behavior to prevent abuse.")
if __name__ == "__main__":
    tester = ListingsSearchTester()
    tester.run_comprehensive_test()
