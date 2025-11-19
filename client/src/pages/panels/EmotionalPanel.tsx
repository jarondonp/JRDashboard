import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardBody } from '../../components/Card';
import { AreaPanelHeader, AreaPanelSection, KPICard } from '../../components/AreaPanel';
import { useAreaDashboard } from '../../hooks/useAreaDashboard';

interface EmotionalPanelProps {
  areaId: string;
  areaName: string;
  color: string;
  icon: string;
}

const EmotionalPanel: React.FC<EmotionalPanelProps> = ({ areaId, areaName, color, icon }) => {
  const navigate = useNavigate();
  const { data: dashboard, isLoading } = useAreaDashboard(areaId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No se encontraron datos</p>
      </div>
    );
  }

  // Calcular mood average
  const moodAverage = dashboard.progressLogs.length > 0
    ? (dashboard.progressLogs.reduce((sum: number, log: any) => sum + (log.mood || 0), 0) / dashboard.progressLogs.length).toFixed(1)
    : 0;

  const getMoodEmoji = (mood: number) => {
    if (mood >= 4) return '😄';
    if (mood >= 3) return '🙂';
    if (mood >= 2) return '😐';
    return '😞';
  };

  const getBestMood = dashboard.progressLogs.length > 0
    ? Math.max(...dashboard.progressLogs.map((log: any) => log.mood || 0))
    : 0;

  const getWorstMood = dashboard.progressLogs.length > 0
    ? Math.min(...dashboard.progressLogs.map((log: any) => log.mood || 0))
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-6xl mx-auto">
        <AreaPanelHeader
          areaName={areaName}
          color={color}
          icon={icon}
          panelType="emotional"
          onBack={() => navigate('/areas')}
        />

        {/* KPI Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        >
          <KPICard
            label="Ánimo Promedio"
            value={moodAverage}
            icon={getMoodEmoji(parseFloat(moodAverage as unknown as string))}
            trendValue="/5.0"
          />
          <KPICard
            label="Mejor Ánimo"
            value={getBestMood}
            icon={getMoodEmoji(getBestMood)}
            trend="up"
            trendValue="/5.0"
          />
          <KPICard
            label="Peor Ánimo"
            value={getWorstMood}
            icon={getMoodEmoji(getWorstMood)}
            trend="down"
            trendValue="/5.0"
          />
          <KPICard
            label="Registros Totales"
            value={dashboard.progressLogs.length}
            icon="📊"
            trendValue="registros"
          />
        </motion.div>

        {/* Mood Trend Chart */}
        <AreaPanelSection
          title="Historial de Ánimo (últimos 7 registros)"
          icon="📈"
          delay={0.2}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card>
              <CardBody>
                <div className="space-y-3">
                  {dashboard.progressLogs.slice(0, 7).map((log: any, idx: number) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getMoodEmoji(log.mood || 0)}</span>
                        <div>
                          <p className="font-semibold text-gray-900">{log.description || 'Registro de ánimo'}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(log.created_at).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        log.mood >= 4 ? 'bg-green-100 text-green-800' :
                        log.mood >= 3 ? 'bg-blue-100 text-blue-800' :
                        log.mood >= 2 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {log.mood}/5
                      </span>
                    </motion.div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </motion.div>
        </AreaPanelSection>

        {/* Metas con Progress */}
        <AreaPanelSection
          title="Metas de Bienestar"
          icon="🎯"
          delay={0.3}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {dashboard.goals.length > 0 ? (
              dashboard.goals.map((goal: any, idx: number) => (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card>
                    <CardBody>
                      <h3 className="font-bold text-gray-900 mb-2">{goal.title}</h3>
                      <p className="text-sm text-gray-600 mb-4">{goal.description}</p>
                      <div className="mb-2 flex justify-between items-center">
                        <span className="text-sm font-semibold text-gray-700">Progreso</span>
                        <span className="text-sm font-bold text-indigo-600">{goal.computed_progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${goal.computed_progress}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className="bg-indigo-600 h-2 rounded-full"
                        />
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>
              ))
            ) : (
              <p className="text-gray-600 col-span-2">No hay metas en esta área</p>
            )}
          </motion.div>
        </AreaPanelSection>

        {/* Insights */}
        <AreaPanelSection
          title="Insights de Bienestar"
          icon="💡"
          delay={0.4}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <Card>
              <CardBody>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                    <p className="text-sm text-blue-900">
                      <strong>Ánimo General:</strong> Tu promedio de bienestar es {moodAverage}/5. {
                        parseFloat(moodAverage as unknown as string) >= 3.5 ? '¡Excelente! Mantén tus hábitos.' :
                        parseFloat(moodAverage as unknown as string) >= 3 ? 'Está bien, busca mejorar poco a poco.' :
                        'Considera ajustar actividades de autocuidado.'
                      }
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 border-l-4 border-green-500 rounded">
                    <p className="text-sm text-green-900">
                      <strong>Consistencia:</strong> Has registrado {dashboard.progressLogs.length} avances de bienestar. Sigue siendo consistente.
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        </AreaPanelSection>
      </div>
    </div>
  );
};

export default EmotionalPanel;
