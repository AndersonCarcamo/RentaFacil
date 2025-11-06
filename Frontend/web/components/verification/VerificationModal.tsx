import React, { useState, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon, CloudArrowUpIcon, CheckCircleIcon, ExclamationCircleIcon, CameraIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { useDropzone } from 'react-dropzone';
import DNICameraCapture from './DNICameraCapture';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface VerificationResponse {
  verification_id: string;
  status: string;
  confidence_score: number;
  extracted_data: {
    dni_number?: string;
    first_name?: string;
    last_name?: string;
    birth_date?: string;
  };
  validation_result: {
    dni_match: boolean;
    name_match: boolean;
    confidence_score: number;
    mismatches: string[];
  };
  message: string;
}

export default function VerificationModal({ isOpen, onClose, onSuccess }: VerificationModalProps) {
  const [captureMode, setCaptureMode] = useState<'select' | 'camera' | 'upload'>('select');
  const [capturingSide, setCapturingSide] = useState<'front' | 'back'>('front');
  const [dniFront, setDniFront] = useState<File | null>(null);
  const [dniBack, setDniBack] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [response, setResponse] = useState<VerificationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Dropzone for front image
  const onDropFront = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setDniFront(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setFrontPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps: getFrontRootProps, getInputProps: getFrontInputProps, isDragActive: isFrontDragActive } = useDropzone({
    onDrop: onDropFront,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  // Dropzone for back image
  const onDropBack = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setDniBack(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setBackPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps: getBackRootProps, getInputProps: getBackInputProps, isDragActive: isBackDragActive } = useDropzone({
    onDrop: onDropBack,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleSubmit = async () => {
    if (!dniFront) {
      setError('La imagen del frente del DNI es obligatoria');
      return;
    }

    setUploading(true);
    setUploadStatus('processing');
    setError(null);

    try {
      const formData = new FormData();
      formData.append('dni_front', dniFront);
      if (dniBack) {
        formData.append('dni_back', dniBack);
      }

      // Get token from localStorage
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('Debes iniciar sesión para verificar tu identidad');
      }
      
      const response = await fetch('http://localhost:8000/v1/verification/verify-dni', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Manejar diferentes tipos de errores
        if (response.status === 401) {
          throw new Error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
        } else if (response.status === 403) {
          throw new Error('Solo los propietarios pueden verificar su identidad.');
        } else {
          throw new Error(errorData.detail || 'Error al procesar la verificación');
        }
      }

      const data: VerificationResponse = await response.json();
      setResponse(data);

      if (data.status === 'APPROVED') {
        setUploadStatus('success');
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 3000);
      } else if (data.status === 'UNDER_REVIEW') {
        setUploadStatus('success');
        // Show message that it's under review
      } else {
        setUploadStatus('error');
        setError('La verificación requiere revisión manual. Te notificaremos cuando esté lista.');
      }

    } catch (err: any) {
      setUploadStatus('error');
      setError(err.message || 'Error al subir las imágenes. Por favor, intenta de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setCaptureMode('select');
      setCapturingSide('front');
      setDniFront(null);
      setDniBack(null);
      setFrontPreview(null);
      setBackPreview(null);
      setUploadStatus('idle');
      setResponse(null);
      setError(null);
      onClose();
    }
  };

  // Handler para captura con cámara
  const handleCameraCapture = useCallback((imageSrc: string, side: 'front' | 'back') => {
    // Convertir base64 a File
    fetch(imageSrc)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], `dni_${side}.jpg`, { type: 'image/jpeg' });
        
        if (side === 'front') {
          setDniFront(file);
          setFrontPreview(imageSrc);
          // Cambiar a captura del reverso
          setCapturingSide('back');
        } else {
          setDniBack(file);
          setBackPreview(imageSrc);
          // Volver al modo upload para mostrar preview
          setCaptureMode('upload');
        }
      });
  }, []);

  const handleSelectCameraMode = () => {
    setCaptureMode('camera');
    setCapturingSide('front');
  };

  const handleSelectUploadMode = () => {
    setCaptureMode('upload');
  };

  const removeFrontImage = () => {
    setDniFront(null);
    setFrontPreview(null);
  };

  const removeBackImage = () => {
    setDniBack(null);
    setBackPreview(null);
  };

  return (
    <>
      {/* Modo cámara - pantalla completa */}
      {captureMode === 'camera' && (
        <DNICameraCapture
          onCapture={handleCameraCapture}
          onCancel={() => setCaptureMode('select')}
          capturingSide={capturingSide}
        />
      )}

      {/* Modal normal */}
      {captureMode !== 'camera' && (
        <Transition appear show={isOpen} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    Verificación de Identidad
                  </Dialog.Title>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500"
                    onClick={handleClose}
                    disabled={uploading}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Pantalla de selección de modo */}
                {uploadStatus === 'idle' && captureMode === 'select' && (
                  <>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Para verificar tu identidad, necesitamos fotos claras de tu DNI. 
                        Elige cómo deseas proporcionar las imágenes:
                      </p>
                    </div>

                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Opción: Capturar con cámara */}
                      <button
                        onClick={handleSelectCameraMode}
                        className="group relative flex flex-col items-center justify-center p-8 border-2 border-gray-300 rounded-xl hover:border-brand-blue hover:bg-blue-50 transition-all"
                      >
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                          <CameraIcon className="w-8 h-8 text-brand-blue" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">
                          Capturar con Cámara
                        </h4>
                        <p className="text-sm text-gray-600 text-center">
                          Guía en tiempo real y captura automática cuando esté bien posicionado
                        </p>
                        <span className="mt-3 text-xs font-medium text-green-600">
                          ✓ Recomendado - Mayor tasa de éxito
                        </span>
                      </button>

                      {/* Opción: Subir archivo */}
                      <button
                        onClick={handleSelectUploadMode}
                        className="group relative flex flex-col items-center justify-center p-8 border-2 border-gray-300 rounded-xl hover:border-brand-blue hover:bg-blue-50 transition-all"
                      >
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-gray-200 transition-colors">
                          <PhotoIcon className="w-8 h-8 text-gray-600" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">
                          Subir Archivos
                        </h4>
                        <p className="text-sm text-gray-600 text-center">
                          Selecciona fotos ya tomadas de tu dispositivo
                        </p>
                      </button>
                    </div>

                    <div className="mt-6 flex justify-end">
                      <button
                        type="button"
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        onClick={handleClose}
                      >
                        Cancelar
                      </button>
                    </div>
                  </>
                )}

                {/* Pantalla de subida de archivos */}
                {uploadStatus === 'idle' && captureMode === 'upload' && (
                  <>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-sm text-gray-500">
                        Sube las fotos de tu DNI o{' '}
                        <button
                          onClick={() => setCaptureMode('select')}
                          className="text-brand-blue hover:underline"
                        >
                          usa la cámara
                        </button>
                      </p>
                    </div>

                    <div className="mt-6 space-y-4">
                      {/* Front of DNI */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Frente del DNI <span className="text-red-500">*</span>
                        </label>
                        
                        {!frontPreview ? (
                          <div
                            {...getFrontRootProps()}
                            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                              isFrontDragActive
                                ? 'border-brand-blue bg-blue-50'
                                : 'border-gray-300 hover:border-brand-blue'
                            }`}
                          >
                            <input {...getFrontInputProps()} />
                            <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="mt-2 text-sm text-gray-600">
                              {isFrontDragActive
                                ? 'Suelta la imagen aquí'
                                : 'Arrastra una imagen o haz clic para seleccionar'}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              JPG, PNG o PDF (máx. 10MB)
                            </p>
                          </div>
                        ) : (
                          <div className="relative">
                            <img
                              src={frontPreview}
                              alt="Frente del DNI"
                              className="w-full h-64 object-contain rounded-lg border border-gray-300"
                            />
                            <button
                              type="button"
                              onClick={removeFrontImage}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            >
                              <XMarkIcon className="h-5 w-5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Back of DNI (Optional) */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Reverso del DNI (opcional)
                        </label>
                        
                        {!backPreview ? (
                          <div
                            {...getBackRootProps()}
                            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                              isBackDragActive
                                ? 'border-brand-blue bg-blue-50'
                                : 'border-gray-300 hover:border-brand-blue'
                            }`}
                          >
                            <input {...getBackInputProps()} />
                            <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="mt-2 text-sm text-gray-600">
                              {isBackDragActive
                                ? 'Suelta la imagen aquí'
                                : 'Arrastra una imagen o haz clic para seleccionar'}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              JPG, PNG o PDF (máx. 10MB)
                            </p>
                          </div>
                        ) : (
                          <div className="relative">
                            <img
                              src={backPreview}
                              alt="Reverso del DNI"
                              className="w-full h-64 object-contain rounded-lg border border-gray-300"
                            />
                            <button
                              type="button"
                              onClick={removeBackImage}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            >
                              <XMarkIcon className="h-5 w-5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        type="button"
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        onClick={handleClose}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        className="px-4 py-2 text-sm font-medium text-white bg-brand-blue rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleSubmit}
                        disabled={!dniFront || uploading}
                      >
                        Verificar Identidad
                      </button>
                    </div>
                  </>
                )}

                {uploadStatus === 'processing' && (
                  <div className="mt-6 text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
                    <p className="mt-4 text-sm text-gray-600">
                      Procesando tu DNI con tecnología OCR...
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      Esto puede tomar unos segundos
                    </p>
                  </div>
                )}

                {uploadStatus === 'success' && response && (
                  <div className="mt-6">
                    <div className="flex items-center justify-center mb-4">
                      <CheckCircleIcon className="h-16 w-16 text-green-500" />
                    </div>
                    
                    <div className="text-center">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        {response.status === 'APPROVED' 
                          ? '¡Verificación Exitosa!' 
                          : 'Verificación en Revisión'}
                      </h4>
                      
                      <p className="text-sm text-gray-600 mb-4">
                        {response.message}
                      </p>

                      {response.status === 'APPROVED' && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                          <p className="text-sm text-green-800">
                            Tu cuenta ha sido verificada exitosamente. Ahora tienes acceso a todos los beneficios.
                          </p>
                        </div>
                      )}

                      {response.status === 'UNDER_REVIEW' && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                          <p className="text-sm text-yellow-800">
                            Tu documentación está siendo revisada por nuestro equipo. 
                            Te notificaremos cuando el proceso esté completo.
                          </p>
                          <p className="text-xs text-yellow-700 mt-2">
                            Tiempo estimado: {response.confidence_score >= 0.7 ? '24 horas' : '24-48 horas'}
                          </p>
                        </div>
                      )}

                      {response.confidence_score && (
                        <div className="text-xs text-gray-500 mt-2">
                          Nivel de confianza: {(response.confidence_score * 100).toFixed(0)}%
                        </div>
                      )}
                    </div>

                    {response.status === 'APPROVED' && (
                      <div className="mt-6 flex justify-center">
                        <button
                          type="button"
                          className="px-6 py-2 text-sm font-medium text-white bg-brand-blue rounded-md hover:bg-blue-700"
                          onClick={handleClose}
                        >
                          Continuar
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {uploadStatus === 'error' && (
                  <div className="mt-6">
                    <div className="flex items-center justify-center mb-4">
                      <ExclamationCircleIcon className="h-16 w-16 text-red-500" />
                    </div>
                    
                    <div className="text-center">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        Error en la Verificación
                      </h4>
                      
                      {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                          <p className="text-sm text-red-800">{error}</p>
                        </div>
                      )}

                      <p className="text-sm text-gray-600 mb-4">
                        Por favor, verifica que la imagen sea clara y todos los datos sean legibles.
                      </p>
                    </div>

                    <div className="mt-6 flex justify-center space-x-3">
                      <button
                        type="button"
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        onClick={handleClose}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        className="px-4 py-2 text-sm font-medium text-white bg-brand-blue rounded-md hover:bg-blue-700"
                        onClick={() => {
                          setUploadStatus('idle');
                          setError(null);
                        }}
                      >
                        Intentar de Nuevo
                      </button>
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
      )}
    </>
  );
}
