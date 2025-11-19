import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardBody } from '../../components/Card';
import { AreaPanelHeader, AreaPanelSection, KPICard } from '../../components/AreaPanel';
import { useAreaDashboard } from '../../hooks/useAreaDashboard';

interface ScholarshipsPanelProps {
  areaId: string;
  areaName: string;
  color: string;
  icon: string;
  subtitle?: string;
}

const ScholarshipsPanel: React.FC<ScholarshipsPanelProps> = ({ areaId, areaName, color, icon, subtitle }) => {
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

  const applications = dashboard.goals.length;
  const completedApplications = dashboard.goals.filter((g: any) => g.status === 'completada').length;
  const upcomingDeadlines = dashboard.tasks.filter((t: any) => {
    if (!t.due_date) return false;
    const days = Math.ceil((new Date(t.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days <= 14 && days > 0;
  }).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-6xl mx-auto">
        <AreaPanelHeader
          areaName={areaName}
          color={color}
          icon={icon}
          panelType="scholarships"
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
            label="Aplicaciones Totales"
            value={applications}
            icon="📝"
            trendValue="aplicaciones"
          />
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
            value={applications > 0 ? ((completedApplications / applications) * 100).toFixed(0) + '%' : '0%'}
            icon="📊"
            trend="up"
            trendValue="aceptación"
          />
        </motion.div>

        {/* Estado de Aplicaciones */}
        <AreaPanelSection
          title="Estado de Aplicaciones"
          icon="🎓"
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
                          <span className="text-sm font-bold text-indigo-600">{goal.computed_progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${goal.computed_progress}%` }}
                            transition={{ duration: 0.8 }}
                            className="bg-indigo-600 h-2 rounded-full"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                          goal.status === 'completada' ? 'bg-green-100 text-green-800' :
                          goal.status === 'en_progreso' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {goal.status === 'completada' ? '✓ Aceptada' : goal.status === 'en_progreso' ? 'En Revisión' : 'Pendiente'}
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

        {/* Deadlines Próximos */}
        <AreaPanelSection
          title="Deadlines Próximos (próximas 2 semanas)"
          icon="📅"
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
                  {dashboard.tasks.filter((t: any) => {
                    if (!t.due_date) return false;
                    const days = Math.ceil((new Date(t.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    return days <= 14 && days > 0;
                  }).map((task: any, idx: number) => {
                    const daysLeft = Math.ceil((new Date(task.due_date!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`p-3 rounded-lg ${
                          daysLeft <= 3 ? 'bg-red-50' : daysLeft <= 7 ? 'bg-yellow-50' : 'bg-blue-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">{task.title}</p>
                            <p className="text-xs text-gray-600">
                              {new Date(task.due_date!).toLocaleDateString('es-ES')}
                            </p>
                          </div>
                          <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                            daysLeft <= 3 ? 'bg-red-100 text-red-800' :
                            daysLeft <= 7 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {daysLeft} día{daysLeft !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          </motion.div>
        </AreaPanelSection>

        {/* Documentos Requeridos */}
        <AreaPanelSection
          title="Documentos Requeridos y Checklist"
          icon="✅"
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
                      <strong>Aplicaciones en Proceso:</strong> {dashboard.goals.filter(g => g.status !== 'completada').length} aplicación(es) en revisión.
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 border-l-4 border-green-500 rounded">
                    <p className="text-sm text-green-900">
                      <strong>Tasa de Éxito:</strong> {applications > 0 ? ((completedApplications / applications) * 100).toFixed(0) : 0}% de aceptación.
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 border-l-4 border-purple-500 rounded">
                    <p className="text-sm text-purple-900">
                      <strong>Próximo Paso:</strong> Prepara documentación para aplicaciones pendientes. Revisa requisitos específicos de cada institución.
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
