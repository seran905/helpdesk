import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Role } from 'core'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useSession } from './lib/auth-client'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import TicketsPage from './pages/TicketsPage'
import TicketDetailPage from './pages/TicketDetailPage'
import UsersPage from './pages/UsersPage'

const queryClient = new QueryClient()

function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession()

  if (isPending) return <p className="p-6 text-muted-foreground">Loading...</p>
  if (session) return <Navigate to="/" replace />

  return children
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              <RedirectIfAuthed>
                <LoginPage />
              </RedirectIfAuthed>
            }
          />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/tickets" element={<TicketsPage />} />
              <Route path="/tickets/:id" element={<TicketDetailPage />} />
            </Route>
          </Route>
          <Route element={<ProtectedRoute allowedRoles={[Role.admin]} />}>
            <Route element={<Layout />}>
              <Route path="/users" element={<UsersPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
