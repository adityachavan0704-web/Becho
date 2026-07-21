import { createContext, useContext, useState, useEffect, useCallback } from "react"
import type { ReactNode } from "react"

// ─── Types ─────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string
  email: string
  name: string
  role: "BUYER" | "SELLER"
}

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (token: string) => Promise<void>
  logout: () => void
}

// ─── Context ────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null)

const TOKEN_KEY = "becho_token"
const API_URL = import.meta.env["VITE_API_URL"] as string ?? "http://localhost:3000"

// ─── Provider ───────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch /api/auth/me using the stored token
  const fetchMe = useCallback(async (tok: string): Promise<AuthUser | null> => {
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${tok}` },
      })
      if (!res.ok) return null
      const data = await res.json() as { user: AuthUser }
      return data.user
    } catch {
      return null
    }
  }, [])

  // On mount: restore session from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY)
    if (!stored) {
      setIsLoading(false)
      return
    }

    void fetchMe(stored).then((u) => {
      if (u) {
        setToken(stored)
        setUser(u)
      } else {
        localStorage.removeItem(TOKEN_KEY)
      }
      setIsLoading(false)
    })
  }, [fetchMe])

  // Call this after receiving a token (login form or OAuth callback)
  const login = useCallback(async (tok: string): Promise<void> => {
    localStorage.setItem(TOKEN_KEY, tok)
    setToken(tok)
    const u = await fetchMe(tok)
    if (u) setUser(u)
  }, [fetchMe])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>")
  return ctx
}
