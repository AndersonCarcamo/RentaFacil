"""
Servicio de OCR para extracción de datos de DNI peruano
"""
import re
import cv2
import numpy as np
from PIL import Image
import pytesseract
from typing import Dict, Optional, List
from loguru import logger
import unicodedata


class DNIOCRService:
    """Servicio para procesar y extraer información de DNI peruano"""
    
    # Patrones regex para extraer información del DNI peruano
    DNI_NUMBER_PATTERN = r'\b\d{8}\b'
    NAME_PATTERNS = [
        r'APELLIDOS\s+Y\s+NOMBRES[:\s]*([A-ZÁÉÍÓÚÑ\s]+)',
        r'NOMBRES[:\s]*([A-ZÁÉÍÓÚÑ\s]+)',
        r'APELLIDOS[:\s]*([A-ZÁÉÍÓÚÑ\s]+)'
    ]
    DATE_PATTERN = r'\b(\d{2})[/\-\.](\d{2})[/\-\.](\d{4})\b'
    
    @staticmethod
    def preprocess_image(image_path: str) -> np.ndarray:
        """
        Preprocesa la imagen para mejorar la calidad del OCR
        
        Args:
            image_path: Ruta de la imagen a procesar
            
        Returns:
            Imagen preprocesada en formato numpy array
        """
        try:
            # Leer imagen
            img = cv2.imread(image_path)
            if img is None:
                raise ValueError(f"No se pudo leer la imagen: {image_path}")
            
            # Convertir a escala de grises
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Aplicar threshold adaptativo para mejorar contraste
            thresh = cv2.adaptiveThreshold(
                gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                cv2.THRESH_BINARY, 11, 2
            )
            
            # Denoise
            denoised = cv2.fastNlMeansDenoising(thresh)
            
            # Aumentar contraste
            kernel = np.ones((1, 1), np.uint8)
            processed = cv2.dilate(denoised, kernel, iterations=1)
            processed = cv2.erode(processed, kernel, iterations=1)
            
            return processed
            
        except Exception as e:
            logger.error(f"Error al preprocesar imagen: {str(e)}")
            raise
    
    @staticmethod
    def extract_text_from_image(image_path: str) -> str:
        """
        Extrae texto de una imagen usando OCR
        
        Args:
            image_path: Ruta de la imagen
            
        Returns:
            Texto extraído
        """
        try:
            # Preprocesar imagen
            processed_img = DNIOCRService.preprocess_image(image_path)
            
            # Configuración de Tesseract para español
            custom_config = r'--oem 3 --psm 6 -l spa'
            
            # Extraer texto
            text = pytesseract.image_to_string(processed_img, config=custom_config)
            
            logger.info(f"Texto extraído (primeros 200 chars): {text[:200]}")
            return text
            
        except Exception as e:
            logger.error(f"Error al extraer texto: {str(e)}")
            raise
    
    @staticmethod
    def normalize_text(text: str) -> str:
        """
        Normaliza texto eliminando acentos y caracteres especiales
        
        Args:
            text: Texto a normalizar
            
        Returns:
            Texto normalizado
        """
        # Eliminar acentos
        nfkd = unicodedata.normalize('NFKD', text)
        text_without_accents = ''.join([c for c in nfkd if not unicodedata.combining(c)])
        
        # Convertir a mayúsculas y eliminar espacios extras
        normalized = ' '.join(text_without_accents.upper().split())
        
        return normalized
    
    @staticmethod
    def extract_dni_number(text: str) -> Optional[str]:
        """
        Extrae el número de DNI del texto
        
        Args:
            text: Texto donde buscar el DNI
            
        Returns:
            Número de DNI o None si no se encuentra
        """
        # Buscar patrón de 8 dígitos
        matches = re.findall(DNIOCRService.DNI_NUMBER_PATTERN, text)
        
        if matches:
            # Retornar el primer número de 8 dígitos encontrado
            # (usualmente el DNI aparece cerca del inicio)
            logger.info(f"DNI encontrado: {matches[0]}")
            return matches[0]
        
        logger.warning("No se encontró número de DNI en el texto")
        return None
    
    @staticmethod
    def extract_names(text: str) -> Dict[str, str]:
        """
        Extrae nombres y apellidos del texto
        
        Args:
            text: Texto donde buscar nombres
            
        Returns:
            Diccionario con nombres y apellidos
        """
        result = {
            'first_name': '',
            'last_name': '',
            'full_name': ''
        }
        
        # Normalizar texto
        normalized = DNIOCRService.normalize_text(text)
        
        # Buscar líneas que contengan nombres
        lines = normalized.split('\n')
        
        # Patrones comunes en DNI peruano
        for line in lines:
            # Buscar "APELLIDOS Y NOMBRES"
            if 'APELLIDOS' in line and 'NOMBRES' in line:
                # La siguiente línea suele contener el nombre completo
                idx = lines.index(line)
                if idx + 1 < len(lines):
                    full_name = lines[idx + 1].strip()
                    # Limpiar caracteres no alfabéticos
                    full_name = re.sub(r'[^A-Z\s]', '', full_name).strip()
                    
                    if full_name and len(full_name) > 3:
                        # Intentar separar en apellidos y nombres
                        # Formato típico: APELLIDO1 APELLIDO2 NOMBRE1 NOMBRE2
                        parts = full_name.split()
                        if len(parts) >= 2:
                            # Asumir que los primeros 2 son apellidos
                            result['last_name'] = ' '.join(parts[:2])
                            result['first_name'] = ' '.join(parts[2:]) if len(parts) > 2 else parts[0]
                        else:
                            result['last_name'] = parts[0]
                        
                        result['full_name'] = full_name
                        break
        
        # Fallback: buscar cualquier línea con solo letras mayúsculas y espacios
        if not result['full_name']:
            for line in lines:
                cleaned = re.sub(r'[^A-Z\s]', '', line).strip()
                if cleaned and len(cleaned) > 10 and len(cleaned.split()) >= 2:
                    result['full_name'] = cleaned
                    parts = cleaned.split()
                    result['last_name'] = ' '.join(parts[:2])
                    result['first_name'] = ' '.join(parts[2:]) if len(parts) > 2 else ''
                    break
        
        logger.info(f"Nombres extraídos: {result}")
        return result
    
    @staticmethod
    def extract_birth_date(text: str) -> Optional[str]:
        """
        Extrae fecha de nacimiento del texto
        
        Args:
            text: Texto donde buscar la fecha
            
        Returns:
            Fecha en formato DD/MM/YYYY o None
        """
        matches = re.findall(DNIOCRService.DATE_PATTERN, text)
        
        if matches:
            # Retornar la primera fecha encontrada
            day, month, year = matches[0]
            date_str = f"{day}/{month}/{year}"
            logger.info(f"Fecha de nacimiento encontrada: {date_str}")
            return date_str
        
        logger.warning("No se encontró fecha de nacimiento")
        return None
    
    @staticmethod
    def process_dni_image(image_path: str) -> Dict[str, any]:
        """
        Procesa una imagen de DNI y extrae toda la información posible
        
        Args:
            image_path: Ruta de la imagen del DNI
            
        Returns:
            Diccionario con la información extraída
        """
        try:
            # Extraer texto
            text = DNIOCRService.extract_text_from_image(image_path)
            
            # Extraer información
            dni_number = DNIOCRService.extract_dni_number(text)
            names = DNIOCRService.extract_names(text)
            birth_date = DNIOCRService.extract_birth_date(text)
            
            result = {
                'success': True,
                'dni_number': dni_number,
                'first_name': names.get('first_name', ''),
                'last_name': names.get('last_name', ''),
                'full_name': names.get('full_name', ''),
                'birth_date': birth_date,
                'raw_text': text,
                'confidence': 'high' if dni_number and names.get('full_name') else 'low'
            }
            
            logger.info(f"Procesamiento exitoso: {result}")
            return result
            
        except Exception as e:
            logger.error(f"Error al procesar DNI: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'dni_number': None,
                'first_name': '',
                'last_name': '',
                'full_name': '',
                'birth_date': None,
                'raw_text': '',
                'confidence': 'none'
            }
    
    @staticmethod
    def validate_dni_data(
        extracted_data: Dict[str, any],
        user_first_name: str,
        user_last_name: str,
        user_dni: Optional[str] = None
    ) -> Dict[str, any]:
        """
        Valida que los datos extraídos coincidan con los datos del usuario
        
        Args:
            extracted_data: Datos extraídos del DNI
            user_first_name: Nombre del usuario en el sistema
            user_last_name: Apellido del usuario en el sistema
            user_dni: DNI del usuario en el sistema (opcional)
            
        Returns:
            Diccionario con el resultado de la validación
        """
        validation_result = {
            'is_valid': False,
            'matches': [],
            'mismatches': [],
            'confidence_score': 0.0
        }
        
        matches_count = 0
        total_checks = 0
        
        # Normalizar datos del usuario
        user_first_normalized = DNIOCRService.normalize_text(user_first_name)
        user_last_normalized = DNIOCRService.normalize_text(user_last_name)
        
        # Validar DNI
        if user_dni and extracted_data.get('dni_number'):
            total_checks += 1
            if user_dni == extracted_data['dni_number']:
                matches_count += 1
                validation_result['matches'].append('dni_number')
            else:
                validation_result['mismatches'].append({
                    'field': 'dni_number',
                    'expected': user_dni,
                    'found': extracted_data['dni_number']
                })
        
        # Validar nombres (verificar similitud)
        extracted_first = DNIOCRService.normalize_text(extracted_data.get('first_name', ''))
        extracted_last = DNIOCRService.normalize_text(extracted_data.get('last_name', ''))
        
        if extracted_first and user_first_normalized:
            total_checks += 1
            # Verificar si hay coincidencia parcial
            if user_first_normalized in extracted_first or extracted_first in user_first_normalized:
                matches_count += 1
                validation_result['matches'].append('first_name')
            else:
                validation_result['mismatches'].append({
                    'field': 'first_name',
                    'expected': user_first_normalized,
                    'found': extracted_first
                })
        
        if extracted_last and user_last_normalized:
            total_checks += 1
            # Verificar si hay coincidencia parcial en apellidos
            if user_last_normalized in extracted_last or extracted_last in user_last_normalized:
                matches_count += 1
                validation_result['matches'].append('last_name')
            else:
                validation_result['mismatches'].append({
                    'field': 'last_name',
                    'expected': user_last_normalized,
                    'found': extracted_last
                })
        
        # Calcular score de confianza
        if total_checks > 0:
            validation_result['confidence_score'] = matches_count / total_checks
            validation_result['is_valid'] = validation_result['confidence_score'] >= 0.7
        
        logger.info(f"Validación completada: {validation_result}")
        return validation_result


# Instancia global del servicio
dni_ocr_service = DNIOCRService()
