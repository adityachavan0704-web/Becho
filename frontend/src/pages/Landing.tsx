import { useRef, useState } from "react"
import { motion, useAnimationFrame } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { Button } from "../components/ui/Button"
import BechoLogo from "../components/BechoLogo"
import { useTheme } from "../contexts/ThemeContext"
// import { CursorDrivenParticleTypography } from "../components/ui/cursor-driven-particle-typography"
import {
  ArrowRight,
  Star,
  Plus,
  Search,
} from "lucide-react"

// ─── 3D Carousel Data ────────────────────────────────────────────────────────
const carouselItems = [
  { img: "/arduino_kit.png", label: "Arduino Kit", tag: "Electronics", color: "#E8611C" },
  { img: "/sensors_collection.png", label: "IoT Sensors", tag: "Hardware", color: "#ff7b3a" },
  { img: "/textbooks_stack.png", label: "Engineering Books", tag: "Books", color: "#ffffff" },
  { img: "/video_course.png", label: "Video Courses", tag: "Digital", color: "#ffa06d" },
  { img: "/lab_equipment.png", label: "Lab Equipment", tag: "Instruments", color: "#E8611C" },
  { img: "/notes_pdf.png", label: "Study Notes", tag: "Notes", color: "#ffffff" },
  { img: "/raspberry_pi.png", label: "Raspberry Pi", tag: "Electronics", color: "#ff7b3a" },
  { img: "/mentorship.png", label: "Mentorship", tag: "Guidance", color: "#ffa06d" },
]

// ─── 3D Sphere Carousel ───────────────────────────────────────────────────────
function SphereCarousel() {
  const angleRef = useRef(0)
  const [cards, setCards] = useState<
    { x: number; y: number; z: number; rotY: number; scale: number; opacity: number; item: (typeof carouselItems)[0] }[]
  >([])
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const lastX = useRef(0)
  const velocityRef = useRef(0)

  const count = carouselItems.length
  const rx = 380
  const ry = 90

  const compute = (angle: number) =>
    carouselItems.map((item, i) => {
      const theta = (i / count) * Math.PI * 2 + angle
      const x = Math.sin(theta) * rx
      const z = Math.cos(theta) * rx
      const yBias = Math.sin(theta) * ry
      const scale = 0.6 + ((z + rx) / (2 * rx)) * 0.55
      const opacity = 0.3 + ((z + rx) / (2 * rx)) * 0.7
      return { x, y: yBias, z, rotY: -(theta * 180) / Math.PI + 90, scale, opacity, item }
    })

  useAnimationFrame(() => {
    if (!isDragging.current) {
      angleRef.current += 0.004
      velocityRef.current *= 0.95
    } else {
      angleRef.current += velocityRef.current * 0.01
    }
    setCards(compute(angleRef.current))
  })

  const handleMouseDown = (e: React.MouseEvent) => { isDragging.current = true; lastX.current = e.clientX }
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return
    const delta = e.clientX - lastX.current
    velocityRef.current = delta * 0.1
    angleRef.current += delta * 0.004
    lastX.current = e.clientX
  }
  const handleMouseUp = () => { isDragging.current = false }
  const handleTouchStart = (e: React.TouchEvent) => { isDragging.current = true; lastX.current = e.touches[0].clientX }
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return
    const delta = e.touches[0].clientX - lastX.current
    velocityRef.current = delta * 0.1
    angleRef.current += delta * 0.004
    lastX.current = e.touches[0].clientX
  }
  const handleTouchEnd = () => { isDragging.current = false }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[520px] flex items-center justify-center select-none cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
      style={{ perspective: "1200px" }}
    >
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(ellipse at center, rgba(232,97,28,0.08) 0%, transparent 70%)" }} />
      </div>
      {[...cards].sort((a, b) => a.z - b.z).map((card) => (
        <div
          key={card.item.label}
          className="absolute"
          style={{
            transform: `translateX(${card.x}px) translateY(${card.y}px) scale(${card.scale})`,
            opacity: card.opacity,
            zIndex: Math.round(card.z + rx),
            transition: "none",
            willChange: "transform, opacity",
          }}
        >
          <div
            className="relative w-[160px] h-[210px] rounded-2xl overflow-hidden shadow-2xl"
            style={{
              border: "var(--border-width) solid rgba(255,255,255,0.10)",
              boxShadow: card.z > 0
                ? `0 20px 60px rgba(0,0,0,0.5), 0 0 20px ${card.item.color}22`
                : "0 10px 30px rgba(0,0,0,0.35)",
            }}
          >
            <img src={card.item.img} alt={card.item.label} className="w-full h-full object-cover" draggable={false} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div
              className="absolute top-3 left-3 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-widest"
              style={{ background: card.item.color + "22", color: card.item.color, border: `1px solid ${card.item.color}44` }}
            >
              {card.item.tag}
            </div>
            <div className="absolute bottom-3 left-3 right-3">
              <p className="text-white text-xs font-semibold leading-tight">{card.item.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Marquee Strip ────────────────────────────────────────────────────────────
const marqueeItems = ["Arduino Kits", "Lab Manuals", "Study Notes", "IoT Sensors", "Video Courses", "Raspberry Pi", "Textbooks", "Mentorship", "Project Files", "Lab Equipment"]

function MarqueeStrip() {
  return (
    <div className="w-full overflow-hidden py-4" style={{ borderTop: "var(--border-width) solid var(--border)", borderBottom: "var(--border-width) solid var(--border)", backgroundColor: "var(--surface)" }}>
      <motion.div
        className="flex gap-12 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        {[...marqueeItems, ...marqueeItems].map((item, i) => (
          <span key={i} className="flex items-center gap-3 text-sm font-mono uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            <span style={{ color: "var(--primary)" }}>✦</span>
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  )
}


// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="text-center p-8 rounded-2xl backdrop-blur-sm"
      style={{ background: "var(--surface)", border: "var(--border-width) solid var(--border)" }}
    >
      <div className="text-4xl font-bold mb-2" style={{ color: "var(--primary)" }}>{value}</div>
      <div className="text-sm font-mono uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{label}</div>
    </motion.div>
  )
}

// ─── Main Landing Page ────────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate()
  const { isDark } = useTheme()
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = () => {
    const q = searchQuery.trim()
    if (q) navigate(`/browse?q=${encodeURIComponent(q)}`)
    else navigate("/browse")
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch()
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ backgroundColor: "var(--bg)" }}>
      {/* Global background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[20%] w-[60%] h-[60%] blur-[200px] rounded-full"
          style={{ background: isDark ? "rgba(232,97,28,0.05)" : "rgba(232,97,28,0.07)" }} />
        <div className="absolute bottom-[-20%] right-[10%] w-[50%] h-[50%] blur-[160px] rounded-full"
          style={{ background: isDark ? "rgba(180,60,0,0.04)" : "rgba(180,60,0,0.05)" }} />
      </div>

      {/* ── Navbar ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50"
        style={{ borderBottom: "var(--border-width) solid var(--border)", background: "var(--bg)" }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BechoLogo size={34} showWordmark={true} />
            <span className="hidden md:inline-block text-sm font-semibold italic ml-2" style={{ color: "var(--primary)" }}>
              " We sell what you want "
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Button className="text-sm font-medium h-9 px-6 rounded-xl shadow-lg flex items-center gap-2"
              style={{ border: "2px solid #000" }}
              onClick={() => navigate("/login")}>
              <Plus className="w-4 h-4" /> SELL
            </Button>
          </div>
          {/* Mobile */}
          <div className="flex md:hidden items-center gap-2">
            <Button className="text-xs h-8 px-4 rounded-xl shadow-md flex items-center gap-1.5"
              style={{ border: "2px solid #000" }}
              onClick={() => navigate("/login")}>
              <Plus className="w-3.5 h-3.5" /> SELL
            </Button>
          </div>
        </div>
      </nav>

      {/* ── Search Bar (Liquid Glass) ── */}
      <div className="fixed top-[84px] left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4 pointer-events-auto">
        <div
          className="flex items-center gap-3 px-6 py-3.5 rounded-full"
          style={{
            background: isDark ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.85)",
            backdropFilter: "blur(64px) saturate(200%)",
            WebkitBackdropFilter: "blur(64px) saturate(200%)",
            border: "2px solid #000",
            boxShadow: isDark
              ? "0 16px 40px rgba(0, 0, 0, 0.8), inset 0 2px 4px rgba(255,255,255,0.4)"
              : "0 16px 40px rgba(0, 0, 0, 0.2), inset 0 2px 6px rgba(255,255,255,1)"
          }}
        >
          <button
            onClick={handleSearch}
            className="flex-shrink-0 transition-opacity hover:opacity-70"
            title="Search"
          >
            <Search className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
          </button>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search for study notes, kits, projects..."
            className="w-full bg-transparent border-none outline-none text-sm font-medium placeholder-opacity-70"
            style={{ color: isDark ? "#111" : "var(--text)" }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="flex-shrink-0 text-xs opacity-50 hover:opacity-100 transition-opacity"
              title="Clear"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Hero ── */}
      <section className="relative pt-28 pb-0 flex flex-col items-center text-center px-6 z-10" style={{ minHeight: "100vh" }}>
        {/* Background Image - Only in Hero Section */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: "url('/becho-store-bg.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            opacity: 1,
            pointerEvents: "none"
          }}
        />


        {/* Stacked hero: heading → CTA */}
        <div className="flex flex-col items-center gap-8 w-full max-w-4xl relative z-10 justify-center" style={{ minHeight: "calc(100vh - 180px)" }}>

          {/* Main heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.7, type: "spring", stiffness: 60 }}
            className="text-5xl sm:text-6xl lg:text-[5.5rem] font-bold tracking-tight leading-[1.08]"
            style={{
              color: "#FFFFFF",
              textShadow: "0 0 20px rgba(255,107,26,0.8), 0 0 40px rgba(255,107,26,0.6), 0 0 60px rgba(255,107,26,0.4), 0 4px 12px rgba(0,0,0,0.5)",
              fontFamily: "Georgia, serif"
            }}
          >
            Student Market
          </motion.h1>

          {/* CTA button — below heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.6 }}
            className="mt-6"
          >
            <Button size="lg" className="h-13 px-10 text-sm font-mono uppercase tracking-widest shadow-2xl"
              style={{
                border: "2px solid #000",
                fontWeight: "bold",
                boxShadow: "0 8px 24px rgba(0,0,0,0.4)"
              }}
              onClick={() => navigate("/dashboard")}>
              Kharido <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>

        </div>

      </section>


      {/* ── 3D Sphere Carousel ── */}
      <section className="relative px-6 py-16 flex flex-col items-center justify-center z-10" style={{ minHeight: "100vh" }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-4"
        >
          <span className="text-xs font-mono uppercase tracking-widest mb-2 block" style={{ color: "var(--primary)" }}>What's on Becho</span>
          <h2 className="text-3xl md:text-4xl font-bold" style={{ color: "var(--text)" }}>Explore what students are trading</h2>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3, duration: 1 }} className="w-full">
          <SphereCarousel />
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.6, duration: 0.6 }}
          className="text-center text-xs font-mono uppercase tracking-widest -mt-4"
          style={{ color: "var(--text-subtle)" }}
        >
          ← drag to explore →
        </motion.p>
      </section>

      {/* ── Marquee ── */}
      <div className="relative z-10">
        <MarqueeStrip />
      </div>

      {/* ── Stats ── */}
      <section className="max-w-5xl mx-auto px-6 py-20 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatCard value="2.4K+" label="Students" />
          <StatCard value="8,900+" label="Items Listed" />
          <StatCard value="12+" label="Colleges" />
          <StatCard value="98%" label="Trust Score" />
        </div>
      </section>

      {/* ── Fresh Recommendations ── */}
      <section className="max-w-6xl mx-auto px-6 pb-24 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-xs font-mono uppercase tracking-widest mb-4 block" style={{ color: "var(--primary)" }}>
            Fresh Picks
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: "var(--text)" }}>
            Trending right now
          </h2>
          <p className="max-w-xl mx-auto" style={{ color: "var(--text-muted)" }}>
            Handpicked listings from verified students — grab them before they're gone.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: "Data Structures & Algorithms – GATE Notes", desc: "Comprehensive handwritten notes covering arrays, trees, graphs, dynamic programming, and sorting algorithms. Perfect for GATE & placements.", price: "₹149", category: "Notes", seller: "Rahul Sharma", rating: "4.8" },
            { title: "Arduino Uno R3 Starter Kit", desc: "Complete Arduino starter kit with breadboard, LEDs, resistors, jumper wires, and 30+ components. Barely used, great for IoT projects.", price: "₹850", category: "Hardware", seller: "Priya Singh", rating: "4.9" },
            { title: "Engineering Mathematics – S.K. Mondal", desc: "Full solution set for SK Mondal Engineering Mathematics, topic-wise with shortcuts. Great for GATE 2026 prep.", price: "Free", category: "Notes", seller: "Aryan Mehta", rating: "4.7" },
            { title: "Raspberry Pi 4 Model B (4GB RAM)", desc: "Complete Raspberry Pi 4 kit with case, power supply, and 32GB SD preloaded with Raspberry Pi OS. Ideal for ML & IoT projects.", price: "₹3,800", category: "Hardware", seller: "Sneha Patel", rating: "4.6" },
            { title: "GATE CS 2026 Mock Test Series", desc: "Full-length mock tests with detailed solutions covering all GATE CS topics. 25 tests included, previous year PYQ sets.", price: "₹249", category: "Mock Tests", seller: "Harish Kumar", rating: "4.9" },
            { title: "React + Node.js Full Stack Source Code", desc: "Complete e-commerce project with JWT auth, REST API, MongoDB. Well-documented, great for final-year project submissions.", price: "₹499", category: "Projects", seller: "Nisha Agarwal", rating: "4.8" },
          ].map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: idx * 0.12, duration: 0.6, type: "spring", stiffness: 60 }}
              whileHover={{ y: -4 }}
              className="group relative p-6 rounded-2xl backdrop-blur-sm transition-all duration-500 overflow-hidden cursor-pointer"
              style={{
                background: "var(--surface)",
                border: "var(--border-width) solid var(--border)",
              }}
              onClick={() => navigate("/dashboard#browse")}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: `radial-gradient(circle at top left, rgba(255,107,26,0.10), transparent 60%)` }}
              />
              {/* Category + Price Row */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-1 rounded-md"
                  style={{ background: "rgba(255,107,26,0.12)", color: "var(--primary)", border: "var(--border-width) solid rgba(255,107,26,0.25)" }}>
                  {item.category}
                </span>
                <span className="text-xl font-black" style={{ color: item.price === "Free" ? "var(--primary)" : "var(--text)" }}>
                  {item.price}
                </span>
              </div>
              {/* Title */}
              <h3 className="text-lg font-bold leading-snug mb-2" style={{ color: "var(--text)" }}>{item.title}</h3>
              {/* Description */}
              <p className="leading-relaxed text-sm mb-4 line-clamp-3" style={{ color: "var(--text-muted)" }}>{item.desc}</p>
              {/* Seller Row */}
              <div className="flex items-center gap-2 mt-auto pt-3" style={{ borderTop: "var(--border-width) solid var(--border)" }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(255,107,26,0.15)" }}>
                  <span className="text-xs font-bold" style={{ color: "var(--primary)" }}>{item.seller[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold" style={{ color: "var(--text)" }}>{item.seller}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3" style={{ color: "#f59e0b" }} fill="#f59e0b" />
                  <span className="text-xs font-bold" style={{ color: "var(--text)" }}>{item.rating}</span>
                </div>
              </div>
              {/* Hover CTA */}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-center pb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <span className="text-xs font-bold px-4 py-1.5 rounded-full" style={{ background: "rgba(255,107,26,0.90)", color: "#fff" }}>
                  View Listing →
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>


      {/* ── CTA Banner ── */}
      <section className="px-6 pb-24 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="max-w-4xl mx-auto relative rounded-2xl overflow-hidden p-12 text-center"
          style={{
            border: "var(--border-width) solid var(--border)",
            background: isDark
              ? "linear-gradient(135deg, rgba(255,107,26,0.08) 0%, rgba(255,123,58,0.04) 50%, transparent 100%)"
              : "linear-gradient(135deg, rgba(255,107,26,0.06) 0%, rgba(245,239,230,1) 100%)",
          }}
        >
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at top, rgba(255,107,26,0.10) 0%, transparent 60%)" }} />
          <span className="text-xs font-mono uppercase tracking-widest mb-4 block" style={{ color: "var(--primary)" }}>
            Get started today
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: "var(--text)" }}>
            Ready to trade smarter?
          </h2>
          <p className="mb-10 max-w-md mx-auto" style={{ color: "var(--text-muted)" }}>
            Join thousands of students already buying, selling, and sharing academic resources on Becho.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="h-13 px-10 text-sm font-mono uppercase tracking-widest"
              onClick={() => navigate("/dashboard")}>
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10" style={{ backgroundColor: "#0a1628", borderTop: "var(--border-width) solid rgba(255,255,255,0.06)" }}>
        {/* Top section */}
        <div className="max-w-7xl mx-auto px-6 pt-16 pb-12 grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Brand column */}
          <div className="md:col-span-1 flex flex-col gap-5">
            <BechoLogo size={38} showWordmark={true} wordmarkColor="white" />
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
              The trusted marketplace built exclusively for college students — buy, sell, and share
              academic resources within your campus community. Zero noise, verified students only.
            </p>
            {/* Social icons */}
            <div className="flex gap-3 mt-1">
              {[
                { label: "Twitter / X", svg: <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L2.002 2.25h6.976l4.263 5.633 5.003-5.633Zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="rgba(255,255,255,0.7)" /> },
                { label: "Instagram", svg: <><rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" /><circle cx="12" cy="12" r="4" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" /><circle cx="17.5" cy="6.5" r="1" fill="rgba(255,255,255,0.7)" /></> },
                { label: "LinkedIn", svg: <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z" fill="rgba(255,255,255,0.7)" /> },
              ].map(({ label, svg }) => (
                <button key={label} title={label}
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-white/10"
                  style={{ border: "var(--border-width) solid rgba(255,255,255,0.12)" }}>
                  <svg viewBox="0 0 24 24" className="w-4 h-4">{svg}</svg>
                </button>
              ))}
            </div>
          </div>

          {/* Marketplace column */}
          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-mono uppercase tracking-widest font-semibold" style={{ color: "#E8611C" }}>Marketplace</h4>
            <ul className="flex flex-col gap-2.5">
              {[
                { label: "Browse Listings", action: () => navigate("/browse") },
                { label: "Sell Resources", action: () => navigate("/login?role=seller") },
                { label: "Mentorship Hub", action: () => navigate("/mentorship") },
                { label: "Become a Seller", action: () => navigate("/login?role=seller") },
              ].map(({ label, action }) => (
                <li key={label}>
                  <button onClick={action}
                    className="text-sm transition-colors duration-200 hover:text-[#FF6B1A] text-left"
                    style={{ color: "rgba(255,255,255,0.55)" }}>
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories column */}
          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-mono uppercase tracking-widest font-semibold" style={{ color: "#E8611C" }}>Categories</h4>
            <ul className="flex flex-col gap-2.5">
              {["Study Notes & PDFs", "Textbooks", "Electronics & Kits", "Lab Equipment", "Video Courses", "Project Files"].map((item) => (
                <li key={item}>
                  <button onClick={() => navigate("/browse")}
                    className="text-sm transition-colors duration-200 hover:text-[#FF6B1A] text-left"
                    style={{ color: "rgba(255,255,255,0.55)" }}>
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* About column */}
          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-mono uppercase tracking-widest font-semibold" style={{ color: "#E8611C" }}>About</h4>
            <ul className="flex flex-col gap-2.5">
              {[
                "Our Mission", "How It Works", "Student Safety", "Privacy Policy", "Terms of Service", "Contact Us"
              ].map((item) => (
                <li key={item}>
                  <button className="text-sm transition-colors duration-200 hover:text-[#E8611C] text-left"
                    style={{ color: "rgba(255,255,255,0.55)" }}>
                    {item}
                  </button>
                </li>
              ))}
            </ul>

            {/* Mission callout */}
            <div className="mt-4 p-4 rounded-xl" style={{ background: "rgba(255,107,26,0.10)", border: "var(--border-width) solid rgba(255,107,26,0.20)" }}>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.60)" }}>
                <span style={{ color: "#FF6B1A", fontWeight: 600 }}>Our mission:</span> To empower every student with affordable access to academic resources — and a fair way to earn from what they already own.
              </p>
            </div>
          </div>
        </div>

        {/* ── Donate to BECHO QR Section ── */}
        <div className="max-w-7xl mx-auto px-6 pb-12 flex flex-col items-center">
          <div
            className="flex flex-col items-center gap-4 p-6 rounded-2xl"
            style={{
              background: "rgba(255,107,26,0.06)",
              border: "1px solid rgba(255,107,26,0.22)",
              maxWidth: "260px",
              width: "100%",
            }}
          >
            {/* Label */}
            <div className="flex items-center gap-2">
              <span className="text-lg">🧡</span>
              <span
                className="text-sm font-bold uppercase tracking-widest font-mono"
                style={{ color: "#FF6B1A" }}
              >
                Donate to BECHO
              </span>
              <span className="text-lg">🧡</span>
            </div>

            {/* QR Image */}
            <div
              className="rounded-xl overflow-hidden"
              style={{
                border: "2px solid rgba(255,107,26,0.40)",
                boxShadow: "0 0 24px rgba(255,107,26,0.18)",
              }}
            >
              <img
                src="/donate_qr.jpg"
                alt="Donate to Becho via UPI"
                className="w-[180px] h-[180px] object-cover block"
              />
            </div>

            {/* Sub-text */}
            <p className="text-xs text-center leading-relaxed" style={{ color: "rgba(255,255,255,0.50)" }}>
              Support Becho with any amount via UPI.<br />
              Every rupee helps us grow! 🚀
            </p>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: "var(--border-width) solid rgba(255,255,255,0.07)" }} />

        {/* Bottom bar */}
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.35)" }}>
            © 2026 Becho · Built for students, by students · India 🇮🇳
          </p>
          <div className="flex gap-5 text-xs font-mono" style={{ color: "rgba(255,255,255,0.35)" }}>
            <button className="hover:text-white transition-colors">Privacy</button>
            <button className="hover:text-white transition-colors">Terms</button>
            <button className="hover:text-white transition-colors">Cookies</button>
            <button onClick={() => navigate("/browse")} className="hover:text-white transition-colors">Browse</button>
          </div>
        </div>
      </footer>
    </div>
  )
}
