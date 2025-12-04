import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { useAreaDashboard, useAreaMetrics } from '../hooks/useAreaDashboard';
import { useDocuments } from '../hooks/useDocuments';
import { useProjects } from '../hooks/useProjects';
import { Card, CardBody } from '../components/Card';
import { LineChart } from '../components/charts/LineChart';

export default function AreaDashboardPage() {
  const { areaId } = useParams<{ areaId: string }>();
  const navigate = useNavigate();

  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError } = useAreaDashboard(areaId || '');
  const { isLoading: metricsLoading } = useAreaMetrics(areaId || '');
  const { data: allDocuments } = useDocuments();
  const { data: allProjects } = useProjects();

  const areaProjects = useMemo(() => {
    if (!allProjects || !areaId) return [];
    return allProjects.filter(p => p.area_id === areaId && p.status !== 'archivado');
  }, [allProjects, areaId]);

  // Timeline histórico (últimos 30 días de actividad)
  const timelineData = useMemo(() => {
    if (!dashboardData) return [];

    const { progressLogs, tasks, goals } = dashboardData;
    const events: any[] = [];

    // Progress logs como eventos
    progressLogs.forEach((log: any) => {
      events.push({
        date: new Date(log.date),
        type: 'progress',
        title: log.title,
        mood: log.mood,
        impact: log.impact_level,
      });
    });

    // Tareas completadas
    tasks.filter((t: any) => t.status === 'completada').forEach((task: any) => {
      events.push({
        date: new Date(task.updated_at || task.created_at),
        type: 'task_completed',
        title: `Completada: ${task.title}`,
      });
    });

    // Metas completadas
    goals.filter((g: any) => g.status === 'completada').forEach((goal: any) => {
      events.push({
        date: new Date(goal.updated_at || goal.created_at),
        type: 'goal_completed',
        title: `🎯 Meta: ${goal.title}`,
      });
    });

    return events.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);
  }, [dashboardData]);

  // Tendencia de progreso (últimos 7 registros)
  const trendData = useMemo(() => {
    if (!dashboardData) return [];

    const { progressLogs } = dashboardData;
    return progressLogs
      .slice(0, 7)
      .reverse()
      .map((log: any) => ({
        fecha: new Date(log.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
        mood: log.mood,
        impacto: log.impact_level,
      }));
  }, [dashboardData]);

  // Árbol de dependencias (metas → tareas)
  const dependencyTree = useMemo(() => {
    if (!dashboardData) return [];

    const { goals, tasks } = dashboardData;
    return goals.map((goal: any) => ({
      ...goal,
      relatedTasks: tasks.filter((t: any) => t.goal_id === goal.id),
    }));
  }, [dashboardData]);

  // Documentos críticos del área
  const criticalDocuments = useMemo(() => {
    if (!allDocuments || !areaId) return [];

    const areaDocs = allDocuments.filter((doc: any) => doc.area_id === areaId);
    const today = new Date();

    return areaDocs.filter((doc: any) => {
      if (!doc.review_date) return false;
      const reviewDate = new Date(doc.review_date);
      const daysUntilReview = Math.ceil((reviewDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilReview <= 7; // Próximos 7 días
    }).sort((a: any, b: any) => new Date(a.review_date).getTime() - new Date(b.review_date).getTime());
  }, [allDocuments, areaId]);

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

  const linkedGlobalProjects = useMemo(() => {
    if (!goals || !allProjects) return [];
    const projectIds = new Set(goals.map((g: any) => g.project_id).filter(Boolean));
    return allProjects.filter(p => p.area_id === null && projectIds.has(p.id));
  }, [goals, allProjects]);

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

        {/* NUEVA SECCIÓN: Tendencia de Progreso */}
        {trendData.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-4">📈 Tendencia de Mood e Impacto</h2>
            <Card>
              <CardBody>
                <LineChart
                  data={trendData}
                  xKey="fecha"
                  lines={[
                    { key: 'mood', color: '#8b5cf6', name: 'Mood' },
                    { key: 'impacto', color: '#10b981', name: 'Impacto' }
                  ]}
                />
                <div className="mt-4 p-3 bg-indigo-50 border-l-4 border-indigo-500 rounded">
                  <p className="text-sm text-indigo-900">
                    <strong>Insight:</strong> {
                      trendData[trendData.length - 1].mood > trendData[0].mood
                        ? 'Tu mood está mejorando en esta área - ¡sigue así!'
                        : 'Tu mood ha disminuido ligeramente. Considera revisar cargas de trabajo.'
                    }
                  </p>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        )}

        {/* NUEVA SECCIÓN: Timeline Histórico */}
        {timelineData.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.18 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-4">🕐 Timeline de Actividad</h2>
            <Card>
              <CardBody>
                <div className="space-y-3">
                  {timelineData.map((event, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-indigo-100 text-indigo-600 font-bold text-sm">
                        {event.type === 'goal_completed' ? '🎯' :
                          event.type === 'task_completed' ? '✅' : '📝'}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{event.title}</h4>
                        <p className="text-xs text-gray-600 mt-1">
                          {event.date.toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        {event.mood && (
                          <div className="flex gap-2 mt-2">
                            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                              Mood: {event.mood}/5
                            </span>
                            {event.impact && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                Impacto: {event.impact}/5
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </motion.div>
        )}

        {/* NUEVA SECCIÓN: Árbol de Dependencias (Metas → Tareas) */}
        {dependencyTree.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.21 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-4">🔗 Metas y sus Tareas Relacionadas</h2>
            <div className="space-y-4">
              {dependencyTree.map((goal: any, idx: number) => (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card>
                    <CardBody>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-gray-900 text-lg">🎯 {goal.title}</h3>
                        <span className="text-sm font-semibold text-indigo-600">
                          {goal.computed_progress}%
                        </span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-2 mb-4">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all"
                          style={{ width: `${goal.computed_progress}%` }}
                        />
                      </div>
                      {goal.relatedTasks.length > 0 ? (
                        <div className="space-y-2 mt-3 pl-4 border-l-2 border-indigo-200">
                          <p className="text-xs font-semibold text-gray-600 mb-2">
                            {goal.relatedTasks.length} tarea(s) asociada(s)
                          </p>
                          {goal.relatedTasks.map((task: any) => (
                            <div
                              key={task.id}
                              className="flex items-center justify-between p-2 bg-indigo-50 rounded"
                            >
                              <span className="text-sm text-gray-800">{task.title}</span>
                              <span className={`text-xs px-2 py-1 rounded-full ${task.status === 'completada' ? 'bg-green-100 text-green-800' :
                                task.status === 'en_progreso' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                {task.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic pl-4">Sin tareas asociadas aún</p>
                      )}
                    </CardBody>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* NUEVA SECCIÓN: Documentos Críticos del Área */}
        {criticalDocuments.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.24 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-4">⚠️ Documentos que Requieren Revisión Próxima</h2>
            <Card>
              <CardBody>
                <div className="space-y-2">
                  {criticalDocuments.map((doc: any, idx: number) => {
                    const reviewDate = new Date(doc.review_date);
                    const today = new Date();
                    const daysUntil = Math.ceil((reviewDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                    return (
                      <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`flex items-center justify-between p-3 rounded-lg border-l-4 ${daysUntil <= 3 ? 'bg-red-50 border-red-500' :
                          daysUntil <= 7 ? 'bg-yellow-50 border-yellow-500' :
                            'bg-blue-50 border-blue-500'
                          }`}
                      >
                        <div>
                          <h4 className="font-semibold text-gray-900">{doc.title}</h4>
                          <p className="text-xs text-gray-600 mt-1">
                            Tipo: {doc.document_type} | Revisión: {reviewDate.toLocaleDateString('es-ES')}
                          </p>
                        </div>
                        <span className={`text-xs px-3 py-1 rounded-full font-semibold ${daysUntil <= 3 ? 'bg-red-100 text-red-800' :
                          daysUntil <= 7 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                          {daysUntil <= 0 ? '¡HOY!' : `${daysUntil} días`}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          </motion.div>
        )}

        {/* NUEVA SECCIÓN: Contribuciones a Proyectos Globales */}
        {linkedGlobalProjects.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.16 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-4">🌍 Contribuciones a Proyectos Globales</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {linkedGlobalProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="cursor-pointer"
                >
                  <Card hover>
                    <CardBody>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-800">{project.title}</h3>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          Global
                        </span>
                      </div>
                      {project.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{project.description}</p>
                      )}
                      <div className="text-xs text-gray-500">
                        {project.start_date && <span>Inicio: {new Date(project.start_date).toLocaleDateString()}</span>}
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Proyectos del Área */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.18 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Proyectos Activos</h2>
          {areaProjects.length === 0 ? (
            <Card>
              <CardBody>
                <p className="text-gray-500 text-center">No hay proyectos activos en esta área</p>
              </CardBody>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {areaProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="cursor-pointer"
                >
                  <Card hover>
                    <CardBody>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-800">{project.title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${project.status === 'activo' ? 'bg-green-100 text-green-800' :
                          project.status === 'en_pausa' ? 'bg-yellow-100 text-yellow-800' :
                            project.status === 'completado' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                          }`}>
                          {project.status || 'activo'}
                        </span>
                      </div>
                      {project.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{project.description}</p>
                      )}
                      <div className="text-xs text-gray-500">
                        {project.start_date && <span>Inicio: {new Date(project.start_date).toLocaleDateString()}</span>}
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
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
                        <span className={`px-2 py-1 rounded-full ${goal.status === 'completada' ? 'bg-green-100 text-green-800' :
                          goal.status === 'en_progreso' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                          {goal.status}
                        </span>
                        <span className={`px-2 py-1 rounded-full ${goal.priority === 'alta' ? 'bg-red-100 text-red-800' :
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
                        <span className={`px-2 py-1 rounded-full ${task.status === 'completada' ? 'bg-green-100 text-green-800' :
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
                            <span className={`text-xs px-2 py-1 rounded ${log.impact_level >= 4 ? 'bg-green-100 text-green-800' :
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
