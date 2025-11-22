/**
 * AdminAnalytics Component
 * Dashboard de analíticas completo para administradores
 * Mobile-first responsive design con gráficos interactivos
 */

'use client';

import React, { useState } from 'react';
import {
  ChartBarIcon,
  UsersIcon,
  BuildingOfficeIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon,
  EyeIcon,
  CalendarIcon,
  UserGroupIcon,
  SparklesIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

type TimeRange = '7d' | '30d' | '90d' | '1y';
type DateRangeType = 'registrations' | 'subscriptions';

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'purple' | 'yellow' | 'red';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, icon: Icon, color }) => {
  const isPositive = change >= 0;
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-600',
    red: 'bg-red-50 border-red-200 text-red-600',
  };

  return (
    <div className={`p-4 rounded-lg border-2 ${colorClasses[color]}`}>
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs sm:text-sm text-gray-600 font-medium">{title}</p>
        <Icon className="w-5 h-5 flex-shrink-0" />
      </div>
      <p className={`text-2xl sm:text-3xl font-bold mb-1`}>{value}</p>
      <div className="flex items-center gap-1 text-xs sm:text-sm">
        {isPositive ? (
          <ArrowTrendingUpIcon className="w-4 h-4 text-green-600" />
        ) : (
          <ArrowTrendingDownIcon className="w-4 h-4 text-red-600" />
        )}
        <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
          {isPositive ? '+' : ''}{change}%
        </span>
        <span className="text-gray-500">vs período anterior</span>
      </div>
    </div>
  );
};

export default function AdminAnalytics() {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [startDate, setStartDate] = useState('2024-10-01');
  const [endDate, setEndDate] = useState('2024-11-18');
  const [dateRangeType, setDateRangeType] = useState<DateRangeType>('registrations');

  // Colores para gráficos
  const COLORS = {
    basico: '#9CA3AF',
    premium: '#3B82F6',
    profesional: '#8B5CF6',
    agente: '#10B981',
  };

  // Datos simulados (reemplazar con API calls)
  const metrics = {
    totalUsers: { value: 1234, change: 12.5 },
    activeUsers: { value: 892, change: 8.3 },
    totalListings: { value: 567, change: 15.2 },
    totalViews: { value: '45.2K', change: 23.1 },
    subscriptions: { value: 89, change: 18.7 },
    revenue: { value: 'S/ 8,450', change: 21.3 },
  };

  // Datos de crecimiento mensual para gráfico de línea
  const monthlyGrowthData = [
    { month: 'Mayo', usuarios: 750, propiedades: 380, suscripciones: 55, ingresos: 5200 },
    { month: 'Junio', usuarios: 850, propiedades: 420, suscripciones: 65, ingresos: 6100 },
    { month: 'Julio', usuarios: 920, propiedades: 465, suscripciones: 72, ingresos: 6800 },
    { month: 'Agosto', usuarios: 1050, propiedades: 510, suscripciones: 78, ingresos: 7400 },
    { month: 'Septiembre', usuarios: 1150, propiedades: 545, suscripciones: 82, ingresos: 7900 },
    { month: 'Octubre', usuarios: 1234, propiedades: 567, suscripciones: 89, ingresos: 8450 },
  ];

  // Distribución de planes (para gráfico de dona)
  const planDistributionData = [
    { name: 'Básico', value: 1045, percentage: 84.7, users: 1045 },
    { name: 'Premium', value: 143, percentage: 11.6, users: 143 },
    { name: 'Profesional', value: 46, percentage: 3.7, users: 46 },
  ];

  // Análisis detallado por tipo de usuario
  const userTypeAnalysis = [
    {
      type: 'Básico',
      count: 1045,
      revenue: 0,
      avgListings: 1.2,
      activeRate: 65,
      color: COLORS.basico,
      icon: UsersIcon,
    },
    {
      type: 'Premium',
      count: 143,
      revenue: 4278,
      avgListings: 8.5,
      activeRate: 82,
      color: COLORS.premium,
      icon: SparklesIcon,
    },
    {
      type: 'Profesional',
      count: 46,
      revenue: 4595,
      avgListings: 45.2,
      activeRate: 95,
      color: COLORS.profesional,
      icon: BriefcaseIcon,
    },
    {
      type: 'Agentes',
      count: 28,
      revenue: 2795,
      avgListings: 32.1,
      activeRate: 89,
      color: COLORS.agente,
      icon: UserGroupIcon,
    },
  ];

  // Registros por fecha (para reporte de rango)
  const registrationsByDate = [
    { date: '01/10', registros: 12, suscripciones: 2 },
    { date: '05/10', registros: 18, suscripciones: 3 },
    { date: '10/10', registros: 25, suscripciones: 5 },
    { date: '15/10', registros: 22, suscripciones: 4 },
    { date: '20/10', registros: 30, suscripciones: 7 },
    { date: '25/10', registros: 28, suscripciones: 6 },
    { date: '01/11', registros: 35, suscripciones: 8 },
    { date: '05/11', registros: 32, suscripciones: 7 },
    { date: '10/11', registros: 40, suscripciones: 9 },
    { date: '15/11', registros: 38, suscripciones: 8 },
  ];

  // Comparación de planes mes a mes
  const plansComparisonData = [
    { month: 'Jun', basico: 890, premium: 115, profesional: 35, agentes: 20 },
    { month: 'Jul', basico: 920, premium: 125, profesional: 38, agentes: 22 },
    { month: 'Ago', basico: 970, premium: 132, profesional: 40, agentes: 24 },
    { month: 'Sep', basico: 1000, premium: 138, profesional: 43, agentes: 26 },
    { month: 'Oct', basico: 1045, premium: 143, profesional: 46, agentes: 28 },
  ];

  const topSearches = [
    { term: 'Departamento Miraflores', count: 1245, change: 15 },
    { term: 'Casa San Isidro', count: 892, change: -5 },
    { term: 'Cuarto cerca a metro', count: 756, change: 32 },
    { term: 'Departamento 2 habitaciones', count: 634, change: 8 },
    { term: 'Casa con jardín', count: 521, change: -12 },
  ];

  const topDistricts = [
    { name: 'Miraflores', searches: 2340, listings: 145 },
    { name: 'San Isidro', searches: 1890, listings: 98 },
    { name: 'Surco', searches: 1567, listings: 167 },
    { name: 'La Molina', searches: 1234, listings: 112 },
    { name: 'San Borja', searches: 1098, listings: 89 },
  ];

  const timeRangeLabels = {
    '7d': '7d',
    '30d': '30d',
    '90d': '90d',
    '1y': '1a',
  };

  return (
    <div className="space-y-6">
      {/* Header con filtro de tiempo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">Analíticas del Sistema</h3>
          <p className="text-xs sm:text-sm text-gray-600">Métricas y estadísticas de la plataforma</p>
        </div>
        <div className="flex gap-2">
          {(Object.keys(timeRangeLabels) as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {timeRangeLabels[range]}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Total Usuarios"
          value={metrics.totalUsers.value}
          change={metrics.totalUsers.change}
          icon={UsersIcon}
          color="blue"
        />
        <MetricCard
          title="Usuarios Activos"
          value={metrics.activeUsers.value}
          change={metrics.activeUsers.change}
          icon={UsersIcon}
          color="green"
        />
        <MetricCard
          title="Propiedades Activas"
          value={metrics.totalListings.value}
          change={metrics.totalListings.change}
          icon={BuildingOfficeIcon}
          color="purple"
        />
        <MetricCard
          title="Total Vistas"
          value={metrics.totalViews.value}
          change={metrics.totalViews.change}
          icon={EyeIcon}
          color="yellow"
        />
        <MetricCard
          title="Suscripciones"
          value={metrics.subscriptions.value}
          change={metrics.subscriptions.change}
          icon={CurrencyDollarIcon}
          color="green"
        />
        <MetricCard
          title="Ingresos Mensuales"
          value={metrics.revenue.value}
          change={metrics.revenue.change}
          icon={CurrencyDollarIcon}
          color="blue"
        />
      </div>

      {/* Gráfico de Crecimiento Mensual (LineChart) */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
        <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <ChartBarIcon className="w-5 h-5 text-purple-600" />
          Tendencia de Crecimiento (6 meses)
        </h4>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyGrowthData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: '12px' }} />
            <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Line type="monotone" dataKey="usuarios" stroke="#3B82F6" strokeWidth={2} name="Usuarios" />
            <Line type="monotone" dataKey="propiedades" stroke="#8B5CF6" strokeWidth={2} name="Propiedades" />
            <Line type="monotone" dataKey="suscripciones" stroke="#10B981" strokeWidth={2} name="Suscripciones" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Análisis de Planes: Básico, Premium, Profesional y Agentes */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
        <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-purple-600" />
          Análisis por Tipo de Usuario
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {userTypeAnalysis.map((userType) => {
            const Icon = userType.icon;
            return (
              <div key={userType.type} className="border-2 rounded-lg p-4" style={{ borderColor: userType.color }}>
                <div className="flex items-center justify-between mb-3">
                  <Icon className="w-8 h-8" style={{ color: userType.color }} />
                  <span className="text-2xl font-bold" style={{ color: userType.color }}>
                    {userType.count}
                  </span>
                </div>
                <h5 className="font-bold text-gray-900 mb-2">{userType.type}</h5>
                <div className="space-y-1 text-xs sm:text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Ingresos:</span>
                    <span className="font-semibold">S/ {userType.revenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Prop. promedio:</span>
                    <span className="font-semibold">{userType.avgListings}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tasa activa:</span>
                    <span className="font-semibold">{userType.activeRate}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Gráfico de Distribución de Planes (Pie Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
          <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CurrencyDollarIcon className="w-5 h-5 text-purple-600" />
            Distribución de Planes
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={planDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {planDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {planDistributionData.map((plan, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: Object.values(COLORS)[index] }}></div>
                  <span className="font-medium">{plan.name}</span>
                </div>
                <span className="text-gray-600">{plan.users} usuarios</span>
              </div>
            ))}
          </div>
        </div>

        {/* Comparación de Planes (BarChart) */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
          <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5 text-blue-600" />
            Evolución de Planes (5 meses)
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={plansComparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="basico" fill={COLORS.basico} name="Básico" />
              <Bar dataKey="premium" fill={COLORS.premium} name="Premium" />
              <Bar dataKey="profesional" fill={COLORS.profesional} name="Profesional" />
              <Bar dataKey="agentes" fill={COLORS.agente} name="Agentes" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Reporte por Rango de Fechas */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h4 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-green-600" />
            Reporte por Rango de Fechas
          </h4>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setDateRangeType('registrations')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                dateRangeType === 'registrations'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Registros
            </button>
            <button
              onClick={() => setDateRangeType('subscriptions')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                dateRangeType === 'subscriptions'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Suscripciones
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Fecha Inicio</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Fecha Fin</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={registrationsByDate}>
            <defs>
              <linearGradient id="colorRegistros" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorSuscripciones" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" stroke="#6B7280" style={{ fontSize: '12px' }} />
            <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Area 
              type="monotone" 
              dataKey="registros" 
              stroke="#3B82F6" 
              fillOpacity={1} 
              fill="url(#colorRegistros)" 
              name="Registros Nuevos"
            />
            <Area 
              type="monotone" 
              dataKey="suscripciones" 
              stroke="#10B981" 
              fillOpacity={1} 
              fill="url(#colorSuscripciones)" 
              name="Nuevas Suscripciones"
            />
          </AreaChart>
        </ResponsiveContainer>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-gray-600">Total Registros</p>
            <p className="text-xl font-bold text-blue-600">280</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-xs text-gray-600">Total Suscripciones</p>
            <p className="text-xl font-bold text-green-600">59</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg">
            <p className="text-xs text-gray-600">Tasa Conversión</p>
            <p className="text-xl font-bold text-purple-600">21.1%</p>
          </div>
          <div className="p-3 bg-yellow-50 rounded-lg">
            <p className="text-xs text-gray-600">Promedio Diario</p>
            <p className="text-xl font-bold text-yellow-600">28</p>
          </div>
        </div>
      </div>

      {/* Dos Columnas: Búsquedas y Distritos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Top Búsquedas */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
          <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MagnifyingGlassIcon className="w-5 h-5 text-blue-600" />
            Búsquedas Populares
          </h4>
          <div className="space-y-3">
            {topSearches.map((search, index) => (
              <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="text-lg font-bold text-gray-400 w-6 flex-shrink-0">#{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{search.term}</p>
                    <p className="text-xs text-gray-500">{search.count.toLocaleString()} búsquedas</p>
                  </div>
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium flex-shrink-0 ${
                  search.change >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {search.change >= 0 ? '↑' : '↓'} {Math.abs(search.change)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Distritos */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
          <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BuildingOfficeIcon className="w-5 h-5 text-green-600" />
            Distritos Más Buscados
          </h4>
          <div className="space-y-3">
            {topDistricts.map((district, index) => (
              <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="text-lg font-bold text-gray-400 w-6 flex-shrink-0">#{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-900">{district.name}</p>
                    <p className="text-xs text-gray-500">{district.searches} búsquedas · {district.listings} propiedades</p>
                  </div>
                </div>
                <div className="w-16 bg-gray-200 rounded-full h-2 flex-shrink-0">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${(district.searches / topDistricts[0].searches) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg text-xs sm:text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <ClockIcon className="w-4 h-4 text-blue-600" />
          <span>Última actualización: Hace 5 minutos</span>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm font-medium">
          Exportar Reporte PDF
        </button>
      </div>
    </div>
  );
}
