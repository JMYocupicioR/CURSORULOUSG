import { Header } from "@/components/dashboard/header"
import { getUserProfile } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ThreadDetailClient } from "./ThreadDetailClient"

async function getThread(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("forum_threads")
    .select(`
      id, title, body, category, is_official, is_pinned,
      reply_count, like_count, created_at,
      profiles:author_id (full_name, role)
    `)
    .eq("id", id)
    .single()

  if (error || !data) return null
  return data
}

async function getThreadPosts(threadId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("forum_posts")
    .select(`
      id, body, like_count, created_at,
      profiles:author_id (full_name, role)
    `)
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true })
  return data || []
}

export default async function ThreadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = await getUserProfile()
  const displayName = profile?.full_name || "Estudiante"

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [thread, posts] = await Promise.all([
    getThread(id),
    getThreadPosts(id),
  ])

  if (!thread) notFound()

  const isAdmin = profile?.role === "admin"

  return (
    <>
      <Header userName={displayName} />
      <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-background-light dark:bg-background-dark font-body">
        <div className="max-w-3xl mx-auto">
          <Link href="/community" className="text-sm text-gray-500 hover:text-primary flex items-center gap-1 mb-6 w-fit transition-colors">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Volver al Foro
          </Link>
          <ThreadDetailClient
            thread={thread}
            posts={posts}
            currentUserId={user?.id || null}
            isAdmin={isAdmin}
          />
        </div>
      </div>
    </>
  )
}
