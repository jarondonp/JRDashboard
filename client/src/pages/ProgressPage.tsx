import { useProgressLogs } from '../hooks'

function ProgressPage() {
  const { data: logs, isLoading, error } = useProgressLogs()

  if (isLoading) return <div className="page"><div className="loading">Cargando avances...</div></div>
  if (error) return <div className="page"><div className="error">Error: {error.message}</div></div>

  return (
    <div className="page">
      <div className="page-header">
        <h2>Avances</h2>
        <button className="btn btn-primary">+ Nuevo Avance</button>
      </div>
      <p>Total de registros: {logs?.length || 0}</p>
      <ul className="list">
        {logs?.map((log) => (
          <li key={log.id} className="list-item">
            <div className="list-item-content">
              <h3>{log.title}</h3>
              <p><strong>Fecha:</strong> {log.date}</p>
              {log.note && <p>{log.note}</p>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default ProgressPage
