import React, { useRef, useCallback, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { CameraIcon, ArrowPathIcon, CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface DNICameraCaptureProps {
  onCapture: (imageSrc: string, side: 'front' | 'back') => void;
  onCancel: () => void;
  capturingSide: 'front' | 'back';
}

interface QualityMetrics {
  brightness: number;
  sharpness: number;
  hasRectangle: boolean;
  isWellPositioned: boolean;
}

export default function DNICameraCapture({ onCapture, onCancel, capturingSide }: DNICameraCaptureProps) {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [capturing, setCapturing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [qualityStatus, setQualityStatus] = useState<'poor' | 'good' | 'excellent'>('poor');
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetrics>({
    brightness: 0,
    sharpness: 0,
    hasRectangle: false,
    isWellPositioned: false
  });
  const [showPreview, setShowPreview] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // Configuración de la cámara
  const videoConstraints = {
    width: 1920,
    height: 1080,
    facingMode: 'environment', // Cámara trasera en móviles
    aspectRatio: 16 / 9
  };

  // Analizar calidad de imagen en tiempo real
  const analyzeImageQuality = useCallback((imageSrc: string) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Calcular brillo promedio
      let totalBrightness = 0;
      for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        totalBrightness += brightness;
      }
      const avgBrightness = totalBrightness / (data.length / 4);

      // Calcular nitidez aproximada (varianza de grises)
      const grays: number[] = [];
      for (let i = 0; i < data.length; i += 4) {
        const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
        grays.push(gray);
      }
      const avgGray = grays.reduce((a, b) => a + b, 0) / grays.length;
      const variance = grays.reduce((sum, g) => sum + Math.pow(g - avgGray, 2), 0) / grays.length;
      const sharpness = Math.sqrt(variance);

      // Detectar si hay un rectángulo (DNI) - simplificado
      const hasRectangle = detectRectangle(ctx, canvas.width, canvas.height);

      const metrics: QualityMetrics = {
        brightness: avgBrightness,
        sharpness: sharpness,
        hasRectangle: hasRectangle,
        isWellPositioned: hasRectangle && avgBrightness > 80 && avgBrightness < 200
      };

      setQualityMetrics(metrics);

      // Determinar estado de calidad
      if (metrics.isWellPositioned && sharpness > 30) {
        setQualityStatus('excellent');
        // Auto-captura si está excelente por 2 segundos
        if (!capturing) {
          setTimeout(() => {
            if (qualityStatus === 'excellent') {
              handleAutoCapture();
            }
          }, 2000);
        }
      } else if (metrics.hasRectangle && sharpness > 20) {
        setQualityStatus('good');
      } else {
        setQualityStatus('poor');
      }
    };
    img.src = imageSrc;
  }, [capturing, qualityStatus]);

  // Detección simple de rectángulo (border detection)
  const detectRectangle = (ctx: CanvasRenderingContext2D, width: number, height: number): boolean => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Convertir a escala de grises y detectar bordes (Sobel simplificado)
    let edgeCount = 0;
    const threshold = 50;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;

        const idxLeft = (y * width + (x - 1)) * 4;
        const grayLeft = (data[idxLeft] + data[idxLeft + 1] + data[idxLeft + 2]) / 3;

        const idxTop = ((y - 1) * width + x) * 4;
        const grayTop = (data[idxTop] + data[idxTop + 1] + data[idxTop + 2]) / 3;

        const gx = Math.abs(gray - grayLeft);
        const gy = Math.abs(gray - grayTop);
        const edge = Math.sqrt(gx * gx + gy * gy);

        if (edge > threshold) {
          edgeCount++;
        }
      }
    }

    // Si hay suficientes bordes, probablemente hay un rectángulo
    const edgeRatio = edgeCount / (width * height);
    return edgeRatio > 0.05 && edgeRatio < 0.3;
  };

  // Analizar frame continuamente
  useEffect(() => {
    const interval = setInterval(() => {
      if (webcamRef.current && !capturing && !showPreview) {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
          analyzeImageQuality(imageSrc);
        }
      }
    }, 500); // Analizar cada 500ms

    return () => clearInterval(interval);
  }, [analyzeImageQuality, capturing, showPreview]);

  // Captura automática cuando la calidad es excelente
  const handleAutoCapture = useCallback(() => {
    if (capturing || showPreview) return;

    setCapturing(true);
    setCountdown(3);

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownInterval);
          capturePhoto();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, [capturing, showPreview]);

  // Capturar foto
  const capturePhoto = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot({
        width: 1920,
        height: 1080
      });

      if (imageSrc) {
        setCapturedImage(imageSrc);
        setShowPreview(true);
        setCapturing(false);
      }
    }
  }, []);

  // Captura manual
  const handleManualCapture = useCallback(() => {
    capturePhoto();
  }, [capturePhoto]);

  // Confirmar captura
  const handleConfirmCapture = useCallback(() => {
    if (capturedImage) {
      onCapture(capturedImage, capturingSide);
    }
  }, [capturedImage, capturingSide, onCapture]);

  // Reintentar captura
  const handleRetry = useCallback(() => {
    setCapturedImage(null);
    setShowPreview(false);
    setCapturing(false);
    setCountdown(null);
  }, []);

  // Dibujar overlay en canvas
  const drawOverlay = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dimensiones del rectángulo guía (proporción DNI: 1.59:1)
    const rectWidth = canvas.width * 0.7;
    const rectHeight = rectWidth / 1.59;
    const rectX = (canvas.width - rectWidth) / 2;
    const rectY = (canvas.height - rectHeight) / 2;

    // Oscurecer área fuera del rectángulo
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Limpiar área del rectángulo
    ctx.clearRect(rectX, rectY, rectWidth, rectHeight);

    // Dibujar borde del rectángulo según calidad
    let borderColor = '#EF4444'; // Rojo por defecto (poor)
    let borderWidth = 3;

    if (qualityStatus === 'excellent') {
      borderColor = '#10B981'; // Verde
      borderWidth = 4;
    } else if (qualityStatus === 'good') {
      borderColor = '#F59E0B'; // Amarillo
      borderWidth = 3;
    }

    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;
    ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);

    // Dibujar esquinas redondeadas
    const cornerLength = 30;
    ctx.lineCap = 'round';
    ctx.lineWidth = 5;

    // Esquina superior izquierda
    ctx.beginPath();
    ctx.moveTo(rectX, rectY + cornerLength);
    ctx.lineTo(rectX, rectY);
    ctx.lineTo(rectX + cornerLength, rectY);
    ctx.stroke();

    // Esquina superior derecha
    ctx.beginPath();
    ctx.moveTo(rectX + rectWidth - cornerLength, rectY);
    ctx.lineTo(rectX + rectWidth, rectY);
    ctx.lineTo(rectX + rectWidth, rectY + cornerLength);
    ctx.stroke();

    // Esquina inferior izquierda
    ctx.beginPath();
    ctx.moveTo(rectX, rectY + rectHeight - cornerLength);
    ctx.lineTo(rectX, rectY + rectHeight);
    ctx.lineTo(rectX + cornerLength, rectY + rectHeight);
    ctx.stroke();

    // Esquina inferior derecha
    ctx.beginPath();
    ctx.moveTo(rectX + rectWidth - cornerLength, rectY + rectHeight);
    ctx.lineTo(rectX + rectWidth, rectY + rectHeight);
    ctx.lineTo(rectX + rectWidth, rectY + rectHeight - cornerLength);
    ctx.stroke();

  }, [qualityStatus]);

  // Redibujar overlay cuando cambia la calidad
  useEffect(() => {
    drawOverlay();
  }, [drawOverlay]);

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div className="text-white">
            <h3 className="text-lg font-semibold">
              {capturingSide === 'front' ? 'Frente del DNI' : 'Reverso del DNI'}
            </h3>
            <p className="text-sm text-gray-300">
              Coloca tu DNI dentro del marco
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <XMarkIcon className="w-8 h-8" />
          </button>
        </div>
      </div>

      {/* Vista de cámara o preview */}
      <div className="relative w-full h-full">
        {!showPreview ? (
          <>
            {/* Webcam */}
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              className="w-full h-full object-cover"
            />

            {/* Overlay canvas */}
            <canvas
              ref={canvasRef}
              width={1920}
              height={1080}
              className="absolute top-0 left-0 w-full h-full"
            />

            {/* Countdown */}
            {countdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-9xl font-bold text-white animate-ping">
                  {countdown}
                </div>
              </div>
            )}
          </>
        ) : (
          // Preview de imagen capturada
          <div className="w-full h-full flex items-center justify-center bg-black">
            <img
              src={capturedImage || ''}
              alt="Preview"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}
      </div>

      {/* Indicador de calidad */}
      {!showPreview && (
        <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-10">
          <div className={`px-4 py-2 rounded-full text-sm font-medium ${
            qualityStatus === 'excellent' 
              ? 'bg-green-500 text-white'
              : qualityStatus === 'good'
              ? 'bg-yellow-500 text-white'
              : 'bg-red-500 text-white'
          }`}>
            {qualityStatus === 'excellent' && '✓ Excelente - Capturando...'}
            {qualityStatus === 'good' && '⚠ Acércate un poco más'}
            {qualityStatus === 'poor' && '✗ Ajusta la posición'}
          </div>
        </div>
      )}

      {/* Controles inferiores */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-6">
        {!showPreview ? (
          <div className="flex items-center justify-center gap-8">
            {/* Botón de captura manual */}
            <button
              onClick={handleManualCapture}
              disabled={capturing}
              className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all ${
                capturing
                  ? 'border-gray-500 bg-gray-700'
                  : qualityStatus === 'excellent'
                  ? 'border-green-500 bg-green-500/20 hover:bg-green-500/30'
                  : qualityStatus === 'good'
                  ? 'border-yellow-500 bg-yellow-500/20 hover:bg-yellow-500/30'
                  : 'border-white bg-white/20 hover:bg-white/30'
              }`}
            >
              <CameraIcon className="w-10 h-10 text-white" />
            </button>
          </div>
        ) : (
          // Controles de preview
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <ArrowPathIcon className="w-5 h-5" />
              Reintentar
            </button>
            <button
              onClick={handleConfirmCapture}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <CheckCircleIcon className="w-5 h-5" />
              Usar esta foto
            </button>
          </div>
        )}

        {/* Instrucciones */}
        {!showPreview && !capturing && (
          <div className="mt-4 text-center text-white text-sm">
            <p>La captura es automática cuando el DNI esté bien posicionado</p>
            <p className="text-gray-400 mt-1">o presiona el botón para capturar manualmente</p>
          </div>
        )}
      </div>
    </div>
  );
}
