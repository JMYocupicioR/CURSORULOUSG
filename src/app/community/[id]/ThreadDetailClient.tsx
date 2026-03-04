"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { createForumPost } from "@/app/actions/forum"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

type Post = {
  id: string
  body: string
  like_count: number
  created_at: string
  profiles: { full_name: string | null; role: string | null } | null
}

type Thread = {
  id: string
  title: string
  body: string
  category: string
  is_official: boolean
  like_count: number
  reply_count: number
  created_at: string
  profiles: { full_name: string | null; role: string | null } | null
}

function getInitials(name: string | null) {
  if (!name) return "??"
  return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()
}

function timeAgo(date: string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es })
}

export function ThreadDetailClient({
  thread,
  posts: initialPosts,
  currentUserId,
  isAdmin,
}: {
  thread: Thread
  posts: Post[]
  currentUserId: string | null
  isAdmin: boolean
}) {
  const [posts, setPosts] = useState(initialPosts)
  const [replyBody, setReplyBody] = useState("")
  const [isPending, startTransition] = useTransition()

  const handleReply = () => {
    if (!replyBody.trim()) {
      toast.error("La respuesta no puede estar vacía.")
      return
    }
    startTransition(async () => {
      const res = await createForumPost({ threadId: thread.id, body: replyBody })
      if (res.success) {
        toast.success("Respuesta publicada.")
        setReplyBody("")
        // The page will revalidate via server action, but also update locally for UX
        setPosts(prev => [...prev, {
          id: Math.random().toString(),
          body: replyBody,
          like_count: 0,
          created_at: new Date().toISOString(),
          profiles: { full_name: "Tú", role: null }
        }])
      } else {
        toast.error(res.error || "Error al publicar.")
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Thread Header */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
            {getInitials(thread.profiles?.full_name ?? null)}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl md:text-2xl font-bold text-secondary dark:text-white">{thread.title}</h1>
              {thread.is_official && (
                <span className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Oficial
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span>{thread.profiles?.full_name || "Anónimo"}</span>
              <span>·</span>
              <span>{timeAgo(thread.created_at)}</span>
              <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300 text-[11px]">
                {thread.category}
              </span>
            </div>
          </div>
        </div>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">{thread.body}</p>
        <div className="mt-4 flex items-center gap-4 text-xs text-gray-500 border-t border-gray-100 dark:border-gray-800 pt-4">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">chat_bubble</span>
            {posts.length} respuestas
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-red-400">favorite</span>
            {thread.like_count} me gusta
          </span>
        </div>
      </div>

      {/* Posts / Replies */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-10 text-center">
            <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2 block">chat</span>
            <p className="text-sm text-gray-500">Nadie ha respondido aún. ¡Sé el primero!</p>
          </div>
        ) : posts.map((post) => (
          <div key={post.id} className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold text-sm text-gray-600 dark:text-gray-300 shrink-0">
                {getInitials(post.profiles?.full_name ?? null)}
              </div>
              <div>
                <p className="text-sm font-semibold text-secondary dark:text-white">
                  {post.profiles?.full_name || "Anónimo"}
                  {post.profiles?.role === "admin" && (
                    <span className="ml-2 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">ADMIN</span>
                  )}
                </p>
                <p className="text-xs text-gray-400">{timeAgo(post.created_at)}</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line pl-12">{post.body}</p>
          </div>
        ))}
      </div>

      {/* Reply Composer */}
      {currentUserId ? (
        <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-secondary dark:text-white mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">reply</span>
            Tu respuesta
          </h3>
          <textarea
            rows={4}
            value={replyBody}
            onChange={e => setReplyBody(e.target.value)}
            placeholder="Escribe tu respuesta..."
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-secondary dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary/50 transition-colors resize-none mb-3"
          />
          <div className="flex justify-end">
            <button
              onClick={handleReply}
              disabled={isPending || !replyBody.trim()}
              className="bg-primary hover:bg-cyan-500 disabled:opacity-60 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
            >
              {isPending ? (
                <><span className="material-symbols-outlined animate-spin text-base">autorenew</span>Publicando...</>
              ) : (
                <><span className="material-symbols-outlined text-base">send</span>Publicar Respuesta</>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-6 text-center">
          <p className="text-sm text-gray-500">Inicia sesión para responder en el foro.</p>
        </div>
      )}
    </div>
  )
}
