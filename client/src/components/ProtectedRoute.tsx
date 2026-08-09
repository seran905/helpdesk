import { Navigate, Outlet } from 'react-router-dom'
import { useSession } from '../lib/auth-client'

function ProtectedRoute() {
  const { data: session, isPending } = useSession()

  if (isPending) return <p className="p-6 text-zinc-400">Loading...</p>
  if (!session) return <Navigate to="/login" replace />

  return <Outlet />
}

export default ProtectedRoute
