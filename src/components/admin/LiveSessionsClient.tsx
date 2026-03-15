"use client"

import { useState } from "react"
import { createLiveSession, updateLiveSession, deleteLiveSession, togglePublishSession } from "@/app/actions/liveSessions"
import { toast } from "sonner"

type Student = {
  id: string
  full_name: string | null
  email: string | null
  specialty: string | null
}

type SessionRow = {
  id: string
  title: string
  description: string | null
  session_date: string
  duration_minutes: number | null
  meeting_url: string | null
  platform: string | null
  is_published: boolean | null
  send_to_all: boolean | null
  status: string | null
  created_at: string
  recipientCount: number | null
}

const platformIcons: Record<string, string> = {
  zoom: "videocam",
  meet: "video_call",
  teams: "groups",
  other: "link",
}

const platformLabels: Record<string, string> = {
  zoom: "Zoom",
  meet: "Google Meet",
  teams: "Microsoft Teams",
  other: "Otro",
}

export function LiveSessionsClient({
  sessions: initialSessions,
  students,
}: {
  sessions: SessionRow[]
  students: Student[]
}) {
  const [showForm, setShowForm] = useState(false)
  const [editingSession, setEditingSession] = useState<SessionRow | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [sessionDate, setSessionDate] = useState("")
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [meetingUrl, setMeetingUrl] = useState("")
  const [platform, setPlatform] = useState("zoom")
  const [isPublished, setIsPublished] = useState(false)
  const [sendToAll, setSendToAll] = useState(true)
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([])
  const [recipientSearch, setRecipientSearch] = useState("")

  function resetForm() {
    setTitle("")
    setDescription("")
    setSessionDate("")
    setDurationMinutes(60)
    setMeetingUrl("")
    setPlatform("zoom")
    setIsPublished(false)
    setSendToAll(true)
    setSelectedRecipients([])
    setRecipientSearch("")
    setEditingSession(null)
  }

  function openCreate() {
    resetForm()
    setShowForm(true)
  }

  function openEdit(session: SessionRow) {
    setEditingSession(session)
    setTitle(session.title)
    setDescription(session.description || "")
    setSessionDate(session.session_date ? new Date(session.session_date).toISOString().slice(0, 16) : "")
    setDurationMinutes(session.duration_minutes || 60)
    setMeetingUrl(session.meeting_url || "")
    setPlatform(session.platform || "zoom")
    setIsPublished(session.is_published || false)
    setSendToAll(session.send_to_all !== false)
    setSelectedRecipients([])
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = {
      title,
      description,
      session_date: new Date(sessionDate).toISOString(),
      duration_minutes: durationMinutes,
      meeting_url: meetingUrl,
      platform,
      is_published: isPublished,
      send_to_all: sendToAll,
      recipient_ids: sendToAll ? [] : selectedRecipients,
    }

    try {
      let result
      if (editingSession) {
        result = await updateLiveSession(editingSession.id, formData)
      } else {
        result = await createLiveSession(formData)
      }

      if (result.success) {
        toast.success(editingSession ? "Sesión actualizada" : "Sesión creada exitosamente")
        setShowForm(false)
        resetForm()
      } else {
        toast.error(result.error || "Error al guardar")
      }
    } catch {
      toast.error("Error inesperado")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Estás seguro de eliminar esta sesión? Se eliminarán también las notificaciones asociadas.")) return
    setDeletingId(id)
    const result = await deleteLiveSession(id)
    if (result.success) {
      toast.success("Sesión eliminada")
    } else {
      toast.error(result.error || "Error al eliminar")
    }
    setDeletingId(null)
  }

  async function handleTogglePublish(id: string, currentPublished: boolean) {
    const result = await togglePublishSession(id, !currentPublished)
    if (result.success) {
      toast.success(currentPublished ? "Sesión despublicada" : "Sesión publicada y notificaciones enviadas")
    } else {
      toast.error(result.error || "Error")
    }
  }

  const filteredStudents = students.filter(s => {
    if (!recipientSearch) return true
    const query = recipientSearch.toLowerCase()
    return (
      s.full_name?.toLowerCase().includes(query) ||
      s.email?.toLowerCase().includes(query) ||
      s.specialty?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {initialSessions.length} sesion{initialSessions.length !== 1 ? "es" : ""} registrada{initialSessions.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-primary hover:bg-cyan-500 text-white font-semibold py-2.5 px-5 rounded-xl shadow-lg shadow-primary/25 transition-all active:scale-95 flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Nueva Sesión
        </button>
      </div>

      {/* Form Dialog */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#1a2332] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-white/10">
            <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingSession ? "Editar Sesión" : "Nueva Sesión en Vivo"}
              </h2>
              <button
                onClick={() => { setShowForm(false); resetForm() }}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-gray-400">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Title */}
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Título *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Ecografía de Hombro en Vivo"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Descripción</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descripción opcional de la sesión..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                />
              </div>

              {/* Date + Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Fecha y Hora *</label>
                  <input
                    type="datetime-local"
                    required
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Duración (min)</label>
                  <input
                    type="number"
                    min={15}
                    max={480}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 60)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
              </div>

              {/* Meeting URL + Platform */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Enlace de Reunión *</label>
                  <input
                    type="url"
                    required
                    value={meetingUrl}
                    onChange={(e) => setMeetingUrl(e.target.value)}
                    placeholder="https://zoom.us/j/..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Plataforma</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  >
                    <option value="zoom">Zoom</option>
                    <option value="meet">Google Meet</option>
                    <option value="teams">Microsoft Teams</option>
                    <option value="other">Otro</option>
                  </select>
                </div>
              </div>

              {/* Recipients */}
              <div className="border border-gray-200 dark:border-white/10 rounded-xl p-4 space-y-3">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block">Destinatarios</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="recipients"
                      checked={sendToAll}
                      onChange={() => setSendToAll(true)}
                      className="accent-primary"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Todos los alumnos</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="recipients"
                      checked={!sendToAll}
                      onChange={() => setSendToAll(false)}
                      className="accent-primary"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Seleccionar alumnos</span>
                  </label>
                </div>

                {!sendToAll && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Buscar alumno por nombre, email o especialidad..."
                      value={recipientSearch}
                      onChange={(e) => setRecipientSearch(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <div className="flex items-center justify-between text-xs text-gray-400 px-1">
                      <span>{selectedRecipients.length} seleccionado{selectedRecipients.length !== 1 ? "s" : ""}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedRecipients(filteredStudents.map(s => s.id))}
                        className="text-primary hover:underline"
                      >
                        Seleccionar todos
                      </button>
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1 border border-gray-100 dark:border-white/5 rounded-lg p-2">
                      {filteredStudents.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-4">No se encontraron alumnos</p>
                      ) : (
                        filteredStudents.map((student) => (
                          <label
                            key={student.id}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={selectedRecipients.includes(student.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedRecipients([...selectedRecipients, student.id])
                                } else {
                                  setSelectedRecipients(selectedRecipients.filter(id => id !== student.id))
                                }
                              }}
                              className="accent-primary rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {student.full_name || "Sin nombre"}
                              </p>
                              <p className="text-xs text-gray-400 truncate">
                                {student.email} {student.specialty ? `· ${student.specialty}` : ""}
                              </p>
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Publish Toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="accent-primary w-4 h-4"
                />
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Publicar inmediatamente</p>
                  <p className="text-xs text-gray-400">Los alumnos verán la sesión y recibirán notificación</p>
                </div>
              </label>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); resetForm() }}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-cyan-500 text-white font-semibold shadow-lg shadow-primary/25 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg">save</span>
                      {editingSession ? "Actualizar" : "Crear Sesión"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sessions Table */}
      {initialSessions.length === 0 ? (
        <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5 p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-600 mb-4 block">videocam_off</span>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No hay sesiones aún</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Crea tu primera clase en vivo para que tus alumnos se conecten</p>
          <button
            onClick={openCreate}
            className="bg-primary hover:bg-cyan-500 text-white font-semibold py-2.5 px-5 rounded-xl shadow-lg shadow-primary/25 transition-all active:scale-95 inline-flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Crear Primera Sesión
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5">
                  <th className="text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">Sesión</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">Fecha</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">Plataforma</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">Destinatarios</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">Estado</th>
                  <th className="text-right text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {initialSessions.map((session) => {
                  const isPast = new Date(session.session_date) < new Date()
                  const pf = session.platform || "other"

                  return (
                    <tr key={session.id} className="border-b border-gray-50 dark:border-white/3 hover:bg-gray-50 dark:hover:bg-white/2 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPast ? "bg-gray-100 dark:bg-gray-800" : "bg-primary/10"}`}>
                            <span className={`material-symbols-outlined text-lg ${isPast ? "text-gray-400" : "text-primary"}`}>
                              {platformIcons[pf] || "videocam"}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{session.title}</p>
                            {session.description && (
                              <p className="text-xs text-gray-400 line-clamp-1 max-w-[200px]">{session.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {new Date(session.session_date).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(session.session_date).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })} · {session.duration_minutes || 60} min
                        </p>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="text-sm text-gray-600 dark:text-gray-300">{platformLabels[pf] || "Otro"}</span>
                      </td>
                      <td className="px-6 py-3.5">
                        {session.send_to_all ? (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/20">
                            Todos
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-violet-500/15 text-violet-400 border border-violet-500/20">
                            {session.recipientCount ?? 0} alumno{(session.recipientCount ?? 0) !== 1 ? "s" : ""}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        {isPast ? (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-500/15 text-gray-400 border border-gray-500/20">
                            Finalizada
                          </span>
                        ) : session.is_published ? (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                            Publicada
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20">
                            Borrador
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          {!isPast && (
                            <button
                              onClick={() => handleTogglePublish(session.id, !!session.is_published)}
                              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors group"
                              title={session.is_published ? "Despublicar" : "Publicar"}
                            >
                              <span className="material-symbols-outlined text-lg text-gray-400 group-hover:text-primary">
                                {session.is_published ? "visibility_off" : "visibility"}
                              </span>
                            </button>
                          )}
                          <button
                            onClick={() => openEdit(session)}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors group"
                            title="Editar"
                          >
                            <span className="material-symbols-outlined text-lg text-gray-400 group-hover:text-primary">edit</span>
                          </button>
                          {session.meeting_url && (
                            <button
                              onClick={() => { navigator.clipboard.writeText(session.meeting_url || ""); toast.success("Enlace copiado") }}
                              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors group"
                              title="Copiar enlace"
                            >
                              <span className="material-symbols-outlined text-lg text-gray-400 group-hover:text-primary">content_copy</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(session.id)}
                            disabled={deletingId === session.id}
                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors group disabled:opacity-50"
                            title="Eliminar"
                          >
                            <span className="material-symbols-outlined text-lg text-gray-400 group-hover:text-red-400">
                              {deletingId === session.id ? "progress_activity" : "delete"}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
