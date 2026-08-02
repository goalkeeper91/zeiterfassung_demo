import { Route, Routes } from 'react-router'
import { KioskPage } from './pages/KioskPage'
import { DashboardPage } from './pages/DashboardPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<KioskPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
    </Routes>
  )
}

export default App
