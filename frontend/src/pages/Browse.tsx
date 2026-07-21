import { useState, useEffect, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search, X, SlidersHorizontal, ArrowLeft, Loader2,
  Package, FileText, Zap, LogOut, Bell, User, LayoutDashboard
} from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { ListingCard } from "../components/ListingCard"
import { Button } from "../components/ui/Button"
import { UploadModal } from "../components/UploadModal"
import type { Listing } from "../components/ListingCard"
import { cn } from "../lib/utils"

const API_URL = (import.meta.env["VITE_API_URL"] as string) ?? "http://localhost:3000"

const CATEGORIES = ["All", "Notes", "Books", "Hardware", "Cycles", "Equipment", "Software", "Tutorials", "Lab Tools"]
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
    <div className="min-h-screen bg-[#080808] flex flex-col">
      {/* Top Nav */}
      <nav className="sticky top-0 z-40 bg-[#080808]/90 backdrop-blur border-b border-white/[0.05] px-6 py-3.5 flex items-center gap-4">
        <div className="flex items-center gap-2.5 mr-4">
          <div className="w-7 h-7 rounded-lg bg-[#00fcb5] flex items-center justify-center">
            <Zap className="h-4 w-4 text-black" />
          </div>
          <span className="text-base font-bold text-white tracking-tight">Becho</span>
        </div>

        {/* Search bar */}
        <div className="flex-1 relative max-w-xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            className="w-full bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#00fcb5]/50 focus:ring-1 focus:ring-[#00fcb5]/20 transition-all"
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
                className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-zinc-700 flex items-center justify-center hover:bg-zinc-600 transition-colors"
              >
                <X className="h-3 w-3 text-zinc-300" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04] transition-all"
          >
            <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
          </button>
          <button className="h-9 w-9 rounded-xl border border-white/[0.06] bg-zinc-900/60 flex items-center justify-center hover:border-zinc-700 transition-all">
            <Bell className="h-4 w-4 text-zinc-500" />
          </button>
          <Button size="sm" onClick={() => setUploadOpen(true)}>
            Upload
          </Button>
          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-white/[0.06] ml-1">
              <div className="w-7 h-7 rounded-full bg-[#00fcb5]/20 flex items-center justify-center">
                <span className="text-xs font-bold text-[#00fcb5]">{user.name[0]?.toUpperCase()}</span>
              </div>
              <button onClick={handleLogout} className="text-zinc-600 hover:text-red-400 transition-colors">
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
          <div className="flex items-center gap-1 bg-zinc-900/60 border border-zinc-800 rounded-xl p-1">
            {TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  type === t.value
                    ? "bg-[#00fcb5] text-black"
                    : "text-zinc-500 hover:text-zinc-200"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="h-4 w-px bg-zinc-800" />

          {/* Category chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                  category === cat
                    ? "bg-zinc-100 text-zinc-900 border-transparent"
                    : "border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                )}
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
                className="ml-auto flex items-center gap-1.5 text-xs text-zinc-500 hover:text-red-400 transition-colors"
              >
                <X className="h-3.5 w-3.5" /> Clear filters
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Results header */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-zinc-600">
            {loading ? "Loading…" : (
              <>
                <span className="text-zinc-300 font-semibold">{meta.total}</span> results
                {query && <> for "<span className="text-[#00fcb5]">{query}</span>"</>}
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
                className={cn(
                  "w-8 h-8 rounded-lg text-xs font-semibold transition-all",
                  p === meta.page
                    ? "bg-[#00fcb5] text-black"
                    : "bg-zinc-900 text-zinc-500 hover:bg-zinc-800"
                )}
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
        <div key={i} className="rounded-2xl border border-white/[0.05] bg-zinc-900/40 overflow-hidden animate-pulse">
          <div className="h-44 bg-zinc-800/60" />
          <div className="p-4 space-y-2.5">
            <div className="h-3 bg-zinc-800 rounded w-4/5" />
            <div className="h-2.5 bg-zinc-800/60 rounded w-3/5" />
            <div className="h-2.5 bg-zinc-800/60 rounded w-full" />
            <div className="flex justify-between pt-2">
              <div className="h-4 bg-zinc-800 rounded w-12" />
              <div className="h-4 bg-zinc-800 rounded w-10" />
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
      <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
        <Search className="h-6 w-6 text-zinc-600" />
      </div>
      <p className="text-sm font-semibold text-zinc-400">
        {query ? `No results for "${query}"` : "No listings found"}
      </p>
      <p className="text-xs text-zinc-600 mt-1.5 mb-5">Try adjusting your filters or search terms.</p>
      <Button variant="outline" size="sm" onClick={onClear}>Clear filters</Button>
    </motion.div>
  )
}
