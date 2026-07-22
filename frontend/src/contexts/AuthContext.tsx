// src/contexts/AuthContext.tsx — Auth state with refresh token support

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import type { ReactNode } from "react"
import { tokenStore, apiFetch, ApiRequestError } from "../lib/api"

// ─── Types ─────────────────────────────────────────────────────

export interface AuthUser {
  id: string
  email: string
  name: string
  role: "BUYER" | "SELLER"
  reputation?: number
}

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  /** Call after receiving accessToken + refreshToken from login/register/OAuth */
  login: (accessToken: string, refreshToken: string) => Promise<void>
  logout: () => Promise<void>
  /** Returns the current access token (may be refreshed if needed) */
  getAccessToken: () => string | null
}

// ─── Context ───────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null)

// ─── Provider ──────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch current user from /api/auth/me
  const fetchMe = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const data = await apiFetch<{ user: AuthUser }>("/api/auth/me")
      return data.user
    } catch {
      return null
    }
  }, [])

  // On mount: try to restore session from stored refresh token
  useEffect(() => {
    const stored = tokenStore.getRefresh()
    if (!stored) {
      setIsLoading(false)
      return
    }

    void (async () => {
      // Try to get a new access token using the stored refresh token
      const res = await fetch(
        `${import.meta.env["VITE_API_URL"] ?? "http://localhost:3000"}/api/auth/refresh`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: stored }),
        }
      )

      if (res.ok) {
        const data = await res.json() as { accessToken: string; user: AuthUser }
        tokenStore.setAccess(data.accessToken)
        const u = await fetchMe()
        if (u) setUser(u)
        else tokenStore.clear()
      } else {
        tokenStore.clear()
      }
      setIsLoading(false)
    })()
  }, [fetchMe])

  const login = useCallback(async (accessToken: string, refreshToken: string): Promise<void> => {
    tokenStore.setAccess(accessToken)
    tokenStore.setRefresh(refreshToken)
    const u = await fetchMe()
    if (u) setUser(u)
  }, [fetchMe])

  const logout = useCallback(async (): Promise<void> => {
    const refreshToken = tokenStore.getRefresh()
    if (refreshToken) {
      // Fire-and-forget — invalidate server-side refresh token
      try {
        await apiFetch("/api/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refreshToken }),
        })
      } catch (e) {
        if (!(e instanceof ApiRequestError)) console.error(e)
      }
    }
    tokenStore.clear()
    setUser(null)
  }, [])

  const getAccessToken = useCallback((): string | null => {
    return tokenStore.getAccess()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// ─── Hook ──────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>")
  return ctx
}
