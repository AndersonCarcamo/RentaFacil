import React, { useState } from 'react';

interface DataPoint {
  date: string;
  views: number;
  contacts: number;
}

interface AnalyticsLineChartProps {
  data: DataPoint[];
  title?: string;
  showViews?: boolean;
  showContacts?: boolean;
  projectedData?: DataPoint[]; // Datos proyectados opcionales
}

export const AnalyticsLineChart: React.FC<AnalyticsLineChartProps> = ({
  data,
  title = 'Tendencias',
  showViews = true,
  showContacts = true,
  projectedData,
}) => {
  const [showProjections, setShowProjections] = useState(false);
  
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{title}</h2>
        <div className="text-center py-8 text-gray-500">
          No hay datos suficientes para mostrar tendencias
        </div>
      </div>
    );
  }

  // Ensure all values are valid numbers
  const validData = data.map(d => ({
    date: d.date,
    views: isNaN(d.views) ? 0 : d.views,
    contacts: isNaN(d.contacts) ? 0 : d.contacts,
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Ordenar ascendente

  // Combinar datos históricos con proyecciones si están disponibles y activadas
  const allData = showProjections && projectedData && projectedData.length > 0
    ? [...validData, ...projectedData.map(d => ({
        date: d.date,
        views: isNaN(d.views) ? 0 : d.views,
        contacts: isNaN(d.contacts) ? 0 : d.contacts,
        isProjected: true
      }))]
    : validData.map(d => ({ ...d, isProjected: false }));

  const historicalCount = validData.length;

  const maxValue = Math.max(
    1, // Minimum 1 to avoid division by zero
    ...allData.map(d => Math.max(d.views, d.contacts))
  );
  const chartHeight = 200;
  const chartWidth = 100; // percentage

  // Calculate points for the line
  const viewsPoints = allData.map((point, index) => {
    const x = allData.length > 1 
      ? (index / (allData.length - 1)) * chartWidth 
      : chartWidth / 2;
    const y = chartHeight - (point.views / maxValue) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  const contactsPoints = allData.map((point, index) => {
    const x = allData.length > 1 
      ? (index / (allData.length - 1)) * chartWidth 
      : chartWidth / 2;
    const y = chartHeight - (point.contacts / maxValue) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <div className="flex items-center gap-6">
          {/* Checkbox para mostrar proyecciones */}
          {projectedData && projectedData.length > 0 && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showProjections}
                onChange={(e) => setShowProjections(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">Mostrar proyecciones</span>
            </label>
          )}
          
          {/* Leyenda */}
          <div className="flex gap-4">
            {showViews && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Vistas</span>
              </div>
            )}
            {showContacts && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Contactos</span>
              </div>
            )}
            {showProjections && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-400 rounded-full opacity-50"></div>
                <span className="text-sm text-gray-500">Proyección</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="relative" style={{ height: `${chartHeight + 40}px` }}>
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight + 20}`}
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <line
              key={ratio}
              x1="0"
              y1={chartHeight * ratio}
              x2={chartWidth}
              y2={chartHeight * ratio}
              stroke="#e5e7eb"
              strokeWidth="0.5"
              strokeDasharray="2,2"
            />
          ))}

          {/* Views line */}
          {showViews && allData.length > 0 && (
            <>
              <polyline
                points={viewsPoints}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Points */}
              {allData.map((point, index) => {
                const x = allData.length > 1 
                  ? (index / (allData.length - 1)) * chartWidth 
                  : chartWidth / 2;
                const y = chartHeight - (point.views / maxValue) * chartHeight;
                const isProjected = 'isProjected' in point && point.isProjected;
                return (
                  <circle
                    key={`view-${index}`}
                    cx={x}
                    cy={y}
                    r="2"
                    fill={isProjected ? "#9ca3af" : "#3b82f6"}
                    opacity={isProjected ? 0.5 : 1}
                  />
                );
              })}
              {/* Vertical line separating historical from projected */}
              {showProjections && projectedData && projectedData.length > 0 && (
                <line
                  x1={(historicalCount - 1) / (allData.length - 1) * chartWidth}
                  y1="0"
                  x2={(historicalCount - 1) / (allData.length - 1) * chartWidth}
                  y2={chartHeight}
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                  strokeDasharray="4,4"
                />
              )}
            </>
          )}

          {/* Contacts line */}
          {showContacts && allData.length > 0 && (
            <>
              <polyline
                points={contactsPoints}
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Points */}
              {allData.map((point, index) => {
                const x = allData.length > 1 
                  ? (index / (allData.length - 1)) * chartWidth 
                  : chartWidth / 2;
                const y = chartHeight - (point.contacts / maxValue) * chartHeight;
                const isProjected = 'isProjected' in point && point.isProjected;
                return (
                  <circle
                    key={`contact-${index}`}
                    cx={x}
                    cy={y}
                    r="2"
                    fill={isProjected ? "#9ca3af" : "#10b981"}
                    opacity={isProjected ? 0.5 : 1}
                  />
                );
              })}
            </>
          )}
        </svg>

        {/* X-axis labels */}
        <div className="flex justify-between mt-2">
          {allData.map((point, index) => {
            // Show only first, middle, and last labels to avoid crowding
            if (index === 0 || index === Math.floor(allData.length / 2) || index === allData.length - 1) {
              // Fix timezone issue: parse date manually
              const [year, month, dayNum] = point.date.split('-').map(Number);
              const date = new Date(year, month - 1, dayNum);
              const label = date.toLocaleDateString('es-PE', {
                month: 'short',
                day: 'numeric'
              });
              const isProjected = 'isProjected' in point && point.isProjected;
              return (
                <span 
                  key={index} 
                  className={`text-xs ${isProjected ? 'text-gray-400 italic' : 'text-gray-500'}`}
                >
                  {label}
                </span>
              );
            }
            return <span key={index}></span>;
          })}
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100">
        {showViews && (
          <div>
            <p className="text-sm text-gray-600">Total de Vistas</p>
            <p className="text-2xl font-bold text-blue-600">
              {validData.reduce((sum, d) => sum + d.views, 0).toLocaleString()}
            </p>
          </div>
        )}
        {showContacts && (
          <div>
            <p className="text-sm text-gray-600">Total de Contactos</p>
            <p className="text-2xl font-bold text-green-600">
              {validData.reduce((sum, d) => sum + d.contacts, 0).toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
