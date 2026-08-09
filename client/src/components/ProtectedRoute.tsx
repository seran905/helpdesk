import { Navigate, Outlet } from 'react-router-dom'
import { useSession } from '../lib/auth-client'

function ProtectedRoute() {
  const { data: session, isPending } = useSession()

  if (isPending) return <p>Loading...</p>
  if (!session) return <Navigate to="/login" replace />

  return <Outlet />
}

export default ProtectedRoute
