import { Route, Routes } from 'react-router'
import { TerminalPage } from './pages/TerminalPage'
import { DashboardPage } from './pages/DashboardPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<TerminalPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
    </Routes>
  )
}

export default App
