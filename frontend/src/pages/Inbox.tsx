// src/pages/Inbox.tsx — Inbox for purchase requests (seller & buyer views)

import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Inbox as InboxIcon, ArrowLeft, Package, MessageSquare,
  Loader2, CheckCircle2, XCircle, Clock, User,
  ShoppingBag, ChevronRight, Bell, CheckCheck
} from "lucide-react"
import BechoLogo from "../components/BechoLogo"
import { io } from "socket.io-client"
import { useAuth } from "../contexts/AuthContext"
import { useTheme } from "../contexts/ThemeContext"
import { apiFetch } from "../lib/api"
import { cn } from "../lib/utils"

const API_URL = (import.meta.env["VITE_API_URL"] as string) ?? "http://localhost:3000"

type PRStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "COMPLETED"
type NotifType = "PURCHASE_REQUEST" | "PURCHASE_ACCEPTED" | "PURCHASE_DECLINED"

interface PurchaseRequestListing {
  id: string
  title: string
  images: string[]
  price: number
  isFree: boolean
  condition?: string
}

interface PRBuyer { id: string; name: string; email: string }
interface PRSeller { id: string; name: string }

interface PurchaseRequest {
  id: string
  listingId: string
  listing: PurchaseRequestListing
  buyerId: string
  buyer: PRBuyer
  sellerId: string
  seller: PRSeller
  status: PRStatus
  note?: string
  createdAt: string
}

interface Notification {
  id: string
  type: NotifType
  isRead: boolean
  createdAt: string
  purchaseRequest: PurchaseRequest | null
}

interface SentRequest {
  id: string
  listingId: string
  listing: PurchaseRequestListing
  seller: PRSeller
  status: PRStatus
  note?: string
  createdAt: string
}

const statusConfig: Record<PRStatus, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING:   { label: "Pending",   color: "text-amber-400 bg-amber-400/10 border-amber-400/20",   icon: <Clock className="h-3 w-3" /> },
  ACCEPTED:  { label: "Accepted",  color: "text-green-400 bg-green-400/10 border-green-400/20",   icon: <CheckCircle2 className="h-3 w-3" /> },
  DECLINED:  { label: "Declined",  color: "text-red-400 bg-red-400/10 border-red-400/20",         icon: <XCircle className="h-3 w-3" /> },
  COMPLETED: { label: "Completed", color: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20",      icon: <CheckCheck className="h-3 w-3" /> },
}

const notifTypeLabel: Record<NotifType, string> = {
  PURCHASE_REQUEST: "wants to buy",
  PURCHASE_ACCEPTED: "accepted your request for",
  PURCHASE_DECLINED: "declined your request for",
}

export default function InboxPage() {
  const { user, getAccessToken } = useAuth()
  const navigate = useNavigate()
  const { isDark } = useTheme()
  const [tab, setTab] = useState<"received" | "sent">("received")
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [sentRequests, setSentRequests] = useState<SentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadInbox = useCallback(async () => {
    setLoading(true)
    try {
      const [inboxData, sentData] = await Promise.all([
        apiFetch<{ notifications: Notification[]; unread: number }>("/api/purchase/inbox"),
        apiFetch<{ requests: SentRequest[] }>("/api/purchase/sent"),
      ])
      setNotifications(inboxData.notifications)
      setSentRequests(sentData.requests)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  // Real-time socket for new notifications
  useEffect(() => {
    if (!user) return
    const socket = io(API_URL, {
      transports: ["websocket"],
      auth: { token: getAccessToken() },
    })
    socket.on("connect", () => socket.emit("join_user", user.id))
    socket.on("new_notification", (notif: Notification) => {
      setNotifications((prev) => {
        if (prev.some((n) => n.id === notif.id)) return prev
        return [notif, ...prev]
      })
    })
    return () => { socket.disconnect() }
  }, [user, getAccessToken])

  useEffect(() => {
    void loadInbox()
  }, [loadInbox])

  const handleAction = async (requestId: string, status: "ACCEPTED" | "DECLINED") => {
    setActionLoading(requestId + status)
    try {
      await apiFetch(`/api/purchase/${requestId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      })
      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n.purchaseRequest?.id === requestId
            ? { ...n, purchaseRequest: { ...n.purchaseRequest!, status } }
            : n
        )
      )
    } catch {
      // silent for now
    } finally {
      setActionLoading(null)
    }
  }

  const markAllRead = async () => {
    try {
      await apiFetch("/api/purchase/read/all", { method: "PATCH" })
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    } catch { /* silent */ }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  if (!user) return null

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      {/* Nav */}
      <nav className="sticky top-0 z-40 backdrop-blur px-6 py-3.5 flex items-center gap-3"
        style={{ backgroundColor: isDark ? "rgba(8,8,8,0.92)" : "rgba(220,210,196,0.96)", borderBottom: "var(--border-width) solid var(--border)" }}>
        <BechoLogo size={28} showWordmark={true} wordmarkColor={isDark ? "white" : undefined} />
        <div className="h-4 w-px mx-2" style={{ backgroundColor: "var(--border)" }} />
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs transition-colors"
          style={{ color: "var(--text-muted)" }}
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <InboxIcon className="h-6 w-6" style={{ color: "var(--primary)" }} />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#FF6B1A] rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>Inbox</h1>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Purchase requests & updates</p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => void markAllRead()}
              className="flex items-center gap-1.5 text-xs transition-colors"
              style={{ color: "var(--text-muted)" }}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl p-1 mb-6" style={{ backgroundColor: "var(--surface-2)", border: "var(--border-width) solid var(--border)" }}>
          {(["received", "sent"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              id={`inbox-tab-${t}`}
              className="flex-1 flex items-center justify-center gap-2 text-sm font-medium py-2.5 rounded-lg transition-all"
              style={tab === t
                ? { backgroundColor: "var(--primary)", color: "#fff" }
                : { color: "var(--text-muted)" }}
            >
              {t === "received" ? <Bell className="h-3.5 w-3.5" /> : <ShoppingBag className="h-3.5 w-3.5" />}
              {t === "received" ? "Received" : "Sent"}
              {t === "received" && unreadCount > 0 && (
                <span className={cn(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                  tab === "received" ? "bg-white/20 text-white" : "bg-[#FF6B1A]/20 text-[#FF6B1A]"
                )}>
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--text-subtle)" }} />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {tab === "received" ? (
              <motion.div key="received" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {notifications.length === 0 ? (
                  <EmptyState
                    icon={<Bell className="h-10 w-10" style={{ color: "var(--text-subtle)" }} />}
                    title="No notifications yet"
                    desc="When buyers request to purchase your listings, you'll see them here."
                  />
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notif) => (
                      <ReceivedCard
                        key={notif.id}
                        notif={notif}
                        currentUserId={user.id}
                        actionLoading={actionLoading}
                        onAction={handleAction}
                        onChat={(listingId, sellerId, title) =>
                          navigate(`/chat/${listingId}?receiverId=${sellerId}&name=${encodeURIComponent(title)}`)
                        }
                        onListingClick={(listingId) => navigate(`/listings/${listingId}`)}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="sent" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {sentRequests.length === 0 ? (
                  <EmptyState
                    icon={<ShoppingBag className="h-10 w-10" style={{ color: "var(--text-subtle)" }} />}
                    title="No purchase requests sent"
                    desc="Browse listings and send a purchase request to get started."
                    action={{ label: "Browse Listings", onClick: () => navigate("/browse") }}
                  />
                ) : (
                  <div className="space-y-3">
                    {sentRequests.map((req) => (
                      <SentCard
                        key={req.id}
                        req={req}
                        onListingClick={(listingId) => navigate(`/listings/${listingId}`)}
                        onChat={(listingId, sellerId, title) =>
                          navigate(`/chat/${listingId}?receiverId=${sellerId}&name=${encodeURIComponent(title)}`)
                        }
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}

// -- Sub-components ------------------------------------------------

function EmptyState({
  icon, title, desc, action,
}: {
  icon: React.ReactNode
  title: string
  desc: string
  action?: { label: string; onClick: () => void }
}) {
  return (
    <div className="flex flex-col items-center text-center py-16 gap-3">
      {icon}
      <p className="font-semibold" style={{ color: "var(--text)" }}>{title}</p>
      <p className="text-sm max-w-xs" style={{ color: "var(--text-muted)" }}>{desc}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-2 text-sm hover:underline"
          style={{ color: "var(--primary)" }}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

function ReceivedCard({
  notif, currentUserId, actionLoading, onAction, onChat, onListingClick,
}: {
  notif: Notification
  currentUserId: string
  actionLoading: string | null
  onAction: (id: string, status: "ACCEPTED" | "DECLINED") => Promise<void>
  onChat: (listingId: string, buyerId: string, title: string) => void
  onListingClick: (listingId: string) => void
}) {
  const pr = notif.purchaseRequest
  if (!pr) return null

  const isSellerView = pr.sellerId === currentUserId
  const status = pr.status
  const sc = statusConfig[status]
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4 space-y-3 transition-all"
      style={notif.isRead
        ? { backgroundColor: "var(--surface)", border: "var(--border-width) solid var(--border)" }
        : { backgroundColor: "var(--surface)", border: "var(--border-width) solid rgba(255,107,26,0.30)", boxShadow: "0 0 0 1px rgba(255,107,26,0.08)" }}
    >
      {/* Top row: type label + unread dot + timestamp */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!notif.isRead && (
            <div className="w-2 h-2 rounded-full bg-[#FF6B1A] flex-shrink-0" />
          )}
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {notif.type === "PURCHASE_REQUEST" ? (
              <>
                <span className="font-medium" style={{ color: "var(--text)" }}>{pr.buyer.name}</span>
                {" "}{notifTypeLabel[notif.type]}{" "}
                <span style={{ color: "var(--text-muted)" }}>your listing</span>
              </>
            ) : (
              <>
                <span className="font-medium" style={{ color: "var(--text)" }}>{pr.seller.name}</span>
                {" "}{notifTypeLabel[notif.type]}{" "}
                <span style={{ color: "var(--text-muted)" }}>{pr.listing.title}</span>
              </>
            )}
          </span>
        </div>
        <span className="text-xs flex-shrink-0 ml-2" style={{ color: "var(--text-subtle)" }}>
          {new Date(notif.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
        </span>
      </div>

      {/* Listing row */}
      <button
        onClick={() => onListingClick(pr.listing.id)}
        className="w-full flex items-center gap-3 text-left"
      >
        <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
          style={{ backgroundColor: "var(--surface-2)" }}>
          {pr.listing.images[0] ? (
            <img src={pr.listing.images[0]} alt={pr.listing.title} className="w-full h-full object-cover" />
          ) : (
            <Package className="h-6 w-6" style={{ color: "var(--text-subtle)" }} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>{pr.listing.title}</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {pr.listing.isFree ? "Free" : `₹${pr.listing.price.toLocaleString("en-IN")}`}
          </p>
          {pr.note && (
            <p className="text-xs mt-1 italic line-clamp-1" style={{ color: "var(--text-muted)" }}>&#34;{pr.note}&#34;</p>
          )}
        </div>
        <ChevronRight className="h-4 w-4 flex-shrink-0" style={{ color: "var(--text-subtle)" }} />
      </button>

      {/* Buyer info (seller view) */}
      {isSellerView && notif.type === "PURCHASE_REQUEST" && (
        <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ backgroundColor: "var(--surface-2)" }}>
          <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,107,26,0.15)" }}>
            <span className="text-[10px] font-bold" style={{ color: "var(--primary)" }}>{pr.buyer.name[0]?.toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium" style={{ color: "var(--text)" }}>{pr.buyer.name}</p>
            <p className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>{pr.buyer.email}</p>
          </div>
          <User className="h-3.5 w-3.5" style={{ color: "var(--text-subtle)" }} />
        </div>
      )}

      {/* Status badge */}
      <div className="flex items-center justify-between">
        <span className={cn(
          "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border",
          sc.color
        )}>
          {sc.icon}
          {sc.label}
        </span>

        {/* Actions  only seller sees action buttons on PENDING */}
        {isSellerView && status === "PENDING" && (
          <div className="flex items-center gap-2">
            <button
              id={`decline-btn-${pr.id}`}
              onClick={() => void onAction(pr.id, "DECLINED")}
              disabled={actionLoading !== null}
              className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 bg-red-400/10 hover:bg-red-400/20 border border-red-400/20 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
            >
              {actionLoading === pr.id + "DECLINED" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <XCircle className="h-3 w-3" />
              )}
              Decline
            </button>
            <button
              id={`accept-btn-${pr.id}`}
              onClick={() => void onAction(pr.id, "ACCEPTED")}
              disabled={actionLoading !== null}
              className="flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 bg-green-400/10 hover:bg-green-400/20 border border-green-400/20 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
            >
              {actionLoading === pr.id + "ACCEPTED" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3 w-3" />
              )}
              Accept
            </button>
            <button
              id={`chat-btn-${pr.id}`}
              onClick={() => onChat(pr.listing.id, pr.buyer.id, pr.listing.title)}
              className="flex items-center gap-1.5 text-xs text-[#FF6B1A] hover:text-[#FF6B1A]/80 bg-[#FF6B1A]/10 hover:bg-[#FF6B1A]/20 border border-[#FF6B1A]/20 px-3 py-1.5 rounded-lg transition-all"
            >
              <MessageSquare className="h-3 w-3" />
              Chat
            </button>
          </div>
        )}

        {/* After accept: chat + "arrange meetup" prompt */}
        {isSellerView && status === "ACCEPTED" && (
          <button
            onClick={() => onChat(pr.listing.id, pr.buyer.id, pr.listing.title)}
            className="flex items-center gap-1.5 text-xs hover:underline"
            style={{ color: "var(--primary)" }}
          >
            <MessageSquare className="h-3 w-3" />
            Chat with buyer
          </button>
        )}
      </div>
    </motion.div>
  )
}

function SentCard({
  req, onListingClick, onChat,
}: {
  req: SentRequest
  onListingClick: (id: string) => void
  onChat: (listingId: string, sellerId: string, title: string) => void
}) {
  const sc = statusConfig[req.status]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4 space-y-3"
      style={{ backgroundColor: "var(--surface)", border: "var(--border-width) solid var(--border)" }}
    >
      <button
        onClick={() => onListingClick(req.listing.id)}
        className="w-full flex items-center gap-3 text-left"
      >
        <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
          style={{ backgroundColor: "var(--surface-2)" }}>
          {req.listing.images[0] ? (
            <img src={req.listing.images[0]} alt={req.listing.title} className="w-full h-full object-cover" />
          ) : (
            <Package className="h-6 w-6" style={{ color: "var(--text-subtle)" }} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>{req.listing.title}</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Seller: <span style={{ color: "var(--text)" }}>{req.seller.name}</span>
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {req.listing.isFree ? "Free" : `₹${req.listing.price.toLocaleString("en-IN")}`}
          </p>
          {req.note && (
            <p className="text-xs italic mt-1 line-clamp-1" style={{ color: "var(--text-muted)" }}>&#34;{req.note}&#34;</p>
          )}
        </div>
        <ChevronRight className="h-4 w-4 flex-shrink-0" style={{ color: "var(--text-subtle)" }} />
      </button>

      <div className="flex items-center justify-between">
        <span className={cn(
          "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border",
          sc.color
        )}>
          {sc.icon}
          {sc.label}
        </span>

        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: "var(--text-subtle)" }}>
            {new Date(req.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </span>
          {req.status === "ACCEPTED" && (
            <button
              onClick={() => onChat(req.listing.id, req.seller.id, req.listing.title)}
              className="flex items-center gap-1.5 text-xs hover:underline"
              style={{ color: "var(--primary)" }}
            >
              <MessageSquare className="h-3 w-3" />
              Chat with seller
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
