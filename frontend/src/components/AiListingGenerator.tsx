// src/components/AiListingGenerator.tsx — "Generate with AI" for listing creation
// Shows a modal to generate title, description, category, tags using Gemini.

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Loader2, X, Check, Wand2 } from "lucide-react"
import { apiFetch } from "../lib/api"

// ─── Types ─────────────────────────────────────────────────────

interface GeneratedListing {
  title: string
  description: string
  category: string
  tags: string[]
}

interface AiListingGeneratorProps {
  /** Called when user accepts the generated content */
  onApply: (data: GeneratedListing) => void
  /** Current condition from the form */
  currentCondition?: string
}

// ─── Component ─────────────────────────────────────────────────

export default function AiListingGenerator({ onApply, currentCondition }: AiListingGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [productName, setProductName] = useState("")
  const [details, setDetails] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<GeneratedListing | null>(null)

  const condition = currentCondition || "Good"

  const handleGenerate = async () => {
    if (!productName.trim()) return
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const data = await apiFetch<{ listing: GeneratedListing }>("/api/ai/generate-listing", {
        method: "POST",
        body: JSON.stringify({
          name: productName.trim(),
          condition,
          details: details.trim(),
        }),
      })
      setResult(data.listing)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate. Try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleApply = () => {
    if (!result) return
    onApply(result)
    setIsOpen(false)
    // Reset for next use
    setProductName("")
    setDetails("")
    setResult(null)
    setError(null)
  }

  const handleClose = () => {
    setIsOpen(false)
    setResult(null)
    setError(null)
  }

  // Input styles matching CreateListingPage
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
    e.currentTarget.style.borderColor = ""
    e.currentTarget.style.boxShadow = "none"
  }

  return (
    <>
      {/* Trigger button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(true)}
        type="button"
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all"
        style={{
          background: "linear-gradient(135deg, rgba(255,107,26,0.12) 0%, rgba(245,158,11,0.08) 100%)",
          border: "1px solid rgba(255,107,26,0.25)",
          color: "#FF6B1A",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "rgba(255,107,26,0.5)"
          e.currentTarget.style.boxShadow = "0 0 20px rgba(255,107,26,0.1)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "rgba(255,107,26,0.25)"
          e.currentTarget.style.boxShadow = "none"
        }}
        id="becho-ai-generate-btn"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Generate with AI
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="w-full max-w-md rounded-2xl overflow-hidden"
              style={{
                background: "var(--bg)",
                border: "var(--border-width) solid var(--border)",
                boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
              }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: "var(--border-width) solid var(--border)" }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, rgba(255,107,26,0.18), rgba(245,158,11,0.10))",
                      border: "1px solid rgba(255,107,26,0.25)",
                    }}
                  >
                    <Wand2 className="h-4 w-4 text-[#FF6B1A]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                      AI Listing Generator
                    </h3>
                    <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                      Powered by Gemini
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                  style={{ background: "var(--surface-2)" }}
                >
                  <X className="h-3.5 w-3.5" style={{ color: "var(--text-muted)" }} />
                </button>
              </div>

              {/* Body */}
              <div className="px-5 py-5 space-y-4">
                {!result ? (
                  <>
                    {/* Input form */}
                    <div>
                      <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-muted)" }}>
                        Product Name *
                      </label>
                      <input
                        className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                        style={inputStyle}
                        onFocus={inputFocus}
                        onBlur={inputBlur}
                        placeholder="e.g. HP Pavilion Laptop"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        id="ai-gen-product-name"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-muted)" }}>
                        Additional Details{" "}
                        <span className="font-normal" style={{ color: "var(--text-subtle)" }}>(optional)</span>
                      </label>
                      <textarea
                        rows={3}
                        className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all resize-none"
                        style={inputStyle}
                        onFocus={inputFocus}
                        onBlur={inputBlur}
                        placeholder="Any specs, accessories, reason for selling..."
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                        id="ai-gen-details"
                      />
                    </div>
                    <p className="text-[10px]" style={{ color: "var(--text-subtle)" }}>
                      Condition: <strong style={{ color: "var(--text-muted)" }}>{condition}</strong> (taken from your form)
                    </p>

                    {error && (
                      <div
                        className="text-xs px-3 py-2 rounded-lg"
                        style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}
                      >
                        {error}
                      </div>
                    )}

                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => void handleGenerate()}
                      disabled={!productName.trim() || isLoading}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all"
                      style={{
                        background: productName.trim() && !isLoading
                          ? "linear-gradient(135deg, #FF6B1A, #e85d10)"
                          : "var(--surface-3)",
                        opacity: productName.trim() && !isLoading ? 1 : 0.5,
                        cursor: productName.trim() && !isLoading ? "pointer" : "not-allowed",
                      }}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Generate Listing
                        </>
                      )}
                    </motion.button>
                  </>
                ) : (
                  <>
                    {/* Result preview */}
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                          Title
                        </label>
                        <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--text)" }}>
                          {result.title}
                        </p>
                      </div>
                      <div>
                        <label className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                          Description
                        </label>
                        <p
                          className="text-xs mt-0.5 leading-relaxed max-h-32 overflow-y-auto"
                          style={{ color: "var(--text)" }}
                        >
                          {result.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div>
                          <label className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                            Category
                          </label>
                          <p
                            className="text-xs mt-0.5 px-2 py-0.5 rounded-full inline-block"
                            style={{ background: "rgba(255,107,26,0.12)", color: "#FF6B1A" }}
                          >
                            {result.category}
                          </p>
                        </div>
                        {result.tags.length > 0 && (
                          <div>
                            <label className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                              Tags
                            </label>
                            <div className="flex gap-1 mt-0.5 flex-wrap">
                              {result.tags.map((tag, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] px-1.5 py-0.5 rounded-full"
                                  style={{ background: "var(--surface-3)", color: "var(--text-muted)" }}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-[10px]" style={{ color: "var(--text-subtle)" }}>
                      You can edit everything after applying to your form.
                    </p>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setResult(null)}
                        className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
                        style={{
                          background: "var(--surface-2)",
                          border: "var(--border-width) solid var(--border)",
                          color: "var(--text-muted)",
                        }}
                      >
                        Regenerate
                      </button>
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={handleApply}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white"
                        style={{ background: "linear-gradient(135deg, #FF6B1A, #e85d10)" }}
                      >
                        <Check className="h-4 w-4" />
                        Apply
                      </motion.button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
