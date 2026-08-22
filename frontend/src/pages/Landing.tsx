import { useRef, useState } from "react"
import { motion, useAnimationFrame } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { Button } from "../components/ui/Button"
import BechoLogo from "../components/BechoLogo"
import { useTheme } from "../contexts/ThemeContext"
import {
  BookOpen,
  ShoppingCart,
  MessageCircle,
  ArrowRight,
  Star,
  Shield,
  Zap,
  Sun,
  Moon,
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
              border: "1px solid rgba(255,255,255,0.10)",
              boxShadow: card.z > 0
                ? `0 20px 60px rgba(0,0,0,0.5), 0 0 20px ${card.item.color}22`
                : "0 10px 30px rgba(0,0,0,0.35)",
            }}
          >
            <img src={card.item.img} alt={card.item.label} className="w-full h-full object-cover" draggable={false} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div
              className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest"
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
    <div className="w-full overflow-hidden py-4" style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", backgroundColor: "var(--surface)" }}>
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

// ─── Feature Card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, desc, color, delay }: {
  icon: React.ElementType; title: string; desc: string; color: string; delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ delay, duration: 0.6, type: "spring", stiffness: 60 }}
      whileHover={{ y: -4 }}
      className="group relative p-8 rounded-2xl backdrop-blur-sm transition-all duration-500 overflow-hidden"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(circle at top left, ${color}10, transparent 60%)` }}
      />
      <div className="h-14 w-14 rounded-xl flex items-center justify-center mb-6 transition-all duration-500"
        style={{ background: color + "18", color }}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-xl font-semibold mb-3" style={{ color: "var(--text)" }}>{title}</h3>
      <p className="leading-relaxed text-sm" style={{ color: "var(--text-muted)" }}>{desc}</p>
    </motion.div>
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
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div className="text-4xl font-bold mb-2" style={{ color: "var(--primary)" }}>{value}</div>
      <div className="text-sm font-mono uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{label}</div>
    </motion.div>
  )
}

// ─── Theme Toggle Button ──────────────────────────────────────────────────────
function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme()
  return (
    <button
      onClick={toggleTheme}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      className="h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-200"
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
        color: "var(--text-muted)",
      }}
    >
      {isDark
        ? <Sun className="h-4 w-4" />
        : <Moon className="h-4 w-4" />
      }
    </button>
  )
}

// ─── Main Landing Page ────────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate()
  const { isDark } = useTheme()

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ backgroundColor: "var(--bg)" }}>
      {/* Global background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[20%] w-[60%] h-[60%] blur-[200px] rounded-full"
          style={{ background: isDark ? "rgba(232,97,28,0.05)" : "rgba(232,97,28,0.07)" }} />
        <div className="absolute bottom-[-20%] right-[10%] w-[50%] h-[50%] blur-[160px] rounded-full"
          style={{ background: isDark ? "rgba(180,60,0,0.04)" : "rgba(180,60,0,0.05)" }} />
      </div>

      {/* ── Navbar ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl"
        style={{ borderBottom: "1px solid var(--border)", background: isDark ? "rgba(4,4,4,0.92)" : "rgba(220,210,196,0.95)" }}
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BechoLogo size={38} showWordmark={true} />
          </div>
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-6 text-sm font-mono" style={{ color: "var(--text-muted)" }}>
              <button className="hover:text-primary transition-colors" style={{ color: "inherit" }}
                onClick={() => navigate("/browse")}>Browse</button>
              <button className="hover:text-primary transition-colors" style={{ color: "inherit" }}
                onClick={() => navigate("/login")}>Sell</button>
              <span style={{ color: "var(--text-subtle)" }}>|</span>
            </div>
            <ThemeToggle />
            <Button className="text-xs uppercase tracking-widest font-mono h-9 px-5"
              onClick={() => navigate("/login")}>Log In</Button>
            <Button className="text-xs uppercase tracking-widest font-mono h-9 px-5"
              onClick={() => navigate("/login?role=buyer")}>Join Now</Button>
          </div>
          {/* Mobile */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <Button className="text-xs" onClick={() => navigate("/login")}>Log In</Button>
            <Button className="text-xs" onClick={() => navigate("/login?role=buyer")}>Join</Button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-28 pb-8 flex flex-col items-center text-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-mono uppercase tracking-widest"
          style={{ border: "1px solid rgba(232,97,28,0.30)", background: "rgba(232,97,28,0.06)", color: "var(--primary)" }}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
          Marketplace for college students
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.7, type: "spring", stiffness: 60 }}
          className="text-5xl sm:text-6xl lg:text-[5.5rem] font-bold tracking-tight leading-[1.08] max-w-4xl mb-4"
          style={{ color: "var(--text)" }}
        >
          The student market
          <br />
          <span style={{ color: "var(--text)" }}>for academic resources</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="text-2xl sm:text-3xl font-semibold mb-5 tracking-tight"
          style={{ color: "var(--primary)", fontStyle: "italic" }}
        >
          " We sell what you want "
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
          className="text-lg max-w-xl mb-8 leading-relaxed"
          style={{ color: "var(--text-muted)" }}
        >
          Buy, sell, and share notes, books, electronics &amp; more. Connect with seniors
          for mentorship. Only verified students — zero noise.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 mb-6"
        >
          <Button size="lg" className="h-13 px-8 text-sm font-mono uppercase tracking-widest"
            onClick={() => navigate("/dashboard")}>
            Get Started <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="flex items-center gap-3 text-sm mb-2"
          style={{ color: "var(--text-muted)" }}
        >
          <div className="flex -space-x-2">
            {["#E8611C", "#ff7b3a", "#ffa06d", "#ffffff", "#c94e12"].map((c, i) => (
              <div key={i} className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold"
                style={{ background: c + "33", color: c, borderColor: "var(--bg)", zIndex: 5 - i }}>
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
          <span>
            <span className="font-semibold" style={{ color: "var(--text)" }}>2,400+</span> students already trading
          </span>
        </motion.div>
      </section>

      {/* ── 3D Sphere Carousel ── */}
      <section className="relative px-6 -mt-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 1 }}>
          <SphereCarousel />
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 0.6 }}
          className="text-center text-xs font-mono uppercase tracking-widest -mt-4 mb-4"
          style={{ color: "var(--text-subtle)" }}
        >
          ← drag to explore →
        </motion.p>
      </section>

      {/* ── Marquee ── */}
      <MarqueeStrip />

      {/* ── Stats ── */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatCard value="2.4K+" label="Students" />
          <StatCard value="8,900+" label="Items Listed" />
          <StatCard value="12+" label="Colleges" />
          <StatCard value="98%" label="Trust Score" />
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-xs font-mono uppercase tracking-widest mb-4 block" style={{ color: "var(--primary)" }}>
            Why Becho?
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: "var(--text)" }}>
            Everything a student needs
          </h2>
          <p className="max-w-xl mx-auto" style={{ color: "var(--text-muted)" }}>
            From lab equipment to lecture notes — trade safely, quickly, and only within your campus community.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard icon={BookOpen} title="Digital & Physical" desc="PDF notes, textbooks, lab manuals, Arduino kits, sensors — list anything academic." color="#E8611C" delay={0} />
          <FeatureCard icon={Shield} title="Verified Students Only" desc="College email verification ensures you only deal with real students from real campuses." color="#ff7b3a" delay={0.1} />
          <FeatureCard icon={Zap} title="Lightning Fast" desc="List items in under 60 seconds. Browse, message, and close deals — all in one place." color={isDark ? "#e8e8e8" : "#555555"} delay={0.2} />
          <FeatureCard icon={ShoppingCart} title="Fair Pricing" desc="Set your own price. No platform fee gouging. Buyers and sellers both win." color="#ffa06d" delay={0.3} />
          <FeatureCard icon={MessageCircle} title="Mentorship Hub" desc="Connect with seniors who've aced what you're studying. Get guidance that matters." color="#E8611C" delay={0.4} />
          <FeatureCard icon={Star} title="Reputation System" desc="Star ratings and reviews so you always know who you're dealing with before you transact." color="#ff7b3a" delay={0.5} />
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="max-w-4xl mx-auto relative rounded-3xl overflow-hidden p-12 text-center"
          style={{
            border: "1px solid var(--border)",
            background: isDark
              ? "linear-gradient(135deg, rgba(232,97,28,0.08) 0%, rgba(255,123,58,0.04) 50%, transparent 100%)"
              : "linear-gradient(135deg, rgba(232,97,28,0.06) 0%, rgba(245,239,230,1) 100%)",
          }}
        >
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at top, rgba(232,97,28,0.10) 0%, transparent 60%)" }} />
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
      <footer style={{ backgroundColor: "#0a1628", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
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
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:bg-white/10"
                  style={{ border: "1px solid rgba(255,255,255,0.12)" }}>
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
                    className="text-sm transition-colors duration-200 hover:text-[#E8611C] text-left"
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
                    className="text-sm transition-colors duration-200 hover:text-[#E8611C] text-left"
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
            <div className="mt-4 p-4 rounded-xl" style={{ background: "rgba(232,97,28,0.10)", border: "1px solid rgba(232,97,28,0.20)" }}>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.60)" }}>
                <span style={{ color: "#E8611C", fontWeight: 600 }}>Our mission:</span> To empower every student with affordable access to academic resources — and a fair way to earn from what they already own.
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }} />

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
