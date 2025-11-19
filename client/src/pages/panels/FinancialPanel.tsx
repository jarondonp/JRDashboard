import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardBody } from '../../components/Card';
import { AreaPanelHeader, AreaPanelSection, KPICard } from '../../components/AreaPanel';
import { useAreaDashboard } from '../hooks/useAreaDashboard';

interface FinancialPanelProps {
  areaId: string;
  areaName: string;
  color: string;
  icon: string;
}

const FinancialPanel: React.FC<FinancialPanelProps> = ({ areaId, areaName, color, icon }) => {
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
