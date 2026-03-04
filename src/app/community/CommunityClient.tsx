"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { createForumThread, toggleThreadLike, deleteForumThread } from "@/app/actions/forum"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

type Thread = {
  id: string
  title: string
  body: string
  category: string
  is_pinned: boolean
  is_official: boolean
  reply_count: number
  like_count: number
  created_at: string
  profiles: { full_name: string | null; role: string | null } | null
}

function getInitials(name: string | null): string {
  if (!name) return "??"
  return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()
}

function timeAgo(date: string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es })
}

const CATEGORY_COLORS: Record<string, string> = {
  "General": "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
  "Casos Clínicos": "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300",
  "Técnica": "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
  "Anatomía": "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
  "Dudas": "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
  "Recursos": "bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300",
}

export function CommunityClient({
  threads: initialThreads,
  likedIds: initialLikedIds,
  currentUserId,
  isAdmin,
  categories,
}: {
  threads: Thread[]
  likedIds: string[]
  currentUserId: string | null
  isAdmin: boolean
  categories: string[]
}) {
  const [threads, setThreads] = useState(initialThreads)
  const [likedIds, setLikedIds] = useState<string[]>(initialLikedIds)
  const [activeCategory, setActiveCategory] = useState("Todos")
  const [showNewThread, setShowNewThread] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newBody, setNewBody] = useState("")
  const [newCategory, setNewCategory] = useState("General")
  const [isPending, startTransition] = useTransition()

  const filteredThreads = activeCategory === "Todos"
    ? threads
    : threads.filter(t => t.category === activeCategory)

  const handleCreate = () => {
    if (!newTitle.trim() || !newBody.trim()) {
      toast.error("El título y el contenido son requeridos.")
      return
    }
    startTransition(async () => {
      const res = await createForumThread({ title: newTitle, body: newBody, category: newCategory })
      if (res.success) {
        toast.success("Tema publicado correctamente.")
        setShowNewThread(false)
        setNewTitle(""); setNewBody(""); setNewCategory("General")
      } else {
        toast.error(res.error || "Error al publicar.")
      }
    })
  }

  const handleLike = (threadId: string) => {
    startTransition(async () => {
      const isLiked = likedIds.includes(threadId)
      setLikedIds(prev => isLiked ? prev.filter(id => id !== threadId) : [...prev, threadId])
      setThreads(prev => prev.map(t =>
        t.id === threadId ? { ...t, like_count: t.like_count + (isLiked ? -1 : 1) } : t
      ))
      const res = await toggleThreadLike(threadId)
      if (!res.success) {
        // Revert optimistic update on fail
        setLikedIds(prev => isLiked ? [...prev, threadId] : prev.filter(id => id !== threadId))
        setThreads(prev => prev.map(t =>
          t.id === threadId ? { ...t, like_count: t.like_count + (isLiked ? 1 : -1) } : t
        ))
        toast.error("Error al registrar el like.")
      }
    })
  }

  const handleDelete = (threadId: string) => {
    if (!confirm("¿Eliminar este tema? Esta acción no se puede deshacer.")) return
    startTransition(async () => {
      const res = await deleteForumThread(threadId)
      if (res.success) {
        setThreads(prev => prev.filter(t => t.id !== threadId))
        toast.success("Tema eliminado.")
      } else {
        toast.error(res.error || "Error al eliminar.")
      }
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* ── Left Column: Threads ── */}
      <div className="lg:col-span-2 space-y-6">

        {/* Category filter + New Thread button */}
        <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {["Todos", ...categories].map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    activeCategory === cat
                      ? "bg-primary text-white shadow-sm"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowNewThread(true)}
              className="bg-primary hover:bg-cyan-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-all shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Nuevo Tema
            </button>
          </div>
        </div>

        {/* New Thread Form */}
        {showNewThread && (
          <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-primary/30 shadow-lg shadow-primary/5 p-6 animate-in fade-in-0 slide-in-from-top-2 duration-200">
            <h3 className="text-lg font-bold text-secondary dark:text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">edit_note</span>
              Nuevo Tema
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Categoría</label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-secondary dark:text-white focus:outline-none focus:border-primary/50 transition-colors"
                >
                  {categories.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Título</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Pregunta o título de tu tema..."
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-secondary dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Contenido</label>
                <textarea
                  rows={5}
                  value={newBody}
                  onChange={e => setNewBody(e.target.value)}
                  placeholder="Describe tu caso, duda o aportación..."
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-secondary dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary/50 transition-colors resize-none"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowNewThread(false)} className="px-4 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={handleCreate}
                  disabled={isPending}
                  className="bg-primary hover:bg-cyan-500 disabled:opacity-60 text-white px-6 py-2 rounded-xl text-sm font-bold transition-all"
                >
                  {isPending ? "Publicando..." : "Publicar"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Thread List */}
        <div className="space-y-4">
          {filteredThreads.length === 0 ? (
            <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
              <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-600 mb-3 block">forum</span>
              <h3 className="font-bold text-gray-500 mb-1">No hay temas todavía</h3>
              <p className="text-sm text-gray-400">¡Sé el primero en iniciar una conversación!</p>
            </div>
          ) : filteredThreads.map(thread => {
            const isLiked = likedIds.includes(thread.id)
            const isOwn = currentUserId === null ? false : false // Will rely on delete RLS
            const initials = getInitials(thread.profiles?.full_name ?? null)

            return (
              <div
                key={thread.id}
                className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-primary/40 transition-all shadow-sm hover:shadow-md group"
              >
                <div className="p-5">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {thread.is_pinned && (
                            <span className="material-symbols-outlined text-primary text-base" title="Anclado">push_pin</span>
                          )}
                          <Link href={`/community/${thread.id}`} className="font-bold text-secondary dark:text-white group-hover:text-primary transition-colors line-clamp-1">
                            {thread.title}
                          </Link>
                          {thread.is_official && (
                            <span className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold shrink-0">
                              Oficial
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">{timeAgo(thread.created_at)}</span>
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">{thread.body}</p>

                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-3 text-xs font-medium text-gray-500">
                          <Link href={`/community/${thread.id}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-[16px]">chat_bubble</span>
                            {thread.reply_count}
                          </Link>
                          <button
                            onClick={() => handleLike(thread.id)}
                            className={`flex items-center gap-1 transition-colors ${isLiked ? "text-red-500" : "hover:text-red-500"}`}
                          >
                            <span className="material-symbols-outlined text-[16px]">{isLiked ? "favorite" : "favorite_border"}</span>
                            {thread.like_count}
                          </button>
                          <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${CATEGORY_COLORS[thread.category] || CATEGORY_COLORS["General"]}`}>
                            {thread.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 truncate max-w-[120px]">{thread.profiles?.full_name || "Anónimo"}</span>
                          {(isAdmin) && (
                            <button
                              onClick={() => handleDelete(thread.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                              title="Eliminar"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Right Column: Sidebar ── */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-secondary text-white rounded-2xl shadow-lg p-6 relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-32 h-32 bg-primary/20 rounded-full blur-2xl" />
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2 relative z-10">
            <span className="material-symbols-outlined text-primary">info</span>
            Normas del Foro
          </h3>
          <ul className="space-y-2.5 relative z-10 text-sm text-gray-300">
            {[
              "Respetar a todos los miembros",
              "No publicar datos personales de pacientes",
              "Verificar la información antes de compartir",
              "Usar la categoría correcta al publicar",
              "Los casos clínicos deben ser anonimizados",
            ].map((r, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="material-symbols-outlined text-primary text-[16px] mt-0.5 shrink-0">check_circle</span>
                {r}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-bold text-secondary dark:text-white mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">label</span>
            Categorías
          </h3>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${CATEGORY_COLORS[cat] || ""} hover:scale-105`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
