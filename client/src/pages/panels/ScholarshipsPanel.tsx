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

interface ScholarshipsPanelProps {
  category: AreaCategoryConfig;
  dashboards: CategorisedAreaDashboard[];
  aggregatedDashboard?: AreaDashboardData;
  subtitle: string;
  initialAreaId?: string;
}

const ScholarshipsPanel: React.FC<ScholarshipsPanelProps> = ({
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
        <p className="text-gray-600">No se encontraron datos para las áreas de becas.</p>
      </div>
    );
  }

  const isGlobal = scopeType === 'global';

  const goals = currentDashboard.goals ?? [];
  const tasks = currentDashboard.tasks ?? [];

  const applications = goals.length;
  const completedApplications = goals.filter((goal: any) =>
    ['completada', 'accepted', 'aceptada'].includes((goal.status || '').toLowerCase()),
  ).length;

  const upcomingDeadlines = tasks.filter((task: any) => {
    if (!task.due_date) return false;
    const diff = Math.ceil((new Date(task.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff > 0 && diff <= 14;
  }).length;

  const areaSummaries = useMemo(
    () =>
      dashboards.map(({ area, dashboard }) => ({
        id: area.id,
        name: area.name,
        color: area.color ?? category.panelColor,
        totalApplications: dashboard.goals.length,
        completedApplications: dashboard.goals.filter((goal: any) =>
          ['completada', 'accepted', 'aceptada'].includes((goal.status || '').toLowerCase()),
        ).length,
        upcomingDeadlines: dashboard.tasks.filter((task: any) => {
          if (!task.due_date) return false;
          const diff = Math.ceil((new Date(task.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          return diff > 0 && diff <= 14;
        }).length,
      })),
    [dashboards, category.panelColor],
  );

  const deadlinesList = useMemo(() => {
    return tasks
      .filter((task: any) => {
        if (!task.due_date) return false;
        const diff = Math.ceil((new Date(task.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return diff > 0 && diff <= 14;
      })
      .map((task: any) => ({
        ...task,
        __daysLeft: Math.ceil((new Date(task.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      }))
      .sort((a, b) => a.__daysLeft - b.__daysLeft);
  }, [tasks]);

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
          panelType="scholarships"
          subtitle={headerSubtitle}
          onBack={() => navigate('/areas')}
        />

        <PanelScopeSelector options={options} selectedId={selectedId} onSelect={setSelectedId} />

        {isGlobal && areaSummaries.length > 1 && (
          <AreaPanelSection
            title="📚 Resumen por área educativa"
            icon="🗂️"
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
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{summary.name}</h3>
                        <span className="text-sm text-gray-500">
                          {summary.completedApplications}/{summary.totalApplications} aceptadas
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-3">
                        Deadlines próximos: {summary.upcomingDeadlines}
                      </p>
                      <div className="flex gap-4 text-sm text-gray-600">
                        <div>
                          <p className="font-semibold text-indigo-600">{summary.totalApplications}</p>
                          <p>Aplicaciones</p>
                        </div>
                        <div>
                          <p className="font-semibold text-emerald-600">{summary.completedApplications}</p>
                          <p>Aceptadas</p>
                        </div>
                      </div>
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
          <KPICard label="Aplicaciones Totales" value={applications} icon="📝" trendValue="aplicaciones" />
          <KPICard
            label="Aceptadas"
            value={completedApplications}
            icon="🎉"
            trend="up"
            trendValue={`/${applications}`}
          />
          <KPICard
            label="Deadlines Próximos"
            value={upcomingDeadlines}
            icon="⏰"
            trendValue="próximas 2 semanas"
          />
          <KPICard
            label="Tasa de Éxito"
            value={
              applications > 0
                ? `${((completedApplications / applications) * 100).toFixed(0)}%`
                : '0%'
            }
            icon="📊"
            trend="up"
            trendValue="aceptación"
          />
        </motion.div>

        <AreaPanelSection title="Estado de Aplicaciones" icon="🎓" delay={0.3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.33 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {goals.length > 0 ? (
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
                        <p className="text-xs text-indigo-500 mb-2">
                          Área: {goal.__area.name}
                        </p>
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
                            (goal.status || '').toLowerCase() === 'completada'
                              ? 'bg-green-100 text-green-800'
                              : (goal.status || '').toLowerCase() === 'en_progreso'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {(goal.status || '').toLowerCase() === 'completada'
                            ? '✓ Aceptada'
                            : (goal.status || '').toLowerCase() === 'en_progreso'
                            ? 'En revisión'
                            : 'Pendiente'}
                        </span>
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>
              ))
            ) : (
              <p className="text-gray-600 col-span-2">No hay aplicaciones registradas</p>
            )}
          </motion.div>
        </AreaPanelSection>

        <AreaPanelSection title="Deadlines próximos (14 días)" icon="📅" delay={0.35}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38 }}
          >
            <Card>
              <CardBody>
                {deadlinesList.length ? (
                  <div className="space-y-2">
                    {deadlinesList.map((task: any, idx: number) => (
                      <motion.div
                        key={task.id ?? idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`p-3 rounded-lg ${
                          task.__daysLeft <= 3
                            ? 'bg-red-50'
                            : task.__daysLeft <= 7
                            ? 'bg-yellow-50'
                            : 'bg-blue-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">{task.title}</p>
                            <p className="text-xs text-gray-600">
                              {task.due_date
                                ? new Date(task.due_date).toLocaleDateString('es-ES')
                                : 'Sin fecha'}
                            </p>
                            {task.__area?.name && isGlobal && (
                              <p className="text-xs text-indigo-500 mt-1">
                                Área: {task.__area.name}
                              </p>
                            )}
                          </div>
                          <span
                            className={`text-xs px-3 py-1 rounded-full font-bold ${
                              task.__daysLeft <= 3
                                ? 'bg-red-100 text-red-800'
                                : task.__daysLeft <= 7
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {task.__daysLeft} día{task.__daysLeft !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">
                    No hay fechas límite dentro de las próximas dos semanas.
                  </p>
                )}
              </CardBody>
            </Card>
          </motion.div>
        </AreaPanelSection>

        <AreaPanelSection
          title="Checklist y recomendaciones"
          icon="✅"
          delay={0.4}
        >
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
                      <strong>Aplicaciones en curso:</strong>{' '}
                      {goals.filter((goal: any) =>
                        ['en_progreso', 'en revision', 'in_progress'].includes(
                          (goal.status || '').toLowerCase(),
                        ),
                      ).length}{' '}
                      solicitud(es) requieren seguimiento.
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 border-l-4 border-green-500 rounded">
                    <p className="text-sm text-green-900">
                      <strong>Tasa de éxito acumulada:</strong>{' '}
                      {applications > 0
                        ? `${((completedApplications / Math.max(applications, 1)) * 100).toFixed(0)}%`
                        : '0%'}{' '}
                      de aceptación hasta ahora.
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 border-l-4 border-purple-500 rounded">
                    <p className="text-sm text-purple-900">
                      <strong>Próximo paso:</strong>{' '}
                      {isGlobal
                        ? 'Prioriza la documentación de las áreas con más deadlines cercanos para evitar perder oportunidades.'
                        : 'Revisa los requisitos pendientes de esta área y prepara con antelación cartas, ensayos y referencias.'}
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

export default ScholarshipsPanel;
