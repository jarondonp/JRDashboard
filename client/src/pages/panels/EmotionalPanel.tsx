import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardBody } from '../../components/Card';
import { AreaPanelHeader, AreaPanelSection, KPICard } from '../../components/AreaPanel';
import PanelScopeSelector from './components/PanelScopeSelector';
import { usePanelScopeSelection } from '../../hooks';
import type { AreaDashboardData } from '../../services/areasDashboardApi';
import type { AreaCategoryConfig } from '../../constants/areaCategories';
import type { CategorisedAreaDashboard } from '../../utils/categoryDashboard';

interface EmotionalPanelProps {
  category: AreaCategoryConfig;
  dashboards: CategorisedAreaDashboard[];
  aggregatedDashboard?: AreaDashboardData;
  subtitle: string;
  initialAreaId?: string;
}

const getMoodEmoji = (mood: number) => {
  if (mood >= 4) return '😄';
  if (mood >= 3) return '🙂';
  if (mood >= 2) return '😐';
  return '😞';
};

const EmotionalPanel: React.FC<EmotionalPanelProps> = ({
  category,
  dashboards,
  aggregatedDashboard,
  subtitle,
  initialAreaId,
}) => {
  const navigate = useNavigate();

  const {
    options,
    selectedId,
    setSelectedId,
    scopeType,
    currentDashboard,
    currentArea,
  } = usePanelScopeSelection({
    aggregatedDashboard,
    dashboards,
    subtitle,
    globalLabel: 'Visión global',
    globalIcon: category.panelIcon,
    initialSelectedId: initialAreaId,
  });

  if (!currentDashboard || !currentArea) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">
          No se encontraron registros de bienestar para las áreas seleccionadas.
        </p>
      </div>
    );
  }

  const isGlobal = scopeType === 'global';
  const progressLogs = currentDashboard.progressLogs ?? [];
  const goals = currentDashboard.goals ?? [];

  const moodAverage = progressLogs.length
    ? progressLogs.reduce((sum: number, log: any) => sum + (log.mood || 0), 0) / progressLogs.length
    : 0;

  const bestMood = progressLogs.length
    ? Math.max(...progressLogs.map((log: any) => log.mood || 0))
    : 0;

  const worstMood = progressLogs.length
    ? Math.min(...progressLogs.map((log: any) => log.mood || 0))
    : 0;

  const areaSummaries = useMemo(
    () =>
      dashboards.map(({ area, dashboard }) => ({
        id: area.id,
        name: area.name,
        avgMood:
          dashboard.progressLogs.length > 0
            ? dashboard.progressLogs.reduce((sum: number, log: any) => sum + (log.mood || 0), 0) /
              dashboard.progressLogs.length
            : 0,
        logs: dashboard.progressLogs.length,
      })),
    [dashboards],
  );

  const headerName = isGlobal ? category.panelTitle : currentArea.name;
  const headerColor = isGlobal ? category.panelColor : currentArea.color ?? category.panelColor;
  const headerIcon = isGlobal ? category.panelIcon : currentArea.icon ?? category.panelIcon;
  const headerSubtitle = isGlobal
    ? aggregatedDashboard?.area.description || subtitle
    : currentArea.description || subtitle;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-6xl mx-auto">
        <AreaPanelHeader
          areaName={headerName}
          color={headerColor}
          icon={headerIcon}
          panelType="emotional"
          subtitle={headerSubtitle}
          onBack={() => navigate('/areas')}
        />

        <PanelScopeSelector options={options} selectedId={selectedId} onSelect={setSelectedId} />

        {isGlobal && areaSummaries.length > 1 && (
          <AreaPanelSection title="💞 Resumen emocional por área" icon="🧠" delay={0.15}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {areaSummaries.map((summary, idx) => (
                <motion.div
                  key={summary.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card hover>
                    <CardBody>
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">{summary.name}</h3>
                        <span className="text-2xl">{getMoodEmoji(summary.avgMood)}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Ánimo promedio: {summary.avgMood.toFixed(1)}/5
                      </p>
                      <p className="text-sm text-gray-600">Registros: {summary.logs}</p>
                    </CardBody>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </AreaPanelSection>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        >
          <KPICard
            label="Ánimo promedio"
            value={moodAverage.toFixed(1)}
            icon={getMoodEmoji(moodAverage)}
            trendValue="/5.0"
          />
          <KPICard
            label="Mejor estado"
            value={bestMood}
            icon={getMoodEmoji(bestMood)}
            trend="up"
            trendValue="/5.0"
          />
          <KPICard
            label="Peor estado"
            value={worstMood}
            icon={getMoodEmoji(worstMood)}
            trend="down"
            trendValue="/5.0"
          />
          <KPICard
            label="Registros totales"
            value={progressLogs.length}
            icon="📊"
            trendValue="registros"
          />
        </motion.div>

        <AreaPanelSection title="Historial de ánimo" icon="📈" delay={0.3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.33 }}
          >
            <Card>
              <CardBody>
                {progressLogs.slice(0, 7).length ? (
                  <div className="space-y-3">
                    {progressLogs.slice(0, 7).map((log: any, idx: number) => (
                      <motion.div
                        key={log.id ?? idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getMoodEmoji(log.mood || 0)}</span>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {log.description || 'Registro de ánimo'}
                            </p>
                            <p className="text-sm text-gray-600">
                              {log.date
                                ? new Date(log.date).toLocaleDateString('es-ES')
                                : log.created_at
                                ? new Date(log.created_at).toLocaleDateString('es-ES')
                                : 'Sin fecha'}
                            </p>
                            {log.__area?.name && isGlobal && (
                              <p className="text-xs text-indigo-500 mt-1">
                                Área: {log.__area.name}
                              </p>
                            )}
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            log.mood >= 4
                              ? 'bg-green-100 text-green-800'
                              : log.mood >= 3
                              ? 'bg-blue-100 text-blue-800'
                              : log.mood >= 2
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {log.mood}/5
                        </span>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">
                    No hay registros de ánimo disponibles para esta vista.
                  </p>
                )}
              </CardBody>
            </Card>
          </motion.div>
        </AreaPanelSection>

        <AreaPanelSection title="Metas de bienestar" icon="🎯" delay={0.35}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {goals.length ? (
              goals.map((goal: any, idx: number) => (
                <motion.div
                  key={goal.id ?? `${goal.title}-${idx}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card hover>
                    <CardBody>
                      <h3 className="font-bold text-gray-900 mb-1">{goal.title}</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        {goal.description || 'Sin descripción registrada.'}
                      </p>
                      {goal.__area?.name && isGlobal && (
                        <p className="text-xs text-indigo-500 mb-2">Área: {goal.__area.name}</p>
                      )}
                      <div className="mb-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-semibold text-gray-700">Progreso</span>
                          <span className="text-sm font-bold text-indigo-600">
                            {(goal.computed_progress ?? 0).toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${goal.computed_progress ?? 0}%` }}
                            transition={{ duration: 0.6 }}
                            className="bg-indigo-600 h-2 rounded-full"
                          />
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>
              ))
            ) : (
              <p className="text-gray-500 text-sm col-span-2">
                No hay metas de bienestar registradas.
              </p>
            )}
          </motion.div>
        </AreaPanelSection>

        <AreaPanelSection title="Insights de bienestar" icon="💡" delay={0.4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.43 }}
          >
            <Card>
              <CardBody>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                    <p className="text-sm text-blue-900">
                      <strong>Ánimo general:</strong> Tu promedio actual es {moodAverage.toFixed(1)}/5.{' '}
                      {moodAverage >= 3.5
                        ? '¡Excelente! Sigue reforzando las actividades que te brindan bienestar.'
                        : moodAverage >= 3
                        ? 'Bien, pero puedes sumar micro-hábitos de cuidado personal para subirlo aún más.'
                        : 'Evalúa incorporar pausas activas, meditación o apoyo profesional para elevar tu estado de ánimo.'}
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 border-l-4 border-green-500 rounded">
                    <p className="text-sm text-green-900">
                      <strong>Consistencia:</strong> Has registrado {progressLogs.length} avances. Mantén
                      la constancia para detectar patrones positivos y alertas tempranas.
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
