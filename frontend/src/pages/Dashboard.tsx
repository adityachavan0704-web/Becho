import { useState, useEffect, useCallback } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard, Package, ShoppingBag, MessageSquare, LogOut,
  User, Plus, Upload, TrendingUp, Star, Eye, Bell,
  ChevronRight, Loader2, PackagePlus, FileText, Search,
  MoreHorizontal, ArrowUpRight, Zap, Lock, X, ShoppingCart, ArrowRight
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

const MOCK_LISTINGS = [
  { id:"m1",  title:"Data Structures & Algorithms – GATE Notes",        description:"Comprehensive handwritten notes covering arrays, trees, graphs, dynamic programming, and sorting algorithms. Perfect for GATE & placements.", price:149,   type:"ONLINE"  , category:"Notes",    subject:"DSA",                isFree:false, images:[], seller:{id:"s1",  name:"Rahul Sharma",   reputation:4.8}, createdAt:"2026-07-01T10:00:00Z"},
  { id:"m2",  title:"Arduino Uno R3 Starter Kit",                             description:"Complete Arduino starter kit with breadboard, LEDs, resistors, jumper wires, and 30+ components. Barely used, great for IoT projects.",          price:850,   type:"OFFLINE" , category:"Hardware",  subject:null,                 isFree:false, images:[], seller:{id:"s2",  name:"Priya Singh",    reputation:4.9}, createdAt:"2026-07-05T09:00:00Z"},
  { id:"m3",  title:"Engineering Mathematics – S.K. Mondal",             description:"Full solution set for SK Mondal Engineering Mathematics, topic-wise with shortcuts. Great for GATE 2026 prep.",                                  price:0,     type:"ONLINE"  , category:"Notes",    subject:"Engg. Maths",        isFree:true,  images:[], seller:{id:"s3",  name:"Aryan Mehta",    reputation:4.7}, createdAt:"2026-07-10T08:30:00Z"},
  { id:"m4",  title:"Raspberry Pi 4 Model B (4GB)",                           description:"Raspberry Pi 4 with 4GB RAM, case, power supply, and 32GB SD card preloaded with Raspberry Pi OS. Perfect for ML projects.",                    price:3800,  type:"OFFLINE" , category:"Hardware",  subject:null,                 isFree:false, images:[], seller:{id:"s4",  name:"Sneha Patel",    reputation:4.6}, createdAt:"2026-07-08T11:00:00Z"},
  { id:"m5",  title:"Computer Networks – Forouzan (5th Ed.)",            description:"Original textbook in excellent condition. All chapters intact, minimal highlighting. Covers OSI, TCP/IP, routing, and more.",                   price:320,   type:"OFFLINE" , category:"Books",     subject:"Computer Networks",  isFree:false, images:[], seller:{id:"s5",  name:"Vikram Nair",    reputation:4.5}, createdAt:"2026-07-12T14:00:00Z"},
  { id:"m6",  title:"Python for Data Science – Full Course Notes",       description:"350+ pages of curated Python notes covering NumPy, Pandas, Matplotlib, Scikit-learn and ML fundamentals.",                                       price:199,   type:"ONLINE"  , category:"Notes",    subject:"Data Science",       isFree:false, images:[], seller:{id:"s6",  name:"Kavya Reddy",    reputation:4.9}, createdAt:"2026-07-15T10:30:00Z"},
  { id:"m7",  title:"Hero Splendor Plus (Campus Use)",                        description:"Well-maintained Hero Splendor+ for campus commute. FC done, insurance valid, 52,000 km driven. Negotiable.",                                    price:28000, type:"OFFLINE" , category:"Cycles",    subject:null,                 isFree:false, images:[], seller:{id:"s7",  name:"Rohan Joshi",    reputation:4.4}, createdAt:"2026-07-11T09:00:00Z"},
  { id:"m8",  title:"Digital Electronics Lab Manual",                         description:"Complete lab manual with circuit diagrams, truth tables, and viva questions for 8 experiments. Sem 4 ECE.",                                       price:80,    type:"ONLINE"  , category:"Notes",    subject:"Digital Electronics",isFree:false, images:[], seller:{id:"s8",  name:"Anjali Kumar",   reputation:4.3}, createdAt:"2026-07-14T15:00:00Z"},
  { id:"m9",  title:"Operating Systems – Silberschatz (10th Ed.)",       description:"10th edition OS book. Clean, no torn pages. Covers processes, memory management, file systems, and deadlocks.",                                  price:450,   type:"OFFLINE" , category:"Books",     subject:"Operating Systems",  isFree:false, images:[], seller:{id:"s9",  name:"Dev Malhotra",   reputation:4.7}, createdAt:"2026-07-06T12:00:00Z"},
  { id:"m10", title:"HC Verma – Concepts of Physics (Vol 1 & 2)",        description:"Classic HCV set, both volumes in good condition. A few pencil marks, easily erasable. Essential for JEE prep.",                                 price:600,   type:"OFFLINE" , category:"Books",     subject:"Physics",            isFree:false, images:[], seller:{id:"s10", name:"Pooja Sharma",   reputation:4.6}, createdAt:"2026-07-09T10:00:00Z"},
  { id:"m11", title:"DBMS Complete Notes – SQL + Normalization",         description:"Covers ER diagrams, relational algebra, SQL queries, normalization up to BCNF, and transaction management.",                                     price:129,   type:"ONLINE"  , category:"Notes",    subject:"DBMS",               isFree:false, images:[], seller:{id:"s11", name:"Suresh Iyer",    reputation:4.8}, createdAt:"2026-07-13T11:30:00Z"},
  { id:"m12", title:"Soldering Iron + Kit (60W)",                             description:"Professional 60W soldering iron with solder wire, flux, PCB stand, and cleaning sponge. Works perfectly.",                                      price:350,   type:"OFFLINE" , category:"Equipment", subject:null,                 isFree:false, images:[], seller:{id:"s12", name:"Manish Tiwari",  reputation:4.5}, createdAt:"2026-07-16T13:00:00Z"},
  { id:"m13", title:"React + Node.js Full Stack Project Source Code",         description:"Complete e-commerce project with JWT auth, REST API, MongoDB. Well-documented codebase.",                                                        price:499,   type:"ONLINE"  , category:"Software",  subject:"Web Development",    isFree:false, images:[], seller:{id:"s13", name:"Nisha Agarwal",  reputation:4.9}, createdAt:"2026-07-17T09:00:00Z"},
  { id:"m14", title:"Vernier Caliper (150mm) – Mitutoyo",                description:"Genuine Mitutoyo Vernier caliper, accurate to 0.02mm. Used for 2 lab sessions only, basically new.",                                           price:750,   type:"OFFLINE" , category:"Lab Tools", subject:null,                 isFree:false, images:[], seller:{id:"s14", name:"Kiran Bhat",     reputation:4.6}, createdAt:"2026-07-03T10:00:00Z"},
  { id:"m15", title:"Machine Learning – Andrew Ng Notes + Assignments",  description:"Complete handwritten notes from Andrew Ng Coursera ML course + solved assignments in Python. 200+ pages.",                                      price:0,     type:"ONLINE"  , category:"Notes",    subject:"Machine Learning",   isFree:true,  images:[], seller:{id:"s15", name:"Tanveer Khan",   reputation:4.7}, createdAt:"2026-07-18T08:00:00Z"},
  { id:"m16", title:"DSP – Digital Signal Processing Textbook",          description:"Proakis and Manolakis DSP book, 4th edition. Good condition, some highlighting in chapter 1-3.",                                                price:280,   type:"OFFLINE" , category:"Books",     subject:"DSP",                isFree:false, images:[], seller:{id:"s16", name:"Deepa Menon",    reputation:4.4}, createdAt:"2026-07-07T14:00:00Z"},
  { id:"m17", title:"Scientific Calculator – Casio FX-991ES Plus",       description:"Casio FX-991ES Plus in perfect condition, all buttons working. Comes with original case.",                                                       price:400,   type:"OFFLINE" , category:"Equipment", subject:null,                 isFree:false, images:[], seller:{id:"s17", name:"Abhishek Roy",   reputation:4.5}, createdAt:"2026-07-10T16:00:00Z"},
  { id:"m18", title:"STM32 Blue Pill Microcontroller Board",                  description:"STM32F103C8T6 development board with USB cable. Perfect for embedded systems and ARM Cortex-M3 learning.",                                      price:220,   type:"OFFLINE" , category:"Hardware",  subject:null,                 isFree:false, images:[], seller:{id:"s18", name:"Pallavi Das",    reputation:4.8}, createdAt:"2026-07-20T10:00:00Z"},
  { id:"m19", title:"Compiler Design – Dragon Book Notes",               description:"Simplified notes from Aho, Lam, Sethi and Ullman. Covers lexing, parsing, semantic analysis, code generation and optimization.",               price:180,   type:"ONLINE"  , category:"Notes",    subject:"Compiler Design",    isFree:false, images:[], seller:{id:"s19", name:"Gautam Pillai",  reputation:4.6}, createdAt:"2026-07-19T11:00:00Z"},
  { id:"m20", title:"Breadboard + 120 Jumper Wires Set",                      description:"Full-size 830 tie-point solderless breadboard + 120 jumper wires M-M, M-F, F-F. Ideal for circuit prototyping.",                               price:180,   type:"OFFLINE" , category:"Hardware",  subject:null,                 isFree:false, images:[], seller:{id:"s20", name:"Aishwarya Rao",  reputation:4.7}, createdAt:"2026-07-21T09:00:00Z"},
  { id:"m21", title:"Theory of Computation – GATE 2026 Notes",           description:"Topic-wise notes covering FA, PDA, TM, decidability, and complexity. 150+ solved PYQs included.",                                             price:149,   type:"ONLINE"  , category:"Notes",    subject:"TOC",                isFree:false, images:[], seller:{id:"s21", name:"Harish Kumar",   reputation:4.9}, createdAt:"2026-07-22T08:00:00Z"},
  { id:"m22", title:"Atlas Scientific Cycle + Lock",                          description:"Atlas road cycle in decent condition with chain lock. Tires recently replaced. Good for campus commuting.",                                      price:3500,  type:"OFFLINE" , category:"Cycles",    subject:null,                 isFree:false, images:[], seller:{id:"s22", name:"Riya Gupta",     reputation:4.3}, createdAt:"2026-07-04T12:00:00Z"},
  { id:"m23", title:"Java – Complete Reference by Herbert Schildt",       description:"11th edition Java Complete Reference. No highlights, all pages intact. Great for OOP and Java SE prep.",                                       price:380,   type:"OFFLINE" , category:"Books",     subject:"Java",               isFree:false, images:[], seller:{id:"s23", name:"Saurabh Jain",   reputation:4.5}, createdAt:"2026-07-02T10:00:00Z"},
  { id:"m24", title:"PCB Design Files – Mini Project Collection",        description:"Kicad design files for 10 mini PCB projects including power supply, amplifier, and sensor boards. Open-source.",                               price:0,     type:"ONLINE"  , category:"Software",  subject:"Electronics",        isFree:true,  images:[], seller:{id:"s24", name:"Meera Pillai",   reputation:4.8}, createdAt:"2026-07-23T10:00:00Z"},
  { id:"m25", title:"Electromagnetic Field Theory – Hayt & Buck",        description:"8th edition EMF Theory book. Lightly used, excellent condition. Covers fields, waves, transmission lines.",                                     price:290,   type:"OFFLINE" , category:"Books",     subject:"EMF Theory",         isFree:false, images:[], seller:{id:"s25", name:"Ankit Verma",    reputation:4.6}, createdAt:"2026-07-24T09:00:00Z"},
] as const

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
            className="relative w-full max-w-sm bg-zinc-950 border border-white/10 rounded-3xl p-8 text-center overflow-hidden"
          >
            <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at top, rgba(232,97,28,0.12) 0%, transparent 60%)" }} />
            <button onClick={onClose} className="absolute top-4 right-4 text-zinc-600 hover:text-zinc-300 transition-colors">
              <X className="h-4 w-4" />
            </button>
            <div className="w-14 h-14 rounded-2xl bg-[#E8611C]/10 border border-[#E8611C]/20 flex items-center justify-center mx-auto mb-5">
              <Lock className="h-6 w-6 text-[#E8611C]" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              {action === "buy" ? "Login to Buy" : "Login to Sell"}
            </h3>
            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
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

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, getAccessToken, logout, isAuthenticated } = useAuth()

  const [activeSection, setActiveSection] = useState<ActiveSection>("browse")
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadType, setUploadType] = useState<"ONLINE" | "OFFLINE" | undefined>()
  const [myListings, setMyListings] = useState<Listing[]>([])
  const [loadingListings, setLoadingListings] = useState(false)
  const [stats, setStats] = useState({ active: 0, earned: 0, reputation: 0 })
  const [loginPrompt, setLoginPrompt] = useState<{ open: boolean; action: "buy" | "sell" }>({ open: false, action: "buy" })

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

  useEffect(() => {
    if (location.hash === "#listings") setActiveSection("listings")
    else if (location.hash === "#browse") setActiveSection("browse")
  }, [location.hash])

  const handleLogout = () => { logout(); navigate("/", { replace: true }) }

  const openUpload = (type?: "ONLINE" | "OFFLINE") => {
    if (!isAuthenticated) { setLoginPrompt({ open: true, action: "sell" }); return }
    setUploadType(type)
    setUploadOpen(true)
  }


  return (
    <div className="flex h-screen bg-[#080808] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 flex flex-col border-r border-white/[0.05] bg-zinc-950/80 backdrop-blur">
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/[0.05]">
          <div className="w-7 h-7 rounded-lg bg-[#E8611C] flex items-center justify-center">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-bold text-white tracking-tight">Becho</span>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <button key={item.id} onClick={() => setActiveSection(item.id)}
              className={cn("w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                activeSection === item.id ? "bg-[#E8611C]/10 text-[#E8611C]" : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]")}>
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
              {item.id === "messages" && <span className="ml-auto text-[10px] font-bold bg-[#E8611C]/15 text-[#E8611C] rounded-full px-1.5 py-0.5">2</span>}
            </button>
          ))}
          <div className="pt-3 border-t border-white/[0.04] mt-2 space-y-0.5">
            <p className="text-[10px] font-semibold text-zinc-600 px-3 pb-1 uppercase tracking-wider">Quick Upload</p>
            <button onClick={() => openUpload("OFFLINE")} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04] transition-all">
              <Package className="h-3.5 w-3.5 flex-shrink-0" /> Hardware Item
            </button>
            <button onClick={() => openUpload("ONLINE")} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04] transition-all">
              <FileText className="h-3.5 w-3.5 flex-shrink-0" /> Online Resource
            </button>
          </div>
        </nav>
        <div className="p-3 border-t border-white/[0.05]">
          {isAuthenticated && user ? (
            <>
              <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-zinc-900/60 mb-1">
                <div className="w-7 h-7 rounded-full bg-[#E8611C]/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-[#E8611C]">{user?.name?.[0]?.toUpperCase() ?? "?"}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white truncate">{user?.name ?? "—"}</p>
                  <p className="text-[10px] text-zinc-600 truncate">{user?.email ?? ""}</p>
                </div>
              </div>
              <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-zinc-600 hover:text-red-400 hover:bg-red-400/5 transition-all">
                <LogOut className="h-3.5 w-3.5" /> Sign Out
              </button>
            </>
          ) : (
            <button onClick={() => navigate("/login")} className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-[#E8611C] border border-[#E8611C]/20 bg-[#E8611C]/5 hover:bg-[#E8611C]/10 transition-all">
              <User className="h-3.5 w-3.5" /> Log In / Register
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-8 py-4 border-b border-white/[0.05] bg-zinc-950/60 backdrop-blur flex-shrink-0">
          <div>
            <h1 className="text-lg font-semibold text-white">{NAV_ITEMS.find((n) => n.id === activeSection)?.label ?? "Dashboard"}</h1>
            <p className="text-xs text-zinc-600 mt-0.5">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="h-9 w-9 rounded-xl border border-white/[0.06] bg-zinc-900/60 flex items-center justify-center hover:border-zinc-700 transition-all">
              <Bell className="h-4 w-4 text-zinc-500" />
            </button>
            <Button size="sm" onClick={() => openUpload()}><Plus className="h-4 w-4 mr-1.5" /> New Listing</Button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeSection === "overview" && (
              <OverviewSection key="overview" user={user} isAuthenticated={isAuthenticated} stats={stats} myListings={myListings} loadingListings={loadingListings} onUpload={openUpload} onViewListings={() => setActiveSection("listings")} onViewMarketplace={() => setActiveSection("browse")} onViewDetail={(id) => navigate(`/listings/${id}`)} />
            )}
            {activeSection === "listings" && (
              <ListingsSection key="listings" listings={myListings} loading={loadingListings} isAuthenticated={isAuthenticated} onUpload={openUpload} onViewDetail={(id) => navigate(`/listings/${id}`)} onLoginPrompt={() => setLoginPrompt({ open: true, action: "sell" })} />
            )}
            {activeSection === "browse" && (
              <MarketplaceSection key="browse" isAuthenticated={isAuthenticated} onLoginPrompt={(action) => setLoginPrompt({ open: true, action })} />
            )}
            {activeSection === "messages" && (
              <MessagesSection key="messages" isAuthenticated={isAuthenticated} onLogin={() => navigate("/login")} />
            )}
          </AnimatePresence>
        </div>
      </main>

      <UploadModal isOpen={uploadOpen} onClose={() => setUploadOpen(false)} defaultType={uploadType} onSuccess={() => { void fetchMyListings() }} />
      <LoginPromptModal open={loginPrompt.open} onClose={() => setLoginPrompt({ open: false, action: "buy" })} action={loginPrompt.action} />
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
        <h2 className="text-2xl font-bold text-white">
          {isAuthenticated ? `Welcome back, ${user?.name?.split(" ")[0] ?? "there"} 👋` : "Welcome to Becho 👋"}
        </h2>
        <p className="text-sm text-zinc-500 mt-1">
          {isAuthenticated ? "Here's what's happening with your account." : "Browse 25+ academic listings or log in to buy, sell, and more."}
        </p>
      </div>

      {!isAuthenticated ? (
        <div className="relative rounded-2xl border border-[#E8611C]/20 bg-[#E8611C]/[0.04] p-8 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at top left, rgba(232,97,28,0.08) 0%, transparent 60%)" }} />
          <div className="flex items-center justify-between flex-wrap gap-6">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-[#E8611C] mb-2">Join the community</p>
              <h3 className="text-xl font-bold text-white mb-1">Start trading smarter</h3>
              <p className="text-sm text-zinc-400 max-w-md">Log in to buy items, list your own, message sellers, and access the full marketplace.</p>
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
            { label: "Active Listings", value: stats.active, icon: Package, color: "text-[#E8611C]", bg: "bg-[#E8611C]/10" },
            { label: "Total Earned", value: `₹${stats.earned.toLocaleString("en-IN")}`, icon: TrendingUp, color: "text-white", bg: "bg-white/10" },
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
      )}

      <div>
        <p className="text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-3">Quick Actions</p>
        <div className="grid grid-cols-2 gap-3">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => onUpload("OFFLINE")}
            className="flex items-center gap-3 p-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.04] hover:bg-amber-500/[0.08] hover:border-amber-500/40 transition-all text-left group">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0"><Package className="h-4 w-4 text-amber-400" /></div>
            <div><p className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">Upload Hardware</p><p className="text-xs text-zinc-600">Books, cycles, equipment…</p></div>
            <ArrowUpRight className="h-4 w-4 text-zinc-700 ml-auto group-hover:text-amber-400 transition-colors" />
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => onUpload("ONLINE")}
            className="flex items-center gap-3 p-4 rounded-xl border border-[#E8611C]/20 bg-[#E8611C]/[0.04] hover:bg-[#E8611C]/[0.08] hover:border-[#E8611C]/40 transition-all text-left group">
            <div className="w-9 h-9 rounded-xl bg-[#E8611C]/15 flex items-center justify-center flex-shrink-0"><Upload className="h-4 w-4 text-[#E8611C]" /></div>
            <div><p className="text-sm font-semibold text-white group-hover:text-orange-300 transition-colors">Upload Online Resource</p><p className="text-xs text-zinc-600">Notes, PDFs, software…</p></div>
            <ArrowUpRight className="h-4 w-4 text-zinc-700 ml-auto group-hover:text-[#E8611C] transition-colors" />
          </motion.button>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">Featured in Marketplace</p>
          <button onClick={onViewMarketplace} className="text-xs text-[#E8611C] hover:underline flex items-center gap-1">View all <ChevronRight className="h-3 w-3" /></button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MOCK_LISTINGS.slice(0, 4).map((item) => (
            <div key={item.id} onClick={onViewMarketplace} className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.05] bg-zinc-900/30 hover:bg-zinc-900/60 transition-all cursor-pointer group">
              <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                {item.type === "ONLINE" ? <FileText className="h-4 w-4 text-[#E8611C]" /> : <Package className="h-4 w-4 text-amber-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-zinc-200 line-clamp-1 group-hover:text-white">{item.title}</p>
                <p className="text-[10px] text-zinc-600">{item.seller.name}</p>
              </div>
              <span className="text-xs font-bold flex-shrink-0">
                {item.isFree ? <span className="text-[#E8611C]">Free</span> : <span className="text-white">₹{item.price}</span>}
              </span>
            </div>
          ))}
        </div>
      </div>

      {isAuthenticated && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">Recent Listings</p>
            <button onClick={onViewListings} className="text-xs text-[#E8611C] hover:underline flex items-center gap-1">View all <ChevronRight className="h-3 w-3" /></button>
          </div>
          {loadingListings ? (
            <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 text-zinc-600 animate-spin" /></div>
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
                      <tr key={l.id} onClick={() => onViewDetail(l.id)} className={cn("cursor-pointer hover:bg-zinc-800/30 transition-colors group", idx < recentListings.length - 1 && "border-b border-white/[0.03]")}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {l.images?.[0] ? <img src={l.images[0]} alt="" className="w-full h-full object-cover" /> : l.type === "ONLINE" ? <FileText className="h-3.5 w-3.5 text-zinc-600" /> : <Package className="h-3.5 w-3.5 text-zinc-600" />}
                            </div>
                            <span className="text-xs font-medium text-zinc-300 group-hover:text-white transition-colors line-clamp-1">{l.title}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3"><span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", l.type === "ONLINE" ? "bg-[#E8611C]/15 text-[#E8611C]" : "bg-amber-500/15 text-amber-400")}>{l.type}</span></td>
                        <td className="px-4 py-3 text-xs text-zinc-400">{l.isFree ? <span className="text-[#E8611C] font-semibold">Free</span> : `₹${l.price}`}</td>
                        <td className="px-4 py-3"><span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", { "bg-orange-400/10 text-orange-400": ls.status === "ACTIVE", "bg-zinc-600/10 text-zinc-400": ls.status === "SOLD", "bg-zinc-800 text-zinc-500": ls.status === "HIDDEN" })}>{ls.status}</span></td>
                        <td className="px-4 py-3"><Eye className="h-3.5 w-3.5 text-zinc-700 group-hover:text-zinc-400 transition-colors" /></td>
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

// ── Marketplace Section ───────────────────────────────────────────────────────
const MARKETPLACE_CATS = ["All", "Notes", "Books", "Hardware", "Equipment", "Lab Tools", "Software", "Cycles"]

function MarketplaceSection({ isAuthenticated, onLoginPrompt }: {
  isAuthenticated: boolean
  onLoginPrompt: (action: "buy" | "sell") => void
}) {
  const [search, setSearch] = useState("")
  const [activeCat, setActiveCat] = useState("All")
  const [activeType, setActiveType] = useState<"" | "ONLINE" | "OFFLINE">("")

  const filtered = MOCK_LISTINGS.filter((item) => {
    const q = search.toLowerCase()
    const matchSearch = !q || item.title.toLowerCase().includes(q) || item.category.toLowerCase().includes(q) || (item.subject ?? "").toLowerCase().includes(q)
    const matchCat = activeCat === "All" || item.category === activeCat
    const matchType = !activeType || item.type === activeType
    return matchSearch && matchCat && matchType
  })

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="p-8 max-w-6xl space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Marketplace</h2>
          <p className="text-xs text-zinc-600 mt-0.5">{filtered.length} items available</p>
        </div>
        {!isAuthenticated && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#E8611C]/20 bg-[#E8611C]/5 text-xs text-[#E8611C] font-mono">
            <Lock className="h-3 w-3" /> Log in to buy or sell
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
          <input className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#E8611C]/50 transition-all" placeholder="Search items…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-1 bg-zinc-900/60 border border-zinc-800 rounded-xl p-1">
          {([["All", ""], ["Online", "ONLINE"], ["Hardware", "OFFLINE"]] as [string, "" | "ONLINE" | "OFFLINE"][]).map(([label, val]) => (
            <button key={val} onClick={() => setActiveType(val)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all", activeType === val ? "bg-[#E8611C] text-white" : "text-zinc-500 hover:text-zinc-200")}>{label}</button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {MARKETPLACE_CATS.map((cat) => (
            <button key={cat} onClick={() => setActiveCat(cat)} className={cn("px-3 py-1.5 rounded-full text-xs font-medium border transition-all", activeCat === cat ? "bg-zinc-100 text-zinc-900 border-transparent" : "border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300")}>{cat}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4"><Search className="h-6 w-6 text-zinc-600" /></div>
          <p className="text-sm font-semibold text-zinc-400">No items found</p>
          <p className="text-xs text-zinc-600 mt-1.5">Try a different search or category.</p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((item, idx) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03, duration: 0.2 }} whileHover={{ y: -4 }}
              className="group rounded-2xl border border-white/[0.06] bg-zinc-900/60 overflow-hidden hover:border-[#E8611C]/25 hover:shadow-[0_0_30px_rgba(232,97,28,0.07)] transition-all duration-300">
              <div className="relative h-36 bg-zinc-800/80 flex items-center justify-center overflow-hidden">
                {item.type === "ONLINE" ? <FileText className="h-10 w-10 text-zinc-600 group-hover:text-[#E8611C]/50 transition-colors" /> : <Package className="h-10 w-10 text-zinc-600 group-hover:text-amber-400/50 transition-colors" />}
                <div className="absolute top-2.5 left-2.5">
                  <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", item.type === "ONLINE" ? "bg-[#E8611C]/15 text-[#E8611C] border-[#E8611C]/20" : "bg-amber-500/15 text-amber-400 border-amber-500/20")}>{item.type === "ONLINE" ? "ONLINE" : "HARDWARE"}</span>
                </div>
                {item.isFree && <div className="absolute top-2.5 right-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8611C]/20 text-[#E8611C] border border-[#E8611C]/30">FREE</span></div>}
              </div>
              <div className="p-3.5">
                <h3 className="font-semibold text-xs text-white leading-snug line-clamp-2 mb-1 group-hover:text-[#E8611C] transition-colors">{item.title}</h3>
                <p className="text-[11px] text-zinc-500 line-clamp-2 mb-3">{item.description}</p>
                <div className="flex items-center gap-1.5 mb-3">
                  <div className="w-4 h-4 rounded-full bg-[#E8611C]/15 flex items-center justify-center flex-shrink-0"><span className="text-[8px] font-bold text-[#E8611C]">{item.seller.name[0]}</span></div>
                  <span className="text-[10px] text-zinc-500 truncate">{item.seller.name}</span>
                  <span className="ml-auto flex items-center gap-0.5 text-[10px] text-amber-400"><Star className="h-2.5 w-2.5 fill-amber-400" />{item.seller.reputation}</span>
                </div>
                <div className="flex items-center justify-between border-t border-white/[0.05] pt-2.5">
                  {item.isFree ? <p className="text-sm font-bold text-[#E8611C]">Free</p> : <p className="text-sm font-bold text-white">₹{item.price.toLocaleString("en-IN")}</p>}
                  <button onClick={() => onLoginPrompt("buy")} className={cn("flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg transition-all", isAuthenticated ? "bg-[#E8611C]/15 text-[#E8611C] hover:bg-[#E8611C]/25" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white")}>
                    {isAuthenticated ? <><ShoppingCart className="h-3 w-3" /> Buy</> : <><Lock className="h-3 w-3" /> Buy</>}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
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
        <h2 className="text-xl font-bold text-white mb-6">My Listings</h2>
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border border-dashed border-white/[0.06]">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4"><Lock className="h-6 w-6 text-zinc-600" /></div>
          <p className="text-sm font-semibold text-zinc-400">Login to manage your listings</p>
          <p className="text-xs text-zinc-600 mt-1.5 mb-5">Create an account to start selling your academic resources.</p>
          <Button size="sm" onClick={onLoginPrompt}><User className="h-4 w-4 mr-1.5" /> Log In / Register</Button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="p-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">My Listings</h2>
          <p className="text-xs text-zinc-600 mt-0.5">{listings.length} listing{listings.length !== 1 ? "s" : ""} total</p>
        </div>
        <Button size="sm" onClick={() => onUpload()}><Plus className="h-4 w-4 mr-1.5" /> New Listing</Button>
      </div>
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
        <input className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#E8611C]/50 transition-all" placeholder="Search your listings…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 text-zinc-600 animate-spin" /></div>
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
                  <tr key={l.id} onClick={() => onViewDetail(l.id)} className={cn("cursor-pointer hover:bg-zinc-800/20 transition-colors group", idx < filtered.length - 1 && "border-b border-white/[0.03]")}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {l.images?.[0] ? <img src={l.images[0]} alt="" className="w-full h-full object-cover" /> : l.type === "ONLINE" ? <FileText className="h-4 w-4 text-zinc-600" /> : <Package className="h-4 w-4 text-zinc-600" />}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-zinc-300 group-hover:text-white transition-colors line-clamp-1">{l.title}</p>
                          {l.subject && <p className="text-[10px] text-zinc-600">{l.subject}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5"><span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", l.type === "ONLINE" ? "bg-[#E8611C]/15 text-[#E8611C]" : "bg-amber-500/15 text-amber-400")}>{l.type}</span></td>
                    <td className="px-4 py-3.5 text-xs text-zinc-500">{l.category}</td>
                    <td className="px-4 py-3.5 text-xs font-semibold">{l.isFree ? <span className="text-[#E8611C]">Free</span> : <span className="text-white">₹{l.price}</span>}</td>
                    <td className="px-4 py-3.5"><span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", { "bg-orange-400/10 text-orange-400": ls.status === "ACTIVE", "bg-zinc-600/10 text-zinc-400": ls.status === "SOLD", "bg-zinc-800 text-zinc-500": ls.status === "HIDDEN" })}>{ls.status}</span></td>
                    <td className="px-4 py-3.5"><MoreHorizontal className="h-4 w-4 text-zinc-700 group-hover:text-zinc-400 transition-colors" /></td>
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
      <h2 className="text-xl font-bold text-white mb-6">Messages</h2>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
          {isAuthenticated ? <MessageSquare className="h-6 w-6 text-zinc-600" /> : <Lock className="h-6 w-6 text-zinc-600" />}
        </div>
        <p className="text-sm font-semibold text-zinc-400">{isAuthenticated ? "No messages yet" : "Login to view messages"}</p>
        <p className="text-xs text-zinc-600 mt-1.5 mb-5">{isAuthenticated ? "When buyers contact you, messages will appear here." : "Log in to message sellers and manage your chats."}</p>
        {!isAuthenticated && <Button size="sm" onClick={onLogin}><User className="h-4 w-4 mr-1.5" /> Log In</Button>}
      </div>
    </motion.div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyListings({ onUpload }: { onUpload: (type?: "ONLINE" | "OFFLINE") => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-white/[0.06]">
      <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3"><PackagePlus className="h-5 w-5 text-zinc-600" /></div>
      <p className="text-sm font-semibold text-zinc-400">No listings yet</p>
      <p className="text-xs text-zinc-600 mt-1 mb-4">Upload your first item to start selling.</p>
      <Button size="sm" onClick={() => onUpload()}><Plus className="h-4 w-4 mr-1.5" /> Create Listing</Button>
    </div>
  )
}
