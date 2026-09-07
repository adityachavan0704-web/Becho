// src/components/AiChatbox.tsx — Floating Becho AI chat widget
// Renders on all pages when user is authenticated.

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle, X, Send, Loader2, AlertCircle, Sparkles, ExternalLink, ChevronDown } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { apiFetch } from "../lib/api"

// ─── Types ─────────────────────────────────────────────────────

interface Product {
  id: string
  title: string
  description: string
  price: number
  type: "ONLINE" | "OFFLINE"
  category: string
  condition?: string | null
  isFree: boolean
  images: string[]
  seller: { id: string; name: string; reputation: number }
}

interface ChatMessage {
  id: string
  role: "user" | "ai"
  text: string
  products?: Product[]
  comparison?: {
    product1: Product
    product2: Product
    analysis: string
  }
  isError?: boolean
  timestamp: Date
}

interface AiChatResponse {
  response: string
  products?: Product[] | null
  comparison?: {
    product1: Product
    product2: Product
    analysis: string
  } | null
}

// ─── Component ─────────────────────────────────────────────────

export default function AiChatbox() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "ai",
      text: "Hey! 👋 I'm Becho AI, your marketplace assistant. Ask me to find products, compare items, or help with your budget. What are you looking for?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showScrollBtn, setShowScrollBtn] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  // Scroll on new messages
  useEffect(() => {
    if (isOpen) scrollToBottom()
  }, [messages, isOpen, scrollToBottom])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) inputRef.current?.focus()
  }, [isOpen])

  // Detect scroll position for "scroll to bottom" button
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current
    if (!container) return
    const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 80
    setShowScrollBtn(!atBottom)
  }, [])

  // Send message
  const sendMessage = async () => {
    const text = input.trim()
    if (!text || isLoading) return

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setIsLoading(true)

    try {
      const data = await apiFetch<AiChatResponse>("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({ message: text }),
      })

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "ai",
        text: data.response,
        products: data.products ?? undefined,
        comparison: data.comparison ?? undefined,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiMsg])
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Something went wrong"
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "ai",
          text: errorMsg,
          isError: true,
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void sendMessage()
    }
  }

  // Don't render for unauthenticated users
  if (!isAuthenticated) return null

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl"
            style={{
              background: "linear-gradient(135deg, #FF6B1A 0%, #e85d10 100%)",
              boxShadow: "0 8px 32px rgba(255, 107, 26, 0.35), 0 0 0 4px rgba(255, 107, 26, 0.08)",
            }}
            aria-label="Open AI Chat"
            id="becho-ai-chat-btn"
          >
            <Sparkles className="h-6 w-6 text-white" />
            {/* Pulse ring */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ border: "2px solid rgba(255, 107, 26, 0.4)" }}
              animate={{ scale: [1, 1.4, 1.4], opacity: [0.6, 0, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-6 right-6 z-50 flex flex-col overflow-hidden"
            style={{
              width: "min(420px, calc(100vw - 32px))",
              height: "min(620px, calc(100vh - 48px))",
              borderRadius: "20px",
              border: "var(--border-width) solid var(--border)",
              background: "var(--bg)",
              boxShadow: "0 25px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,107,26,0.06)",
            }}
            id="becho-ai-chat-window"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 flex-shrink-0"
              style={{
                background: "var(--surface)",
                borderBottom: "var(--border-width) solid var(--border)",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,107,26,0.18) 0%, rgba(245,158,11,0.10) 100%)",
                    border: "1px solid rgba(255,107,26,0.25)",
                  }}
                >
                  <Sparkles className="h-4.5 w-4.5 text-[#FF6B1A]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                    Becho AI
                  </h3>
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                    Marketplace Assistant
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{ background: "var(--surface-2)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-3)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
                aria-label="Close chat"
              >
                <X className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
              style={{ scrollBehavior: "smooth" }}
            >
              {messages.map((msg) => (
                <div key={msg.id}>
                  {msg.role === "user" ? (
                    <UserBubble text={msg.text} />
                  ) : (
                    <AiBubble
                      text={msg.text}
                      products={msg.products}
                      comparison={msg.comparison}
                      isError={msg.isError}
                      onViewProduct={(id) => {
                        navigate(`/listings/${id}`)
                        setIsOpen(false)
                      }}
                    />
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2"
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(255,107,26,0.12)" }}
                  >
                    <Sparkles className="h-3.5 w-3.5 text-[#FF6B1A]" />
                  </div>
                  <div
                    className="px-4 py-3 rounded-2xl rounded-tl-md"
                    style={{
                      background: "var(--surface)",
                      border: "var(--border-width) solid var(--border)",
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <motion.div
                        className="w-1.5 h-1.5 rounded-full bg-[#FF6B1A]"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
                      />
                      <motion.div
                        className="w-1.5 h-1.5 rounded-full bg-[#FF6B1A]"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
                      />
                      <motion.div
                        className="w-1.5 h-1.5 rounded-full bg-[#FF6B1A]"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Scroll-to-bottom button */}
            <AnimatePresence>
              {showScrollBtn && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={scrollToBottom}
                  className="absolute bottom-[72px] left-1/2 -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg z-10"
                  style={{
                    background: "var(--surface-2)",
                    border: "var(--border-width) solid var(--border)",
                  }}
                >
                  <ChevronDown className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Input */}
            <div
              className="flex items-center gap-2 px-4 py-3 flex-shrink-0"
              style={{
                borderTop: "var(--border-width) solid var(--border)",
                background: "var(--surface)",
              }}
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Becho AI anything..."
                disabled={isLoading}
                className="flex-1 text-sm px-4 py-2.5 rounded-xl outline-none transition-all"
                style={{
                  background: "var(--surface-2)",
                  border: "var(--border-width) solid var(--border)",
                  color: "var(--text)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,107,26,0.5)"
                  e.currentTarget.style.boxShadow = "0 0 0 3px var(--primary-glow)"
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = ""
                  e.currentTarget.style.boxShadow = "none"
                }}
                id="becho-ai-chat-input"
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => void sendMessage()}
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                style={{
                  background: input.trim() && !isLoading
                    ? "linear-gradient(135deg, #FF6B1A, #e85d10)"
                    : "var(--surface-2)",
                  opacity: input.trim() && !isLoading ? 1 : 0.5,
                  cursor: input.trim() && !isLoading ? "pointer" : "not-allowed",
                }}
                id="becho-ai-send-btn"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 text-white animate-spin" />
                ) : (
                  <Send className="h-4 w-4 text-white" />
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ─── Sub-components ────────────────────────────────────────────

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div
        className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-br-md text-sm"
        style={{
          background: "linear-gradient(135deg, #FF6B1A, #e85d10)",
          color: "#fff",
        }}
      >
        {text}
      </div>
    </div>
  )
}

function AiBubble({
  text,
  products,
  comparison,
  isError,
  onViewProduct,
}: {
  text: string
  products?: Product[]
  comparison?: { product1: Product; product2: Product; analysis: string }
  isError?: boolean
  onViewProduct: (id: string) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-2"
    >
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{
          background: isError ? "rgba(239,68,68,0.12)" : "rgba(255,107,26,0.12)",
        }}
      >
        {isError ? (
          <AlertCircle className="h-3.5 w-3.5 text-red-400" />
        ) : (
          <Sparkles className="h-3.5 w-3.5 text-[#FF6B1A]" />
        )}
      </div>
      <div className="max-w-[85%] space-y-2">
        {/* Text */}
        <div
          className="px-4 py-2.5 rounded-2xl rounded-tl-md text-sm leading-relaxed"
          style={{
            background: "var(--surface)",
            border: `var(--border-width) solid ${isError ? "rgba(239,68,68,0.2)" : "var(--border)"}`,
            color: isError ? "var(--destructive)" : "var(--text)",
          }}
        >
          {text.split("\n").map((line, i) => (
            <span key={i}>
              {line}
              {i < text.split("\n").length - 1 && <br />}
            </span>
          ))}
        </div>

        {/* Product cards */}
        {products && products.length > 0 && (
          <div className="space-y-2">
            {products.slice(0, 5).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onView={() => onViewProduct(product.id)}
              />
            ))}
            {products.length > 5 && (
              <p className="text-xs px-2" style={{ color: "var(--text-muted)" }}>
                +{products.length - 5} more results
              </p>
            )}
          </div>
        )}

        {/* Comparison */}
        {comparison && (
          <div
            className="rounded-xl p-3 text-xs leading-relaxed"
            style={{
              background: "var(--surface)",
              border: "var(--border-width) solid var(--border)",
              color: "var(--text)",
            }}
          >
            <p className="font-semibold mb-2 text-[#FF6B1A] text-[11px] uppercase tracking-wide">
              Comparison
            </p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <MiniProductCard product={comparison.product1} onView={() => onViewProduct(comparison.product1.id)} />
              <MiniProductCard product={comparison.product2} onView={() => onViewProduct(comparison.product2.id)} />
            </div>
            <div className="pt-2" style={{ borderTop: "1px solid var(--border)" }}>
              {comparison.analysis.split("\n").map((line, i) => (
                <span key={i}>
                  {line}
                  {i < comparison.analysis.split("\n").length - 1 && <br />}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function ProductCard({ product, onView }: { product: Product; onView: () => void }) {
  const hasImage = product.images && product.images.length > 0

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors"
      style={{
        background: "var(--surface)",
        border: "var(--border-width) solid var(--border)",
      }}
      onClick={onView}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(255,107,26,0.3)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "")}
    >
      {/* Thumbnail */}
      <div
        className="w-14 h-14 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center"
        style={{ background: "var(--surface-2)" }}
      >
        {hasImage ? (
          <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
        ) : (
          <MessageCircle className="h-5 w-5" style={{ color: "var(--text-subtle)" }} />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate" style={{ color: "var(--text)" }}>
          {product.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full"
            style={{
              background: product.type === "ONLINE" ? "rgba(255,107,26,0.12)" : "rgba(245,158,11,0.12)",
              color: product.type === "ONLINE" ? "#FF6B1A" : "#f59e0b",
            }}
          >
            {product.category}
          </span>
          {product.condition && (
            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              {product.condition}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs font-bold" style={{ color: product.isFree ? "#FF6B1A" : "var(--text)" }}>
            {product.isFree ? "Free" : `₹${product.price.toLocaleString("en-IN")}`}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-[#FF6B1A]">
            View <ExternalLink className="h-2.5 w-2.5" />
          </span>
        </div>
      </div>
    </motion.div>
  )
}

function MiniProductCard({ product, onView }: { product: Product; onView: () => void }) {
  return (
    <div
      className="rounded-lg p-2 cursor-pointer transition-colors"
      style={{
        background: "var(--surface-2)",
        border: "var(--border-width) solid var(--border)",
      }}
      onClick={onView}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(255,107,26,0.3)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "")}
    >
      <p className="text-[10px] font-semibold truncate" style={{ color: "var(--text)" }}>
        {product.title}
      </p>
      <p className="text-[10px] font-bold mt-1" style={{ color: product.isFree ? "#FF6B1A" : "var(--text)" }}>
        {product.isFree ? "Free" : `₹${product.price.toLocaleString("en-IN")}`}
      </p>
    </div>
  )
}
