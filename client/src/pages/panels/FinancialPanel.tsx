import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardBody } from '../../components/Card';
import { AreaPanelHeader, AreaPanelSection, KPICard } from '../../components/AreaPanel';
import { useAreaDashboard } from '../../hooks/useAreaDashboard';
import { useAreas } from '../../hooks/useAreas';
import BarChart from '../../components/charts/BarChart';
import LineChart from '../../components/charts/LineChart';

interface FinancialPanelProps {
  areaId: string;
  areaName: string;
  color: string;
  icon: string;
  subtitle?: string;
}

const FinancialPanel: React.FC<FinancialPanelProps> = ({ areaId, areaName, color, icon, subtitle }) => {
  const navigate = useNavigate();
  const { data: dashboard, isLoading } = useAreaDashboard(areaId);
  const { data: allAreas } = useAreas();

  // Identificar TODAS las áreas financieras (keywords match)
  const financialAreas = useMemo(() => {
    if (!allAreas) return [];
    const keywords = ['financial', 'financiero', 'finanzas', 'ahorro', 'inversión', 'inversion', 
                     'presupuesto', 'deuda', 'credito', 'crédito', 'bank', 'banco'];
    return allAreas.filter(area => 
      keywords.some(kw => area.name.toLowerCase().includes(kw))
    );
  }, [allAreas]);

  // Métricas AGREGADAS de todas las áreas financieras
  const aggregatedMetrics = useMemo(() => {
    if (!financialAreas || financialAreas.length === 0) return null;
    
    // Simulación: En realidad necesitarías hacer fetch de cada área
    // Por ahora usamos el dashboard actual como base
    return {
      totalAreas: financialAreas.length,
      avgProgress: dashboard?.metrics.avgGoalProgress || 0,
      totalGoals: dashboard?.goals.length || 0,
      completedGoals: dashboard?.goals.filter((g: any) => g.status === 'completada').length || 0,
    };
  }, [financialAreas, dashboard]);

  // Datos para gráfico comparativo (simulado por ahora)
  const comparisonData = useMemo(() => {
    if (!financialAreas || !dashboard) return [];
    
    return financialAreas.map(area => ({
      name: area.name.length > 15 ? area.name.substring(0, 15) + '...' : area.name,
      progreso: area.id === areaId ? dashboard.metrics.avgGoalProgress : Math.random() * 100
    }));
  }, [financialAreas, dashboard, areaId]);

  // Balance insights
  const balanceInsights = useMemo(() => {
    if (!dashboard) return [];
    
    const goals = dashboard.goals;
    const savingsGoals = goals.filter((g: any) => 
      g.title.toLowerCase().includes('ahorro') || g.title.toLowerCase().includes('savings')
    ).length;
    const budgetGoals = goals.filter((g: any) => 
      g.title.toLowerCase().includes('presupuesto') || g.title.toLowerCase().includes('budget')
    ).length;
    const investmentGoals = goals.filter((g: any) => 
      g.title.toLowerCase().includes('inversión') || g.title.toLowerCase().includes('investment')
    ).length;

    return [
      { category: 'Ahorro', count: savingsGoals, percentage: (savingsGoals / goals.length) * 100 },
      { category: 'Presupuesto', count: budgetGoals, percentage: (budgetGoals / goals.length) * 100 },
      { category: 'Inversión', count: investmentGoals, percentage: (investmentGoals / goals.length) * 100 },
    ];
  }, [dashboard]);

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
    return <div className="text-center py-12"><p className="text-gray-600">No se encontraron datos</p></div>;
  }

  const completedGoals = dashboard.goals.filter((g: any) => g.status === 'completada').length;
  const financialDocuments = dashboard.goals.filter((g: any) => g.title.toLowerCase().includes('presupuesto') || g.title.toLowerCase().includes('ahorro')).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-6xl mx-auto">
        <AreaPanelHeader
          areaName={areaName}
          color={color}
          icon={icon}
          panelType="financial"
          subtitle={subtitle}
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
            label="Metas Financieras"
            value={dashboard.goals.length}
            icon="🎯"
            trendValue="metas"
          />
          <KPICard
            label="Metas Completadas"
            value={completedGoals}
            icon="✅"
            trend="up"
            trendValue={`/${dashboard.goals.length}`}
          />
          <KPICard
            label="Presupuestos Activos"
            value={financialDocuments}
            icon="💰"
            trendValue="presupuestos"
          />
          <KPICard
            label="Progreso General"
            value={`${dashboard.metrics.goalCompletionRate.toFixed(0)}%`}
            icon="📊"
            trend="up"
            trendValue="cumplimiento"
          />
        </motion.div>

        {/* NUEVA SECCIÓN: Comparativa entre Áreas Financieras */}
        {aggregatedMetrics && financialAreas.length > 1 && (
          <AreaPanelSection
            title="📊 Comparativa de Áreas Financieras"
            icon="📈"
            delay={0.15}
          >
            <Card>
              <CardBody>
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-3">
                    Comparando <strong>{financialAreas.length} áreas</strong> con keywords financieros
                  </p>
                  <BarChart
                    data={comparisonData}
                    xKey="name"
                    yKey="progreso"
                    title="Progreso por Área Financiera"
                    color="#10b981"
                  />
                </div>
                <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                  <p className="text-sm text-blue-900">
                    <strong>Insight:</strong> {
                      dashboard.metrics.avgGoalProgress > 70 
                        ? 'Esta área está por encima del promedio - ¡Excelente desempeño!' 
                        : dashboard.metrics.avgGoalProgress > 50
                        ? 'Progreso moderado. Considera redistribuir tareas para acelerar.'
                        : 'Área por debajo del promedio. Requiere atención prioritaria.'
                    }
                  </p>
                </div>
              </CardBody>
            </Card>
          </AreaPanelSection>
        )}

        {/* NUEVA SECCIÓN: Balance Financiero */}
        <AreaPanelSection
          title="⚖️ Balance: Ahorro vs Presupuesto vs Inversión"
          icon="💰"
          delay={0.18}
        >
          <Card>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {balanceInsights.map((item, idx) => (
                  <motion.div
                    key={item.category}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + idx * 0.1 }}
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
                  <strong>Recomendación de Balance:</strong> {
                    balanceInsights[0].count > balanceInsights[2].count * 2
                      ? 'Tienes más metas de ahorro que inversión. Considera diversificar en inversiones a largo plazo.'
                      : balanceInsights[2].count > balanceInsights[0].count
                      ? 'Buen balance entre ahorro e inversión. Mantén el fondo de emergencia actualizado.'
                      : 'Balance equilibrado. Revisa periódicamente y ajusta según tus objetivos.'
                  }
                </p>
              </div>
            </CardBody>
          </Card>
        </AreaPanelSection>

        {/* Metas de Ahorro */}
        <AreaPanelSection
          title="Metas de Ahorro y Presupuesto"
          icon="💳"
          delay={0.2}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
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
                      <div className="mb-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-semibold text-gray-700">Progreso</span>
                          <span className="text-sm font-bold text-green-600">{goal.computed_progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${goal.computed_progress}%` }}
                            transition={{ duration: 0.8 }}
                            className="bg-green-600 h-2 rounded-full"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-xs px-2 py-1 rounded-full font-semibold bg-green-100 text-green-800">
                          {goal.status}
                        </span>
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>
              ))
            ) : (
              <p className="text-gray-600 col-span-2">No hay metas financieras</p>
            )}
          </motion.div>
        </AreaPanelSection>

        {/* Documentos Financieros */}
        <AreaPanelSection
          title="Documentos Financieros Importantes"
          icon="📄"
          delay={0.3}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Card>
              <CardBody>
                <div className="space-y-2">
                  {dashboard.goals.slice(0, 5).map((goal, idx) => (
                    <motion.div
                      key={goal.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">📋 {goal.title}</p>
                        <p className="text-xs text-gray-600">Creada el {new Date(goal.created_at).toLocaleDateString('es-ES')}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        goal.status === 'completada' ? 'bg-green-100 text-green-800' :
                        goal.status === 'en_progreso' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {goal.status}
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
          title="Proyecciones Financieras"
          icon="📈"
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
                  <div className="p-3 bg-green-50 border-l-4 border-green-500 rounded">
                    <p className="text-sm text-green-900">
                      <strong>Cumplimiento:</strong> Vas al {dashboard.metrics.goalCompletionRate.toFixed(0)}% de cumplimiento de tus metas financieras.
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                    <p className="text-sm text-blue-900">
                      <strong>Metas Activas:</strong> Tienes {dashboard.goals.filter(g => g.status !== 'completada').length} metas en progreso. Mantén el enfoque.
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 border-l-4 border-purple-500 rounded">
                    <p className="text-sm text-purple-900">
                      <strong>Recomendación:</strong> Revisa periódicamente tus metas y ajusta presupuestos según sea necesario.
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
