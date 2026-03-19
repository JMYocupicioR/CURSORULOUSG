'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import Mux from "@mux/mux-node";
import { SupabaseClient } from "@supabase/supabase-js";

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

/**
 * Valida si el usuario actual tiene permisos de administrador.
 */
async function verifyAdmin(supabase: SupabaseClient) {
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return false;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.user.id).single();
  return profile?.role === 'admin';
}

/**
 * Registra una nueva lección (video) en la base de datos.
 * Este action recibe el Mux Asset ID (generado por el webhook de Mux) y crea el registro.
 * La subida inicial se maneja con createMuxDirectUpload.
 */
export async function createVideoLesson(data: {
  moduleId: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  muxAssetId?: string; // Expect Mux Asset ID instead of direct video URLs
  isMasterCamera?: boolean;
}) {
  const supabase = await createClient();

  if (!(await verifyAdmin(supabase))) {
    return { success: false, error: "Not an admin" };
  }

  const { error } = await supabase.from("lessons").insert({
    module_id: data.moduleId,
    title: data.title,
    description: data.description || "",
    thumbnail_url: data.thumbnailUrl || null,
    mux_asset_id: data.muxAssetId || null, // Store Mux Asset ID
    lesson_type: "video",
    is_master_camera: data.isMasterCamera !== false,
    is_published: true // o false dependiendondel estado inicial
  });

  if (error) {
    console.error("DB error adding lesson:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/contenido");
  return { success: true };
}

/**
 * Registra un material (documento/pdf) en una lección existente
 */
export async function addDocumentToLesson(data: {
  lessonId: string;
  documentTitle: string;
  documentUrl: string; // URL en Supabase Storage
}) {
  const supabase = await createClient();

  if (!(await verifyAdmin(supabase))) {
    return { success: false, error: "Not an admin" };
  }

  // Obtenemos los materiales previos
  const { data: lesson, error: fetchError } = await supabase.from("lessons").select("materials").eq("id", data.lessonId).single();
  if (fetchError || !lesson) return { success: false, error: "Lección no encontrada" };

  const materials = Array.isArray(lesson.materials) ? lesson.materials : [];
  materials.push({ title: data.documentTitle, url: data.documentUrl });

  const { error } = await supabase.from("lessons").update({
    materials,
    lesson_type: "document"
  }).eq("id", data.lessonId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/contenido");
  return { success: true };
}

/**
 * Registra un Quiz y sus Preguntas de forma masiva (Quiz Builder)
 */
export async function createQuiz(data: {
  lessonId: string;
  title: string;
  minScore: number;
  questions: Array<{
    questionText: string;
    options: Array<{ id: string; text: string; feedback_clinical?: string }>;
    correctOptionId: string;
    score: number;
    difficulty?: number;
    is_critical?: boolean;
    image_url?: string;
    pearl?: string;
    source_reference?: string;
    findings?: Array<{ type: string; label: string; value: string }>;
  }>;
}) {
  const supabase = await createClient();
  
  if (!(await verifyAdmin(supabase))) {
    return { success: false, error: "Not an admin" };
  }

  // 1. Crear el Quiz
  const { data: quizIdData, error: quizError } = await supabase
    .from("quizzes")
    .insert({
      lesson_id: data.lessonId,
      title: data.title,
      min_score_to_pass: data.minScore
    })
    .select("id")
    .single();

  if (quizError || !quizIdData) {
    console.error("Quiz Error:", quizError);
    return { success: false, error: quizError?.message };
  }

  // 2. Marcar la lección como de tipo 'quiz'
  await supabase.from("lessons").update({ lesson_type: "quiz" }).eq("id", data.lessonId);

  // 3. Crear las Preguntas
  const questionsToInsert = data.questions.map((q, index) => ({
    quiz_id: quizIdData.id,
    question_text: q.questionText,
    options: q.options,
    correct_option_id: q.correctOptionId,
    score: q.score,
    order_index: index,
    difficulty: q.difficulty || 1,
    is_critical: q.is_critical || false,
    image_url: q.image_url || null,
    pearl: q.pearl || null,
    source_reference: q.source_reference || null,
    findings: q.findings || []
  }));

  const { error: qtError } = await supabase.from("questions").insert(questionsToInsert);

  if (qtError) {
    console.error("Question Insert Error:", qtError);
    return { success: false, error: "Error insertando preguntas" };
  }

  revalidatePath("/admin/contenido");
  return { success: true, quizId: quizIdData.id };
}

/**
 * Actualiza un Quiz y sus Preguntas de forma masiva (Quiz Builder Edición)
 */
export async function updateQuiz(data: {
  quizId: string;
  title: string;
  minScore: number;
  questions: Array<{
    questionText: string;
    options: Array<{ id: string; text: string; feedback_clinical?: string }>;
    correctOptionId: string;
    score: number;
    difficulty?: number;
    is_critical?: boolean;
    image_url?: string;
    pearl?: string;
    source_reference?: string;
    findings?: Array<{ type: string; label: string; value: string }>;
  }>;
}) {
  const supabase = await createClient();
  
  if (!(await verifyAdmin(supabase))) {
    return { success: false, error: "Not an admin" };
  }

  // 1. Actualizar el Quiz
  const { error: quizError } = await supabase
    .from("quizzes")
    .update({
      title: data.title,
      min_score_to_pass: data.minScore
    })
    .eq("id", data.quizId);

  if (quizError) {
    console.error("Quiz Update Error:", quizError);
    return { success: false, error: quizError.message };
  }

  // 2. Borrar Preguntas Previas
  const { error: deleteError } = await supabase
    .from("questions")
    .delete()
    .eq("quiz_id", data.quizId);

  if (deleteError) {
    console.error("Questions Delete Error:", deleteError);
    return { success: false, error: "Error borrando preguntas anteriores." };
  }

  // 3. Recrear las Preguntas
  const questionsToInsert = data.questions.map((q, index) => ({
    quiz_id: data.quizId,
    question_text: q.questionText,
    options: q.options,
    correct_option_id: q.correctOptionId,
    score: q.score,
    order_index: index,
    difficulty: q.difficulty || 1,
    is_critical: q.is_critical || false,
    image_url: q.image_url || null,
    pearl: q.pearl || null,
    source_reference: q.source_reference || null,
    findings: q.findings || []
  }));

  const { error: qtError } = await supabase.from("questions").insert(questionsToInsert);

  if (qtError) {
    console.error("Question Insert Error:", qtError);
    return { success: false, error: "Error re-insertando preguntas: " + qtError.message };
  }

  revalidatePath("/admin/contenido");
  return { success: true, quizId: data.quizId };
}

/**
 * Obtiene un Quiz completo (con preguntas y opciones) a partir de su lesson_id.
 * Útil para cargar los valores iniciales en QuizBuilder.
 */
export async function getQuizByLessonId(lessonId: string) {
  const supabase = await createClient();
  
  if (!(await verifyAdmin(supabase))) {
    return { success: false, error: "No autorizado" };
  }

  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .select("*, questions(*)")
    .eq("lesson_id", lessonId)
    .single();

  if (quizError || !quiz) {
    return { success: false, error: quizError?.message || "Quiz no encontrado" };
  }

  // Ordenar las preguntas por order_index
  if (quiz.questions) {
    quiz.questions.sort((a: { order_index?: number }, b: { order_index?: number }) => (a.order_index || 0) - (b.order_index || 0));
  }

  return { success: true, data: quiz };
}

/**
 * Marca una lección como completada por el usuario, actualiza el puntaje.
 * Un trigger en PostgreSQL se encargará de recalcular el porcentaje del módulo y el certificado global.
 */
export async function completeLessonProgress(lessonId: string, score: number | null = null) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user?.id) return { success: false, error: "No user found" };

  const { error } = await supabase.from("lesson_progress").upsert({
    user_id: user.user.id,
    lesson_id: lessonId,
    is_completed: true,
    score: score,
    completed_at: new Date().toISOString()
  }, { onConflict: "user_id, lesson_id" });

  if (error) {
    console.error("Error saving progress:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * Registra un intento de Quiz en el historial de intentos (quiz_attempts).
 * Si el estudiante aprueba, también llama a completeLessonProgress internamente.
 */
export async function submitQuizAttempt({
  lessonId,
  quizId,
  score,
  passed
}: {
  lessonId: string;
  quizId: string;
  score: number;
  passed: boolean;
}) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user?.id) return { success: false, error: "No user found" };

  // 1. Registrar el intento
  const { error: attemptError } = await supabase.from("quiz_attempts").insert({
    user_id: user.user.id,
    quiz_id: quizId,
    score: score,
    passed: passed
  });

  if (attemptError) {
    console.error("Error saving quiz attempt:", attemptError);
    return { success: false, error: attemptError.message };
  }

  // 2. Si aprueba, aseguramos que la lección se marque completada en progress global
  if (passed) {
    const { error: progressError } = await supabase.from("lesson_progress").upsert({
      user_id: user.user.id,
      lesson_id: lessonId,
      is_completed: true,
      score: score,
      completed_at: new Date().toISOString()
    }, { onConflict: "user_id, lesson_id" });
    
    if (progressError) console.error("Error saving passed lesson_progress:", progressError);
  }

  revalidatePath("/dashboard");
  return { success: true };
}

// ====== MODULE MANAGEMENT ======

export async function createMuxDirectUpload(module_id: string, title?: string) {
  const supabase = await createClient();
  
  if (!(await verifyAdmin(supabase))) {
    return { success: false, error: "No tienes permiso para subir videos." };
  }

  try {
    const upload = await mux.video.uploads.create({
      cors_origin: "*",
      new_asset_settings: {
        playback_policy: ["public"], // Cambiaremos a ["signed"] cuando protejamos URLs en el futuro
        video_quality: "basic",
        normalize_audio: true,
      },
      test: process.env.NODE_ENV === "development",
    });

    // Guardaremos este uploadId de MUX en BD como lección "Borrador"
    const { data: newLesson, error } = await supabase.from("lessons").insert({
      module_id,
      title: title || "Nueva Lección (Procesando Video...)",
      lesson_type: "video",
      mux_upload_id: upload.id,
      is_published: false
    }).select("id").single();

    if (error) {
      console.error(error);
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/contenido");
    return { success: true, uploadUrl: upload.url, uploadId: upload.id, newLessonId: newLesson.id };
  } catch (error: unknown) {
    console.error("Mux Upload Error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error conectando con Mux." };
  }
}

export async function createDocumentLesson({ moduleId, title, documentUrl }: { moduleId: string; title: string; documentUrl: string }) {
  const supabase = await createClient();
  
  if (!(await verifyAdmin(supabase))) {
    return { success: false, error: "Not an admin" };
  }

  // Insert the new document lesson
  const { data: newLesson, error } = await supabase.from("lessons").insert({
    module_id: moduleId,
    title: title,
    lesson_type: "document",
    materials: [{ title: title, url: documentUrl }], // Store the document as a material
    is_published: true // Or false, depending on initial state
  }).select("id").single();

  if (error) {
    console.error("DB error adding document lesson:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/contenido");
  return { success: true, newLessonId: newLesson.id };
}

export async function createImageLesson({ moduleId, title, imageUrl }: { moduleId: string; title: string; imageUrl: string }) {
  const supabase = await createClient();
  
  if (!(await verifyAdmin(supabase))) {
    return { success: false, error: "Not an admin" };
  }

  // Insert the new image lesson
  const { data: newLesson, error } = await supabase.from("lessons").insert({
    module_id: moduleId,
    title: title,
    lesson_type: "image",
    thumbnail_url: imageUrl, 
    is_published: true 
  }).select("id").single();

  if (error) {
    console.error("DB error adding image lesson:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/contenido");
  return { success: true, newLessonId: newLesson.id };
}

export async function createLinkLesson({ moduleId, title, linkUrl }: { moduleId: string; title: string; linkUrl: string }) {
  const supabase = await createClient();
  
  if (!(await verifyAdmin(supabase))) {
    return { success: false, error: "Not an admin" };
  }

  // Insert the new link lesson
  const { data: newLesson, error } = await supabase.from("lessons").insert({
    module_id: moduleId,
    title: title,
    lesson_type: "link",
    materials: [{ title: title, url: linkUrl }], 
    is_published: true 
  }).select("id").single();

  if (error) {
    console.error("DB error adding link lesson:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/contenido");
  return { success: true, newLessonId: newLesson.id };
}

export async function createBlogLesson({ moduleId, title, content }: { moduleId: string; title: string; content: string }) {
  const supabase = await createClient();
  
  if (!(await verifyAdmin(supabase))) {
    return { success: false, error: "Not an admin" };
  }

  const { data: newLesson, error } = await supabase.from("lessons").insert({
    module_id: moduleId,
    title: title,
    lesson_type: "blog",
    description: content,
    is_published: true
  }).select("id").single();

  if (error) {
    console.error("DB error adding blog lesson:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/contenido");
  return { success: true, newLessonId: newLesson.id };
}

export async function createAudioLesson({ moduleId, title, audioUrl }: { moduleId: string; title: string; audioUrl: string }) {
  const supabase = await createClient();
  
  if (!(await verifyAdmin(supabase))) {
    return { success: false, error: "Not an admin" };
  }

  const { data: newLesson, error } = await supabase.from("lessons").insert({
    module_id: moduleId,
    title: title,
    lesson_type: "audio",
    materials: [{ title: title, url: audioUrl }],
    is_published: true
  }).select("id").single();

  if (error) {
    console.error("DB error adding audio lesson:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/contenido");
  return { success: true, newLessonId: newLesson.id };
}

export async function createInfographicLesson({ moduleId, title, imageUrls }: { moduleId: string; title: string; imageUrls: string[] }) {
  const supabase = await createClient();
  
  if (!(await verifyAdmin(supabase))) {
    return { success: false, error: "Not an admin" };
  }

  const materials = imageUrls.map((url, i) => ({ title: `Imagen ${i + 1}`, url }));

  const { data: newLesson, error } = await supabase.from("lessons").insert({
    module_id: moduleId,
    title: title,
    lesson_type: "infographic",
    materials: materials,
    thumbnail_url: imageUrls[0] || null,
    is_published: true
  }).select("id").single();

  if (error) {
    console.error("DB error adding infographic lesson:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/contenido");
  return { success: true, newLessonId: newLesson.id };
}

export async function createModule(data: { title: string; description?: string; thumbnail_url?: string; prerequisite_module_id?: string | null }) {
  const supabase = await createClient();
  
  if (!(await verifyAdmin(supabase))) {
    return { success: false, error: "Not an admin" };
  }

  const { error } = await supabase.from("modules").insert({
    title: data.title,
    description: data.description || "",
    thumbnail_url: data.thumbnail_url || null,
    prerequisite_module_id: data.prerequisite_module_id || null,
    is_published: false
  });

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/contenido");
  return { success: true };
}

export async function updateModule(id: string, data: { title: string; description?: string; thumbnail_url?: string; prerequisite_module_id?: string | null }) {
  const supabase = await createClient();
  
  if (!(await verifyAdmin(supabase))) {
    return { success: false, error: "Not an admin" };
  }

  const { error } = await supabase.from("modules").update({
    title: data.title,
    description: data.description || "",
    thumbnail_url: data.thumbnail_url !== undefined ? data.thumbnail_url : null,
    prerequisite_module_id: data.prerequisite_module_id !== undefined ? data.prerequisite_module_id : null,
  }).eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/contenido");
  return { success: true };
}

export async function deleteModule(id: string) {
  const supabase = await createClient();
  
  if (!(await verifyAdmin(supabase))) {
    return { success: false, error: "Not an admin" };
  }

  // 1. Archivos huérfanos a limpiar de Storage
  const { data: moduleData } = await supabase.from("modules").select("thumbnail_url, lessons(thumbnail_url, materials)").eq("id", id).single();
  
  const thumbnailsToDelete: string[] = [];
  const docsToDelete: string[] = [];

  if (moduleData) {
    if (moduleData.thumbnail_url) {
      const path = moduleData.thumbnail_url.split('/thumbnails/')[1];
      if (path) thumbnailsToDelete.push(path);
    }
    if (moduleData.lessons && Array.isArray(moduleData.lessons)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      moduleData.lessons.forEach((lesson: { thumbnail_url?: string; materials?: any }) => {
        if (lesson.thumbnail_url) {
          const path = lesson.thumbnail_url.split('/thumbnails/')[1];
          if (path) thumbnailsToDelete.push(path);
        }
        if (lesson.materials && Array.isArray(lesson.materials)) {
          lesson.materials.forEach((mat: { url?: string }) => {
            if (mat.url && mat.url.includes('/docs/')) {
              const mPath = mat.url.split('/docs/')[1];
              if (mPath) docsToDelete.push(mPath);
            }
          });
        }
      });
    }
  }

  // 2. Eliminar de DB
  const { error } = await supabase.from("modules").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  // 3. Limpiar Storage
  if (thumbnailsToDelete.length > 0) {
    await supabase.storage.from("thumbnails").remove(thumbnailsToDelete);
  }
  if (docsToDelete.length > 0) {
    await supabase.storage.from("docs").remove(docsToDelete);
  }

  revalidatePath("/admin/contenido");
  return { success: true };
}

// ====== LESSON MANAGEMENT ======

export async function updateLesson(id: string, data: { title: string; description?: string; thumbnail_url?: string; is_published: boolean; materials?: Array<{title: string, url: string}>; duration_minutes?: number | null; difficulty?: string | null; prerequisite_lesson_id?: string | null }) {
  const supabase = await createClient();
  
  if (!(await verifyAdmin(supabase))) {
    return { success: false, error: "Not an admin" };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = {
    title: data.title,
    description: data.description !== undefined ? data.description : null,
    thumbnail_url: data.thumbnail_url !== undefined ? data.thumbnail_url : null,
    is_published: data.is_published,
    duration_minutes: data.duration_minutes !== undefined ? data.duration_minutes : null,
    difficulty: data.difficulty !== undefined ? data.difficulty : null,
    prerequisite_lesson_id: data.prerequisite_lesson_id !== undefined ? data.prerequisite_lesson_id : null,
  };
  
  if (data.materials !== undefined) {
    updateData.materials = data.materials;
  }

  const { error } = await supabase.from("lessons").update(updateData).eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/contenido");
  return { success: true };
}

export async function deleteLesson(id: string) {
  const supabase = await createClient();
  
  if (!(await verifyAdmin(supabase))) {
    return { success: false, error: "Not an admin" };
  }

  // 1. Buscar Storage objects dependientes
  const { data: lessonData } = await supabase.from("lessons").select("thumbnail_url, materials, mux_asset_id").eq("id", id).single();
  const thumbnailsToDelete: string[] = [];
  const docsToDelete: string[] = [];

  if (lessonData) {
    if (lessonData.thumbnail_url) {
      const path = lessonData.thumbnail_url.split('/thumbnails/')[1];
      if (path) thumbnailsToDelete.push(path);
    }
    if (lessonData.materials && Array.isArray(lessonData.materials)) {
      lessonData.materials.forEach((mat: { url?: string }) => {
        if (mat.url && mat.url.includes('/docs/')) {
          const mPath = mat.url.split('/docs/')[1];
          if (mPath) docsToDelete.push(mPath);
        }
      });
    }

    // Eliminar asset de Mux para evitar costos por almacenamiento huérfano
    if (lessonData.mux_asset_id) {
      try {
        await mux.video.assets.delete(lessonData.mux_asset_id);
        console.log(`[Mux] Asset ${lessonData.mux_asset_id} eliminado correctamente`);
      } catch (muxErr) {
        // No bloquear la eliminación si Mux falla (asset podría ya no existir)
        console.warn(`[Mux] No se pudo eliminar asset ${lessonData.mux_asset_id}:`, muxErr);
      }
    }
  }

  // 2. Eliminar de base de datos
  const { error } = await supabase.from("lessons").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  // 3. Eliminar archivos storage si se borró con éxito
  if (thumbnailsToDelete.length > 0) {
    await supabase.storage.from("thumbnails").remove(thumbnailsToDelete);
  }
  if (docsToDelete.length > 0) {
    await supabase.storage.from("docs").remove(docsToDelete);
  }

  revalidatePath("/admin/contenido");
  return { success: true };
}

export async function reorderLessons(lessonIds: string[]) {
  const supabase = await createClient();
  
  if (!(await verifyAdmin(supabase))) {
    return { success: false, error: "Not an admin" };
  }

  // Ejecutamos las promesas en paralelo para actualizar el `order_index` de todos los elementos afectados
  const promises = lessonIds.map((id, index) => 
    supabase.from("lessons").update({ order_index: index }).eq("id", id)
  );

  await Promise.all(promises);
  revalidatePath("/admin/contenido");
  
  return { success: true };
}
