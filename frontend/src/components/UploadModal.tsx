import { useState, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X, Package, FileText, Upload, ChevronRight, ChevronLeft,
  Check, Loader2, ImagePlus, FilePlus, Tag, DollarSign, Info
} from "lucide-react"
import { Button } from "./ui/Button"
import { useAuth } from "../contexts/AuthContext"
import { cn } from "../lib/utils"

const API_URL = (import.meta.env["VITE_API_URL"] as string) ?? "http://localhost:3000"

const CATEGORIES_ONLINE = ["Notes", "Books", "Software", "Tutorials", "Mock Tests", "Projects"]
const CATEGORIES_OFFLINE = ["Books", "Hardware", "Cycles", "Equipment", "Lab Tools", "Furniture"]

interface UploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  defaultType?: "ONLINE" | "OFFLINE"
}

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
}

const STEPS = [
  { label: "Type", icon: Tag },
  { label: "Details", icon: Info },
  { label: "Upload", icon: Upload },
  { label: "Review", icon: Check },
]

export function UploadModal({ isOpen, onClose, onSuccess, defaultType }: UploadModalProps) {
  const { token } = useAuth()
  const [step, setStep] = useState<Step>(defaultType ? 2 : 1)
  const [form, setForm] = useState<FormData>({
    type: defaultType ?? "OFFLINE",
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
  })
  const [isDragging, setIsDragging] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const imageDrop = useRef<HTMLDivElement>(null)
  const fileDrop = useRef<HTMLDivElement>(null)

  const set = (key: keyof FormData, val: unknown) =>
    setForm((f) => ({ ...f, [key]: val }))

  // Drag-and-drop handlers
  const handleDrop = useCallback(
    (e: React.DragEvent, field: "images" | "file") => {
      e.preventDefault()
      setIsDragging(false)
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

      const res = await fetch(`${API_URL}/api/listings`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })

      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? "Failed to create listing")
      }

      setSuccess(true)
      setTimeout(() => {
        onSuccess?.()
        handleClose()
      }, 1800)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setStep(defaultType ? 2 : 1)
    setForm({
      type: defaultType ?? "OFFLINE",
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
    })
    setError(null)
    setSuccess(false)
    onClose()
  }

  const canNext = () => {
    if (step === 1) return true
    if (step === 2) return form.title.trim().length > 2 && form.description.trim().length > 5 && !!form.category
    if (step === 3) return true // files optional
    return true
  }

  const categories = form.type === "ONLINE" ? CATEGORIES_ONLINE : CATEGORIES_OFFLINE

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 24 }}
          transition={{ type: "spring", bounce: 0, duration: 0.35 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-xl bg-zinc-950 border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/[0.06]">
            <div>
              <h2 className="text-lg font-semibold text-white">Create Listing</h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                {form.type === "ONLINE" ? "Online / Digital resource" : "Hardware / Physical item"}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="h-8 w-8 rounded-xl bg-zinc-800/80 flex items-center justify-center hover:bg-zinc-700 transition-colors"
            >
              <X className="h-4 w-4 text-zinc-400" />
            </button>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-0 px-6 py-3 bg-zinc-900/40 border-b border-white/[0.04]">
            {STEPS.map((s, i) => {
              const num = (i + 1) as Step
              const active = step === num
              const done = step > num
              return (
                <div key={s.label} className="flex items-center">
                  <div
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all",
                      active && "bg-[#00fcb5]/15 text-[#00fcb5]",
                      done && "text-zinc-400",
                      !active && !done && "text-zinc-600"
                    )}
                  >
                    {done ? (
                      <Check className="h-3 w-3 text-[#00fcb5]" />
                    ) : (
                      <s.icon className="h-3 w-3" />
                    )}
                    {s.label}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={cn("w-6 h-px mx-0.5", step > num ? "bg-[#00fcb5]/40" : "bg-zinc-800")} />
                  )}
                </div>
              )
            })}
          </div>

          {/* Body */}
          <div className="px-6 py-5 min-h-[340px]">
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center h-64 gap-4"
                >
                  <div className="w-16 h-16 rounded-full bg-[#00fcb5]/15 flex items-center justify-center">
                    <Check className="h-8 w-8 text-[#00fcb5]" />
                  </div>
                  <p className="text-lg font-semibold text-white">Listing Published!</p>
                  <p className="text-sm text-zinc-500">Your listing is now live on the marketplace.</p>
                </motion.div>
              ) : step === 1 ? (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <p className="text-sm text-zinc-400 mb-4">What kind of item are you selling?</p>
                  <div className="grid grid-cols-2 gap-4">
                    {(["OFFLINE", "ONLINE"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => { set("type", t); set("category", "") }}
                        className={cn(
                          "flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all duration-200",
                          form.type === t
                            ? "border-[#00fcb5]/60 bg-[#00fcb5]/[0.06] shadow-[0_0_20px_rgba(0,252,181,0.1)]"
                            : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700"
                        )}
                      >
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center",
                          form.type === t ? "bg-[#00fcb5]/20" : "bg-zinc-800"
                        )}>
                          {t === "OFFLINE" ? (
                            <Package className={cn("h-6 w-6", form.type === t ? "text-[#00fcb5]" : "text-zinc-500")} />
                          ) : (
                            <FileText className={cn("h-6 w-6", form.type === t ? "text-[#00fcb5]" : "text-zinc-500")} />
                          )}
                        </div>
                        <div>
                          <p className={cn("font-semibold text-sm", form.type === t ? "text-[#00fcb5]" : "text-zinc-300")}>
                            {t === "OFFLINE" ? "Hardware Item" : "Online Resource"}
                          </p>
                          <p className="text-xs text-zinc-600 mt-0.5">
                            {t === "OFFLINE" ? "Books, cycles, equipment…" : "Notes, PDFs, software…"}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : step === 2 ? (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Title *</label>
                    <input
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#00fcb5]/50 focus:ring-1 focus:ring-[#00fcb5]/30 transition-all"
                      placeholder="e.g. Engineering Physics Notes Sem 3"
                      value={form.title}
                      onChange={(e) => set("title", e.target.value)}
                    />
                  </div>
                  {/* Description */}
                  <div>
                    <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Description *</label>
                    <textarea
                      rows={3}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#00fcb5]/50 focus:ring-1 focus:ring-[#00fcb5]/30 transition-all resize-none"
                      placeholder="Describe the item, condition, contents…"
                      value={form.description}
                      onChange={(e) => set("description", e.target.value)}
                    />
                  </div>
                  {/* Category */}
                  <div>
                    <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Category *</label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => set("category", cat)}
                          className={cn(
                            "px-3 py-1 rounded-full text-xs font-medium border transition-all",
                            form.category === cat
                              ? "bg-[#00fcb5]/15 border-[#00fcb5]/50 text-[#00fcb5]"
                              : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600"
                          )}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Row: subject + semester */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Subject</label>
                      <input
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#00fcb5]/50 transition-all"
                        placeholder="e.g. Physics"
                        value={form.subject}
                        onChange={(e) => set("subject", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Semester</label>
                      <input
                        type="number"
                        min="1"
                        max="8"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#00fcb5]/50 transition-all"
                        placeholder="1–8"
                        value={form.semester}
                        onChange={(e) => set("semester", e.target.value)}
                      />
                    </div>
                  </div>
                  {/* Price */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-zinc-400">Price</label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div
                          onClick={() => set("isFree", !form.isFree)}
                          className={cn(
                            "relative w-9 h-5 rounded-full transition-colors",
                            form.isFree ? "bg-[#00fcb5]" : "bg-zinc-700"
                          )}
                        >
                          <div className={cn(
                            "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                            form.isFree ? "translate-x-4" : "translate-x-0"
                          )} />
                        </div>
                        <span className="text-xs text-zinc-400">Free</span>
                      </label>
                    </div>
                    {!form.isFree && (
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                        <input
                          type="number"
                          min="0"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-8 pr-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#00fcb5]/50 transition-all"
                          placeholder="0.00"
                          value={form.price}
                          onChange={(e) => set("price", e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                  {/* Condition (offline only) */}
                  {form.type === "OFFLINE" && (
                    <div>
                      <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Condition</label>
                      <div className="flex gap-2">
                        {["Like New", "Good", "Fair", "Poor"].map((c) => (
                          <button
                            key={c}
                            onClick={() => set("condition", c)}
                            className={cn(
                              "px-3 py-1 rounded-full text-xs font-medium border transition-all",
                              form.condition === c
                                ? "bg-[#00fcb5]/15 border-[#00fcb5]/50 text-[#00fcb5]"
                                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600"
                            )}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : step === 3 ? (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20}}
                  className="space-y-5">
                  {/* Image upload */}
                  <div>
                    <label className="text-xs font-medium text-zinc-400 mb-2 block flex items-center gap-1.5">
                      <ImagePlus className="h-3.5 w-3.5" /> Images (up to 5)
                    </label>
                    <div
                      ref={imageDrop}
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => handleDrop(e, "images")}
                      className={cn(
                        "border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer",
                        isDragging ? "border-[#00fcb5]/60 bg-[#00fcb5]/[0.04]" : "border-zinc-800 hover:border-zinc-700"
                      )}
                      onClick={() => document.getElementById("img-upload")?.click()}
                    >
                      <input
                        id="img-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files ?? []).slice(0, 5)
                          set("images", [...form.images, ...files].slice(0, 5))
                        }}
                      />
                      <Upload className="h-5 w-5 text-zinc-600 mx-auto mb-1.5" />
                      <p className="text-xs text-zinc-500">Drag & drop or click to upload images</p>
                    </div>
                    {form.images.length > 0 && (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {form.images.map((img, idx) => (
                          <div key={idx} className="relative group">
                            <img
                              src={URL.createObjectURL(img)}
                              alt=""
                              className="w-16 h-16 object-cover rounded-lg border border-zinc-700"
                            />
                            <button
                              onClick={() => removeImage(idx)}
                              className="absolute -top-1.5 -right-1.5 h-4.5 w-4.5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-2.5 w-2.5 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* File upload (online only) */}
                  {form.type === "ONLINE" && (
                    <div>
                      <label className="text-xs font-medium text-zinc-400 mb-2 block flex items-center gap-1.5">
                        <FilePlus className="h-3.5 w-3.5" /> Resource File (PDF, ZIP…)
                      </label>
                      <div
                        ref={fileDrop}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDrop(e, "file")}
                        className="border-2 border-dashed border-zinc-800 hover:border-zinc-700 rounded-xl p-4 text-center transition-all cursor-pointer"
                        onClick={() => document.getElementById("file-upload")?.click()}
                      >
                        <input
                          id="file-upload"
                          type="file"
                          accept=".pdf,.zip,.mp4"
                          className="hidden"
                          onChange={(e) => set("file", e.target.files?.[0] ?? null)}
                        />
                        {form.file ? (
                          <div className="flex items-center justify-center gap-2">
                            <FileText className="h-4 w-4 text-[#00fcb5]" />
                            <span className="text-xs text-zinc-300 truncate max-w-[200px]">{form.file.name}</span>
                            <button onClick={(e) => { e.stopPropagation(); set("file", null) }}>
                              <X className="h-3.5 w-3.5 text-zinc-500 hover:text-red-400" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <Upload className="h-5 w-5 text-zinc-600 mx-auto mb-1.5" />
                            <p className="text-xs text-zinc-500">Drag & drop PDF, ZIP, or MP4</p>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                /* Step 4 — Review */
                <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20}}
                  className="space-y-4">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
                    <div className="flex gap-2">
                      <span className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                        form.type === "ONLINE"
                          ? "bg-blue-500/15 text-blue-400 border-blue-500/20"
                          : "bg-amber-500/15 text-amber-400 border-amber-500/20"
                      )}>
                        {form.type}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400">
                        {form.category}
                      </span>
                    </div>
                    <h3 className="font-semibold text-white">{form.title}</h3>
                    <p className="text-xs text-zinc-500 line-clamp-3">{form.description}</p>
                    <div className="flex items-center gap-4 text-xs text-zinc-500 pt-1 border-t border-zinc-800">
                      <span>💰 {form.isFree ? "Free" : `₹${form.price}`}</span>
                      {form.subject && <span>📚 {form.subject}</span>}
                      {form.semester && <span>📅 Sem {form.semester}</span>}
                      {form.condition && form.type === "OFFLINE" && <span>🏷️ {form.condition}</span>}
                      <span>🖼️ {form.images.length} image{form.images.length !== 1 ? "s" : ""}</span>
                      {form.file && <span>📎 1 file</span>}
                    </div>
                  </div>
                  {error && (
                    <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
                      <p className="text-xs text-red-400">{error}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          {!success && (
            <div className="flex items-center justify-between px-6 pb-5 border-t border-white/[0.06] pt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => step > 1 ? setStep((s) => (s - 1) as Step) : handleClose()}
                className="text-zinc-500"
              >
                {step > 1 ? <><ChevronLeft className="h-4 w-4 mr-1" /> Back</> : "Cancel"}
              </Button>

              <Button
                size="sm"
                disabled={!canNext() || isSubmitting}
                onClick={() => {
                  if (step < 4) setStep((s) => (s + 1) as Step)
                  else handleSubmit()
                }}
                className="min-w-[110px]"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : step < 4 ? (
                  <>Continue <ChevronRight className="h-4 w-4 ml-1" /></>
                ) : (
                  <>Publish <Check className="h-4 w-4 ml-1" /></>
                )}
              </Button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
