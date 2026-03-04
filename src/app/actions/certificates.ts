"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Types
export type ElementLayout = {
  x: number
  y: number
  w: number
  h: number
  visible: boolean
  fontSize?: number
  align?: "left" | "center" | "right"
  imageUrl?: string
}

export type ElementLayoutMap = {
  header: ElementLayout
  title: ElementLayout
  recipient: ElementLayout
  body: ElementLayout
  signature: ElementLayout
  qr: ElementLayout
  folio: ElementLayout
  course_name: ElementLayout
  course_hours: ElementLayout
  date: ElementLayout
  divider: ElementLayout
  decorative_line: ElementLayout
  custom_image: ElementLayout
}

export type CertificateConfig = {
  id: string
  course_name: string
  folio_prefix: string
  course_hours: string
  institutional_text: string
  primary_color: string
  border_style: string
  orientation: string
  signers: Array<{ name: string; role: string; signature_url: string | null }>
  auto_issue: boolean
  min_progress: number
  require_evaluations: boolean
  element_layout: ElementLayoutMap | null
  background_url: string | null
}

export type IssuedCertificate = {
  id: string
  folio: string
  recipient_name: string
  recipient_email: string | null
  user_id: string | null
  course_name: string
  course_hours: string | null
  issued_by: string
  issue_date: string
  pdf_url: string | null
  storage_path: string | null
  qr_url: string | null
  is_manual: boolean
  notes: string | null
  created_at: string
}

// ============================================================
// SAVE CERTIFICATE CONFIG
// ============================================================
export async function saveCertificateConfig(config: Partial<CertificateConfig>) {
  const supabase = await createClient()

  // Get first config row or create one
  const { data: existing } = await supabase
    .from("certificate_config")
    .select("id")
    .limit(1)
    .single()

  let result
  if (existing?.id) {
    result = await supabase
      .from("certificate_config")
      .update({ ...config, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
  } else {
    result = await supabase
      .from("certificate_config")
      .insert([config])
  }

  if (result.error) {
    console.error("Error saving config:", result.error)
    return { success: false, error: result.error.message }
  }

  revalidatePath("/admin/certificados")
  return { success: true }
}

// ============================================================
// GET NEXT FOLIO NUMBER
// ============================================================
async function getNextFolioNumber(supabase: Awaited<ReturnType<typeof createClient>>, prefix: string) {
  const { count } = await supabase
    .from("certificates")
    .select("*", { count: "exact", head: true })
    .ilike("folio", `${prefix}%`)

  const nextNum = (count ?? 0) + 1
  return `${prefix}${String(nextNum).padStart(4, "0")}`
}

// ============================================================
// ISSUE CERTIFICATE (MANUAL OR AUTO)
// ============================================================
export async function issueCertificate(data: {
  recipient_name: string
  recipient_email?: string
  user_id?: string
  is_manual?: boolean
  notes?: string
  issue_date?: string
}) {
  const supabase = await createClient()

  // Get config
  const { data: config } = await supabase
    .from("certificate_config")
    .select("*")
    .limit(1)
    .single()

  if (!config) {
    return { success: false, error: "No configuration found" }
  }

  // Generate folio
  const folio = await getNextFolioNumber(supabase, config.folio_prefix)

  // Build verification URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const qrUrl = `${baseUrl}/verify/${folio}`

  // Insert certificate record
  const { data: cert, error } = await supabase
    .from("certificates")
    .insert([{
      folio,
      recipient_name: data.recipient_name,
      recipient_email: data.recipient_email || null,
      user_id: data.user_id || null,
      course_name: config.course_name,
      course_hours: config.course_hours,
      issued_by: "Dr. Raúl Morales",
      issue_date: data.issue_date || new Date().toISOString(),
      qr_url: qrUrl,
      is_manual: data.is_manual ?? true,
      notes: data.notes || null,
    }])
    .select()
    .single()

  if (error) {
    console.error("Error issuing certificate:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/certificados")
  return { success: true, certificate: cert, folio }
}


// ============================================================
// DELETE CERTIFICATE
// ============================================================
export async function deleteCertificate(id: string, storagePath: string | null) {
  const supabase = await createClient()

  // Delete from storage if exists
  if (storagePath) {
    await supabase.storage.from("certificates").remove([storagePath])
  }

  const { error } = await supabase
    .from("certificates")
    .delete()
    .eq("id", id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/certificados")
  return { success: true }
}

// ============================================================
// UPLOAD CERTIFICATE ASSET (image, background)
// ============================================================
export async function uploadCertificateAsset(formData: FormData) {
  const supabase = await createClient()
  const file = formData.get("file") as File | null
  const folder = (formData.get("folder") as string) || "images"

  if (!file) return { success: false, error: "No file provided" }

  // Validate size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { success: false, error: "El archivo excede los 5 MB" }
  }

  // Validate type
  const allowed = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"]
  if (!allowed.includes(file.type)) {
    return { success: false, error: "Tipo de archivo no permitido. Usa PNG, JPEG, WebP o SVG." }
  }

  const ext = file.name.split(".").pop() || "png"
  const filename = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { error } = await supabase.storage
    .from("certificate-assets")
    .upload(filename, file, {
      cacheControl: "3600",
      upsert: false,
    })

  if (error) {
    console.error("Upload error:", error)
    return { success: false, error: error.message }
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from("certificate-assets")
    .getPublicUrl(filename)

  return { success: true, url: publicUrl, path: filename }
}

// ============================================================
// DELETE CERTIFICATE ASSET
// ============================================================
export async function deleteCertificateAsset(path: string) {
  const supabase = await createClient()

  const { error } = await supabase.storage
    .from("certificate-assets")
    .remove([path])

  if (error) {
    console.error("Delete error:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}
