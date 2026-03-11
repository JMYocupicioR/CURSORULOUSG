"use client"

import { useState, useTransition, useMemo } from "react"
import { AdminHeader } from "@/components/admin/AdminHeader"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toggleStudentStatus, approveAccessRequest, deleteStudent } from "@/app/actions/admin"

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
  licenseId: string | null;
  experienceLevel: string | null;
  interestArea: string | null;
  phone: string | null;
  accessRequested: boolean;
  accessRequestedAt: string | null;
}

interface Stats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  accessRequests: number;
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

type StatusFilter = "all" | "active" | "pending" | "completed" | "inactive"
type SortField = "name" | "progress" | "date" | "grade"
type SortOrder = "asc" | "desc"

export function AlumnosClient({ students, stats }: { students: StudentDetail[]; stats: Stats }) {
  const [selectedStudent, setSelectedStudent] = useState<StudentDetail | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [localStudents, setLocalStudents] = useState<StudentDetail[]>(students)
  const [isPending, startTransition] = useTransition()
  const [toggleError, setToggleError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"all" | "requests">(stats.accessRequests > 0 ? "requests" : "all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("all")
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [showFilters, setShowFilters] = useState(false)

  // Compute unique specialties for the filter dropdown
  const specialties = useMemo(() => {
    const set = new Set<string>()
    localStudents.forEach(s => {
      if (s.specialty && s.specialty !== "No especificada") set.add(s.specialty)
    })
    return Array.from(set).sort()
  }, [localStudents])

  // Export filtered results as CSV
  const exportCSV = () => {
    const headers = ["Nombre", "Email", "Especialidad", "Estado", "Progreso", "Calificación", "Ciudad", "Teléfono", "Cédula", "Fecha de Inscripción", "Acceso"]
    const rows = filtered.map(s => [
      s.name,
      s.email,
      s.specialty,
      s.status === "completed" ? "Certificado" : s.status === "active" ? "En Progreso" : "Pendiente",
      `${s.progress}%`,
      s.globalGrade !== null ? `${s.globalGrade}%` : "N/A",
      s.city,
      s.phone || "N/A",
      s.licenseId || "N/A",
      s.enrollDate ? new Date(s.enrollDate).toLocaleDateString("es-MX") : "N/A",
      s.isActive ? "Activo" : "Inactivo",
    ])
    const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `alumnos_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleToggleStatus = (student: StudentDetail) => {
    const newIsActive = !student.isActive
    setToggleError(null)

    const update = (list: StudentDetail[]) =>
      list.map(s => s.id === student.id ? { ...s, isActive: newIsActive } : s)

    setLocalStudents(prev => update(prev))
    setSelectedStudent(prev => prev?.id === student.id ? { ...prev, isActive: newIsActive } : prev)

    startTransition(async () => {
      const result = await toggleStudentStatus(student.id, newIsActive)
      if (!result.success) {
        const revert = (list: StudentDetail[]) =>
          list.map(s => s.id === student.id ? { ...s, isActive: !newIsActive } : s)
        setLocalStudents(prev => revert(prev))
        setSelectedStudent(prev => prev?.id === student.id ? { ...prev, isActive: !newIsActive } : prev)
        setToggleError(result.error || "Error al actualizar el acceso")
      }
    })
  }

  const handleApprove = (student: StudentDetail) => {
    setToggleError(null)

    // Optimistic UI
    setLocalStudents(prev =>
      prev.map(s => s.id === student.id ? { ...s, isActive: true, accessRequested: false } : s)
    )
    setSelectedStudent(prev =>
      prev?.id === student.id ? { ...prev, isActive: true, accessRequested: false } : prev
    )

    startTransition(async () => {
      const result = await approveAccessRequest(student.id)
      if (!result.success) {
        // Revert
        setLocalStudents(prev =>
          prev.map(s => s.id === student.id ? { ...s, isActive: false, accessRequested: true } : s)
        )
        setSelectedStudent(prev =>
          prev?.id === student.id ? { ...prev, isActive: false, accessRequested: true } : prev
        )
        setToggleError(result.error || "Error al aprobar acceso")
      }
    })
  }

  const pendingRequests = localStudents.filter(s => s.accessRequested && !s.isActive)
  const allStudents = localStudents

  const statsCards = [
    { label: "Total", value: stats.total, icon: "groups", gradient: "from-primary/30 to-cyan-500/10", iconColor: "text-primary" },
    { label: "Certificados", value: stats.completed, icon: "workspace_premium", gradient: "from-emerald-500/30 to-emerald-500/5", iconColor: "text-emerald-400" },
    { label: "En Progreso", value: stats.inProgress, icon: "trending_up", gradient: "from-blue-500/30 to-blue-500/5", iconColor: "text-blue-400" },
    { label: "Solicitudes", value: pendingRequests.length, icon: "person_add", gradient: pendingRequests.length > 0 ? "from-orange-500/30 to-orange-500/5" : "from-amber-500/30 to-amber-500/5", iconColor: pendingRequests.length > 0 ? "text-orange-400" : "text-amber-400" },
  ]

  // Filter + Sort pipeline
  const filtered = useMemo(() => {
    const baseList = activeTab === "requests" ? pendingRequests : allStudents

    // 1. Text search
    let result = baseList.filter(s =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.city && s.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.phone && s.phone.includes(searchTerm))
    )

    // 2. Status filter (only on "all" tab)
    if (activeTab === "all" && statusFilter !== "all") {
      switch (statusFilter) {
        case "active":
          result = result.filter(s => s.isActive && s.status === "active")
          break
        case "completed":
          result = result.filter(s => s.status === "completed")
          break
        case "pending":
          result = result.filter(s => s.isActive && s.status === "pending")
          break
        case "inactive":
          result = result.filter(s => !s.isActive)
          break
      }
    }

    // 3. Specialty filter
    if (specialtyFilter !== "all") {
      result = result.filter(s => s.specialty === specialtyFilter)
    }

    // 4. Sort
    result.sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case "name":
          cmp = a.name.localeCompare(b.name, "es")
          break
        case "progress":
          cmp = a.progress - b.progress
          break
        case "date":
          cmp = new Date(a.enrollDate).getTime() - new Date(b.enrollDate).getTime()
          break
        case "grade":
          cmp = (a.globalGrade ?? -1) - (b.globalGrade ?? -1)
          break
      }
      return sortOrder === "desc" ? -cmp : cmp
    })

    return result
  }, [activeTab, pendingRequests, allStudents, searchTerm, statusFilter, specialtyFilter, sortField, sortOrder])

  const activeFiltersCount = (statusFilter !== "all" ? 1 : 0) + (specialtyFilter !== "all" ? 1 : 0)

  const clearAllFilters = () => {
    setStatusFilter("all")
    setSpecialtyFilter("all")
    setSearchTerm("")
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder(field === "name" ? "asc" : "desc")
    }
  }

  const handleDelete = async (student: StudentDetail) => {
    setIsDeleting(true)
    setDeleteError(null)

    const result = await deleteStudent(student.id)
    if (result.success) {
      setLocalStudents(prev => prev.filter(s => s.id !== student.id))
      setSelectedStudent(null)
      setShowDeleteConfirm(false)
    } else {
      setDeleteError(result.error || "Error al eliminar el usuario")
    }
    setIsDeleting(false)
  }

  const closeDetail = () => {
    setSelectedStudent(null)
    setToggleError(null)
    setShowDeleteConfirm(false)
    setDeleteError(null)
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

        {/* Tabs */}
        <div className="flex gap-1 bg-white/3 rounded-xl border border-white/8 p-1">
          <button
            onClick={() => setActiveTab("requests")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === "requests"
                ? "bg-orange-500/20 text-orange-300 shadow-sm"
                : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
            }`}
          >
            <span className="material-symbols-outlined text-base">person_add</span>
            Solicitudes
            {pendingRequests.length > 0 && (
              <span className="bg-orange-500 text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center">
                {pendingRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === "all"
                ? "bg-primary/20 text-primary shadow-sm"
                : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
            }`}
          >
            <span className="material-symbols-outlined text-base">groups</span>
            Todos los Alumnos
          </button>
        </div>

        {/* Search + Filter Bar */}
        <div className="space-y-3">
          <div className="flex gap-2">
            {/* Search input */}
            <div className="flex-1 bg-white/5 rounded-xl border border-white/8 px-4 py-2.5 flex items-center gap-2.5">
              <span className="material-symbols-outlined text-gray-400 text-lg shrink-0">search</span>
              <input
                type="text"
                placeholder="Buscar por nombre, email, especialidad, ciudad o teléfono..."
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

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(prev => !prev)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all shrink-0 ${
                showFilters || activeFiltersCount > 0
                  ? "bg-primary/15 border-primary/30 text-primary"
                  : "bg-white/5 border-white/8 text-gray-400 hover:text-gray-200 hover:border-white/15"
              }`}
            >
              <span className="material-symbols-outlined text-base">tune</span>
              Filtros
              {activeFiltersCount > 0 && (
                <span className="bg-primary text-white text-[10px] font-black rounded-full w-4.5 h-4.5 flex items-center justify-center min-w-[18px]">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Export CSV */}
            <button
              onClick={exportCSV}
              disabled={filtered.length === 0}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border bg-white/5 border-white/8 text-gray-400 hover:text-gray-200 hover:border-white/15 text-sm font-semibold transition-all shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Exportar a CSV"
            >
              <span className="material-symbols-outlined text-base">download</span>
              <span className="hidden sm:inline">Exportar</span>
            </button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="bg-white/3 rounded-xl border border-white/8 p-4 flex flex-wrap gap-3 items-end animate-in slide-in-from-top-2 duration-200">
              {/* Status Filter */}
              {activeTab === "all" && (
                <div className="flex flex-col gap-1.5 min-w-[160px]">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Estado</label>
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value as StatusFilter)}
                    className="bg-white/5 border border-white/10 rounded-lg text-sm text-gray-200 px-3 py-2 outline-none focus:border-primary/50 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="all">Todos los estados</option>
                    <option value="active">En Progreso</option>
                    <option value="completed">Certificados</option>
                    <option value="pending">Sin inicio</option>
                    <option value="inactive">Inactivos</option>
                  </select>
                </div>
              )}

              {/* Specialty Filter */}
              <div className="flex flex-col gap-1.5 min-w-[180px]">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Especialidad</label>
                <select
                  value={specialtyFilter}
                  onChange={e => setSpecialtyFilter(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg text-sm text-gray-200 px-3 py-2 outline-none focus:border-primary/50 transition-colors appearance-none cursor-pointer"
                >
                  <option value="all">Todas las especialidades</option>
                  {specialties.map(sp => (
                    <option key={sp} value={sp}>{sp}</option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div className="flex flex-col gap-1.5 min-w-[160px]">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Ordenar por</label>
                <div className="flex">
                  <select
                    value={sortField}
                    onChange={e => handleSort(e.target.value as SortField)}
                    className="bg-white/5 border border-white/10 rounded-l-lg text-sm text-gray-200 px-3 py-2 outline-none focus:border-primary/50 transition-colors appearance-none cursor-pointer flex-1"
                  >
                    <option value="date">Fecha de inscripción</option>
                    <option value="name">Nombre</option>
                    <option value="progress">Progreso</option>
                    <option value="grade">Calificación</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
                    className="bg-white/5 border border-white/10 border-l-0 rounded-r-lg px-2.5 text-gray-400 hover:text-gray-200 transition-colors"
                    title={sortOrder === "asc" ? "Ascendente" : "Descendente"}
                  >
                    <span className="material-symbols-outlined text-base">
                      {sortOrder === "asc" ? "arrow_upward" : "arrow_downward"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Clear filters */}
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors self-end"
                >
                  <span className="material-symbols-outlined text-sm">filter_alt_off</span>
                  Limpiar filtros
                </button>
              )}
            </div>
          )}

          {/* Result count */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span>{filtered.length} de {(activeTab === "requests" ? pendingRequests : allStudents).length} alumnos</span>
              {(searchTerm || activeFiltersCount > 0) && (
                <span className="text-primary/70">• filtrado</span>
              )}
            </div>
            <span className="text-gray-600">
              Ordenado por {sortField === "date" ? "fecha" : sortField === "name" ? "nombre" : sortField === "progress" ? "progreso" : "calificación"}
              {" "}{sortOrder === "asc" ? "↑" : "↓"}
            </span>
          </div>
        </div>

        {/* Content area */}
        <div className="flex gap-5">
          {/* Student cards / list */}
          <div className={`flex-1 min-w-0 transition-all duration-300 ${selectedStudent ? "hidden xl:block xl:w-3/5" : "w-full"}`}>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                <span className="material-symbols-outlined text-5xl mb-3 text-gray-600">
                  {activeTab === "requests" ? "inbox" : "person_search"}
                </span>
                <p className="text-sm font-medium">
                  {activeTab === "requests" ? "No hay solicitudes pendientes" : "No se encontraron estudiantes"}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {activeTab === "requests" ? "Las nuevas solicitudes aparecerán aquí" : "Intenta con otro término de búsqueda"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map(s => (
                  <div
                    key={s.id}
                    className={`w-full text-left bg-white/3 hover:bg-white/6 border rounded-xl p-4 transition-all duration-200 group ${
                      selectedStudent?.id === s.id
                        ? "border-primary/40 bg-primary/5 shadow-[0_0_20px_rgba(0,180,216,0.08)]"
                        : activeTab === "requests"
                        ? "border-orange-500/20 hover:border-orange-500/30"
                        : "border-white/5 hover:border-white/10"
                    }`}
                  >
                    <button
                      onClick={() => { setSelectedStudent(s); setToggleError(null) }}
                      className="w-full text-left"
                    >
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xs font-black text-white transition-all ${
                          s.isActive
                            ? "bg-gradient-to-br from-primary to-cyan-400 shadow-md shadow-primary/20"
                            : activeTab === "requests"
                            ? "bg-gradient-to-br from-orange-500 to-amber-400 shadow-md shadow-orange-500/20"
                            : "bg-gradient-to-br from-gray-600 to-gray-700"
                        }`}>
                          <Initials name={s.name} />
                        </div>

                        {/* Name + email */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-white truncate">{s.name}</p>
                            {activeTab === "requests" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/10 text-orange-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                                Solicitud
                              </span>
                            ) : (
                              <AccessBadge isActive={s.isActive} />
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 truncate">{s.email}</p>
                        </div>

                        {/* Progress on desktop */}
                        <div className="hidden sm:flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <p className="text-xs text-gray-500">{s.specialty}</p>
                            {activeTab === "all" && (
                              <div className="flex items-center gap-2 mt-1 justify-end">
                                <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                  <div className="h-full bg-primary rounded-full" style={{ width: `${s.progress}%` }} />
                                </div>
                                <span className="text-xs text-gray-400 w-8 text-right">{s.progress}%</span>
                              </div>
                            )}
                          </div>
                          {activeTab === "all" && <ProgressBadge status={s.status} isActive={s.isActive} />}
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
                      {activeTab === "all" && (
                        <div className="sm:hidden mt-2.5 flex items-center gap-3">
                          <ProgressBadge status={s.status} isActive={s.isActive} />
                          <div className="flex-1 flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${s.progress}%` }} />
                            </div>
                            <span className="text-xs text-gray-400 shrink-0">{s.progress}%</span>
                          </div>
                        </div>
                      )}
                    </button>

                    {/* Quick approve button for request tab */}
                    {activeTab === "requests" && (
                      <div className="mt-3 pt-3 border-t border-white/5">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleApprove(s) }}
                          disabled={isPending}
                          className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/20"
                        >
                          <span className={`material-symbols-outlined text-base ${isPending ? "animate-spin" : ""}`}>
                            {isPending ? "autorenew" : "check_circle"}
                          </span>
                          {isPending ? "Aprobando..." : "Admitir Alumno"}
                        </button>
                      </div>
                    )}
                  </div>
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
                        : selectedStudent.accessRequested
                        ? "bg-gradient-to-br from-orange-500 to-amber-400 shadow-orange-500/30"
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

                  {/* Registration Info — ENHANCED */}
                  <div className="space-y-2.5 bg-white/3 rounded-xl p-4 border border-white/5">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Información de Registro</p>
                    {[
                      { icon: "stethoscope", label: "Especialidad", value: selectedStudent.specialty },
                      { icon: "badge", label: "Cédula Profesional", value: selectedStudent.licenseId || "No proporcionada" },
                      { icon: "location_on", label: "Estado", value: selectedStudent.city },
                      { icon: "school", label: "Experiencia en USG", value: selectedStudent.experienceLevel || "No especificada" },
                      { icon: "interests", label: "Área de Interés", value: selectedStudent.interestArea || "No especificada" },
                      { icon: "phone", label: "Teléfono", value: selectedStudent.phone || "No proporcionado" },
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

                  {/* Access Request Notice */}
                  {selectedStudent.accessRequested && !selectedStudent.isActive && (
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-orange-400 text-lg">notifications_active</span>
                        <div>
                          <p className="text-sm font-semibold text-orange-300">Solicitud de Acceso Pendiente</p>
                          {selectedStudent.accessRequestedAt && (
                            <p className="text-[11px] text-gray-400">
                              Solicitado el {format(new Date(selectedStudent.accessRequestedAt), "d MMM yyyy, HH:mm", { locale: es })}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleApprove(selectedStudent)}
                        disabled={isPending}
                        className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20"
                      >
                        <span className={`material-symbols-outlined text-base ${isPending ? "animate-spin" : ""}`}>
                          {isPending ? "autorenew" : "check_circle"}
                        </span>
                        {isPending ? "Aprobando..." : "Admitir Alumno"}
                      </button>
                    </div>
                  )}

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

                  {/* Delete user */}
                  <div className="pt-3 border-t border-white/5">
                    {!showDeleteConfirm ? (
                      <button
                        onClick={() => { setShowDeleteConfirm(true); setDeleteError(null) }}
                        className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 bg-red-500/8 text-red-400/70 hover:bg-red-500/15 hover:text-red-400 border border-transparent hover:border-red-500/20"
                      >
                        <span className="material-symbols-outlined text-base">person_remove</span>
                        Eliminar Alumno
                      </button>
                    ) : (
                      <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-4 space-y-3">
                        <div className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-red-400 text-lg shrink-0 mt-0.5">warning</span>
                          <div>
                            <p className="text-sm font-semibold text-red-300">¿Eliminar a {selectedStudent.name}?</p>
                            <p className="text-[11px] text-gray-400 mt-1">Se eliminará su cuenta, progreso y toda la información asociada. Esta acción no se puede deshacer.</p>
                          </div>
                        </div>

                        {deleteError && (
                          <div className="flex items-center gap-2 p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <span className="material-symbols-outlined text-red-400 text-sm shrink-0">error</span>
                            <p className="text-xs text-red-400">{deleteError}</p>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <button
                            onClick={() => { setShowDeleteConfirm(false); setDeleteError(null) }}
                            disabled={isDeleting}
                            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10 transition-all disabled:opacity-50"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => handleDelete(selectedStudent)}
                            disabled={isDeleting}
                            className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20"
                          >
                            <span className={`material-symbols-outlined text-base ${isDeleting ? 'animate-spin' : ''}`}>
                              {isDeleting ? 'autorenew' : 'delete_forever'}
                            </span>
                            {isDeleting ? 'Eliminando...' : 'Sí, Eliminar'}
                          </button>
                        </div>
                      </div>
                    )}
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
