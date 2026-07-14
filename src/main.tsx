import React, { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import './index.css'
import { AuthProvider } from './hooks/use-auth'
import { AuthRoute } from './components/app/AuthRoute'
import { DashboardLayout } from './components/layout/DashboardLayout'
import { ProtectedRoute } from './components/app/ProtectedRoute'
import { featureFlags } from './config/features'
import type { ModuleKey, Permission } from './types/auth'

const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Employees = lazy(() => import('./pages/Employees'))
const Departments = lazy(() => import('./pages/Departments'))
const Campaigns = lazy(() => import('./pages/Campaigns'))
const Inventory = lazy(() => import('./pages/Inventory'))
const Materials = lazy(() => import('./pages/Materials'))
const Reservations = lazy(() => import('./pages/Reservations'))
const Documents = lazy(() => import('./pages/Documents'))
const Schedules = lazy(() => import('./pages/Schedules'))
const Settings = lazy(() => import('./pages/Settings'))
const PacksCommerciaux = lazy(() => import('./pages/PacksCommerciaux'))
const Contacts = lazy(() => import('./pages/Contacts'))
const ContactMessages = lazy(() => import('./pages/ContactMessages'))
const Accounting = lazy(() => import('./pages/Accounting'))
const ChartOfAccounts = lazy(() => import('./pages/ChartOfAccounts'))
const AccountingJournals = lazy(() => import('./pages/AccountingJournals'))
const AccountingEntries = lazy(() => import('./pages/AccountingEntries'))
const Wallet = lazy(() => import('./pages/Wallet'))
const Invoices = lazy(() => import('./pages/Invoices'))
const Geography = lazy(() => import('./pages/Geography'))
const AgencyUsers = lazy(() => import('./pages/AgencyUsers'))

function loading(label = 'Chargement...') {
  return <div className="py-16 text-center text-sm font-semibold text-muted-foreground">{label}</div>
}

function page(element: React.ReactNode) {
  return <Suspense fallback={loading()}>{element}</Suspense>
}

function protect(element: React.ReactNode, moduleKey: ModuleKey, permission: Permission) {
  return <ProtectedRoute moduleKey={moduleKey} permission={permission}>{page(element)}</ProtectedRoute>
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={page(<Login />)} />
          <Route path="/*" element={
            <AuthRoute>
              <DashboardLayout>
                <Routes>
                  <Route path="/" element={protect(<Dashboard />, 'dashboard', 'dashboard.view')} />
                  <Route path="/employees" element={protect(<Employees />, 'team', 'team.view')} />
                  <Route path="/departments" element={protect(<Departments />, 'administration', 'administration.view')} />
                  <Route path="/campaigns" element={protect(<Campaigns />, 'sales', 'sales.view')} />
                  <Route path="/agency-users" element={protect(<AgencyUsers />, 'sales', 'sales.view')} />
                  <Route path="/inventory" element={protect(<Inventory />, 'inventory', 'inventory.view')} />
                  <Route path="/geography" element={featureFlags.geography ? protect(<Geography />, 'inventory', 'inventory.view') : <Navigate to="/inventory" replace />} />
                  <Route path="/materials" element={protect(<Materials />, 'team', 'team.view')} />
                  <Route path="/reservations" element={protect(<Reservations />, 'sales', 'sales.view')} />
                  <Route path="/documents" element={protect(<Documents />, 'operations', 'operations.view')} />
                  <Route path="/schedules" element={protect(<Schedules />, 'operations', 'operations.view')} />
                  <Route path="/packs" element={protect(<PacksCommerciaux />, 'sales', 'sales.view')} />
                  <Route path="/contacts" element={protect(<Contacts />, 'sales', 'sales.view')} />
                  <Route path="/demandes" element={protect(<ContactMessages />, 'sales', 'sales.view')} />
                  <Route path="/contact-messages" element={<Navigate to="/demandes" replace />} />
                  <Route path="/accounting" element={featureFlags.advancedFinance ? protect(<Accounting />, 'finance', 'finance.view') : <Navigate to="/invoices" replace />} />
                  <Route path="/accounting/chart-of-accounts" element={featureFlags.advancedFinance ? protect(<ChartOfAccounts />, 'finance', 'finance.view') : <Navigate to="/invoices" replace />} />
                  <Route path="/accounting/journals" element={featureFlags.advancedFinance ? protect(<AccountingJournals />, 'finance', 'finance.view') : <Navigate to="/invoices" replace />} />
                  <Route path="/accounting/entries" element={featureFlags.advancedFinance ? protect(<AccountingEntries />, 'finance', 'finance.view') : <Navigate to="/invoices" replace />} />
                  <Route path="/wallet" element={featureFlags.advancedFinance ? protect(<Wallet />, 'finance', 'finance.view') : <Navigate to="/invoices" replace />} />
                  <Route path="/invoices" element={protect(<Invoices />, 'finance', 'finance.view')} />
                  <Route path="/settings" element={protect(<Settings />, 'settings', 'settings.manage')} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </DashboardLayout>
            </AuthRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-right" />
      </BrowserRouter>
    </AuthProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
