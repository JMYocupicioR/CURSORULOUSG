'use client'

import { useState } from 'react'
import { MicroLesson } from '@/lib/data'
import { createMicroLesson, updateMicroLesson, deleteMicroLesson } from '@/app/actions/microlearningSetup'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function MicrolearningClient({ initialData }: { initialData: MicroLesson[] }) {
  const router = useRouter()
  const [lessons, setLessons] = useState<MicroLesson[]>(initialData)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState<MicroLesson | null>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration_minutes: 5,
    category: 'General',
    thumbnail_url: '',
    video_url: '',
    is_published: false
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleOpenModal = (lesson?: MicroLesson) => {
    if (lesson) {
      setEditingLesson(lesson)
      setFormData({
        title: lesson.title,
        description: lesson.description || '',
        duration_minutes: lesson.duration_minutes,
        category: lesson.category || 'General',
        thumbnail_url: lesson.thumbnail_url || '',
        video_url: lesson.video_url || '',
        is_published: lesson.is_published
      })
    } else {
      setEditingLesson(null)
      setFormData({
        title: '',
        description: '',
        duration_minutes: 5,
        category: 'General',
        thumbnail_url: '',
        video_url: '',
        is_published: false
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (editingLesson) {
        const res = await updateMicroLesson(editingLesson.id, formData)
        if (res.success) {
          toast.success("Tema actualizado correctamente")
          setIsModalOpen(false)
          router.refresh()
        } else {
          toast.error(res.error || "Error al actualizar")
        }
      } else {
        const res = await createMicroLesson(formData)
        if (res.success) {
          toast.success("Tema creado correctamente")
          setIsModalOpen(false)
          router.refresh()
        } else {
          toast.error(res.error || "Error al crear")
        }
      }
    } catch (err) {
      toast.error("Ocurrió un error inesperado")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este tema?")) return;
    
    try {
      const res = await deleteMicroLesson(id)
      if (res.success) {
        toast.success("Tema eliminado")
        router.refresh()
      } else {
        toast.error(res.error || "Error al eliminar")
      }
    } catch (err) {
      toast.error("Ocurrió un error inesperado")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Temas Disponibles</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Ver todas las lecciones cortas de micro-aprendizaje.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-primary hover:bg-cyan-500 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm shadow-primary/20"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Crear Tema
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {initialData.map(lesson => (
          <div key={lesson.id} className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden hover:shadow-lg transition-all group">
            <div className="h-32 bg-gray-100 dark:bg-gray-800 relative">
              {lesson.thumbnail_url ? (
                <img src={lesson.thumbnail_url} alt={lesson.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600">play_circle</span>
                </div>
              )}
              <div className="absolute top-2 right-2 flex gap-1">
                <span className={`px-2 py-1 rounded-md text-[10px] font-bold shadow-sm ${lesson.is_published ? 'bg-emerald-500/90 text-white' : 'bg-gray-800/90 text-gray-300'}`}>
                  {lesson.is_published ? 'PUBLICADO' : 'BORRADOR'}
                </span>
                <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-black/60 text-white shadow-sm flex items-center gap-1">
                  <span className="material-symbols-outlined text-[10px]">schedule</span>
                  {lesson.duration_minutes}m
                </span>
              </div>
            </div>
            <div className="p-4">
              <span className="text-[10px] text-primary font-bold uppercase tracking-wider">{lesson.category}</span>
              <h3 className="font-bold text-gray-900 dark:text-white mt-1 line-clamp-1 group-hover:text-primary transition-colors">{lesson.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 min-h-[32px]">{lesson.description}</p>
              
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5 flex justify-between items-center">
                <button 
                  onClick={() => handleOpenModal(lesson)}
                  className="text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">edit</span> Editar
                </button>
                <button 
                  onClick={() => handleDelete(lesson.id)}
                  className="text-xs font-semibold text-red-500 hover:text-red-400 transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">delete</span>
                </button>
              </div>
            </div>
          </div>
        ))}
        {initialData.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl">
            <span className="material-symbols-outlined text-4xl text-gray-400 mb-2">bolt</span>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Sin temas</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Crea el primer tema de micro-aprendizaje.</p>
          </div>
        )}
      </div>

      <Sheet open={isModalOpen} onOpenChange={setIsModalOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md bg-white dark:bg-[#0B0F1A] border-gray-200 dark:border-white/5 p-0 flex flex-col h-full overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-white/5 shrink-0">
            <SheetTitle className="text-lg font-bold text-gray-900 dark:text-white">
              {editingLesson ? 'Editar Tema' : 'Nuevo Tema'}
            </SheetTitle>
          </div>
          
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <form id="microForm" onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Título</label>
                <input 
                  type="text" 
                  required
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-primary"
                  placeholder="Ej: Anatomía de Rodilla"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Categoría</label>
                <input 
                  type="text" 
                  required
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-primary"
                  placeholder="Ej: Miembro Superior"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Duración (min)</label>
                  <input 
                    type="number" 
                    min="1"
                    required
                    value={formData.duration_minutes}
                    onChange={e => setFormData({...formData, duration_minutes: Number(e.target.value)})}
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Estado</label>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.is_published}
                      onChange={e => setFormData({...formData, is_published: e.target.checked})}
                      className="rounded border-gray-300 text-primary focus:ring-primary bg-gray-50 dark:bg-white/5"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Publicado</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">URL Miniatura (Opcional)</label>
                <input 
                  type="text" 
                  value={formData.thumbnail_url}
                  onChange={e => setFormData({...formData, thumbnail_url: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-primary"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">URL Video o ID de Mux (Opcional)</label>
                <input 
                  type="text" 
                  value={formData.video_url}
                  onChange={e => setFormData({...formData, video_url: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-primary"
                  placeholder="Ej: 3e7XPFmef3AH1P5A8XUBu... o https://..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                <textarea 
                  rows={4}
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-primary resize-none"
                  placeholder="Escribe un breve resumen de lo que tratará la lección..."
                />
              </div>
            </form>
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-white/5 shrink-0 flex gap-3">
            <button 
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button 
              form="microForm"
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-primary hover:bg-cyan-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
            >
              {isSubmitting ? (
                <span className="material-symbols-outlined animate-spin">refresh</span>
              ) : (
                editingLesson ? 'Guardar Cambios' : 'Crear Tema'
              )}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
