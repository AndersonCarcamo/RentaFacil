import React from 'react';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, MinusIcon } from '@heroicons/react/24/outline';

interface DataPoint {
  views: number;
  contacts: number;
}

interface Projection {
  metric: string;
  current: number;
  projected: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

interface AnalyticsProjectionsProps {
  historicalData: DataPoint[];
  projectionDays?: number;
  onProjectionsCalculated?: (projectedData: Array<{ date: string; views: number; contacts: number }>) => void;
}

// Detect outliers using IQR method
const detectOutliers = (data: number[]): boolean[] => {
  if (data.length < 4) return data.map(() => false);
  
  const sorted = [...data].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  
  return data.map(val => val < lowerBound || val > upperBound);
};

// Simple linear regression for projection
const calculateLinearRegression = (data: number[]) => {
  const n = data.length;
  if (n === 0) return { slope: 0, intercept: 0 };

  const sumX = data.reduce((sum, _, i) => sum + i, 0);
  const sumY = data.reduce((sum, val) => sum + val, 0);
  const sumXY = data.reduce((sum, val, i) => sum + i * val, 0);
  const sumXX = data.reduce((sum, _, i) => sum + i * i, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
};

const calculateProjection = (data: number[], days: number): number => {
  if (data.length < 2) return data[data.length - 1] || 0;

  // Filter outliers for more accurate projection
  const outliers = detectOutliers(data);
  const cleanData = data.filter((_, i) => !outliers[i]);
  
  if (cleanData.length < 2) return data[data.length - 1] || 0;

  const { slope, intercept } = calculateLinearRegression(cleanData);
  const projection = slope * (data.length - 1 + days) + intercept;
  
  // Don't allow negative projections
  return Math.max(0, Math.round(projection));
};

// Calculate actual trend from historical data (not projection)
const calculateRealTrend = (data: number[]): number => {
  if (data.length < 2) return 0;
  
  // Compare average of last 3 days vs previous period
  const recentDays = Math.min(3, data.length);
  const recent = data.slice(-recentDays);
  const previous = data.slice(0, -recentDays);
  
  if (previous.length === 0) return 0;
  
  const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
  const previousAvg = previous.reduce((sum, val) => sum + val, 0) / previous.length;
  
  if (previousAvg === 0) return 0;
  
  return ((recentAvg - previousAvg) / previousAvg) * 100;
};

export const AnalyticsProjections: React.FC<AnalyticsProjectionsProps> = ({
  historicalData,
  projectionDays = 7,
  onProjectionsCalculated,
}) => {
  if (!historicalData || historicalData.length < 2) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Proyecciones
        </h2>
        <p className="text-gray-500 text-center py-8">
          Se necesitan al menos 2 días de datos para calcular proyecciones
        </p>
      </div>
    );
  }

  const viewsData = historicalData.map(d => d.views);
  const contactsData = historicalData.map(d => d.contacts);
  
  // Verificar si hay datos de contactos
  const hasContactData = contactsData.some(c => c > 0);

  const currentViews = viewsData[viewsData.length - 1];
  const currentContacts = contactsData[contactsData.length - 1];

  const projectedViews = calculateProjection(viewsData, projectionDays);
  const projectedContacts = hasContactData 
    ? calculateProjection(contactsData, projectionDays) 
    : 0;

  // Ref para guardar la última notificación y evitar loops infinitos
  const lastNotifiedRef = React.useRef<string>('');

  // Calcular datos proyectados con useMemo para evitar recalcular en cada render
  const projectedDataPoints = React.useMemo(() => {
    if (historicalData.length === 0) return [];
    
    const lastHistoricalDate = historicalData[historicalData.length - 1].date;
    const [year, month, day] = lastHistoricalDate.split('-').map(Number);
    const lastDate = new Date(year, month - 1, day);
    const dataPoints = [];
    
    const views = historicalData.map(d => d.views);
    const contacts = historicalData.map(d => d.contacts);
    const hasContacts = contacts.some(c => c > 0);
    
    // Calcular regresión lineal para interpolación
    const viewsRegression = calculateLinearRegression(views);
    const contactsRegression = hasContacts ? calculateLinearRegression(contacts) : { slope: 0, intercept: 0 };
    
    for (let i = 1; i <= projectionDays; i++) {
      const projDate = new Date(lastDate);
      projDate.setDate(projDate.getDate() + i);
      
      const dayIndex = views.length - 1 + i;
      const projViews = Math.max(0, Math.round(viewsRegression.slope * dayIndex + viewsRegression.intercept));
      const projContacts = hasContacts 
        ? Math.max(0, Math.round(contactsRegression.slope * dayIndex + contactsRegression.intercept))
        : 0;
      
      dataPoints.push({
        date: projDate.toISOString().split('T')[0],
        views: projViews,
        contacts: projContacts,
      });
    }
    
    return dataPoints;
  }, [historicalData, projectionDays]);

  // Notificar al padre solo si las proyecciones realmente cambiaron
  React.useEffect(() => {
    if (onProjectionsCalculated && projectedDataPoints.length > 0) {
      const currentHash = JSON.stringify(projectedDataPoints);
      if (currentHash !== lastNotifiedRef.current) {
        lastNotifiedRef.current = currentHash;
        onProjectionsCalculated(projectedDataPoints);
      }
    }
  }, [projectedDataPoints, onProjectionsCalculated]);

  const viewsChange = currentViews > 0 
    ? ((projectedViews - currentViews) / currentViews) * 100 
    : 0;
  const contactsChange = currentContacts > 0 
    ? ((projectedContacts - currentContacts) / currentContacts) * 100 
    : 0;

  // Calculate REAL historical trend (not projection-based)
  const realViewsTrend = calculateRealTrend(viewsData);
  const realContactsTrend = calculateRealTrend(contactsData);

  const getTrend = (change: number): 'up' | 'down' | 'stable' => {
    if (change > 5) return 'up';
    if (change < -5) return 'down';
    return 'stable';
  };
  
  // Detect anomalies (sudden drops > 50%)
  const viewsOutliers = detectOutliers(viewsData);
  const hasRecentDrop = viewsData.length >= 2 && 
    viewsData[viewsData.length - 1] < viewsData[viewsData.length - 2] * 0.5;
  const hasSuspiciousData = viewsOutliers[viewsOutliers.length - 1];

  // Calculate confidence based on data consistency
  const calculateConfidence = (data: number[]): number => {
    if (data.length < 3) return 50;
    
    // Calculate variance
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = mean > 0 ? (stdDev / mean) : 1;
    
    // Lower variation = higher confidence
    const confidence = Math.max(50, Math.min(95, 100 - (coefficientOfVariation * 50)));
    return Math.round(confidence);
  };

  const confidence = Math.min(
    calculateConfidence(viewsData),
    calculateConfidence(contactsData)
  );

  const projections: Projection[] = [
    {
      metric: 'Vistas',
      current: currentViews,
      projected: projectedViews,
      change: viewsChange,
      trend: getTrend(viewsChange),
    },
  ];
  
  // Solo agregar proyección de contactos si hay datos
  if (hasContactData) {
    projections.push({
      metric: 'Contactos',
      current: currentContacts,
      projected: projectedContacts,
      change: contactsChange,
      trend: getTrend(contactsChange),
    });
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Proyecciones a {projectionDays} días
        </h2>
        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-500">Confianza:</div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            confidence >= 80 ? 'bg-green-100 text-green-700' :
            confidence >= 60 ? 'bg-yellow-100 text-yellow-700' :
            'bg-orange-100 text-orange-700'
          }`}>
            {confidence}%
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {projections.map((proj) => (
          <div
            key={proj.metric}
            className="bg-gradient-to-r from-gray-50 to-white rounded-lg p-4 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">
                {proj.metric}
              </span>
              <div className="flex items-center gap-2">
                {proj.trend === 'up' && (
                  <ArrowTrendingUpIcon className="w-5 h-5 text-green-500" />
                )}
                {proj.trend === 'down' && (
                  <ArrowTrendingDownIcon className="w-5 h-5 text-red-500" />
                )}
                {proj.trend === 'stable' && (
                  <MinusIcon className="w-5 h-5 text-gray-400" />
                )}
                <span className={`text-sm font-semibold ${
                  proj.trend === 'up' ? 'text-green-600' :
                  proj.trend === 'down' ? 'text-red-600' :
                  'text-gray-500'
                }`}>
                  {proj.change > 0 ? '+' : ''}{proj.change.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Actual</p>
                <p className="text-2xl font-bold text-gray-900">
                  {proj.current.toLocaleString()}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="h-px w-8 bg-gray-300"></div>
                <ArrowTrendingUpIcon className="w-4 h-4 text-gray-400" />
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Proyectado</p>
                <p className="text-2xl font-bold text-blue-600">
                  {proj.projected.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Visual progress bar */}
            <div className="mt-3 relative">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    proj.trend === 'up' ? 'bg-green-500' :
                    proj.trend === 'down' ? 'bg-red-500' :
                    'bg-gray-400'
                  }`}
                  style={{
                    width: `${Math.min(100, Math.max(0, (proj.current / Math.max(proj.current, proj.projected)) * 100))}%`
                  }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
        
      {/* Advertencias de datos anómalos */}
      {(hasRecentDrop || hasSuspiciousData) && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mt-4">
          <p className="text-sm text-orange-700">
            <span className="font-semibold">⚠️ Advertencia:</span> Se detectó una caída inusual en las vistas recientes. 
            Esto puede indicar datos incompletos o un cambio significativo en el rendimiento. 
            Las proyecciones pueden no ser precisas.
          </p>
        </div>
      )}
        
      {/* Mensaje si no hay datos de contactos */}
      {!hasContactData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
          <p className="text-sm text-blue-700">
            <span className="font-semibold">📊 Nota:</span> Aún no hay datos de contactos para proyectar. 
            Las proyecciones de contactos aparecerán cuando los usuarios interactúen con tu propiedad.
          </p>
        </div>
      )}

      {/* Additional insights */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Recomendaciones
        </h3>
        <ul className="space-y-2 text-sm text-gray-600">
          {/* Usar tendencia REAL histórica, no proyección */}
          {realViewsTrend > 5 ? (
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Tus vistas están en aumento ({realViewsTrend.toFixed(1)}%). Mantén tu anuncio actualizado.</span>
            </li>
          ) : realViewsTrend < -5 ? (
            <li className="flex items-start gap-2">
              <span className="text-orange-500 mt-0.5">⚠</span>
              <span>Las vistas están disminuyendo ({realViewsTrend.toFixed(1)}%). Considera actualizar fotos o descripción.</span>
            </li>
          ) : (
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>Las vistas se mantienen estables.</span>
            </li>
          )}
          
          {/* Usar tendencia REAL de contactos */}
          {hasContactData && (
            realContactsTrend > 5 ? (
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Los contactos están aumentando ({realContactsTrend.toFixed(1)}%). Responde rápidamente para mantener el interés.</span>
              </li>
            ) : realContactsTrend < -5 ? (
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-0.5">⚠</span>
                <span>Los contactos están bajando ({realContactsTrend.toFixed(1)}%). Revisa el precio o las características destacadas.</span>
              </li>
            ) : (
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Los contactos se mantienen constantes.</span>
              </li>
            )
          )}

          {confidence < 70 && (
            <li className="flex items-start gap-2">
              <span className="text-gray-400 mt-0.5">ℹ</span>
              <span>Se necesitan más datos para proyecciones más precisas.</span>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};
