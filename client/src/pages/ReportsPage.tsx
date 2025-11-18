import { useReports } from '../hooks'

function ReportsPage() {
  const { data: reports, isLoading, error } = useReports()

  if (isLoading) return <div className="page"><div className="loading">Cargando reportes...</div></div>
  if (error) return <div className="page"><div className="error">Error: {error.message}</div></div>

  return (
    <div className="page">
      <div className="page-header">
        <h2>Reportes</h2>
        <button className="btn btn-primary">+ Nuevo Reporte</button>
      </div>
      <p>Total de reportes: {reports?.length || 0}</p>
      <ul className="list">
        {reports?.map((report) => (
          <li key={report.id} className="list-item">
            <div className="list-item-content">
              <h3>{report.title}</h3>
              <p><strong>Tipo:</strong> {report.report_type}</p>
              <p><strong>Período:</strong> {report.period_start} - {report.period_end}</p>
              <p><strong>Estado:</strong> <span className="badge badge-info">{report.status}</span></p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default ReportsPage
