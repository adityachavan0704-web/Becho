import { useState, useEffect, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search, X, LogOut, Bell, LayoutDashboard, Sun, Moon
} from "lucide-react"
import BechoLogo from "../components/BechoLogo"
import { useAuth } from "../contexts/AuthContext"
import { useTheme } from "../contexts/ThemeContext"
import { ListingCard } from "../components/ListingCard"
import { Button } from "../components/ui/Button"
import { UploadModal } from "../components/UploadModal"
import type { Listing } from "../components/ListingCard"
import { cn } from "../lib/utils"

const API_URL = (import.meta.env["VITE_API_URL"] as string) ?? "http://localhost:3000"

const CATEGORIES = ["All", "Notes", "Books", "Hardware", "Cycles", "Equipment", "Software", "Tutorials", "Lab Tools", "Furniture", "Mock Tests", "Projects"]
const TYPES = [
  { label: "All", value: "" },
  { label: "Online", value: "ONLINE" },
  { label: "Hardware", value: "OFFLINE" },
]

interface Meta {
  total: number
  page: number
  pages: number
  limit: number
}

export default function Browse() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()

  const [query, setQuery] = useState("")
  const [liveQuery, setLiveQuery] = useState("")
  const [type, setType] = useState("")
  const [category, setCategory] = useState("All")
  const [listings, setListings] = useState<Listing[]>([])
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, pages: 1, limit: 20 })
  const [loading, setLoading] = useState(true)
  const [uploadOpen, setUploadOpen] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchListings = useCallback(async (
    q: string, t: string, cat: string, page = 1
  ) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set("q", q)
      if (t) params.set("type", t)
      if (cat && cat !== "All") params.set("category", cat)
      params.set("page", String(page))
      params.set("limit", "24")

      const res = await fetch(`${API_URL}/api/listings?${params.toString()}`)
      if (res.ok) {
        const data = await res.json() as { listings: Listing[]; meta: Meta }
        setListings(data.listings)
        setMeta(data.meta)
      }
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  // Live debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setQuery(liveQuery)
    }, 380)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [liveQuery])

  useEffect(() => {
    void fetchListings(query, type, category)
  }, [query, type, category, fetchListings])

  const handleLogout = () => { logout(); navigate("/") }
  const clearSearch = () => { setLiveQuery(""); setQuery("") }

  const hasFilters = !!query || !!type || category !== "All"

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      {/* Top Nav */}
      <nav className="sticky top-0 z-40 backdrop-blur px-6 py-3.5 flex items-center gap-4"
        style={{ backgroundColor: isDark ? "rgba(8,8,8,0.92)" : "rgba(220,210,196,0.96)", borderBottom: "var(--border-width) solid var(--border)" }}>
        <div className="flex items-center gap-2.5 mr-4">
          <BechoLogo size={30} showWordmark={true} />
        </div>

        {/* Search bar */}
        <div className="flex-1 relative max-w-xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-muted)" }} />
          <input
            style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
            className="w-full rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none transition-all border"
            placeholder="Search notes, books, hardware, cycles…"
            value={liveQuery}
            onChange={(e) => setLiveQuery(e.target.value)}
          />
          <AnimatePresence>
            {liveQuery && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full flex items-center justify-center transition-colors"
                style={{ backgroundColor: "var(--surface-3)", color: "var(--text)" }}
              >
                <X className="h-3 w-3" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
            style={{ color: "var(--text-muted)" }}
          >
            <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
          </button>
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="h-9 w-9 rounded-xl flex items-center justify-center transition-all"
            style={{ background: "var(--surface-2)", border: "var(--border-width) solid var(--border)", color: "var(--text-muted)" }}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button className="h-9 w-9 rounded-xl flex items-center justify-center transition-all"
            style={{ border: "var(--border-width) solid var(--border)", backgroundColor: "var(--surface-2)", color: "var(--text-muted)" }}>
            <Bell className="h-4 w-4" />
          </button>
          <Button size="sm" onClick={() => setUploadOpen(true)}>
            Upload
          </Button>
          {user && (
            <div className="flex items-center gap-2 pl-2 ml-1" style={{ borderLeft: "var(--border-width) solid var(--border)" }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(255,107,26,0.20)" }}>
                <span className="text-xs font-bold" style={{ color: "var(--primary)" }}>{user.name[0]?.toUpperCase()}</span>
              </div>
              <button onClick={handleLogout} className="transition-colors hover:text-red-400" style={{ color: "var(--text-muted)" }}>
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </nav>

      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-6">
        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Type toggle */}
          <div className="flex items-center gap-1 rounded-xl p-1" style={{ backgroundColor: "var(--surface-2)", border: "var(--border-width) solid var(--border)" }}>
            {TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={type === t.value
                  ? { backgroundColor: "var(--primary)", color: "#fff" }
                  : { color: "var(--text-muted)" }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="h-4 w-px" style={{ backgroundColor: "var(--border)" }} />

          {/* Category chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
                style={category === cat
                  ? { backgroundColor: "var(--text)", color: "var(--bg)", borderColor: "transparent" }
                  : { borderColor: "var(--border)", color: "var(--text-muted)" }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Clear filters */}
          <AnimatePresence>
            {hasFilters && (
              <motion.button
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                onClick={() => { clearSearch(); setType(""); setCategory("All") }}
                className="ml-auto flex items-center gap-1.5 text-xs hover:text-red-400 transition-colors"
                style={{ color: "var(--text-muted)" }}
              >
                <X className="h-3.5 w-3.5" /> Clear filters
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Results header */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {loading ? "Loading…" : (
              <>
                <span className="font-semibold" style={{ color: "var(--text)" }}>{meta.total}</span> results
                {query && <> for "<span style={{ color: "var(--primary)" }}>{query}</span>"</>}
              </>
            )}
          </p>
        </div>

        {/* Grid */}
        {loading ? (
          <SkeletonGrid />
        ) : listings.length === 0 ? (
          <EmptyResults query={query} onClear={() => { clearSearch(); setType(""); setCategory("All") }} />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
          >
            {listings.map((listing, idx) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.25 }}
              >
                <ListingCard listing={listing} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Pagination */}
        {!loading && meta.pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            {Array.from({ length: meta.pages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => void fetchListings(query, type, category, p)}
                className="w-8 h-8 rounded-lg text-xs font-semibold transition-all"
                style={p === meta.page
                  ? { backgroundColor: "var(--primary)", color: "#fff" }
                  : { backgroundColor: "var(--surface-2)", color: "var(--text-muted)" }}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      <UploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={() => void fetchListings(query, type, category)}
      />
    </div>
  )
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {Array.from({ length: 15 }).map((_, i) => (
        <div key={i} className="rounded-2xl overflow-hidden animate-pulse"
          style={{ border: "var(--border-width) solid var(--border)", backgroundColor: "var(--surface)" }}>
          <div className="h-44" style={{ backgroundColor: "var(--surface-3)" }} />
          <div className="p-4 space-y-2.5">
            <div className="h-3 rounded w-4/5" style={{ backgroundColor: "var(--surface-3)" }} />
            <div className="h-2.5 rounded w-3/5" style={{ backgroundColor: "var(--surface-2)" }} />
            <div className="h-2.5 rounded w-full" style={{ backgroundColor: "var(--surface-2)" }} />
            <div className="flex justify-between pt-2">
              <div className="h-4 rounded w-12" style={{ backgroundColor: "var(--surface-3)" }} />
              <div className="h-4 rounded w-10" style={{ backgroundColor: "var(--surface-3)" }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyResults({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ backgroundColor: "var(--surface-2)", border: "var(--border-width) solid var(--border)" }}>
        <Search className="h-6 w-6" style={{ color: "var(--text-muted)" }} />
      </div>
      <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
        {query ? `No results for "${query}"` : "No listings found"}
      </p>
      <p className="text-xs mt-1.5 mb-5" style={{ color: "var(--text-muted)" }}>Try adjusting your filters or search terms.</p>
      <Button variant="outline" size="sm" onClick={onClear}>Clear filters</Button>
    </motion.div>
  )
}
