/**
 * VoiceSearchModal Component
 * Modal que muestra el estado del reconocimiento de voz
 */

import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  MicrophoneIcon, 
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { VoiceWaveAnimation } from './VoiceWaveAnimation';
import { VoiceSearchStatus } from '@/types/voiceSearch';

interface VoiceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: VoiceSearchStatus;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  onCancel: () => void;
  onStop?: () => void; // Nueva prop para detener la escucha
}

export const VoiceSearchModal: React.FC<VoiceSearchModalProps> = ({
  isOpen,
  onClose,
  status,
  transcript,
  interimTranscript,
  error,
  onCancel,
  onStop
}) => {
  const getStatusContent = () => {
    switch (status) {
      case 'requesting-permission':
        return {
          icon: <MicrophoneIcon className="w-16 h-16 text-[#5AB0DB] animate-pulse" />,
          title: 'Solicitando permiso...',
          subtitle: 'Por favor, permite el acceso al micrófono',
          showWave: false
        };
      
      case 'listening':
        return {
          icon: <MicrophoneIcon className="w-16 h-16 text-[#5AB0DB]" />,
          title: 'Escuchando...',
          subtitle: 'Di lo que buscas y presiona "Listo" cuando termines',
          showWave: true
        };
      
      case 'processing':
        return {
          icon: (
            <div className="w-16 h-16 border-4 border-[#5AB0DB] border-t-transparent rounded-full animate-spin" />
          ),
          title: 'Procesando...',
          subtitle: 'Analizando tu búsqueda',
          showWave: false
        };
      
      case 'success':
        return {
          icon: <CheckCircleIcon className="w-16 h-16 text-green-500" />,
          title: '¡Listo!',
          subtitle: 'Buscando propiedades...',
          showWave: false
        };
      
      case 'error':
        return {
          icon: <ExclamationCircleIcon className="w-16 h-16 text-red-500" />,
          title: 'Error',
          subtitle: error || 'Ocurrió un error',
          showWave: false
        };
      
      default:
        return {
          icon: <MicrophoneIcon className="w-16 h-16 text-gray-400" />,
          title: 'Iniciando...',
          subtitle: '',
          showWave: false
        };
    }
  };

  const statusContent = getStatusContent();

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Overlay */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm" />
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-8 text-center align-middle shadow-xl transition-all">
                {/* Ícono de estado */}
                <div className="mx-auto flex items-center justify-center mb-4">
                  {statusContent.icon}
                </div>

                {/* Animación de ondas */}
                {statusContent.showWave && (
                  <div className="mb-4">
                    <VoiceWaveAnimation isActive={status === 'listening'} />
                  </div>
                )}

                {/* Título */}
                <Dialog.Title
                  as="h3"
                  className="text-2xl font-bold text-gray-900 mb-2"
                >
                  {statusContent.title}
                </Dialog.Title>

                {/* Subtítulo */}
                <p className="text-sm text-gray-500 mb-6">
                  {statusContent.subtitle}
                </p>

                {/* Transcript en tiempo real */}
                {(transcript || interimTranscript) && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    {transcript && (
                      <p className="text-gray-900 font-medium mb-2">
                        {transcript}
                      </p>
                    )}
                    {interimTranscript && (
                      <p className="text-gray-400 italic">
                        {interimTranscript}
                      </p>
                    )}
                  </div>
                )}

                {/* Botones de acción */}
                <div className="flex gap-3 justify-center">
                  {status === 'listening' && (
                    <>
                      <button
                        onClick={onCancel}
                        className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium flex items-center gap-2"
                      >
                        <XMarkIcon className="w-5 h-5" />
                        Cancelar
                      </button>
                      
                      <button
                        onClick={onStop}
                        autoFocus
                        className="px-6 py-2.5 bg-[#5AB0DB] text-white rounded-lg hover:bg-[#4A9DC8] transition-colors font-medium flex items-center gap-2"
                      >
                        <CheckIcon className="w-5 h-5" />
                        Listo
                      </button>
                    </>
                  )}

                  {(status === 'error' || status === 'success') && (
                    <button
                      onClick={onClose}
                      autoFocus
                      className="px-6 py-2.5 bg-[#5AB0DB] text-white rounded-lg hover:bg-[#4A9DC8] transition-colors font-medium"
                    >
                      Cerrar
                    </button>
                  )}
                </div>

                {/* Ayuda */}
                {status === 'listening' && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">
                      <strong>Ejemplos:</strong>
                    </p>
                    <ul className="text-xs text-gray-400 space-y-1">
                      <li>"Departamento de 2 habitaciones en Miraflores"</li>
                      <li>"Casa por menos de 2000 soles"</li>
                      <li>"Cuarto en San Isidro cerca al metro"</li>
                    </ul>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
