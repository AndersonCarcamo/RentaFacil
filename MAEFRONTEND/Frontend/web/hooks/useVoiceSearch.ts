/**
 * useVoiceSearch Hook
 * Maneja la lógica de reconocimiento de voz usando Web Speech API
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { VoiceSearchState, VoiceSearchResult, VoiceSearchStatus } from '@/types/voiceSearch';
import { parseVoiceQuery } from '@/utils/voiceSearchParser';

// Declaración de tipos para Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface UseVoiceSearchOptions {
  onResult?: (result: VoiceSearchResult) => void;
  onError?: (error: string) => void;
  lang?: string;
  continuous?: boolean;
}

export function useVoiceSearch(options: UseVoiceSearchOptions = {}) {
  const {
    onResult,
    onError,
    lang = 'es-PE', // Español de Perú
    continuous = false
  } = options;

  const [state, setState] = useState<VoiceSearchState>({
    isListening: false,
    transcript: '',
    interimTranscript: '',
    error: null,
    isSupported: false
  });

  const [status, setStatus] = useState<VoiceSearchStatus>('idle');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef<string>(''); // Para mantener el transcript entre re-renders
  const hasErrorRef = useRef<boolean>(false); // Para evitar procesamiento después de error

  // Verificar soporte del navegador
  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognitionAPI) {
      setState(prev => ({ ...prev, isSupported: true }));
      recognitionRef.current = new SpeechRecognitionAPI();
      
      const recognition = recognitionRef.current;
      recognition.continuous = true; // Cambiar a true para que no se detenga automáticamente
      recognition.interimResults = true;
      recognition.lang = lang;
      recognition.maxAlternatives = 1;

      // Evento: inicio de reconocimiento
      recognition.onstart = () => {
        console.log('🎤 Voice recognition started');
        hasErrorRef.current = false; // Reset error flag
        setState(prev => ({ ...prev, isListening: true, error: null }));
        setStatus('listening');
      };

      // Evento: resultado de reconocimiento
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        // Actualizar el ref con el transcript final acumulado
        if (finalTranscript) {
          finalTranscriptRef.current = (finalTranscriptRef.current + ' ' + finalTranscript).trim();
        }

        setState(prev => ({
          ...prev,
          transcript: finalTranscriptRef.current,
          interimTranscript: interimTranscript
        }));

        console.log('📝 Interim:', interimTranscript);
        console.log('✅ Final acumulado:', finalTranscriptRef.current);
      };

      // Evento: fin de reconocimiento
      recognition.onend = () => {
        console.log('🛑 Voice recognition ended, hasError:', hasErrorRef.current);
        
        // Si ya hubo un error, no procesar nada
        if (hasErrorRef.current) {
          console.log('⚠️ Skipping onend processing due to previous error');
          setState(prev => ({ ...prev, isListening: false, interimTranscript: '' }));
          // Limpiar el ref para la próxima vez
          finalTranscriptRef.current = '';
          return;
        }
        
        const finalText = finalTranscriptRef.current;
        
        setState(prev => ({ ...prev, isListening: false, interimTranscript: '' }));
        
        // Si tenemos transcript final, procesarlo
        if (finalText && finalText.trim().length > 0) {
          console.log('✅ Processing transcript:', finalText);
          setStatus('processing');
          processTranscript(finalText);
        } else {
          console.warn('⚠️ No transcript to process');
          hasErrorRef.current = true; // Marcar que hubo error ANTES de llamar onError
          const errorMsg = 'No se detectó ninguna voz. Por favor, intenta de nuevo.';
          setState(prev => ({ ...prev, error: errorMsg }));
          setStatus('error');
          onError?.(errorMsg);
        }
        
        // Limpiar el ref para la próxima vez
        finalTranscriptRef.current = '';
      };

      // Evento: error
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('❌ Voice recognition error:', event.error);
        
        // Marcar que hubo un error INMEDIATAMENTE para evitar procesamiento en onend
        hasErrorRef.current = true;
        
        let errorMessage = 'Error en el reconocimiento de voz';
        
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'No se detectó voz. Por favor, intenta de nuevo.';
            break;
          case 'audio-capture':
            errorMessage = 'No se pudo acceder al micrófono.';
            break;
          case 'not-allowed':
            errorMessage = 'Permiso de micrófono denegado. Por favor, permite el acceso.';
            break;
          case 'network':
            // Detección inteligente de contexto HTTP/HTTPS
            const isLocalHttp = typeof window !== 'undefined' && 
              (window.location.protocol === 'http:' && 
               (window.location.hostname === 'localhost' || 
                window.location.hostname === '127.0.0.1'));
            
            if (isLocalHttp) {
              errorMessage = 'El reconocimiento de voz requiere HTTPS. En desarrollo local, puedes:\n' +
                '1. Usar Chrome con --unsafely-treat-insecure-origin-as-secure\n' +
                '2. Configurar HTTPS local (recomendado para testing)\n' +
                '3. En producción se usará HTTPS automáticamente.';
            } else {
              errorMessage = 'Error de red. El reconocimiento de voz requiere conexión a internet.';
            }
            break;
          case 'aborted':
            // No mostrar error si fue cancelado intencionalmente
            if (status === 'idle') return;
            errorMessage = 'Búsqueda por voz cancelada.';
            break;
        }

        // Limpiar transcript para evitar procesamiento
        finalTranscriptRef.current = '';

        setState(prev => ({
          ...prev,
          isListening: false,
          error: errorMessage,
          interimTranscript: '',
          transcript: ''
        }));
        
        setStatus('error');
        onError?.(errorMessage);
        
        console.log('🚫 Error flag set, transcript cleared');
      };
    } else {
      console.warn('⚠️ Speech Recognition not supported');
      setState(prev => ({ ...prev, isSupported: false }));
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [lang, continuous]);

  // Procesar transcript y extraer parámetros
  const processTranscript = useCallback((transcript: string) => {
    console.log('🔄 processTranscript called with:', transcript);
    console.log('🔄 hasErrorRef:', hasErrorRef.current);
    
    // Si ya hubo error, no procesar
    if (hasErrorRef.current) {
      console.log('⚠️ Skipping processTranscript due to previous error');
      return;
    }
    
    try {
      const params = parseVoiceQuery(transcript);
      const result: VoiceSearchResult = {
        transcript,
        params,
        confidence: 1.0 // Web Speech API no expone confidence en algunos navegadores
      };

      console.log('🔍 Parsed params:', params);
      setStatus('success');
      onResult?.(result);
    } catch (error) {
      console.error('Error processing transcript:', error);
      hasErrorRef.current = true; // Marcar que hubo error
      const errorMsg = 'Error al procesar la búsqueda';
      setState(prev => ({ ...prev, error: errorMsg }));
      setStatus('error');
      onError?.(errorMsg);
    }
  }, [onResult, onError]);

  // Iniciar escucha
  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      const errorMsg = 'Reconocimiento de voz no disponible';
      setState(prev => ({ ...prev, error: errorMsg }));
      onError?.(errorMsg);
      return;
    }

    try {
      // Limpiar transcript anterior y bandera de error
      finalTranscriptRef.current = '';
      hasErrorRef.current = false;
      
      setState(prev => ({
        ...prev,
        transcript: '',
        interimTranscript: '',
        error: null
      }));
      setStatus('requesting-permission');
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting recognition:', error);
      const errorMsg = 'No se pudo iniciar el reconocimiento de voz';
      setState(prev => ({ ...prev, error: errorMsg }));
      setStatus('error');
      hasErrorRef.current = true;
      onError?.(errorMsg);
    }
  }, [onError]);

  // Detener escucha
  const stopListening = useCallback(() => {
    if (recognitionRef.current && state.isListening) {
      recognitionRef.current.stop();
    }
  }, [state.isListening]);

  // Cancelar escucha
  const cancelListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      finalTranscriptRef.current = ''; // Limpiar el ref
      hasErrorRef.current = false; // Limpiar bandera de error
      setState(prev => ({
        ...prev,
        isListening: false,
        transcript: '',
        interimTranscript: '',
        error: null
      }));
      setStatus('idle');
    }
  }, []);

  return {
    ...state,
    status,
    startListening,
    stopListening,
    cancelListening
  };
}
