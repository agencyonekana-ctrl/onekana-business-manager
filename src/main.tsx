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
import PacksCommerciaux from './pages/PacksCommerciaux'
import ContactMessages from './pages/ContactMessages'
import Accounting from './pages/Accounting'
import ChartOfAccounts from './pages/ChartOfAccounts'
import AccountingJournals from './pages/AccountingJournals'
import AccountingEntries from './pages/AccountingEntries'
import Wallet from './pages/Wallet'
import Invoices from './pages/Invoices'
import { ProtectedRoute } from './components/app/ProtectedRoute'
import type { ModuleKey, Permission } from './types/auth'

function protect(element: React.ReactNode, moduleKey: ModuleKey, permission: Permission) {
  return <ProtectedRoute moduleKey={moduleKey} permission={permission}>{element}</ProtectedRoute>
}

function App() {
  return (
    <BrowserRouter>
      <DashboardLayout>
        <Routes>
          <Route path="/" element={protect(<Dashboard />, 'dashboard', 'dashboard.view')} />
          <Route path="/employees" element={protect(<Employees />, 'team', 'team.view')} />
          <Route path="/departments" element={protect(<Departments />, 'administration', 'administration.view')} />
          <Route path="/campaigns" element={protect(<Campaigns />, 'sales', 'sales.view')} />
          <Route path="/inventory" element={protect(<Inventory />, 'inventory', 'inventory.view')} />
          <Route path="/materials" element={protect(<Materials />, 'operations', 'operations.view')} />
          <Route path="/reservations" element={protect(<Reservations />, 'sales', 'sales.view')} />
          <Route path="/documents" element={protect(<Documents />, 'operations', 'operations.view')} />
          <Route path="/schedules" element={protect(<Schedules />, 'operations', 'operations.view')} />
          <Route path="/packs" element={protect(<PacksCommerciaux />, 'sales', 'sales.view')} />
          <Route path="/demandes" element={protect(<ContactMessages />, 'sales', 'sales.view')} />
          <Route path="/contact-messages" element={<Navigate to="/demandes" replace />} />
          <Route path="/accounting" element={protect(<Accounting />, 'finance', 'finance.view')} />
          <Route path="/accounting/chart-of-accounts" element={protect(<ChartOfAccounts />, 'finance', 'finance.view')} />
          <Route path="/accounting/journals" element={protect(<AccountingJournals />, 'finance', 'finance.view')} />
          <Route path="/accounting/entries" element={protect(<AccountingEntries />, 'finance', 'finance.view')} />
          <Route path="/wallet" element={protect(<Wallet />, 'finance', 'finance.view')} />
          <Route path="/invoices" element={protect(<Invoices />, 'finance', 'finance.view')} />
          <Route path="/settings" element={protect(<Settings />, 'settings', 'settings.manage')} />
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
