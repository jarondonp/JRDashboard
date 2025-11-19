import { useState } from 'react';
import { motion } from 'framer-motion';
import { useMonthlyExecutiveReport, useAreaProductivityReport, useMoodTrendsReport } from '../hooks/useReports';
import { BarChart } from '../components/charts/BarChart';
import { LineChart } from '../components/charts/LineChart';
import { RadarChart } from '../components/charts/RadarChart';
import { KPICard } from '../components/KPICard';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'ejecutivo' | 'areas' | 'bienestar'>('ejecutivo');

  const { data: executiveReport, isLoading: loadingExecutive } = useMonthlyExecutiveReport();
  const { data: areaReport, isLoading: loadingArea } = useAreaProductivityReport();
  const { data: moodReport, isLoading: loadingMood } = useMoodTrendsReport();

  const tabs = [
    { id: 'ejecutivo' as const, label: '📊 Reporte Ejecutivo', icon: '📊' },
    { id: 'areas' as const, label: '🎯 Análisis por Área', icon: '🎯' },
    { id: 'bienestar' as const, label: '💚 Bienestar y Mood', icon: '💚' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header with gradient */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white px-8 py-8 shadow-lg"
      >
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-1">📈 Reportes y Analytics</h1>
          <p className="text-indigo-100">Insights y métricas de tu progreso</p>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
        {/* Tabs with animation indicator */}
        <div className="bg-white rounded-lg shadow-sm p-1">
          <nav className="flex space-x-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative flex-1 py-3 px-4 rounded-md font-medium text-sm transition-all
                  ${activeTab === tab.id
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-indigo-50 rounded-md -z-10"
                    transition={{ type: "spring", duration: 0.5 }}
                  />
                )}
              </button>
            ))}
          </nav>
        </div>

      {/* Executive Report */}
      {activeTab === 'ejecutivo' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {loadingExecutive ? (
            <div className="flex items-center justify-center py-16">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full"
              />
            </div>
          ) : executiveReport ? (
            <>
              {/* KPIs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPICard
                  title="Tasa de Cumplimiento"
                  value={`${executiveReport.kpis.completionRate}%`}
                  trend="up"
                  trendValue={5}
                  color="green"
                />
                <KPICard
                  title="Metas Completadas"
                  value={`${executiveReport.kpis.completedGoals}/${executiveReport.kpis.totalGoals}`}
                  color="blue"
                />
                <KPICard
                  title="Tareas Completadas"
                  value={`${executiveReport.kpis.completedTasks}/${executiveReport.kpis.totalTasks}`}
                  color="purple"
                />
                <KPICard
                  title="Horas Estimadas"
                  value={`${executiveReport.kpis.totalHours}h`}
                  color="orange"
                />
                <KPICard
                  title="Mood Promedio"
                  value={executiveReport.kpis.avgMood.toFixed(1)}
                  trend={executiveReport.kpis.avgMood >= 3.5 ? 'up' : 'down'}
                  trendValue={Math.round(((executiveReport.kpis.avgMood - 3) / 3) * 100)}
                  color={executiveReport.kpis.avgMood >= 3.5 ? 'green' : 'yellow'}
                />
                <KPICard
                  title="Avances del Mes"
                  value={executiveReport.topAchievements.length.toString()}
                  color="indigo"
                />
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Progreso Diario */}
                <div className="bg-white p-6 rounded-lg shadow-soft border border-gray-100">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">Progreso Diario (últimos 30 días)</h3>
                  <LineChart
                    data={executiveReport.dailyProgress}
                    lines={[
                      { dataKey: 'avances', name: 'Avances', color: '#8b5cf6' },
                      { dataKey: 'mood', name: 'Mood', color: '#10b981' }
                    ]}
                    height={300}
                  />
                </div>

                {/* Performance por Área */}
                <div className="bg-white p-6 rounded-lg shadow-soft border border-gray-100">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">Cumplimiento por Área</h3>
                  <BarChart
                    data={executiveReport.areaPerformance}
                    xKey="area"
                    bars={[
                      { dataKey: 'progreso', name: 'Progreso %', color: '#3b82f6' }
                    ]}
                    height={300}
                  />
                </div>
              </div>

              {/* Top Achievements */}
              <div className="bg-gradient-to-r from-white to-yellow-50 p-6 rounded-lg shadow-soft border border-yellow-100">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">🏆 Top 5 Logros del Mes</h3>
                {executiveReport.topAchievements.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No hay logros de alto impacto registrados este mes.</p>
                ) : (
                  <div className="space-y-3">
                    {executiveReport.topAchievements.map((achievement, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{['🥇', '🥈', '🥉', '🏅', '🏅'][idx]}</span>
                          <div>
                            <p className="font-medium text-gray-900">{achievement.title}</p>
                            <p className="text-sm text-gray-600">{achievement.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: achievement.impact || 0 }).map((_, i) => (
                            <span key={i} className="text-yellow-500">⭐</span>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </motion.div>
      )}

      {/* Area Productivity Report */}
      {activeTab === 'areas' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {loadingArea ? (
            <div className="flex items-center justify-center py-16">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full"
              />
            </div>
          ) : areaReport ? (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Radar de Balance de Vida */}
                <div className="bg-white p-6 rounded-lg shadow-soft border border-gray-100">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">⚖️ Balance de Vida</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Visualización del progreso en cada área de tu vida
                  </p>
                  <RadarChart
                    data={areaReport.radarData}
                    dataKey="progreso"
                    categoryKey="area"
                    height={400}
                    fill="#8b5cf6"
                  />
                </div>

                {/* Tareas por Estado y Área */}
                <div className="bg-white p-6 rounded-lg shadow-soft border border-gray-100">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">📋 Tareas por Estado</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Distribución de tareas en cada área
                  </p>
                  <BarChart
                    data={areaReport.tasksByArea}
                    xKey="area"
                    bars={[
                      { dataKey: 'completadas', name: 'Completadas', color: '#10b981' },
                      { dataKey: 'en_progreso', name: 'En Progreso', color: '#f59e0b' },
                      { dataKey: 'pendientes', name: 'Pendientes', color: '#ef4444' }
                    ]}
                    height={400}
                  />
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold mb-3 text-indigo-900">💡 Recomendaciones</h3>
                <ul className="space-y-2">
                  {areaReport.radarData
                    .filter(area => area.progreso < 50)
                    .map((area, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="text-indigo-600 mt-1">•</span>
                        <p className="text-gray-700">
                          <strong>{area.area}</strong> necesita más atención (progreso: {area.progreso}%)
                        </p>
                      </li>
                    ))}
                  {areaReport.radarData.every(area => area.progreso >= 50) && (
                    <li className="flex items-start space-x-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <p className="text-gray-700">
                        ¡Excelente! Todas las áreas tienen un progreso saludable.
                      </p>
                    </li>
                  )}
                </ul>
              </div>
            </>
          ) : null}
        </motion.div>
      )}

      {/* Mood Trends Report */}
      {activeTab === 'bienestar' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {loadingMood ? (
            <div className="flex items-center justify-center py-16">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full"
              />
            </div>
          ) : moodReport ? (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPICard
                  title="Mood Promedio"
                  value={moodReport.stats.avgMood.toFixed(1)}
                  trend={moodReport.stats.avgMood >= 3.5 ? 'up' : 'down'}
                  color={moodReport.stats.avgMood >= 4 ? 'green' : moodReport.stats.avgMood >= 3 ? 'yellow' : 'red'}
                />
                <KPICard
                  title="Mejor Día"
                  value={moodReport.stats.bestDay.date}
                  subtitle={`Mood: ${moodReport.stats.bestDay.mood}`}
                  color="green"
                />
                <KPICard
                  title="Total Registros"
                  value={moodReport.stats.totalLogs.toString()}
                  color="indigo"
                />
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Mood vs Productividad */}
                <div className="bg-white p-6 rounded-lg shadow-soft border border-gray-100">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">😊 Mood vs Productividad</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Correlación entre estado de ánimo y tareas completadas
                  </p>
                  <LineChart
                    data={moodReport.moodVsProductivity}
                    lines={[
                      { dataKey: 'mood', name: 'Mood', color: '#10b981' },
                      { dataKey: 'tareas', name: 'Tareas', color: '#3b82f6' }
                    ]}
                    height={300}
                  />
                </div>

                {/* Mood Semanal */}
                <div className="bg-white p-6 rounded-lg shadow-soft border border-gray-100">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">📅 Mood por Semana</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Evolución semanal del estado de ánimo
                  </p>
                  <BarChart
                    data={moodReport.weeklyMood}
                    xKey="semana"
                    bars={[
                      { dataKey: 'mood', name: 'Mood Promedio', color: '#8b5cf6' }
                    ]}
                    height={300}
                  />
                </div>
              </div>

              {/* Insights */}
              <div className="bg-gradient-to-r from-green-50 to-teal-50 p-6 rounded-lg border border-green-200">
                <h3 className="text-lg font-semibold mb-3 text-green-900">🧠 Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="text-sm font-medium text-gray-900 mb-2">Patrón de Productividad</p>
                    <p className="text-sm text-gray-600">
                      {moodReport.stats.avgMood >= 3.5
                        ? 'Tu mood positivo se correlaciona con mayor productividad. ¡Sigue así! 🎉'
                        : 'Considera técnicas de bienestar para mejorar tu mood y productividad. 🧘'}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="text-sm font-medium text-gray-900 mb-2">Recomendación</p>
                    <p className="text-sm text-gray-600">
                      {moodReport.stats.totalLogs < 20
                        ? 'Registra tu progreso diariamente para obtener insights más precisos. 📝'
                        : 'Excelente constancia. Usa estos datos para optimizar tu rutina. ⭐'}
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </motion.div>
      )}
    </div>
    </div>
  )
}
