import { Routes, Route, Navigate } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import DashboardPage from './pages/DashboardPage'
import NewAnalysisPage from './pages/NewAnalysisPage'
import SimulatorPage from './pages/SimulatorPage'
import HistoryPage from './pages/HistoryPage'
import DocumentationPage from './pages/DocumentationPage'

function App() {
  return (
    <Routes>
      {/* Public Landing Page */}
      <Route path="/" element={<HomePage />} />
      
      {/* Dashboard Routes */}
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/dashboard/analisis" element={<NewAnalysisPage />} />
      <Route path="/dashboard/simulador" element={<SimulatorPage />} />
      <Route path="/dashboard/historial" element={<HistoryPage />} />
      <Route path="/dashboard/documentacion" element={<DocumentationPage />} />
      
      {/* Redirect unknown routes to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
