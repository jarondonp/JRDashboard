import { useGoals } from '../hooks'

function GoalsPage() {
  const { data: goals, isLoading, error } = useGoals()

  if (isLoading) return <div className="page"><div className="loading">Cargando metas...</div></div>
  if (error) return <div className="page"><div className="error">Error: {error.message}</div></div>

  return (
    <div className="page">
      <div className="page-header">
        <h2>Metas</h2>
        <button className="btn btn-primary">+ Nueva Meta</button>
      </div>
      <p>Total de metas: {goals?.length || 0}</p>
      <ul className="list">
        {goals?.map((goal) => (
          <li key={goal.id} className="list-item">
            <div className="list-item-content">
              <h3>{goal.title}</h3>
              <p><strong>Estado:</strong> <span className="badge badge-info">{goal.status}</span></p>
              <p><strong>Prioridad:</strong> {goal.priority}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default GoalsPage
