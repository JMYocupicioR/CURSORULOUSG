import { getCertificateByFolio } from "@/lib/data"

export default async function VerifyPage({ params }: { params: Promise<{ folio: string }> }) {
  const { folio } = await params
  const cert = await getCertificateByFolio(folio)

  if (!cert) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-900 via-slate-900 to-gray-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-red-400" style={{ fontSize: 40 }}>cancel</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Certificado No Encontrado</h1>
          <p className="text-gray-400 mb-2">El folio <code className="bg-white/10 px-2 py-0.5 rounded text-white font-mono text-sm">{folio}</code> no corresponde a ningún certificado emitido.</p>
          <p className="text-gray-500 text-sm mt-4">Si crees que esto es un error, contacta al administrador del curso.</p>
        </div>
      </div>
    )
  }

  const formattedDate = new Date(cert.issue_date).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-6">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-amber-400/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-lg w-full">
        {/* Valid badge */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2 bg-green-500/20 border border-green-500/30 text-green-400 px-5 py-2 rounded-full text-sm font-bold">
            <span className="material-symbols-outlined text-base">verified</span>
            Certificado Válido y Verificado
          </div>
        </div>

        {/* Certificate card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          {/* Gold top bar */}
          <div className="h-1.5 bg-linear-to-r from-amber-400 via-yellow-300 to-amber-400" />

          <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Emitido por</p>
                <p className="text-lg font-bold text-white">{cert.issued_by}</p>
                <p className="text-xs text-gray-400">Ecografía Neuromusculoesquelética</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-primary/30 to-blue-600/30 border border-primary/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 28 }}>workspace_premium</span>
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6" />

            {/* Recipient */}
            <div className="text-center mb-6">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Este certificado fue otorgado a</p>
              <h2 className="text-3xl font-bold text-white mb-1">{cert.recipient_name}</h2>
              {cert.recipient_email && (
                <p className="text-sm text-gray-400">{cert.recipient_email}</p>
              )}
            </div>

            {/* Course info */}
            <div className="bg-white/5 rounded-2xl p-4 mb-6 text-center">
              <p className="text-xs text-gray-400 mb-1">Por haber completado</p>
              <p className="text-base font-semibold text-white">{cert.course_name}</p>
              {cert.course_hours && (
                <p className="text-xs text-gray-400 mt-1">{cert.course_hours} horas académicas</p>
              )}
            </div>

            {/* Metadata grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">calendar_today</span>
                  Fecha de Emisión
                </p>
                <p className="text-sm font-semibold text-white">{formattedDate}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">tag</span>
                  Folio
                </p>
                <p className="text-sm font-mono font-bold text-primary">{cert.folio}</p>
              </div>
            </div>

            {/* Download PDF if available */}
            {cert.pdf_url && (
              <a
                href={cert.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 bg-linear-to-r from-primary to-blue-600 text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                <span className="material-symbols-outlined text-base">download</span>
                Descargar Certificado en PDF
              </a>
            )}
          </div>

          {/* Bottom bar */}
          <div className="px-8 py-4 bg-white/5 border-t border-white/5 text-center">
            <p className="text-xs text-gray-500">
              Este certificado fue emitido digitalmente y puede ser verificado en cualquier momento mediante este enlace único.
            </p>
          </div>
        </div>

        {/* Powered by */}
        <p className="text-center text-xs text-gray-600 mt-6">
          Verificación Digital — Dr. Raúl Morales · Curso de Ecografía Neuromusculoesquelética
        </p>
      </div>
    </div>
  )
}
