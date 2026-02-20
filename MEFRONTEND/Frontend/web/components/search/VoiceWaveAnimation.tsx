/**
 * VoiceWaveAnimation Component
 * Animación de ondas de sonido mientras se escucha
 */

import React from 'react';

interface VoiceWaveAnimationProps {
  isActive?: boolean;
  color?: string;
  bars?: number;
}

export const VoiceWaveAnimation: React.FC<VoiceWaveAnimationProps> = ({
  isActive = true,
  color = '#5AB0DB',
  bars = 5
}) => {
  return (
    <div className="flex items-center justify-center gap-1 h-16">
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className={`w-1 rounded-full transition-all ${isActive ? 'animate-pulse' : ''}`}
          style={{
            backgroundColor: color,
            height: isActive ? '100%' : '20%',
            animationDelay: `${i * 0.1}s`,
            animationDuration: `${0.8 + (i * 0.1)}s`
          }}
        />
      ))}
      
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            height: 20%;
          }
          50% {
            height: 100%;
          }
        }
        
        .animate-pulse {
          animation: pulse 0.8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
