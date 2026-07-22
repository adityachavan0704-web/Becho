import { useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

/**
 * Landing page after Google OAuth redirect.
 * Reads ?token=ACCESS_TOKEN&refresh=REFRESH_TOKEN from URL,
 * stores both, then navigates to the app.
 */
export default function AuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuth()

  useEffect(() => {
    const token = searchParams.get("token")
    const refresh = searchParams.get("refresh")
    const error = searchParams.get("error")

    if (error || !token || !refresh) {
      navigate("/login?error=oauth_failed", { replace: true })
      return
    }

    void login(token, refresh).then(() => {
      navigate("/browse", { replace: true })
    })
  }, [login, navigate, searchParams])

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      <p className="text-muted-foreground text-sm">Signing you in…</p>
    </div>
  )
}
