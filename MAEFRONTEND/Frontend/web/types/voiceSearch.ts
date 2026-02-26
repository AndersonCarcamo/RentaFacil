/**
 * Voice Search Types
 * Tipos para el sistema de búsqueda por voz
 */

export interface VoiceSearchParams {
  property_type?: 'departamento' | 'casa' | 'cuarto' | 'airbnb';
  bedrooms?: number;
  bathrooms?: number;
  district?: string;
  city?: string;
  min_price?: number;
  max_price?: number;
  currency?: 'PEN' | 'USD';
  min_area?: number;
  max_area?: number;
}

export interface VoiceSearchResult {
  transcript: string;
  params: VoiceSearchParams;
  confidence: number;
}

export interface VoiceSearchState {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  isSupported: boolean;
}

export type VoiceSearchStatus = 
  | 'idle' 
  | 'requesting-permission' 
  | 'listening' 
  | 'processing' 
  | 'success' 
  | 'error';
