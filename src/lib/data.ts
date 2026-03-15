import { createClient } from "./supabase/server";
import { ModuleWithLessons, Enrollment, LiveSession, Certificate } from "@/types/app";
import { Database } from "@/types/supabase";

export async function getModules(): Promise<ModuleWithLessons[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("modules")
    .select("*, lessons(*)")
    .order("order_index", { ascending: true });

  if (error) {
    console.error("Error fetching modules:", error);
    return [];
  }

  // Sort lessons by order_index in JS since select order might not apply to subquery
  return (data as ModuleWithLessons[]).map((m) => ({
    ...m,
    lessons: (m.lessons || []).sort((a, b) => (a.order_index || 0) - (b.order_index || 0)),
  }));
}

export async function getUserEnrollment(): Promise<Enrollment | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: enrollment, error } = await supabase
    .from("enrollments")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error("Error fetching enrollment:", error);
    return null;
  }

  return (enrollment as Enrollment) || null;
}

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export async function getUserProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error("Error fetching profile:", error);
    return null;
  }

  // If profile exists but name is missing, try auth metadata
  if (profile && !profile.full_name && user.user_metadata?.full_name) {
    return { ...profile, full_name: user.user_metadata.full_name };
  }

  // If profile doesn't exist yet, return a skeleton from auth data
  if (!profile) {
    return {
      id: user.id,
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || "Usuario",
      email: user.email || null,
      role: (user.user_metadata?.role as string) || "student",
      specialty: null,
      phone: null,
      created_at: new Date().toISOString(),
      license_id: null,
      state: null,
      interest_area: null,
      experience_level: null,
    } as Profile;
  }

  return profile as Profile;
}

export async function getLesson(id: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("lessons")
      .select("*, modules(*)")
      .eq("id", id)
      .single();
  
    if (error) {
      console.error("Error fetching lesson:", error);
      return null;
    }
  
    return data;
}

export async function getLiveSessions(): Promise<LiveSession[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return [];

  // First, get sessions that are published and either send_to_all or user is a recipient
  const { data: allSessions, error } = await supabase
    .from("live_sessions")
    .select("*")
    .eq("is_published", true)
    .gte("session_date", new Date().toISOString())
    .order("session_date", { ascending: true });

  if (error) {
    console.error("Error fetching live sessions:", error);
    return [];
  }

  if (!allSessions || allSessions.length === 0) return [];

  // For sessions with send_to_all = false, check if user is a recipient
  const sessionsNeedingCheck = allSessions.filter(s => !s.send_to_all);
  
  if (sessionsNeedingCheck.length > 0) {
    const sessionIds = sessionsNeedingCheck.map(s => s.id);
    const { data: recipientRecords } = await supabase
      .from("session_recipients")
      .select("session_id")
      .eq("user_id", user.id)
      .in("session_id", sessionIds);

    const allowedSessionIds = new Set(recipientRecords?.map(r => r.session_id) || []);
    
    return allSessions.filter(s => 
      s.send_to_all || allowedSessionIds.has(s.id)
    ) as LiveSession[];
  }

  return allSessions as LiveSession[];
}

// ============================================================
// NOTIFICATIONS (Student)
// ============================================================
export type NotificationItem = {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  type: string;
  reference_id: string | null;
  is_read: boolean;
  created_at: string;
}

export async function getUserNotifications(limit = 20): Promise<NotificationItem[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }

  return (data as NotificationItem[]) || [];
}

export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) {
    console.error("Error fetching unread count:", error);
    return 0;
  }

  return count || 0;
}

// ============================================================
// ADMIN: All Live Sessions
// ============================================================
export async function getAllLiveSessions() {
  const supabase = await createClient();

  const { data: sessions, error } = await supabase
    .from("live_sessions")
    .select("*")
    .order("session_date", { ascending: false });

  if (error) {
    console.error("Error fetching all live sessions:", error);
    return [];
  }

  // Get recipient counts for non-send_to_all sessions
  if (sessions && sessions.length > 0) {
    const sessionIds = sessions.filter(s => !s.send_to_all).map(s => s.id);
    
    if (sessionIds.length > 0) {
      const { data: recipients } = await supabase
        .from("session_recipients")
        .select("session_id, user_id")
        .in("session_id", sessionIds);

      const recipientCounts: Record<string, number> = {};
      recipients?.forEach(r => {
        recipientCounts[r.session_id] = (recipientCounts[r.session_id] || 0) + 1;
      });

      return sessions.map(s => ({
        ...s,
        recipientCount: s.send_to_all ? null : (recipientCounts[s.id] || 0),
      }));
    }
  }

  return sessions?.map(s => ({ ...s, recipientCount: s.send_to_all ? null : 0 })) || [];
}

export async function getLiveSessionRecipients(sessionId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("session_recipients")
    .select("user_id")
    .eq("session_id", sessionId);

  if (error) return [];
  return data?.map(r => r.user_id) || [];
}


export async function getUserCertificates(): Promise<Certificate[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("certificates")
    .select("*")
    .eq("user_id", user.id)
    .order("issue_date", { ascending: false });

  if (error) {
    console.error("Error fetching certificates:", error);
    return [];
  }

  return data as Certificate[];
}

export async function getUserLessonProgress(lessonId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("lesson_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("lesson_id", lessonId)
    .single();

  if (error && error.code !== 'PGRST116') { // not found
    console.error("Error fetching lesson progress:", error);
    return null;
  }

  return data;
}

export async function getUserCompletedLessons(): Promise<string[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("lesson_progress")
    .select("lesson_id")
    .eq("user_id", user.id)
    .eq("is_completed", true);

  if (error) {
    console.error("Error fetching completed lessons:", error);
    return [];
  }

  return data.map(d => d.lesson_id);
}

export type RecentActivityItem = {
  lesson_id: string;
  lesson_title: string;
  completed_at: string;
  lesson_type: string | null;
  score: number | null;
}

export async function getRecentActivity(limit = 5): Promise<RecentActivityItem[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("lesson_progress")
    .select("lesson_id, completed_at, score, lessons(title, lesson_type)")
    .eq("user_id", user.id)
    .eq("is_completed", true)
    .order("completed_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching recent activity:", error);
    return [];
  }

  return (data || []).map((d: any) => ({
    lesson_id: d.lesson_id,
    lesson_title: d.lessons?.title || 'Lección',
    completed_at: d.completed_at || '',
    lesson_type: d.lessons?.lesson_type || null,
    score: d.score,
  }));
}

export async function getAllUserEnrollments(): Promise<Enrollment[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("enrollments")
    .select("*")
    .eq("user_id", user.id);

  if (error) {
    console.error("Error fetching all enrollments:", error);
    return [];
  }

  return (data as Enrollment[]) || [];
}

export type QuizAttempt = {
  id: string;
  score: number;
  passed: boolean;
  created_at: string;
}

export async function getUserQuizAttempts(quizId: string): Promise<QuizAttempt[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("quiz_attempts")
    .select("id, score, passed, created_at")
    .eq("user_id", user.id)
    .eq("quiz_id", quizId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching quiz attempts:", error);
    return [];
  }

  return (data as QuizAttempt[]) || [];
}

// ============================================================
// STUDY STREAK (computed from lesson_progress dates)
// ============================================================
export type StudyStreak = {
  currentStreak: number;
  totalActiveDays: number;
  last7Days: boolean[]; // [6 days ago, 5 days ago, ..., today]
}

export async function getStudyStreak(): Promise<StudyStreak> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { currentStreak: 0, totalActiveDays: 0, last7Days: Array(7).fill(false) };

  const { data, error } = await supabase
    .from("lesson_progress")
    .select("completed_at")
    .eq("user_id", user.id)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false });

  if (error || !data || data.length === 0) {
    return { currentStreak: 0, totalActiveDays: 0, last7Days: Array(7).fill(false) };
  }

  // Get unique active dates (in local timezone)
  const activeDates = new Set<string>();
  data.forEach(row => {
    if (row.completed_at) {
      const d = new Date(row.completed_at);
      activeDates.add(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`);
    }
  });

  // Compute current streak
  let currentStreak = 0;
  const today = new Date();
  const checkDate = new Date(today);
  
  // Check today first, then go backwards
  for (let i = 0; i < 365; i++) {
    const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth()+1).padStart(2,'0')}-${String(checkDate.getDate()).padStart(2,'0')}`;
    if (activeDates.has(dateStr)) {
      currentStreak++;
    } else if (i > 0) {
      // Allow skipping today (might not have studied yet today)
      break;
    }
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Last 7 days activity
  const last7Days: boolean[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    last7Days.push(activeDates.has(dateStr));
  }

  return { currentStreak, totalActiveDays: activeDates.size, last7Days };
}

export async function getLessonQuiz(lessonId: string) {
  const supabase = await createClient();
  
  // Get quiz
  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .select("*")
    .eq("lesson_id", lessonId)
    .single();
    
  if (quizError || !quiz) return null;
  
  // Get questions
  const { data: questions, error: qError } = await supabase
    .from("questions")
    .select("*")
    .eq("quiz_id", quiz.id)
    .order("order_index", { ascending: true });
    
  if (qError) return null;
  
  return { ...quiz, questions };
}

export type MicroLesson = {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  category: string;
  thumbnail_url: string | null;
  video_url: string | null;
  is_published: boolean;
  created_at: string;
}

export async function getMicroLessons(onlyPublished = true): Promise<MicroLesson[]> {
  const supabase = await createClient();
  let query = supabase.from("micro_lessons").select("*").order("created_at", { ascending: false });
  
  if (onlyPublished) {
    query = query.eq("is_published", true);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching micro lessons:", error);
    return [];
  }

  return data as MicroLesson[];
}

// ============================================================
// CERTIFICATE CONFIG
// ============================================================
export async function getCertificateConfig() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("certificate_config")
    .select("*")
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error("Error fetching certificate config:", error);
  }

  return data ?? null;
}

// ============================================================
// ALL ISSUED CERTIFICATES (ADMIN)
// ============================================================
export async function getCertificatesList() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("certificates")
    .select("*")
    .order("issue_date", { ascending: false });

  if (error) {
    console.error("Error fetching certificates list:", error.message, error.code, error.details, error.hint);
    return [];
  }

  return data ?? [];
}

// ============================================================
// SINGLE CERTIFICATE BY FOLIO (PUBLIC)
// ============================================================
export async function getCertificateByFolio(folio: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("certificates")
    .select("*")
    .eq("folio", folio)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error("Error fetching certificate by folio:", error);
  }

  return data ?? null;
}
