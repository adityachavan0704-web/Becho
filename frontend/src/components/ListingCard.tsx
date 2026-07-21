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
      ? "bg-blue-500/15 text-blue-400 border-blue-500/20"
      : "bg-amber-500/15 text-amber-400 border-amber-500/20"

  const categoryColors: Record<string, string> = {
    Notes: "bg-purple-500/15 text-purple-400",
    Books: "bg-rose-500/15 text-rose-400",
    Hardware: "bg-orange-500/15 text-orange-400",
    Cycles: "bg-green-500/15 text-green-400",
    Equipment: "bg-sky-500/15 text-sky-400",
    Software: "bg-indigo-500/15 text-indigo-400",
  }
  const catColor = categoryColors[listing.category] ?? "bg-zinc-700/50 text-zinc-300"

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      onClick={() => navigate(`/listings/${listing.id}`)}
      className={cn(
        "group cursor-pointer rounded-2xl border border-white/[0.06] bg-zinc-900/60 overflow-hidden",
        "hover:border-[#00fcb5]/25 hover:shadow-[0_0_30px_rgba(0,252,181,0.07)] transition-all duration-300",
        className
      )}
    >
      {/* Thumbnail */}
      <div className="relative h-44 bg-zinc-800/80 overflow-hidden">
        {hasImage ? (
          <img
            src={listing.images[0]}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            {listing.type === "ONLINE" ? (
              <FileText className="h-12 w-12 text-zinc-600" />
            ) : (
              <Package className="h-12 w-12 text-zinc-600" />
            )}
          </div>
        )}
        {/* Overlay badges */}
        <div className="absolute top-2.5 left-2.5 flex gap-1.5">
          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", typeColor)}>
            {listing.type}
          </span>
          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", catColor)}>
            {listing.category}
          </span>
        </div>
        {listing.isFree && (
          <div className="absolute top-2.5 right-2.5">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00fcb5]/20 text-[#00fcb5] border border-[#00fcb5]/30">
              FREE
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-sm text-white leading-snug line-clamp-2 mb-1 group-hover:text-[#00fcb5] transition-colors">
          {listing.title}
        </h3>
        <p className="text-xs text-zinc-500 line-clamp-2 mb-3">{listing.description}</p>

        {/* Seller & subject */}
        <div className="flex items-center gap-1.5 mb-3">
          <div className="w-5 h-5 rounded-full bg-[#00fcb5]/15 flex items-center justify-center flex-shrink-0">
            <span className="text-[8px] font-bold text-[#00fcb5]">
              {listing.seller.name[0]?.toUpperCase()}
            </span>
          </div>
          <span className="text-[11px] text-zinc-500 truncate">{listing.seller.name}</span>
          {listing.seller.reputation > 0 && (
            <span className="ml-auto flex items-center gap-0.5 text-[11px] text-amber-400">
              <Star className="h-2.5 w-2.5 fill-amber-400" />
              {listing.seller.reputation.toFixed(1)}
            </span>
          )}
        </div>

        {/* Footer: price + CTA */}
        <div className="flex items-center justify-between border-t border-white/[0.05] pt-3">
          <div>
            {listing.isFree ? (
              <p className="text-base font-bold text-[#00fcb5]">Free</p>
            ) : (
              <p className="text-base font-bold text-white">
                ₹{listing.price.toLocaleString("en-IN")}
              </p>
            )}
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1 text-xs font-semibold text-[#00fcb5] hover:underline"
          >
            View <ExternalLink className="h-3 w-3" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
