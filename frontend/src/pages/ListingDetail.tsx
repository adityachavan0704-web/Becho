import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import {
  ArrowLeft, Package, FileText, Star, Download,
  Loader2, AlertCircle, Calendar, Tag, User, ShoppingBag
} from "lucide-react"
import { Button } from "../components/ui/Button"
import { useAuth } from "../contexts/AuthContext"
import { useTheme } from "../contexts/ThemeContext"
import { cn } from "../lib/utils"
import type { Listing } from "../components/ListingCard"
import BechoLogo from "../components/BechoLogo"

const API_URL = (import.meta.env["VITE_API_URL"] as string) ?? "http://localhost:3000"

interface FullListing extends Listing {
  status: string
  condition?: string
  semester?: number
  fileUrl?: string
  createdAt: string
  seller: { id: string; name: string; reputation: number; email: string }
}

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { isDark } = useTheme()
  const [listing, setListing] = useState<FullListing | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [activeImg, setActiveImg] = useState(0)

  useEffect(() => {
    if (!id) return
    void (async () => {
      setLoading(true)
      try {
        const res = await fetch(`${API_URL}/api/listings/${id}`)
        if (!res.ok) { setError(true); return }
        const data = await res.json() as { listing: FullListing }
        setListing(data.listing)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  // ── Theme tokens ─────────────────────────────────────────────────────────────
  const bg        = isDark ? "#080808" : "#f5f0e8"
  const navBg     = isDark ? "rgba(8,8,8,0.92)"      : "rgba(245,240,232,0.95)"
  const navBorder = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.08)"

  // Card boxes — bright white borders on dark, clean dark borders on light
  const cardBg     = isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.85)"
  const cardBorder = isDark ? "rgba(255,255,255,0.60)" : "rgba(0,0,0,0.15)"

  // Seller card — slightly more prominent
  const sellerBg     = isDark ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.92)"
  const sellerBorder = isDark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.18)"

  // Primary action button ring
  const btnRing = isDark ? "0 0 0 2px rgba(255,255,255,0.75), 0 4px 24px rgba(255,255,255,0.08)" : "none"

  // Image placeholder
  const placeholderBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)"
  const iconColor     = isDark ? "#444" : "#bbb"

  // Text
  const textPrimary = isDark ? "#ffffff" : "#111111"
  const textMuted   = isDark ? "#71717a" : "#6b7280"
  const textSub     = isDark ? "#52525b" : "#9ca3af"
  const dividerColor = isDark ? "#27272a" : "#d1d5db"

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: bg }}>
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: textMuted }} />
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: bg }}>
        <AlertCircle className="h-10 w-10 text-red-400" />
        <p className="font-medium" style={{ color: textMuted }}>Listing not found</p>
        <Button variant="outline" size="sm" onClick={() => navigate("/browse")}>
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Browse
        </Button>
      </div>
    )
  }

  const typeColor = listing.type === "ONLINE"
    ? "bg-[#FF6B1A]/15 text-[#FF6B1A] border-[#FF6B1A]/20"
    : "bg-amber-500/15 text-amber-400 border-amber-500/20"

  const isOwner = user?.id === listing.seller.id

  return (
    <div className="min-h-screen" style={{ backgroundColor: bg }}>
      {/* Nav */}
      <nav
        className="sticky top-0 z-40 backdrop-blur px-6 py-3.5 flex items-center gap-3"
        style={{ backgroundColor: navBg, borderBottom: `1px solid ${navBorder}` }}
      >
        <div className="flex items-center gap-2.5">
          <BechoLogo size={28} showWordmark={true} wordmarkColor={isDark ? "white" : undefined} />
        </div>
        <div className="h-4 w-px mx-2" style={{ backgroundColor: dividerColor }} />
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs transition-colors"
          style={{ color: textMuted }}
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-10"
        >
          {/* Left — images */}
          <div className="space-y-3">
            <div
              className="aspect-[4/3] rounded-2xl overflow-hidden flex items-center justify-center"
              style={{ backgroundColor: placeholderBg, border: `1.5px solid ${cardBorder}` }}
            >
              {listing.images.length > 0 ? (
                <img
                  src={listing.images[activeImg]}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-3">
                  {listing.type === "ONLINE"
                    ? <FileText className="h-16 w-16" style={{ color: iconColor }} />
                    : <Package className="h-16 w-16" style={{ color: iconColor }} />}
                  <p className="text-xs" style={{ color: textSub }}>No images</p>
                </div>
              )}
            </div>
            {listing.images.length > 1 && (
              <div className="flex gap-2">
                {listing.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImg(idx)}
                    className={cn(
                      "w-16 h-16 rounded-xl overflow-hidden border-2 transition-all",
                      activeImg === idx ? "border-[#FF6B1A]" : "border-transparent"
                    )}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right — details */}
          <div className="space-y-5">
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn("text-[11px] font-semibold px-2.5 py-1 rounded-full border", typeColor)}>
                {listing.type}
              </span>
              <span
                className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}`, color: textMuted }}
              >
                {listing.category}
              </span>
              {listing.isFree && (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#FF6B1A]/15 text-[#FF6B1A] border border-[#FF6B1A]/30">
                  FREE
                </span>
              )}
              <span className={cn("ml-auto text-[11px] font-semibold px-2.5 py-1 rounded-full", {
                "bg-orange-400/10 text-orange-400": listing.status === "ACTIVE",
                "bg-zinc-600/10 text-zinc-400": listing.status === "SOLD",
                "bg-zinc-800 text-zinc-500": listing.status === "HIDDEN",
              })}>
                {listing.status}
              </span>
            </div>

            {/* Title */}
            <div>
              <h1 className="text-2xl font-bold leading-tight" style={{ color: textPrimary }}>
                {listing.title}
              </h1>
              {listing.subject && (
                <p className="text-sm mt-1" style={{ color: textMuted }}>
                  {listing.subject}{listing.semester ? ` · Semester ${listing.semester}` : ""}
                </p>
              )}
            </div>

            {/* Price */}
            <div>
              {listing.isFree ? (
                <p className="text-3xl font-bold text-[#FF6B1A]">Free</p>
              ) : (
                <p className="text-3xl font-bold" style={{ color: textPrimary }}>
                  ₹{listing.price.toLocaleString("en-IN")}
                </p>
              )}
            </div>

            {/* Description */}
            <p className="text-sm leading-relaxed" style={{ color: textMuted }}>
              {listing.description}
            </p>

            {/* Meta boxes */}
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              {listing.condition && (
                <div
                  className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                  style={{ backgroundColor: cardBg, border: `1.5px solid ${cardBorder}` }}
                >
                  <Tag className="h-3.5 w-3.5 flex-shrink-0" style={{ color: textSub }} />
                  <span style={{ color: textMuted }}>Condition:</span>
                  <span className="font-semibold" style={{ color: textPrimary }}>{listing.condition}</span>
                </div>
              )}
              <div
                className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                style={{ backgroundColor: cardBg, border: `1.5px solid ${cardBorder}` }}
              >
                <Calendar className="h-3.5 w-3.5 flex-shrink-0" style={{ color: textSub }} />
                <span style={{ color: textMuted }}>Listed:</span>
                <span className="font-semibold" style={{ color: textPrimary }}>
                  {new Date(listing.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </span>
              </div>
            </div>

            {/* Seller card */}
            <div
              className="flex items-center gap-3 p-4 rounded-xl"
              style={{ backgroundColor: sellerBg, border: `1.5px solid ${sellerBorder}` }}
            >
              <div className="w-10 h-10 rounded-full bg-[#FF6B1A]/15 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-[#FF6B1A]">{listing.seller.name[0]?.toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: textPrimary }}>{listing.seller.name}</p>
                {listing.seller.reputation > 0 && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-medium text-amber-400">{listing.seller.reputation.toFixed(1)}</span>
                  </div>
                )}
              </div>
              <User className="h-4 w-4" style={{ color: textSub }} />
            </div>

            {/* Actions — Chat and back-arrow removed */}
            <div className="flex gap-3 pt-1">
              {listing.type === "ONLINE" && listing.fileUrl ? (
                <a href={listing.fileUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button className="w-full" style={{ boxShadow: btnRing }}>
                    <Download className="h-4 w-4 mr-2" />
                    {listing.isFree ? "Download Free" : "Download"}
                  </Button>
                </a>
              ) : !isOwner && listing.type === "OFFLINE" ? (
                <Button
                  className="flex-1"
                  disabled={listing.status !== "ACTIVE"}
                  style={{ boxShadow: btnRing }}
                  onClick={() => {
                    if (!isAuthenticated) {
                      navigate("/login", { state: { from: { pathname: `/listings/${listing.id}/buy` } } })
                    } else {
                      navigate(`/listings/${listing.id}/buy`)
                    }
                  }}
                  id="buy-now-btn"
                >
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  {listing.status === "ACTIVE" ? "Buy Now" : "Sold Out"}
                </Button>
              ) : !isOwner && listing.type === "ONLINE" ? (
                <Button
                  className="flex-1"
                  style={{ boxShadow: btnRing }}
                  onClick={() => {
                    if (!isAuthenticated) {
                      navigate("/login", { state: { from: { pathname: `/listings/${id}` } } })
                    } else {
                      navigate(`/listings/${listing.id}/buy`)
                    }
                  }}
                >
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Get for Free
                </Button>
              ) : null}

              {isOwner && (
                <Button variant="outline" size="sm" className="flex-1">
                  Edit Listing
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
