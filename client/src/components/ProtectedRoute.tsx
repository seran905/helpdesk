import { Navigate, Outlet } from 'react-router-dom'
import { useSession } from '../lib/auth-client'

type ProtectedRouteProps = {
  allowedRoles?: string[]
}

function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { data: session, isPending } = useSession()

  if (isPending) return <p className="p-6 text-zinc-400">Loading...</p>
  if (!session) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
