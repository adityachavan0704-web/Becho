import { Navigate } from "react-router-dom"
import type { ReactNode } from "react"
import { useAuth } from "../contexts/AuthContext"

interface ProtectedRouteProps {
  children: ReactNode
  /** If set, also checks the user's role. */
  requiredRole?: "BUYER" | "SELLER"
}

/**
 * Redirects unauthenticated users to /login.
 * While auth state is loading, renders nothing (prevents flash).
 */
export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/browse" replace />
  }

  return <>{children}</>
}
