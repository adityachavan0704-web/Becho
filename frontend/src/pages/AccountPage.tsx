// src/pages/AccountPage.tsx — Account / Profile page
import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import {
  ArrowLeft, Package, TrendingUp, Star, LogOut,
  Mail, Shield, Loader2
} from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { useTheme } from "../contexts/ThemeContext"
import BechoLogo from "../components/BechoLogo"

const API_URL = (import.meta.env["VITE_API_URL"] as string) ?? "http://localhost:3000"

const T = {
  bg: "var(--bg)",
  surface: "var(--surface)",
  surface2: "var(--surface-2)",
  border: "var(--border)",
  text: "var(--text)",
  muted: "var(--text-muted)",
  subtle: "var(--text-subtle)",
  primary: "var(--primary)",
  primaryDim: "var(--primary-dim)",
}

export default function AccountPage() {
  const navigate = useNavigate()
  const { user, getAccessToken, logout, isAuthenticated } = useAuth()
  const { isDark } = useTheme()

  const [stats, setStats] = useState({ active: 0, sold: 0, earned: 0, reputation: 0 })
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    const token = getAccessToken()
    if (!token) { setLoading(false); return }
    try {
      const res = await fetch(`${API_URL}/api/listings/my`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json() as { listings: { price: number; status: string }[] }
        const active = data.listings.filter((l) => l.status === "ACTIVE").length
        const sold = data.listings.filter((l) => l.status === "SOLD").length
        const earned = data.listings.filter((l) => l.status === "SOLD").reduce((s, l) => s + l.price, 0)
        setStats({ active, sold, earned, reputation: user?.reputation ?? 0 })
      }
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [getAccessToken, user])

  useEffect(() => { void fetchStats() }, [fetchStats])

  const handleLogout = () => { void logout(); navigate("/", { replace: true }) }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: T.bg }}>
        <div className="text-center space-y-4">
          <p className="text-lg font-semibold" style={{ color: T.text }}>Please log in to view your account.</p>
          <button onClick={() => navigate("/login")}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: T.primary, color: "#fff" }}>
            Log In
          </button>
        </div>
      </div>
    )
  }

  const statCards = [
    { label: "Active Listings", value: stats.active, icon: Package, colorStyle: { color: T.primary }, bgStyle: { background: T.primaryDim } },
    { label: "Items Sold", value: stats.sold, icon: Package, colorStyle: { color: "#10b981" }, bgStyle: { background: "rgba(16,185,129,0.12)" } },
    { label: "Total Earned", value: `₹${stats.earned.toLocaleString("en-IN")}`, icon: TrendingUp, colorStyle: { color: T.text }, bgStyle: { background: T.surface2 } },
    { label: "Reputation", value: stats.reputation > 0 ? `${stats.reputation}/5` : "—", icon: Star, colorStyle: { color: "#f59e0b" }, bgStyle: { background: "rgba(245,158,11,0.12)" } },
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: T.bg }}>
      {/* Nav */}
      <nav className="sticky top-0 z-40 backdrop-blur px-6 py-3.5 flex items-center gap-3"
        style={{ backgroundColor: isDark ? "rgba(8,8,8,0.92)" : "rgba(220,210,196,0.96)", borderBottom: `1px solid ${T.border}` }}>
        <BechoLogo size={28} showWordmark={true} wordmarkColor={isDark ? "white" : undefined} />
        <div className="h-4 w-px mx-2" style={{ backgroundColor: T.border }} />
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs transition-colors"
          style={{ color: T.muted }}
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          className="rounded-2xl p-6 mb-8"
          style={{ background: T.surface, border: `1px solid ${T.border}` }}
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: T.primaryDim }}>
              <span className="text-2xl font-bold" style={{ color: T.primary }}>
                {user.name?.[0]?.toUpperCase() ?? "?"}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold" style={{ color: T.text }}>{user.name}</h1>
              <div className="flex items-center gap-1.5 mt-1">
                <Mail className="h-3.5 w-3.5" style={{ color: T.muted }} />
                <p className="text-sm truncate" style={{ color: T.muted }}>{user.email}</p>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <Shield className="h-3.5 w-3.5" style={{ color: T.muted }} />
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: T.subtle }}>{user.role}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.08 }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: T.subtle }}>Your Stats</p>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin" style={{ color: T.muted }} />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {statCards.map((s) => (
                <div key={s.label} className="rounded-2xl p-5 flex items-center gap-4"
                  style={{ border: `1px solid ${T.border}`, background: T.surface }}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={s.bgStyle}>
                    <s.icon className="h-5 w-5" style={s.colorStyle} />
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: T.muted }}>{s.label}</p>
                    <p className="text-xl font-bold mt-0.5" style={{ color: T.text }}>{s.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.16 }}
          className="mt-8"
        >
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: T.subtle }}>Quick Links</p>
          <div className="space-y-2">
            {[
              { label: "My Listings", icon: Package, onClick: () => navigate("/dashboard#listings") },
              { label: "Inbox", icon: Mail, onClick: () => navigate("/inbox") },
            ].map((item) => (
              <button key={item.label} onClick={item.onClick}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all text-left"
                style={{ border: `1px solid ${T.border}`, background: T.surface, color: T.text }}>
                <item.icon className="h-4 w-4" style={{ color: T.muted }} />
                {item.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Sign Out */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.24 }}
          className="mt-10"
        >
          <button onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all"
            style={{ border: `1px solid ${T.border}`, background: T.surface, color: "#000000" }}>
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </motion.div>
      </div>
    </div>
  )
}
