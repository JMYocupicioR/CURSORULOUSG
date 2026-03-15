'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import Mux from "@mux/mux-node";

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

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

  // 1. Fetch the lesson to get video_url (Mux playback ID) before deleting
  const { data: lesson } = await supabase
    .from("micro_lessons")
    .select("video_url, thumbnail_url")
    .eq("id", id)
    .single();

  // 2. If there's a Mux playback ID, find and delete the asset from Mux
  if (lesson?.video_url) {
    try {
      // video_url contains either a Mux playback ID or a full URL
      const playbackId = lesson.video_url.startsWith("http")
        ? null // It's an external URL, not a Mux asset
        : lesson.video_url;

      if (playbackId) {
        // List assets filtered by this playback ID to find the asset_id
        const assets = await mux.video.assets.list();
        const matchingAsset = assets.data?.find((a: { playback_ids?: Array<{ id: string }> }) =>
          a.playback_ids?.some((p: { id: string }) => p.id === playbackId)
        );

        if (matchingAsset) {
          await mux.video.assets.delete(matchingAsset.id);
          console.log(`[Mux] Micro-lesson asset ${matchingAsset.id} eliminado correctamente`);
        } else {
          console.warn(`[Mux] No se encontró asset para playback ID: ${playbackId}`);
        }
      }
    } catch (muxErr) {
      console.warn(`[Mux] No se pudo eliminar asset de micro-lección:`, muxErr);
      // Don't block the DB delete if Mux cleanup fails
    }
  }

  // 3. Delete from database
  const { error } = await supabase.from("micro_lessons").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/microlearning");
  revalidatePath("/dashboard");
  return { success: true };
}

