"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// ============================================================
// MARK NOTIFICATION AS READ
// ============================================================
export async function markNotificationRead(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: "No autenticado" }

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id) // RLS + explicit check

  if (error) {
    console.error("[Notifications] markRead error:", error.message)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard")
  return { success: true }
}

// ============================================================
// MARK ALL NOTIFICATIONS AS READ
// ============================================================
export async function markAllNotificationsRead(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: "No autenticado" }

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false)

  if (error) {
    console.error("[Notifications] markAllRead error:", error.message)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard")
  return { success: true }
}
