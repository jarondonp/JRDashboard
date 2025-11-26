import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardBody } from '../../components/Card';
import { AreaPanelHeader, AreaPanelSection, KPICard } from '../../components/AreaPanel';
import { BarChart } from '../../components/charts/BarChart';
import PanelScopeSelector from './components/PanelScopeSelector';
import { usePanelScopeSelection } from '../../hooks';
import type { AreaCategoryConfig } from '../../constants/areaCategories';
import type { AreaDashboardData } from '../../services/areasDashboardApi';
import type { CategorisedAreaDashboard } from '../../utils/categoryDashboard';

interface FinancialPanelProps {
  category: AreaCategoryConfig;
  dashboards: CategorisedAreaDashboard[];
  aggregatedDashboard?: AreaDashboardData;
  subtitle: string;
  initialAreaId?: string;
}

const FinancialPanel: React.FC<FinancialPanelProps> = ({
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

  const isGlobalScope = scopeType === 'global';

  if (!currentDashboard || !currentArea) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">
          No se pudieron obtener los datos del panel financiero.
        </p>
      </div>
    );
  }

  const goals = currentDashboard.goals ?? [];
  const metrics = currentDashboard.metrics ?? {
    totalGoals: 0,
    completedGoals: 0,
    goalCompletionRate: 0,
    avgGoalProgress: 0,
    totalTasks: 0,
    completedTasks: 0,
    taskCompletionRate: 0,
    avgTaskProgress: 0,
    avgMood: 0,
    progressLogsCount: 0,
  };

  const completedGoals = goals.filter((goal: any) =>
    ['completada', 'completed'].includes((goal.status || '').toLowerCase()),
  ).length;

  const financialDocuments = goals.filter((goal: any) => {
    const title = (goal.title || '').toLowerCase();
    return title.includes('presupuesto') || title.includes('ahorro') || title.includes('budget') || title.includes('savings');
  }).length;

  const balanceInsights = useMemo(() => {
    if (!goals.length) {
      return [
        { category: 'Ahorro', count: 0, percentage: 0 },
        { category: 'Presupuesto', count: 0, percentage: 0 },
        { category: 'Inversión', count: 0, percentage: 0 },
      ];
    }

    const totals = {
      savings: 0,
      budget: 0,
      investment: 0,
    };

    goals.forEach((goal: any) => {
      const title = (goal.title || '').toLowerCase();
      if (title.includes('ahorro') || title.includes('savings')) totals.savings += 1;
      if (title.includes('presupuesto') || title.includes('budget')) totals.budget += 1;
      if (title.includes('inversión') || title.includes('investment')) totals.investment += 1;
    });

    const total = goals.length || 1;

    return [
      { category: 'Ahorro', count: totals.savings, percentage: (totals.savings / total) * 100 },
      { category: 'Presupuesto', count: totals.budget, percentage: (totals.budget / total) * 100 },
      { category: 'Inversión', count: totals.investment, percentage: (totals.investment / total) * 100 },
    ];
  }, [goals]);

  const comparisonData = useMemo(() => {
    if (dashboards.length <= 1) return [];
    return dashboards.map(({ area, dashboard }) => ({
      name: area.name.length > 18 ? `${area.name.slice(0, 18)}…` : area.name,
      progreso: dashboard?.metrics?.avgGoalProgress ?? 0,
    }));
  }, [dashboards]);

  const areaSummaries = useMemo(
    () =>
      dashboards.map(({ area, dashboard }) => ({
        id: area.id,
        name: area.name,
        color: area.color ?? category.panelColor,
        goals: dashboard.metrics?.totalGoals ?? 0,
        completedGoals: dashboard.metrics?.completedGoals ?? 0,
        avgGoalProgress: dashboard.metrics?.avgGoalProgress ?? 0,
        tasks: dashboard.metrics?.totalTasks ?? 0,
        completedTasks: dashboard.metrics?.completedTasks ?? 0,
      })),
    [dashboards, category.panelColor],
  );

  const headerName = isGlobalScope ? category.panelTitle : currentArea.name;
  const headerColor = isGlobalScope ? category.panelColor : currentArea.color ?? category.panelColor;
  const headerIcon = isGlobalScope ? category.panelIcon : currentArea.icon ?? category.panelIcon;
  const headerSubtitle = isGlobalScope
    ? aggregatedDashboard?.area.description || subtitle
    : currentArea.description || subtitle;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-6xl mx-auto">
        <AreaPanelHeader
          areaName={headerName}
          color={headerColor}
          icon={headerIcon}
          panelType="financial"
          subtitle={headerSubtitle}
          onBack={() => navigate('/areas')}
        />

        <PanelScopeSelector
          options={options}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />

        {isGlobalScope && areaSummaries.length > 1 && (
          <AreaPanelSection
            title="📊 Resumen por área financiera"
            icon="🗂️"
            delay={0.1}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
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
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">{summary.name}</h3>
                        <span className="text-sm text-gray-500">
                          {summary.completedGoals}/{summary.goals} metas
                        </span>
                      </div>
                      <div className="flex gap-4 text-sm text-gray-600">
                        <div>
                          <p className="font-semibold text-indigo-600">
                            {summary.avgGoalProgress.toFixed(0)}%
                          </p>
                          <p>Progreso promedio</p>
                        </div>
                        <div>
                          <p className="font-semibold text-emerald-600">
                            {summary.completedTasks}/{summary.tasks}
                          </p>
                          <p>Tareas completadas</p>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </AreaPanelSection>
        )}

        {/* KPI Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        >
          <KPICard
            label="Metas Financieras"
            value={goals.length}
            icon="🎯"
            trendValue="metas"
          />
          <KPICard
            label="Metas Completadas"
            value={completedGoals}
            icon="✅"
            trend="up"
            trendValue={`/${goals.length}`}
          />
          <KPICard
            label="Presupuestos Activos"
            value={financialDocuments}
            icon="💰"
            trendValue="presupuestos"
          />
          <KPICard
            label="Progreso General"
            value={`${(metrics.goalCompletionRate ?? 0).toFixed(0)}%`}
            icon="📊"
            trend="up"
            trendValue="cumplimiento"
          />
        </motion.div>

        {/* Comparativa entre áreas */}
        {comparisonData.length > 1 && (
          <AreaPanelSection
            title="📊 Comparativa de áreas financieras"
            icon="📈"
            delay={0.25}
          >
            <Card>
              <CardBody>
                <p className="text-sm text-gray-600 mb-3">
                  Evolución del progreso promedio en cada área que forma parte del panel financiero.
                </p>
                <BarChart
                  data={comparisonData}
                  xKey="name"
                  bars={[{ key: 'progreso', name: 'Progreso promedio', color: '#10b981' }]}
                />
              </CardBody>
            </Card>
          </AreaPanelSection>
        )}

        {/* Balance Financiero */}
        <AreaPanelSection
          title="⚖️ Balance: Ahorro vs Presupuesto vs Inversión"
          icon="💰"
          delay={0.3}
        >
          <Card>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {balanceInsights.map((item, idx) => (
                  <motion.div
                    key={item.category}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.32 + idx * 0.05 }}
                    className="text-center p-4 bg-gradient-to-br from-green-50 to-teal-50 rounded-lg border border-green-200"
                  >
                    <div className="text-3xl font-bold text-green-700">{item.count}</div>
                    <p className="text-sm text-gray-700 font-semibold mt-1">{item.category}</p>
                    <p className="text-xs text-gray-600 mt-1">{item.percentage.toFixed(0)}% del total</p>
                  </motion.div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-purple-50 border-l-4 border-purple-500 rounded">
                <p className="text-sm text-purple-900">
                  <strong>Recomendación de balance:</strong>{' '}
                  {balanceInsights[0].count > balanceInsights[2].count * 2
                    ? 'Hay foco predominante en metas de ahorro. Considera destinar esfuerzos a estrategias de inversión.'
                    : balanceInsights[2].count > balanceInsights[0].count
                    ? 'Excelente equilibrio entre ahorro e inversión. Mantén el monitoreo periódico.'
                    : 'Distribuye tus metas financieras para mantener un balance sano entre ahorro, presupuesto e inversión.'}
                </p>
              </div>
            </CardBody>
          </Card>
        </AreaPanelSection>

        {/* Metas de Ahorro */}
        <AreaPanelSection
          title="Metas de Ahorro y Presupuesto"
          icon="💳"
          delay={0.35}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38 }}
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
                      {goal.__area?.name && isGlobalScope && (
                        <p className="text-xs text-indigo-500 mb-2">
                          Área: {goal.__area.name}
                        </p>
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
                      <div className="flex gap-2">
                        <span className="text-xs px-2 py-1 rounded-full font-semibold bg-green-100 text-green-800">
                          {goal.status ?? 'sin estado'}
                        </span>
                        {goal.priority && (
                          <span className="text-xs px-2 py-1 rounded-full font-semibold bg-purple-100 text-purple-700">
                            {goal.priority}
                          </span>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>
              ))
            ) : (
              <p className="text-gray-600 col-span-2">
                No hay metas financieras registradas en esta vista.
              </p>
            )}
          </motion.div>
        </AreaPanelSection>

        {/* Documentos Financieros */}
        <AreaPanelSection
          title="Documentos Financieros Relevantes"
          icon="📄"
          delay={0.4}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.43 }}
          >
            <Card>
              <CardBody>
                <div className="space-y-2">
                  {goals.slice(0, 6).map((goal: any, idx: number) => (
                    <motion.div
                      key={`${goal.id ?? 'goal'}-${idx}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">📋 {goal.title}</p>
                        <p className="text-xs text-gray-600">
                          {goal.created_at
                            ? new Date(goal.created_at).toLocaleDateString('es-ES')
                            : 'Fecha no registrada'}
                        </p>
                        {goal.__area?.name && isGlobalScope && (
                          <p className="text-xs text-indigo-500 mt-1">
                            Registrado en {goal.__area.name}
                          </p>
                        )}
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-semibold ${
                          (goal.status || '').toLowerCase() === 'completada'
                            ? 'bg-green-100 text-green-800'
                            : (goal.status || '').toLowerCase() === 'en_progreso'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {goal.status ?? 'sin estado'}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </motion.div>
        </AreaPanelSection>

        {/* Proyecciones */}
        <AreaPanelSection
          title="Proyecciones y recomendaciones financieras"
          icon="📈"
          delay={0.45}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.48 }}
          >
            <Card>
              <CardBody>
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 border-l-4 border-green-500 rounded">
                    <p className="text-sm text-green-900">
                      <strong>Cumplimiento:</strong> Vas al{' '}
                      {(metrics.goalCompletionRate ?? 0).toFixed(0)}% de cumplimiento de las metas
                      financieras monitorizadas en esta vista.
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                    <p className="text-sm text-blue-900">
                      <strong>Metas activas:</strong> {goals.filter((goal: any) =>
                        ['en_progreso', 'in_progress'].includes((goal.status || '').toLowerCase()),
                      ).length}{' '}
                      metas siguen en progreso. Progreso promedio del conjunto:{' '}
                      {(metrics.avgGoalProgress ?? 0).toFixed(0)}%.
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 border-l-4 border-purple-500 rounded">
                    <p className="text-sm text-purple-900">
                      <strong>Próximas acciones:</strong>{' '}
                      {isGlobalScope
                        ? 'Prioriza las áreas con menor porcentaje de progreso para equilibrar el portafolio financiero general.'
                        : 'Revisa el detalle de cada meta y programa los próximos hitos para mantener el impulso.'}
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

export default FinancialPanel;
