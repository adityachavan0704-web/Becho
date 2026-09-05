import { useState, useCallback, useRef } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Package, FileText, Upload, ChevronRight, ChevronLeft,
  Check, Loader2, ImagePlus, FilePlus, Tag, Info, QrCode,
  X, ArrowLeft
} from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { useTheme } from "../contexts/ThemeContext"
import BechoLogo from "../components/BechoLogo"

const API_URL = (import.meta.env["VITE_API_URL"] as string) ?? "http://localhost:3000"

const CATEGORIES_ONLINE = ["Notes", "Books", "Software", "Tutorials", "Mock Tests", "Projects", "Other"]
const CATEGORIES_OFFLINE = ["Books", "Hardware", "Cycles", "Other", "Lab Tools", "Furniture"]

type Step = 1 | 2 | 3 | 4

interface FormData {
  type: "ONLINE" | "OFFLINE"
  title: string
  description: string
  category: string
  price: string
  isFree: boolean
  subject: string
  semester: string
  condition: string
  images: File[]
  file: File | null
  qrCode: File | null
}

const STEPS = [
  { label: "Type", icon: Tag, desc: "Choose listing category" },
  { label: "Details", icon: Info, desc: "Add title, price & info" },
  { label: "Upload", icon: Upload, desc: "Attach images & files" },
  { label: "Review", icon: Check, desc: "Confirm & publish" },
]

// ── Theme-aware style helpers ──────────────────────────────────────────────────
const T = {
  bg: "var(--bg)",
  bgSubtle: "var(--bg-subtle)",
  surface: "var(--surface)",
  surface2: "var(--surface-2)",
  surface3: "var(--surface-3)",
  border: "var(--border)",
  borderStrong: "var(--border-strong)",
  text: "var(--text)",
  muted: "var(--text-muted)",
  subtle: "var(--text-subtle)",
  primary: "var(--primary)",
  primaryDim: "var(--primary-dim)",
  primaryGlow: "var(--primary-glow)",
}

export default function CreateListingPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { getAccessToken } = useAuth()
  const { isDark } = useTheme()

  const defaultType = searchParams.get("type") === "ONLINE" ? "ONLINE" : "OFFLINE"
  const startStep: Step = searchParams.get("type") ? 2 : 1

  const [step, setStep] = useState<Step>(startStep)
  const [form, setForm] = useState<FormData>({
    type: defaultType,
    title: "",
    description: "",
    category: "",
    price: "",
    isFree: false,
    subject: "",
    semester: "",
    condition: "Good",
    images: [],
    file: null,
    qrCode: null,
  })
  const [isDragging, setIsDragging] = useState(false)
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const imageDrop = useRef<HTMLDivElement>(null)

  const set = (key: keyof FormData, val: unknown) =>
    setForm((f) => ({ ...f, [key]: val }))

  const handleDrop = useCallback(
    (e: React.DragEvent, field: "images" | "file") => {
      e.preventDefault()
      setIsDragging(false)
      setIsDraggingFile(false)
      const files = Array.from(e.dataTransfer.files)
      if (field === "images") {
        set("images", [...form.images, ...files.filter((f) => f.type.startsWith("image/"))].slice(0, 5))
      } else {
        if (files[0]) set("file", files[0])
      }
    },
    [form.images]
  )

  const removeImage = (idx: number) =>
    set("images", form.images.filter((_, i) => i !== idx))

  const handleSubmit = async () => {
    setError(null)
    setIsSubmitting(true)
    try {
      const fd = new FormData()
      fd.append("title", form.title)
      fd.append("description", form.description)
      fd.append("type", form.type)
      fd.append("category", form.category)
      fd.append("price", form.isFree ? "0" : form.price)
      fd.append("isFree", String(form.isFree))
      if (form.subject) fd.append("subject", form.subject)
      if (form.semester) fd.append("semester", form.semester)
      if (form.condition) fd.append("condition", form.condition)
      form.images.forEach((img) => fd.append("images", img))
      if (form.file) fd.append("file", form.file)
      if (form.qrCode) fd.append("qrCode", form.qrCode)

      const res = await fetch(`${API_URL}/api/listings`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        body: fd,
      })

      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? "Failed to create listing")
      }

      setSuccess(true)
      setTimeout(() => navigate("/dashboard"), 2800)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  const canNext = () => {
    if (step === 1) return true
    if (step === 2) return form.title.trim().length > 2 && form.description.trim().length > 5 && !!form.category
    if (step === 3) return true
    return true
  }

  const categories = form.type === "ONLINE" ? CATEGORIES_ONLINE : CATEGORIES_OFFLINE

  // shared input style – uses CSS vars so it adapts to light/dark
  const inputStyle: React.CSSProperties = {
    background: "var(--surface-2)",
    border: "var(--border-width) solid var(--border)",
    color: "var(--text)",
  }
  const inputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = "rgba(255,107,26,0.5)"
    e.currentTarget.style.boxShadow = "0 0 0 3px var(--primary-glow)"
  }
  const inputBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // Reset to the CSS-variable value by clearing the inline style override
    e.currentTarget.style.borderColor = ""
    e.currentTarget.style.boxShadow = "none"
  }

  // ── Success Screen ───────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: T.bg }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", bounce: 0.35, duration: 0.7 }}
          className="flex flex-col items-center gap-6 text-center px-8"
        >
          <div className="relative">
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ background: "rgba(255,107,26,0.15)" }}
              animate={{ scale: [1, 1.6, 1], opacity: [0.7, 0, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <div className="relative w-24 h-24 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,107,26,0.18)", border: "2px solid rgba(255,107,26,0.4)" }}>
              <Check className="h-10 w-10 text-[#FF6B1A]" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold mb-2" style={{ color: T.text }}>Listing Published!</p>
            <p className="text-sm" style={{ color: T.muted }}>Your listing is now live on Becho marketplace.</p>
          </div>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "200px" }}
            transition={{ duration: 2.8, ease: "linear" }}
            className="h-0.5 rounded-full"
            style={{ background: "linear-gradient(to right, #FF6B1A, #f59e0b)" }}
          />
          <p className="text-xs" style={{ color: T.subtle }}>Redirecting to dashboard…</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex" style={{ background: T.bg }}>

      {/* ── LEFT PANEL ─────────────────────────────────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col w-[340px] xl:w-[380px] flex-shrink-0 relative overflow-hidden"
        style={{
          background: T.surface,
          borderRight: `var(--border-width) solid ${T.border}`,
        }}
      >
        {/* Ambient glows */}
        <div className="absolute top-0 left-0 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(255,107,26,0.07) 0%, transparent 70%)", transform: "translate(-30%,-30%)" }} />
        <div className="absolute bottom-0 right-0 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(245,158,11,0.04) 0%, transparent 70%)", transform: "translate(30%,30%)" }} />

        {/* Back */}
        <div className="px-5 pt-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm transition-colors group"
            style={{ color: T.muted }}
            onMouseEnter={(e) => (e.currentTarget.style.color = T.text)}
            onMouseLeave={(e) => (e.currentTarget.style.color = T.muted)}
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            Back
          </button>
        </div>

        {/* Logo */}
        <div className="px-5 pt-6 pb-2">
          <BechoLogo size={32} showWordmark />
        </div>

        {/* Heading */}
        <div className="px-5 pt-6 pb-8">
          <h1 className="text-2xl font-bold mb-1" style={{ color: T.text }}>Create a Listing</h1>
          <p className="text-sm" style={{ color: T.muted }}>
            {form.type === "ONLINE" ? "Online / Digital resource" : "Hardware / Physical item"}
          </p>
        </div>

        {/* Vertical stepper */}
        <div className="px-5 flex-1">
          <div className="space-y-0">
            {STEPS.map((s, i) => {
              const num = (i + 1) as Step
              const active = step === num
              const done = step > num
              const isLast = i === STEPS.length - 1
              return (
                <div key={s.label} className="flex items-start gap-1.5">
                  {/* Circle + connector column */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <motion.div
                      className="relative z-10 w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                      animate={{
                        background: done
                          ? "rgba(255,107,26,0.20)"
                          : active
                            ? "rgba(255,107,26,0.14)"
                            : isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)",
                        borderColor: done || active
                          ? "rgba(255,107,26,0.5)"
                          : isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.15)",
                      }}
                      style={{ border: "1px solid" }}
                    >
                      <AnimatePresence mode="wait">
                        {done ? (
                          <motion.div key="done" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                            <Check className="h-4 w-4 text-[#FF6B1A]" />
                          </motion.div>
                        ) : (
                          <motion.div key="icon" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                            <s.icon
                              className="h-4 w-4"
                              style={{ color: active ? "#FF6B1A" : T.subtle }}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                    {/* Segment connector to next step */}
                    {!isLast && (
                      <motion.div
                        className="w-px my-1"
                        style={{ minHeight: "32px", flex: 1 }}
                        animate={{
                          background: done
                            ? "linear-gradient(to bottom, rgba(255,107,26,0.7), rgba(255,107,26,0.3))"
                            : T.border,
                        }}
                        transition={{ duration: 0.4 }}
                      />
                    )}
                  </div>
                  {/* Label text */}
                  <div className="pt-1.5 pb-7">
                    <p
                      className="text-sm font-semibold transition-colors"
                      style={{ color: active ? T.text : done ? T.muted : T.subtle }}
                    >
                      {s.label}
                    </p>
                    <p
                      className="text-xs mt-0.5 transition-colors"
                      style={{ color: active ? T.muted : T.subtle }}
                    >
                      {s.desc}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Live preview card */}
        <AnimatePresence>
          {step >= 2 && form.title && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="mx-5 mb-8 rounded-2xl overflow-hidden"
              style={{ border: `var(--border-width) solid ${T.border}`, background: T.surface2 }}
            >
              {form.images[0] ? (
                <img src={URL.createObjectURL(form.images[0])} alt="preview" className="w-full h-28 object-cover" />
              ) : (
                <div className="w-full h-28 flex items-center justify-center" style={{ background: T.surface3 }}>
                  {form.type === "OFFLINE"
                    ? <Package className="h-8 w-8" style={{ color: T.subtle }} />
                    : <FileText className="h-8 w-8" style={{ color: T.subtle }} />}
                </div>
              )}
              <div className="p-3">
                <p className="text-xs font-semibold truncate" style={{ color: T.text }}>{form.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  {form.category && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(255,107,26,0.15)", color: "#FF6B1A" }}>
                      {form.category}
                    </span>
                  )}
                  <span className="text-[10px]" style={{ color: T.muted }}>{form.isFree ? "Free" : form.price ? `₹${form.price}` : "—"}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── RIGHT PANEL ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen">

        {/* Mobile top bar */}
        <div
          className="lg:hidden flex items-center justify-between px-5 py-4"
          style={{ borderBottom: `var(--border-width) solid ${T.border}` }}
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm transition-colors"
            style={{ color: T.muted }}
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <BechoLogo size={28} showWordmark />
          <div className="w-16" />
        </div>

        {/* Mobile step pills */}
        <div
          className="lg:hidden flex items-center gap-1.5 px-5 py-3 overflow-x-auto"
          style={{ borderBottom: `1px solid ${T.border}` }}
        >
          {STEPS.map((s, i) => {
            const num = (i + 1) as Step
            const active = step === num
            const done = step > num
            return (
              <div
                key={s.label}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all"
                style={{
                  background: active ? "rgba(255,107,26,0.12)" : "transparent",
                  color: active ? "#FF6B1A" : done ? T.muted : T.subtle,
                }}
              >
                {done ? <Check className="h-3 w-3 text-[#FF6B1A]" /> : <s.icon className="h-3 w-3" />}
                {s.label}
              </div>
            )
          })}
        </div>

        {/* Form area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-xl mx-auto px-6 py-10 lg:py-16">

            {/* Step heading */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`heading-${step}`}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.25 }}
                className="mb-8"
              >
                <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#FF6B1A" }}>
                  Step {step} of {STEPS.length}
                </p>
                <h2 className="text-2xl font-bold" style={{ color: T.text }}>{STEPS[step - 1].label}</h2>
                <p className="text-sm mt-1" style={{ color: T.muted }}>{STEPS[step - 1].desc}</p>
              </motion.div>
            </AnimatePresence>

            {/* Step content */}
            <AnimatePresence mode="wait">

              {/* Step 1: Type */}
              {step === 1 && (
                <motion.div key="step1"
                  initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -32 }}
                  transition={{ duration: 0.28 }}>
                  <div className="grid grid-cols-2 gap-4">
                    {(["OFFLINE", "ONLINE"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => { set("type", t); set("category", "") }}
                        className="flex flex-col items-center gap-4 p-7 rounded-lg border-2 transition-all duration-200 group"
                        style={{
                          borderColor: form.type === t ? "rgba(255,107,26,0.7)" : T.border,
                          background: form.type === t
                            ? "rgba(255,107,26,0.06)"
                            : T.surface2,
                          boxShadow: form.type === t
                            ? "0 0 0 1px rgba(255,107,26,0.3), 0 0 28px rgba(255,107,26,0.08)"
                            : "none",
                        }}
                      >
                        <div
                          className="w-14 h-14 rounded-lg flex items-center justify-center transition-all"
                          style={{ background: form.type === t ? "rgba(255,107,26,0.15)" : T.surface3 }}
                        >
                          {t === "OFFLINE"
                            ? <Package className="h-7 w-7" style={{ color: form.type === t ? "#FF6B1A" : T.muted }} />
                            : <FileText className="h-7 w-7" style={{ color: form.type === t ? "#FF6B1A" : T.muted }} />}
                        </div>
                        <div className="text-center">
                          <p
                            className="font-semibold text-sm tracking-wide"
                            style={{ color: form.type === t ? "#FF6B1A" : T.text }}
                          >
                            {t === "OFFLINE" ? "Hardware Item" : "Online Resource"}
                          </p>
                          <p className="text-xs mt-1" style={{ color: T.muted }}>
                            {t === "OFFLINE" ? "Books, cycles, equipment" : "Notes, PDFs, software"}
                          </p>
                        </div>
                        {form.type === t && (
                          <motion.div layoutId="type-check"
                            className="w-5 h-5 rounded flex items-center justify-center"
                            style={{ background: "rgba(255,107,26,0.25)", outline: "1px solid rgba(255,107,26,0.5)" }}>
                            <Check className="h-3 w-3 text-[#FF6B1A]" />
                          </motion.div>
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Details */}
              {step === 2 && (
                <motion.div key="step2"
                  initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -32 }}
                  transition={{ duration: 0.28 }} className="space-y-5">

                  <div>
                    <label className="text-xs font-medium mb-2 block" style={{ color: T.muted }}>Title *</label>
                    <input
                      className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                      style={inputStyle}
                      onFocus={inputFocus}
                      onBlur={inputBlur}
                      placeholder="e.g. Engineering Physics Notes Sem 3"
                      value={form.title} onChange={(e) => set("title", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium mb-2 block" style={{ color: T.muted }}>Description *</label>
                    <textarea
                      rows={4}
                      className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all resize-none"
                      style={inputStyle}
                      onFocus={inputFocus}
                      onBlur={inputBlur}
                      placeholder="Describe the item, condition, contents…"
                      value={form.description} onChange={(e) => set("description", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium mb-2 block" style={{ color: T.muted }}>Category *</label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => set("category", cat)}
                          className="px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all"
                          style={{
                            background: form.category === cat ? "rgba(255,107,26,0.12)" : T.surface3,
                            borderColor: form.category === cat ? "rgba(255,107,26,0.5)" : T.border,
                            color: form.category === cat ? "#FF6B1A" : T.muted,
                          }}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {form.category && (
                    <motion.div
                      key="subject-semester"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.22 }}
                      className="grid grid-cols-2 gap-4"
                    >
                      <div>
                        <label className="text-xs font-medium mb-2 block" style={{ color: T.muted }}>
                          Subject <span className="font-normal" style={{ color: T.subtle }}>(optional)</span>
                        </label>
                        <input
                          className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                          style={inputStyle}
                          onFocus={inputFocus}
                          onBlur={inputBlur}
                          placeholder="e.g. Physics"
                          value={form.subject} onChange={(e) => set("subject", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium mb-2 block" style={{ color: T.muted }}>
                          Semester <span className="font-normal" style={{ color: T.subtle }}>(optional)</span>
                        </label>
                        <input
                          type="number" min="1" max="8"
                          className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                          style={inputStyle}
                          onFocus={inputFocus}
                          onBlur={inputBlur}
                          placeholder="1 – 8"
                          value={form.semester} onChange={(e) => set("semester", e.target.value)}
                        />
                      </div>
                    </motion.div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-medium" style={{ color: T.muted }}>Price</label>
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <div
                          onClick={() => set("isFree", !form.isFree)}
                          className="relative w-9 h-5 rounded-full transition-colors cursor-pointer"
                          style={{ background: form.isFree ? "#FF6B1A" : T.surface3 }}
                        >
                          <div
                            className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                            style={{ transform: form.isFree ? "translateX(16px)" : "translateX(0)" }}
                          />
                        </div>
                        <span className="text-xs" style={{ color: T.muted }}>Free</span>
                      </label>
                    </div>
                    {!form.isFree && (
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color: T.muted }}>₹</span>
                        <input
                          type="number" min="0"
                          className="w-full rounded-xl pl-9 pr-4 py-3 text-sm outline-none transition-all"
                          style={inputStyle}
                          onFocus={inputFocus}
                          onBlur={inputBlur}
                          placeholder="0.00"
                          value={form.price} onChange={(e) => set("price", e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  {form.type === "OFFLINE" && (
                    <div>
                      <label className="text-xs font-medium mb-2 block" style={{ color: T.muted }}>Condition</label>
                      <div className="flex gap-2 flex-wrap">
                        {["Like New", "Good", "Fair", "Poor"].map((c) => (
                          <button
                            key={c}
                            onClick={() => set("condition", c)}
                            className="px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all"
                            style={{
                              background: form.condition === c ? "rgba(255,107,26,0.12)" : T.surface3,
                              borderColor: form.condition === c ? "rgba(255,107,26,0.5)" : T.border,
                              color: form.condition === c ? "#FF6B1A" : T.muted,
                            }}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 3: Upload */}
              {step === 3 && (
                <motion.div key="step3"
                  initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -32 }}
                  transition={{ duration: 0.28 }} className="space-y-6">

                  <div>
                    <label className="text-xs font-medium mb-3 flex items-center gap-1.5" style={{ color: T.muted }}>
                      <ImagePlus className="h-3.5 w-3.5" /> Images <span className="font-normal" style={{ color: T.subtle }}>(up to 5)</span>
                    </label>
                    <div
                      ref={imageDrop}
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => handleDrop(e, "images")}
                      onClick={() => document.getElementById("img-upload")?.click()}
                      className="rounded-2xl p-8 text-center transition-all cursor-pointer border-2 border-dashed"
                      style={{
                        borderColor: isDragging ? "rgba(255,107,26,0.6)" : T.border,
                        background: isDragging ? "rgba(255,107,26,0.04)" : T.surface2,
                      }}
                    >
                      <input id="img-upload" type="file" accept="image/*" multiple className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files ?? []).slice(0, 5)
                          set("images", [...form.images, ...files].slice(0, 5))
                        }}
                      />
                      <Upload className="h-6 w-6 mx-auto mb-3" style={{ color: T.subtle }} />
                      <p className="text-sm font-medium" style={{ color: T.muted }}>Drag & drop images here</p>
                      <p className="text-xs mt-1" style={{ color: T.subtle }}>or click to browse</p>
                    </div>
                    {form.images.length > 0 && (
                      <div className="flex gap-3 mt-3 flex-wrap">
                        {form.images.map((img, idx) => (
                          <div key={idx} className="relative group">
                            <img
                              src={URL.createObjectURL(img)} alt=""
                              className="w-20 h-20 object-cover rounded-xl"
                              style={{ border: `var(--border-width) solid ${T.border}` }}
                            />
                            <button
                              onClick={() => removeImage(idx)}
                              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {form.type === "ONLINE" && (
                    <div>
                      <label className="text-xs font-medium mb-3 flex items-center gap-1.5" style={{ color: T.muted }}>
                        <FilePlus className="h-3.5 w-3.5" /> Resource File <span className="font-normal" style={{ color: T.subtle }}>(PDF, ZIP, MP4)</span>
                      </label>
                      <div
                        onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true) }}
                        onDragLeave={() => setIsDraggingFile(false)}
                        onDrop={(e) => handleDrop(e, "file")}
                        onClick={() => document.getElementById("file-upload")?.click()}
                        className="rounded-2xl p-6 text-center transition-all cursor-pointer border-2 border-dashed"
                        style={{
                          borderColor: isDraggingFile ? "rgba(255,107,26,0.6)" : T.border,
                          background: isDraggingFile ? "rgba(255,107,26,0.04)" : T.surface2,
                        }}
                      >
                        <input id="file-upload" type="file" accept=".pdf,.zip,.mp4" className="hidden"
                          onChange={(e) => set("file", e.target.files?.[0] ?? null)}
                        />
                        {form.file ? (
                          <div className="flex items-center justify-center gap-3">
                            <FileText className="h-5 w-5 text-[#FF6B1A]" />
                            <span className="text-sm truncate max-w-[220px]" style={{ color: T.muted }}>{form.file.name}</span>
                            <button onClick={(e) => { e.stopPropagation(); set("file", null) }}>
                              <X className="h-4 w-4" style={{ color: T.muted }} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <Upload className="h-6 w-6 mx-auto mb-2" style={{ color: T.subtle }} />
                            <p className="text-sm" style={{ color: T.muted }}>Drag & drop PDF, ZIP, or MP4</p>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {form.type === "OFFLINE" && (
                    <div>
                      <label className="text-xs font-medium mb-1 flex items-center gap-1.5" style={{ color: T.muted }}>
                        <QrCode className="h-3.5 w-3.5" /> Payment QR Code
                        <span className="font-normal" style={{ color: T.subtle }}>(optional)</span>
                      </label>
                      <p className="text-xs mb-3" style={{ color: T.subtle }}>Buyers will see this after sending a request</p>
                      <div
                        className="rounded-2xl p-6 text-center transition-all cursor-pointer border-2 border-dashed"
                        style={{
                          borderColor: T.border,
                          background: T.surface2,
                        }}
                        onClick={() => document.getElementById("qr-upload")?.click()}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(255,107,26,0.35)")}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = T.border)}
                      >
                        <input id="qr-upload" type="file" accept="image/*" className="hidden"
                          onChange={(e) => set("qrCode", e.target.files?.[0] ?? null)}
                        />
                        {form.qrCode ? (
                          <div className="flex items-center justify-center gap-4">
                            <img src={URL.createObjectURL(form.qrCode)} alt="QR Preview"
                              className="w-20 h-20 object-contain rounded-xl"
                              style={{ border: `var(--border-width) solid ${T.border}` }}
                            />
                            <div className="text-left">
                              <p className="text-sm font-medium truncate max-w-[140px]" style={{ color: T.text }}>{form.qrCode.name}</p>
                              <button
                                onClick={(e) => { e.stopPropagation(); set("qrCode", null) }}
                                className="text-xs text-red-400 hover:text-red-300 mt-1"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <QrCode className="h-6 w-6 mx-auto mb-2" style={{ color: T.subtle }} />
                            <p className="text-sm" style={{ color: T.muted }}>Upload your UPI / payment QR image</p>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 4: Review */}
              {step === 4 && (
                <motion.div key="step4"
                  initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -32 }}
                  transition={{ duration: 0.28 }} className="space-y-4">

                  <div
                    className="rounded-2xl overflow-hidden"
                    style={{ border: `var(--border-width) solid ${T.border}`, background: T.surface2 }}
                  >
                    {form.images[0] ? (
                      <img src={URL.createObjectURL(form.images[0])} alt="preview" className="w-full h-48 object-cover" />
                    ) : (
                      <div className="w-full h-32 flex items-center justify-center" style={{ background: T.surface3 }}>
                        {form.type === "OFFLINE"
                          ? <Package className="h-10 w-10" style={{ color: T.subtle }} />
                          : <FileText className="h-10 w-10" style={{ color: T.subtle }} />}
                      </div>
                    )}
                    <div className="p-5 space-y-3">
                      <div className="flex gap-2 flex-wrap">
                        <span
                          className="text-[10px] font-semibold px-2.5 py-1 rounded-full border"
                          style={{
                            background: form.type === "ONLINE" ? "rgba(255,107,26,0.15)" : "rgba(245,158,11,0.15)",
                            color: form.type === "ONLINE" ? "#FF6B1A" : "#f59e0b",
                            borderColor: form.type === "ONLINE" ? "rgba(255,107,26,0.25)" : "rgba(245,158,11,0.25)",
                          }}
                        >{form.type}</span>
                        {form.category && (
                          <span
                            className="text-[10px] font-semibold px-2.5 py-1 rounded-full border"
                            style={{ background: T.surface3, color: T.muted, borderColor: T.border }}
                          >
                            {form.category}
                          </span>
                        )}
                        {form.condition && form.type === "OFFLINE" && (
                          <span
                            className="text-[10px] font-semibold px-2.5 py-1 rounded-full border"
                            style={{ background: T.surface3, color: T.muted, borderColor: T.border }}
                          >
                            {form.condition}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-lg" style={{ color: T.text }}>{form.title}</h3>
                      <p className="text-sm line-clamp-3" style={{ color: T.muted }}>{form.description}</p>
                      <div
                        className="pt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs"
                        style={{ borderTop: `var(--border-width) solid ${T.border}`, color: T.muted }}
                      >
                        <span className="font-semibold text-sm" style={{ color: T.text }}>
                          {form.isFree ? "Free" : form.price ? `₹${form.price}` : "—"}
                        </span>
                        {form.subject && <span>{form.subject}</span>}
                        {form.semester && <span>Sem {form.semester}</span>}
                        <span>{form.images.length} image{form.images.length !== 1 ? "s" : ""}</span>
                        {form.file && <span>1 file attached</span>}
                        {form.qrCode && <span>QR attached</span>}
                      </div>
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl px-4 py-3"
                      style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
                    >
                      <p className="text-xs text-red-400">{error}</p>
                    </motion.div>
                  )}
                </motion.div>
              )}

            </AnimatePresence>

            {/* Footer nav */}
            <div
              className="flex items-center justify-between mt-10 pt-6"
              style={{ borderTop: `var(--border-width) solid ${T.border}` }}
            >
              <button
                onClick={() => step > 1 ? setStep((s) => (s - 1) as Step) : navigate(-1)}
                className="flex items-center gap-2 text-sm font-medium transition-colors"
                style={{ color: T.muted }}
                onMouseEnter={(e) => (e.currentTarget.style.color = T.text)}
                onMouseLeave={(e) => (e.currentTarget.style.color = T.muted)}
              >
                <ChevronLeft className="h-4 w-4" />
                {step > 1 ? "Back" : "Cancel"}
              </button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                disabled={!canNext() || isSubmitting}
                onClick={() => {
                  if (step < 4) setStep((s) => (s + 1) as Step)
                  else void handleSubmit()
                }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed text-white"
                style={{
                  background: canNext() && !isSubmitting
                    ? "linear-gradient(135deg, #FF6B1A, #e8611c)"
                    : "rgba(255,107,26,0.3)",
                }}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : step < 4 ? (
                  <>Continue <ChevronRight className="h-4 w-4" /></>
                ) : (
                  <>Publish Listing <Check className="h-4 w-4" /></>
                )}
              </motion.button>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
