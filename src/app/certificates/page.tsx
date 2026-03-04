import { Header } from "@/components/dashboard/header"
import { getUserProfile, getUserCertificates, getModules } from "@/lib/data"
import { CertificateGenerator } from "@/components/student/CertificateGenerator"

export default async function CertificatesPage() {
  const profile = await getUserProfile()
  const displayName = profile?.full_name || "Estudiante"
  
  const certificates = await getUserCertificates()
  const modules = await getModules()

  return (
    <>
      <Header title="Mis Certificados" />
      <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-background-light dark:bg-background-dark font-body">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="bg-linear-to-br from-primary/10 to-blue-600/10 rounded-3xl p-8 border border-primary/20 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="relative z-10 flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-primary to-blue-600 flex items-center justify-center text-white shadow-lg shadow-primary/30 shrink-0">
                <span className="material-symbols-outlined text-3xl">workspace_premium</span>
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-secondary dark:text-white mb-2">Tus Logros Académicos</h2>
                <p className="text-gray-600 dark:text-gray-300 max-w-xl">
                  Aquí encontrarás todos los certificados obtenidos al completar los módulos y programas del diplomado. Descárgalos y compártelos con tu comunidad profesional.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-bold text-secondary dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">history_edu</span>
              Historial de Certificados
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {certificates.length > 0 ? certificates.map((cert) => {
                const certModule = modules.find(m => m.id === cert.module_id);
                const isGlobal = !cert.module_id;
                return (
                  <div key={cert.id} className="bg-surface-light dark:bg-surface-dark rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5 group relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors"></div>
                    
                    <div className="flex items-start justify-between mb-6 relative z-10">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-sm ${isGlobal ? 'bg-linear-to-br from-primary to-blue-600 text-white' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-900/50'}`}>
                        <span className="material-symbols-outlined text-[28px]">{isGlobal ? 'school' : 'workspace_premium'}</span>
                      </div>
                      <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold px-3 py-1 rounded-full border border-green-200 dark:border-green-800">
                        {isGlobal ? 'Diplomado' : 'Módulo'}
                      </div>
                    </div>

                    <div className="relative z-10 mb-6 flex-1">
                      <h4 className="text-lg font-bold text-secondary dark:text-white mb-2 line-clamp-2">
                        {isGlobal ? "Diplomado Compl. en Rehabilitación Intervencionista" : (certModule?.title || "Módulo Completado")}
                      </h4>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                        Emitido: {cert.issue_date ? new Date(cert.issue_date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Fecha no disponible'}
                      </p>
                    </div>

                    <div className="relative z-10 pt-4 border-t border-gray-100 dark:border-gray-800 mt-auto">
                      <CertificateGenerator studentName={displayName} date={cert.issue_date || undefined} className="w-full justify-center bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-secondary dark:text-white border-none h-11 rounded-xl" />
                    </div>
                  </div>
                );
              }) : (
                <div className="col-span-full flex flex-col items-center justify-center p-12 text-center bg-gray-50 dark:bg-gray-800/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                  <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 mb-4">
                    <span className="material-symbols-outlined text-4xl">lock</span>
                  </div>
                  <h3 className="text-xl font-bold text-secondary dark:text-white mb-2">Aún no tienes certificados</h3>
                  <p className="text-gray-500 max-w-md">
                    Completa módulos y programas para obtener certificados digitales con valor curricular y validación blockchain.
                  </p>
                </div>
              )}
            </div>
            
          </div>
        </div>
      </div>
    </>
  )
}
