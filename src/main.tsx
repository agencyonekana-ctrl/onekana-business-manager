import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import './index.css'
import { DashboardLayout } from './components/layout/DashboardLayout'
import Dashboard from './pages/Dashboard'
import Employees from './pages/Employees'
import Departments from './pages/Departments'
import Campaigns from './pages/Campaigns'
import Inventory from './pages/Inventory'
import Materials from './pages/Materials'
import Reservations from './pages/Reservations'
import Documents from './pages/Documents'
import Schedules from './pages/Schedules'
import Settings from './pages/Settings'

function App() {
  return (
    <BrowserRouter>
      <DashboardLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/departments" element={<Departments />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/materials" element={<Materials />} />
          <Route path="/reservations" element={<Reservations />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/schedules" element={<Schedules />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </DashboardLayout>
      <Toaster position="top-right" />
    </BrowserRouter>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

