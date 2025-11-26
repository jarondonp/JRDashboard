import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import DashboardPage from './pages/DashboardPage'
import AreasPage from './pages/AreasPage'
import AreaDashboardPage from './pages/AreaDashboardPage'
import AreaPanelPage from './pages/AreaPanelPage'
import GoalsPage from './pages/GoalsPage'
import GoalsByAreaPage from './pages/GoalsByAreaPage'
import TasksPage from './pages/TasksPage'
import OverdueTasksPage from './pages/OverdueTasksPage'
import ProgressPage from './pages/ProgressPage'
import DocumentsPage from './pages/DocumentsPage'
import DocumentsReviewPage from './pages/DocumentsReviewPage'
import ReportsPage from './pages/ReportsPage'
import TimelinePage from './pages/TimelinePage'
import EmotionalPanelPage from './pages/EmotionalPanelPage'
import VocationalPanelPage from './pages/VocationalPanelPage'
import FinancialPanelPage from './pages/FinancialPanelPage'
import MigrationPanelPage from './pages/MigrationPanelPage'
import ScholarshipsPanelPage from './pages/ScholarshipsPanelPage'
import CommercialPanelPage from './pages/CommercialPanelPage'
import AllAreasOverviewPage from './pages/AllAreasOverviewPage'
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
              <li><Link to="/goals/by-area">🌐 Metas por Área</Link></li>
              <li><Link to="/tasks">📋 Tareas</Link></li>
              <li><Link to="/tasks/overdue">🚨 Atrasadas</Link></li>
              <li><Link to="/progress">📈 Avances</Link></li>
              <li><Link to="/timeline">🕒 Timeline</Link></li>
              <li><Link to="/documents">📄 Documentos</Link></li>
              <li><Link to="/documents/review">⏰ Revisiones</Link></li>
              <li><Link to="/reports">📊 Reportes</Link></li>
            </ul>
          </div>
          <div className="nav-section">
            <h3 className="nav-section-title">PANELES</h3>
            <ul>
              <li><Link to="/overview">📁 Vista General</Link></li>
              <li><Link to="/panel/emotional">❤️ Salud y Bienestar</Link></li>
              <li><Link to="/panel/vocational">🌟 Identidad y Propósito</Link></li>
              <li><Link to="/panel/financial">💰 Financiero</Link></li>
              <li><Link to="/panel/migration">✈️ Migración</Link></li>
              <li><Link to="/panel/scholarships">🎓 Becas</Link></li>
              <li><Link to="/panel/commercial">💼 Profesional y Carrera</Link></li>
            </ul>
          </div>
        </nav>
        <main className="main">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/areas" element={<AreasPage />} />
            <Route path="/areas/:areaId/dashboard" element={<AreaDashboardPage />} />
            <Route path="/areas/:areaId/panel" element={<AreaPanelPage />} />
            <Route path="/goals" element={<GoalsPage />} />
            <Route path="/goals/by-area" element={<GoalsByAreaPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/tasks/overdue" element={<OverdueTasksPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/timeline" element={<TimelinePage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/documents/review" element={<DocumentsReviewPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/panel/emotional" element={<EmotionalPanelPage />} />
            <Route path="/panel/vocational" element={<VocationalPanelPage />} />
            <Route path="/panel/financial" element={<FinancialPanelPage />} />
            <Route path="/panel/migration" element={<MigrationPanelPage />} />
            <Route path="/panel/scholarships" element={<ScholarshipsPanelPage />} />
            <Route path="/panel/commercial" element={<CommercialPanelPage />} />
            <Route path="/overview" element={<AllAreasOverviewPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
