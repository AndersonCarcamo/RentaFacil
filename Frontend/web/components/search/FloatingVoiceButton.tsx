/**
 * FloatingVoiceButton Component
 * Botón flotante de búsqueda por voz siempre visible en la esquina inferior izquierda
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

export const FloatingVoiceButton: React.FC = () => {
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

  // No mostrar el botón si no hay soporte
  if (!isSupported) {
    return null;
  }

  return (
    <>
      {/* Botón Flotante */}
      <div className="fixed bottom-6 left-6 z-50 group">
        <button
          type="button"
          onClick={handleClick}
          disabled={isListening}
          className={`
            w-14 h-14 
            bg-gradient-to-r from-[#5AB0DB] to-[#4A9DC8]
            text-white rounded-full 
            shadow-lg hover:shadow-xl
            transition-all duration-300
            disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center justify-center
            ${isListening ? 'animate-pulse scale-110' : 'hover:scale-110'}
          `}
          title="Buscar por voz"
          aria-label="Buscar por voz"
        >
          <MicrophoneIcon className={`
            w-6 h-6 
            transition-transform duration-300
            ${isListening ? 'scale-125' : 'group-hover:scale-110'}
          `} />
          
          {/* Ripple effect cuando está escuchando */}
          {isListening && (
            <span className="absolute inset-0 rounded-full bg-[#5AB0DB] opacity-75 animate-ping" />
          )}
        </button>

        {/* Tooltip en hover (solo desktop) */}
        <div className="
          absolute bottom-0 left-full ml-4
          hidden lg:group-hover:block
          px-3 py-2 
          bg-gray-900 text-white text-sm rounded-lg
          pointer-events-none
          opacity-0 group-hover:opacity-100
          transition-opacity duration-200
          whitespace-nowrap
        ">
          Buscar por voz
          <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900" />
        </div>
      </div>

      {/* Modal de búsqueda por voz */}
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
