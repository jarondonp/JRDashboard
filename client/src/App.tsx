import { BrowserRouter, Routes, Route } from 'react-router-dom'
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
import ComplianceDashboard from './pages/ComplianceDashboard'
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
import { Sidebar, QuickActionMenu } from './components'
import { QuickActionProvider } from './hooks'

function App() {
  return (
    <BrowserRouter>
      <QuickActionProvider>
        <div className="app">
          <Sidebar />
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
              <Route path="/analytics/compliance" element={<ComplianceDashboard />} />
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
          <QuickActionMenu />
        </div>
      </QuickActionProvider>
    </BrowserRouter>
  )
}

export default App
