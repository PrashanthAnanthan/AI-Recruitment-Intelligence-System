import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import Dashboard from './pages/Dashboard'
import NewScreening from './pages/NewScreening'
import Results from './pages/Results'
import History from './pages/History'
import { ScreeningProvider } from './context/ScreeningContext'

export default function App() {
  return (
    <ScreeningProvider>
      <Layout>
        <Routes>
          <Route path="/"           element={<Dashboard />} />
          <Route path="/screen"     element={<NewScreening />} />
          <Route path="/results/:id" element={<Results />} />
          <Route path="/history"    element={<History />} />
        </Routes>
      </Layout>
    </ScreeningProvider>
  )
}
