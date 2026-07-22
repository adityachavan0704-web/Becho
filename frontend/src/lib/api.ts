// src/lib/api.ts — Centralized API fetch helper with automatic token refresh

const API_URL = (import.meta.env["VITE_API_URL"] as string) ?? "http://localhost:3000"

const ACCESS_TOKEN_KEY = "becho_access_token"
const REFRESH_TOKEN_KEY = "becho_refresh_token"

// ─── Token storage (memory + localStorage) ─────────────────────
// Access token stored in memory (more secure, clears on tab close)
let _accessToken: string | null = null

export const tokenStore = {
  getAccess: () => _accessToken,
  setAccess: (t: string | null) => { _accessToken = t },
  getRefresh: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setRefresh: (t: string | null) => {
    if (t) localStorage.setItem(REFRESH_TOKEN_KEY, t)
    else localStorage.removeItem(REFRESH_TOKEN_KEY)
  },
  clear: () => {
    _accessToken = null
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(ACCESS_TOKEN_KEY) // legacy cleanup
  },
}

// ─── Refresh flow ──────────────────────────────────────────────
let _refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  // Deduplicate concurrent refresh calls
  if (_refreshPromise) return _refreshPromise

  _refreshPromise = (async () => {
    const refreshToken = tokenStore.getRefresh()
    if (!refreshToken) return null

    try {
      const res = await fetch(`${API_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      })
      if (!res.ok) {
        tokenStore.clear()
        return null
      }
      const data = await res.json() as { accessToken: string }
      tokenStore.setAccess(data.accessToken)
      return data.accessToken
    } catch {
      return null
    } finally {
      _refreshPromise = null
    }
  })()

  return _refreshPromise
}

// ─── Main fetch helper ─────────────────────────────────────────
export interface ApiError {
  error: string
  status: number
}

export class ApiRequestError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const makeRequest = async (token: string | null): Promise<Response> => {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    }
    // Don't set Content-Type for FormData (browser sets it with boundary)
    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json"
    }
    if (token) headers["Authorization"] = `Bearer ${token}`

    return fetch(`${API_URL}${path}`, { ...options, headers })
  }

  let token = tokenStore.getAccess()
  let res = await makeRequest(token)

  // Auto-refresh on 401
  if (res.status === 401 && tokenStore.getRefresh()) {
    token = await refreshAccessToken()
    if (token) res = await makeRequest(token)
  }

  if (!res.ok) {
    let errMsg = `HTTP ${res.status}`
    try {
      const body = await res.json() as { error?: string }
      errMsg = body.error ?? errMsg
    } catch { /* ignore */ }
    throw new ApiRequestError(errMsg, res.status)
  }

  return res.json() as Promise<T>
}

export { API_URL }
