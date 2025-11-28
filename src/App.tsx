import { Routes, Route } from 'react-router-dom'
import DashboardPage from './pages/DashboardPage'
import NewAnalysisPage from './pages/NewAnalysisPage'
import SimulatorPage from './pages/SimulatorPage'
import HistoryPage from './pages/HistoryPage'
import DocumentationPage from './pages/DocumentationPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/analisis" element={<NewAnalysisPage />} />
      <Route path="/simulador" element={<SimulatorPage />} />
      <Route path="/historial" element={<HistoryPage />} />
      <Route path="/documentacion" element={<DocumentationPage />} />
    </Routes>
  )
}

export default App
