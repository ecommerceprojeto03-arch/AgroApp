import { Navigate, useLocation } from 'react-router-dom'
import { homePathForRole } from '../lib/roles'
import { useAuth } from '../contexts/AuthContext'
import type { UserRole } from '../types'

export function ProtectedRoute({
  children,
  role,
}: {
  children: React.ReactNode
  role?: UserRole
}) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-soil-700">Carregando…</div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (role && user.role !== role) {
    return <Navigate to={homePathForRole(user.role)} replace />
  }

  return children
}
