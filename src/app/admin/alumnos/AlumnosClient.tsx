"use client"

import { useState } from "react"
import { AdminHeader } from "@/components/admin/AdminHeader"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface ModuleGrade {
  moduleId: string;
  moduleTitle: string;
  quizScore: number | null;
  status: "Pendiente" | "En Progreso" | "Completado";
}

export interface StudentDetail {
  id: string;
  name: string;
  email: string;
  specialty: string;
  city: string;
  progress: number;
  status: "active" | "completed" | "pending";
  enrollDate: string;
  lastAccess: string;
  globalGrade: number | null;
  moduleGrades: ModuleGrade[];
}

interface Stats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    completed: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    pending: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  }
  const labels: Record<string, string> = {
    active: "En Progreso",
    completed: "Certificado",
    pending: "Pendiente",
  }
  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}

export function AlumnosClient({ students, stats }: { students: StudentDetail[], stats: Stats }) {
  const [selectedStudent, setSelectedStudent] = useState<StudentDetail | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const statsCards = [
    { label: "Total Inscritos", value: stats.total.toString(), icon: "groups", color: "from-primary/20 to-cyan-500/10", iconColor: "text-primary" },
    { label: "Certificados", value: stats.completed.toString(), icon: "workspace_premium", color: "from-emerald-500/20 to-emerald-500/10", iconColor: "text-emerald-400" },
    { label: "En Progreso", value: stats.inProgress.toString(), icon: "trending_up", color: "from-blue-500/20 to-blue-500/10", iconColor: "text-blue-400" },
    { label: "Pendientes", value: stats.pending.toString(), icon: "hourglass_top", color: "from-amber-500/20 to-amber-500/10", iconColor: "text-amber-400" },
  ]

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.specialty.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full">
      <AdminHeader title="Gestión de Alumnos" subtitle="Administra y monitorea a los médicos inscritos" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {statsCards.map((card) => (
            <div
              key={card.label}
              className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5 p-5 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-linear-to-br ${card.color} flex items-center justify-center`}>
                  <span className={`material-symbols-outlined text-xl ${card.iconColor}`}>{card.icon}</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{card.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5 p-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-gray-100 dark:bg-white/5 rounded-lg px-3 py-2 border border-transparent focus-within:border-primary/30 transition-colors flex-1 min-w-[200px]">
            <span className="material-symbols-outlined text-gray-400 text-lg mr-2">search</span>
            <input
              type="text"
              placeholder="Buscar por nombre, email o especialidad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 outline-none w-full"
            />
          </div>
        </div>

        <div className="flex gap-6">
          {/* Table */}
          <div className={`bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden transition-all duration-300 ${selectedStudent ? "w-full xl:w-2/3" : "w-full"}`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-white/5">
                    <th className="text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">Médico</th>
                    <th className="text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">Especialidad</th>
                    <th className="text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3 hidden lg:table-cell">Ciudad</th>
                    <th className="text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">Calificación</th>
                    <th className="text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">Progreso</th>
                    <th className="text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">Estado</th>
                    <th className="text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-sm text-gray-500">
                        No se encontraron estudiantes registrados.
                      </td>
                    </tr>
                  ) : filteredStudents.map((s) => (
                    <tr
                      key={s.id}
                      onClick={() => setSelectedStudent(s)}
                      className={`border-b border-gray-50 dark:border-white/3 hover:bg-gray-50 dark:hover:bg-white/2 transition-colors cursor-pointer ${
                        selectedStudent?.id === s.id ? "bg-primary/5 dark:bg-primary/5" : ""
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-[11px] font-bold text-primary">
                              {s.name.split(" ").filter(w => w.length > 2).slice(0,2).map(w => w[0]).join("")}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{s.name}</p>
                            <p className="text-[11px] text-gray-400 truncate">{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-300">{s.specialty}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-300 hidden lg:table-cell">{s.city}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-sm font-semibold ${s.globalGrade !== null ? (s.globalGrade >= 80 ? 'text-emerald-500' : 'text-amber-500') : 'text-gray-400'}`}>
                          {s.globalGrade !== null ? `${s.globalGrade}%` : '-'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex-1 h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden max-w-[90px]">
                            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${s.progress}%` }} />
                          </div>
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-8">{s.progress}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5"><StatusBadge status={s.status} /></td>
                      <td className="px-5 py-3.5">
                        <span className="material-symbols-outlined text-gray-400 text-lg">chevron_right</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detail Panel */}
          {selectedStudent && (
            <div className="w-full xl:w-1/3 shrink-0 bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5 p-5 space-y-5 flex flex-col h-fit">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Detalle del Alumno</h3>
                <button onClick={() => setSelectedStudent(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              {/* Avatar */}
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-linear-to-br from-primary to-cyan-400 flex items-center justify-center mb-3 shadow-lg shadow-primary/20">
                  <span className="text-xl font-bold text-white">
                    {selectedStudent.name.split(" ").filter(w => w.length > 2).slice(0,2).map(w => w[0]).join("")}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">{selectedStudent.name}</h4>
                <p className="text-xs text-gray-400">{selectedStudent.email}</p>
              </div>

              {/* Details */}
              <div className="space-y-3">
                {[
                  { label: "Especialidad", value: selectedStudent.specialty },
                  { label: "Ciudad", value: selectedStudent.city },
                  { label: "Fecha de Inscripción", value: format(new Date(selectedStudent.enrollDate), "d MMM yyyy", { locale: es }) }
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">{item.label}</span>
                    <span className="font-medium text-gray-900 dark:text-white text-right">{item.value}</span>
                  </div>
                ))}
              </div>

              {/* Progress */}
              <div className="border-t border-gray-100 dark:border-white/5 pt-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-500 dark:text-gray-400">Progreso General</span>
                  <span className="font-bold text-primary">{selectedStudent.progress}%</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden mb-4">
                  <div className="h-full bg-linear-to-r from-primary to-cyan-400 rounded-full transition-all" style={{ width: `${selectedStudent.progress}%` }} />
                </div>
                <div className="flex items-center justify-between text-sm mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
                  <span className="text-gray-500 dark:text-gray-400">Promedio Evaluaciones</span>
                  <span className={`font-bold ${selectedStudent.globalGrade !== null ? (selectedStudent.globalGrade >= 80 ? 'text-emerald-500' : 'text-amber-500') : 'text-gray-400'}`}>
                    {selectedStudent.globalGrade !== null ? `${selectedStudent.globalGrade}%` : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Module Grades */}
              <div>
                <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-3">Rendimiento por Módulo</h4>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                   {selectedStudent.moduleGrades.length === 0 ? (
                      <p className="text-xs text-gray-500">Sin módulos asignados.</p>
                   ) : (
                     selectedStudent.moduleGrades.map(mg => (
                       <div key={mg.moduleId} className="text-sm border border-gray-100 dark:border-white/5 rounded-xl p-3">
                         <div className="flex justify-between items-start mb-2">
                           <span className="font-medium text-gray-800 dark:text-gray-200 line-clamp-2">{mg.moduleTitle}</span>
                           <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                              mg.status === 'Completado' ? 'bg-blue-500/10 text-blue-500' : 
                              mg.status === 'En Progreso' ? 'bg-emerald-500/10 text-emerald-500' : 
                              'bg-gray-100 dark:bg-white/5 text-gray-400'
                           }`}>
                             {mg.status}
                           </span>
                         </div>
                         <div className="flex justify-between items-center text-xs text-gray-500">
                           <span>Calificación Evaluación:</span>
                           <span className={`font-bold ${mg.quizScore !== null && mg.quizScore >= 80 ? 'text-emerald-500' : mg.quizScore !== null ? 'text-red-500' : 'text-gray-400'}`}>
                             {mg.quizScore !== null ? `${mg.quizScore}%` : 'N/A'}
                           </span>
                         </div>
                       </div>
                     ))
                   )}
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  )
}
