// src/pages/Chat.tsx — Real-time chat per listing using Socket.io

import { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowLeft, Send, Loader2, MessageSquare } from "lucide-react"
import { io, Socket } from "socket.io-client"
import { useAuth } from "../contexts/AuthContext"
import { apiFetch } from "../lib/api"
import { cn } from "../lib/utils"

const API_URL = (import.meta.env["VITE_API_URL"] as string) ?? "http://localhost:3000"

interface ChatUser { id: string; name: string }
interface Message {
  id: string
  content: string
  senderId: string
  receiverId: string
  listingId: string | null
  sender: ChatUser
  receiver: ChatUser
  createdAt: string
}

export default function Chat() {
  const { listingId } = useParams<{ listingId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, getAccessToken } = useAuth()

  // receiverId comes from URL: ?receiverId=xxx (seller) or ?mentorId=xxx (mentor)
  const receiverId = searchParams.get("receiverId") ?? searchParams.get("mentorId") ?? ""
  const chatTitle = searchParams.get("name") ? decodeURIComponent(searchParams.get("name")!) : "Chat"

  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [socketConnected, setSocketConnected] = useState(false)

  const socketRef = useRef<Socket | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  // ── Load history ───────────────────────────────────────────────
  const loadMessages = useCallback(async () => {
    if (!listingId) return
    setLoading(true)
    try {
      const data = await apiFetch<{ messages: Message[] }>(`/api/chat/${listingId}`)
      setMessages(data.messages)
    } catch {
      // silent — empty chat is fine
    } finally {
      setLoading(false)
    }
  }, [listingId])

  // ── Socket.io ─────────────────────────────────────────────────
  useEffect(() => {
    if (!listingId) return

    const socket = io(API_URL, {
      transports: ["websocket"],
      auth: { token: getAccessToken() },
    })

    socketRef.current = socket

    socket.on("connect", () => {
      setSocketConnected(true)
      socket.emit("join_room", listingId)
    })

    socket.on("disconnect", () => setSocketConnected(false))

    socket.on("new_message", (msg: Message) => {
      setMessages((prev) => {
        // Deduplicate by id
        if (prev.some((m) => m.id === msg.id)) return prev
        return [...prev, msg]
      })
    })

    void loadMessages()

    return () => {
      socket.emit("leave_room", listingId)
      socket.disconnect()
    }
  }, [listingId, getAccessToken, loadMessages])

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // ── Send ──────────────────────────────────────────────────────
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !listingId || !receiverId || sending) return

    setSending(true)
    const optimisticContent = input.trim()
    setInput("")

    try {
      await apiFetch(`/api/chat/${listingId}`, {
        method: "POST",
        body: JSON.stringify({ content: optimisticContent, receiverId }),
      })
      // Socket.io will emit the saved message back to us via 'new_message'
    } catch {
      // Restore input on failure
      setInput(optimisticContent)
    } finally {
      setSending(false)
    }
  }

  if (!user) return null

  const groupedMessages = messages.reduce<Array<{ date: string; msgs: Message[] }>>((acc, msg) => {
    const date = new Date(msg.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
    const last = acc[acc.length - 1]
    if (last && last.date === date) last.msgs.push(msg)
    else acc.push({ date, msgs: [msg] })
    return acc
  }, [])

  return (
    <div className="h-screen bg-[#080808] flex flex-col">
      {/* Nav */}
      <nav className="shrink-0 bg-[#0a0a0a] border-b border-white/[0.05] px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{chatTitle}</div>
          <div className={cn("text-xs flex items-center gap-1", socketConnected ? "text-emerald-400" : "text-zinc-600")}>
            <div className={cn("w-1.5 h-1.5 rounded-full", socketConnected ? "bg-emerald-400" : "bg-zinc-600")} />
            {socketConnected ? "Connected" : "Connecting…"}
          </div>
        </div>
      </nav>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-zinc-600" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MessageSquare className="h-10 w-10 text-zinc-700 mb-3" />
            <p className="text-zinc-500 text-sm">No messages yet</p>
            <p className="text-zinc-600 text-xs mt-1">Send the first message to start the conversation</p>
          </div>
        ) : (
          groupedMessages.map(({ date, msgs }) => (
            <div key={date}>
              {/* Date divider */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-xs text-zinc-600">{date}</span>
                <div className="flex-1 h-px bg-white/5" />
              </div>

              {msgs.map((msg) => {
                const isMe = msg.senderId === user.id
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn("flex mb-2", isMe ? "justify-end" : "justify-start")}
                  >
                    <div className={cn("max-w-[72%] space-y-0.5")}>
                      {!isMe && (
                        <p className="text-xs text-zinc-500 px-1">{msg.sender.name}</p>
                      )}
                      <div className={cn(
                        "px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                        isMe
                          ? "bg-primary text-black rounded-tr-sm"
                          : "bg-white/[0.07] text-white rounded-tl-sm"
                      )}>
                        {msg.content}
                      </div>
                      <p className={cn("text-xs text-zinc-600 px-1", isMe ? "text-right" : "text-left")}>
                        {new Date(msg.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-white/[0.05] bg-[#0a0a0a] px-4 py-3">
        {!receiverId ? (
          <p className="text-center text-xs text-zinc-600 py-2">
            Cannot send message — no recipient specified
          </p>
        ) : (
          <form onSubmit={(e) => { void handleSend(e) }} className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message…"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 transition-colors"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className={cn(
                "p-2.5 rounded-xl transition-all",
                input.trim() && !sending
                  ? "bg-primary text-black hover:bg-primary/90"
                  : "bg-white/5 text-zinc-600 cursor-not-allowed"
              )}
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
