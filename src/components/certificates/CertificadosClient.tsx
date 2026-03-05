"use client"

import { useState, useTransition, useEffect, useRef, useCallback } from "react"
import { AdminHeader } from "@/components/admin/AdminHeader"
import { saveCertificateConfig, issueCertificate, deleteCertificate, type CertificateConfig, type IssuedCertificate, type ElementLayoutMap } from "@/app/actions/certificates"
import CertificateDesigner, { DEFAULT_LAYOUT } from "@/components/certificates/CertificateDesigner"
import dynamic from "next/dynamic"

// PDF generation is handled async inside DownloadPdfButton component.

// ─────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────
type Props = {
  initialConfig: CertificateConfig | null
  initialCertificates: IssuedCertificate[]
}

// ─────────────────────────────────────────────────
// HELPER: generate QR data URL client-side
// ─────────────────────────────────────────────────
async function generateQRDataUrl(text: string): Promise<string> {
  if (typeof window === "undefined") return ""
  try {
    const QRCode = (await import("qrcode")).default
    return await QRCode.toDataURL(text, { width: 200, margin: 1 })
  } catch {
    return ""
  }
}

// ─────────────────────────────────────────────────
// MAIN PAGE CLIENT COMPONENT
// ─────────────────────────────────────────────────
export default function CertificadosClient({ initialConfig, initialCertificates }: Props) {
  // ── Config state ──────────────────────────────
  const [courseName, setCourseName] = useState(initialConfig?.course_name ?? "Curso de Ecografía Neuromusculoesquelética")
  const [folioPrefix, setFolioPrefix] = useState(initialConfig?.folio_prefix ?? "CERT-USG-")
  const [courseHours, setCourseHours] = useState(initialConfig?.course_hours ?? "120")
  const [institutionalText, setInstitutionalText] = useState(
    initialConfig?.institutional_text ??
    "Se otorga el presente certificado por haber completado satisfactoriamente el Curso de Ecografía Neuromusculoesquelética impartido por el Dr. Raúl Morales."
  )
  const [primaryColor, setPrimaryColor] = useState(initialConfig?.primary_color ?? "#0ea5e9")
  const [elementLayout, setElementLayout] = useState<ElementLayoutMap>(initialConfig?.element_layout ?? DEFAULT_LAYOUT)
  const [backgroundUrl, setBackgroundUrl] = useState(initialConfig?.background_url ?? "")
  const [autoIssue, setAutoIssue] = useState(initialConfig?.auto_issue ?? true)
  const [minProgress, setMinProgress] = useState(String(initialConfig?.min_progress ?? 100))
  const [requireEval, setRequireEval] = useState(initialConfig?.require_evaluations ?? true)
  const [configSaving, startConfigSave] = useTransition()
  const [configMsg, setConfigMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // ── Manual issuance state ─────────────────────
  const [manualName, setManualName] = useState("")
  const [manualEmail, setManualEmail] = useState("")
  const [manualNotes, setManualNotes] = useState("")
  const [issuing, startIssue] = useTransition()
  const [issueMsg, setIssueMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // ── Certificates list state ───────────────────
  const [certificates, setCertificates] = useState<IssuedCertificate[]>(initialCertificates)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // ── PDF generation state (for download after issuing) ──
  const [issuedForPdf, setIssuedForPdf] = useState<IssuedCertificate | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string>("")
  const isMounted = useRef(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true
      // eslint-disable-next-line react-compiler/react-compiler
      setMounted(true)
    }
  }, [])

  // Compute current config snapshot for preview and designer
  const configSnapshot = { course_name: courseName, folio_prefix: folioPrefix, course_hours: courseHours, institutional_text: institutionalText, primary_color: primaryColor }

  const handleLayoutChange = useCallback((newLayout: ElementLayoutMap) => {
    setElementLayout(newLayout)
  }, [])

  // ── Handlers ──────────────────────────────────
  const handleSaveConfig = () => {
    startConfigSave(async () => {
      const result = await saveCertificateConfig({
        course_name: courseName,
        folio_prefix: folioPrefix,
        course_hours: courseHours,
        institutional_text: institutionalText,
        primary_color: primaryColor,
        auto_issue: autoIssue,
        min_progress: parseInt(minProgress, 10),
        require_evaluations: requireEval,
        element_layout: elementLayout,
        background_url: backgroundUrl || null,
      })
      setConfigMsg(result.success ? { ok: true, text: "Configuración guardada correctamente." } : { ok: false, text: result.error ?? "Error al guardar." })
      setTimeout(() => setConfigMsg(null), 3500)
    })
  }

  const handleIssue = () => {
    if (!manualName.trim()) {
      setIssueMsg({ ok: false, text: "El nombre del destinatario es requerido." })
      return
    }
    startIssue(async () => {
      const result = await issueCertificate({
        recipient_name: manualName.trim(),
        recipient_email: manualEmail.trim() || undefined,
        is_manual: true,
        notes: manualNotes.trim() || undefined,
      })
      if (result.success && result.certificate) {
        setIssueMsg({ ok: true, text: `Certificado emitido: ${result.folio}` })
        setManualName("")
        setManualEmail("")
        setManualNotes("")
        // Regenerate QR for the issued certificate
        const qr = await generateQRDataUrl(result.certificate.qr_url || "")
        setQrDataUrl(qr)
        setIssuedForPdf(result.certificate as IssuedCertificate)
        // Optimistically add to list
        setCertificates(prev => [result.certificate as IssuedCertificate, ...prev])
      } else {
        setIssueMsg({ ok: false, text: result.error ?? "Error al emitir certificado." })
      }
      setTimeout(() => setIssueMsg(null), 5000)
    })
  }

  const handleDelete = async (cert: IssuedCertificate) => {
    if (!confirm(`¿Eliminar el certificado ${cert.folio}? Esta acción no se puede deshacer.`)) return
    setDeletingId(cert.id)
    const result = await deleteCertificate(cert.id, cert.storage_path)
    if (result.success) {
      setCertificates(prev => prev.filter(c => c.id !== cert.id))
    }
    setDeletingId(null)
  }

  // ─────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      <AdminHeader title="Configuración de Certificados" subtitle="Diseña el template, emite certificados y gestiona el historial" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* ══════════════════════════════════════════
            SECTION 1: CONFIG + LIVE PREVIEW
        ══════════════════════════════════════════ */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Config Panel */}
          <div className="space-y-5">
            {/* Basic Data */}
            <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5 p-6">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">tune</span>
                Datos del Certificado
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">Nombre del Curso</label>
                  <input type="text" value={courseName} onChange={e => setCourseName(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-primary/40 transition-colors" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">Prefijo de Folio</label>
                    <input type="text" value={folioPrefix} onChange={e => setFolioPrefix(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-primary/40 transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">Horas del Curso</label>
                    <input type="text" value={courseHours} onChange={e => setCourseHours(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-primary/40 transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">Texto Institucional</label>
                  <textarea rows={3} value={institutionalText} onChange={e => setInstitutionalText(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-primary/40 transition-colors resize-none" />
                </div>

                {/* Color picker */}
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">Color Primario</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
                        className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent p-0.5" />
                      <input type="text" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
                        className="flex-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white outline-none font-mono" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Automation Rules */}
            <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5 p-6">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">bolt</span>
                Reglas de Emisión Automática
              </h3>
              <div className="space-y-4">
                {[
                  { label: "Emisión Automática", desc: "Emitir certificado al completar el curso", value: autoIssue, set: setAutoIssue },
                  { label: "Aprobar Evaluaciones", desc: "Todas las evaluaciones deben estar aprobadas", value: requireEval, set: setRequireEval },
                ].map(({ label, desc, value, set }) => (
                  <div key={label} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
                      <p className="text-xs text-gray-400">{desc}</p>
                    </div>
                    <button onClick={() => set(!value)}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${value ? "bg-primary" : "bg-gray-300 dark:bg-white/10"}`}>
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${value ? "left-6" : "left-0.5"}`} />
                    </button>
                  </div>
                ))}

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Progreso Mínimo</p>
                    <p className="text-xs text-gray-400">% requerido para emitir</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="number" value={minProgress} onChange={e => setMinProgress(e.target.value)} min={0} max={100}
                      className="w-16 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-sm text-center text-gray-900 dark:text-white outline-none" />
                    <span className="text-xs text-gray-400">%</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                {configMsg && (
                  <p className={`text-xs font-medium ${configMsg.ok ? "text-green-500" : "text-red-500"}`}>{configMsg.text}</p>
                )}
                <div className="ml-auto">
                  <button onClick={handleSaveConfig} disabled={configSaving}
                    className="px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary/90 transition-colors flex items-center gap-1.5 disabled:opacity-60">
                    <span className="material-symbols-outlined text-base">{configSaving ? "progress_activity" : "save"}</span>
                    {configSaving ? "Guardando..." : "Guardar Configuración"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Designer */}
          <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5 p-6 space-y-4 h-fit sticky top-6">
            <CertificateDesigner
              layout={elementLayout}
              onLayoutChange={handleLayoutChange}
              backgroundUrl={backgroundUrl}
              onBackgroundChange={setBackgroundUrl}
              config={configSnapshot}
            />
          </div>
        </div>

        {/* ══════════════════════════════════════════
            SECTION 2: MANUAL CERTIFICATE ISSUANCE
        ══════════════════════════════════════════ */}
        <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5 p-6">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500 text-lg">workspace_premium</span>
            Emitir Certificado Manual
          </h3>
          <p className="text-xs text-gray-400 mb-5">Emite un certificado a cualquier persona, incluso sin cuenta registrada.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">
                Nombre del Destinatario <span className="text-red-400">*</span>
              </label>
              <input type="text" value={manualName} onChange={e => setManualName(e.target.value)} placeholder="Dr. Juan Pérez García"
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-primary/40 transition-colors" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">Email (opcional)</label>
              <input type="email" value={manualEmail} onChange={e => setManualEmail(e.target.value)} placeholder="doctor@email.com"
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-primary/40 transition-colors" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">Notas internas</label>
              <input type="text" value={manualNotes} onChange={e => setManualNotes(e.target.value)} placeholder="Ej: Taller presencial marzo 2026"
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-primary/40 transition-colors" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={handleIssue} disabled={issuing || !manualName.trim()}
              className="bg-linear-to-r from-amber-500 to-amber-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50">
              <span className="material-symbols-outlined text-base">{issuing ? "progress_activity" : "workspace_premium"}</span>
              {issuing ? "Emitiendo..." : "Emitir Certificado"}
            </button>

            {issueMsg && (
              <p className={`text-sm font-medium ${issueMsg.ok ? "text-green-500" : "text-red-500"} flex items-center gap-1`}>
                <span className="material-symbols-outlined text-base">{issueMsg.ok ? "check_circle" : "error"}</span>
                {issueMsg.text}
              </p>
            )}

            {/* Download button for just-issued certificate */}
            {mounted && issuedForPdf && qrDataUrl && (
              <DownloadPdfButton
                cert={issuedForPdf}
                institutionalText={institutionalText}
                primaryColor={primaryColor}
                elementLayout={elementLayout}
                backgroundUrl={backgroundUrl}
                qrDataUrl={qrDataUrl}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary/10 text-primary border border-primary/30 rounded-xl text-sm font-semibold hover:bg-primary/20 transition-colors"
                buttonContent={<><span className="material-symbols-outlined text-base">download</span> Descargar PDF</>}
                loadingContent={<><span className="material-symbols-outlined text-base animate-spin">progress_activity</span> Generando PDF...</>}
              />
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════
            SECTION 3: CERTIFICATES LIST
        ══════════════════════════════════════════ */}
        <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">history_edu</span>
                Historial de Certificados Emitidos
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">{certificates.length} certificado{certificates.length !== 1 ? "s" : ""} en total</p>
            </div>
          </div>

          {certificates.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-gray-400 text-3xl">workspace_premium</span>
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Aún no hay certificados emitidos</p>
              <p className="text-xs text-gray-400 mt-1">Usa el formulario de arriba para emitir el primero</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-white/5">
                    {["Folio", "Destinatario", "Curso", "Fecha", "Tipo", "Acciones"].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {certificates.map((cert) => (
                    <CertificateRow
                      key={cert.id}
                      cert={cert}
                      institutionalText={institutionalText}
                      primaryColor={primaryColor}
                      elementLayout={elementLayout}
                    backgroundUrl={backgroundUrl}
                      onDelete={handleDelete}
                      deleting={deletingId === cert.id}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────
// TABLE ROW WITH PDF DOWNLOAD
// ─────────────────────────────────────────────────
function CertificateRow({
  cert,
  institutionalText,
  primaryColor,
  elementLayout,
  backgroundUrl,
  onDelete,
  deleting,
}: {
  cert: IssuedCertificate
  institutionalText: string
  primaryColor: string
  elementLayout: ElementLayoutMap
  backgroundUrl: string
  onDelete: (cert: IssuedCertificate) => void
  deleting: boolean
}) {
  const [qr, setQr] = useState("")
  const mountedRef = useRef(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      // eslint-disable-next-line react-compiler/react-compiler
      setMounted(true)
    }
    if (cert.qr_url) {
      generateQRDataUrl(cert.qr_url).then(setQr)
    }
  }, [cert.qr_url])


  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
      <td className="px-5 py-3.5">
        <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-lg">{cert.folio}</span>
      </td>
      <td className="px-5 py-3.5">
        <p className="font-medium text-gray-900 dark:text-white text-sm">{cert.recipient_name}</p>
        {cert.recipient_email && <p className="text-xs text-gray-400">{cert.recipient_email}</p>}
      </td>
      <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400 max-w-[160px]">
        <span className="line-clamp-1">{cert.course_name}</span>
        {cert.course_hours && <span className="text-gray-400"> · {cert.course_hours}h</span>}
      </td>
      <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
        {new Date(cert.issue_date).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
      </td>
      <td className="px-5 py-3.5">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cert.is_manual ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"}`}>
          {cert.is_manual ? "Manual" : "Auto"}
        </span>
      </td>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2">
          {/* PDF Download */}
          {mounted && qr && (
            <DownloadPdfButton
              cert={cert}
              institutionalText={institutionalText}
              primaryColor={primaryColor}
              elementLayout={elementLayout}
              backgroundUrl={backgroundUrl}
              qrDataUrl={qr}
              className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-semibold hover:bg-primary/20 transition-colors whitespace-nowrap"
              buttonContent={<><span className="material-symbols-outlined text-sm">download</span> PDF</>}
              loadingContent={<><span className="material-symbols-outlined text-sm animate-spin">progress_activity</span></>}
            />
          )}

          {/* Verify link */}
          {cert.qr_url && (
            <a href={cert.qr_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 bg-violet-500/10 text-violet-500 rounded-lg text-xs font-semibold hover:bg-violet-500/20 transition-colors whitespace-nowrap">
              <span className="material-symbols-outlined text-sm">open_in_new</span>
              Verificar
            </a>
          )}

          {/* Delete */}
          <button onClick={() => onDelete(cert)} disabled={deleting}
            className="flex items-center p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
            <span className="material-symbols-outlined text-base">{deleting ? "progress_activity" : "delete"}</span>
          </button>
        </div>
      </td>
    </tr>
  )
}

// ─────────────────────────────────────────────────
// ASYNC PDF DOWNLOAD BUTTON
// ─────────────────────────────────────────────────
function DownloadPdfButton({
  cert,
  institutionalText,
  primaryColor,
  elementLayout,
  backgroundUrl,
  qrDataUrl,
  className,
  buttonContent,
  loadingContent,
}: {
  cert: IssuedCertificate
  institutionalText: string
  primaryColor: string
  elementLayout: ElementLayoutMap
  backgroundUrl: string
  qrDataUrl: string
  className?: string
  buttonContent: React.ReactNode
  loadingContent: React.ReactNode
}) {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    if (loading) return
    setLoading(true)
    try {
      const [{ pdf }, { CertificatePDF }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/certificates/CertificatePDF"),
      ])

      const doc = (
        <CertificatePDF
          recipientName={cert.recipient_name}
          courseName={cert.course_name}
          courseHours={cert.course_hours ?? ""}
          institutionalText={institutionalText}
          folio={cert.folio}
          issueDate={cert.issue_date}
          issuedBy={cert.issued_by}
          qrDataUrl={qrDataUrl}
          signers={[{ name: "Dr. Raúl Morales", role: "Director del Curso" }]}
          primaryColor={primaryColor}
          elementLayout={elementLayout}
          backgroundUrl={backgroundUrl}
        />
      )

      const blob = await pdf(doc).toBlob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `Certificado_${cert.folio}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Error generating PDF:", err)
      alert("Hubo un error al generar el PDF.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={handleDownload} disabled={loading} className={className}>
      {loading ? loadingContent : buttonContent}
    </button>
  )
}

