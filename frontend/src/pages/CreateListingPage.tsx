import { useState, useCallback, useRef } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Package, FileText, Upload, ChevronRight, ChevronLeft,
  Check, Loader2, ImagePlus, FilePlus, Tag, Info, QrCode,
  DollarSign, X, ArrowLeft, Sparkles
} from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { cn } from "../lib/utils"
import BechoLogo from "../components/BechoLogo"

const API_URL = (import.meta.env["VITE_API_URL"] as string) ?? "http://localhost:3000"

const CATEGORIES_ONLINE = ["Notes", "Books", "Software", "Tutorials", "Mock Tests", "Projects"]
const CATEGORIES_OFFLINE = ["Books", "Hardware", "Cycles", "Equipment", "Lab Tools", "Furniture"]

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

export default function CreateListingPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { getAccessToken } = useAuth()

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

  // ── Success Screen ──────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#080808" }}>
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
            <p className="text-3xl font-bold text-white mb-2">Listing Published!</p>
            <p className="text-zinc-400 text-sm">Your listing is now live on Becho marketplace.</p>
          </div>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "200px" }}
            transition={{ duration: 2.8, ease: "linear" }}
            className="h-0.5 rounded-full"
            style={{ background: "linear-gradient(to right, #FF6B1A, #f59e0b)" }}
          />
          <p className="text-xs text-zinc-600">Redirecting to dashboard…</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex" style={{ background: "#080808" }}>

      {/* ── LEFT PANEL ─────────────────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col w-[340px] xl:w-[380px] flex-shrink-0 relative overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #0f0f0f 0%, #111 60%, #130e08 100%)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Ambient glows */}
        <div className="absolute top-0 left-0 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(255,107,26,0.08) 0%, transparent 70%)", transform: "translate(-30%,-30%)" }} />
        <div className="absolute bottom-0 right-0 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(245,158,11,0.05) 0%, transparent 70%)", transform: "translate(30%,30%)" }} />

        {/* Back */}
        <div className="px-8 pt-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            Back
          </button>
        </div>

        {/* Logo */}
        <div className="px-8 pt-6 pb-2">
          <BechoLogo size={32} showWordmark />
        </div>

        {/* Heading */}
        <div className="px-8 pt-6 pb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Create a Listing</h1>
          <p className="text-sm text-zinc-500">
            {form.type === "ONLINE" ? "Online / Digital resource" : "Hardware / Physical item"}
          </p>
        </div>

        {/* Vertical stepper */}
        <div className="px-8 flex-1">
          <div className="relative">
            <div className="absolute left-[18px] top-6 bottom-6 w-px" style={{ background: "rgba(255,255,255,0.06)" }} />
            <motion.div
              className="absolute left-[18px] top-6 w-px origin-top"
              style={{ background: "linear-gradient(to bottom, #FF6B1A, #f59e0b)" }}
              animate={{ height: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
              transition={{ type: "spring", stiffness: 200, damping: 28 }}
            />
            <div className="space-y-8">
              {STEPS.map((s, i) => {
                const num = (i + 1) as Step
                const active = step === num
                const done = step > num
                return (
                  <div key={s.label} className="relative flex items-start gap-4">
                    <motion.div
                      className="relative z-10 w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                      animate={{
                        background: done ? "rgba(255,107,26,0.25)" : active ? "rgba(255,107,26,0.18)" : "rgba(255,255,255,0.04)",
                        borderColor: done || active ? "rgba(255,107,26,0.5)" : "rgba(255,255,255,0.08)",
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
                            <s.icon className={cn("h-4 w-4", active ? "text-[#FF6B1A]" : "text-zinc-600")} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                    <div className="pt-1.5">
                      <p className={cn("text-sm font-semibold transition-colors", active ? "text-white" : done ? "text-zinc-400" : "text-zinc-600")}>
                        {s.label}
                      </p>
                      <p className={cn("text-xs mt-0.5 transition-colors", active ? "text-zinc-400" : "text-zinc-700")}>
                        {s.desc}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Live preview card */}
        <AnimatePresence>
          {step >= 2 && form.title && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="mx-8 mb-8 rounded-2xl overflow-hidden"
              style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)" }}
            >
              {form.images[0] ? (
                <img src={URL.createObjectURL(form.images[0])} alt="preview" className="w-full h-28 object-cover" />
              ) : (
                <div className="w-full h-28 flex items-center justify-center" style={{ background: "rgba(255,107,26,0.04)" }}>
                  {form.type === "OFFLINE" ? <Package className="h-8 w-8 text-zinc-700" /> : <FileText className="h-8 w-8 text-zinc-700" />}
                </div>
              )}
              <div className="p-3">
                <p className="text-xs font-semibold text-white truncate">{form.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  {form.category && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(255,107,26,0.15)", color: "#FF6B1A" }}>
                      {form.category}
                    </span>
                  )}
                  <span className="text-[10px] text-zinc-500">{form.isFree ? "Free" : form.price ? `₹${form.price}` : "—"}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tip for step 1 */}
        {step === 1 && (
          <div className="mx-8 mb-8 flex items-start gap-3 rounded-2xl p-4"
            style={{ background: "rgba(255,107,26,0.06)", border: "1px solid rgba(255,107,26,0.12)" }}>
            <Sparkles className="h-4 w-4 text-[#FF6B1A] mt-0.5 flex-shrink-0" />
            <p className="text-xs text-zinc-500 leading-relaxed">
              Listings with clear photos and complete descriptions sell <span className="text-zinc-300 font-medium">3× faster</span> on Becho.
            </p>
          </div>
        )}
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen">

        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <BechoLogo size={28} showWordmark />
          <div className="w-16" />
        </div>

        {/* Mobile step pills */}
        <div className="lg:hidden flex items-center gap-1.5 px-5 py-3 overflow-x-auto"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          {STEPS.map((s, i) => {
            const num = (i + 1) as Step
            const active = step === num
            const done = step > num
            return (
              <div key={s.label} className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                active && "bg-[#FF6B1A]/15 text-[#FF6B1A]",
                done && "text-zinc-500",
                !active && !done && "text-zinc-700"
              )}>
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
                <h2 className="text-2xl font-bold text-white">{STEPS[step - 1].label}</h2>
                <p className="text-sm text-zinc-500 mt-1">{STEPS[step - 1].desc}</p>
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
                        className={cn(
                          "flex flex-col items-center gap-4 p-7 rounded-2xl border-2 transition-all duration-200 group",
                          form.type === t
                            ? "border-[#FF6B1A]/60 bg-[#FF6B1A]/[0.06] shadow-[0_0_40px_rgba(255,107,26,0.08)]"
                            : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]"
                        )}
                      >
                        <div className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
                          form.type === t ? "bg-[#FF6B1A]/20" : "bg-white/[0.05] group-hover:bg-white/[0.08]"
                        )}>
                          {t === "OFFLINE"
                            ? <Package className={cn("h-7 w-7", form.type === t ? "text-[#FF6B1A]" : "text-zinc-500")} />
                            : <FileText className={cn("h-7 w-7", form.type === t ? "text-[#FF6B1A]" : "text-zinc-500")} />}
                        </div>
                        <div className="text-center">
                          <p className={cn("font-semibold text-sm", form.type === t ? "text-[#FF6B1A]" : "text-zinc-300")}>
                            {t === "OFFLINE" ? "Hardware Item" : "Online Resource"}
                          </p>
                          <p className="text-xs text-zinc-600 mt-1">
                            {t === "OFFLINE" ? "Books, cycles, equipment" : "Notes, PDFs, software"}
                          </p>
                        </div>
                        {form.type === t && (
                          <motion.div layoutId="type-check"
                            className="w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ background: "rgba(255,107,26,0.25)" }}>
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
                    <label className="text-xs font-medium text-zinc-400 mb-2 block">Title *</label>
                    <input
                      className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-all"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(255,107,26,0.4)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(255,107,26,0.08)" }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.boxShadow = "none" }}
                      placeholder="e.g. Engineering Physics Notes Sem 3"
                      value={form.title} onChange={(e) => set("title", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-zinc-400 mb-2 block">Description *</label>
                    <textarea
                      rows={4}
                      className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-all resize-none"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(255,107,26,0.4)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(255,107,26,0.08)" }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.boxShadow = "none" }}
                      placeholder="Describe the item, condition, contents…"
                      value={form.description} onChange={(e) => set("description", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-zinc-400 mb-2 block">Category *</label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((cat) => (
                        <button key={cat} onClick={() => set("category", cat)}
                          className={cn(
                            "px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all",
                            form.category === cat
                              ? "bg-[#FF6B1A]/15 border-[#FF6B1A]/50 text-[#FF6B1A]"
                              : "bg-white/[0.03] border-white/[0.08] text-zinc-400 hover:border-white/[0.16] hover:text-zinc-200"
                          )}>
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-zinc-400 mb-2 block">
                        Subject <span className="text-zinc-700 font-normal">(optional)</span>
                      </label>
                      <input
                        className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-all"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(255,107,26,0.4)" }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)" }}
                        placeholder="e.g. Physics"
                        value={form.subject} onChange={(e) => set("subject", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-zinc-400 mb-2 block">
                        Semester <span className="text-zinc-700 font-normal">(optional)</span>
                      </label>
                      <input
                        type="number" min="1" max="8"
                        className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-all"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(255,107,26,0.4)" }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)" }}
                        placeholder="1 – 8"
                        value={form.semester} onChange={(e) => set("semester", e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-medium text-zinc-400">Price</label>
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <div
                          onClick={() => set("isFree", !form.isFree)}
                          className={cn("relative w-9 h-5 rounded-full transition-colors cursor-pointer", form.isFree ? "bg-[#FF6B1A]" : "bg-zinc-800")}
                        >
                          <div className={cn("absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform", form.isFree ? "translate-x-4" : "translate-x-0")} />
                        </div>
                        <span className="text-xs text-zinc-400">Free</span>
                      </label>
                    </div>
                    {!form.isFree && (
                      <div className="relative">
                        <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                        <input
                          type="number" min="0"
                          className="w-full rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-all"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                          onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(255,107,26,0.4)" }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)" }}
                          placeholder="0.00"
                          value={form.price} onChange={(e) => set("price", e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  {form.type === "OFFLINE" && (
                    <div>
                      <label className="text-xs font-medium text-zinc-400 mb-2 block">Condition</label>
                      <div className="flex gap-2 flex-wrap">
                        {["Like New", "Good", "Fair", "Poor"].map((c) => (
                          <button key={c} onClick={() => set("condition", c)}
                            className={cn(
                              "px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all",
                              form.condition === c
                                ? "bg-[#FF6B1A]/15 border-[#FF6B1A]/50 text-[#FF6B1A]"
                                : "bg-white/[0.03] border-white/[0.08] text-zinc-400 hover:border-white/[0.16]"
                            )}>
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
                    <label className="text-xs font-medium text-zinc-400 mb-3 flex items-center gap-1.5">
                      <ImagePlus className="h-3.5 w-3.5" /> Images <span className="text-zinc-700 font-normal">(up to 5)</span>
                    </label>
                    <div
                      ref={imageDrop}
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => handleDrop(e, "images")}
                      onClick={() => document.getElementById("img-upload")?.click()}
                      className={cn(
                        "rounded-2xl p-8 text-center transition-all cursor-pointer border-2 border-dashed",
                        isDragging ? "border-[#FF6B1A]/60 bg-[#FF6B1A]/[0.04]" : "border-white/[0.07] hover:border-white/[0.14] hover:bg-white/[0.02]"
                      )}
                    >
                      <input id="img-upload" type="file" accept="image/*" multiple className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files ?? []).slice(0, 5)
                          set("images", [...form.images, ...files].slice(0, 5))
                        }}
                      />
                      <Upload className="h-6 w-6 text-zinc-600 mx-auto mb-3" />
                      <p className="text-sm text-zinc-400 font-medium">Drag & drop images here</p>
                      <p className="text-xs text-zinc-600 mt-1">or click to browse</p>
                    </div>
                    {form.images.length > 0 && (
                      <div className="flex gap-3 mt-3 flex-wrap">
                        {form.images.map((img, idx) => (
                          <div key={idx} className="relative group">
                            <img
                              src={URL.createObjectURL(img)} alt=""
                              className="w-20 h-20 object-cover rounded-xl"
                              style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                            />
                            <button onClick={() => removeImage(idx)}
                              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <X className="h-3 w-3 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {form.type === "ONLINE" && (
                    <div>
                      <label className="text-xs font-medium text-zinc-400 mb-3 flex items-center gap-1.5">
                        <FilePlus className="h-3.5 w-3.5" /> Resource File <span className="text-zinc-700 font-normal">(PDF, ZIP, MP4)</span>
                      </label>
                      <div
                        onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true) }}
                        onDragLeave={() => setIsDraggingFile(false)}
                        onDrop={(e) => handleDrop(e, "file")}
                        onClick={() => document.getElementById("file-upload")?.click()}
                        className={cn(
                          "rounded-2xl p-6 text-center transition-all cursor-pointer border-2 border-dashed",
                          isDraggingFile ? "border-[#FF6B1A]/60 bg-[#FF6B1A]/[0.04]" : "border-white/[0.07] hover:border-white/[0.14]"
                        )}
                      >
                        <input id="file-upload" type="file" accept=".pdf,.zip,.mp4" className="hidden"
                          onChange={(e) => set("file", e.target.files?.[0] ?? null)}
                        />
                        {form.file ? (
                          <div className="flex items-center justify-center gap-3">
                            <FileText className="h-5 w-5 text-[#FF6B1A]" />
                            <span className="text-sm text-zinc-300 truncate max-w-[220px]">{form.file.name}</span>
                            <button onClick={(e) => { e.stopPropagation(); set("file", null) }}>
                              <X className="h-4 w-4 text-zinc-500 hover:text-red-400" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <Upload className="h-6 w-6 text-zinc-600 mx-auto mb-2" />
                            <p className="text-sm text-zinc-400">Drag & drop PDF, ZIP, or MP4</p>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {form.type === "OFFLINE" && (
                    <div>
                      <label className="text-xs font-medium text-zinc-400 mb-1 flex items-center gap-1.5">
                        <QrCode className="h-3.5 w-3.5" /> Payment QR Code
                        <span className="text-zinc-700 font-normal">(optional)</span>
                      </label>
                      <p className="text-xs text-zinc-700 mb-3">Buyers will see this after sending a request</p>
                      <div
                        className="rounded-2xl p-6 text-center transition-all cursor-pointer border-2 border-dashed border-white/[0.07] hover:border-[#FF6B1A]/30"
                        onClick={() => document.getElementById("qr-upload")?.click()}
                      >
                        <input id="qr-upload" type="file" accept="image/*" className="hidden"
                          onChange={(e) => set("qrCode", e.target.files?.[0] ?? null)}
                        />
                        {form.qrCode ? (
                          <div className="flex items-center justify-center gap-4">
                            <img src={URL.createObjectURL(form.qrCode)} alt="QR Preview"
                              className="w-20 h-20 object-contain rounded-xl"
                              style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                            />
                            <div className="text-left">
                              <p className="text-sm text-zinc-300 font-medium truncate max-w-[140px]">{form.qrCode.name}</p>
                              <button onClick={(e) => { e.stopPropagation(); set("qrCode", null) }}
                                className="text-xs text-red-400 hover:text-red-300 mt-1">
                                Remove
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <QrCode className="h-6 w-6 text-zinc-600 mx-auto mb-2" />
                            <p className="text-sm text-zinc-400">Upload your UPI / payment QR image</p>
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

                  <div className="rounded-2xl overflow-hidden"
                    style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
                    {form.images[0] ? (
                      <img src={URL.createObjectURL(form.images[0])} alt="preview" className="w-full h-48 object-cover" />
                    ) : (
                      <div className="w-full h-32 flex items-center justify-center" style={{ background: "rgba(255,107,26,0.05)" }}>
                        {form.type === "OFFLINE" ? <Package className="h-10 w-10 text-zinc-700" /> : <FileText className="h-10 w-10 text-zinc-700" />}
                      </div>
                    )}
                    <div className="p-5 space-y-3">
                      <div className="flex gap-2 flex-wrap">
                        <span className={cn(
                          "text-[10px] font-semibold px-2.5 py-1 rounded-full border",
                          form.type === "ONLINE"
                            ? "bg-[#FF6B1A]/15 text-[#FF6B1A] border-[#FF6B1A]/20"
                            : "bg-amber-500/15 text-amber-400 border-amber-500/20"
                        )}>{form.type}</span>
                        {form.category && (
                          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-white/[0.06] text-zinc-400 border border-white/[0.06]">
                            {form.category}
                          </span>
                        )}
                        {form.condition && form.type === "OFFLINE" && (
                          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-white/[0.06] text-zinc-400 border border-white/[0.06]">
                            {form.condition}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-white text-lg">{form.title}</h3>
                      <p className="text-sm text-zinc-500 line-clamp-3">{form.description}</p>
                      <div className="pt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-zinc-500"
                        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                        <span className="text-zinc-300 font-semibold text-sm">
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
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl px-4 py-3"
                      style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                      <p className="text-xs text-red-400">{error}</p>
                    </motion.div>
                  )}
                </motion.div>
              )}

            </AnimatePresence>

            {/* Footer nav */}
            <div className="flex items-center justify-between mt-10 pt-6"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <button
                onClick={() => step > 1 ? setStep((s) => (s - 1) as Step) : navigate(-1)}
                className="flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
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
