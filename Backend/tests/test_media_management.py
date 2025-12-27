import requests
import json
import os
import time
from typing import Dict

# Configuración
BASE_URL = "http://localhost:8000/v1"

class MediaManagementTester:
    def __init__(self):
        self.access_token = None
        self.user_id = None
        self.created_listing_id = None
        self.uploaded_images = []
        self.uploaded_videos = []

    def authenticate(self) -> bool:
        """Autenticar y obtener access token"""
        try:
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
        """Obtener headers de autorización"""
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }

    def create_test_listing(self) -> str:
        """Crear un listing de prueba para asociar media"""
        listing_data = {
            "title": "Test Listing para Media Management",
            "description": "Listing creado específicamente para probar la subida y gestión de media",
            "operation": "rent",
            "property_type": "apartment",
            "price": 1500.0,
            "currency": "PEN",
            "area_built": 75.0,
            "bedrooms": 2,
            "bathrooms": 1,
            "pet_friendly": False,
            "furnished": True,
            "rental_mode": "full_property",
            "address": "Calle Test 123, Lima",
            "department": "Lima",
            "province": "Lima",
            "district": "San Isidro"
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
                self.created_listing_id = listing_id
                print(f"✅ Created test listing: {listing_id}")
                print(f"   📍 Address: {data.get('address', 'N/A')}")
                print(f"   💰 Price: {data.get('price', 'N/A')} {data.get('currency', '')}")
                return listing_id
            else:
                print(f"❌ Failed to create test listing: {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ Error creating test listing: {str(e)}")
            return None

    def test_get_listing_images(self, listing_id: str):
        """Probar endpoint GET /listings/{listing_id}/images"""
        print("\n📸 === TESTING GET LISTING IMAGES ===")
        try:
            response = requests.get(f"{BASE_URL}/listings/{listing_id}/images")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Successfully retrieved images")
                print(f"   📊 Total images: {data.get('total', 0)}")
                
                for image in data.get('images', []):
                    print(f"   🖼️ Image: {image.get('filename', 'N/A')}")
                    print(f"      ID: {image.get('id', 'N/A')}")
                    print(f"      Main: {image.get('is_main', False)}")
                    print(f"      Order: {image.get('display_order', 0)}")
            else:
                print(f"❌ Failed to get images: {response.text}")
                
        except Exception as e:
            print(f"❌ Error getting images: {str(e)}")

    def test_get_listing_videos(self, listing_id: str):
        """Probar endpoint GET /listings/{listing_id}/videos"""
        print("\n🎥 === TESTING GET LISTING VIDEOS ===")
        try:
            response = requests.get(f"{BASE_URL}/listings/{listing_id}/videos")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Successfully retrieved videos")
                print(f"   📊 Total videos: {data.get('total', 0)}")
                
                for video in data.get('videos', []):
                    print(f"   🎬 Video: {video.get('filename', 'N/A')}")
                    print(f"      ID: {video.get('id', 'N/A')}")
                    print(f"      Duration: {video.get('duration_seconds', 0)}s")
                    print(f"      Order: {video.get('display_order', 0)}")
            else:
                print(f"❌ Failed to get videos: {response.text}")
                
        except Exception as e:
            print(f"❌ Error getting videos: {str(e)}")

    def test_upload_url_generation(self):
        """Probar endpoint POST /media/upload-url"""
        print("\n🔗 === TESTING UPLOAD URL GENERATION ===")
        
        # Probar para imagen
        try:
            image_request = {
                "filename": "test_image.jpg",
                "content_type": "image/jpeg",
                "size": 1024000  # 1MB
            }
            
            response = requests.post(
                f"{BASE_URL}/media/upload-url",
                json=image_request,
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Image upload URL generated successfully")
                print(f"   📤 Upload URL: {data.get('upload_url', '')[:50]}...")
                print(f"   🔗 File URL: {data.get('file_url', '')}")
                print(f"   ⏰ Expires at: {data.get('expires_at', 'N/A')}")
                print(f"   🆔 Upload ID: {data.get('upload_id', 'N/A')}")
            else:
                print(f"❌ Failed to generate image upload URL: {response.text}")
                
        except Exception as e:
            print(f"❌ Error generating image upload URL: {str(e)}")
        
        # Probar para video
        try:
            video_request = {
                "filename": "test_video.mp4",
                "content_type": "video/mp4",
                "size": 50000000  # 50MB
            }
            
            response = requests.post(
                f"{BASE_URL}/media/upload-url",
                json=video_request,
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Video upload URL generated successfully")
                print(f"   📤 Upload URL: {data.get('upload_url', '')[:50]}...")
                print(f"   🔗 File URL: {data.get('file_url', '')}")
                print(f"   ⏰ Expires at: {data.get('expires_at', 'N/A')}")
                print(f"   🆔 Upload ID: {data.get('upload_id', 'N/A')}")
            else:
                print(f"❌ Failed to generate video upload URL: {response.text}")
                
        except Exception as e:
            print(f"❌ Error generating video upload URL: {str(e)}")

    def test_invalid_content_types(self):
        """Probar tipos de contenido no válidos"""
        print("\n⚠️ === TESTING INVALID CONTENT TYPES ===")
        
        invalid_requests = [
            {
                "filename": "document.pdf",
                "content_type": "application/pdf",
                "size": 1000000
            },
            {
                "filename": "audio.mp3", 
                "content_type": "audio/mpeg",
                "size": 5000000
            },
            {
                "filename": "executable.exe",
                "content_type": "application/octet-stream", 
                "size": 10000000
            }
        ]
        
        for request_data in invalid_requests:
            try:
                response = requests.post(
                    f"{BASE_URL}/media/upload-url",
                    json=request_data,
                    headers=self.get_headers()
                )
                
                if response.status_code == 422 or response.status_code == 400:
                    print(f"✅ Correctly rejected {request_data['content_type']}")
                    print(f"   📄 File: {request_data['filename']}")
                    print(f"   ❌ Status: {response.status_code}")
                else:
                    print(f"⚠️ Unexpected response for {request_data['content_type']}: {response.status_code}")
                    
            except Exception as e:
                print(f"❌ Error testing {request_data['content_type']}: {str(e)}")

    def test_media_operations_without_listing(self):
        """Probar operaciones de media con listing inexistente"""
        print("\n🚫 === TESTING OPERATIONS WITH NON-EXISTENT LISTING ===")
        
        fake_listing_id = "00000000-0000-0000-0000-000000000000"
        
        # Probar GET images
        try:
            response = requests.get(f"{BASE_URL}/listings/{fake_listing_id}/images")
            print(f"📸 GET images with fake listing - Status: {response.status_code}")
            
        except Exception as e:
            print(f"❌ Error testing GET images: {str(e)}")
        
        # Probar GET videos
        try:
            response = requests.get(f"{BASE_URL}/listings/{fake_listing_id}/videos")
            print(f"🎥 GET videos with fake listing - Status: {response.status_code}")
            
        except Exception as e:
            print(f"❌ Error testing GET videos: {str(e)}")

    def cleanup_test_listing(self):
        """Limpiar el listing de prueba creado"""
        if self.created_listing_id:
            print(f"\n🧹 === CLEANING UP TEST LISTING ===")
            try:
                response = requests.delete(
                    f"{BASE_URL}/listings/{self.created_listing_id}",
                    headers=self.get_headers()
                )
                
                if response.status_code in [200, 204]:
                    print(f"✅ Successfully deleted test listing: {self.created_listing_id}")
                else:
                    print(f"⚠️ Could not delete test listing: {response.text}")
                    
            except Exception as e:
                print(f"❌ Error deleting test listing: {str(e)}")

    def run_media_tests(self):
        """Ejecutar todos los tests de media management"""
        print("🎬 Starting Media Management API Tests")
        print("=" * 60)
        
        # Autenticar
        if not self.authenticate():
            print("❌ Authentication failed, cannot continue")
            return
        
        # Crear listing de prueba
        listing_id = self.create_test_listing()
        if not listing_id:
            print("❌ Could not create test listing, cannot continue")
            return
        
        time.sleep(1)
        
        # Ejecutar tests
        self.test_get_listing_images(listing_id)
        self.test_get_listing_videos(listing_id)
        self.test_upload_url_generation()
        self.test_invalid_content_types()
        self.test_media_operations_without_listing()
        
        # Cleanup
        self.cleanup_test_listing()
        
        print("\n🎯 === MEDIA MANAGEMENT TESTS COMPLETE ===")
        print("All media management endpoints have been tested!")

if __name__ == "__main__":
    tester = MediaManagementTester()
    tester.run_media_tests()
