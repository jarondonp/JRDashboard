import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAreaDashboard, useAreaMetrics } from '../hooks/useAreaDashboard';
import { Card, CardBody } from '../components/Card';

export default function AreaDashboardPage() {
  const { areaId } = useParams<{ areaId: string }>();
  const navigate = useNavigate();
  
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError } = useAreaDashboard(areaId || '');
  const { isLoading: metricsLoading } = useAreaMetrics(areaId || '');

  if (!areaId) {
    return <div className="p-6 text-center">Área no especificada</div>;
  }

  if (dashboardLoading || metricsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full"
        />
      </div>
    );
  }

  if (dashboardError) {
    return <div className="p-6 text-center text-red-600">Error al cargar el dashboard del área</div>;
  }

  if (!dashboardData || !dashboardData.area) {
    return <div className="p-6 text-center">Área no encontrada</div>;
  }

  const { area, metrics, goals, tasks, progressLogs } = dashboardData;
  const areaColor = area.color || '#8b5cf6';

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8"
        style={{ borderBottomWidth: '4px', borderBottomColor: areaColor }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/areas')}
              className="text-white hover:text-indigo-100 transition-colors"
            >
              ← Volver a Áreas
            </button>
            <span
              className="w-6 h-6 rounded-full"
              style={{ backgroundColor: areaColor }}
            />
          </div>
          <h1 className="text-4xl font-bold mb-2">{area.name}</h1>
          {area.description && (
            <p className="text-indigo-100">{area.description}</p>
          )}
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* KPI Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {/* Metas */}
          <Card>
            <CardBody>
              <div className="text-center">
                <div className="text-4xl font-bold text-indigo-600">{metrics.completedGoals}/{metrics.totalGoals}</div>
                <p className="text-gray-600 text-sm mt-1">Metas Completadas</p>
                <div className="mt-3 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all"
                    style={{ width: `${metrics.goalCompletionRate}%` }}
                  />
                </div>
                <p className="text-gray-500 text-xs mt-1">{metrics.goalCompletionRate}%</p>
              </div>
            </CardBody>
          </Card>

          {/* Tareas */}
          <Card>
            <CardBody>
              <div className="text-center">
                <div className="text-4xl font-bold text-teal-600">{metrics.completedTasks}/{metrics.totalTasks}</div>
                <p className="text-gray-600 text-sm mt-1">Tareas Completadas</p>
                <div className="mt-3 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-teal-600 h-2 rounded-full transition-all"
                    style={{ width: `${metrics.taskCompletionRate}%` }}
                  />
                </div>
                <p className="text-gray-500 text-xs mt-1">{metrics.taskCompletionRate}%</p>
              </div>
            </CardBody>
          </Card>

          {/* Progreso Promedio de Metas */}
          <Card>
            <CardBody>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600">{metrics.avgGoalProgress}%</div>
                <p className="text-gray-600 text-sm mt-1">Progreso Metas (Promedio)</p>
              </div>
            </CardBody>
          </Card>

          {/* Estado de Ánimo */}
          <Card>
            <CardBody>
              <div className="text-center">
                <div className="text-4xl font-bold">
                  {metrics.avgMood >= 4 ? '😄' : metrics.avgMood >= 3 ? '🙂' : metrics.avgMood >= 2 ? '😐' : '😞'}
                </div>
                <p className="text-gray-600 text-sm mt-1">Ánimo Promedio</p>
                <p className="text-gray-500 text-xs mt-1">{metrics.avgMood.toFixed(1)}/5</p>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        {/* Metas del Área */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Metas del Área</h2>
          {goals.length === 0 ? (
            <Card>
              <CardBody>
                <p className="text-gray-500 text-center">No hay metas en esta área</p>
              </CardBody>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {goals.map((goal, index) => (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card>
                    <CardBody>
                      <h3 className="font-semibold text-gray-800 mb-2">{goal.title}</h3>
                      <p className="text-sm text-gray-600 mb-3">{goal.description}</p>
                      <div className="mb-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-medium text-gray-600">Progreso</span>
                          <span className="text-xs font-bold text-indigo-600">{goal.computed_progress}%</span>
                        </div>
                        <div className="bg-gray-200 rounded-full h-1.5">
                          <motion.div
                            className="bg-indigo-600 h-1.5 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${goal.computed_progress}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 text-xs mt-2">
                        <span className={`px-2 py-1 rounded-full ${
                          goal.status === 'completada' ? 'bg-green-100 text-green-800' :
                          goal.status === 'en_progreso' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {goal.status}
                        </span>
                        <span className={`px-2 py-1 rounded-full ${
                          goal.priority === 'alta' ? 'bg-red-100 text-red-800' :
                          goal.priority === 'media' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {goal.priority}
                        </span>
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Tareas del Área */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Tareas del Área</h2>
          {tasks.length === 0 ? (
            <Card>
              <CardBody>
                <p className="text-gray-500 text-center">No hay tareas en esta área</p>
              </CardBody>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card>
                    <CardBody>
                      <h3 className="font-semibold text-gray-800 mb-2">{task.title}</h3>
                      <div className="mb-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-medium text-gray-600">Progreso</span>
                          <span className="text-xs font-bold text-teal-600">{task.progress_percentage}%</span>
                        </div>
                        <div className="bg-gray-200 rounded-full h-1.5">
                          <motion.div
                            className="bg-teal-600 h-1.5 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${task.progress_percentage}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 text-xs mt-2">
                        <span className={`px-2 py-1 rounded-full ${
                          task.status === 'completada' ? 'bg-green-100 text-green-800' :
                          task.status === 'en_progreso' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {task.status}
                        </span>
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Avances Recientes */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Avances Recientes ({progressLogs.length})</h2>
          {progressLogs.length === 0 ? (
            <Card>
              <CardBody>
                <p className="text-gray-500 text-center">No hay avances registrados</p>
              </CardBody>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {progressLogs.slice(0, 6).map((log, index) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card>
                    <CardBody>
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">
                          {log.mood >= 4 ? '😄' : log.mood >= 3 ? '🙂' : log.mood >= 2 ? '😐' : '😞'}
                        </span>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{log.title}</h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(log.date).toLocaleDateString()}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                              Ánimo: {log.mood}/5
                            </span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              log.impact_level >= 4 ? 'bg-green-100 text-green-800' :
                              log.impact_level >= 2 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              Impacto: {log.impact_level}/5
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
