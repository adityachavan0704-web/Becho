import { useState } from "react"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { useNavigate, useSearchParams } from "react-router-dom"
import { ArrowLeft, Mail, Lock, User, AlertCircle } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import BechoLogo from "../components/BechoLogo"

const API_URL = (import.meta.env["VITE_API_URL"] as string | undefined) ?? "http://localhost:3000"

type Tab = "signin" | "register"

interface ApiAuthResponse {
  token?: string
  error?: string
}

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const role = searchParams.get("role") ?? "buyer"
  const oauthError = searchParams.get("error")

  const { login, isAuthenticated } = useAuth()

  const [tab, setTab] = useState<Tab>("signin")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(
    oauthError ? "Google sign-in failed. Please try again." : null
  )
  const [loading, setLoading] = useState(false)

  // If already logged in, redirect right away
  if (isAuthenticated) {
    navigate(role === "seller" ? "/dashboard" : "/browse", { replace: true })
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const endpoint = tab === "register" ? "/api/auth/register" : "/api/auth/login"
    const body = tab === "register"
      ? { email, password, name, role: role === "seller" ? "SELLER" : "BUYER" }
      : { email, password }

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json() as ApiAuthResponse

      if (!res.ok || !data.token) {
        setError(data.error ?? "Something went wrong. Please try again.")
        return
      }

      await login(data.token)
      navigate(role === "seller" ? "/dashboard" : "/browse", { replace: true })
    } catch {
      setError("Unable to reach the server. Make sure the backend is running.")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/api/auth/google`
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full opacity-10 blur-3xl"
        style={{ background: "radial-gradient(circle, #00fcb5, transparent)" }} />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full opacity-10 blur-3xl"
        style={{ background: "radial-gradient(circle, #00fcb5, transparent)" }} />

      {/* Back button */}
      <Button
        variant="ghost"
        className="absolute top-4 left-4 text-muted-foreground hover:text-foreground"
        onClick={() => navigate("/")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
      </Button>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <BechoLogo size={52} showWordmark={false} />
          </div>
          <h1 className="text-3xl font-bold" style={{ letterSpacing: "-0.03em" }}>
            Welcome to Becho
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {role === "seller"
              ? "Create an account to start selling resources."
              : "Sign in to browse and download resources."}
          </p>
        </div>

        <div className="glass rounded-2xl p-8 border border-border shadow-2xl">
          {/* Tab toggle */}
          <div className="flex gap-1 p-1 rounded-xl mb-6"
            style={{ background: "rgba(255,255,255,0.04)" }}>
            <button
              onClick={() => { setTab("signin"); setError(null) }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                tab === "signin"
                  ? "bg-primary text-black shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setTab("register"); setError(null) }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                tab === "register"
                  ? "bg-primary text-black shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Register
            </button>
          </div>

          {/* Google OAuth button */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-border text-sm font-medium transition-all duration-200 hover:border-primary/40 hover:bg-white/5 mb-4 group"
          >
            {/* Google "G" icon using SVG */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="group-hover:text-primary transition-colors">
              Continue with Google
            </span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or continue with email</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Error banner */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm border"
              style={{
                background: "rgba(239,68,68,0.08)",
                borderColor: "rgba(239,68,68,0.2)",
                color: "#f87171",
              }}>
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={(e) => { void handleSubmit(e) }} className="space-y-4">
            {tab === "register" && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground/80">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Aditya Chavan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground/80">College Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="student@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground/80">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-sm font-semibold mt-2"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                  {tab === "register" ? "Creating account…" : "Signing in…"}
                </span>
              ) : (
                tab === "register" ? "Create Account" : "Sign In"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
