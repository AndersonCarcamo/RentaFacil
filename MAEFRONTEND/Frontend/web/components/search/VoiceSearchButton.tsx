/**
 * VoiceSearchButton Component
 * Botón flotante para activar la búsqueda por voz
 */

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { MicrophoneIcon } from '@heroicons/react/24/outline';
import { useVoiceSearch } from '@/hooks/useVoiceSearch';
import { VoiceSearchModal } from './VoiceSearchModal';
import { VoiceSearchResult } from '@/types/voiceSearch';
import { voiceParamsToQueryString, summarizeSearchParams } from '@/utils/voiceSearchParser';
import { isPermissionSupported, isSecureContext } from '@/utils/permissions';
import toast from 'react-hot-toast';

interface VoiceSearchButtonProps {
  variant?: 'icon' | 'button';
  className?: string;
  onSearchStart?: () => void;
  onSearchComplete?: (result: VoiceSearchResult) => void;
}

export const VoiceSearchButton: React.FC<VoiceSearchButtonProps> = ({
  variant = 'icon',
  className = '',
  onSearchStart,
  onSearchComplete
}) => {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    error,
    status,
    startListening,
    stopListening,
    cancelListening
  } = useVoiceSearch({
    onResult: (result) => {
      console.log('🎯 Voice search result:', result);
      console.log('🎯 Params:', result.params);
      console.log('🎯 Params keys:', Object.keys(result.params));
      console.log('🎯 Params values:', Object.values(result.params));
      
      // Verificar que haya parámetros válidos antes de buscar
      const hasValidParams = Object.keys(result.params).length > 0 && 
        Object.values(result.params).some(val => val !== undefined && val !== null && val !== '');
      
      console.log('🎯 hasValidParams:', hasValidParams);
      
      if (!hasValidParams) {
        console.warn('⚠️ No valid search params, skipping navigation');
        const errorMsg = 'No se pudo entender la búsqueda. Por favor, intenta de nuevo con más detalles.';
        toast.error(errorMsg, { duration: 5000 });
        return;
      }
      
      // Mostrar resumen
      const summary = summarizeSearchParams(result.params);
      console.log('🎯 Summary:', summary);
      toast.success(`Buscando: ${summary}`, { duration: 3000 });

      // Callback personalizado
      onSearchComplete?.(result);

      // Esperar un momento para que el usuario vea el resultado
      setTimeout(() => {
        // Convertir params a query string y navegar
        const queryString = voiceParamsToQueryString(result.params);
        console.log('🎯 Navigating to:', `/search${queryString ? '?' + queryString : ''}`);
        router.push(`/search${queryString ? '?' + queryString : ''}`);
        
        // Cerrar modal
        setIsModalOpen(false);
      }, 1500);
    },
    onError: (errorMsg) => {
      console.error('Voice search error:', errorMsg);
      toast.error(errorMsg, { duration: 5000 });
      
      // NO cerrar automáticamente, dejar que el usuario vea el error
      // El modal mostrará el botón "Cerrar" cuando status === 'error'
    }
  });

  const handleClick = () => {
    // Verificar soporte del navegador
    if (!isSupported) {
      toast.error(
        'Tu navegador no soporta búsqueda por voz. Por favor, usa Chrome, Edge o Safari.',
        { duration: 5000 }
      );
      return;
    }

    // Verificar contexto seguro (HTTPS o localhost)
    if (!isSecureContext()) {
      toast.error(
        'La búsqueda por voz requiere una conexión segura (HTTPS).',
        { duration: 5000 }
      );
      return;
    }

    // Verificar soporte de micrófono
    if (!isPermissionSupported('microphone')) {
      toast.error(
        'Tu dispositivo no tiene micrófono o el navegador no puede acceder a él.',
        { duration: 5000 }
      );
      return;
    }

    onSearchStart?.();
    setIsModalOpen(true);
    startListening();
  };

  const handleCancel = () => {
    cancelListening();
    setIsModalOpen(false);
  };

  const handleStop = () => {
    stopListening();
    // No cerrar el modal aquí, dejar que el hook procese el resultado
  };

  const handleClose = () => {
    if (isListening) {
      cancelListening();
    }
    setIsModalOpen(false);
  };

  if (!isSupported) {
    return null; // No mostrar el botón si no hay soporte
  }

  if (variant === 'button') {
    return (
      <>
        <button
          type="button"
          onClick={handleClick}
          disabled={isListening}
          className={`flex items-center gap-2 px-4 py-2.5 bg-[#5AB0DB] text-white rounded-lg hover:bg-[#4A9DC8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium ${className}`}
        >
          <MicrophoneIcon className="w-5 h-5" />
          <span className="hidden sm:inline">Buscar por voz</span>
        </button>

        <VoiceSearchModal
          isOpen={isModalOpen}
          onClose={handleClose}
          status={status}
          transcript={transcript}
          interimTranscript={interimTranscript}
          error={error}
          onCancel={handleCancel}
          onStop={handleStop}
        />
      </>
    );
  }

  // Variant: icon (default)
  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isListening}
        className={`p-2.5 bg-[#5AB0DB] text-white rounded-lg hover:bg-[#4A9DC8] transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
          isListening ? 'animate-pulse' : ''
        } ${className}`}
        title="Buscar por voz"
        aria-label="Buscar por voz"
      >
        <MicrophoneIcon className="w-5 h-5" />
      </button>

      <VoiceSearchModal
        isOpen={isModalOpen}
        onClose={handleClose}
        status={status}
        transcript={transcript}
        interimTranscript={interimTranscript}
        error={error}
        onCancel={handleCancel}
        onStop={handleStop}
      />
    </>
  );
};
