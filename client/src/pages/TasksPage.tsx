import { useTasks } from '../hooks'

function TasksPage() {
  const { data: tasks, isLoading, error } = useTasks()

  if (isLoading) return <div className="page"><div className="loading">Cargando tareas...</div></div>
  if (error) return <div className="page"><div className="error">Error: {error.message}</div></div>

  return (
    <div className="page">
      <div className="page-header">
        <h2>Tareas</h2>
        <button className="btn btn-primary">+ Nueva Tarea</button>
      </div>
      <p>Total de tareas: {tasks?.length || 0}</p>
      <ul className="list">
        {tasks?.map((task) => (
          <li key={task.id} className="list-item">
            <div className="list-item-content">
              <h3>{task.title}</h3>
              <p><strong>Estado:</strong> <span className="badge badge-info">{task.status}</span></p>
              {task.due_date && <p><strong>Vencimiento:</strong> {task.due_date}</p>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default TasksPage
