import { Header } from "@/components/dashboard/header"
import { getUserProfile, getUserEnrollment, getModules, getUserCompletedLessons } from "@/lib/data"
import Link from "next/link"

export default async function ProgressPage() {
  const profile = await getUserProfile()
  const displayName = profile?.full_name || "Estudiante"
  
  const enrollment = await getUserEnrollment()
  const modules = await getModules()
  const completedLessons = await getUserCompletedLessons()
  
  const progressPercent = enrollment?.progress || 0;
  
  return (
    <>
      <Header userName={displayName} />
      <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-background-light dark:bg-background-dark font-body">
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-secondary dark:text-white mb-2">
            Mi Progreso
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
            Revisa tu avance detallado en los diplomados y módulos.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Resumen General */}
            <div className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8">
              <h3 className="text-xl font-bold text-secondary dark:text-white mb-6">Resumen del Diplomado</h3>
              
              <div className="flex items-center gap-6 mb-8">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-gray-200 dark:text-gray-700" />
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="currentColor" strokeWidth="8" strokeDasharray={`${progressPercent * 2.51} 251.2`} className="text-primary transition-all duration-1000 ease-out" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-secondary dark:text-white">{progressPercent}%</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-lg text-secondary dark:text-white">Progreso Global</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Has completado el {progressPercent}% de los requisitos para tu certificado general.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Módulos</p>
                  <p className="text-2xl font-bold text-secondary dark:text-white">{progressPercent === 100 ? modules.length : 0} <span className="text-sm text-gray-400 font-normal">/ {modules.length}</span></p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Lecciones</p>
                  <p className="text-2xl font-bold text-secondary dark:text-white">{completedLessons.length} </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Horas de Estudio</p>
                  <p className="text-2xl font-bold text-secondary dark:text-white">{(completedLessons.length * 15 / 60).toFixed(1)}h</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Certificados</p>
                  <p className="text-2xl font-bold text-secondary dark:text-white">{progressPercent === 100 ? 1 : 0}</p>
                </div>
              </div>
            </div>

            {/* Progreso por Módulo */}
            <div className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8">
              <h3 className="text-xl font-bold text-secondary dark:text-white mb-6">Progreso por Módulo</h3>
              <div className="space-y-6">
                {modules.length > 0 ? modules.map((module, index) => {
                  const isActive = enrollment?.module_id === module.id;
                  const isCompleted = index < (modules.findIndex(m => m.id === enrollment?.module_id));
                  
                  // Calcular avance simulado basado en el status del módulo actual
                  let modProgress = 0;
                  if (isCompleted) {
                    modProgress = 100;
                  } else if (isActive) {
                    modProgress = progressPercent;
                  }

                  return (
                    <div key={module.id} className="group">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className={`font-medium ${isActive ? 'text-primary' : 'text-secondary dark:text-white'}`}>
                          {module.title}
                        </h4>
                        <span className="text-sm font-bold text-gray-600 dark:text-gray-300">{modProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${isCompleted ? 'bg-green-500' : isActive ? 'bg-primary shadow-[0_0_10px_rgba(0,180,216,0.4)]' : 'bg-gray-400 dark:bg-gray-600'}`}
                          style={{ width: `${modProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                }) : (
                  <p className="text-gray-500">No hay módulos disponibles en este momento.</p>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-8">
            {/* Actividad Reciente */}
            <div className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-bold text-secondary dark:text-white mb-6">Actividad Reciente</h3>
              <div className="space-y-6 border-l-2 border-gray-100 dark:border-gray-800 ml-3">
                <div className="relative pl-6">
                  <div className="absolute w-3 h-3 bg-primary rounded-full -left-[7.5px] top-1"></div>
                  <p className="text-sm font-bold text-secondary dark:text-white">Revisión de Lecciones</p>
                  <p className="text-xs text-primary mt-1">Avance de este mes</p>
                  <p className="text-xs text-gray-400 mt-1">Hoy</p>
                </div>
                <div className="relative pl-6">
                  <div className="absolute w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-full -left-[7.5px] top-1"></div>
                  <p className="text-sm font-bold text-secondary dark:text-white">Última Conexión</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Inicio de Sesión</p>
                  <p className="text-xs text-gray-400 mt-1">Hace {completedLessons.length > 0 ? "2 horas" : "varios días"}</p>
                </div>
                <div className="relative pl-6">
                  <div className="absolute w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-full -left-[7.5px] top-1"></div>
                  <p className="text-sm font-bold text-secondary dark:text-white">Inicio de Diplomado</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Ecografía Intervencionista</p>
                  <p className="text-xs text-gray-400 mt-1">Hace 2 semanas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
