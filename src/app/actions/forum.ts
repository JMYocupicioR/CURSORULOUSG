'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createForumThread(data: {
  title: string
  body: string
  category: string
}) {
  const supabase = await createClient()
  const { data: user } = await supabase.auth.getUser()
  if (!user?.user?.id) return { success: false, error: "No autenticado" }

  if (!data.title.trim() || !data.body.trim()) {
    return { success: false, error: "El título y el contenido son requeridos." }
  }

  const { error } = await supabase.from("forum_threads").insert({
    author_id: user.user.id,
    title: data.title.trim(),
    body: data.body.trim(),
    category: data.category || "General",
  })

  if (error) {
    console.error("[Forum] Error creating thread:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/community")
  return { success: true }
}

export async function createForumPost(data: {
  threadId: string
  body: string
}) {
  const supabase = await createClient()
  const { data: user } = await supabase.auth.getUser()
  if (!user?.user?.id) return { success: false, error: "No autenticado" }

  if (!data.body.trim()) {
    return { success: false, error: "La respuesta no puede estar vacía." }
  }

  const { error } = await supabase.from("forum_posts").insert({
    thread_id: data.threadId,
    author_id: user.user.id,
    body: data.body.trim(),
  })

  if (error) {
    console.error("[Forum] Error creating post:", error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/community/${data.threadId}`)
  revalidatePath("/community")
  return { success: true }
}

export async function toggleThreadLike(threadId: string) {
  const supabase = await createClient()
  const { data: result, error } = await supabase.rpc("toggle_thread_like", {
    p_thread_id: threadId,
  })

  if (error) {
    console.error("[Forum] Error toggling like:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/community")
  return { success: true, data: result?.[0] }
}

export async function deleteForumThread(threadId: string) {
  const supabase = await createClient()
  const { data: user } = await supabase.auth.getUser()
  if (!user?.user?.id) return { success: false, error: "No autenticado" }

  const { error } = await supabase
    .from("forum_threads")
    .delete()
    .eq("id", threadId)

  if (error) {
    console.error("[Forum] Error deleting thread:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/community")
  return { success: true }
}
