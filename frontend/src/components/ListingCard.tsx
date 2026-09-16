import { motion } from "framer-motion"
import { Package, FileText, Star, ExternalLink } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { cn } from "../lib/utils"

export interface Listing {
  id: string
  title: string
  description: string
  price: number
  type: "ONLINE" | "OFFLINE"
  category: string
  subject?: string | null
  semester?: number | null
  condition?: string | null
  isFree: boolean
  images: string[]
  fileUrl?: string | null
  seller: { id: string; name: string; reputation: number }
  createdAt: string
}

interface ListingCardProps {
  listing: Listing
  className?: string
}

export function ListingCard({ listing, className }: ListingCardProps) {
  const navigate = useNavigate()
  const hasImage = listing.images && listing.images.length > 0

  const typeColor =
    listing.type === "ONLINE"
      ? "bg-[#FF6B1A]/15 text-[#FF6B1A] border-[#FF6B1A]/20"
      : "bg-amber-500/15 text-amber-400 border-amber-500/20"

  const categoryColors: Record<string, string> = {
    Notes: "bg-blue-500/15 text-blue-400 border border-blue-500/20",
    Books: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
    Hardware: "bg-orange-500/15 text-orange-400 border border-orange-500/20",
    Cycles: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
    Equipment: "bg-purple-500/15 text-purple-400 border border-purple-500/20",
    Software: "bg-cyan-500/15 text-cyan-400 border border-cyan-500/20",
    Tutorials: "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20",
    "Lab Tools": "bg-rose-500/15 text-rose-400 border border-rose-500/20",
    Furniture: "bg-teal-500/15 text-teal-400 border border-teal-500/20",
    "Mock Tests": "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20",
    Projects: "bg-pink-500/15 text-pink-400 border border-pink-500/20",
  }
  const catColor = categoryColors[listing.category] ?? "bg-zinc-700/50 text-zinc-300 border border-zinc-600/30"

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      onClick={() => navigate(`/listings/${listing.id}`)}
      className={cn(
        "group cursor-pointer rounded-2xl overflow-hidden",
        "hover:shadow-[0_0_30px_rgba(255,107,26,0.07)] transition-all duration-300",
        className
      )}
      style={{
        background: "var(--surface)",
        border: "var(--border-width) solid var(--border)",
      }}
    >
      {/* Thumbnail */}
      <div className="relative h-44 overflow-hidden" style={{ background: "var(--surface-3)" }}>
        {hasImage ? (
          <img
            src={listing.images[0]}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex items-center justify-center h-full"
            style={{ background: "linear-gradient(135deg, var(--surface-2), var(--surface-3))" }}>
            {listing.type === "ONLINE" ? (
              <FileText className="h-12 w-12" style={{ color: "var(--text-subtle)" }} />
            ) : (
              <Package className="h-12 w-12" style={{ color: "var(--text-subtle)" }} />
            )}
          </div>
        )}
        {/* Overlay badges */}
        <div className="absolute top-2.5 left-2.5 flex gap-1.5">
          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border backdrop-blur-sm", typeColor)}>
            {listing.type}
          </span>
          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm", catColor)}>
            {listing.category}
          </span>
        </div>
        {listing.isFree && (
          <div className="absolute top-2.5 right-2.5">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF6B1A]/20 text-[#FF6B1A] border border-[#FF6B1A]/30 backdrop-blur-sm">
              FREE
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-sm leading-snug line-clamp-2 mb-1 group-hover:text-[#FF6B1A] transition-colors"
          style={{ color: "var(--text)" }}>
          {listing.title}
        </h3>
        <p className="text-xs line-clamp-2 mb-3" style={{ color: "var(--text-muted)" }}>{listing.description}</p>

        {/* Seller & subject */}
        <div className="flex items-center gap-1.5 mb-3">
          <div className="w-5 h-5 rounded-full bg-[#FF6B1A]/15 flex items-center justify-center flex-shrink-0">
            <span className="text-[8px] font-bold text-[#FF6B1A]">
              {listing.seller.name[0]?.toUpperCase()}
            </span>
          </div>
          <span className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>{listing.seller.name}</span>
          {listing.seller.reputation > 0 && (
            <span className="ml-auto flex items-center gap-0.5 text-[11px] text-amber-400">
              <Star className="h-2.5 w-2.5 fill-amber-400" />
              {listing.seller.reputation.toFixed(1)}
            </span>
          )}
        </div>

        {/* Footer: price + CTA */}
        <div className="flex items-center justify-between pt-3"
          style={{ borderTop: "var(--border-width) solid var(--border)" }}>
          <div>
            {listing.isFree ? (
              <p className="text-base font-bold text-[#FF6B1A]">Free</p>
            ) : (
              <p className="text-base font-bold" style={{ color: "var(--text)" }}>
                ₹{listing.price.toLocaleString("en-IN")}
              </p>
            )}
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={(e) => { e.stopPropagation(); navigate(`/listings/${listing.id}`) }}
            className="flex items-center gap-1 text-xs font-semibold text-[#FF6B1A] hover:underline"
          >
            View <ExternalLink className="h-3 w-3" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
