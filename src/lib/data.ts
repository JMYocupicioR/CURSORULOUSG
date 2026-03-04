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

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
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
  const { data, error } = await supabase
    .from("live_sessions")
    .select("*")
    .gte("session_date", new Date().toISOString())
    .order("session_date", { ascending: true })
    .limit(1);

  if (error) {
    console.error("Error fetching live sessions:", error);
    return [];
  }

  return data as LiveSession[];
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
