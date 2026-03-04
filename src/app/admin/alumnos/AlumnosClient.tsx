"use client"

import { useState, useTransition } from "react"
import { AdminHeader } from "@/components/admin/AdminHeader"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toggleStudentStatus } from "@/app/actions/admin"

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
  isActive: boolean;
}

interface Stats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
}

function Initials({ name }: { name: string }) {
  const parts = name.split(" ").filter(w => w.length > 2)
  return <>{parts.slice(0, 2).map(w => w[0]).join("").toUpperCase()}</>
}

function ProgressBadge({ status, isActive }: { status: string; isActive: boolean }) {
  if (!isActive) {
    return (
      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold border bg-amber-500/15 text-amber-400 border-amber-500/20">
        Pendiente
      </span>
    )
  }
  const styles: Record<string, string> = {
    active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    completed: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    pending: "bg-gray-500/15 text-gray-400 border-gray-500/20",
  }
  const labels: Record<string, string> = {
    active: "En Progreso",
    completed: "Certificado",
    pending: "Sin inicio",
  }
  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${styles[status] || styles.pending}`}>
      {labels[status] || "—"}
    </span>
  )
}

function AccessBadge({ isActive }: { isActive: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
      isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
      {isActive ? "Activo" : "Inactivo"}
    </span>
  )
}

export function AlumnosClient({ students, stats }: { students: StudentDetail[]; stats: Stats }) {
  const [selectedStudent, setSelectedStudent] = useState<StudentDetail | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [localStudents, setLocalStudents] = useState<StudentDetail[]>(students)
  const [isPending, startTransition] = useTransition()
  const [toggleError, setToggleError] = useState<string | null>(null)

  const handleToggleStatus = (student: StudentDetail) => {
    const newIsActive = !student.isActive
    setToggleError(null)

    // Optimistic UI
    const update = (list: StudentDetail[]) =>
      list.map(s => s.id === student.id ? { ...s, isActive: newIsActive } : s)

    setLocalStudents(prev => update(prev))
    setSelectedStudent(prev => prev?.id === student.id ? { ...prev, isActive: newIsActive } : prev)

    startTransition(async () => {
      const result = await toggleStudentStatus(student.id, newIsActive)
      if (!result.success) {
        // Revert
        const revert = (list: StudentDetail[]) =>
          list.map(s => s.id === student.id ? { ...s, isActive: !newIsActive } : s)
        setLocalStudents(prev => revert(prev))
        setSelectedStudent(prev => prev?.id === student.id ? { ...prev, isActive: !newIsActive } : prev)
        setToggleError(result.error || "Error al actualizar el acceso")
      }
    })
  }

  const statsCards = [
    { label: "Total", value: stats.total, icon: "groups", gradient: "from-primary/30 to-cyan-500/10", iconColor: "text-primary" },
    { label: "Certificados", value: stats.completed, icon: "workspace_premium", gradient: "from-emerald-500/30 to-emerald-500/5", iconColor: "text-emerald-400" },
    { label: "En Progreso", value: stats.inProgress, icon: "trending_up", gradient: "from-blue-500/30 to-blue-500/5", iconColor: "text-blue-400" },
    { label: "Pendientes", value: stats.pending, icon: "hourglass_top", gradient: "from-amber-500/30 to-amber-500/5", iconColor: "text-amber-400" },
  ]

  const filtered = localStudents.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.specialty.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const closeDetail = () => {
    setSelectedStudent(null)
    setToggleError(null)
  }

  return (
    <div className="flex flex-col h-full">
      <AdminHeader title="Gestión de Alumnos" subtitle="Administra y monitorea a los médicos inscritos" />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">

        {/* Stats — 2x2 on mobile, 4 cols on xl */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {statsCards.map((card) => (
            <div key={card.label} className={`bg-gradient-to-br ${card.gradient} rounded-2xl border border-white/5 p-4 flex items-center gap-3 hover:scale-[1.02] transition-transform`}>
              <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                <span className={`material-symbols-outlined text-xl ${card.iconColor}`}>{card.icon}</span>
              </div>
              <div>
                <p className="text-xl font-black text-white leading-tight">{card.value}</p>
                <p className="text-[11px] text-gray-400">{card.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="bg-white/5 rounded-xl border border-white/8 px-4 py-2.5 flex items-center gap-2.5">
          <span className="material-symbols-outlined text-gray-400 text-lg shrink-0">search</span>
          <input
            type="text"
            placeholder="Buscar por nombre, email o especialidad..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="bg-transparent text-sm text-gray-200 placeholder-gray-500 outline-none w-full"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="text-gray-500 hover:text-gray-300 transition-colors">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          )}
        </div>

        {/* Content area */}
        <div className="flex gap-5">
          {/* Student cards / list */}
          <div className={`flex-1 min-w-0 transition-all duration-300 ${selectedStudent ? "hidden xl:block xl:w-3/5" : "w-full"}`}>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                <span className="material-symbols-outlined text-5xl mb-3 text-gray-600">person_search</span>
                <p className="text-sm font-medium">No se encontraron estudiantes</p>
                <p className="text-xs text-gray-600 mt-1">Intenta con otro término de búsqueda</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { setSelectedStudent(s); setToggleError(null) }}
                    className={`w-full text-left bg-white/3 hover:bg-white/6 border rounded-xl p-4 transition-all duration-200 group ${
                      selectedStudent?.id === s.id
                        ? "border-primary/40 bg-primary/5 shadow-[0_0_20px_rgba(0,180,216,0.08)]"
                        : "border-white/5 hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xs font-black text-white transition-all ${
                        s.isActive
                          ? "bg-gradient-to-br from-primary to-cyan-400 shadow-md shadow-primary/20"
                          : "bg-gradient-to-br from-gray-600 to-gray-700"
                      }`}>
                        <Initials name={s.name} />
                      </div>

                      {/* Name + email */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-white truncate">{s.name}</p>
                          <AccessBadge isActive={s.isActive} />
                        </div>
                        <p className="text-[11px] text-gray-500 truncate">{s.email}</p>
                      </div>

                      {/* Progress on desktop */}
                      <div className="hidden sm:flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-xs text-gray-500">{s.specialty}</p>
                          <div className="flex items-center gap-2 mt-1 justify-end">
                            <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${s.progress}%` }} />
                            </div>
                            <span className="text-xs text-gray-400 w-8 text-right">{s.progress}%</span>
                          </div>
                        </div>
                        <ProgressBadge status={s.status} isActive={s.isActive} />
                        <span className={`material-symbols-outlined text-gray-500 text-lg transition-transform ${selectedStudent?.id === s.id ? "text-primary rotate-90" : "group-hover:translate-x-0.5"}`}>
                          chevron_right
                        </span>
                      </div>

                      {/* Mobile only: chevron */}
                      <div className="sm:hidden">
                        <span className="material-symbols-outlined text-gray-500 text-lg">chevron_right</span>
                      </div>
                    </div>

                    {/* Mobile: progress row */}
                    <div className="sm:hidden mt-2.5 flex items-center gap-3">
                      <ProgressBadge status={s.status} isActive={s.isActive} />
                      <div className="flex-1 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${s.progress}%` }} />
                        </div>
                        <span className="text-xs text-gray-400 shrink-0">{s.progress}%</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Detail panel */}
          {selectedStudent && (
            <div className="w-full xl:w-2/5 shrink-0">
              <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden sticky top-0">
                {/* Panel header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-white/2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Detalle del Alumno</p>
                  <button onClick={closeDetail} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                    <span className="material-symbols-outlined text-gray-400 text-base">close</span>
                  </button>
                </div>

                <div className="p-5 space-y-5 max-h-[calc(100vh-220px)] overflow-y-auto">
                  {/* Avatar + name */}
                  <div className="flex flex-col items-center text-center gap-2 pt-2">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-lg ${
                      selectedStudent.isActive
                        ? "bg-gradient-to-br from-primary to-cyan-400 shadow-primary/30"
                        : "bg-gradient-to-br from-gray-600 to-gray-700"
                    }`}>
                      <Initials name={selectedStudent.name} />
                    </div>
                    <div>
                      <h4 className="font-bold text-white">{selectedStudent.name}</h4>
                      <p className="text-xs text-gray-400">{selectedStudent.email}</p>
                    </div>
                    <AccessBadge isActive={selectedStudent.isActive} />
                  </div>

                  {/* Info rows */}
                  <div className="space-y-2.5 bg-white/3 rounded-xl p-4 border border-white/5">
                    {[
                      { icon: "stethoscope", label: "Especialidad", value: selectedStudent.specialty },
                      { icon: "location_on", label: "Ciudad", value: selectedStudent.city },
                      { icon: "calendar_today", label: "Inscripción", value: format(new Date(selectedStudent.enrollDate), "d MMM yyyy", { locale: es }) },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between text-sm gap-4">
                        <div className="flex items-center gap-2 text-gray-500">
                          <span className="material-symbols-outlined text-base">{item.icon}</span>
                          <span>{item.label}</span>
                        </div>
                        <span className="font-medium text-gray-200 text-right text-xs">{item.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Progress stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 text-center">
                      <p className="text-2xl font-black text-primary">{selectedStudent.progress}%</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">Progreso</p>
                    </div>
                    <div className={`rounded-xl p-3 text-center border ${
                      selectedStudent.globalGrade !== null
                        ? selectedStudent.globalGrade >= 80
                          ? "bg-emerald-500/10 border-emerald-500/20"
                          : "bg-amber-500/10 border-amber-500/20"
                        : "bg-white/5 border-white/5"
                    }`}>
                      <p className={`text-2xl font-black ${
                        selectedStudent.globalGrade !== null
                          ? selectedStudent.globalGrade >= 80 ? "text-emerald-400" : "text-amber-400"
                          : "text-gray-500"
                      }`}>
                        {selectedStudent.globalGrade !== null ? `${selectedStudent.globalGrade}%` : "N/A"}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">Calificación</p>
                    </div>
                  </div>

                  {/* Activation toggle */}
                  <div className="bg-white/3 border border-white/8 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">Acceso al Curso</p>
                        <p className={`text-[11px] mt-0.5 ${selectedStudent.isActive ? "text-emerald-400" : "text-amber-400"}`}>
                          {selectedStudent.isActive ? "✓ Acceso habilitado" : "⏳ Pendiente de activación"}
                        </p>
                      </div>
                      {/* Toggle switch */}
                      <button
                        onClick={() => handleToggleStatus(selectedStudent)}
                        disabled={isPending}
                        aria-label={selectedStudent.isActive ? "Desactivar" : "Activar"}
                        className={`relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0d1117] disabled:opacity-50 ${
                          selectedStudent.isActive
                            ? "bg-emerald-500 focus:ring-emerald-500"
                            : "bg-gray-600 focus:ring-gray-500"
                        }`}
                      >
                        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-all duration-300 ${
                          selectedStudent.isActive ? "translate-x-6" : "translate-x-0.5"
                        } ${isPending ? "animate-pulse" : ""}`} />
                      </button>
                    </div>

                    {toggleError && (
                      <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <span className="material-symbols-outlined text-red-400 text-base shrink-0">error</span>
                        <p className="text-xs text-red-400">{toggleError}</p>
                      </div>
                    )}

                    <button
                      onClick={() => handleToggleStatus(selectedStudent)}
                      disabled={isPending}
                      className={`w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 ${
                        selectedStudent.isActive
                          ? "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
                          : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
                      }`}
                    >
                      <span className={`material-symbols-outlined text-base ${isPending ? "animate-spin" : ""}`}>
                        {isPending ? "autorenew" : selectedStudent.isActive ? "block" : "check_circle"}
                      </span>
                      {isPending ? "Guardando..." : selectedStudent.isActive ? "Desactivar Acceso" : "Activar Acceso"}
                    </button>
                  </div>

                  {/* Module grades */}
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Rendimiento por Módulo</p>
                    <div className="space-y-2">
                      {selectedStudent.moduleGrades.length === 0 ? (
                        <p className="text-xs text-gray-500 py-4 text-center">Sin módulos asignados.</p>
                      ) : selectedStudent.moduleGrades.map(mg => (
                        <div key={mg.moduleId} className="bg-white/3 border border-white/5 rounded-xl p-3">
                          <div className="flex justify-between items-start mb-2 gap-2">
                            <p className="text-xs font-medium text-gray-200 line-clamp-2 flex-1">{mg.moduleTitle}</p>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                              mg.status === "Completado"
                                ? "bg-blue-500/10 text-blue-400"
                                : mg.status === "En Progreso"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-white/5 text-gray-500"
                            }`}>
                              {mg.status}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xs text-gray-500">
                            <span>Evaluación</span>
                            <span className={`font-bold ${
                              mg.quizScore !== null && mg.quizScore >= 80
                                ? "text-emerald-400"
                                : mg.quizScore !== null
                                ? "text-amber-400"
                                : "text-gray-500"
                            }`}>
                              {mg.quizScore !== null ? `${mg.quizScore}%` : "Pendiente"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
