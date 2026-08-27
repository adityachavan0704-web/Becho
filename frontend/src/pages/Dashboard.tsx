import { useState, useEffect, useCallback, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard, Package, ShoppingBag, MessageSquare, LogOut,
  User, Plus, Upload, TrendingUp, Star, Eye, Bell,
  ChevronRight, Loader2, PackagePlus, FileText, Search,
  MoreHorizontal, ArrowUpRight, Lock, X, ArrowRight,
  Moon, Sun, Heart, Inbox
} from "lucide-react"
import { io } from "socket.io-client"
import { useAuth } from "../contexts/AuthContext"
import { useTheme } from "../contexts/ThemeContext"
import { Button } from "../components/ui/Button"
import { UploadModal } from "../components/UploadModal"
import type { Listing } from "../components/ListingCard"
import BechoLogo from "../components/BechoLogo"

const API_URL = (import.meta.env["VITE_API_URL"] as string) ?? "http://localhost:3000"
type ActiveSection = "overview" | "listings" | "browse" | "messages" | "wishlist"
const NAV_ITEMS = [
  { id: "overview" as const, label: "Overview", icon: LayoutDashboard },
  { id: "listings" as const, label: "My Listings", icon: Package },
  { id: "browse" as const, label: "Marketplace", icon: ShoppingBag },
  { id: "messages" as const, label: "Messages", icon: MessageSquare },
  { id: "wishlist" as const, label: "Wishlist", icon: Heart },
]

const MOCK_LISTINGS = [
  { id: "m1", title: "Data Structures & Algorithms – GATE Notes", description: "Comprehensive handwritten notes covering arrays, trees, graphs, dynamic programming, and sorting algorithms. Perfect for GATE & placements.", price: 149, type: "ONLINE", category: "Notes", subject: "DSA", isFree: false, images: [], seller: { id: "s1", name: "Rahul Sharma", reputation: 4.8 }, createdAt: "2026-07-01T10:00:00Z" },
  { id: "m2", title: "Arduino Uno R3 Starter Kit", description: "Complete Arduino starter kit with breadboard, LEDs, resistors, jumper wires, and 30+ components. Barely used, great for IoT projects.", price: 850, type: "OFFLINE", category: "Hardware", subject: null, isFree: false, images: [], seller: { id: "s2", name: "Priya Singh", reputation: 4.9 }, createdAt: "2026-07-05T09:00:00Z" },
  { id: "m3", title: "Engineering Mathematics – S.K. Mondal", description: "Full solution set for SK Mondal Engineering Mathematics, topic-wise with shortcuts. Great for GATE 2026 prep.", price: 0, type: "ONLINE", category: "Notes", subject: "Engg. Maths", isFree: true, images: [], seller: { id: "s3", name: "Aryan Mehta", reputation: 4.7 }, createdAt: "2026-07-10T08:30:00Z" },
  { id: "m4", title: "Raspberry Pi 4 Model B (4GB)", description: "Raspberry Pi 4 with 4GB RAM, case, power supply, and 32GB SD card preloaded with Raspberry Pi OS. Perfect for ML projects.", price: 3800, type: "OFFLINE", category: "Hardware", subject: null, isFree: false, images: [], seller: { id: "s4", name: "Sneha Patel", reputation: 4.6 }, createdAt: "2026-07-08T11:00:00Z" },
  { id: "m5", title: "Computer Networks – Forouzan (5th Ed.)", description: "Original textbook in excellent condition. All chapters intact, minimal highlighting. Covers OSI, TCP/IP, routing, and more.", price: 320, type: "OFFLINE", category: "Books", subject: "Computer Networks", isFree: false, images: [], seller: { id: "s5", name: "Vikram Nair", reputation: 4.5 }, createdAt: "2026-07-12T14:00:00Z" },
  { id: "m6", title: "Python for Data Science – Full Course Notes", description: "350+ pages of curated Python notes covering NumPy, Pandas, Matplotlib, Scikit-learn and ML fundamentals.", price: 199, type: "ONLINE", category: "Notes", subject: "Data Science", isFree: false, images: [], seller: { id: "s6", name: "Kavya Reddy", reputation: 4.9 }, createdAt: "2026-07-15T10:30:00Z" },
  { id: "m7", title: "Hero Splendor Plus (Campus Use)", description: "Well-maintained Hero Splendor+ for campus commute. FC done, insurance valid, 52,000 km driven. Negotiable.", price: 28000, type: "OFFLINE", category: "Cycles", subject: null, isFree: false, images: [], seller: { id: "s7", name: "Rohan Joshi", reputation: 4.4 }, createdAt: "2026-07-11T09:00:00Z" },
  { id: "m8", title: "Digital Electronics Lab Manual", description: "Complete lab manual with circuit diagrams, truth tables, and viva questions for 8 experiments. Sem 4 ECE.", price: 80, type: "ONLINE", category: "Notes", subject: "Digital Electronics", isFree: false, images: [], seller: { id: "s8", name: "Anjali Kumar", reputation: 4.3 }, createdAt: "2026-07-14T15:00:00Z" },
  { id: "m9", title: "Operating Systems – Silberschatz (10th Ed.)", description: "10th edition OS book. Clean, no torn pages. Covers processes, memory management, file systems, and deadlocks.", price: 450, type: "OFFLINE", category: "Books", subject: "Operating Systems", isFree: false, images: [], seller: { id: "s9", name: "Dev Malhotra", reputation: 4.7 }, createdAt: "2026-07-06T12:00:00Z" },
  { id: "m10", title: "HC Verma – Concepts of Physics (Vol 1 & 2)", description: "Classic HCV set, both volumes in good condition. A few pencil marks, easily erasable. Essential for JEE prep.", price: 600, type: "OFFLINE", category: "Books", subject: "Physics", isFree: false, images: [], seller: { id: "s10", name: "Pooja Sharma", reputation: 4.6 }, createdAt: "2026-07-09T10:00:00Z" },
  { id: "m11", title: "DBMS Complete Notes – SQL + Normalization", description: "Covers ER diagrams, relational algebra, SQL queries, normalization up to BCNF, and transaction management.", price: 129, type: "ONLINE", category: "Notes", subject: "DBMS", isFree: false, images: [], seller: { id: "s11", name: "Suresh Iyer", reputation: 4.8 }, createdAt: "2026-07-13T11:30:00Z" },
  { id: "m12", title: "Soldering Iron + Kit (60W)", description: "Professional 60W soldering iron with solder wire, flux, PCB stand, and cleaning sponge. Works perfectly.", price: 350, type: "OFFLINE", category: "Equipment", subject: null, isFree: false, images: [], seller: { id: "s12", name: "Manish Tiwari", reputation: 4.5 }, createdAt: "2026-07-16T13:00:00Z" },
  { id: "m13", title: "React + Node.js Full Stack Project Source Code", description: "Complete e-commerce project with JWT auth, REST API, MongoDB. Well-documented codebase.", price: 499, type: "ONLINE", category: "Software", subject: "Web Development", isFree: false, images: [], seller: { id: "s13", name: "Nisha Agarwal", reputation: 4.9 }, createdAt: "2026-07-17T09:00:00Z" },
  { id: "m14", title: "Vernier Caliper (150mm) – Mitutoyo", description: "Genuine Mitutoyo Vernier caliper, accurate to 0.02mm. Used for 2 lab sessions only, basically new.", price: 750, type: "OFFLINE", category: "Lab Tools", subject: null, isFree: false, images: [], seller: { id: "s14", name: "Kiran Bhat", reputation: 4.6 }, createdAt: "2026-07-03T10:00:00Z" },
  { id: "m15", title: "Machine Learning – Andrew Ng Notes + Assignments", description: "Complete handwritten notes from Andrew Ng Coursera ML course + solved assignments in Python. 200+ pages.", price: 0, type: "ONLINE", category: "Notes", subject: "Machine Learning", isFree: true, images: [], seller: { id: "s15", name: "Tanveer Khan", reputation: 4.7 }, createdAt: "2026-07-18T08:00:00Z" },
  { id: "m16", title: "DSP – Digital Signal Processing Textbook", description: "Proakis and Manolakis DSP book, 4th edition. Good condition, some highlighting in chapter 1-3.", price: 280, type: "OFFLINE", category: "Books", subject: "DSP", isFree: false, images: [], seller: { id: "s16", name: "Deepa Menon", reputation: 4.4 }, createdAt: "2026-07-07T14:00:00Z" },
  { id: "m17", title: "Scientific Calculator – Casio FX-991ES Plus", description: "Casio FX-991ES Plus in perfect condition, all buttons working. Comes with original case.", price: 400, type: "OFFLINE", category: "Equipment", subject: null, isFree: false, images: [], seller: { id: "s17", name: "Abhishek Roy", reputation: 4.5 }, createdAt: "2026-07-10T16:00:00Z" },
  { id: "m18", title: "STM32 Blue Pill Microcontroller Board", description: "STM32F103C8T6 development board with USB cable. Perfect for embedded systems and ARM Cortex-M3 learning.", price: 220, type: "OFFLINE", category: "Hardware", subject: null, isFree: false, images: [], seller: { id: "s18", name: "Pallavi Das", reputation: 4.8 }, createdAt: "2026-07-20T10:00:00Z" },
  { id: "m19", title: "Compiler Design – Dragon Book Notes", description: "Simplified notes from Aho, Lam, Sethi and Ullman. Covers lexing, parsing, semantic analysis, code generation and optimization.", price: 180, type: "ONLINE", category: "Notes", subject: "Compiler Design", isFree: false, images: [], seller: { id: "s19", name: "Gautam Pillai", reputation: 4.6 }, createdAt: "2026-07-19T11:00:00Z" },
  { id: "m20", title: "Breadboard + 120 Jumper Wires Set", description: "Full-size 830 tie-point solderless breadboard + 120 jumper wires M-M, M-F, F-F. Ideal for circuit prototyping.", price: 180, type: "OFFLINE", category: "Hardware", subject: null, isFree: false, images: [], seller: { id: "s20", name: "Aishwarya Rao", reputation: 4.7 }, createdAt: "2026-07-21T09:00:00Z" },
  { id: "m21", title: "Theory of Computation – GATE 2026 Notes", description: "Topic-wise notes covering FA, PDA, TM, decidability, and complexity. 150+ solved PYQs included.", price: 149, type: "ONLINE", category: "Notes", subject: "TOC", isFree: false, images: [], seller: { id: "s21", name: "Harish Kumar", reputation: 4.9 }, createdAt: "2026-07-22T08:00:00Z" },
  { id: "m22", title: "Atlas Scientific Cycle + Lock", description: "Atlas road cycle in decent condition with chain lock. Tires recently replaced. Good for campus commuting.", price: 3500, type: "OFFLINE", category: "Cycles", subject: null, isFree: false, images: [], seller: { id: "s22", name: "Riya Gupta", reputation: 4.3 }, createdAt: "2026-07-04T12:00:00Z" },
  { id: "m23", title: "Java – Complete Reference by Herbert Schildt", description: "11th edition Java Complete Reference. No highlights, all pages intact. Great for OOP and Java SE prep.", price: 380, type: "OFFLINE", category: "Books", subject: "Java", isFree: false, images: [], seller: { id: "s23", name: "Saurabh Jain", reputation: 4.5 }, createdAt: "2026-07-02T10:00:00Z" },
  { id: "m24", title: "PCB Design Files – Mini Project Collection", description: "Kicad design files for 10 mini PCB projects including power supply, amplifier, and sensor boards. Open-source.", price: 0, type: "ONLINE", category: "Software", subject: "Electronics", isFree: true, images: [], seller: { id: "s24", name: "Meera Pillai", reputation: 4.8 }, createdAt: "2026-07-23T10:00:00Z" },
  { id: "m25", title: "Electromagnetic Field Theory – Hayt & Buck", description: "8th edition EMF Theory book. Lightly used, excellent condition. Covers fields, waves, transmission lines.", price: 290, type: "OFFLINE", category: "Books", subject: "EMF Theory", isFree: false, images: [], seller: { id: "s25", name: "Ankit Verma", reputation: 4.6 }, createdAt: "2026-07-24T09:00:00Z" },
] as const

// ── Helpers ───────────────────────────────────────────────────────────────────
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

// ── Login Prompt Modal ────────────────────────────────────────────────────────
function LoginPromptModal({ open, onClose, action }: { open: boolean; onClose: () => void; action: "buy" | "sell" }) {
  const navigate = useNavigate()
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-3xl p-8 text-center overflow-hidden"
            style={{ background: T.surface, border: `var(--border-width) solid ${T.border}` }}
          >
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse at top, rgba(255,107,26,0.12) 0%, transparent 60%)" }} />
            <button onClick={onClose} className="absolute top-4 right-4 transition-colors"
              style={{ color: T.subtle }}>
              <X className="h-4 w-4" />
            </button>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ background: "rgba(255,107,26,0.10)", border: "var(--border-width) solid rgba(255,107,26,0.20)" }}>
              <Lock className="h-6 w-6" style={{ color: T.primary }} />
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: T.text }}>
              {action === "buy" ? "Login to Buy" : "Login to Sell"}
            </h3>
            <p className="text-sm mb-6 leading-relaxed" style={{ color: T.muted }}>
              {action === "buy"
                ? "Create an account or log in to contact the seller and complete your purchase."
                : "Log in or register to start listing your items on Becho."}
            </p>
            <div className="flex flex-col gap-3">
              <Button className="w-full text-sm font-mono uppercase tracking-widest" onClick={() => navigate("/login")}>
                Log In <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" className="w-full text-sm font-mono uppercase tracking-widest" onClick={() => navigate("/login?tab=register")}>
                Create Account
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Purchase Modal ────────────────────────────────────────────────────────────
type PurchaseItem = {
  id: string
  title: string
  category: string
  price: number
  isFree: boolean
  img: string
  description?: string
  seller?: { name: string; reputation?: number }
}

function PurchaseModal({ item, open, onClose, isAuthenticated, onLoginPrompt }: {
  item: PurchaseItem | null
  open: boolean
  onClose: () => void
  isAuthenticated: boolean
  onLoginPrompt: (action: "buy" | "sell") => void
}) {
  const [purchased, setPurchased] = useState(false)
  const [loading, setLoading] = useState(false)

  // Reset state when item changes
  useEffect(() => {
    if (open) { setPurchased(false); setLoading(false) }
  }, [open, item?.id])

  if (!item) return null

  const handleBuy = () => {
    if (!isAuthenticated) { onClose(); onLoginPrompt("buy"); return }
    setLoading(true)
    setTimeout(() => { setLoading(false); setPurchased(true) }, 1400)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.80)", backdropFilter: "blur(10px)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 32 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 32 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-3xl overflow-hidden"
            style={{ background: T.surface, border: `var(--border-width) solid ${T.border}` }}
          >
            {/* Ambient glow */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse at top, rgba(255,107,26,0.10) 0%, transparent 60%)" }} />

            {/* Hero image */}
            <div className="relative w-full overflow-hidden" style={{ height: "220px" }}>
              <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.70) 0%, rgba(0,0,0,0.10) 60%)" }} />
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)", color: "#fff" }}
              >
                <X className="h-4 w-4" />
              </button>
              {/* Price chip */}
              <div className="absolute bottom-3 left-4">
                <span
                  className="text-3xl font-black"
                  style={{ color: item.isFree ? "#4ade80" : "#fff", textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}
                >
                  {item.isFree ? "FREE" : `₹${item.price.toLocaleString("en-IN")}`}
                </span>
              </div>
              {/* Category badge */}
              <div className="absolute top-3 left-4">
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(255,107,26,0.85)", color: "#fff", backdropFilter: "blur(4px)" }}
                >
                  {item.category}
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              {purchased ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center text-center py-4"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.1 }}
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                    style={{ background: "rgba(74,222,128,0.15)", border: "2px solid rgba(74,222,128,0.40)" }}
                  >
                    <span className="text-3xl">✓</span>
                  </motion.div>
                  <h3 className="text-xl font-bold mb-1" style={{ color: T.text }}>Request Sent!</h3>
                  <p className="text-sm leading-relaxed" style={{ color: T.muted }}>
                    The seller has been notified. Check your <strong>Messages</strong> to continue the conversation.
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-5 w-full py-3 rounded-2xl text-sm font-bold transition-all"
                    style={{ background: "rgba(74,222,128,0.12)", color: "#4ade80", border: "var(--border-width) solid rgba(74,222,128,0.25)" }}
                  >
                    Done
                  </button>
                </motion.div>
              ) : (
                <>
                  <h3 className="text-lg font-bold leading-snug mb-1" style={{ color: T.text }}>{item.title}</h3>

                  {item.description && (
                    <p className="text-sm leading-relaxed mb-4" style={{ color: T.muted }}>{item.description}</p>
                  )}

                  {/* Seller chip */}
                  {item.seller && (
                    <div className="flex items-center gap-2.5 mb-5 p-3 rounded-xl" style={{ background: T.surface2, border: `var(--border-width) solid ${T.border}` }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(255,107,26,0.18)" }}>
                        <span className="text-sm font-bold" style={{ color: T.primary }}>
                          {item.seller.name[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: T.text }}>{item.seller.name}</p>
                        <p className="text-xs" style={{ color: T.subtle }}>Seller</p>
                      </div>
                      {item.seller.reputation !== undefined && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3" style={{ color: "#f59e0b" }} fill="#f59e0b" />
                          <span className="text-xs font-bold" style={{ color: T.text }}>{item.seller.reputation}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* CTA */}
                  <motion.button
                    id={`purchase-btn-${item.id}`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleBuy}
                    disabled={loading}
                    className="w-full py-3.5 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                    style={{
                      background: loading ? T.surface2 : "linear-gradient(135deg, #FF6B1A 0%, #FF8A42 100%)",
                      color: loading ? T.muted : "#fff",
                      boxShadow: loading ? "none" : "0 4px 20px rgba(255,107,26,0.35)",
                      border: "none",
                    }}
                  >
                    {loading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Sending Request…</>
                    ) : item.isFree ? (
                      <><ArrowRight className="h-4 w-4" /> Get for Free</>
                    ) : (
                      <><ShoppingBag className="h-4 w-4" /> {isAuthenticated ? "Contact Seller" : "Login to Buy"}</>
                    )}
                  </motion.button>

                  {!isAuthenticated && (
                    <p className="text-xs text-center mt-3" style={{ color: T.subtle }}>
                      You'll be redirected to log in first.
                    </p>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, getAccessToken, logout, isAuthenticated } = useAuth()
  const { isDark, toggleTheme } = useTheme()

  const [activeSection, setActiveSection] = useState<ActiveSection>("browse")
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadType, setUploadType] = useState<"ONLINE" | "OFFLINE" | undefined>()
  const [myListings, setMyListings] = useState<Listing[]>([])
  const [loadingListings, setLoadingListings] = useState(false)
  const [stats, setStats] = useState({ active: 0, earned: 0, reputation: 0 })
  const [loginPrompt, setLoginPrompt] = useState<{ open: boolean; action: "buy" | "sell" }>({ open: false, action: "buy" })
  const [purchaseItem, setPurchaseItem] = useState<PurchaseItem | null>(null)
  const [globalWishlist, setGlobalWishlist] = useState<Set<string>>(new Set())
  const [inboxUnread, setInboxUnread] = useState(0)

  const toggleGlobalWishlist = (id: string) => {
    setGlobalWishlist((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const fetchMyListings = useCallback(async () => {
    const token = getAccessToken()
    if (!token) return
    setLoadingListings(true)
    try {
      const res = await fetch(`${API_URL}/api/listings/my`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json() as { listings: Listing[] }
        setMyListings(data.listings)
        const active = data.listings.filter((l) => (l as unknown as { status: string }).status === "ACTIVE").length
        setStats({
          active,
          earned: data.listings.filter((l) => (l as unknown as { status: string }).status === "SOLD").reduce((s, l) => s + l.price, 0),
          reputation: user?.reputation ?? 0,
        })
      }
    } catch { /* silent */ }
    finally { setLoadingListings(false) }
  }, [getAccessToken, user])

  useEffect(() => { void fetchMyListings() }, [fetchMyListings])

  // Fetch inbox unread count + real-time updates
  useEffect(() => {
    if (!user) return
    const API_URL_SOCK = (import.meta.env["VITE_API_URL"] as string) ?? "http://localhost:3000"
    void (async () => {
      try {
        const token = getAccessToken()
        const res = await fetch(`${API_URL_SOCK}/api/purchase/inbox`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (res.ok) {
          const data = await res.json() as { unread: number }
          setInboxUnread(data.unread)
        }
      } catch { /* silent */ }
    })()

    const socket = io(API_URL_SOCK, {
      transports: ["websocket"],
      auth: { token: getAccessToken() },
    })
    socket.on("connect", () => socket.emit("join_user", user.id))
    socket.on("new_notification", () => setInboxUnread((n) => n + 1))
    return () => { socket.disconnect() }
  }, [user, getAccessToken])

  useEffect(() => {
    if (location.hash === "#listings") setActiveSection("listings")
    else if (location.hash === "#browse") setActiveSection("browse")
  }, [location.hash])

  const handleLogout = () => { void logout(); navigate("/", { replace: true }) }

  const openUpload = (type?: "ONLINE" | "OFFLINE") => {
    if (!isAuthenticated) { setLoginPrompt({ open: true, action: "sell" }); return }
    setUploadType(type)
    setUploadOpen(true)
  }

  // Sidebar active style helpers
  const navActive = { background: "rgba(255,107,26,0.12)", color: T.primary }
  const navInactive = { color: T.muted }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: T.bg }}>
      {/* ── Sidebar ── */}
      <aside className="w-64 flex-shrink-0 flex flex-col backdrop-blur"
        style={{ borderRight: `var(--border-width) solid ${T.border}`, backgroundColor: isDark ? "rgba(3,3,3,0.92)" : "rgba(210,200,186,0.95)" }}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: `var(--border-width) solid ${T.border}` }}>
          <BechoLogo size={36} showWordmark={true} />
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <button key={item.id} onClick={() => setActiveSection(item.id)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"
              style={activeSection === item.id ? navActive : navInactive}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
              {item.id === "messages" && (
                <span className="ml-auto text-[10px] font-bold rounded-full px-1.5 py-0.5"
                  style={{ background: "rgba(255,107,26,0.15)", color: T.primary }}>2</span>
              )}
            </button>
          ))}

          {/* Inbox link */}
          <button
            id="dashboard-inbox-btn"
            onClick={() => navigate("/inbox")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"
            style={navInactive}
          >
            <Inbox className="h-4 w-4 flex-shrink-0" />
            Inbox
            {inboxUnread > 0 && (
              <span className="ml-auto text-[10px] font-bold rounded-full px-1.5 py-0.5"
                style={{ background: "rgba(255,107,26,0.85)", color: "#fff" }}>
                {inboxUnread > 9 ? "9+" : inboxUnread}
              </span>
            )}
          </button>

          {/* Quick upload */}
          <div className="pt-3 mt-2" style={{ borderTop: `var(--border-width) solid ${T.border}` }}>
            <p className="text-xs font-semibold px-4 pb-2 uppercase tracking-wider" style={{ color: T.subtle }}>
              Quick Upload
            </p>
            <button onClick={() => openUpload("OFFLINE")}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all"
              style={{ color: T.muted }}>
              <Package className="h-4 w-4 flex-shrink-0" /> Hardware Item
            </button>
            <button onClick={() => openUpload("ONLINE")}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all"
              style={{ color: T.muted }}>
              <FileText className="h-4 w-4 flex-shrink-0" /> Online Resource
            </button>
          </div>
        </nav>

        {/* User footer */}
        <div className="p-3" style={{ borderTop: `var(--border-width) solid ${T.border}` }}>
          {isAuthenticated && user ? (
            <>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1"
                style={{ backgroundColor: T.surface2 }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(255,107,26,0.20)" }}>
                  <span className="text-sm font-bold" style={{ color: T.primary }}>
                    {user?.name?.[0]?.toUpperCase() ?? "?"}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate" style={{ color: T.text }}>{user?.name ?? "—"}</p>
                  <p className="text-xs truncate" style={{ color: T.subtle }}>{user?.email ?? ""}</p>
                </div>
              </div>
              <button onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-400/5 transition-all">
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </>
          ) : (
            <button onClick={() => navigate("/login")}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ color: T.primary, border: "var(--border-width) solid rgba(255,107,26,0.20)", background: "rgba(255,107,26,0.05)" }}>
              <User className="h-4 w-4" /> Log In / Register
            </button>
          )}
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-5 flex-shrink-0 backdrop-blur"
          style={{ borderBottom: `var(--border-width) solid ${T.border}`, backgroundColor: isDark ? "rgba(3,3,3,0.88)" : "rgba(210,200,186,0.95)" }}>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: T.text }}>
              {NAV_ITEMS.find((n) => n.id === activeSection)?.label ?? "Dashboard"}
            </h1>
            <p className="text-sm mt-1" style={{ color: T.muted }}>
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className="h-10 w-10 rounded-xl flex items-center justify-center transition-all"
              style={{ background: T.surface2, border: `var(--border-width) solid ${T.border}`, color: T.muted }}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button className="h-10 w-10 rounded-xl flex items-center justify-center transition-all"
              style={{ background: T.surface2, border: `var(--border-width) solid ${T.border}`, color: T.muted }}>
              <Bell className="h-4 w-4" />
            </button>
            <Button size="sm" onClick={() => openUpload()}>
              <Plus className="h-4 w-4 mr-1.5" /> SELL
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto" style={{ backgroundColor: T.bg }}>
          <AnimatePresence mode="wait">
            {activeSection === "overview" && (
              <OverviewSection key="overview" user={user} isAuthenticated={isAuthenticated} stats={stats} myListings={myListings} loadingListings={loadingListings} onUpload={openUpload} onViewListings={() => setActiveSection("listings")} onViewMarketplace={() => setActiveSection("browse")} onViewDetail={(id) => navigate(`/listings/${id}`)} />
            )}
            {activeSection === "listings" && (
              <ListingsSection key="listings" listings={myListings} loading={loadingListings} isAuthenticated={isAuthenticated} onUpload={openUpload} onViewDetail={(id) => navigate(`/listings/${id}`)} onLoginPrompt={() => setLoginPrompt({ open: true, action: "sell" })} />
            )}
            {activeSection === "browse" && (
              <MarketplaceSection key="browse" isAuthenticated={isAuthenticated} onLoginPrompt={(action) => setLoginPrompt({ open: true, action })} wishlist={globalWishlist} onToggleWishlist={toggleGlobalWishlist} onBuyItem={(item) => setPurchaseItem(item)} />
            )}
            {activeSection === "messages" && (
              <MessagesSection key="messages" isAuthenticated={isAuthenticated} onLogin={() => navigate("/login")} />
            )}
            {activeSection === "wishlist" && (
              <WishlistSection key="wishlist" wishlist={globalWishlist} onToggleWishlist={toggleGlobalWishlist} isAuthenticated={isAuthenticated} onLoginPrompt={(action) => setLoginPrompt({ open: true, action })} />
            )}
          </AnimatePresence>
        </div>
      </main>

      <UploadModal isOpen={uploadOpen} onClose={() => setUploadOpen(false)} defaultType={uploadType} onSuccess={() => { void fetchMyListings() }} />
      <LoginPromptModal open={loginPrompt.open} onClose={() => setLoginPrompt({ open: false, action: "buy" })} action={loginPrompt.action} />
      <PurchaseModal
        item={purchaseItem}
        open={purchaseItem !== null}
        onClose={() => setPurchaseItem(null)}
        isAuthenticated={isAuthenticated}
        onLoginPrompt={(action) => setLoginPrompt({ open: true, action })}
      />
    </div>
  )
}

// ── Overview ──────────────────────────────────────────────────────────────────
function OverviewSection({ user, isAuthenticated, stats, myListings, loadingListings, onUpload, onViewListings, onViewMarketplace, onViewDetail }: {
  user: { name: string; email: string; role: string } | null
  isAuthenticated: boolean
  stats: { active: number; earned: number; reputation: number }
  myListings: Listing[]
  loadingListings: boolean
  onUpload: (type?: "ONLINE" | "OFFLINE") => void
  onViewListings: () => void
  onViewMarketplace: () => void
  onViewDetail: (id: string) => void
}) {
  const recentListings = myListings.slice(0, 5)
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.22 }} className="p-8 space-y-8 max-w-5xl">
      <div>
        <h2 className="text-2xl font-bold" style={{ color: T.text }}>
          {isAuthenticated ? `Welcome back, ${user?.name?.split(" ")[0] ?? "there"} 👋` : "Welcome to Becho 👋"}
        </h2>
        <p className="text-base mt-1" style={{ color: T.primary, fontWeight: 600, fontStyle: "italic" }}>
          We sell what you want
        </p>
        <p className="text-sm mt-1" style={{ color: T.muted }}>
          {isAuthenticated ? "Here's what's happening with your account." : "Browse 25+ academic listings or log in to buy, sell, and more."}
        </p>
      </div>

      {!isAuthenticated ? (
        <div className="relative rounded-2xl p-8 overflow-hidden"
          style={{ border: "var(--border-width) solid rgba(255,107,26,0.20)", background: "rgba(255,107,26,0.04)" }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at top left, rgba(255,107,26,0.08) 0%, transparent 60%)" }} />
          <div className="flex items-center justify-between flex-wrap gap-6">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: T.primary }}>Join the community</p>
              <h3 className="text-xl font-bold mb-1" style={{ color: T.text }}>Start trading smarter</h3>
              <p className="text-sm max-w-md" style={{ color: T.muted }}>Log in to buy items, list your own, message sellers, and access the full marketplace.</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => { window.location.href = "/login" }} className="text-sm font-mono uppercase tracking-widest">Log In <ArrowRight className="ml-2 h-4 w-4" /></Button>
              <Button variant="outline" onClick={() => { window.location.href = "/login?tab=register" }} className="text-sm font-mono uppercase tracking-widest">Sign Up</Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Active Listings", value: stats.active, icon: Package, colorStyle: { color: T.primary }, bgStyle: { background: T.primaryDim } },
            { label: "Total Earned", value: `₹${stats.earned.toLocaleString("en-IN")}`, icon: TrendingUp, colorStyle: { color: T.text }, bgStyle: { background: T.surface2 } },
            { label: "Reputation", value: stats.reputation > 0 ? `${stats.reputation}/5` : "—", icon: Star, colorStyle: { color: "#f59e0b" }, bgStyle: { background: "rgba(245,158,11,0.12)" } },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl p-5 flex items-center gap-4"
              style={{ border: `var(--border-width) solid ${T.border}`, background: T.surface }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={s.bgStyle}>
                <s.icon className="h-5 w-5" style={s.colorStyle} />
              </div>
              <div>
                <p className="text-sm" style={{ color: T.muted }}>{s.label}</p>
                <p className="text-2xl font-bold mt-0.5" style={{ color: T.text }}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: T.subtle }}>Quick Actions</p>
        <div className="grid grid-cols-2 gap-3">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => onUpload("OFFLINE")}
            className="flex items-center gap-3 p-5 rounded-xl transition-all text-left group"
            style={{ border: "var(--border-width) solid rgba(245,158,11,0.25)", background: "rgba(245,158,11,0.04)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(245,158,11,0.15)" }}>
              <Package className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: T.text }}>Upload Hardware</p>
              <p className="text-xs mt-0.5" style={{ color: T.muted }}>Books, cycles, equipment…</p>
            </div>
            <ArrowUpRight className="h-4 w-4 ml-auto" style={{ color: T.subtle }} />
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => onUpload("ONLINE")}
            className="flex items-center gap-3 p-5 rounded-xl transition-all text-left group"
            style={{ border: "var(--border-width) solid rgba(255,107,26,0.25)", background: "rgba(255,107,26,0.04)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,107,26,0.15)" }}>
              <Upload className="h-5 w-5" style={{ color: T.primary }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: T.text }}>Upload Online Resource</p>
              <p className="text-xs mt-0.5" style={{ color: T.muted }}>Notes, PDFs, software…</p>
            </div>
            <ArrowUpRight className="h-4 w-4 ml-auto" style={{ color: T.subtle }} />
          </motion.button>
        </div>
      </div>

      {/* Featured in marketplace */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: T.subtle }}>Featured in Marketplace</p>
          <button onClick={onViewMarketplace} className="text-xs flex items-center gap-1" style={{ color: T.primary }}>
            View all <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MOCK_LISTINGS.slice(0, 4).map((item) => (
            <div key={item.id} onClick={onViewMarketplace}
              className="flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer group"
              style={{ border: `var(--border-width) solid ${T.border}`, background: T.surface }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: T.surface2 }}>
                {item.type === "ONLINE" ? <FileText className="h-4 w-4" style={{ color: T.primary }} /> : <Package className="h-4 w-4 text-amber-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold line-clamp-1" style={{ color: T.text }}>{item.title}</p>
                <p className="text-xs" style={{ color: T.muted }}>{item.seller.name}</p>
              </div>
              <span className="text-sm font-bold flex-shrink-0">
                {item.isFree ? <span style={{ color: T.primary }}>Free</span> : <span style={{ color: T.text }}>₹{item.price}</span>}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent listings */}
      {isAuthenticated && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: T.subtle }}>Recent Listings</p>
            <button onClick={onViewListings} className="text-xs flex items-center gap-1" style={{ color: T.primary }}>
              View all <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          {loadingListings ? (
            <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin" style={{ color: T.muted }} /></div>
          ) : recentListings.length === 0 ? (
            <EmptyListings onUpload={onUpload} />
          ) : (
            <div className="rounded-xl overflow-hidden" style={{ border: `var(--border-width) solid ${T.border}` }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: `var(--border-width) solid ${T.border}`, background: T.surface }}>
                    {["Title", "Type", "Price", "Status", ""].map((h, i) => (
                      <th key={i} className={`text-left px-4 py-3 text-xs font-semibold ${i === 4 ? "w-8" : ""}`} style={{ color: T.muted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentListings.map((l, idx) => {
                    const ls = l as unknown as { status: string }
                    return (
                      <tr key={l.id} onClick={() => onViewDetail(l.id)}
                        className="cursor-pointer transition-colors group"
                        style={{ borderBottom: idx < recentListings.length - 1 ? `var(--border-width) solid ${T.border}` : "none" }}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: T.surface2 }}>
                              {l.images?.[0] ? <img src={l.images[0]} alt="" className="w-full h-full object-cover" /> : l.type === "ONLINE" ? <FileText className="h-3.5 w-3.5" style={{ color: T.muted }} /> : <Package className="h-3.5 w-3.5" style={{ color: T.muted }} />}
                            </div>
                            <span className="text-sm font-medium line-clamp-1" style={{ color: T.text }}>{l.title}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={l.type === "ONLINE" ? { background: T.primaryDim, color: T.primary } : { background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>
                            {l.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm" style={{ color: T.muted }}>
                          {l.isFree ? <span style={{ color: T.primary, fontWeight: 600 }}>Free</span> : `₹${l.price}`}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={ls.status === "ACTIVE" ? { background: "rgba(251,146,60,0.12)", color: "#fb923c" } : ls.status === "SOLD" ? { background: T.surface2, color: T.muted } : { background: T.surface2, color: T.subtle }}>
                            {ls.status}
                          </span>
                        </td>
                        <td className="px-4 py-3"><Eye className="h-3.5 w-3.5" style={{ color: T.subtle }} /></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}

// ── Marketplace Section (REAL API) ────────────────────────────────────────────
const CATEGORIES_BROWSE = ["All", "Notes", "Books", "Hardware", "Cycles", "Equipment", "Software", "Tutorials", "Lab Tools", "Furniture", "Mock Tests", "Projects"]

interface ApiListing {
  id: string
  title: string
  description: string
  price: number
  isFree: boolean
  type: string
  category: string
  condition?: string
  images: string[]
  status: string
  seller: { id: string; name: string; reputation: number }
  createdAt: string
}

function MarketplaceSection({ onLoginPrompt: _onLoginPrompt, wishlist, onToggleWishlist }: {
  isAuthenticated: boolean
  onLoginPrompt: (action: "buy" | "sell") => void
  wishlist: Set<string>
  onToggleWishlist: (id: string) => void
  onBuyItem: (item: PurchaseItem) => void
}) {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [liveSearch, setLiveSearch] = useState("")
  const [category, setCategory] = useState("All")
  const [listings, setListings] = useState<ApiListing[]>([])
  const [loading, setLoading] = useState(true)
  const debounce = useRef<any>(null)

  // Debounce search input
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(() => setSearch(liveSearch), 380)
    return () => { if (debounce.current) clearTimeout(debounce.current) }
  }, [liveSearch])

  // Fetch from real API
  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search.trim()) params.set("q", search.trim())
    if (category && category !== "All") params.set("category", category)
    params.set("limit", "40")

    void fetch(`${API_URL}/api/listings?${params.toString()}`)
      .then((r) => r.ok ? r.json() as Promise<{ listings: ApiListing[] }> : Promise.resolve({ listings: [] }))
      .then((data) => setListings(data.listings))
      .catch(() => setListings([]))
      .finally(() => setLoading(false))
  }, [search, category])

  const hasSearch = liveSearch.trim().length > 0

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="p-8 max-w-6xl space-y-5" style={{ position: "relative" }}>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: T.subtle }} />
        <input
          id="marketplace-search"
          className="w-full rounded-2xl pl-12 pr-6 py-4 text-base font-medium focus:outline-none transition-all"
          style={{
            background: T.surface,
            border: `1.5px solid ${hasSearch ? "var(--primary)" : T.border}`,
            color: T.text,
            boxShadow: hasSearch ? "0 0 0 3px rgba(255,107,26,0.12)" : "0 2px 16px rgba(0,0,0,0.10)",
          }}
          placeholder="Search listings — notes, keyboard, cycle, books…"
          value={liveSearch}
          onChange={(e) => setLiveSearch(e.target.value)}
        />
        {liveSearch && (
          <button
            onClick={() => { setLiveSearch(""); setSearch("") }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: T.surface2 }}>
            <X className="h-3.5 w-3.5" style={{ color: T.muted }} />
          </button>
        )}
      </div>

      {/* Category filter pills */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES_BROWSE.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
            style={
              category === cat
                ? { background: "var(--primary)", color: "#fff" }
                : { background: T.surface2, color: T.muted, border: `var(--border-width) solid ${T.border}` }
            }
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Results */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin mb-3" style={{ color: T.subtle }} />
            <p className="text-sm" style={{ color: T.subtle }}>Loading listings…</p>
          </motion.div>
        ) : listings.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: T.surface, border: `var(--border-width) solid ${T.border}` }}>
              <Search className="h-7 w-7" style={{ color: T.subtle }} />
            </div>
            <p className="text-lg font-bold" style={{ color: T.muted }}>No listings found</p>
            <p className="text-sm mt-2" style={{ color: T.subtle }}>
              {search ? `No results for "${search}" — try different keywords.` : "No listings available right now."}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key={search + category}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
          >
            {listings.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03, duration: 0.22 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group rounded-2xl overflow-hidden cursor-pointer relative"
                style={{ border: `var(--border-width) solid ${T.border}`, background: T.surface }}
                onClick={() => navigate(`/listings/${item.id}`)}
              >
                {/* Photo or placeholder */}
                <div className="relative overflow-hidden" style={{ height: "160px" }}>
                  {item.images[0] ? (
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: T.surface2 }}>
                      <Package className="h-10 w-10" style={{ color: T.subtle }} />
                    </div>
                  )}
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 50%)" }} />

                  {/* Wishlist button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleWishlist(item.id) }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all"
                    style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}>
                    <Heart className="h-3.5 w-3.5" fill={wishlist.has(item.id) ? "#FF6B1A" : "none"} style={{ color: wishlist.has(item.id) ? "#FF6B1A" : "rgba(255,255,255,0.80)" }} />
                  </button>

                  {/* Category badge */}
                  <div className="absolute top-2 left-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(255,107,26,0.85)", color: "#fff", backdropFilter: "blur(4px)" }}>
                      {item.category}
                    </span>
                  </div>

                  {/* Hover CTA */}
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-center pb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: "rgba(255,107,26,0.85)", color: "#fff", backdropFilter: "blur(4px)" }}>
                      View Listing
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="text-xl font-black leading-none" style={{ color: item.isFree ? "var(--primary)" : T.text }}>
                    {item.isFree ? "Free" : `₹${item.price.toLocaleString("en-IN")}`}
                  </p>
                  <p className="text-xs font-semibold mt-1.5 line-clamp-2 leading-snug" style={{ color: T.muted }}>
                    {item.title}
                  </p>
                  <p className="text-[10px] mt-1" style={{ color: T.subtle }}>by {item.seller.name}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}


// ── Wishlist Section ─────────────────────────────────────────────────────────

const CARD_IMAGES: Record<string, string> = {
  Notes: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=400&q=80",
  Books: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&q=80",
  Hardware: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80",
  Cycles: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400&q=80",
  Equipment: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&q=80",
  Software: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&q=80",
  "Lab Tools": "https://images.unsplash.com/photo-1581092328149-c2b1897c5553?w=400&q=80"
}

function WishlistSection({ wishlist, onToggleWishlist, }: {
  wishlist: Set<string>
  onToggleWishlist: (id: string) => void
  isAuthenticated: boolean
  onLoginPrompt: (action: "buy" | "sell") => void
}) {
  const allItems = [...MOCK_LISTINGS] as unknown as Array<{
    id: string; title: string; category: string; type: string; price: number; isFree: boolean
    description?: string; seller?: { name: string }
  }>
  const wishlisted = allItems.filter((item) => wishlist.has(item.id))


  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="p-8 max-w-6xl space-y-6">
      <div className="flex items-baseline gap-3">
        <h2 className="text-3xl font-black" style={{ color: T.text }}>Wishlist</h2>
        <span className="text-sm font-semibold px-2 py-0.5 rounded-full" style={{ background: T.surface2, color: T.muted }}>{wishlisted.length} saved</span>
      </div>

      {wishlisted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center rounded-2xl"
          style={{ border: `1px dashed ${T.border}` }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: T.surface2 }}>
            <Heart className="h-7 w-7" style={{ color: T.subtle }} />
          </div>
          <p className="text-lg font-bold" style={{ color: T.muted }}>Your wishlist is empty</p>
          <p className="text-sm mt-1" style={{ color: T.subtle }}>Tap the ♥ on any listing to save it here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {wishlisted.map((item, idx) => {
            const imgSrc = CARD_IMAGES[item.category] ?? "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&q=80"
            return (
              <motion.div key={item.id}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group rounded-2xl overflow-hidden relative cursor-pointer"
                style={{ border: `var(--border-width) solid ${T.border}`, background: T.surface }}>
                <div className="relative overflow-hidden" style={{ height: "160px" }}>
                  <img src={imgSrc} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 50%)" }} />
                  {/* Always-visible filled heart */}
                  <button
                    onClick={() => onToggleWishlist(item.id)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(255,107,26,0.20)", border: "var(--border-width) solid rgba(255,107,26,0.40)" }}
                    title="Remove from Wishlist">
                    <Heart className="h-3.5 w-3.5" fill="#FF6B1A" style={{ color: "#FF6B1A" }} />
                  </button>
                </div>
                <div className="p-3">
                  <p className="text-xl font-black leading-none" style={{ color: item.isFree ? T.primary : T.text }}>
                    {item.isFree ? "Free" : `₹${Number(item.price).toLocaleString("en-IN")}`}
                  </p>
                  <p className="text-xs font-semibold mt-1.5 line-clamp-2 leading-snug" style={{ color: T.muted }}>{item.title}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}

// ── Listings Section ──────────────────────────────────────────────────────────
function ListingsSection({ listings, loading, isAuthenticated, onUpload, onViewDetail, onLoginPrompt }: {
  listings: Listing[]
  loading: boolean
  isAuthenticated: boolean
  onUpload: (type?: "ONLINE" | "OFFLINE") => void
  onViewDetail: (id: string) => void
  onLoginPrompt: () => void
}) {
  const [search, setSearch] = useState("")
  const filtered = listings.filter((l) => l.title.toLowerCase().includes(search.toLowerCase()) || l.category.toLowerCase().includes(search.toLowerCase()))

  if (!isAuthenticated) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="p-8 max-w-5xl">
        <h2 className="text-2xl font-bold mb-6" style={{ color: T.text }}>My Listings</h2>
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl"
          style={{ border: `1px dashed ${T.border}` }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: T.surface2, border: `var(--border-width) solid ${T.border}` }}>
            <Lock className="h-6 w-6" style={{ color: T.subtle }} />
          </div>
          <p className="text-base font-semibold" style={{ color: T.muted }}>Login to manage your listings</p>
          <p className="text-sm mt-1.5 mb-5" style={{ color: T.subtle }}>Create an account to start selling your academic resources.</p>
          <Button size="sm" onClick={onLoginPrompt}><User className="h-4 w-4 mr-1.5" /> Log In / Register</Button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="p-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: T.text }}>My Listings</h2>
          <p className="text-sm mt-0.5" style={{ color: T.muted }}>{listings.length} listing{listings.length !== 1 ? "s" : ""} total</p>
        </div>
        <Button size="sm" onClick={() => onUpload()}><Plus className="h-4 w-4 mr-1.5" /> SELL</Button>
      </div>
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: T.subtle }} />
        <input
          className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none transition-all"
          style={{ background: T.surface, border: `var(--border-width) solid ${T.border}`, color: T.text }}
          placeholder="Search your listings…" value={search} onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" style={{ color: T.muted }} /></div>
      ) : filtered.length === 0 ? (
        <EmptyListings onUpload={onUpload} />
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: `var(--border-width) solid ${T.border}` }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `var(--border-width) solid ${T.border}`, background: T.surface }}>
                {["Title", "Type", "Category", "Price", "Status", ""].map((h, i) => (
                  <th key={i} className={`text-left px-5 py-4 text-sm font-semibold ${i === 5 ? "w-10" : ""}`} style={{ color: T.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((l, idx) => {
                const ls = l as unknown as { status: string }
                return (
                  <tr key={l.id} onClick={() => onViewDetail(l.id)}
                    className="cursor-pointer transition-colors group"
                    style={{ borderBottom: idx < filtered.length - 1 ? `var(--border-width) solid ${T.border}` : "none" }}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
                          style={{ background: T.surface2 }}>
                          {l.images?.[0] ? <img src={l.images[0]} alt="" className="w-full h-full object-cover" /> : l.type === "ONLINE" ? <FileText className="h-4 w-4" style={{ color: T.muted }} /> : <Package className="h-4 w-4" style={{ color: T.muted }} />}
                        </div>
                        <div>
                          <p className="text-sm font-medium line-clamp-1" style={{ color: T.text }}>{l.title}</p>
                          {l.subject && <p className="text-xs" style={{ color: T.subtle }}>{l.subject}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={l.type === "ONLINE" ? { background: T.primaryDim, color: T.primary } : { background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>
                        {l.type}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm" style={{ color: T.muted }}>{l.category}</td>
                    <td className="px-4 py-4 text-sm font-semibold">
                      {l.isFree ? <span style={{ color: T.primary }}>Free</span> : <span style={{ color: T.text }}>₹{l.price}</span>}
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={ls.status === "ACTIVE" ? { background: "rgba(251,146,60,0.12)", color: "#fb923c" } : ls.status === "SOLD" ? { background: T.surface2, color: T.muted } : { background: T.surface2, color: T.subtle }}>
                        {ls.status}
                      </span>
                    </td>
                    <td className="px-4 py-4"><MoreHorizontal className="h-4 w-4" style={{ color: T.subtle }} /></td>
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

// ── Messages ──────────────────────────────────────────────────────────────────
function MessagesSection({ isAuthenticated, onLogin }: { isAuthenticated: boolean; onLogin: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="p-8 max-w-5xl">
      <h2 className="text-2xl font-bold mb-6" style={{ color: T.text }}>Messages</h2>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: T.surface2, border: `var(--border-width) solid ${T.border}` }}>
          {isAuthenticated ? <MessageSquare className="h-6 w-6" style={{ color: T.subtle }} /> : <Lock className="h-6 w-6" style={{ color: T.subtle }} />}
        </div>
        <p className="text-base font-semibold" style={{ color: T.muted }}>{isAuthenticated ? "No messages yet" : "Login to view messages"}</p>
        <p className="text-sm mt-1.5 mb-5" style={{ color: T.subtle }}>
          {isAuthenticated ? "When buyers contact you, messages will appear here." : "Log in to message sellers and manage your chats."}
        </p>
        {!isAuthenticated && <Button size="sm" onClick={onLogin}><User className="h-4 w-4 mr-1.5" /> Log In</Button>}
      </div>
    </motion.div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyListings({ onUpload }: { onUpload: (type?: "ONLINE" | "OFFLINE") => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl"
      style={{ border: `1px dashed ${T.border}` }}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
        style={{ background: T.surface2, border: `var(--border-width) solid ${T.border}` }}>
        <PackagePlus className="h-5 w-5" style={{ color: T.subtle }} />
      </div>
      <p className="text-base font-semibold" style={{ color: T.muted }}>No listings yet</p>
      <p className="text-sm mt-1 mb-4" style={{ color: T.subtle }}>Upload your first item to start selling.</p>
      <Button size="sm" onClick={() => onUpload()}><Plus className="h-4 w-4 mr-1.5" /> Create Listing</Button>
    </div>
  )
}
