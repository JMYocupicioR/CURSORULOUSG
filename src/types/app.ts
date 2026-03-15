import { Database } from "@/types/supabase"

export type ModuleWithLessons = Database['public']['Tables']['modules']['Row'] & {
  lessons: Database['public']['Tables']['lessons']['Row'][]
}

export type Enrollment = Database['public']['Tables']['enrollments']['Row']

export type Certificate = any
export type Payment = any
export type ActivityLog = any

// ============================================================
// LIVE SESSIONS
// ============================================================
export type LiveSession = {
  id: string
  title: string
  description: string | null
  session_date: string
  duration_minutes: number
  meeting_url: string
  platform: string
  is_published: boolean
  send_to_all: boolean
  status: string | null
  created_by: string | null
  created_at: string
}

// ============================================================
// NOTIFICATIONS
// ============================================================
export type Notification = {
  id: string
  user_id: string
  title: string
  body: string | null
  type: string
  reference_id: string | null
  is_read: boolean
  created_at: string
}

// ============================================================
// SESSION RECIPIENTS
// ============================================================
export type SessionRecipient = {
  id: string
  session_id: string
  user_id: string
  created_at: string
}
