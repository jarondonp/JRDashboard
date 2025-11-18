import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import DashboardPage from './pages/DashboardPage'
import AreasPage from './pages/AreasPage'
import GoalsPage from './pages/GoalsPage'
import TasksPage from './pages/TasksPage'
import ProgressPage from './pages/ProgressPage'
import DocumentsPage from './pages/DocumentsPage'
import ReportsPage from './pages/ReportsPage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <nav className="nav">
          <div className="nav-header">
            <h1 className="nav-title">Javier 360° PMO</h1>
            <p className="nav-subtitle">Personal Management Office</p>
          </div>
          <div className="nav-section">
            <h3 className="nav-section-title">PRINCIPAL</h3>
            <ul>
              <li><Link to="/">📊 Dashboard</Link></li>
            </ul>
          </div>
          <div className="nav-section">
            <h3 className="nav-section-title">GESTIÓN</h3>
            <ul>
              <li><Link to="/areas">🎯 Áreas</Link></li>
              <li><Link to="/goals">✅ Metas</Link></li>
              <li><Link to="/tasks">📋 Tareas</Link></li>
              <li><Link to="/progress">📈 Avances</Link></li>
              <li><Link to="/documents">📄 Documentos</Link></li>
              <li><Link to="/reports">📊 Reportes</Link></li>
            </ul>
          </div>
        </nav>
        <main className="main">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/areas" element={<AreasPage />} />
            <Route path="/goals" element={<GoalsPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
