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
    def get_tesseract_version() -> str:
        """
        Obtiene la versión instalada de Tesseract
        
        Returns:
            String con la versión de Tesseract
        """
        try:
            version = pytesseract.get_tesseract_version()
            return str(version)
        except Exception as e:
            logger.error(f"Error obteniendo versión de Tesseract: {str(e)}")
            return "unknown"
    
    @staticmethod
    def detect_dni_regions(image: np.ndarray) -> Dict[str, tuple]:
        """
        Detecta las regiones de interés (ROI) del DNI peruano
        
        Args:
            image: Imagen en escala de grises
            
        Returns:
            Diccionario con las coordenadas (x, y, w, h) de cada región
        """
        height, width = image.shape[:2]
        
        # Basado en el layout estándar del DNI peruano
        regions = {
            # Zona superior izquierda: Apellidos y Nombres
            'nombres': (int(width * 0.10), int(height * 0.30), int(width * 0.60), int(height * 0.15)),
            
            # Zona central: Número de DNI (8 dígitos grandes)
            'dni_numero': (int(width * 0.10), int(height * 0.50), int(width * 0.40), int(height * 0.12)),
            
            # Zona inferior: Fecha de nacimiento
            'fecha_nacimiento': (int(width * 0.10), int(height * 0.65), int(width * 0.35), int(height * 0.10)),
            
            # Zona MRZ (Machine Readable Zone) - parte inferior
            'mrz': (int(width * 0.05), int(height * 0.80), int(width * 0.90), int(height * 0.15))
        }
        
        return regions
    
    @staticmethod
    def extract_roi(image: np.ndarray, region: tuple) -> np.ndarray:
        """
        Extrae una región de interés de la imagen
        
        Args:
            image: Imagen completa
            region: Tupla (x, y, w, h) con las coordenadas de la región
            
        Returns:
            Imagen recortada de la región
        """
        x, y, w, h = region
        # Asegurar que las coordenadas estén dentro de los límites
        x = max(0, x)
        y = max(0, y)
        w = min(w, image.shape[1] - x)
        h = min(h, image.shape[0] - y)
        
        return image[y:y+h, x:x+w]
    
    @staticmethod
    def deskew_image(image: np.ndarray) -> np.ndarray:
        """
        Corrige la inclinación de la imagen usando detección de bordes y transformación
        
        Args:
            image: Imagen en escala de grises
            
        Returns:
            Imagen corregida
        """
        try:
            # Detectar bordes
            edges = cv2.Canny(image, 50, 150, apertureSize=3)
            
            # Detectar líneas usando Hough Transform
            lines = cv2.HoughLinesP(edges, 1, np.pi/180, 100, minLineLength=100, maxLineGap=10)
            
            if lines is not None and len(lines) > 0:
                # Calcular ángulos de todas las líneas
                angles = []
                for line in lines:
                    x1, y1, x2, y2 = line[0]
                    angle = np.arctan2(y2 - y1, x2 - x1) * 180 / np.pi
                    # Solo considerar líneas casi horizontales (±20 grados)
                    if abs(angle) < 20:
                        angles.append(angle)
                
                if angles:
                    # Calcular la mediana del ángulo para robustez
                    median_angle = np.median(angles)
                    
                    # Solo corregir si el ángulo es significativo (>0.5 grados)
                    if abs(median_angle) > 0.5:
                        # Rotar imagen
                        (h, w) = image.shape[:2]
                        center = (w // 2, h // 2)
                        M = cv2.getRotationMatrix2D(center, median_angle, 1.0)
                        rotated = cv2.warpAffine(image, M, (w, h), 
                                                flags=cv2.INTER_CUBIC, 
                                                borderMode=cv2.BORDER_REPLICATE)
                        logger.info(f"Imagen corregida con ángulo: {median_angle:.2f}°")
                        return rotated
            
            return image
            
        except Exception as e:
            logger.warning(f"No se pudo corregir inclinación: {str(e)}")
            return image
    
    @staticmethod
    def preprocess_image(image_path: str) -> np.ndarray:
        """
        Preprocesa la imagen para mejorar la calidad del OCR
        Pipeline completo optimizado para DNI peruano
        
        Pipeline:
        1. Conversión a escala de grises
        2. Corrección de inclinación (deskew)
        3. Detección y mejora de bordes
        4. Mejora de contraste (CLAHE)
        5. Reducción de ruido
        6. Sharpening
        7. Binarización adaptativa
        
        Args:
            image_path: Ruta de la imagen a procesar
            
        Returns:
            Imagen preprocesada en formato numpy array
        """
        try:
            # 1. Leer imagen
            img = cv2.imread(image_path)
            if img is None:
                raise ValueError(f"No se pudo leer la imagen: {image_path}")
            
            logger.info(f"Imagen original: {img.shape}")
            
            # 2. Redimensionar manteniendo proporción del DNI (1.59:1)
            target_width = 1600
            target_height = int(target_width / 1.59)
            img = cv2.resize(img, (target_width, target_height), interpolation=cv2.INTER_LANCZOS4)
            
            # 3. Convertir a escala de grises
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            logger.info(f"Convertido a escala de grises: {gray.shape}")
            
            # 4. Corrección de inclinación (deskew)
            deskewed = DNIOCRService.deskew_image(gray)
            
            # 5. Mejora de contraste con CLAHE (maneja bien iluminación irregular)
            clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
            contrast_enhanced = clahe.apply(deskewed)
            logger.info("Contraste mejorado con CLAHE")
            
            # 6. Reducción de ruido preservando bordes
            denoised = cv2.fastNlMeansDenoising(
                contrast_enhanced, 
                None, 
                h=10,  # Fuerza del filtro
                templateWindowSize=7, 
                searchWindowSize=21
            )
            logger.info("Ruido reducido")
            
            # 7. Sharpening para mejorar nitidez del texto
            kernel_sharpening = np.array([
                [-1, -1, -1],
                [-1,  9, -1],
                [-1, -1, -1]
            ])
            sharpened = cv2.filter2D(denoised, -1, kernel_sharpening)
            logger.info("Imagen sharpened")
            
            # 8. Binarización adaptativa (mejor para fondos irregulares)
            binary = cv2.adaptiveThreshold(
                sharpened, 
                255, 
                cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                cv2.THRESH_BINARY, 
                blockSize=11,  # Tamaño del vecindario
                C=2  # Constante sustraída de la media
            )
            logger.info("Binarización adaptativa aplicada")
            
            # 9. Morfología para limpiar pequeñas imperfecciones
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 1))
            processed = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
            
            # 10. Invertir si es necesario (el texto debe ser negro sobre blanco)
            # Contar píxeles blancos vs negros
            white_pixels = np.sum(processed == 255)
            black_pixels = np.sum(processed == 0)
            if white_pixels < black_pixels:
                processed = cv2.bitwise_not(processed)
                logger.info("Imagen invertida para texto negro sobre blanco")
            
            logger.info(f"Preprocesamiento completo: {img.shape} -> {processed.shape}")
            return processed
            
        except Exception as e:
            logger.error(f"Error al preprocesar imagen: {str(e)}")
            raise
    
    @staticmethod
    def extract_text_from_regions(image_path: str) -> Dict[str, str]:
        """
        Extrae texto de regiones específicas del DNI
        
        Args:
            image_path: Ruta de la imagen del DNI
            
        Returns:
            Diccionario con el texto extraído de cada región
        """
        try:
            # Preprocesar imagen completa
            processed_img = DNIOCRService.preprocess_image(image_path)
            
            # Detectar regiones del DNI
            regions = DNIOCRService.detect_dni_regions(processed_img)
            
            extracted_texts = {}
            
            # Extraer texto de cada región con configuración específica
            for region_name, coords in regions.items():
                roi = DNIOCRService.extract_roi(processed_img, coords)
                
                if roi.size == 0:
                    logger.warning(f"Región {region_name} vacía")
                    continue
                
                # Configuración específica según la región
                if region_name == 'mrz':
                    # MRZ usa fuente monoespaciada, PSM 7 funciona mejor
                    config = r'--oem 3 --psm 7 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<'
                elif region_name == 'dni_numero':
                    # Solo números para el DNI
                    config = r'--oem 3 --psm 7 -c tessedit_char_whitelist=0123456789'
                else:
                    # Texto normal con letras y espacios
                    config = r'--oem 3 --psm 6 -l spa'
                
                try:
                    text = pytesseract.image_to_string(roi, config=config)
                    extracted_texts[region_name] = text.strip()
                    logger.info(f"Región {region_name}: '{text.strip()[:50]}'")
                except Exception as e:
                    logger.warning(f"Error extrayendo región {region_name}: {str(e)}")
                    extracted_texts[region_name] = ""
            
            return extracted_texts
            
        except Exception as e:
            logger.error(f"Error al extraer texto por regiones: {str(e)}")
            raise
    
    @staticmethod
    def extract_text_from_image(image_path: str) -> str:
        """
        Extrae texto de una imagen usando OCR con múltiples configuraciones
        para maximizar la precisión. Combina extracción por regiones + texto completo
        
        Args:
            image_path: Ruta de la imagen
            
        Returns:
            Texto extraído (combinado de todas las regiones)
        """
        try:
            # Extraer por regiones primero
            region_texts = DNIOCRService.extract_text_from_regions(image_path)
            
            # Combinar textos de regiones (priorizar regiones específicas)
            combined_text = "\n".join([
                f"[NOMBRES] {region_texts.get('nombres', '')}",
                f"[DNI] {region_texts.get('dni_numero', '')}",
                f"[FECHA_NAC] {region_texts.get('fecha_nacimiento', '')}",
                f"[MRZ] {region_texts.get('mrz', '')}"
            ])
            
            logger.info(f"Texto combinado de regiones (primeros 200 chars): {combined_text[:200]}")
            
            # También extraer texto completo como respaldo
            processed_img = DNIOCRService.preprocess_image(image_path)
            full_text = pytesseract.image_to_string(processed_img, config=r'--oem 3 --psm 6 -l spa')
            
            # Retornar combinación: regiones etiquetadas + texto completo
            return f"{combined_text}\n\n[FULL_TEXT]\n{full_text}"
            
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
        Extrae el número de DNI del texto con validaciones adicionales
        Busca primero en la región [DNI], luego en MRZ, luego en texto completo
        
        Args:
            text: Texto donde buscar el DNI (puede contener etiquetas de región)
            
        Returns:
            Número de DNI o None si no se encuentra
        """
        # Buscar primero en la región específica del DNI
        dni_region = re.search(r'\[DNI\]\s*([^\[]+)', text)
        if dni_region:
            dni_text = dni_region.group(1)
            # Extraer solo números consecutivos de 8 dígitos
            dni_match = re.search(r'\b(\d{8})\b', dni_text)
            if dni_match:
                dni_num = int(dni_match.group(1))
                if 10000000 <= dni_num <= 99999999:
                    logger.info(f"DNI encontrado en región [DNI]: {dni_match.group(1)}")
                    return dni_match.group(1)
        
        # Buscar en la zona MRZ (Machine Readable Zone)
        mrz_region = re.search(r'\[MRZ\]\s*([^\[]+)', text)
        if mrz_region:
            mrz_text = mrz_region.group(1)
            # En MRZ, el DNI está en la segunda línea, primeros 8 dígitos después de PER
            mrz_dni = re.search(r'PER[<\s]*(\d{8})', mrz_text)
            if mrz_dni:
                logger.info(f"DNI encontrado en MRZ: {mrz_dni.group(1)}")
                return mrz_dni.group(1)
        
        # Fallback: buscar en todo el texto
        # Limpiar caracteres que pueden confundirse
        cleaned_text = text.replace('O', '0').replace('o', '0')
        cleaned_text = cleaned_text.replace('I', '1').replace('l', '1')
        cleaned_text = cleaned_text.replace('S', '5').replace('s', '5')
        
        # Buscar patrón de 8 dígitos
        matches = re.findall(r'\b(\d{8})\b', cleaned_text)
        
        if matches:
            # Filtrar números inválidos (fechas en formato YYYYMMDD, etc.)
            valid_dnis = []
            for match in matches:
                dni_num = int(match)
                # DNI peruano válido: 10000000 - 99999999
                # Excluir fechas (años 1900-2099)
                if 10000000 <= dni_num <= 99999999:
                    year_like = int(match[:4])
                    if year_like < 1900 or year_like > 2099:  # No es una fecha
                        valid_dnis.append(match)
            
            if valid_dnis:
                # Retornar el primer DNI válido
                logger.info(f"DNI encontrado: {valid_dnis[0]} (de {len(matches)} números de 8 dígitos)")
                return valid_dnis[0]
            elif matches:
                # Si no hay válidos pero hay matches, retornar el primero
                logger.warning(f"DNI encontrado pero fuera de rango típico: {matches[0]}")
                return matches[0]
        
        logger.warning("No se encontró número de DNI válido en el texto")
        return None
    
    @staticmethod
    def extract_names(text: str) -> Dict[str, str]:
        """
        Extrae nombres y apellidos del texto usando múltiples estrategias
        Prioriza la región [NOMBRES], luego busca en MRZ, luego en texto completo
        
        Args:
            text: Texto donde buscar nombres (puede contener etiquetas de región)
            
        Returns:
            Diccionario con nombres y apellidos
        """
        result = {
            'first_name': '',
            'last_name': '',
            'full_name': ''
        }
        
        # Estrategia 1: Buscar en la región [NOMBRES]
        nombres_region = re.search(r'\[NOMBRES\]\s*([^\[]+)', text)
        if nombres_region:
            nombres_text = nombres_region.group(1).strip()
            # Limpiar y extraer solo letras y espacios
            cleaned = re.sub(r'[^A-ZÁÉÍÓÚÑ\s]', '', nombres_text.upper())
            cleaned = ' '.join(cleaned.split())  # Normalizar espacios
            
            if len(cleaned) > 8:  # Mínimo razonable para un nombre completo
                words = cleaned.split()
                if len(words) >= 2:
                    # DNI peruano formato: APELLIDO_PATERNO APELLIDO_MATERNO NOMBRE(S)
                    result['full_name'] = cleaned
                    if len(words) >= 3:
                        result['last_name'] = ' '.join(words[:2])
                        result['first_name'] = ' '.join(words[2:])
                    else:
                        result['last_name'] = words[0]
                        result['first_name'] = ' '.join(words[1:])
                    
                    logger.info(f"Nombres extraídos de región [NOMBRES]: {result}")
                    return result
        
        # Estrategia 2: Buscar en MRZ (tercera línea)
        mrz_region = re.search(r'\[MRZ\]\s*([^\[]+)', text)
        if mrz_region:
            mrz_text = mrz_region.group(1)
            # En MRZ, tercera línea tiene formato: APELLIDOS<NOMBRES<<<<
            mrz_lines = [line.strip() for line in mrz_text.split('\n') if line.strip()]
            if len(mrz_lines) >= 3:
                name_line = mrz_lines[2]  # Tercera línea
                # Dividir por < y limpiar
                parts = [p.strip() for p in name_line.split('<') if p.strip()]
                if len(parts) >= 2:
                    result['last_name'] = parts[0].replace('<', ' ').strip()
                    result['first_name'] = parts[1].replace('<', ' ').strip()
                    result['full_name'] = f"{result['last_name']} {result['first_name']}"
                    logger.info(f"Nombres extraídos de MRZ: {result}")
                    return result
        
        # Estrategia 3: Buscar en texto completo (fallback)
        # Buscar después de palabras clave
        full_text_region = re.search(r'\[FULL_TEXT\]\s*(.+)', text, re.DOTALL)
        search_text = full_text_region.group(1) if full_text_region else text
        
        normalized = DNIOCRService.normalize_text(search_text)
        lines = normalized.split('\n')
        
        # Buscar después de "APELLIDOS Y NOMBRES" o "NOMBRES"
        for i, line in enumerate(lines):
            if ('APELLIDOS' in line and 'NOMBRES' in line) or 'NOMBRES' in line:
                # Buscar en las siguientes 3 líneas
                for j in range(i + 1, min(i + 4, len(lines))):
                    candidate = lines[j].strip()
                    # Limpiar y validar
                    candidate = re.sub(r'[^A-ZÁÉÍÓÚÑ\s]', '', candidate).strip()
                    
                    if len(candidate) > 8 and len(candidate.split()) >= 2:
                        result['full_name'] = candidate
                        parts = candidate.split()
                        if len(parts) >= 3:
                            result['last_name'] = ' '.join(parts[:2])
                            result['first_name'] = ' '.join(parts[2:])
                        else:
                            result['last_name'] = parts[0]
                            result['first_name'] = ' '.join(parts[1:])
                        logger.info(f"Nombres extraídos (estrategia keyword): {result}")
                        return result
        
        # Buscar línea con solo mayúsculas y espacios (nombre completo)
        for line in lines:
            cleaned = re.sub(r'[^A-ZÁÉÍÓÚÑ\s]', '', line).strip()
            words = cleaned.split()
            
            # Debe tener al menos 2 palabras y más de 8 caracteres
            if len(cleaned) > 8 and len(words) >= 2:
                # Verificar que no sea un encabezado común
                skip_words = {'REPUBLICA', 'PERU', 'PERUANO', 'DOCUMENTO', 'IDENTIDAD', 
                             'NACIONAL', 'REGISTRO', 'ELECTORAL', 'FIRMA', 'TITULAR',
                             'FECHA', 'INSCRIPCION', 'EMISION', 'CADUCIDAD'}
                if not any(word in skip_words for word in words):
                    result['full_name'] = cleaned
                    
                    # Separar nombres
                    if len(words) >= 3:
                        result['last_name'] = ' '.join(words[:2])
                        result['first_name'] = ' '.join(words[2:])
                    else:
                        result['last_name'] = words[0]
                        result['first_name'] = words[1] if len(words) > 1 else ''
                    
                    logger.info(f"Nombres extraídos (estrategia 2): {result}")
                    return result
        
        # Estrategia 3: Buscar después de campos conocidos
        field_markers = ['APELLIDOS', 'NOMBRES', 'APELL', 'NOMB']
        for i, line in enumerate(lines):
            if any(marker in line for marker in field_markers):
                # Intentar siguiente línea
                if i + 1 < len(lines):
                    candidate = re.sub(r'[^A-Z\s]', '', lines[i + 1]).strip()
                    if len(candidate) > 5:
                        result['full_name'] = candidate
                        parts = candidate.split()
                        if len(parts) >= 2:
                            result['last_name'] = parts[0]
                            result['first_name'] = ' '.join(parts[1:])
                        logger.info(f"Nombres extraídos (estrategia 3): {result}")
                        return result
        
        logger.warning(f"No se pudieron extraer nombres claramente. Texto: {normalized[:200]}")
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
            'dni_match': False,
            'name_match': False,
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
        dni_match = False
        if user_dni and extracted_data.get('dni_number'):
            total_checks += 1
            if user_dni == extracted_data['dni_number']:
                matches_count += 1
                dni_match = True
                validation_result['matches'].append('dni_number')
            else:
                validation_result['mismatches'].append(
                    f"DNI no coincide: esperado {user_dni}, encontrado {extracted_data['dni_number']}"
                )
        
        validation_result['dni_match'] = dni_match
        
        # Validar nombres (verificar similitud)
        extracted_first = DNIOCRService.normalize_text(extracted_data.get('first_name', ''))
        extracted_last = DNIOCRService.normalize_text(extracted_data.get('last_name', ''))
        
        name_match = False
        if extracted_first and user_first_normalized:
            total_checks += 1
            # Verificar si hay coincidencia parcial
            if user_first_normalized in extracted_first or extracted_first in user_first_normalized:
                matches_count += 1
                name_match = True
                validation_result['matches'].append('first_name')
            else:
                validation_result['mismatches'].append(
                    f"Nombre no coincide: esperado {user_first_normalized}, encontrado {extracted_first}"
                )
        
        if extracted_last and user_last_normalized:
            total_checks += 1
            # Verificar si hay coincidencia parcial en apellidos
            if user_last_normalized in extracted_last or extracted_last in user_last_normalized:
                matches_count += 1
                name_match = True
                validation_result['matches'].append('last_name')
            else:
                validation_result['mismatches'].append(
                    f"Apellido no coincide: esperado {user_last_normalized}, encontrado {extracted_last}"
                )
        
        validation_result['name_match'] = name_match
        
        # Calcular score de confianza
        if total_checks > 0:
            validation_result['confidence_score'] = matches_count / total_checks
        
        logger.info(f"Validación completada: {validation_result}")
        return validation_result


# Instancia global del servicio
dni_ocr_service = DNIOCRService()
