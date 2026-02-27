import React, { useState, useCallback, useEffect } from 'react';
import { PhotoIcon, XMarkIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface ImageFile {
  id?: string;
  file?: File;
  url: string;
  preview: string;
  isMain: boolean;
  isUploading?: boolean;
  display_order?: number;
}

interface ImageUploaderProps {
  listingId?: string;
  initialImages?: Array<{ 
    id: string; 
    url: string; 
    is_main: boolean;
    display_order?: number;
  }>;
  onImagesChange?: (images: ImageFile[]) => void;
  maxImages?: number;
  apiBaseUrl?: string;
  deferUpload?: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  listingId,
  initialImages = [],
  onImagesChange,
  maxImages = 20,
  apiBaseUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/v1`,
  deferUpload = false,
}) => {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const mediaBaseUrl = apiBaseUrl.replace(/\/v1\/?$/, '');

  // Cargar imágenes iniciales solo una vez
  useEffect(() => {
    if (initialImages.length > 0 && !isInitialized) {
      const mappedImages = initialImages.map(img => ({
        id: img.id,
        url: img.url,
        preview: img.url.startsWith('http') 
          ? img.url 
          : `${mediaBaseUrl}${img.url}`,
        isMain: img.is_main,
        display_order: img.display_order,
      }));
      setImages(mappedImages);
      setIsInitialized(true);
    }
  }, [initialImages, apiBaseUrl, isInitialized]);

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files) return;
      setUploadError(null);

      const remaining = maxImages - images.length;

      for (let i = 0; i < Math.min(files.length, remaining); i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;

        // Validar tamaño (10MB)
        if (file.size > 10 * 1024 * 1024) {
          setUploadError(`La imagen ${file.name} excede el tamaño máximo de 10MB`);
          continue;
        }

        // Crear preview local
        const preview = URL.createObjectURL(file);
        const tempImage: ImageFile = {
          file,
          url: '',
          preview,
          isMain: images.length === 0 && i === 0,
          isUploading: true,
        };

        // Agregar a la lista con estado de carga
        setImages(prev => {
          const updated = [...prev, tempImage];
          setTimeout(() => onImagesChange?.(updated), 0);
          return updated;
        });

        // Si tenemos listingId, subir al backend
        if (listingId && !deferUpload) {
          try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('is_main', String(images.length === 0 && i === 0));
            formData.append('display_order', String(images.length + i));

            const token = localStorage.getItem('access_token');
            const response = await fetch(
              `${apiBaseUrl}/listings/${listingId}/images`,
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${token}`,
                },
                body: formData,
              }
            );

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.detail || 'Error al subir imagen');
            }

            const uploadedImage = await response.json();

            // Actualizar la imagen con los datos del servidor
            setImages(prev => {
              const updated = prev.map(img =>
                img.preview === preview
                  ? {
                      id: uploadedImage.id,
                      url: uploadedImage.url,
                      preview: uploadedImage.url.startsWith('http')
                        ? uploadedImage.url
                        : `${mediaBaseUrl}${uploadedImage.url}`,
                      isMain: uploadedImage.is_main,
                      display_order: uploadedImage.display_order,
                      isUploading: false,
                    }
                  : img
              );
              // Notificar cambios después de actualizar
              setTimeout(() => onImagesChange?.(updated), 0);
              return updated;
            });
          } catch (error) {
            console.error('Error uploading image:', error);
            setUploadError(
              error instanceof Error ? error.message : 'Error al subir imagen'
            );
            // Remover la imagen fallida
            setImages(prev => prev.filter(img => img.preview !== preview));
          }
        } else {
          // Sin listingId, solo mantener preview local
          setImages(prev => {
            const updated = prev.map(img =>
              img.preview === preview ? { ...img, isUploading: false } : img
            );
            setTimeout(() => onImagesChange?.(updated), 0);
            return updated;
          });
        }
      }
    },
    [images, maxImages, listingId, apiBaseUrl, mediaBaseUrl, onImagesChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const handleRemove = async (index: number) => {
    const imageToRemove = images[index];
    setUploadError(null);

    // Si la imagen tiene ID (está en el servidor), eliminarla del backend
    if (imageToRemove.id && listingId && !deferUpload) {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(
          `${apiBaseUrl}/listings/${listingId}/images/${imageToRemove.id}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || 'Error al eliminar imagen');
        }
      } catch (error) {
        console.error('Error deleting image:', error);
        setUploadError(
          error instanceof Error ? error.message : 'Error al eliminar imagen'
        );
        return;
      }
    }

    // Remover de la lista local
    const updatedImages = images.filter((_, i) => i !== index);

    // Si eliminamos la imagen principal, hacer que la primera sea principal
    if (imageToRemove.isMain && updatedImages.length > 0) {
      updatedImages[0].isMain = true;
      
      // Actualizar en el backend si es necesario
      if (updatedImages[0].id && listingId && !deferUpload) {
        await handleSetMain(0, updatedImages);
        return; // handleSetMain ya actualiza el estado
      }
    }

    setImages(updatedImages);
    // Notificar cambios
    setTimeout(() => onImagesChange?.(updatedImages), 0);
  };

  const handleSetMain = async (index: number, imagesList?: ImageFile[]) => {
    const currentImages = imagesList || images;
    const imageToSetMain = currentImages[index];
    setUploadError(null);

    // Si la imagen tiene ID (está en el servidor), actualizar en el backend
    if (imageToSetMain.id && listingId && !deferUpload) {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(
          `${apiBaseUrl}/listings/${listingId}/images/${imageToSetMain.id}`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ is_main: true }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || 'Error al actualizar imagen principal');
        }
      } catch (error) {
        console.error('Error setting main image:', error);
        setUploadError(
          error instanceof Error
            ? error.message
            : 'Error al actualizar imagen principal'
        );
        return;
      }
    }

    // Actualizar estado local
    const updatedImages = currentImages.map((img, i) => ({
      ...img,
      isMain: i === index,
    }));
    setImages(updatedImages);
    // Notificar cambios
    setTimeout(() => onImagesChange?.(updatedImages), 0);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  return (
    <div className="space-y-4">
      {/* Mensajes de error */}
      {uploadError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">⚠️ {uploadError}</p>
        </div>
      )}

      {/* Zona de carga */}
      {images.length < maxImages && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragOver
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <PhotoIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-sm text-gray-600 mb-2">
            Arrastra imágenes aquí o haz clic para seleccionar
          </p>
          <p className="text-xs text-gray-500 mb-4">
            PNG, JPG, WEBP, GIF hasta 10MB ({images.length}/{maxImages} imágenes)
          </p>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
          >
            Seleccionar Imágenes
          </label>
        </div>
      )}

      {/* Galería de imágenes */}
      {images.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Imágenes ({images.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div
                key={index}
                className="relative group aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-colors"
              >
                {/* Imagen */}
                <img
                  src={image.preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Overlay con controles */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    {/* Botón de imagen principal */}
                    <button
                      type="button"
                      onClick={() => handleSetMain(index)}
                      className={`p-2 rounded-full ${
                        image.isMain
                          ? 'bg-yellow-500 text-white'
                          : 'bg-white text-gray-700 hover:bg-yellow-500 hover:text-white'
                      } transition-colors`}
                      title={image.isMain ? 'Imagen principal' : 'Marcar como principal'}
                    >
                      {image.isMain ? (
                        <StarIconSolid className="w-5 h-5" />
                      ) : (
                        <StarIcon className="w-5 h-5" />
                      )}
                    </button>

                    {/* Botón de eliminar */}
                    <button
                      type="button"
                      onClick={() => handleRemove(index)}
                      className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                      title="Eliminar imagen"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Badge de imagen principal */}
                {image.isMain && (
                  <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <StarIconSolid className="w-3 h-3" />
                    Principal
                  </div>
                )}

                {/* Indicador de carga */}
                {image.isUploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Tips */}
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              💡 <strong>Tips para mejores fotos:</strong>
            </p>
            <ul className="text-sm text-blue-700 mt-2 space-y-1 ml-4">
              <li>• Usa buena iluminación natural</li>
              <li>• Muestra diferentes ángulos de cada ambiente</li>
              <li>• La primera imagen será la imagen principal</li>
              <li>• Recomendado: mínimo 5 fotos para más visibilidad</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
