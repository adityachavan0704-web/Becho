import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import {
  ArrowLeft, Package, FileText, Star, Download, MessageSquare,
  Loader2, AlertCircle, Calendar, Tag, Zap, User
} from "lucide-react"
import { Button } from "../components/ui/Button"
import { useAuth } from "../contexts/AuthContext"
import { ListingCard } from "../components/ListingCard"
import type { Listing } from "../components/ListingCard"
import { cn } from "../lib/utils"

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
  const { user } = useAuth()
  const [listing, setListing] = useState<FullListing | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [activeImg, setActiveImg] = useState(0)
  const [similar, setSimilar] = useState<Listing[]>([])

  useEffect(() => {
    if (!id) return
    void (async () => {
      setLoading(true)
      try {
        const res = await fetch(`${API_URL}/api/listings/${id}`)
        if (!res.ok) { setError(true); return }
        const data = await res.json() as { listing: FullListing }
        setListing(data.listing)
        // Fetch similar listings
        const simRes = await fetch(`${API_URL}/api/listings/${id}/similar`)
        if (simRes.ok) {
          const simData = await simRes.json() as { listings: Listing[] }
          setSimilar(simData.listings)
        }
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

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
        <p className="text-zinc-400 font-medium">Listing not found</p>
        <Button variant="outline" size="sm" onClick={() => navigate("/browse")}>
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Browse
        </Button>
      </div>
    )
  }

  const typeColor = listing.type === "ONLINE"
    ? "bg-blue-500/15 text-blue-400 border-blue-500/20"
    : "bg-amber-500/15 text-amber-400 border-amber-500/20"

  const isOwner = user?.id === listing.seller.id

  return (
    <div className="min-h-screen bg-[#080808]">
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-[#080808]/90 backdrop-blur border-b border-white/[0.05] px-6 py-3.5 flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#00fcb5] flex items-center justify-center">
            <Zap className="h-4 w-4 text-black" />
          </div>
          <span className="text-base font-bold text-white tracking-tight">Becho</span>
        </div>
        <div className="h-4 w-px bg-zinc-800 mx-2" />
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-200 transition-colors"
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
            <div className="aspect-[4/3] rounded-2xl bg-zinc-900 border border-white/[0.06] overflow-hidden flex items-center justify-center">
              {listing.images.length > 0 ? (
                <img
                  src={listing.images[activeImg]}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-3">
                  {listing.type === "ONLINE"
                    ? <FileText className="h-16 w-16 text-zinc-700" />
                    : <Package className="h-16 w-16 text-zinc-700" />}
                  <p className="text-xs text-zinc-600">No images</p>
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
                      activeImg === idx ? "border-[#00fcb5]" : "border-transparent"
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
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300">
                {listing.category}
              </span>
              {listing.isFree && (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#00fcb5]/15 text-[#00fcb5] border border-[#00fcb5]/30">
                  FREE
                </span>
              )}
              <span className={cn("ml-auto text-[11px] font-semibold px-2.5 py-1 rounded-full", {
                "bg-emerald-400/10 text-emerald-400": listing.status === "ACTIVE",
                "bg-blue-400/10 text-blue-400": listing.status === "SOLD",
                "bg-zinc-800 text-zinc-500": listing.status === "HIDDEN",
              })}>
                {listing.status}
              </span>
            </div>

            {/* Title */}
            <div>
              <h1 className="text-2xl font-bold text-white leading-tight">{listing.title}</h1>
              {listing.subject && (
                <p className="text-sm text-zinc-500 mt-1">{listing.subject}{listing.semester ? ` · Semester ${listing.semester}` : ""}</p>
              )}
            </div>

            {/* Price */}
            <div>
              {listing.isFree ? (
                <p className="text-3xl font-bold text-[#00fcb5]">Free</p>
              ) : (
                <p className="text-3xl font-bold text-white">₹{listing.price.toLocaleString("en-IN")}</p>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-zinc-400 leading-relaxed">{listing.description}</p>

            {/* Meta */}
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              {listing.condition && (
                <div className="flex items-center gap-2 bg-zinc-900/60 border border-white/[0.05] rounded-xl px-3 py-2.5">
                  <Tag className="h-3.5 w-3.5 text-zinc-600" />
                  <span className="text-zinc-500">Condition:</span>
                  <span className="text-zinc-300 font-medium">{listing.condition}</span>
                </div>
              )}
              <div className="flex items-center gap-2 bg-zinc-900/60 border border-white/[0.05] rounded-xl px-3 py-2.5">
                <Calendar className="h-3.5 w-3.5 text-zinc-600" />
                <span className="text-zinc-500">Listed:</span>
                <span className="text-zinc-300 font-medium">
                  {new Date(listing.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </span>
              </div>
            </div>

            {/* Seller */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-zinc-900/40 border border-white/[0.05]">
              <div className="w-10 h-10 rounded-full bg-[#00fcb5]/15 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-[#00fcb5]">{listing.seller.name[0]?.toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{listing.seller.name}</p>
                {listing.seller.reputation > 0 && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span className="text-xs text-amber-400 font-medium">{listing.seller.reputation.toFixed(1)}</span>
                  </div>
                )}
              </div>
              <User className="h-4 w-4 text-zinc-700" />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              {listing.type === "ONLINE" && listing.fileUrl ? (
                <a
                  href={listing.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    {listing.isFree ? "Download Free" : "Download"}
                  </Button>
                </a>
              ) : !isOwner ? (
                <Button
                  className="flex-1"
                  onClick={() =>
                    navigate(
                      `/chat/${listing.id}?receiverId=${listing.seller.id}&name=${encodeURIComponent(listing.title)}`
                    )
                  }
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Chat with Seller
                </Button>
              ) : null}

              {isOwner && (
                <Button variant="outline" size="sm" className="flex-1">
                  Edit Listing
                </Button>
              )}

              <Button variant="outline" size="icon" onClick={() => navigate("/browse")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Similar Listings */}
        {similar.length > 0 && (
          <div className="mt-12">
            <h2 className="text-lg font-semibold mb-4">Similar Listings</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {similar.map((s) => (
                <ListingCard key={s.id} listing={s} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
