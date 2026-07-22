// src/pages/Mentorship.tsx — Browse and create mentorship posts

import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search, Plus, Star, ArrowLeft, Loader2, X,
  GraduationCap, IndianRupee, Tag, MessageSquare
} from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { apiFetch, ApiRequestError } from "../lib/api"
import { cn } from "../lib/utils"

const API_URL = (import.meta.env["VITE_API_URL"] as string) ?? "http://localhost:3000"

interface MentorUser {
  id: string
  name: string
  reputation: number
}

interface MentorPost {
  id: string
  subject: string
  description: string
  hourlyRate: number
  tags: string[]
  isActive: boolean
  createdAt: string
  mentor: MentorUser
}

interface Meta { total: number; page: number; pages: number; limit: number }

const POPULAR_TAGS = ["DSA", "DBMS", "Web Dev", "ML", "Python", "C++", "OS", "CN", "Math", "Physics"]

export default function Mentorship() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()

  const [posts, setPosts] = useState<MentorPost[]>([])
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, pages: 1, limit: 20 })
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [selectedTag, setSelectedTag] = useState("")
  const [showCreate, setShowCreate] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  // Create form state
  const [subject, setSubject] = useState("")
  const [description, setDescription] = useState("")
  const [hourlyRate, setHourlyRate] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")

  const fetchPosts = useCallback(async (q: string, tag: string, page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set("q", q)
      if (tag) params.set("tag", tag)
      params.set("page", String(page))
      params.set("limit", "12")

      const data = await apiFetch<{ posts: MentorPost[]; meta: Meta }>(
        `/api/mentorship?${params.toString()}`
      )
      setPosts(data.posts)
      setMeta(data.meta)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchPosts(query, selectedTag) }, [fetchPosts, query, selectedTag])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError(null)
    setCreateLoading(true)
    try {
      await apiFetch("/api/mentorship", {
        method: "POST",
        body: JSON.stringify({ subject, description, hourlyRate: parseFloat(hourlyRate) || 0, tags }),
      })
      setShowCreate(false)
      setSubject(""); setDescription(""); setHourlyRate(""); setTags([])
      void fetchPosts(query, selectedTag)
    } catch (err) {
      setCreateError(err instanceof ApiRequestError ? err.message : "Failed to create post")
    } finally {
      setCreateLoading(false)
    }
  }

  const addTag = (t: string) => {
    const trimmed = t.trim()
    if (trimmed && !tags.includes(trimmed) && tags.length < 8) {
      setTags([...tags, trimmed])
    }
    setTagInput("")
  }

  const handleContact = (post: MentorPost) => {
    if (!isAuthenticated) { navigate("/login"); return }
    navigate(`/chat/${post.id}?mentorId=${post.mentor.id}&name=${encodeURIComponent(post.subject)}`)
  }

  return (
    <div className="min-h-screen bg-[#080808]">
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-[#080808]/90 backdrop-blur border-b border-white/[0.05] px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500" onClick={() => navigate("/browse")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">Mentorship Board</span>
          </div>
        </div>
        {isAuthenticated && (
          <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Offer Mentorship
          </Button>
        )}
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Find a Mentor</h1>
          <p className="text-zinc-400 text-sm">Connect with seniors who can help you level up</p>
        </div>

        {/* Search + Tags */}
        <div className="mb-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Search by subject, topic…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {POPULAR_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? "" : tag)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium border transition-all",
                  selectedTag === tag
                    ? "bg-primary text-black border-primary"
                    : "border-white/10 text-zinc-400 hover:border-primary/40 hover:text-white"
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-zinc-600" /></div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <GraduationCap className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-400">No mentorship posts found</p>
            {isAuthenticated && (
              <Button className="mt-4" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4 mr-2" /> Be the first to offer mentorship
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {posts.map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="group bg-[#0f0f0f] border border-white/[0.07] rounded-2xl p-5 hover:border-primary/30 transition-all"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-sm leading-tight mb-1">{post.subject}</h3>
                      <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
                        <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                        <span>{post.mentor.reputation.toFixed(1)}</span>
                        <span>·</span>
                        <span>{post.mentor.name}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-0.5 text-primary font-semibold text-sm">
                        <IndianRupee className="h-3.5 w-3.5" />
                        <span>{post.hourlyRate > 0 ? post.hourlyRate : "Free"}</span>
                      </div>
                      {post.hourlyRate > 0 && <div className="text-zinc-600 text-xs">/hr</div>}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3 mb-3">
                    {post.description}
                  </p>

                  {/* Tags */}
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {post.tags.slice(0, 4).map((tag) => (
                        <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                          <Tag className="h-2.5 w-2.5" />{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* CTA */}
                  {user?.id !== post.mentor.id && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full gap-1.5 group-hover:border-primary/40"
                      onClick={() => handleContact(post)}
                    >
                      <MessageSquare className="h-3.5 w-3.5" /> Message Mentor
                    </Button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Pagination */}
        {meta.pages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <Button
              variant="outline" size="sm"
              disabled={meta.page <= 1}
              onClick={() => void fetchPosts(query, selectedTag, meta.page - 1)}
            >Previous</Button>
            <span className="px-3 py-1.5 text-sm text-zinc-400">
              {meta.page} / {meta.pages}
            </span>
            <Button
              variant="outline" size="sm"
              disabled={meta.page >= meta.pages}
              onClick={() => void fetchPosts(query, selectedTag, meta.page + 1)}
            >Next</Button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false) }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-[#0f0f0f] border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-lg">Offer Mentorship</h2>
                <button onClick={() => setShowCreate(false)} className="text-zinc-500 hover:text-white transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {createError && (
                <div className="mb-4 p-3 rounded-xl text-sm text-red-400 bg-red-500/10 border border-red-500/20">
                  {createError}
                </div>
              )}

              <form onSubmit={(e) => { void handleCreate(e) }} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-300">Subject / Topic *</label>
                  <Input
                    value={subject} onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Data Structures & Algorithms" required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-300">Description *</label>
                  <textarea
                    value={description} onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what you can help with, your background, etc."
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 resize-none h-28"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-300">Hourly Rate (₹) — 0 for free</label>
                  <Input
                    type="number" min="0" step="50"
                    value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)}
                    placeholder="e.g. 150"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-300">Tags (press Enter to add)</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {tags.map((t) => (
                      <span key={t} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/15 text-primary text-xs">
                        {t}
                        <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))}>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(tagInput) } }}
                    placeholder="e.g. Python, ML, LeetCode"
                  />
                  <div className="flex flex-wrap gap-1 mt-1">
                    {POPULAR_TAGS.filter((t) => !tags.includes(t)).slice(0, 5).map((t) => (
                      <button key={t} type="button" onClick={() => addTag(t)}
                        className="px-2 py-0.5 rounded-full text-xs border border-white/10 text-zinc-500 hover:text-primary hover:border-primary/40 transition-colors">
                        + {t}
                      </button>
                    ))}
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={createLoading}>
                  {createLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Posting…</> : "Post Mentorship"}
                </Button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
