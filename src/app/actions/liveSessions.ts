"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

// ============================================================
// HELPERS
// ============================================================
async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") return null
  return user
}

// ============================================================
// CREATE LIVE SESSION
// ============================================================
export async function createLiveSession(formData: {
  title: string
  description?: string
  session_date: string
  duration_minutes: number
  meeting_url: string
  platform: string
  is_published: boolean
  send_to_all: boolean
  recipient_ids?: string[]
}): Promise<{ success: boolean; error?: string; id?: string }> {
  const admin = await verifyAdmin()
  if (!admin) return { success: false, error: "Sin permisos de administrador" }

  const adminClient = createAdminClient()

  // 1. Insert live session
  const { data: session, error: sessionError } = await adminClient
    .from("live_sessions")
    .insert({
      title: formData.title,
      description: formData.description || null,
      session_date: formData.session_date,
      duration_minutes: formData.duration_minutes,
      meeting_url: formData.meeting_url,
      platform: formData.platform,
      is_published: formData.is_published,
      send_to_all: formData.send_to_all,
      status: "scheduled",
      created_by: admin.id,
    })
    .select("id")
    .single()

  if (sessionError || !session) {
    console.error("[Admin] createLiveSession error:", JSON.stringify(sessionError))
    return { success: false, error: sessionError?.message || "Error al crear sesión" }
  }

  // 2. Insert recipients if send_to_all = false
  if (!formData.send_to_all && formData.recipient_ids && formData.recipient_ids.length > 0) {
    const recipientRows = formData.recipient_ids.map(userId => ({
      session_id: session.id,
      user_id: userId,
    }))
    const { error: recipError } = await adminClient
      .from("session_recipients")
      .insert(recipientRows)

    if (recipError) {
      console.error("[Admin] createLiveSession recipients error:", JSON.stringify(recipError))
    }
  }

  // 3. Generate notifications for recipients
  if (formData.is_published) {
    await generateSessionNotifications(adminClient, session.id, formData)
  }

  revalidatePath("/admin/sesiones")
  return { success: true, id: session.id }
}

// ============================================================
// UPDATE LIVE SESSION
// ============================================================
export async function updateLiveSession(
  sessionId: string,
  formData: {
    title: string
    description?: string
    session_date: string
    duration_minutes: number
    meeting_url: string
    platform: string
    is_published: boolean
    send_to_all: boolean
    recipient_ids?: string[]
  }
): Promise<{ success: boolean; error?: string }> {
  const admin = await verifyAdmin()
  if (!admin) return { success: false, error: "Sin permisos de administrador" }

  const adminClient = createAdminClient()

  const { error: updateError } = await adminClient
    .from("live_sessions")
    .update({
      title: formData.title,
      description: formData.description || null,
      session_date: formData.session_date,
      duration_minutes: formData.duration_minutes,
      meeting_url: formData.meeting_url,
      platform: formData.platform,
      is_published: formData.is_published,
      send_to_all: formData.send_to_all,
    })
    .eq("id", sessionId)

  if (updateError) {
    console.error("[Admin] updateLiveSession error:", JSON.stringify(updateError))
    return { success: false, error: updateError.message }
  }

  // Re-sync recipients
  await adminClient.from("session_recipients").delete().eq("session_id", sessionId)
  if (!formData.send_to_all && formData.recipient_ids && formData.recipient_ids.length > 0) {
    const recipientRows = formData.recipient_ids.map(userId => ({
      session_id: sessionId,
      user_id: userId,
    }))
    await adminClient.from("session_recipients").insert(recipientRows)
  }

  revalidatePath("/admin/sesiones")
  return { success: true }
}

// ============================================================
// DELETE LIVE SESSION
// ============================================================
export async function deleteLiveSession(
  sessionId: string
): Promise<{ success: boolean; error?: string }> {
  const admin = await verifyAdmin()
  if (!admin) return { success: false, error: "Sin permisos de administrador" }

  const adminClient = createAdminClient()

  // Delete associated notifications
  await adminClient.from("notifications").delete().eq("reference_id", sessionId)

  // Delete session (cascade deletes session_recipients)
  const { error } = await adminClient
    .from("live_sessions")
    .delete()
    .eq("id", sessionId)

  if (error) {
    console.error("[Admin] deleteLiveSession error:", JSON.stringify(error))
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/sesiones")
  return { success: true }
}

// ============================================================
// TOGGLE PUBLISH SESSION
// ============================================================
export async function togglePublishSession(
  sessionId: string,
  isPublished: boolean
): Promise<{ success: boolean; error?: string }> {
  const admin = await verifyAdmin()
  if (!admin) return { success: false, error: "Sin permisos de administrador" }

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from("live_sessions")
    .update({ is_published: isPublished })
    .eq("id", sessionId)

  if (error) {
    console.error("[Admin] togglePublishSession error:", JSON.stringify(error))
    return { success: false, error: error.message }
  }

  // If publishing, generate notifications
  if (isPublished) {
    const { data: session } = await adminClient
      .from("live_sessions")
      .select("*")
      .eq("id", sessionId)
      .single()

    if (session) {
      await generateSessionNotifications(adminClient, sessionId, session)
    }
  }

  revalidatePath("/admin/sesiones")
  return { success: true }
}

// ============================================================
// HELPER: Generate notifications
// ============================================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateSessionNotifications(adminClient: any, sessionId: string, session: any) {
  let recipientUserIds: string[] = []

  if (session.send_to_all) {
    // Get all active students
    const { data: students } = await adminClient
      .from("profiles")
      .select("id")
      .neq("role", "admin")
      .eq("is_active", true)

    recipientUserIds = students?.map((s: { id: string }) => s.id) || []
  } else {
    // Get specific recipients
    const ids = session.recipient_ids || []
    if (ids.length > 0) {
      recipientUserIds = ids
    } else {
      const { data: recipients } = await adminClient
        .from("session_recipients")
        .select("user_id")
        .eq("session_id", sessionId)

      recipientUserIds = recipients?.map((r: { user_id: string }) => r.user_id) || []
    }
  }

  if (recipientUserIds.length === 0) return

  // Avoid duplicate notifications — delete existing ones for this session
  await adminClient.from("notifications").delete().eq("reference_id", sessionId)

  const sessionDate = new Date(session.session_date)
  const dateStr = sessionDate.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })

  const notificationRows = recipientUserIds.map((userId: string) => ({
    user_id: userId,
    title: `📹 Clase en vivo: ${session.title}`,
    body: `Programada para ${dateStr}. ¡No faltes!`,
    type: "live_session",
    reference_id: sessionId,
    is_read: false,
  }))

  const { error } = await adminClient.from("notifications").insert(notificationRows)
  if (error) {
    console.error("[Admin] generateSessionNotifications error:", JSON.stringify(error))
  }
}
