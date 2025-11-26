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

interface MigrationPanelProps {
  category: AreaCategoryConfig;
  dashboards: CategorisedAreaDashboard[];
  aggregatedDashboard?: AreaDashboardData;
  subtitle: string;
  initialAreaId?: string;
}

const MigrationPanel: React.FC<MigrationPanelProps> = ({
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
        <p className="text-gray-600">No se encontraron datos de migración para mostrar.</p>
      </div>
    );
  }

  const isGlobal = scopeType === 'global';

  const goals = currentDashboard.goals ?? [];
  const tasks = currentDashboard.tasks ?? [];
  const metrics = currentDashboard.metrics ?? {
    totalGoals: 0,
    totalTasks: 0,
    completedTasks: 0,
    taskCompletionRate: 0,
  };

  const completedTasks = tasks.filter((task: any) =>
    ['completada', 'completed', 'hecho', 'done'].includes((task.status || '').toLowerCase()),
  ).length;

  const criticalDocuments = goals.filter((goal: any) =>
    ['alta', 'critical', 'priority'].includes((goal.priority || '').toLowerCase()),
  ).length;

  const areaSummaries = useMemo(
    () =>
      dashboards.map(({ area, dashboard }) => ({
        id: area.id,
        name: area.name,
        totalStages: dashboard.goals.length,
        completedTasks:
          dashboard.tasks.filter((task: any) =>
            ['completada', 'completed'].includes((task.status || '').toLowerCase()),
          ).length,
        progress: dashboard.metrics?.taskCompletionRate ?? 0,
      })),
    [dashboards],
  );

  const pendingTasks = tasks.filter(
    (task: any) => !['completada', 'completed'].includes((task.status || '').toLowerCase()),
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
          panelType="migration"
          subtitle={headerSubtitle}
          onBack={() => navigate('/areas')}
        />

        <PanelScopeSelector options={options} selectedId={selectedId} onSelect={setSelectedId} />

        {isGlobal && areaSummaries.length > 1 && (
          <AreaPanelSection
            title="🧭 Resumen por área de migración"
            icon="🗺️"
            delay={0.15}
          >
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
                      <p className="text-sm text-gray-600 mb-2">
                        Etapas registradas: {summary.totalStages}
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        Tareas completadas: {summary.completedTasks}
                      </p>
                      <p className="text-sm text-gray-600">
                        Progreso del área: {summary.progress.toFixed(0)}%
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
          <KPICard label="Etapas del Proceso" value={goals.length} icon="📋" trendValue="etapas" />
          <KPICard
            label="Tareas Completadas"
            value={completedTasks}
            icon="✅"
            trend="up"
            trendValue={`/${tasks.length}`}
          />
          <KPICard
            label="Documentos Críticos"
            value={criticalDocuments}
            icon="🔴"
            trendValue="prioridad"
          />
          <KPICard
            label="Progreso General"
            value={`${(metrics.taskCompletionRate ?? 0).toFixed(0)}%`}
            icon="📊"
            trend="up"
            trendValue="avance"
          />
        </motion.div>

        <AreaPanelSection title="Etapas del Proceso Migratorio" icon="🔄" delay={0.3}>
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
                      <h3 className="font-bold text-gray-900 mb-2">{goal.title}</h3>
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
                      <div className="flex gap-2">
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-semibold ${
                            (goal.priority || '').toLowerCase() === 'alta'
                              ? 'bg-red-100 text-red-800'
                              : (goal.priority || '').toLowerCase() === 'media'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {goal.priority ?? 'prioridad media'}
                        </span>
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>
              ))
            ) : (
              <p className="text-gray-600 col-span-2">No hay etapas registradas.</p>
            )}
          </motion.div>
        </AreaPanelSection>

        <AreaPanelSection title="Tareas y trámites pendientes" icon="📋" delay={0.35}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38 }}
          >
            <Card>
              <CardBody>
                {pendingTasks.length ? (
                  <div className="space-y-2">
                    {pendingTasks.slice(0, 5).map((task: any, idx: number) => (
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
                            Vence:{' '}
                            {task.due_date
                              ? new Date(task.due_date).toLocaleDateString('es-ES')
                              : 'Sin fecha'}
                          </p>
                          {task.__area?.name && isGlobal && (
                            <p className="text-xs text-indigo-500 mt-1">
                              Área responsable: {task.__area.name}
                            </p>
                          )}
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-semibold ${
                            (task.status || '').toLowerCase() === 'en_progreso'
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
                    No hay tareas pendientes en esta vista. ¡Buen trabajo!
                  </p>
                )}
              </CardBody>
            </Card>
          </motion.div>
        </AreaPanelSection>

        <AreaPanelSection title="Documentos y recomendaciones" icon="🛂" delay={0.4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.43 }}
          >
            <Card>
              <CardBody>
                <div className="space-y-3">
                  <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded">
                    <p className="text-sm text-red-900">
                      <strong>Documentos críticos:</strong> {criticalDocuments} documento(s) marcados
                      como de alta prioridad. Revisa que estén actualizados.
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                    <p className="text-sm text-blue-900">
                      <strong>Progreso acumulado:</strong> {metrics.taskCompletionRate ?? 0}% de las
                      tareas migratorias están completadas.
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 border-l-4 border-purple-500 rounded">
                    <p className="text-sm text-purple-900">
                      <strong>Siguiente acción:</strong>{' '}
                      {isGlobal
                        ? 'Coordina con las áreas que tienen menor porcentaje de avance para mantener el proceso sincronizado.'
                        : 'Verifica citas, requisitos consulares y prepara respaldos digitales de todo documento enviado.'}
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

export default MigrationPanel;
