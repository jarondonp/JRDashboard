import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardBody } from '../../components/Card';
import { AreaPanelHeader, AreaPanelSection, KPICard } from '../../components/AreaPanel';
import PanelScopeSelector from './components/PanelScopeSelector';
import { usePanelScopeSelection } from '../../hooks';
import type { AreaCategoryConfig } from '../../constants/areaCategories';
import type { AreaDashboardData } from '../../services/areasDashboardApi';
import type { CategorisedAreaDashboard } from '../../utils/categoryDashboard';

interface CommercialPanelProps {
  category: AreaCategoryConfig;
  dashboards: CategorisedAreaDashboard[];
  aggregatedDashboard?: AreaDashboardData;
  subtitle: string;
  initialAreaId?: string;
}

const CommercialPanel: React.FC<CommercialPanelProps> = ({
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
          No se encontraron datos comerciales para las áreas seleccionadas.
        </p>
      </div>
    );
  }

  const isGlobal = scopeType === 'global';
  const goals = currentDashboard.goals ?? [];
  const tasks = currentDashboard.tasks ?? [];

  const activeProjects = goals.filter((goal: any) =>
    ['en_progreso', 'in_progress', 'activo'].includes((goal.status || '').toLowerCase()),
  ).length;
  const completedProjects = goals.filter((goal: any) =>
    ['completada', 'completed', 'cerrado', 'closed'].includes((goal.status || '').toLowerCase()),
  ).length;
  const pendingFollowups = tasks.filter((task: any) =>
    ['pendiente', 'pending', 'to_do'].includes((task.status || '').toLowerCase()),
  ).length;

  const areaSummaries = useMemo(
    () =>
      dashboards.map(({ area, dashboard }) => ({
        id: area.id,
        name: area.name,
        pipeline: dashboard.goals.length,
        completed: dashboard.goals.filter((goal: any) =>
          ['completada', 'completed'].includes((goal.status || '').toLowerCase()),
        ).length,
        avgProgress: dashboard.metrics?.avgGoalProgress ?? 0,
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
          panelType="commercial"
          subtitle={headerSubtitle}
          onBack={() => navigate('/areas')}
        />

        <PanelScopeSelector options={options} selectedId={selectedId} onSelect={setSelectedId} />

        {isGlobal && areaSummaries.length > 1 && (
          <AreaPanelSection title="🎯 Resumen de áreas comerciales" icon="🗂️" delay={0.15}>
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
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{summary.name}</h3>
                      <p className="text-sm text-gray-600 mb-1">
                        Proyectos activos: {summary.pipeline}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        Cerrados: {summary.completed}
                      </p>
                      <p className="text-sm text-gray-600">
                        Progreso promedio: {summary.avgProgress.toFixed(0)}%
                      </p>
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
          <KPICard label="Proyectos en Pipeline" value={goals.length} icon="🎯" trendValue="total" />
          <KPICard
            label="Proyectos Activos"
            value={activeProjects}
            icon="⚡"
            trend="up"
            trendValue="en progreso"
          />
          <KPICard
            label="Proyectos Cerrados"
            value={completedProjects}
            icon="✅"
            trend="up"
            trendValue="completados"
          />
          <KPICard
            label="Seguimientos Pendientes"
            value={pendingFollowups}
            icon="📞"
            trendValue="acciones"
          />
        </motion.div>

        <AreaPanelSection title="Pipeline de proyectos" icon="🏢" delay={0.3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.33 }}
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
                          <span className="text-sm font-bold text-green-600">
                            {(goal.computed_progress ?? 0).toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${goal.computed_progress ?? 0}%` }}
                            transition={{ duration: 0.6 }}
                            className="bg-green-500 h-2 rounded-full"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-semibold ${
                            (goal.status || '').toLowerCase() === 'completada'
                              ? 'bg-green-100 text-green-800'
                              : (goal.status || '').toLowerCase() === 'en_progreso'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {(goal.status || '').toLowerCase() === 'completada'
                            ? '✓ Cerrado'
                            : (goal.status || '').toLowerCase() === 'en_progreso'
                            ? 'Activo'
                            : 'Prospecto'}
                        </span>
                        {goal.priority && (
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-semibold ${
                              (goal.priority || '').toLowerCase() === 'alta'
                                ? 'bg-red-100 text-red-800'
                                : (goal.priority || '').toLowerCase() === 'media'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {goal.priority}
                          </span>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>
              ))
            ) : (
              <p className="text-gray-600 col-span-2">No hay proyectos en pipeline.</p>
            )}
          </motion.div>
        </AreaPanelSection>

        <AreaPanelSection title="Tareas de seguimiento y contacto" icon="📞" delay={0.35}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38 }}
          >
            <Card>
              <CardBody>
                {tasks.length ? (
                  <div className="space-y-2">
                    {tasks.slice(0, 6).map((task: any, idx: number) => (
                      <motion.div
                        key={task.id ?? `${task.title}-${idx}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">{task.title}</p>
                          <p className="text-xs text-gray-600">
                            {task.due_date
                              ? new Date(task.due_date).toLocaleDateString('es-ES')
                              : 'Sin fecha límite'}
                          </p>
                          {task.__area?.name && isGlobal && (
                            <p className="text-xs text-indigo-500 mt-1">
                              Área: {task.__area.name}
                            </p>
                          )}
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-semibold ${
                            (task.status || '').toLowerCase() === 'completada'
                              ? 'bg-green-100 text-green-800'
                              : (task.status || '').toLowerCase() === 'en_progreso'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {task.status ?? 'pendiente'}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">
                    No hay tareas asignadas en esta vista.
                  </p>
                )}
              </CardBody>
            </Card>
          </motion.div>
        </AreaPanelSection>

        <AreaPanelSection title="Análisis de desempeño" icon="📊" delay={0.4}>
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
                      <strong>Conversión:</strong>{' '}
                      {goals.length
                        ? `${((completedProjects / goals.length) * 100).toFixed(0)}%`
                        : '0%'}{' '}
                      de proyectos cerrados.
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 border-l-4 border-green-500 rounded">
                    <p className="text-sm text-green-900">
                      <strong>Pipeline activo:</strong> {activeProjects} proyecto(s) en curso. Progreso
                      promedio: {(currentDashboard.metrics?.avgGoalProgress ?? 0).toFixed(0)}%.
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 border-l-4 border-purple-500 rounded">
                    <p className="text-sm text-purple-900">
                      <strong>Acción recomendada:</strong>{' '}
                      {isGlobal
                        ? 'Coordina con las áreas que tienen más tareas pendientes para acelerar cierres.'
                        : 'Prioriza los seguimientos con clientes de alta prioridad para mejorar la tasa de conversión.'}
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

export default CommercialPanel;
