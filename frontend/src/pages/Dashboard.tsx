import { useState, useEffect, useCallback } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard, Package, ShoppingBag, MessageSquare, LogOut,
  User, Plus, Upload, TrendingUp, Star, Eye, Bell,
  ChevronRight, Loader2, PackagePlus, FileText, Search,
  MoreHorizontal, ArrowUpRight, Zap
} from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { Button } from "../components/ui/Button"
import { UploadModal } from "../components/UploadModal"
import { cn } from "../lib/utils"
import type { Listing } from "../components/ListingCard"

const API_URL = (import.meta.env["VITE_API_URL"] as string) ?? "http://localhost:3000"

type ActiveSection = "overview" | "listings" | "browse" | "messages"

const NAV_ITEMS = [
  { id: "overview" as const, label: "Overview", icon: LayoutDashboard },
  { id: "listings" as const, label: "My Listings", icon: Package },
  { id: "browse" as const, label: "Marketplace", icon: ShoppingBag },
  { id: "messages" as const, label: "Messages", icon: MessageSquare },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, token, logout } = useAuth()

  const [activeSection, setActiveSection] = useState<ActiveSection>("overview")
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadType, setUploadType] = useState<"ONLINE" | "OFFLINE" | undefined>()
  const [myListings, setMyListings] = useState<Listing[]>([])
  const [loadingListings, setLoadingListings] = useState(false)
  const [stats, setStats] = useState({ active: 0, earned: 0, reputation: 0 })

  const fetchMyListings = useCallback(async () => {
    if (!token) return
    setLoadingListings(true)
    try {
      const res = await fetch(`${API_URL}/api/listings/my`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json() as { listings: Listing[] }
        setMyListings(data.listings)
        const active = data.listings.filter((l) => (l as unknown as { status: string }).status === "ACTIVE").length
        setStats({
          active,
          earned: data.listings
            .filter((l) => (l as unknown as { status: string }).status === "SOLD")
            .reduce((sum, l) => sum + l.price, 0),
          reputation: user?.role === "SELLER" ? 4.8 : 0,
        })
      }
    } catch { /* silent */ }
    finally { setLoadingListings(false) }
  }, [token, user])

  useEffect(() => { void fetchMyListings() }, [fetchMyListings])

  // Read section from URL hash
  useEffect(() => {
    if (location.hash === "#listings") setActiveSection("listings")
  }, [location.hash])

  const handleLogout = () => { logout(); navigate("/", { replace: true }) }

  const openUpload = (type?: "ONLINE" | "OFFLINE") => {
    setUploadType(type)
    setUploadOpen(true)
  }

  const statusColor: Record<string, string> = {
    ACTIVE: "text-emerald-400 bg-emerald-400/10",
    SOLD: "text-blue-400 bg-blue-400/10",
    HIDDEN: "text-zinc-500 bg-zinc-800",
  }

  return (
    <div className="flex h-screen bg-[#080808] overflow-hidden">
      {/* ── Sidebar ───────────────────────────────── */}
      <aside className="w-60 flex-shrink-0 flex flex-col border-r border-white/[0.05] bg-zinc-950/80 backdrop-blur">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/[0.05]">
          <div className="w-7 h-7 rounded-lg bg-[#00fcb5] flex items-center justify-center">
            <Zap className="h-4 w-4 text-black" />
          </div>
          <span className="text-base font-bold text-white tracking-tight">Becho</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() =>
                item.id === "browse"
                  ? navigate("/browse")
                  : setActiveSection(item.id)
              }
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                activeSection === item.id && item.id !== "browse"
                  ? "bg-[#00fcb5]/10 text-[#00fcb5]"
                  : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]"
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
              {item.id === "messages" && (
                <span className="ml-auto text-[10px] font-bold bg-[#00fcb5]/15 text-[#00fcb5] rounded-full px-1.5 py-0.5">
                  2
                </span>
              )}
            </button>
          ))}

          {/* Quick Upload */}
          <div className="pt-3 border-t border-white/[0.04] mt-2 space-y-0.5">
            <p className="text-[10px] font-semibold text-zinc-600 px-3 pb-1 uppercase tracking-wider">Quick Upload</p>
            <button
              onClick={() => openUpload("OFFLINE")}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04] transition-all"
            >
              <Package className="h-3.5 w-3.5 flex-shrink-0" />
              Hardware Item
            </button>
            <button
              onClick={() => openUpload("ONLINE")}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04] transition-all"
            >
              <FileText className="h-3.5 w-3.5 flex-shrink-0" />
              Online Resource
            </button>
          </div>
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-white/[0.05]">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-zinc-900/60 mb-1">
            <div className="w-7 h-7 rounded-full bg-[#00fcb5]/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-[#00fcb5]">
                {user?.name?.[0]?.toUpperCase() ?? "?"}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{user?.name ?? "—"}</p>
              <p className="text-[10px] text-zinc-600 truncate">{user?.email ?? ""}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-zinc-600 hover:text-red-400 hover:bg-red-400/5 transition-all"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-8 py-4 border-b border-white/[0.05] bg-zinc-950/60 backdrop-blur flex-shrink-0">
          <div>
            <h1 className="text-lg font-semibold text-white">
              {NAV_ITEMS.find((n) => n.id === activeSection)?.label ?? "Dashboard"}
            </h1>
            <p className="text-xs text-zinc-600 mt-0.5">
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="h-9 w-9 rounded-xl border border-white/[0.06] bg-zinc-900/60 flex items-center justify-center hover:border-zinc-700 transition-all">
              <Bell className="h-4 w-4 text-zinc-500" />
            </button>
            <Button size="sm" onClick={() => openUpload()}>
              <Plus className="h-4 w-4 mr-1.5" /> New Listing
            </Button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeSection === "overview" && (
              <OverviewSection
                key="overview"
                user={user}
                stats={stats}
                myListings={myListings}
                loadingListings={loadingListings}
                onUpload={openUpload}
                onViewListings={() => setActiveSection("listings")}
                onViewDetail={(id) => navigate(`/listings/${id}`)}
              />
            )}
            {activeSection === "listings" && (
              <ListingsSection
                key="listings"
                listings={myListings}
                loading={loadingListings}
                onUpload={openUpload}
                onViewDetail={(id) => navigate(`/listings/${id}`)}
                statusColor={statusColor}
              />
            )}
            {activeSection === "messages" && (
              <MessagesSection key="messages" />
            )}
          </AnimatePresence>
        </div>
      </main>

      <UploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        defaultType={uploadType}
        onSuccess={() => { void fetchMyListings() }}
      />
    </div>
  )
}

// ── Overview ─────────────────────────────────────────────────────────────────

function OverviewSection({
  user, stats, myListings, loadingListings, onUpload, onViewListings, onViewDetail
}: {
  user: { name: string; email: string; role: string } | null
  stats: { active: number; earned: number; reputation: number }
  myListings: Listing[]
  loadingListings: boolean
  onUpload: (type?: "ONLINE" | "OFFLINE") => void
  onViewListings: () => void
  onViewDetail: (id: string) => void
}) {
  const recentListings = myListings.slice(0, 5)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.22 }}
      className="p-8 space-y-8 max-w-5xl"
    >
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-white">
          Welcome back, {user?.name?.split(" ")[0] ?? "there"} 👋
        </h2>
        <p className="text-sm text-zinc-500 mt-1">Here's what's happening with your account.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Active Listings", value: stats.active, icon: Package, color: "text-[#00fcb5]", bg: "bg-[#00fcb5]/10" },
          { label: "Total Earned", value: `₹${stats.earned.toLocaleString("en-IN")}`, icon: TrendingUp, color: "text-blue-400", bg: "bg-blue-400/10" },
          { label: "Reputation", value: stats.reputation > 0 ? `${stats.reputation}/5` : "—", icon: Star, color: "text-amber-400", bg: "bg-amber-400/10" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-white/[0.05] bg-zinc-900/40 p-5 flex items-center gap-4">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", s.bg)}>
              <s.icon className={cn("h-5 w-5", s.color)} />
            </div>
            <div>
              <p className="text-xs text-zinc-600">{s.label}</p>
              <p className="text-xl font-bold text-white mt-0.5">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <p className="text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-3">Quick Actions</p>
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onUpload("OFFLINE")}
            className="flex items-center gap-3 p-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.04] hover:bg-amber-500/[0.08] hover:border-amber-500/40 transition-all text-left group"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
              <Package className="h-4.5 w-4.5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">Upload Hardware</p>
              <p className="text-xs text-zinc-600">Books, cycles, equipment…</p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-zinc-700 ml-auto group-hover:text-amber-400 transition-colors" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onUpload("ONLINE")}
            className="flex items-center gap-3 p-4 rounded-xl border border-blue-500/20 bg-blue-500/[0.04] hover:bg-blue-500/[0.08] hover:border-blue-500/40 transition-all text-left group"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0">
              <Upload className="h-4.5 w-4.5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors">Upload Online Resource</p>
              <p className="text-xs text-zinc-600">Notes, PDFs, software…</p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-zinc-700 ml-auto group-hover:text-blue-400 transition-colors" />
          </motion.button>
        </div>
      </div>

      {/* Recent listings */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">Recent Listings</p>
          <button
            onClick={onViewListings}
            className="text-xs text-[#00fcb5] hover:underline flex items-center gap-1"
          >
            View all <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        {loadingListings ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 text-zinc-600 animate-spin" />
          </div>
        ) : recentListings.length === 0 ? (
          <EmptyListings onUpload={onUpload} />
        ) : (
          <div className="rounded-xl border border-white/[0.05] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.05] bg-zinc-900/30">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-600">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-600">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-600">Price</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-600">Status</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {recentListings.map((l, idx) => {
                  const ls = l as unknown as { status: string }
                  return (
                    <tr
                      key={l.id}
                      onClick={() => onViewDetail(l.id)}
                      className={cn(
                        "cursor-pointer hover:bg-zinc-800/30 transition-colors group",
                        idx < recentListings.length - 1 && "border-b border-white/[0.03]"
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {l.images?.[0] ? (
                              <img src={l.images[0]} alt="" className="w-full h-full object-cover" />
                            ) : l.type === "ONLINE" ? (
                              <FileText className="h-3.5 w-3.5 text-zinc-600" />
                            ) : (
                              <Package className="h-3.5 w-3.5 text-zinc-600" />
                            )}
                          </div>
                          <span className="text-xs font-medium text-zinc-300 group-hover:text-white transition-colors line-clamp-1">{l.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                          l.type === "ONLINE" ? "bg-blue-500/15 text-blue-400" : "bg-amber-500/15 text-amber-400"
                        )}>
                          {l.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-400">
                        {l.isFree ? <span className="text-[#00fcb5] font-semibold">Free</span> : `₹${l.price}`}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", {
                          "bg-emerald-400/10 text-emerald-400": ls.status === "ACTIVE",
                          "bg-blue-400/10 text-blue-400": ls.status === "SOLD",
                          "bg-zinc-800 text-zinc-500": ls.status === "HIDDEN",
                        })}>
                          {ls.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Eye className="h-3.5 w-3.5 text-zinc-700 group-hover:text-zinc-400 transition-colors" />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ── Listings Section ──────────────────────────────────────────────────────────

function ListingsSection({
  listings, loading, onUpload, onViewDetail, statusColor
}: {
  listings: Listing[]
  loading: boolean
  onUpload: (type?: "ONLINE" | "OFFLINE") => void
  onViewDetail: (id: string) => void
  statusColor: Record<string, string>
}) {
  const [search, setSearch] = useState("")
  const filtered = listings.filter((l) =>
    l.title.toLowerCase().includes(search.toLowerCase()) ||
    l.category.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="p-8 space-y-6 max-w-5xl"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">My Listings</h2>
          <p className="text-xs text-zinc-600 mt-0.5">{listings.length} listing{listings.length !== 1 ? "s" : ""} total</p>
        </div>
        <Button size="sm" onClick={() => onUpload()}>
          <Plus className="h-4 w-4 mr-1.5" /> New Listing
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
        <input
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#00fcb5]/50 transition-all"
          placeholder="Search your listings…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 text-zinc-600 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyListings onUpload={onUpload} />
      ) : (
        <div className="rounded-xl border border-white/[0.05] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.05] bg-zinc-900/30">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-zinc-600">Title</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-zinc-600">Type</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-zinc-600">Category</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-zinc-600">Price</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-zinc-600">Status</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((l, idx) => {
                const ls = l as unknown as { status: string }
                return (
                  <tr
                    key={l.id}
                    onClick={() => onViewDetail(l.id)}
                    className={cn(
                      "cursor-pointer hover:bg-zinc-800/20 transition-colors group",
                      idx < filtered.length - 1 && "border-b border-white/[0.03]"
                    )}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {l.images?.[0] ? (
                            <img src={l.images[0]} alt="" className="w-full h-full object-cover" />
                          ) : l.type === "ONLINE" ? (
                            <FileText className="h-4 w-4 text-zinc-600" />
                          ) : (
                            <Package className="h-4 w-4 text-zinc-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-zinc-300 group-hover:text-white transition-colors line-clamp-1">{l.title}</p>
                          {l.subject && <p className="text-[10px] text-zinc-600">{l.subject}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full",
                        l.type === "ONLINE" ? "bg-blue-500/15 text-blue-400" : "bg-amber-500/15 text-amber-400"
                      )}>
                        {l.type}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-zinc-500">{l.category}</td>
                    <td className="px-4 py-3.5 text-xs font-semibold">
                      {l.isFree ? <span className="text-[#00fcb5]">Free</span> : <span className="text-white">₹{l.price}</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", {
                        "bg-emerald-400/10 text-emerald-400": ls.status === "ACTIVE",
                        "bg-blue-400/10 text-blue-400": ls.status === "SOLD",
                        "bg-zinc-800 text-zinc-500": ls.status === "HIDDEN",
                      })}>
                        {ls.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <MoreHorizontal className="h-4 w-4 text-zinc-700 group-hover:text-zinc-400 transition-colors" />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  )
}

// ── Messages placeholder ──────────────────────────────────────────────────────

function MessagesSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="p-8 max-w-5xl"
    >
      <h2 className="text-xl font-bold text-white mb-6">Messages</h2>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
          <MessageSquare className="h-6 w-6 text-zinc-600" />
        </div>
        <p className="text-sm font-semibold text-zinc-400">No messages yet</p>
        <p className="text-xs text-zinc-600 mt-1.5">When buyers contact you, messages will appear here.</p>
      </div>
    </motion.div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyListings({ onUpload }: { onUpload: (type?: "ONLINE" | "OFFLINE") => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-white/[0.06]">
      <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3">
        <PackagePlus className="h-5 w-5 text-zinc-600" />
      </div>
      <p className="text-sm font-semibold text-zinc-400">No listings yet</p>
      <p className="text-xs text-zinc-600 mt-1 mb-4">Upload your first item to start selling.</p>
      <Button size="sm" onClick={() => onUpload()}>
        <Plus className="h-4 w-4 mr-1.5" /> Create Listing
      </Button>
    </div>
  )
}
