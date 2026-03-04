import { Header } from "@/components/dashboard/header"
import { getUserProfile, getUserEnrollment, getModules, getUserCompletedLessons } from "@/lib/data"
import Link from "next/link"

export default async function CoursesPage() {
  const profile = await getUserProfile()
  const displayName = profile?.full_name || "Estudiante"
  
  const enrollment = await getUserEnrollment()
  const modules = await getModules()
  const completedLessons = await getUserCompletedLessons()
  
  const progressPercent = enrollment?.progress || 0;
  
  // Encontrar la primera lección del módulo activo para el botón de continuar
  const activeModule = modules.find(m => m.id === enrollment?.module_id) || modules[0];
  const firstLesson = activeModule?.lessons?.filter(l => l.is_published)?.[0];
  const firstLessonId = firstLesson?.id;

  return (
    <>
      <Header userName={displayName} />
      <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-background-light dark:bg-background-dark font-body">
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-secondary dark:text-white mb-2">
            Mis Cursos
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
            Explora tus programas educativos y continúa tu aprendizaje.
          </p>
        </div>

        <div className="space-y-8">
          {/* Main Course Card */}
          <div className="bg-surface-light dark:bg-surface-dark rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
            
            <div className="flex flex-col md:flex-row">
              {/* Course Image / Banner */}
              <div className="w-full md:w-2/5 md:min-h-full bg-slate-800 relative overflow-hidden flex flex-col items-center justify-center p-8 text-center min-h-[250px]">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                <div className="absolute inset-0 bg-linear-to-t from-slate-900 to-transparent"></div>
                
                <div className="relative z-10">
                  <span className="material-symbols-outlined text-6xl text-primary mb-4 block">ultrasound</span>
                  <h3 className="text-2xl font-bold text-white mb-2">Diplomado</h3>
                  <p className="text-primary font-medium tracking-wide uppercase text-sm">Completivo en Rehabilitación Intervencionista</p>
                </div>
              </div>

              {/* Course Info */}
              <div className="p-6 md:p-10 md:w-3/5 relative z-10 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className="px-3 py-1 text-xs font-semibold text-primary bg-primary/10 rounded-full border border-primary/20">
                      EN PROGRESO
                    </span>
                    <span className="flex items-center gap-1 text-sm text-gray-500 font-medium">
                      <span className="material-symbols-outlined text-[18px]">menu_book</span>
                      {modules.length} Módulos
                    </span>
                    <span className="flex items-center gap-1 text-sm text-gray-500 font-medium whitespace-nowrap">
                      <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
                      Certificado al finalizar
                    </span>
                  </div>
                  
                  <h2 className="text-2xl md:text-3xl font-bold text-secondary dark:text-white mb-4">
                    Diplomado Completivo en Rehabilitación Intervencionista Guiada por Ultrasonido
                  </h2>
                  
                  <p className="text-gray-600 dark:text-gray-300 mb-8 line-clamp-3">
                    Programa integral diseñado para especialistas que buscan dominar las técnicas de intervención musculoesquelética guiadas por ecografía en tiempo real, abarcando desde principios básicos hasta procedimientos avanzados y micro-aprendizaje.
                  </p>
                </div>

                <div>
                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2 font-medium">
                      <span className="text-secondary dark:text-gray-300">Progreso Global</span>
                      <span className="text-primary">{progressPercent}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div
                        className="bg-primary h-2.5 rounded-full shadow-lg shadow-primary/30 transition-all duration-1000 ease-out"
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    {firstLessonId ? (
                      <Link href={`/lessons/${firstLessonId}`} className="flex-1 bg-primary hover:bg-cyan-500 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-primary/25 transition-transform active:scale-95 flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-xl">play_circle</span>
                        Continuar Aprendizaje
                      </Link>
                    ) : (
                      <button disabled className="flex-1 bg-primary/50 text-white font-bold py-3.5 px-6 rounded-xl cursor-not-allowed flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-xl">play_circle</span>
                        Próximamente
                      </button>
                    )}
                    
                    <a href="#modulos" className="flex-1 bg-white dark:bg-gray-800 text-secondary dark:text-white font-semibold py-3.5 px-6 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 text-center scroll-smooth">
                      <span className="material-symbols-outlined text-xl">grid_view</span>
                      Ver Módulos
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Informational Message since there's only one course */}
          <div className="flex items-start gap-4 p-5 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
            <span className="material-symbols-outlined text-blue-500 text-2xl shrink-0">info</span>
            <div>
              <h4 className="font-bold text-blue-800 dark:text-blue-400 mb-1">Tu catálogo actual</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Actualmente estás inscrito en el programa core de la plataforma. Nuevos cursos cortos, talleres intensivos y masterclasses se agregarán a esta página cuando estén disponibles para inscripción.
              </p>
            </div>
          </div>

          {/* Bottom section: Modules List */}
          <div id="modulos" className="pt-8 scroll-mt-8">
            <h3 className="text-2xl font-bold text-secondary dark:text-white mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">view_list</span>
              Contenido del Diplomado
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {modules.length > 0 ? modules.map((module, index) => {
                const isActive = enrollment?.module_id === module.id;
                const isCompleted = index < (modules.findIndex(m => m.id === enrollment?.module_id));
                const moduleLessons = module.lessons || [];
                const publishedLessons = moduleLessons.filter(l => l.is_published);
                const completedInModule = publishedLessons.filter(l => completedLessons.includes(l.id)).length;
                const totalInModule = publishedLessons.length;
                const modProgressPercent = totalInModule > 0 ? Math.round((completedInModule / totalInModule) * 100) : (isCompleted ? 100 : 0);
                
                return (
                  <div key={module.id} className="bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-2xl p-6 hover:border-primary/50 transition-colors group relative overflow-hidden flex flex-col">
                    {/* Status badge */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs font-bold px-3 py-1 rounded-lg">
                        Módulo {index + 1}
                      </div>
                      {isCompleted ? (
                        <span className="text-green-500 flex items-center text-sm font-medium gap-1"><span className="material-symbols-outlined text-[18px]">check_circle</span> Completado</span>
                      ) : isActive ? (
                        <span className="text-primary flex items-center text-sm font-medium gap-1"><span className="material-symbols-outlined text-[18px]">clock_loader_40</span> En Progreso</span>
                      ) : (
                        <span className="text-gray-400 flex items-center text-sm font-medium gap-1"><span className="material-symbols-outlined text-[18px]">lock</span> Pendiente</span>
                      )}
                    </div>
                    
                    <h4 className="text-lg font-bold text-secondary dark:text-white mb-2 group-hover:text-primary transition-colors">
                      {module.title}
                    </h4>
                    <div 
                      className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-6"
                      dangerouslySetInnerHTML={{ __html: module.description || '' }}
                    />
                    
                    <div className="mt-auto">
                      <div className="flex justify-between items-center text-xs text-gray-500 font-medium mb-2">
                        <span>{completedInModule} / {totalInModule} Lecciones</span>
                        <span>{isCompleted ? 100 : modProgressPercent}%</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 mb-4">
                        <div 
                          className={`h-1.5 rounded-full ${isCompleted ? 'bg-green-500' : isActive ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
                          style={{ width: `${isCompleted ? 100 : modProgressPercent}%` }}
                        ></div>
                      </div>
                      
                      {isActive && moduleLessons.length > 0 ? (
                        <Link href={`/lessons/${moduleLessons[0].id}`} className="block w-full text-center bg-primary/10 hover:bg-primary/20 text-primary font-bold py-2 rounded-lg transition-colors text-sm">
                          Continuar Módulo
                        </Link>
                      ) : isCompleted ? (
                        <Link href={`/lessons/${moduleLessons[0]?.id || ''}`} className="block w-full text-center bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold py-2 rounded-lg transition-colors text-sm">
                          Repasar Material
                        </Link>
                      ) : (
                        <button disabled className="block w-full text-center bg-gray-50 dark:bg-gray-800/50 text-gray-400 font-bold py-2 rounded-lg cursor-not-allowed text-sm border border-gray-100 dark:border-gray-700/50">
                          Bloqueado
                        </button>
                      )}
                    </div>
                  </div>
                )
              }) : (
                <div className="col-span-1 md:col-span-2 p-8 text-center text-gray-500">
                  No hay módulos disponibles
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
