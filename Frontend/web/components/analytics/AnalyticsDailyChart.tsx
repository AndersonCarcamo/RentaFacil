import React from 'react';

interface DailyStat {
  date: string;
  views: number;
}

interface AnalyticsDailyChartProps {
  dailyStats: DailyStat[];
}

export const AnalyticsDailyChart: React.FC<AnalyticsDailyChartProps> = ({ dailyStats }) => {
  // Obtener solo los últimos 7 días y ordenar descendente (más reciente primero)
  const last7Days = dailyStats
    .slice(-7) // Últimos 7 elementos
    .reverse(); // Invertir para mostrar más reciente arriba
  
  const maxViews = Math.max(...last7Days.map(d => d.views), 1);

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Vistas de los últimos 7 días
      </h2>
      <div className="space-y-3">
        {last7Days.map((day) => {
          const percentage = maxViews > 0 ? (day.views / maxViews) * 100 : 0;
          // Parsear fecha correctamente para evitar problemas de zona horaria
          const [year, month, dayNum] = day.date.split('-').map(Number);
          const date = new Date(year, month - 1, dayNum);
          const formattedDate = date.toLocaleDateString('es-PE', { 
            weekday: 'short', 
            day: 'numeric',
            month: 'short'
          });
          
          return (
            <div key={day.date} className="flex items-center gap-3">
              <span className="text-sm text-gray-600 w-20 capitalize text-right">
                {formattedDate}
              </span>
              <div className="flex-1">
                <div className="bg-gray-200 rounded-full h-7 overflow-hidden">
                  <div 
                    className="bg-blue-500 h-full flex items-center justify-end px-2 transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  >
                    {day.views > 0 && (
                      <span className="text-white text-sm font-semibold">
                        {day.views}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
