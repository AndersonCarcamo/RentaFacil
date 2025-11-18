/**
 * ContactMethodCard Component
 * Expandable accordion card for each contact method
 * Shows icon, title, toggle, and expandable configuration
 */

'use client';

import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface ContactMethodCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  children: React.ReactNode;
  badge?: string;
  badgeColor?: 'green' | 'blue' | 'yellow';
}

export default function ContactMethodCard({
  icon,
  title,
  description,
  enabled,
  onToggle,
  children,
  badge,
  badgeColor = 'green',
}: ContactMethodCardProps) {
  const [isExpanded, setIsExpanded] = useState(enabled);

  const handleToggle = () => {
    const newEnabled = !enabled;
    onToggle(newEnabled);
    if (newEnabled) {
      setIsExpanded(true);
    }
  };

  const badgeColors = {
    green: 'bg-green-100 text-green-800 border-green-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      {/* Card Header */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            {/* Icon */}
            <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
              enabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
            }`}>
              {icon}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-semibold text-gray-900">
                  {title}
                </h3>
                {badge && (
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${badgeColors[badgeColor]}`}>
                    {badge}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {description}
              </p>
            </div>
          </div>

          {/* Toggle */}
          <button
            onClick={handleToggle}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              enabled ? 'bg-blue-600' : 'bg-gray-200'
            }`}
            role="switch"
            aria-checked={enabled}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Expand/Collapse Button */}
        {enabled && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-3 w-full flex items-center justify-center py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 active:bg-blue-100 rounded-lg transition-colors"
          >
            {isExpanded ? (
              <>
                <span>Ocultar configuración</span>
                <ChevronUpIcon className="ml-1 w-4 h-4" />
              </>
            ) : (
              <>
                <span>Mostrar configuración</span>
                <ChevronDownIcon className="ml-1 w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>

      {/* Expandable Content */}
      {enabled && isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-4 animate-slideDown">
          {children}
        </div>
      )}
    </div>
  );
}
