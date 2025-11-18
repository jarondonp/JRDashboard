import { useDocuments } from '../hooks'

function DocumentsPage() {
  const { data: documents, isLoading, error } = useDocuments()

  if (isLoading) return <div className="page"><div className="loading">Cargando documentos...</div></div>
  if (error) return <div className="page"><div className="error">Error: {error.message}</div></div>

  return (
    <div className="page">
      <div className="page-header">
        <h2>Documentos</h2>
        <button className="btn btn-primary">+ Nuevo Documento</button>
      </div>
      <p>Total de documentos: {documents?.length || 0}</p>
      <ul className="list">
        {documents?.map((doc) => (
          <li key={doc.id} className="list-item">
            <div className="list-item-content">
              <h3>{doc.title}</h3>
              {doc.description && <p>{doc.description}</p>}
              {doc.url && <p><a href={doc.url} target="_blank" rel="noopener noreferrer">Ver documento</a></p>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default DocumentsPage
