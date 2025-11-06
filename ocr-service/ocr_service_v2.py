"""
Servicio OCR simplificado y optimizado para DNI peruano
Enfoque: Preprocesamiento robusto + Extracción inteligente
"""

import cv2
import numpy as np
import pytesseract
import re
from typing import Dict, Optional, Tuple
from loguru import logger


class DNIOCRService:
    """Servicio para procesar imágenes de DNI peruano con OCR"""
    
    @staticmethod
    def deskew_image(image: np.ndarray) -> np.ndarray:
        """
        Corrige la inclinación de la imagen
        
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
                    # Calcular la mediana del ángulo
                    median_angle = np.median(angles)
                    
                    # Solo corregir si el ángulo es significativo
                    if abs(median_angle) > 0.5:
                        (h, w) = image.shape[:2]
                        center = (w // 2, h // 2)
                        M = cv2.getRotationMatrix2D(center, median_angle, 1.0)
                        rotated = cv2.warpAffine(image, M, (w, h), 
                                                flags=cv2.INTER_CUBIC, 
                                                borderMode=cv2.BORDER_REPLICATE)
                        logger.info(f"✓ Imagen corregida: {median_angle:.2f}°")
                        return rotated
            
            return image
            
        except Exception as e:
            logger.warning(f"No se pudo corregir inclinación: {str(e)}")
            return image
    
    @staticmethod
    def preprocess_image(image_path: str) -> np.ndarray:
        """
        Pipeline completo de preprocesamiento para DNI
        
        Pipeline:
        1. Conversión a escala de grises
        2. Corrección de inclinación
        3. Mejora de contraste (CLAHE)
        4. Reducción de ruido
        5. Sharpening
        6. Binarización adaptativa
        
        Args:
            image_path: Ruta de la imagen
            
        Returns:
            Imagen preprocesada
        """
        try:
            # Leer imagen
            img = cv2.imread(image_path)
            if img is None:
                raise ValueError(f"No se pudo leer la imagen: {image_path}")
            
            logger.info(f"📷 Imagen original: {img.shape}")
            
            # Convertir a escala de grises PRIMERO
            if len(img.shape) == 3:
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            else:
                gray = img.copy()
            
            logger.info(f"⚫ Escala de grises: {gray.shape}")
            
            # Escalar a tamaño óptimo (más grande para mejor OCR)
            height, width = gray.shape
            target_height = 1800  # Mayor resolución = mejor OCR
            scale = target_height / height
            target_width = int(width * scale)
            gray = cv2.resize(gray, (target_width, target_height), interpolation=cv2.INTER_CUBIC)
            logger.info(f"📐 Escalado: {width}x{height} -> {target_width}x{target_height}")
            
            # Corrección de inclinación
            deskewed = DNIOCRService.deskew_image(gray)
            logger.info("✓ Inclinación corregida")
            
            # CLAHE más agresivo para fotos de cámara
            clahe = cv2.createCLAHE(clipLimit=4.0, tileGridSize=(8, 8))
            contrast_enhanced = clahe.apply(deskewed)
            logger.info("✓ Contraste mejorado (agresivo)")
            
            # Sharpening ANTES de denoise (crítico para texto)
            kernel_sharpening = np.array([
                [-1, -1, -1],
                [-1, 12, -1],
                [-1, -1, -1]
            ])
            sharpened = cv2.filter2D(contrast_enhanced, -1, kernel_sharpening)
            logger.info("✓ Sharpening aplicado")
            
            # Reducción de ruido SUAVE (no destruir texto)
            denoised = cv2.fastNlMeansDenoising(sharpened, None, h=5)
            logger.info("✓ Ruido reducido (suave)")
            
            # Binarización Otsu (mejor que adaptativa para DNI)
            _, binary = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            logger.info("✓ Binarización Otsu")
            
            # Closing pequeño para conectar letras
            kernel = np.ones((1, 2), np.uint8)
            processed = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
            
            # Invertir si el texto quedó blanco
            if np.mean(processed) > 127:
                processed = cv2.bitwise_not(processed)
                logger.info("✓ Imagen invertida (texto negro)")
            
            logger.info(f"✅ Preprocesamiento completo: {processed.shape}")
            return processed
            
        except Exception as e:
            logger.error(f"❌ Error al preprocesar: {str(e)}")
            raise
    
    @staticmethod
    def extract_text_from_image(image_path: str) -> Tuple[str, float]:
        """
        Extrae texto usando Tesseract con configuración optimizada
        
        Args:
            image_path: Ruta de la imagen
            
        Returns:
            Tupla (texto, confianza)
        """
        try:
            # Preprocesar
            processed_img = DNIOCRService.preprocess_image(image_path)
            
            # Guardar para debug
            debug_path = image_path.replace('.jpg', '_processed.jpg').replace('.png', '_processed.png')
            cv2.imwrite(debug_path, processed_img)
            logger.info(f"💾 Debug: {debug_path}")
            
            # Configuraciones de Tesseract OPTIMIZADAS para DNI
            configs = [
                '--oem 1 --psm 6 -l spa',   # LSTM + bloque uniforme (mejor para DNI)
                '--oem 1 --psm 4 -l spa',   # LSTM + columna de texto
                '--oem 3 --psm 6 -l spa',   # Híbrido + bloque uniforme
                '--oem 1 --psm 11 -l spa',  # LSTM + texto disperso
            ]
            
            best_text = ""
            best_confidence = 0.0
            
            for config in configs:
                try:
                    # Extraer con confianza
                    data = pytesseract.image_to_data(
                        processed_img, 
                        lang='spa',
                        config=config,
                        output_type=pytesseract.Output.DICT
                    )
                    
                    # Calcular confianza
                    confidences = [int(conf) for conf in data['conf'] if int(conf) > 0]
                    avg_confidence = sum(confidences) / len(confidences) if confidences else 0
                    
                    # Extraer texto
                    text = pytesseract.image_to_string(
                        processed_img,
                        lang='spa',
                        config=config
                    )
                    
                    text_len = len(text.strip())
                    logger.info(f"⚙️  PSM {config.split('psm')[1][:3]}: conf={avg_confidence:.1f}%, len={text_len}")
                    
                    # Mantener mejor resultado
                    if avg_confidence > best_confidence and text_len > 50:
                        best_confidence = avg_confidence
                        best_text = text
                        
                except Exception as e:
                    logger.warning(f"Error con {config}: {str(e)}")
                    continue
            
            logger.info(f"🏆 Mejor: conf={best_confidence:.1f}%")
            logger.info(f"📄 Texto (300 chars):\n{best_text[:300]}")
            
            return best_text, best_confidence
            
        except Exception as e:
            logger.error(f"❌ Error extrayendo texto: {str(e)}")
            return "", 0.0
    
    @staticmethod
    def extract_dni_number(text: str) -> Optional[str]:
        """
        Extrae el número de DNI usando múltiples estrategias
        DNI peruano: 8 dígitos
        
        Estrategias:
        1. Línea MRZ (IDPER12345678<...)
        2. 8 dígitos consecutivos (evitando fechas)
        3. Búsqueda cerca de keywords
        """
        # Estrategia 1: Línea MRZ (más confiable)
        # Formato: IDPER12345678<... o IOPER, I0PER, etc.
        mrz_pattern = r'(?:ID|I[DO0]|1D)(?:PER|P[E3O0]R)(\d{8})'
        match = re.search(mrz_pattern, text.replace(' ', '').replace('\n', ''), re.IGNORECASE)
        if match:
            dni = match.group(1)
            logger.info(f"🆔 DNI (MRZ): {dni}")
            return dni
        
        # Estrategia 2: 8 dígitos (evitar fechas)
        lines = text.split('\n')
        for line in lines:
            # Skip líneas con fechas
            if re.search(r'\d{2}[\s/.-]\d{2}[\s/.-]\d{4}', line):
                continue
            
            # Buscar 8 dígitos exactos
            matches = re.findall(r'\b\d{8}\b', line)
            if matches:
                logger.info(f"🆔 DNI (8 dígitos): {matches[0]}")
                return matches[0]
        
        # Estrategia 3: Keywords
        keywords = ['DNI', 'DOCUMENTO', 'IDENTIDAD', 'NUMERO', 'N°', 'Nº']
        for line in lines:
            for kw in keywords:
                if kw in line.upper():
                    nums = re.findall(r'\d{8}', line)
                    if nums:
                        logger.info(f"🆔 DNI (keyword): {nums[0]}")
                        return nums[0]
        
        logger.warning("⚠️  DNI no encontrado")
        return None
    
    @staticmethod
    def extract_names(text: str) -> Dict[str, Optional[str]]:
        """
        Extrae nombres y apellidos usando MÚLTIPLES estrategias
        
        Prioridad:
        1. Línea MRZ (formato: APELLIDO1<APELLIDO2<NOMBRE1<NOMBRE2)
        2. Búsqueda de etiquetas (APELLIDOS, NOMBRES)
        3. Líneas con texto en mayúsculas (formato DNI)
        """
        result = {
            'first_name': None,
            'last_name': None,
            'full_name': None
        }
        
        lines = text.split('\n')
        
        # Estrategia 1: LÍNEA MRZ (más confiable)
        # Formato: CARCAMO<SANDERSON<ANDERSON<DAVID<<<<<
        for line in lines:
            # Buscar línea que empiece con letras en mayúsculas y contenga <
            if re.match(r'^[A-Z<]+$', line.replace(' ', '')) and '<' in line:
                # Remover ruido
                cleaned = re.sub(r'[^A-Z<]', '', line)
                parts = cleaned.split('<<')[0].split('<')  # Solo tomar antes de <<
                
                if len(parts) >= 2:
                    # En DNI peruano: APELLIDO1<APELLIDO2<NOMBRE1<NOMBRE2
                    apellidos = ' '.join([p for p in parts[:2] if p])  # Primeros 2 = apellidos
                    nombres = ' '.join([p for p in parts[2:] if p])    # Resto = nombres
                    
                    if apellidos:
                        result['last_name'] = apellidos.title()
                        logger.info(f"👤 Apellidos (MRZ): {result['last_name']}")
                    if nombres:
                        result['first_name'] = nombres.title()
                        logger.info(f"👤 Nombres (MRZ): {result['first_name']}")
                    
                    if result['last_name'] or result['first_name']:
                        result['full_name'] = f"{result['last_name'] or ''} {result['first_name'] or ''}".strip()
                        return result
        
        # Estrategia 2: Buscar etiquetas (APELLIDOS, NOMBRES)
        apellidos_patterns = [
            r'(?:APELLIDOS?|Apellidos?|PrimerApellido)[:\s]*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]{2,})',
            r'(?:Apellido|APELLIDO)[:\s]*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]{2,})'
        ]
        
        nombres_patterns = [
            r'(?:NOMBRES?|Nombres?)[:\s]*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]{2,})',
            r'(?:Nombre|NOMBRE)[:\s]*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]{2,})'
        ]
        
        for line in lines:
            # Buscar apellidos
            if not result['last_name']:
                for pattern in apellidos_patterns:
                    match = re.search(pattern, line, re.IGNORECASE)
                    if match:
                        apellidos = match.group(1).strip()
                        # Limpiar y validar
                        apellidos = re.sub(r'[^A-ZÁÉÍÓÚÑ\s]', '', apellidos.upper())
                        apellidos = ' '.join(apellidos.split())
                        if 2 < len(apellidos) < 50:  # Validar longitud razonable
                            result['last_name'] = apellidos.title()
                            logger.info(f"👤 Apellidos (keyword): {result['last_name']}")
                            break
            
            # Buscar nombres
            if not result['first_name']:
                for pattern in nombres_patterns:
                    match = re.search(pattern, line, re.IGNORECASE)
                    if match:
                        nombres = match.group(1).strip()
                        nombres = re.sub(r'[^A-ZÁÉÍÓÚÑ\s]', '', nombres.upper())
                        nombres = ' '.join(nombres.split())
                        if 2 < len(nombres) < 50:
                            result['first_name'] = nombres.title()
                            logger.info(f"👤 Nombres (keyword): {result['first_name']}")
                            break
        
        # Estrategia 3: Buscar líneas con SOLO letras en mayúsculas (típico del DNI)
        if not result['last_name'] or not result['first_name']:
            for line in lines:
                # Línea con solo letras mayúsculas y espacios, longitud razonable
                if re.match(r'^[A-ZÁÉÍÓÚÑ\s]{4,40}$', line.strip()):
                    cleaned = line.strip()
                    parts = cleaned.split()
                    
                    if len(parts) >= 2:
                        if not result['last_name']:
                            result['last_name'] = ' '.join(parts[:2]).title()
                            logger.info(f"👤 Apellidos (mayúsculas): {result['last_name']}")
                        if not result['first_name'] and len(parts) > 2:
                            result['first_name'] = ' '.join(parts[2:]).title()
                            logger.info(f"👤 Nombres (mayúsculas): {result['first_name']}")
                        break
        
        # Construir nombre completo
        if result['last_name'] or result['first_name']:
            result['full_name'] = f"{result['last_name'] or ''} {result['first_name'] or ''}".strip()
        
        return result
    
    @staticmethod
    def extract_birth_date(text: str) -> Optional[str]:
        """
        Extrae fecha de nacimiento usando múltiples estrategias
        
        Prioridad:
        1. Línea MRZ (formato: YYMMDD en posición específica)
        2. Cerca de keywords (NACIMIENTO, Fecha de Nacimiento)
        3. Cualquier fecha válida entre 1920-2010
        """
        lines = text.split('\n')
        
        # Estrategia 1: Línea MRZ
        # Formato típico: IDPER12345678<YYMMDD...
        # O segunda línea MRZ: 1234567M2712123PER...
        for line in lines:
            # Buscar patrón MRZ con fecha (6 dígitos después del DNI)
            mrz_pattern = r'(\d{8}).*?(\d{6})'
            match = re.search(mrz_pattern, line.replace(' ', '').replace('<', ''))
            if match and len(match.group(2)) == 6:
                yymmdd = match.group(2)
                # Convertir YYMMDD a DD/MM/YYYY
                try:
                    yy = int(yymmdd[0:2])
                    mm = int(yymmdd[2:4])
                    dd = int(yymmdd[4:6])
                    
                    # Determinar siglo (asumiendo rango 1920-2020)
                    yyyy = 1900 + yy if yy >= 20 else 2000 + yy
                    
                    if 1 <= dd <= 31 and 1 <= mm <= 12 and 1920 <= yyyy <= 2010:
                        fecha = f"{dd:02d}/{mm:02d}/{yyyy}"
                        logger.info(f"📅 Fecha (MRZ): {fecha}")
                        return fecha
                except:
                    pass
        
        # Estrategia 2: Keywords
        keywords = ['NACIMIENTO', 'NACIM', 'FECHA', 'F\.NACIM', 'F\.NAC']
        
        for i, line in enumerate(lines):
            for keyword in keywords:
                if re.search(keyword, line, re.IGNORECASE):
                    # Buscar en esta línea y las 2 siguientes
                    search_area = '\n'.join(lines[i:min(i+3, len(lines))])
                    
                    # Patrones de fecha
                    patterns = [
                        r'\b(\d{2})[/\-\.\s](\d{2})[/\-\.\s](\d{4})\b',  # DD/MM/YYYY
                        r'\b(\d{1,2})\s+(\d{1,2})\s+(\d{4})\b',           # D M YYYY
                    ]
                    
                    for pattern in patterns:
                        matches = re.findall(pattern, search_area)
                        for match in matches:
                            try:
                                day = int(match[0])
                                month = int(match[1])
                                year = int(match[2])
                                
                                # Validar
                                if 1 <= day <= 31 and 1 <= month <= 12 and 1920 <= year <= 2010:
                                    fecha = f"{day:02d}/{month:02d}/{year}"
                                    logger.info(f"📅 Fecha (keyword): {fecha}")
                                    return fecha
                            except:
                                continue
        
        # Estrategia 3: Cualquier fecha válida (evitar fechas de emisión/caducidad que son más recientes)
        for line in lines:
            matches = re.findall(r'\b(\d{2})[/\-\.\s](\d{2})[/\-\.\s](\d{4})\b', line)
            for match in matches:
                try:
                    day, month, year = int(match[0]), int(match[1]), int(match[2])
                    
                    # Solo fechas de nacimiento realistas (1920-2010, no muy reciente)
                    if 1 <= day <= 31 and 1 <= month <= 12 and 1920 <= year <= 2010:
                        fecha = f"{day:02d}/{month:02d}/{year}"
                        logger.info(f"📅 Fecha (genérica): {fecha}")
                        return fecha
                except:
                    continue
        
        logger.warning("⚠️  Fecha de nacimiento no encontrada")
        return None
    
    @staticmethod
    def process_dni_image(image_path: str) -> Dict:
        """
        Procesa una imagen de DNI y extrae toda la información
        
        Args:
            image_path: Ruta de la imagen del DNI
            
        Returns:
            Diccionario con toda la información extraída
        """
        try:
            logger.info(f"🚀 Procesando DNI: {image_path}")
            
            # Extraer texto
            text, confidence = DNIOCRService.extract_text_from_image(image_path)
            
            if not text:
                return {
                    'success': False,
                    'error': 'No se pudo extraer texto de la imagen',
                    'confidence': 'low'
                }
            
            # Extraer datos específicos
            dni_number = DNIOCRService.extract_dni_number(text)
            names = DNIOCRService.extract_names(text)
            birth_date = DNIOCRService.extract_birth_date(text)
            
            # Determinar confianza general
            if confidence >= 70:
                conf_level = 'high'
            elif confidence >= 50:
                conf_level = 'medium'
            else:
                conf_level = 'low'
            
            result = {
                'success': True,
                'dni_number': dni_number,
                'first_name': names['first_name'],
                'last_name': names['last_name'],
                'full_name': names['full_name'],
                'birth_date': birth_date,
                'raw_text': text,
                'confidence': conf_level
            }
            
            logger.info(f"✅ Procesamiento exitoso")
            logger.info(f"   DNI: {dni_number}")
            logger.info(f"   Nombre: {names['full_name']}")
            logger.info(f"   F. Nac: {birth_date}")
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Error procesando DNI: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'confidence': 'low'
            }
    
    @staticmethod
    def validate_dni_data(extracted_data: Dict, user_data: Dict) -> Dict:
        """
        Valida los datos extraídos contra los datos del usuario
        
        Args:
            extracted_data: Datos extraídos del DNI
            user_data: Datos del usuario a validar
            
        Returns:
            Diccionario con resultado de validación y score de confianza
        """
        try:
            matches = []
            mismatches = []
            
            # Validar DNI
            if 'dni_number' in user_data and user_data['dni_number']:
                if extracted_data.get('dni_number') == user_data['dni_number']:
                    matches.append('DNI coincide')
                else:
                    mismatches.append(f"DNI no coincide: esperado {user_data['dni_number']}, encontrado {extracted_data.get('dni_number')}")
            
            # Validar nombres (fuzzy matching)
            if 'first_name' in user_data and user_data['first_name']:
                extracted_name = (extracted_data.get('first_name') or '').upper()
                expected_name = user_data['first_name'].upper()
                
                if expected_name in extracted_name or extracted_name in expected_name:
                    matches.append('Nombre coincide')
                else:
                    mismatches.append(f"Nombre no coincide: esperado {user_data['first_name']}, encontrado {extracted_data.get('first_name')}")
            
            # Validar apellidos
            if 'last_name' in user_data and user_data['last_name']:
                extracted_lastname = (extracted_data.get('last_name') or '').upper()
                expected_lastname = user_data['last_name'].upper()
                
                if expected_lastname in extracted_lastname or extracted_lastname in expected_lastname:
                    matches.append('Apellido coincide')
                else:
                    mismatches.append(f"Apellido no coincide: esperado {user_data['last_name']}, encontrado {extracted_data.get('last_name')}")
            
            # Calcular score de confianza (0.0 - 1.0)
            total_checks = len(matches) + len(mismatches)
            confidence_score = len(matches) / total_checks if total_checks > 0 else 0.0
            
            result = {
                'dni_match': any('DNI coincide' in m for m in matches),
                'name_match': any('Nombre coincide' in m for m in matches),
                'matches': matches,
                'mismatches': mismatches,
                'confidence_score': confidence_score
            }
            
            logger.info(f"✅ Validación: {len(matches)} coincidencias, {len(mismatches)} diferencias")
            logger.info(f"   Score: {confidence_score:.2f}")
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Error validando datos: {str(e)}")
            return {
                'dni_match': False,
                'name_match': False,
                'matches': [],
                'mismatches': [str(e)],
                'confidence_score': 0.0
            }
    
    @staticmethod
    def get_tesseract_version() -> str:
        """Obtiene la versión de Tesseract instalada"""
        try:
            version = pytesseract.get_tesseract_version()
            return str(version)
        except:
            return "No detectada"
