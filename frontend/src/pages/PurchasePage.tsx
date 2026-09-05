// src/pages/PurchasePage.tsx — Purchase flow for offline listings

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft, Package, MapPin, MessageSquare, CheckCircle2,
  Loader2, AlertCircle, ShoppingBag, User, Tag, Star, Send, QrCode
} from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { apiFetch, ApiRequestError } from "../lib/api"
import BechoLogo from "../components/BechoLogo"

const API_URL = (import.meta.env["VITE_API_URL"] as string) ?? "http://localhost:3000"

interface FullListing {
  id: string
  title: string
  description: string
  price: number
  isFree: boolean
  category: string
  condition?: string
  images: string[]
  status: string
  type: string
  qrCodeUrl?: string
  seller: { id: string; name: string; reputation: number; email: string }
}

export default function PurchasePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [listing, setListing] = useState<FullListing | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    void (async () => {
      setLoading(true)
      try {
        const res = await fetch(`${API_URL}/api/listings/${id}`)
        if (!res.ok) { setError("Listing not found"); return }
        const data = await res.json() as { listing: FullListing }
        if (data.listing.type === "ONLINE") {
          navigate(`/listings/${id}`, { replace: true })
          return
        }
        setListing(data.listing)
      } catch {
        setError("Failed to load listing")
      } finally {
        setLoading(false)
      }
    })()
  }, [id, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || submitting) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      await apiFetch("/api/purchase", {
        method: "POST",
        body: JSON.stringify({ listingId: id, note: note.trim() || undefined }),
      })
      setSubmitted(true)
    } catch (err) {
      if (err instanceof ApiRequestError) setSubmitError(err.message)
      else setSubmitError("Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <Loader2 className="h-6 w-6 text-zinc-600 animate-spin" />
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center gap-4">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <p className="text-zinc-400 font-medium">{error ?? "Listing not found"}</p>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-[#FF6B1A] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Go back
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#080808]">
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-[#080808]/90 backdrop-blur border-b border-white/[0.05] px-6 py-3.5 flex items-center gap-3">
        <BechoLogo size={28} showWordmark={true} wordmarkColor="white" />
        <div className="h-4 w-px bg-zinc-800 mx-2" />
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Listing
        </button>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <AnimatePresence mode="wait">
          {submitted ? (
            /* ── Success State ── */
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center gap-6 py-16"
            >
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-[#FF6B1A]/10 flex items-center justify-center">
                  <CheckCircle2 className="h-12 w-12 text-[#FF6B1A]" />
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="absolute -top-1 -right-1 w-6 h-6 bg-[#FF6B1A] rounded-full flex items-center justify-center"
                >
                  <span className="text-white text-xs font-bold">✓</span>
                </motion.div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">Request Sent!</h1>
                <p className="text-zinc-400 text-sm leading-relaxed max-w-sm">
                  Your purchase request has been sent to <span className="text-white font-medium">{listing.seller.name}</span>.
                  They'll review it and respond shortly.
                </p>
              </div>

              {/* QR Code — if seller provided one */}
              {listing.qrCodeUrl && (
                <div className="w-full max-w-xs rounded-2xl overflow-hidden bg-zinc-900/60 border border-white/[0.10] p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <QrCode className="h-4 w-4 text-[#FF6B1A]" />
                    <p className="text-sm font-semibold text-white">Seller's Payment QR</p>
                  </div>
                  <p className="text-xs text-zinc-500 mb-3">Scan this to pay via UPI / GPay / PhonePe once the seller accepts.</p>
                  <div className="bg-white rounded-xl p-3 flex items-center justify-center">
                    <img
                      src={listing.qrCodeUrl}
                      alt="Payment QR Code"
                      className="w-48 h-48 object-contain"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-600 text-center mt-2">Only pay after seller accepts your request</p>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                <button
                  onClick={() => navigate("/inbox")}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#FF6B1A] hover:bg-[#FF6B1A]/90 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-all"
                >
                  <MessageSquare className="h-4 w-4" />
                  View Inbox
                </button>
                <button
                  onClick={() => navigate("/browse")}
                  className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-all"
                >
                  Browse More
                </button>
              </div>
            </motion.div>
          ) : (
            /* ── Purchase Form ── */
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Header */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <ShoppingBag className="h-4 w-4 text-[#FF6B1A]" />
                  <span className="text-xs font-semibold text-[#FF6B1A] uppercase tracking-widest">Purchase Request</span>
                </div>
                <h1 className="text-2xl font-bold text-white">Contact Seller</h1>
                <p className="text-zinc-500 text-sm mt-1">
                  Send a purchase request. The seller will review and contact you with next steps.
                </p>
              </div>

              {/* Listing Summary Card */}
              <div className="rounded-2xl bg-zinc-900/60 border border-white/[0.07] overflow-hidden">
                <div className="flex gap-4 p-4">
                  <div className="w-20 h-20 rounded-xl bg-zinc-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {listing.images[0] ? (
                      <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="h-8 w-8 text-zinc-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-white text-sm leading-tight truncate">{listing.title}</h2>
                    <span className="text-xs text-zinc-500 mt-0.5 inline-block">{listing.category}</span>
                    {listing.condition && (
                      <div className="flex items-center gap-1 mt-1">
                        <Tag className="h-3 w-3 text-zinc-600" />
                        <span className="text-xs text-zinc-500">{listing.condition}</span>
                      </div>
                    )}
                    <div className="mt-2">
                      {listing.isFree ? (
                        <span className="text-lg font-bold text-[#FF6B1A]">Free</span>
                      ) : (
                        <span className="text-lg font-bold text-white">₹{listing.price.toLocaleString("en-IN")}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Seller Info */}
              <div className="rounded-2xl bg-zinc-900/40 border border-white/[0.06] p-4">
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide mb-3">Seller</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#FF6B1A]/15 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-[#FF6B1A]">{listing.seller.name[0]?.toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{listing.seller.name}</p>
                    {listing.seller.reputation > 0 && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span className="text-xs text-amber-400">{listing.seller.reputation.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  <div className="ml-auto">
                    <User className="h-4 w-4 text-zinc-700" />
                  </div>
                </div>
              </div>

              {/* How it works */}
              <div className="rounded-2xl bg-[#FF6B1A]/5 border border-[#FF6B1A]/15 p-4">
                <p className="text-xs font-semibold text-[#FF6B1A] mb-3 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> How this works
                </p>
                <div className="space-y-2.5">
                  {[
                    { step: "1", text: "Send your contact request to the seller" },
                    { step: "2", text: "Seller reviews and accepts or declines" },
                    { step: "3", text: "Coordinate pickup/meetup directly" },
                  ].map(({ step, text }) => (
                    <div key={step} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#FF6B1A]/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-bold text-[#FF6B1A]">{step}</span>
                      </div>
                      <span className="text-xs text-zinc-400">{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form */}
              <form onSubmit={(e) => { void handleSubmit(e) }} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-2">
                    Message to seller <span className="text-zinc-600 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Hi! I'm interested in buying this. When can we meet?"
                    rows={3}
                    maxLength={500}
                    className="w-full bg-zinc-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#FF6B1A]/50 transition-colors resize-none"
                  />
                  <p className="text-xs text-zinc-600 text-right mt-1">{note.length}/500</p>
                </div>

                {submitError && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                    <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                    <p className="text-sm text-red-400">{submitError}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 text-sm font-medium px-5 py-3 rounded-xl transition-all"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || listing.status !== "ACTIVE" || user?.id === listing.seller.id}
                    id="send-purchase-request-btn"
                    className="flex-1 flex items-center justify-center gap-2 bg-[#FF6B1A] hover:bg-[#FF6B1A]/90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-3 rounded-xl transition-all"
                  >
                    {submitting ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
                    ) : (
                      <><Send className="h-4 w-4" /> Send Purchase Request</>
                    )}
                  </button>
                </div>

                {listing.status !== "ACTIVE" && (
                  <p className="text-center text-xs text-zinc-500">This listing is no longer available</p>
                )}
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
