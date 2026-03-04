import { Header } from "@/components/dashboard/header"
import { getUserProfile, getUserCompletedLessons, getModules, getUserCertificates, getLiveSessions } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"
import { ProfileSettingsClient } from "./ProfileSettingsClient"

export default async function ProfilePage() {
  const profile = await getUserProfile()
  const completedLessons = await getUserCompletedLessons()
  const modules = await getModules()
  const certificates = await getUserCertificates()
  const liveSessions = await getLiveSessions()

  const displayName = profile?.full_name || "Estudiante"
  const specialty = profile?.specialty || "Médico"
  const role = profile?.role === "admin" ? "Administrador" : "Estudiante"
  
  // Calcular horas
  const hoursStudied = (completedLessons.length * 15 / 60).toFixed(1)
  
  // Calcular modulos completados
  let completedModulesCount = 0;
  modules.forEach(m => {
    const publishedLessons = m.lessons?.filter(l => l.is_published) || [];
    if (publishedLessons.length > 0 && publishedLessons.every(l => completedLessons.includes(l.id))) {
      completedModulesCount++;
    }
  });

  // Query para promedio de quizzes
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let quizAverage = 0
  
  if (user) {
    const { data: quizAttempts } = await supabase
      .from('quiz_attempts')
      .select('score')
      .eq('user_id', user.id)

    if (quizAttempts && quizAttempts.length > 0) {
      const totalScore = quizAttempts.reduce((acc, curr) => acc + curr.score, 0)
      quizAverage = Math.round(totalScore / quizAttempts.length)
    }
  }

  // Next live session for exam preparation visual
  const nextSessionDate = liveSessions.length > 0 
    ? new Date(liveSessions[0].session_date).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
    : "Próximamente"

  return (
    <>
      <Header title="Mi Perfil" />
      <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-background-light dark:bg-background-dark font-body">
        <div className="relative bg-secondary rounded-2xl shadow-lg p-6 md:p-8 mb-8 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-600/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
            <div className="relative">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-primary shadow-2xl bg-gray-200 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                <span className="material-symbols-outlined text-6xl text-gray-400">person</span>
              </div>
              <span className="absolute bottom-2 right-2 bg-green-500 w-5 h-5 rounded-full border-2 border-secondary"></span>
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2 justify-center md:justify-start">
                <h1 className="text-3xl font-bold text-white">{displayName}</h1>
                <span className="bg-primary/20 text-primary border border-primary/30 px-3 py-1 rounded-full text-sm font-semibold inline-flex items-center gap-1 self-center md:self-auto uppercase">
                  <span className="material-symbols-outlined text-base">verified</span>
                  {role}
                </span>
              </div>
              <p className="text-gray-300 text-lg mb-1">{specialty}</p>
              <p className="text-gray-400 text-sm flex items-center justify-center md:justify-start gap-1">
                <span className="material-symbols-outlined text-base">location_on</span> {profile?.state || 'Ubicación no especificada'}
              </p>
              <div className="mt-6 flex flex-wrap gap-3 justify-center md:justify-start">
                <button className="bg-primary hover:bg-cyan-500 text-white px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg shadow-primary/20">
                  <span className="material-symbols-outlined text-xl">edit_square</span>
                  Editar Perfil
                </button>
                <button className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 border border-white/10">
                  <span className="material-symbols-outlined text-xl">history_edu</span>
                  Descargar Historial
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-secondary dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">badge</span>
                  Datos Profesionales
                </h3>
                <button className="text-primary hover:text-cyan-400 text-sm font-medium">Actualizar</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Nombre Completo</label>
                  <p className="text-gray-800 dark:text-gray-200 font-medium">{displayName}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Correo Electrónico</label>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-800 dark:text-gray-200 font-medium">{profile?.email || 'No proporcionado'}</p>
                    <span className="material-symbols-outlined text-green-500 text-sm" title="Verificado">check_circle</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">WhatsApp</label>
                  <p className="text-gray-800 dark:text-gray-200 font-medium">{profile?.phone || 'No proporcionado'}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Cédula Profesional</label>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-800 dark:text-gray-200 font-medium tracking-widest">{profile?.license_id || 'No proporcionada'}</p>
                    {profile?.license_id && (
                      <span className="bg-green-500/10 text-green-500 text-[10px] px-2 py-0.5 rounded border border-green-500/20 font-bold uppercase">Validada</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8">
              <h3 className="text-xl font-bold text-secondary dark:text-white flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-primary">medical_services</span>
                Especialidad y Áreas de Interés
              </h3>
              <div className="mb-6">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Especialidad Principal</label>
                <div className="bg-background-light dark:bg-background-dark p-3 rounded-lg border border-gray-200 dark:border-gray-700 inline-block">
                  <span className="text-secondary dark:text-white font-medium">{profile?.specialty || 'Medicina'}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Intereses Clínicos (Tags)</label>
                <div className="flex flex-wrap gap-2">
                  {profile?.interest_area ? (
                    <span className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-sm font-medium">
                      {profile.interest_area}
                    </span>
                  ) : (
                    <span className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-sm font-medium">Ecografía MSK</span>
                  )}
                  <button className="px-3 py-1.5 border border-dashed border-gray-400 text-gray-400 hover:text-primary hover:border-primary rounded-full text-sm font-medium transition-colors flex items-center gap-1">
                    <span className="material-symbols-outlined text-base">add</span> Añadir
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-bold text-secondary dark:text-white flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-primary">analytics</span>
                Mi Actividad Académica
              </h3>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <span className="material-symbols-outlined">schedule</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-secondary dark:text-white">{hoursStudied}h</p>
                    <p className="text-xs text-gray-500">Horas estudiadas</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                    <span className="material-symbols-outlined">school</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-secondary dark:text-white">{completedModulesCount}</p>
                    <p className="text-xs text-gray-500">Módulos completados</p>
                  </div>
                </div>
                {quizAverage > 0 && (
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                      <span className="material-symbols-outlined">quiz</span>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-secondary dark:text-white">{quizAverage}%</p>
                      <p className="text-xs text-gray-500">Promedio Quiz</p>
                    </div>
                  </div>
                )}
                {certificates.length > 0 && (
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                      <span className="material-symbols-outlined">workspace_premium</span>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-secondary dark:text-white">{certificates.length}</p>
                      <p className="text-xs text-gray-500">Certificados Obtenidos</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Próxima Sesión / Novedad</p>
                <div className="bg-linear-to-r from-secondary to-blue-900 rounded-xl p-4 text-white relative overflow-hidden">
                  <div className="absolute right-0 top-0 w-16 h-16 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-lg"></div>
                  <p className="font-bold text-sm">Sesión en Vivo o Módulo</p>
                  <p className="text-xs opacity-80 mb-2">{nextSessionDate}</p>
                  <div className="w-full bg-white/20 rounded-full h-1.5 mt-2">
                    <div className="bg-primary h-1.5 rounded-full w-[0%]"></div>
                  </div>
                </div>
              </div>
            </div>
            
            <ProfileSettingsClient />

          </div>
        </div>
      </div>
    </>

  )
}

