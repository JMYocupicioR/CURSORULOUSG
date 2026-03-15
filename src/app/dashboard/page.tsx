import { Header } from "@/components/dashboard/header"
import { getUserProfile, getUserEnrollment, getModules, getLiveSessions, getUserCertificates, getUserCompletedLessons, getMicroLessons, getRecentActivity, getStudyStreak, getCertificateConfig, getUserNotifications, getUnreadNotificationCount } from "@/lib/data"
import Link from "next/link"
import { CertificateGenerator } from "@/components/student/CertificateGenerator"

export default async function DashboardPage() {
  const profile = await getUserProfile()
  const displayName = profile?.full_name || "Estudiante"
  
  const enrollment = await getUserEnrollment()
  const modules = await getModules()
  const liveSessions = await getLiveSessions()
  const certificates = await getUserCertificates()
  const completedLessons = await getUserCompletedLessons()
  const microLessons = await getMicroLessons()
  const recentActivity = await getRecentActivity(5)
  const streak = await getStudyStreak()
  const certConfig = await getCertificateConfig()
  const notifications = await getUserNotifications(15)
  const unreadCount = await getUnreadNotificationCount()
  
  const activeModule = modules.find(m => m.id === enrollment?.module_id) || modules[0];
  const progressPercent = enrollment?.progress || 0;
  
  // Encontrar la primera lección NO completada del módulo para el botón de continuar
  const firstIncompleteLesson = activeModule?.lessons
    ?.filter(l => l.is_published && !completedLessons.includes(l.id))?.[0];
  const firstLessonFallback = activeModule?.lessons?.filter(l => l.is_published)?.[0];
  const continueLessonId = firstIncompleteLesson?.id || firstLessonFallback?.id;
  const continueLesson = firstIncompleteLesson || firstLessonFallback;

  // Revisar si el módulo actual está bloqueado por otro módulo
  let isModuleLocked = false;
  if (activeModule?.prerequisite_module_id) {
    const prereqModule = modules.find(m => m.id === activeModule.prerequisite_module_id);
    if (prereqModule) {
      const publishedLessonsInPrereq = prereqModule.lessons?.filter(l => l.is_published) || [];
      const isPrereqCompleted = publishedLessonsInPrereq.length > 0 && 
        publishedLessonsInPrereq.every(l => completedLessons.includes(l.id));
      isModuleLocked = !isPrereqCompleted;
    }
  }

  let pdfActivityUrl = "";
  if (continueLesson?.materials && Array.isArray(continueLesson.materials) && continueLesson.materials.length > 0) {
    const materials = continueLesson.materials as unknown as { title?: string, url?: string }[];
    const pdfMaterial = materials.find(m => m.url);
    if (pdfMaterial && pdfMaterial.url) {
      pdfActivityUrl = pdfMaterial.url;
    }
  }

  // Calcular módulos realmente completados
  const completedModulesCount = modules.filter(mod => {
    const publishedLessons = mod.lessons?.filter(l => l.is_published) || [];
    return publishedLessons.length > 0 && publishedLessons.every(l => completedLessons.includes(l.id));
  }).length;

  return (
    <>
      <Header userName={displayName} notifications={notifications} unreadCount={unreadCount} />
      <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-background-light dark:bg-background-dark font-body">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-secondary dark:text-white mb-2">
              Bienvenido de nuevo, <span className="text-primary">{displayName}</span>
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
              Continúa tu especialización en ecografía intervencionista.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tiempo de estudio</p>
              <p className="text-xl font-bold text-secondary dark:text-white">{(completedLessons.length * 15 / 60).toFixed(1)}h</p>
            </div>
            <div className="h-10 w-px bg-gray-300 dark:bg-gray-700 mx-2"></div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Cursos Completados</p>
              <p className="text-xl font-bold text-secondary dark:text-white">{completedModulesCount}/{modules.length || 8}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Active Course Card */}
            <div className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="p-6 md:p-8 relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <span className="px-3 py-1 text-xs font-semibold text-primary bg-primary/10 rounded-full border border-primary/20">
                    EN PROGRESO
                  </span>
                  <span className="text-gray-400 text-sm">Actualizado hace 2h</span>
                </div>
                <h3 className="text-2xl font-bold text-secondary dark:text-white mb-2">
                  {activeModule ? activeModule.title : "Módulo 2: Miembro Superior (Hombro)"}
                </h3>
                <div 
                  className="text-gray-600 dark:text-gray-300 mb-6 max-w-lg [&>p]:mb-2"
                  dangerouslySetInnerHTML={{ 
                    __html: activeModule?.description || "Identificación de estructuras tendinosas del manguito rotador y técnicas de infiltración subacromial guiada por ultrasonido." 
                  }}
                />
                <div className="mb-8">
                  <div className="flex justify-between text-sm mb-2 font-medium">
                    <span className="text-secondary dark:text-gray-300">Progreso del módulo</span>
                    <span className="text-primary">{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-primary h-3 rounded-full shadow-lg shadow-primary/30 transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  {isModuleLocked ? (
                    <button disabled className="flex-1 bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 font-semibold py-3 px-6 rounded-xl cursor-not-allowed flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-700">
                      <span className="material-symbols-outlined">lock</span>
                      Bloqueado: Requiere Módulo Anterior
                    </button>
                  ) : continueLessonId ? (
                    <Link href={`/lessons/${continueLessonId}`} className="flex-1 bg-primary hover:bg-cyan-500 text-white font-semibold py-3 px-6 rounded-xl shadow-lg shadow-primary/25 transition-transform active:scale-95 flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined">play_circle</span>
                      {firstIncompleteLesson ? 'Continuar Lección' : 'Repasar Módulo'}
                    </Link>
                  ) : (
                    <button disabled className="flex-1 bg-primary/50 text-white font-semibold py-3 px-6 rounded-xl cursor-not-allowed flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined">play_circle</span>
                      Próximamente
                    </button>
                  )}
                  {pdfActivityUrl ? (
                    <a 
                      href={pdfActivityUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-white dark:bg-gray-800 text-secondary dark:text-white font-medium py-3 px-6 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined">description</span>
                      Ver Material PDF
                    </a>
                  ) : (
                    <button disabled className="flex-1 bg-white dark:bg-gray-800 text-secondary dark:text-white font-medium py-3 px-6 rounded-xl border border-gray-200 dark:border-gray-600 opacity-50 cursor-not-allowed flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined">description</span>
                      Ver Material PDF
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Micro Learning */}
            <div>
              <h3 className="text-lg font-semibold text-secondary dark:text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">bolt</span>
                Micro-aprendizaje Complementario
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {microLessons.length > 0 ? (
                  microLessons.slice(0, 3).map((ul) => (
                    <Link key={ul.id} href={`/microlearning/${ul.id}`} className="bg-surface-light dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary/50 dark:hover:border-primary/50 transition-all cursor-pointer group shadow-sm block">
                      <div className="flex gap-4">
                        <div className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-gray-800 flex items-center justify-center shrink-0 relative overflow-hidden">
                          {ul.thumbnail_url ? (
                            <img src={ul.thumbnail_url} alt={ul.title} className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-3xl text-gray-400 group-hover:text-primary transition-colors">
                              play_circle
                            </span>
                          )}
                          <div className="absolute inset-0 bg-secondary/10 dark:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                        <div>
                          <h4 className="font-bold text-secondary dark:text-white group-hover:text-primary transition-colors line-clamp-1">
                            {ul.title}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                            {ul.description || 'Sin descripción'}
                          </p>
                          <span className="text-[10px] font-semibold text-gray-400 mt-2 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">schedule</span> {ul.duration_minutes} min
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 col-span-2">No hay temas de micro-aprendizaje disponibles por el momento.</p>
                )}

                <Link href="/microlearning" className="bg-surface-light dark:bg-surface-dark p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer group flex items-center justify-center">
                  <div className="text-center">
                    <span className="material-symbols-outlined text-primary mb-1">add_circle</span>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Ver catálogo completo</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-8">
            {/* Streak Widget */}
            <div className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="flex items-center justify-between mb-5 relative z-10">
                <h3 className="font-bold text-secondary dark:text-white flex items-center gap-2">
                  <span className="text-2xl">🔥</span>
                  Racha de Estudio
                </h3>
                <div className="text-right">
                  <p className="text-3xl font-black text-orange-500">{streak.currentStreak}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">{streak.currentStreak === 1 ? 'Día' : 'Días'}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mb-3">
                {['L','M','X','J','V','S','D'].map((day, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className={`w-full aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                      streak.last7Days[i] 
                        ? 'bg-orange-500/20 text-orange-500 border border-orange-500/30' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600 border border-transparent'
                    }`}>
                      {streak.last7Days[i] ? '✓' : ''}
                    </div>
                    <span className="text-[9px] text-gray-400 font-medium">{day}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 text-center">
                {streak.totalActiveDays} días activos en total
                {streak.currentStreak > 0 && ' · ¡Sigue así!'}
              </p>
            </div>

            <div className="bg-secondary rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
              <div className="absolute top-[-20px] right-[-20px] w-24 h-24 rounded-full bg-primary/20 blur-xl"></div>
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 relative z-10">
                <span className="material-symbols-outlined text-red-400 animate-pulse">videocam</span>
                Próxima Sesión en Vivo
              </h3>
              
              {liveSessions.length > 0 ? (
                liveSessions.map((session) => (
                  <div key={session.id} className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10 mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs text-primary font-bold uppercase tracking-wider">Clase en Vivo</p>
                      {session.platform && (
                        <span className="text-[10px] text-gray-400 bg-white/10 px-1.5 py-0.5 rounded">
                          {session.platform === 'zoom' ? 'Zoom' : session.platform === 'meet' ? 'Google Meet' : session.platform === 'teams' ? 'Teams' : 'Enlace'}
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-lg leading-tight mb-2">{session.title}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-300 mb-3">
                      <span className="material-symbols-outlined text-base">calendar_month</span>
                      <span>{new Date(session.session_date).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} hrs</span>
                      {session.duration_minutes && (
                        <span className="text-xs text-gray-400">· {session.duration_minutes} min</span>
                      )}
                    </div>
                    {session.meeting_url && (
                      <a
                        href={session.meeting_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-white text-secondary font-bold py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-lg">videocam</span>
                        Unirse a la Sesión
                      </a>
                    )}
                  </div>
                ))
              ) : (
                <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10 mb-4">
                  <p className="text-sm text-gray-300">No hay sesiones en vivo programadas próximamente.</p>
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-secondary dark:text-white">Actividad Reciente</h3>
                <Link href="/progress" className="text-xs text-primary font-medium hover:underline">Ver todo</Link>
              </div>
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((act) => {
                    const iconMap: Record<string, string> = { quiz: 'quiz', document: 'description', image: 'image', link: 'link' };
                    const icon = iconMap[act.lesson_type || ''] || 'play_circle';
                    const timeAgo = act.completed_at ? (() => {
                      const diff = Date.now() - new Date(act.completed_at).getTime();
                      const mins = Math.floor(diff / 60000);
                      if (mins < 60) return `Hace ${mins}m`;
                      const hrs = Math.floor(mins / 60);
                      if (hrs < 24) return `Hace ${hrs}h`;
                      const days = Math.floor(hrs / 24);
                      return `Hace ${days}d`;
                    })() : '';
                    return (
                      <div key={act.lesson_id} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-primary text-base">{icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-secondary dark:text-gray-200 truncate">{act.lesson_title}</p>
                          <p className="text-xs text-gray-400">
                            {act.score !== null ? `Calificación: ${act.score}%` : 'Completada'}
                            {timeAgo && ` · ${timeAgo}`}
                          </p>
                        </div>
                        <span className="material-symbols-outlined text-green-500 text-base shrink-0">check_circle</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <span className="material-symbols-outlined text-3xl text-gray-300 mb-2 block">history</span>
                  <p className="text-sm text-gray-400">No hay actividad reciente</p>
                </div>
              )}
            </div>

            {/* Recent Certificates */}
            <div className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-bold text-secondary dark:text-white mb-4">Certificados Recientes</h3>
              <div className="space-y-4">
                {certificates.length > 0 ? certificates.map((cert) => {
                  const certModule = modules.find(m => m.id === cert.module_id);
                  const isGlobal = !cert.module_id;
                  return (
                    <div key={cert.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isGlobal ? 'bg-primary/20 text-primary' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'}`}>
                          <span className="material-symbols-outlined text-2xl">{isGlobal ? 'school' : 'workspace_premium'}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-secondary dark:text-gray-200">{isGlobal ? "Diplomado Compl. en Rehabilitación Intervencionista" : (certModule?.title || "Módulo Completado")}</p>
                          <p className="text-xs text-gray-500">Emitido: {cert.issue_date ? new Date(cert.issue_date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</p>
                        </div>
                      </div>
                      <CertificateGenerator certificate={{
                        folio: cert.folio || "SIN-FOLIO",
                        recipientName: cert.recipient_name || displayName,
                        courseName: isGlobal ? "Diplomado Compl. en Rehabilitación Intervencionista" : (certModule?.title || cert.course_name || "Módulo"),
                        courseHours: cert.course_hours || certConfig?.course_hours || "",
                        institutionalText: certConfig?.institutional_text || `Por haber completado con éxito el programa de Rehabilitación Intervencionista.`,
                        issueDate: cert.issue_date || new Date().toISOString(),
                        issuedBy: cert.issued_by || "Dr. Raúl Morales",
                        qrUrl: cert.qr_url || null,
                        signers: certConfig?.signers || [{ name: "Dr. Raúl Morales", role: "Director General del Curso" }],
                        primaryColor: certConfig?.primary_color || "#0ea5e9",
                        elementLayout: certConfig?.element_layout || null,
                        backgroundUrl: certConfig?.background_url || null,
                      }} />
                    </div>
                  );
                }) : (
                  <div className="flex items-center gap-3 opacity-60">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                      <span className="material-symbols-outlined">lock</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-secondary dark:text-gray-200">Aún no hay certificados</p>
                      <p className="text-xs text-gray-500">Completa módulos para obtenerlos</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>

  )
}
