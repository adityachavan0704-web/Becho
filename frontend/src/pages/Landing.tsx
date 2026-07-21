import { useEffect, useRef, useState } from "react"
import { motion, useAnimationFrame } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { Button } from "../components/ui/Button"
import BechoLogo from "../components/BechoLogo"
import {
  BookOpen,
  ShoppingCart,
  MessageCircle,
  ArrowRight,
  Star,
  Shield,
  Zap,
} from "lucide-react"

// ─── 3D Carousel Data ────────────────────────────────────────────────────────
const carouselItems = [
  {
    img: "/arduino_kit.png",
    label: "Arduino Kit",
    tag: "Electronics",
    color: "#00fcb5",
  },
  {
    img: "/sensors_collection.png",
    label: "IoT Sensors",
    tag: "Hardware",
    color: "#7df2ff",
  },
  {
    img: "/textbooks_stack.png",
    label: "Engineering Books",
    tag: "Books",
    color: "#a78bfa",
  },
  {
    img: "/video_course.png",
    label: "Video Courses",
    tag: "Digital",
    color: "#f472b6",
  },
  {
    img: "/lab_equipment.png",
    label: "Lab Equipment",
    tag: "Instruments",
    color: "#fb923c",
  },
  {
    img: "/notes_pdf.png",
    label: "Study Notes",
    tag: "Notes",
    color: "#4ade80",
  },
  {
    img: "/raspberry_pi.png",
    label: "Raspberry Pi",
    tag: "Electronics",
    color: "#38bdf8",
  },
  {
    img: "/mentorship.png",
    label: "Mentorship",
    tag: "Guidance",
    color: "#facc15",
  },
]

// ─── 3D Sphere Carousel Component ───────────────────────────────────────────
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
  const rx = 380  // horizontal radius
  const ry = 90   // vertical (ellipse compression)

  const compute = (angle: number) => {
    return carouselItems.map((item, i) => {
      const theta = (i / count) * Math.PI * 2 + angle
      const x = Math.sin(theta) * rx
      const z = Math.cos(theta) * rx
      // Project z to y for ellipse feel
      const yBias = Math.sin(theta) * ry
      const scale = 0.6 + ((z + rx) / (2 * rx)) * 0.55
      const opacity = 0.3 + ((z + rx) / (2 * rx)) * 0.7

      return {
        x,
        y: yBias,
        z,
        rotY: -(theta * 180) / Math.PI + 90,
        scale,
        opacity,
        item,
      }
    })
  }

  useAnimationFrame(() => {
    if (!isDragging.current) {
      angleRef.current += 0.004
      velocityRef.current *= 0.95
    } else {
      angleRef.current += velocityRef.current * 0.01
    }
    setCards(compute(angleRef.current))
  })

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true
    lastX.current = e.clientX
  }
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return
    const delta = e.clientX - lastX.current
    velocityRef.current = delta * 0.1
    angleRef.current += delta * 0.004
    lastX.current = e.clientX
  }
  const handleMouseUp = () => {
    isDragging.current = false
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true
    lastX.current = e.touches[0].clientX
  }
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return
    const delta = e.touches[0].clientX - lastX.current
    velocityRef.current = delta * 0.1
    angleRef.current += delta * 0.004
    lastX.current = e.touches[0].clientX
  }
  const handleTouchEnd = () => {
    isDragging.current = false
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[520px] flex items-center justify-center select-none cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ perspective: "1200px" }}
    >
      {/* Atmospheric glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-[600px] h-[600px] rounded-full"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(0,252,181,0.08) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Cards */}
      {[...cards].sort((a, b) => a.z - b.z).map((card, i) => (
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
            className="relative w-[160px] h-[210px] rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            style={{
              boxShadow:
                card.z > 0
                  ? `0 20px 60px rgba(0,0,0,0.6), 0 0 20px ${card.item.color}22`
                  : "0 10px 30px rgba(0,0,0,0.4)",
            }}
          >
            <img
              src={card.item.img}
              alt={card.item.label}
              className="w-full h-full object-cover"
              draggable={false}
            />
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

            {/* Tag */}
            <div
              className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest"
              style={{
                background: card.item.color + "22",
                color: card.item.color,
                border: `1px solid ${card.item.color}44`,
              }}
            >
              {card.item.tag}
            </div>

            {/* Label */}
            <div className="absolute bottom-3 left-3 right-3">
              <p className="text-white text-xs font-semibold font-sans leading-tight">
                {card.item.label}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Marquee Strip ──────────────────────────────────────────────────────────
const marqueeItems = [
  "Arduino Kits",
  "Lab Manuals",
  "Study Notes",
  "IoT Sensors",
  "Video Courses",
  "Raspberry Pi",
  "Textbooks",
  "Mentorship",
  "Project Files",
  "Lab Equipment",
]

function MarqueeStrip() {
  return (
    <div className="w-full overflow-hidden border-y border-white/5 py-4 bg-zinc-900/40">
      <motion.div
        className="flex gap-12 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        {[...marqueeItems, ...marqueeItems].map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-3 text-sm font-mono uppercase tracking-widest text-zinc-500"
          >
            <span className="text-primary">✦</span>
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  )
}

// ─── Feature Card ────────────────────────────────────────────────────────────
function FeatureCard({
  icon: Icon,
  title,
  desc,
  color,
  delay,
}: {
  icon: React.ElementType
  title: string
  desc: string
  color: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ delay, duration: 0.6, type: "spring", stiffness: 60 }}
      whileHover={{ y: -4 }}
      className="group relative p-8 rounded-2xl border border-white/5 bg-zinc-900/50 backdrop-blur-sm hover:border-white/10 transition-all duration-500 overflow-hidden"
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle at top left, ${color}10, transparent 60%)`,
        }}
      />
      <div
        className="h-14 w-14 rounded-xl flex items-center justify-center mb-6 transition-all duration-500"
        style={{ background: color + "18", color }}
      >
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-xl font-semibold mb-3 text-white font-sans">{title}</h3>
      <p className="text-zinc-400 leading-relaxed text-sm">{desc}</p>
    </motion.div>
  )
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="text-center p-8 rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-sm"
    >
      <div className="text-4xl font-bold text-primary mb-2 font-sans">{value}</div>
      <div className="text-zinc-400 text-sm font-mono uppercase tracking-widest">{label}</div>
    </motion.div>
  )
}

// ─── Main Landing Page ───────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative overflow-x-hidden">
      {/* ── Global background glow ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[20%] w-[60%] h-[60%] bg-primary/5 blur-[200px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[10%] w-[50%] h-[50%] bg-sky-500/5 blur-[160px] rounded-full" />
      </div>

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b border-white/5 bg-black/40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BechoLogo size={38} showWordmark={true} />
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-zinc-400 font-mono">
            <button className="hover:text-white transition-colors" onClick={() => navigate("/browse")}>
              Browse
            </button>
            <button className="hover:text-white transition-colors" onClick={() => navigate("/login")}>
              Sell
            </button>
            <span className="text-zinc-700">|</span>
            <Button
              variant="outline"
              className="text-xs uppercase tracking-widest font-mono h-9 px-5"
              onClick={() => navigate("/login")}
            >
              Log in
            </Button>
            <Button
              className="text-xs uppercase tracking-widest font-mono h-9 px-5"
              onClick={() => navigate("/login?role=buyer")}
            >
              Join Now
            </Button>
          </div>
          {/* Mobile */}
          <div className="flex md:hidden gap-3">
            <Button variant="ghost" className="text-xs" onClick={() => navigate("/login")}>
              Log in
            </Button>
            <Button className="text-xs" onClick={() => navigate("/login?role=buyer")}>
              Join
            </Button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-28 pb-8 flex flex-col items-center text-center px-6">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 mb-6 text-xs font-mono uppercase tracking-widest text-primary"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
          Marketplace for college students
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.7, type: "spring", stiffness: 60 }}
          className="text-5xl sm:text-6xl lg:text-[5.5rem] font-bold tracking-tight leading-[1.08] text-white max-w-4xl mb-6"
        >
          The student market
          <br />
          <span
            className="text-transparent bg-clip-text"
            style={{
              backgroundImage:
                "linear-gradient(135deg, #ffffff 0%, #00fcb5 50%, #7df2ff 100%)",
            }}
          >
            for academic resources
          </span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-lg text-zinc-400 max-w-xl mb-8 leading-relaxed"
        >
          Buy, sell, and share notes, books, electronics & more. Connect with seniors
          for mentorship. Only verified students — zero noise.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 mb-6"
        >
          <Button
            size="lg"
            className="h-13 px-8 text-sm font-mono uppercase tracking-widest"
            onClick={() => navigate("/login?role=seller")}
          >
            Start Selling <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-13 px-8 text-sm font-mono uppercase tracking-widest"
            onClick={() => navigate("/browse")}
          >
            Browse Items
          </Button>
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-3 text-zinc-500 text-sm mb-2"
        >
          <div className="flex -space-x-2">
            {["#00fcb5", "#7df2ff", "#a78bfa", "#f472b6", "#fb923c"].map((c, i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-full border-2 border-[#0a0a0a] flex items-center justify-center text-[10px] font-bold"
                style={{ background: c + "33", color: c, zIndex: 5 - i }}
              >
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
          <span>
            <span className="text-white font-semibold">2,400+</span> students already trading
          </span>
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── 3D Sphere Carousel ── */}
      <section className="relative px-6 -mt-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 1 }}
        >
          <SphereCarousel />
        </motion.div>
        {/* Drag hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="text-center text-zinc-600 text-xs font-mono uppercase tracking-widest -mt-4 mb-4"
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
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-xs font-mono uppercase tracking-widest text-primary mb-4 block">
            Why Becho?
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white font-sans mb-4">
            Everything a student needs
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto">
            From lab equipment to lecture notes — trade safely, quickly, and only within your campus community.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            icon={BookOpen}
            title="Digital & Physical"
            desc="PDF notes, textbooks, lab manuals, Arduino kits, sensors — list anything academic."
            color="#00fcb5"
            delay={0}
          />
          <FeatureCard
            icon={Shield}
            title="Verified Students Only"
            desc="College email verification ensures you only deal with real students from real campuses."
            color="#7df2ff"
            delay={0.1}
          />
          <FeatureCard
            icon={Zap}
            title="Lightning Fast"
            desc="List items in under 60 seconds. Browse, message, and close deals — all in one place."
            color="#a78bfa"
            delay={0.2}
          />
          <FeatureCard
            icon={ShoppingCart}
            title="Fair Pricing"
            desc="Set your own price. No platform fee gouging. Buyers and sellers both win."
            color="#fb923c"
            delay={0.3}
          />
          <FeatureCard
            icon={MessageCircle}
            title="Mentorship Hub"
            desc="Connect with seniors who've aced what you're studying. Get guidance that matters."
            color="#f472b6"
            delay={0.4}
          />
          <FeatureCard
            icon={Star}
            title="Reputation System"
            desc="Star ratings and reviews so you always know who you're dealing with before you transact."
            color="#4ade80"
            delay={0.5}
          />
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto relative rounded-3xl overflow-hidden border border-white/10 p-12 text-center"
          style={{
            background:
              "linear-gradient(135deg, rgba(0,252,181,0.08) 0%, rgba(125,242,255,0.05) 50%, rgba(0,0,0,0) 100%)",
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at top, rgba(0,252,181,0.12) 0%, transparent 60%)",
            }}
          />
          <span className="text-xs font-mono uppercase tracking-widest text-primary mb-4 block">
            Get started today
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 font-sans">
            Ready to trade smarter?
          </h2>
          <p className="text-zinc-400 mb-10 max-w-md mx-auto">
            Join thousands of students already buying, selling, and sharing academic resources on Becho.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="h-13 px-10 text-sm font-mono uppercase tracking-widest"
              onClick={() => navigate("/login?role=seller")}
            >
              Start Selling Now <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-13 px-10 text-sm font-mono uppercase tracking-widest"
              onClick={() => navigate("/browse")}
            >
              Explore Listings
            </Button>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <BechoLogo size={32} showWordmark={true} />
          <p className="text-zinc-500 text-sm font-mono">
            © 2026 Becho · Built for students, by students
          </p>
          <div className="flex gap-6 text-zinc-500 text-sm font-mono">
            <button className="hover:text-white transition-colors" onClick={() => navigate("/browse")}>Browse</button>
            <button className="hover:text-white transition-colors" onClick={() => navigate("/login")}>Sell</button>
            <button className="hover:text-white transition-colors">Privacy</button>
          </div>
        </div>
      </footer>
    </div>
  )
}
