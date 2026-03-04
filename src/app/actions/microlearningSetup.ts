'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return false;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.user.id).single();
  return profile?.role === 'admin';
}

export async function createMicroLesson(data: {
  title: string;
  description?: string;
  duration_minutes: number;
  category: string;
  thumbnail_url?: string;
  video_url?: string;
  is_published?: boolean;
}) {
  const supabase = await createClient();
  
  if (!(await verifyAdmin())) {
    return { success: false, error: "Not an admin" };
  }

  const { error } = await supabase.from("micro_lessons").insert({
    title: data.title,
    description: data.description || "",
    duration_minutes: data.duration_minutes,
    category: data.category,
    thumbnail_url: data.thumbnail_url || null,
    video_url: data.video_url || null,
    is_published: data.is_published ?? false
  });

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/microlearning");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateMicroLesson(id: string, data: {
  title: string;
  description?: string;
  duration_minutes: number;
  category: string;
  thumbnail_url?: string;
  video_url?: string;
  is_published?: boolean;
}) {
  const supabase = await createClient();
  
  if (!(await verifyAdmin())) {
    return { success: false, error: "Not an admin" };
  }

  const { error } = await supabase.from("micro_lessons").update({
    title: data.title,
    description: data.description || "",
    duration_minutes: data.duration_minutes,
    category: data.category,
    thumbnail_url: data.thumbnail_url !== undefined ? data.thumbnail_url : null,
    video_url: data.video_url !== undefined ? data.video_url : null,
    is_published: data.is_published ?? false
  }).eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/microlearning");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteMicroLesson(id: string) {
  const supabase = await createClient();
  
  if (!(await verifyAdmin())) {
    return { success: false, error: "Not an admin" };
  }

  // Si hubiera que limpiar imagenes de storage, lo haríamos acá buscando el row primero
  
  const { error } = await supabase.from("micro_lessons").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/microlearning");
  revalidatePath("/dashboard");
  return { success: true };
}
