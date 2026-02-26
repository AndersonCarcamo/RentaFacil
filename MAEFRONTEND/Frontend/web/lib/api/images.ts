import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ImageResponse {
  id: string;
  listing_id: string;
  filename: string;
  original_url: string;
  thumbnail_url?: string;
  medium_url?: string;
  display_order: number;
  alt_text?: string;
  width?: number;
  height?: number;
  file_size?: number;
  is_main: boolean;
  created_at: string;
}

export interface ImageUploadResponse {
  id: string;
  url: string;
  thumbnail_url?: string;
  message: string;
}

/**
 * Subir una imagen para un listing
 */
export async function uploadImage(listingId: string, file: File, token: string): Promise<ImageUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post(
    `${API_URL}/v1/images/${listingId}/upload`,
    formData,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data;
}

/**
 * Obtener todas las imágenes de un listing
 */
export async function getListingImages(listingId: string): Promise<ImageResponse[]> {
  const response = await axios.get(`${API_URL}/v1/images/${listingId}`);
  return response.data;
}

/**
 * Actualizar metadatos de una imagen
 */
export async function updateImage(
  imageId: string,
  data: { display_order?: number; alt_text?: string; is_main?: boolean },
  token: string
): Promise<ImageResponse> {
  const response = await axios.put(
    `${API_URL}/v1/images/${imageId}`,
    data,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  return response.data;
}

/**
 * Eliminar una imagen
 */
export async function deleteImage(imageId: string, token: string): Promise<void> {
  await axios.delete(`${API_URL}/v1/images/${imageId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
}

/**
 * Marcar una imagen como principal
 */
export async function setMainImage(imageId: string, token: string): Promise<ImageResponse> {
  const response = await axios.post(
    `${API_URL}/v1/images/${imageId}/set-main`,
    {},
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  return response.data;
}

/**
 * Reordenar imágenes de un listing
 */
export async function reorderImages(
  listingId: string,
  imageIds: string[],
  token: string
): Promise<ImageResponse[]> {
  const response = await axios.post(
    `${API_URL}/v1/images/${listingId}/reorder`,
    imageIds,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  return response.data;
}
