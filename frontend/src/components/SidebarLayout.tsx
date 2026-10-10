import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard, Package, ShoppingBag, Inbox, Heart, User, LogOut, FileText, PanelLeftOpen, PanelLeftClose, Menu
} from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { useTheme } from "../contexts/ThemeContext"
import BechoLogo from "./BechoLogo"

const NAV_ITEMS = [
  { id: "overview" as const, label: "Overview", icon: LayoutDashboard },
  { id: "listings" as const, label: "My Listings", icon: Package },
  { id: "browse" as const, label: "Marketplace", icon: ShoppingBag },
  { id: "messages" as const, label: "Messages & Inbox", icon: Inbox },
  { id: "wishlist" as const, label: "Wishlist", icon: Heart },
  { id: "profile" as const, label: "Profile", icon: User },
]

const T = {
  bg: "var(--bg)",
  border: "var(--border-strong)",
  muted: "var(--text-muted)",
  subtle: "var(--text-subtle)",
  primary: "var(--primary)",
  text: "var(--text)",
  surface2: "var(--surface-2)",
}
const EDGE_BORDER = "var(--border-width) solid var(--border-strong)"

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated, logout } = useAuth()
  const { isDark } = useTheme()

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarHovered, setSidebarHovered] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Determine active section from hash or path
  let activeSection = "overview"
  if (location.pathname === "/dashboard") {
    activeSection = location.hash ? location.hash.replace("#", "") : "overview"
  } else if (location.pathname.startsWith("/chat")) {
    activeSection = "messages"
  } else if (location.pathname === "/inbox") {
    activeSection = "messages"
  }

  const handleLogout = () => { void logout(); navigate("/", { replace: true }) }

  const openUpload = (type?: "ONLINE" | "OFFLINE") => {
    if (!isAuthenticated) { navigate("/login"); return }
    navigate(type ? `/sell?type=${type}` : "/sell")
  }

  const handleNavClick = (id: string) => {
    setMobileSidebarOpen(false)
    if (id === "messages") {
      navigate("/inbox")
    } else {
      navigate(`/dashboard#${id}`)
    }
  }

  const navActive = { background: "rgba(232,97,28,0.12)", color: T.text }
  const navInactive = { color: T.muted }

  const SidebarContent = ({ compact }: { compact: boolean }) => (
    <>
      <div className="flex items-center gap-3 px-5 py-5 flex-shrink-0" style={{ borderBottom: `1px solid ${T.border}` }}>
        <BechoLogo size={36} showWordmark={!compact} />
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <button key={item.id}
            onClick={() => handleNavClick(item.id)}
            title={compact ? item.label : undefined}
            className="w-full flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 relative"
            style={{
              ...(activeSection === item.id ? navActive : navInactive),
              padding: compact ? "10px" : "10px 16px",
              justifyContent: compact ? "center" : undefined,
            }}
          >
            <item.icon className="h-4 w-4 flex-shrink-0" />
            {!compact && item.label}
          </button>
        ))}

        {!compact && (
          <div className="pt-3 mt-2" style={{ borderTop: `1px solid ${T.border}` }}>
            <p className="text-xs font-semibold px-4 pb-2 uppercase tracking-wider" style={{ color: T.subtle }}>
              Quick Upload
            </p>
            <button onClick={() => { openUpload("OFFLINE"); setMobileSidebarOpen(false) }}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all"
              style={{ color: T.muted }}>
              <Package className="h-4 w-4 flex-shrink-0" /> Hardware Item
            </button>
            <button onClick={() => { openUpload("ONLINE"); setMobileSidebarOpen(false) }}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all"
              style={{ color: T.muted }}>
              <FileText className="h-4 w-4 flex-shrink-0" /> Online Resource
            </button>
          </div>
        )}
        {compact && (
          <div className="pt-3 mt-2 space-y-1" style={{ borderTop: `1px solid ${T.border}` }}>
            <button onClick={() => { openUpload("OFFLINE"); setMobileSidebarOpen(false) }}
              title="Hardware Item"
              className="w-full flex items-center justify-center py-2.5 rounded-xl text-sm transition-all"
              style={{ color: T.muted }}>
              <Package className="h-4 w-4" />
            </button>
            <button onClick={() => { openUpload("ONLINE"); setMobileSidebarOpen(false) }}
              title="Online Resource"
              className="w-full flex items-center justify-center py-2.5 rounded-xl text-sm transition-all"
              style={{ color: T.muted }}>
              <FileText className="h-4 w-4" />
            </button>
          </div>
        )}
      </nav>

      <div className="p-3 flex-shrink-0" style={{ borderTop: `1px solid ${T.border}` }}>
        {isAuthenticated && user ? (
          <button onClick={handleLogout}
            title={compact ? "Sign Out" : undefined}
            className="w-full flex items-center gap-2 rounded-xl text-sm hover:bg-black/5 transition-all"
            style={{ padding: compact ? "8px" : "8px 12px", justifyContent: compact ? "center" : undefined, color: "#000000" }}>
            <LogOut className="h-4 w-4" />
            {!compact && "Sign Out"}
          </button>
        ) : (
          <button onClick={() => navigate("/login")}
            title={compact ? "Log In" : undefined}
            className="w-full flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all"
            style={{ color: T.primary, border: "1px solid rgba(232,97,28,0.20)", background: "rgba(232,97,28,0.05)", padding: compact ? "10px" : "10px 12px" }}>
            <User className="h-4 w-4" />
            {!compact && "Log In / Register"}
          </button>
        )}
      </div>
    </>
  )

  return (
    <div className="flex h-screen overflow-hidden relative" style={{ backgroundColor: T.bg }}>
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/becho-store-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          opacity: isDark ? 0.15 : 0.08,
          pointerEvents: "none"
        }}
      />

      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 md:hidden"
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        className="fixed top-0 left-0 h-full z-50 flex flex-col md:hidden"
        style={{
          width: 256,
          borderRight: `1px solid ${T.border}`,
          backgroundColor: isDark ? "rgba(3,3,3,0.97)" : "rgba(210,200,186,0.98)",
          backdropFilter: "blur(16px)",
          boxShadow: mobileSidebarOpen ? "4px 0 24px rgba(0,0,0,0.18)" : "none",
        }}
        initial={false}
        animate={{ x: mobileSidebarOpen ? 0 : -260 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
      >
        <SidebarContent compact={false} />
      </motion.aside>

      <motion.aside
        className="hidden md:flex flex-col flex-shrink-0 relative backdrop-blur z-10"
        style={{
          borderRight: `1px solid ${T.border}`,
          backgroundColor: isDark ? "rgba(3,3,3,0.92)" : "rgba(210,200,186,0.95)",
          overflow: "visible",
        }}
        animate={{ width: sidebarCollapsed ? 64 : 256 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onMouseEnter={() => setSidebarHovered(true)}
        onMouseLeave={() => setSidebarHovered(false)}
      >
        <SidebarContent compact={sidebarCollapsed} />

        <motion.button
          onClick={() => setSidebarCollapsed((c) => !c)}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-8 h-8 rounded-full shadow-lg transition-colors"
          style={{
            background: isDark ? "rgba(30,30,30,0.95)" : "rgba(230,220,206,0.95)",
            border: `1px solid ${T.border}`,
            color: T.muted,
          }}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: sidebarHovered ? 1 : 0, scale: sidebarHovered ? 1 : 0.7 }}
          transition={{ duration: 0.18 }}
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.92 }}
        >
          {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </motion.button>
      </motion.aside>

      <main className="flex-1 flex flex-col overflow-hidden z-10 relative">
        <header className="md:hidden flex items-center px-4 py-3 flex-shrink-0 backdrop-blur"
          style={{ borderBottom: `1px solid ${T.border}`, backgroundColor: isDark ? "rgba(3,3,3,0.88)" : "rgba(210,200,186,0.95)" }}>
          <button
            className="h-9 w-9 flex items-center justify-center transition-all mr-3"
            style={{ background: T.surface2, border: EDGE_BORDER, color: T.muted, borderRadius: 0 }}
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Toggle menu"
          >
            <Menu className="h-4 w-4" />
          </button>
          <BechoLogo size={28} showWordmark={true} />
        </header>
        
        <div className="flex-1 overflow-hidden flex flex-col relative z-10">
          {children}
        </div>
      </main>
    </div>
  )
}
