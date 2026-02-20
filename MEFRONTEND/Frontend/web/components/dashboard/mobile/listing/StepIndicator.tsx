/**
 * StepIndicator Component
 * Visual indicator for wizard steps
 */

'use client';

import React from 'react';
import { CheckIcon } from '@heroicons/react/24/solid';

interface Step {
  number: number;
  title: string;
  isComplete: boolean;
  isCurrent: boolean;
}

interface StepIndicatorProps {
  steps: Step[];
}

export default function StepIndicator({ steps }: StepIndicatorProps) {
  // Solo mostrar 4 pasos a la vez en móvil
  const visibleSteps = steps.slice(0, 4);
  
  return (
    <div className="px-3 py-2 bg-white border-b border-gray-100">
      <div className="flex items-center justify-between">
        {visibleSteps.map((step, index) => (
          <React.Fragment key={step.number}>
            {/* Step Circle - Más pequeño */}
            <div className="flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                  step.isComplete
                    ? 'bg-green-600 text-white'
                    : step.isCurrent
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step.isComplete ? (
                  <CheckIcon className="w-3.5 h-3.5" />
                ) : (
                  step.number
                )}
              </div>
              {/* Solo mostrar título del paso actual */}
              {step.isCurrent && (
                <p className="mt-1 text-[10px] font-medium text-blue-600 truncate max-w-[60px]">
                  {step.title}
                </p>
              )}
            </div>

            {/* Connector Line */}
            {index < visibleSteps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-1 ${
                  step.isComplete ? 'bg-green-600' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        ))}
        
        {/* Indicador de más pasos */}
        {steps.length > 4 && (
          <>
            <div className="flex-1 h-0.5 mx-1 bg-gray-200" />
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium bg-gray-100 text-gray-500">
              +{steps.length - 4}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
