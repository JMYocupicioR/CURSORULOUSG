"use client"

import { useState, useEffect } from "react"
import { AdminHeader } from "@/components/admin/AdminHeader"
import { UploadEngine } from "@/components/admin/UploadEngine"
import { QuizBuilder } from "@/components/admin/QuizBuilder"
import { createModule, updateModule, deleteModule, updateLesson, deleteLesson, reorderLessons } from "@/app/actions/contentSetup"
import { toast } from "sonner"
import { RichTextEditor } from "@/components/ui/RichTextEditor"
import MuxPlayer from "@mux/mux-player-react"
import { createBrowserClient } from '@supabase/ssr'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { SortableLessonItem } from "@/components/admin/SortableLessonItem"

type Lesson = {
  id: string
  title: string
  description?: string | null
  lesson_type: string
  thumbnail_url?: string | null
  materials?: Array<{title: string, url: string}> | null
  duration_minutes?: number | null
  difficulty?: string | null
  prerequisite_lesson_id?: string | null
  mux_asset_id?: string | null
  mux_playback_id?: string | null
  mux_upload_id?: string | null
  is_published: boolean
}

type Module = {
  id: string
  title: string
  description?: string
  thumbnail_url?: string | null
  prerequisite_module_id?: string | null
  lessons?: Lesson[]
}

function LessonIcon({ type }: { type: string }) {
  const icons: Record<string, { icon: string; color: string }> = {
    quiz: { icon: "quiz", color: "text-violet-400" },
    document: { icon: "description", color: "text-blue-400" },
    image: { icon: "image", color: "text-teal-400" },
    link: { icon: "link", color: "text-amber-400" },
    blog: { icon: "article", color: "text-rose-400" },
    audio: { icon: "headphones", color: "text-indigo-400" },
    infographic: { icon: "photo_library", color: "text-orange-400" },
    video: { icon: "play_circle", color: "text-primary" },
  }
  const cfg = icons[type] || icons.video
  return <span className={`material-symbols-outlined ${cfg.color} text-lg`}>{cfg.icon}</span>
}

function LessonStatus({ status }: { status: boolean }) {
  if (status) {
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">Publicado</span>
  }
  return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20">Borrador</span>
}

export function ContenidoClient({ modules }: { modules: Module[] }) {
  const [localModules, setLocalModules] = useState<Module[]>(modules)
  const [expandedModule, setExpandedModule] = useState<string | null>(modules[0]?.id || null)

  useEffect(() => {
    setLocalModules(modules)
  }, [modules])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent, moduleId: string) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const moduleIndex = localModules.findIndex(m => m.id === moduleId)
      if (moduleIndex === -1) return
      
      const targetModule = localModules[moduleIndex]
      const lessons = targetModule.lessons || []
      
      const oldIndex = lessons.findIndex((l) => l.id === active.id)
      const newIndex = lessons.findIndex((l) => l.id === over.id)
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newLessons = arrayMove(lessons, oldIndex, newIndex)
        
        // Optimistic UI update
        const newModules = [...localModules]
        newModules[moduleIndex] = { ...targetModule, lessons: newLessons }
        setLocalModules(newModules)
        
        // Backend update
        const lessonIds = newLessons.map(l => l.id)
        const res = await reorderLessons(lessonIds)
        if (!res?.success) {
          toast.error("Error al guardar el nuevo orden")
          setLocalModules(modules) // revert
        } else {
          toast.success("Orden actualizado")
        }
      }
    }
  }

  // Module Modal State
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false)
  const [editingModule, setEditingModule] = useState<{ id?: string, title: string, description: string, thumbnail_url: string, prerequisite_module_id: string | null } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingMaterial, setUploadingMaterial] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Link & Image Inline Creation State
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false)
  const [editingLink, setEditingLink] = useState<{ moduleId: string, title: string, url: string } | null>(null)
  const [isSubmittingLink, setIsSubmittingLink] = useState(false)

  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [editingImage, setEditingImage] = useState<{ moduleId: string, title: string, file: File | null } | null>(null)
  const [isSubmittingImage, setIsSubmittingImage] = useState(false)

  // Upload Engine (Video/Document) State
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [uploadType, setUploadType] = useState<"video" | "document">("video")
  const [uploadModuleId, setUploadModuleId] = useState("")
  const [uploadModuleLessons, setUploadModuleLessons] = useState<{ id: string; title: string }[]>([])

  // Blog Modal State
  const [isBlogModalOpen, setIsBlogModalOpen] = useState(false)
  const [editingBlog, setEditingBlog] = useState<{ moduleId: string, title: string, content: string } | null>(null)
  const [isSubmittingBlog, setIsSubmittingBlog] = useState(false)

  // Audio Modal State
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false)
  const [editingAudio, setEditingAudio] = useState<{ moduleId: string, title: string, file: File | null } | null>(null)
  const [isSubmittingAudio, setIsSubmittingAudio] = useState(false)

  // Infographic Modal State
  const [isInfographicModalOpen, setIsInfographicModalOpen] = useState(false)
  const [editingInfographic, setEditingInfographic] = useState<{ moduleId: string, title: string, files: File[] } | null>(null)
  const [isSubmittingInfographic, setIsSubmittingInfographic] = useState(false)

  const handleSaveLink = async () => {
    if (!editingLink || !editingLink.title.trim() || !editingLink.url.trim()) return
    setIsSubmittingLink(true)
    const { createLinkLesson } = await import('@/app/actions/contentSetup')
    const res = await createLinkLesson({ moduleId: editingLink.moduleId, title: editingLink.title, linkUrl: editingLink.url })
    setIsSubmittingLink(false)
    if (res?.success) {
      toast.success("Enlace añadido")
      setIsLinkModalOpen(false)
    } else {
      toast.error(res?.error || "Error al añadir enlace")
    }
  }

  const handleSaveImage = async () => {
    if (!editingImage || !editingImage.title.trim() || !editingImage.file) return
    setIsSubmittingImage(true)
    try {
      const fileExt = editingImage.file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `thumbnails/${fileName}`
      const { error: uploadError } = await supabase.storage.from('thumbnails').upload(filePath, editingImage.file)
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('thumbnails').getPublicUrl(filePath)
      const { createImageLesson } = await import('@/app/actions/contentSetup')
      const res = await createImageLesson({ moduleId: editingImage.moduleId, title: editingImage.title, imageUrl: data.publicUrl })
      if (res?.success) {
        toast.success("Imagen añadida")
        setIsImageModalOpen(false)
      } else {
        toast.error(res?.error || "Error al añadir imagen")
      }
    } catch (error) {
      toast.error('Error al subir imagen: ' + (error as Error).message)
    } finally {
      setIsSubmittingImage(false)
    }
  }

  const handleSaveBlog = async () => {
    if (!editingBlog || !editingBlog.title.trim() || !editingBlog.content.trim()) return
    setIsSubmittingBlog(true)
    const { createBlogLesson } = await import('@/app/actions/contentSetup')
    const res = await createBlogLesson({ moduleId: editingBlog.moduleId, title: editingBlog.title, content: editingBlog.content })
    setIsSubmittingBlog(false)
    if (res?.success) {
      toast.success("Entrada de blog añadida")
      setIsBlogModalOpen(false)
    } else {
      toast.error(res?.error || "Error al crear blog")
    }
  }

  const handleSaveAudio = async () => {
    if (!editingAudio || !editingAudio.title.trim() || !editingAudio.file) return
    setIsSubmittingAudio(true)
    try {
      const fileExt = editingAudio.file.name.split('.').pop()
      const fileName = `audio_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('docs').upload(fileName, editingAudio.file)
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('docs').getPublicUrl(fileName)
      const { createAudioLesson } = await import('@/app/actions/contentSetup')
      const res = await createAudioLesson({ moduleId: editingAudio.moduleId, title: editingAudio.title, audioUrl: data.publicUrl })
      if (res?.success) {
        toast.success("Audio añadido")
        setIsAudioModalOpen(false)
      } else {
        toast.error(res?.error || "Error al añadir audio")
      }
    } catch (error) {
      toast.error('Error al subir audio: ' + (error as Error).message)
    } finally {
      setIsSubmittingAudio(false)
    }
  }

  const handleSaveInfographic = async () => {
    if (!editingInfographic || !editingInfographic.title.trim() || editingInfographic.files.length === 0) return
    setIsSubmittingInfographic(true)
    try {
      const urls: string[] = []
      for (const file of editingInfographic.files) {
        const fileExt = file.name.split('.').pop()
        const fileName = `infographic_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${fileExt}`
        const { error: uploadError } = await supabase.storage.from('thumbnails').upload(`infographics/${fileName}`, file)
        if (uploadError) throw uploadError
        const { data } = supabase.storage.from('thumbnails').getPublicUrl(`infographics/${fileName}`)
        urls.push(data.publicUrl)
      }
      const { createInfographicLesson } = await import('@/app/actions/contentSetup')
      const res = await createInfographicLesson({ moduleId: editingInfographic.moduleId, title: editingInfographic.title, imageUrls: urls })
      if (res?.success) {
        toast.success("Infografía añadida")
        setIsInfographicModalOpen(false)
      } else {
        toast.error(res?.error || "Error al crear infografía")
      }
    } catch (error) {
      toast.error('Error al subir infografía: ' + (error as Error).message)
    } finally {
      setIsSubmittingInfographic(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'module' | 'lesson') => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `thumbnails/${fileName}`

      // Require a 'public' bucket named 'thumbnails'
      const { error: uploadError } = await supabase.storage
        .from('thumbnails') // Assuming this bucket exists
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('thumbnails').getPublicUrl(filePath)
      
      if (type === 'module' && editingModule) {
        setEditingModule({ ...editingModule, thumbnail_url: data.publicUrl })
      } else if (type === 'lesson' && editingLesson) {
         setEditingLesson({ ...editingLesson, thumbnail_url: data.publicUrl })
      }
    } catch (error) {
      toast.error('Error al subir imagen: ' + (error as Error).message)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleMaterialUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editingLesson) return

    setUploadingMaterial(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `material_${Math.random()}.${fileExt}`
      const filePath = `documents/${fileName}`

      // We'll use the specific bucket for materials/documents
      const { error: uploadError } = await supabase.storage
        .from('docs') 
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('docs').getPublicUrl(filePath)
      
      const currentMaterials = editingLesson.materials || []
      const newMaterial = { title: file.name, url: data.publicUrl }
      
      setEditingLesson({ ...editingLesson, materials: [...currentMaterials, newMaterial] })
      toast.success('Documento subido correctamente')
    } catch (error) {
       toast.error('Error al subir documento: ' + (error as Error).message)
    } finally {
      setUploadingMaterial(false)
    }
  }

  // Lesson Modal State
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState<{ id: string, title: string, lesson_type: string, is_published: boolean, thumbnail_url: string, description: string, materials: Array<{title: string, url: string}>, duration_minutes: number | null, difficulty: string | null, prerequisite_lesson_id: string | null, mux_playback_id: string | null, mux_upload_id: string | null } | null>(null)
  const [isSubmittingLesson, setIsSubmittingLesson] = useState(false)
  
  // Quiz Builder Modal State (Editing)
  const [editingQuizLessonId, setEditingQuizLessonId] = useState<string | null>(null)

  const handleOpenNewModule = () => {
    setEditingModule({ title: "", description: "", thumbnail_url: "", prerequisite_module_id: null })
    setIsModuleModalOpen(true)
  }

  const handleOpenEditModule = (e: React.MouseEvent, mod: Module) => {
    e.stopPropagation()
    setEditingModule({ id: mod.id, title: mod.title, description: mod.description || "", thumbnail_url: mod.thumbnail_url || "", prerequisite_module_id: mod.prerequisite_module_id || null })
    setIsModuleModalOpen(true)
  }

  const handleSaveModule = async () => {
    if (!editingModule || !editingModule.title.trim()) return
    setIsSubmitting(true)
    let res;
    if (editingModule.id) {
      res = await updateModule(editingModule.id, { title: editingModule.title, description: editingModule.description, thumbnail_url: editingModule.thumbnail_url, prerequisite_module_id: editingModule.prerequisite_module_id })
    } else {
      res = await createModule({ title: editingModule.title, description: editingModule.description, thumbnail_url: editingModule.thumbnail_url, prerequisite_module_id: editingModule.prerequisite_module_id })
    }
    setIsSubmitting(false)
    if (res?.success) {
      toast.success(editingModule.id ? "Módulo actualizado" : "Módulo creado")
      setIsModuleModalOpen(false)
    } else {
      toast.error(res?.error || "Error al guardar")
    }
  }

  const handleDeleteModule = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm("¿Seguro que deseas eliminar este módulo? Se perderán todas sus lecciones.")) return
    
    const res = await deleteModule(id)
    if (res?.success) {
      toast.success("Módulo eliminado")
    } else {
      toast.error(res?.error || "Error al eliminar")
    }
  }

  const handleOpenEditLesson = (e: React.MouseEvent, lesson: Lesson) => {
    e.stopPropagation()
    if (lesson.lesson_type === 'quiz') {
      setEditingQuizLessonId(lesson.id)
    } else {
      setEditingLesson({ id: lesson.id, title: lesson.title, lesson_type: lesson.lesson_type, is_published: lesson.is_published, thumbnail_url: lesson.thumbnail_url || "", description: lesson.description || "", materials: lesson.materials || [], duration_minutes: lesson.duration_minutes || null, difficulty: lesson.difficulty || null, prerequisite_lesson_id: lesson.prerequisite_lesson_id || null, mux_playback_id: lesson.mux_playback_id || null, mux_upload_id: lesson.mux_upload_id || null })
      setIsLessonModalOpen(true)
    }
  }

  const handleSaveLesson = async () => {
    if (!editingLesson || !editingLesson.title.trim()) return
    setIsSubmittingLesson(true)
    
    const res = await updateLesson(editingLesson.id, { 
      title: editingLesson.title, 
      description: editingLesson.description,
      thumbnail_url: editingLesson.thumbnail_url,
      materials: editingLesson.materials,
      is_published: editingLesson.is_published,
      duration_minutes: editingLesson.duration_minutes !== null ? editingLesson.duration_minutes : undefined,
      difficulty: editingLesson.difficulty !== null ? editingLesson.difficulty : undefined,
      prerequisite_lesson_id: editingLesson.prerequisite_lesson_id !== null ? editingLesson.prerequisite_lesson_id : undefined
    })
    
    setIsSubmittingLesson(false)
    if (res?.success) {
      toast.success("Lección actualizada")
      setIsLessonModalOpen(false)
    } else {
      toast.error(res?.error || "Error al actualizar")
    }
  }

  const handleDeleteLesson = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm("¿Seguro que deseas eliminar esta lección?")) return
    
    const res = await deleteLesson(id)
    if (res?.success) {
      toast.success("Lección eliminada")
    } else {
      toast.error(res?.error || "Error al eliminar")
    }
  }

  const totalModules = localModules.length
  const totalLessons = localModules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0)
  const totalQuizzes = localModules.reduce((acc, m) => acc + (m.lessons?.filter(l => l.lesson_type === 'quiz').length || 0), 0)

  const statsCards = [
    { label: "Módulos", value: totalModules.toString(), icon: "folder_open", color: "text-primary" },
    { label: "Lecciones", value: totalLessons.toString(), icon: "play_circle", color: "text-emerald-400" },
    { label: "Evaluaciones", value: totalQuizzes.toString(), icon: "quiz", color: "text-violet-400" },
  ]

  return (
    <div className="flex flex-col h-full">
      <AdminHeader title="Gestión de Contenido" subtitle="Administra los módulos, lecciones y evaluaciones del curso" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {statsCards.map((card) => (
            <div
              key={card.label}
              className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5 p-5 flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-white/10 dark:bg-white/5 flex items-center justify-center">
                <span className={`material-symbols-outlined text-2xl ${card.color}`}>{card.icon}</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{card.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Upload Engine Modal (controlled) */}
        <UploadEngine open={isUploadOpen} onOpenChange={setIsUploadOpen} uploadType={uploadType} moduleId={uploadModuleId} moduleLessons={uploadModuleLessons} />

        {/* Modules Accordion */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Estructura del Curso</h3>
            <button 
              onClick={handleOpenNewModule}
              className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary/90 transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">add</span>
              Nuevo Módulo
            </button>
          </div>

          {localModules.map((mod) => {
            const isExpanded = expandedModule === mod.id
            const lessonsCount = mod.lessons?.length || 0
            const publishedCount = mod.lessons?.filter(l => l.is_published).length || 0
            const progressPercent = lessonsCount > 0 ? Math.round((publishedCount / lessonsCount) * 100) : 0

            return (
              <div
                key={mod.id}
                className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden"
              >
                {/* Module Header */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setExpandedModule(isExpanded ? null : mod.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setExpandedModule(isExpanded ? null : mod.id) }}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left cursor-pointer"
                >
                  <span className={`material-symbols-outlined text-lg text-gray-400 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}>
                    chevron_right
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-xl">folder_open</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{mod.title}</p>
                    <p className="text-[11px] text-gray-400">
                      {publishedCount}/{lessonsCount} lecciones publicadas
                    </p>
                  </div>

                  {/* Edit/Delete Module Buttons */}
                  <div className="flex items-center gap-2 mr-4">
                    <button 
                      onClick={(e) => handleOpenEditModule(e, mod)}
                      className="text-gray-400 hover:text-primary transition-colors p-1"
                      title="Editar módulo"
                    >
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                    <button 
                      onClick={(e) => handleDeleteModule(e, mod.id)}
                      className="text-gray-400 hover:text-red-400 transition-colors p-1"
                      title="Eliminar módulo"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-medium text-gray-400">{progressPercent}%</span>
                  </div>
                </div>

                {/* Lessons */}
                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-black/10">
                    <div className="p-3">
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={(e) => handleDragEnd(e, mod.id)}
                      >
                        <SortableContext
                          items={mod.lessons?.map(l => l.id) || []}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-2">
                            {mod.lessons?.map((lesson) => (
                              <SortableLessonItem
                                key={lesson.id}
                                id={lesson.id}
                                lesson={lesson}
                                handleOpenEditLesson={handleOpenEditLesson}
                                handleDeleteLesson={handleDeleteLesson}
                                LessonIcon={LessonIcon}
                                LessonStatus={LessonStatus}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-black/20 border-t border-gray-200 dark:border-white/5 flex flex-col gap-3">
                       <div className="flex flex-wrap items-center gap-2 pt-2">
                         <span className="text-xs font-semibold text-gray-500 mr-2">Añadir:</span>
                         <button 
                           onClick={() => {
                             setUploadType("video")
                             setUploadModuleId(mod.id)
                             setUploadModuleLessons([])
                             setIsUploadOpen(true)
                           }}
                           className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1.5 border border-primary/20"
                         >
                           <span className="material-symbols-outlined text-sm">videocam</span> Video
                         </button>
                         <button 
                           onClick={() => {
                             setUploadType("document")
                             setUploadModuleId(mod.id)
                             setUploadModuleLessons((mod.lessons || []).map(l => ({ id: l.id, title: l.title })))
                             setIsUploadOpen(true)
                           }}
                           className="px-3 py-1.5 bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-500/20 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1.5 border border-violet-500/20"
                         >
                           <span className="material-symbols-outlined text-sm">description</span> Documento
                         </button>
                         <button 
                           onClick={() => {
                             setEditingLink({ moduleId: mod.id, title: "", url: "" })
                             setIsLinkModalOpen(true)
                           }}
                           className="px-3 py-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1.5 border border-amber-500/20"
                         >
                           <span className="material-symbols-outlined text-sm">link</span> Enlace
                         </button>
                         <button 
                           onClick={() => {
                             setEditingImage({ moduleId: mod.id, title: "", file: null })
                             setIsImageModalOpen(true)
                           }}
                           className="px-3 py-1.5 bg-teal-500/10 text-teal-600 dark:text-teal-400 hover:bg-teal-500/20 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1.5 border border-teal-500/20"
                         >
                           <span className="material-symbols-outlined text-sm">image</span> Imagen
                         </button>
                         <button 
                           onClick={() => {
                             setEditingBlog({ moduleId: mod.id, title: "", content: "" })
                             setIsBlogModalOpen(true)
                           }}
                           className="px-3 py-1.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1.5 border border-rose-500/20"
                         >
                           <span className="material-symbols-outlined text-sm">article</span> Blog
                         </button>
                         <button 
                           onClick={() => {
                             setEditingInfographic({ moduleId: mod.id, title: "", files: [] })
                             setIsInfographicModalOpen(true)
                           }}
                           className="px-3 py-1.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1.5 border border-orange-500/20"
                         >
                           <span className="material-symbols-outlined text-sm">photo_library</span> Infografía
                         </button>
                         <button 
                           onClick={() => {
                             setEditingAudio({ moduleId: mod.id, title: "", file: null })
                             setIsAudioModalOpen(true)
                           }}
                           className="px-3 py-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1.5 border border-indigo-500/20"
                         >
                           <span className="material-symbols-outlined text-sm">headphones</span> Audio
                         </button>
                         <QuizBuilder modules={[mod]} compact />
                       </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Module Modal */}
      {isModuleModalOpen && editingModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-800 shadow-2xl">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                {editingModule.id ? "Editar Módulo" : "Nuevo Módulo"}
              </h2>
              <div className="space-y-4">
                {editingModule.thumbnail_url && (
                  <div className="mb-4">
                     {/* eslint-disable-next-line @next/next/no-img-element */}
                     <img src={editingModule.thumbnail_url} alt="Portada Módulo" className="w-full h-32 object-cover rounded-xl" />
                  </div>
                )}
                <div className="flex items-center gap-3">
                   <label className="bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2">
                     <span className="material-symbols-outlined text-lg">image</span>
                     {uploadingImage ? 'Subiendo...' : (editingModule.thumbnail_url ? 'Cambiar Portada' : 'Añadir Portada')}
                     <input type="file" accept="image/*" className="hidden" disabled={uploadingImage} onChange={(e) => handleImageUpload(e, 'module')} />
                   </label>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Título del Módulo</label>
                  <input
                    type="text"
                    value={editingModule.title}
                    onChange={(e) => setEditingModule({ ...editingModule, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900 dark:text-white placeholder-gray-400"
                    placeholder="Ej. Introducción a USG"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Descripción (opcional)</label>
                  <RichTextEditor
                    content={editingModule.description}
                    onChange={(content) => setEditingModule({ ...editingModule, description: content })}
                    placeholder="Escribe una descripción enriquecida del módulo..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Módulo Prerrequisito (opcional)</label>
                  <select
                    value={editingModule.prerequisite_module_id || ""}
                    onChange={(e) => setEditingModule({ ...editingModule, prerequisite_module_id: e.target.value || null })}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900 dark:text-white"
                  >
                    <option value="">Ninguno</option>
                    {localModules.filter(m => m.id !== editingModule.id).map(m => (
                      <option key={m.id} value={m.id}>{m.title}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModuleModalOpen(false)}
                className="px-6 py-2.5 rounded-xl font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveModule}
                disabled={isSubmitting || !editingModule.title.trim()}
                className="px-6 py-2.5 bg-primary hover:bg-cyan-500 text-white rounded-xl font-semibold shadow-lg shadow-primary/25 transition-all disabled:opacity-50"
              >
                {isSubmitting ? "Guardando..." : "Guardar Módulo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link Modal */}
      {isLinkModalOpen && editingLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-800 shadow-2xl">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500">link</span>
                Añadir Enlace
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Título del Enlace</label>
                  <input
                    type="text"
                    value={editingLink.title}
                    onChange={(e) => setEditingLink({ ...editingLink, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-gray-900 dark:text-white"
                    placeholder="Ej. Artículo Científico de Referencia"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">URL (https://...)</label>
                  <input
                    type="url"
                    value={editingLink.url}
                    onChange={(e) => setEditingLink({ ...editingLink, url: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-gray-900 dark:text-white"
                    placeholder="https://ejemplo.com/articulo"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(false)}
                className="px-6 py-2.5 rounded-xl font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                disabled={isSubmittingLink}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveLink}
                disabled={isSubmittingLink || !editingLink.title.trim() || !editingLink.url.trim()}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-white rounded-xl font-semibold shadow-lg shadow-amber-500/25 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmittingLink ? "Guardando..." : "Guardar Enlace"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {isImageModalOpen && editingImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-800 shadow-2xl">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-teal-500">image</span>
                Añadir Imagen
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Título de la Imagen</label>
                  <input
                    type="text"
                    value={editingImage.title}
                    onChange={(e) => setEditingImage({ ...editingImage, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500/50 text-gray-900 dark:text-white"
                    placeholder="Ej. Esquema del Plexo Braquial"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Archivo de Imagen</label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl cursor-pointer bg-gray-50 dark:bg-black/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <span className="material-symbols-outlined text-3xl text-gray-400 mb-2">cloud_upload</span>
                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">{editingImage.file ? editingImage.file.name : 'Haz click para subir'}</span>
                      </p>
                      {!editingImage.file && <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG o GIF</p>}
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files && setEditingImage({ ...editingImage, file: e.target.files[0] })} />
                  </label>
                </div>
              </div>
            </div>
            <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsImageModalOpen(false)}
                className="px-6 py-2.5 rounded-xl font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                disabled={isSubmittingImage}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveImage}
                disabled={isSubmittingImage || !editingImage.title.trim() || !editingImage.file}
                className="px-6 py-2.5 bg-teal-500 hover:bg-teal-400 text-white rounded-xl font-semibold shadow-lg shadow-teal-500/25 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmittingImage ? "Guardando..." : "Subir Imagen"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lesson Modal (Upgraded to Full Screen Sheet) */}
      <Sheet open={isLessonModalOpen} onOpenChange={setIsLessonModalOpen}>
        <SheetContent 
          side="right" 
          showCloseButton={false}
          className="p-0 w-screen h-screen border-none shadow-none overflow-hidden flex flex-col sm:max-w-none bg-white dark:bg-[#0B0F1A] gap-0"
        >
          <SheetHeader className="p-6 border-b border-white/5 shrink-0 flex flex-row items-center justify-between bg-white dark:bg-[#0B0F1A] z-10">
            <SheetTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-2xl">edit_note</span>
              </div>
              Editar Lección
            </SheetTitle>
            <button 
              onClick={() => setIsLessonModalOpen(false)}
              className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors group"
            >
              <span className="material-symbols-outlined text-gray-400 group-hover:text-white transition-colors">close</span>
            </button>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto min-h-0 bg-gray-50/30 dark:bg-black/20">
            {editingLesson && (
              <div className="max-w-4xl mx-auto p-6 md:p-12 space-y-12">
                {/* Visual Section: Media */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-teal-400 text-sm">image</span>
                    <h3 className="text-xs font-bold text-teal-400 uppercase tracking-wider">Multimedia</h3>
                  </div>
                  
                  {editingLesson.thumbnail_url && (
                    <div className="relative group rounded-2xl overflow-hidden border border-white/5 aspect-video bg-black/40">
                       {/* eslint-disable-next-line @next/next/no-img-element */}
                       <img src={editingLesson.thumbnail_url} alt="Portada Lección" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                       <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                         <p className="text-[10px] text-white/80">Vista previa de la portada</p>
                       </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3">
                     <label className="flex-1 bg-white/5 dark:bg-white/5 hover:bg-white/10 dark:hover:bg-white/10 cursor-pointer p-4 rounded-2xl border border-dashed border-white/10 transition-all flex flex-col items-center justify-center gap-2 text-center group">
                       <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-primary text-xl">image</span>
                       </div>
                       <div>
                         <p className="text-sm font-semibold text-gray-900 dark:text-white">
                           {uploadingImage ? 'Subiendo...' : (editingLesson.thumbnail_url ? 'Cambiar Portada' : 'Añadir Portada')}
                         </p>
                         <p className="text-[10px] text-gray-400">Recomendado: 1280x720px</p>
                       </div>
                       <input type="file" accept="image/*" className="hidden" disabled={uploadingImage} onChange={(e) => handleImageUpload(e, 'lesson')} />
                     </label>
                  </div>
                </section>

                {/* Visual Section: Info */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-primary text-sm">info</span>
                    <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Información General</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="group">
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 ml-1 uppercase">Título de la Lección</label>
                      <input
                        type="text"
                        value={editingLesson.title}
                        onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })}
                        className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all text-gray-900 dark:text-white font-medium"
                        placeholder="Ej. Anatomía Muscular de Miembro Superior"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="group">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 ml-1 uppercase">Duración</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            value={editingLesson.duration_minutes || ""}
                            onChange={(e) => setEditingLesson({ ...editingLesson, duration_minutes: e.target.value ? parseInt(e.target.value) : null })}
                            className="w-full pl-5 pr-12 py-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 focus:border-primary/50 transition-all text-gray-900 dark:text-white font-medium"
                            placeholder="15"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 uppercase">Min</span>
                        </div>
                      </div>
                      <div className="group">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 ml-1 uppercase">Dificultad</label>
                        <select
                          value={editingLesson.difficulty || ""}
                          onChange={(e) => setEditingLesson({ ...editingLesson, difficulty: e.target.value || null })}
                          className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 focus:border-primary/50 transition-all text-gray-900 dark:text-white font-medium appearance-none cursor-pointer"
                        >
                          <option value="">Seleccionar...</option>
                          <option value="Principiante">Principiante</option>
                          <option value="Intermedio">Intermedio</option>
                          <option value="Avanzado">Avanzado</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 ml-1 uppercase">Lección Prerrequisito</label>
                      <select
                        value={editingLesson.prerequisite_lesson_id || ""}
                        onChange={(e) => setEditingLesson({ ...editingLesson, prerequisite_lesson_id: e.target.value || null })}
                        className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 focus:border-primary/50 transition-all text-gray-900 dark:text-white font-medium appearance-none cursor-pointer"
                      >
                        <option value="">Ninguna</option>
                        {localModules.flatMap(m => m.lessons || []).filter(l => l.id !== editingLesson.id).map(l => (
                          <option key={l.id} value={l.id}>{l.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </section>

                {editingLesson.lesson_type !== 'quiz' ? (
                  <>
                    <section className="space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-amber-400 text-sm">description</span>
                        <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Descripción Detallada</h3>
                      </div>
                      <div className="rounded-2xl overflow-hidden border border-white/5 bg-white/5">
                        <RichTextEditor
                          content={editingLesson.description}
                          onChange={(content) => setEditingLesson({ ...editingLesson, description: content })}
                          placeholder="Información adicional relevante para el alumno..."
                        />
                      </div>
                    </section>

                    {editingLesson.lesson_type === 'link' && (
                       <section className="space-y-4">
                         <div className="flex items-center gap-2 mb-2">
                           <span className="material-symbols-outlined text-amber-400 text-sm">link</span>
                           <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Configuración del Enlace</h3>
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 ml-1 uppercase">URL Destino</label>
                            <input
                              type="url"
                              value={editingLesson.materials?.[0]?.url || ""}
                              onChange={(e) => {
                                 const url = e.target.value;
                                 setEditingLesson({
                                   ...editingLesson,
                                   materials: [{ title: editingLesson.materials?.[0]?.title || editingLesson.title, url }]
                                 })
                              }}
                              className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all text-gray-900 dark:text-white font-medium"
                              placeholder="https://ejemplo.com"
                            />
                         </div>
                       </section>
                    )}

                    <section className="space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-purple-400 text-sm">movie_filter</span>
                        <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider">Video de la Lección</h3>
                      </div>
                      
                      {editingLesson.lesson_type === 'video' ? (
                        editingLesson.mux_playback_id ? (
                           <div className="bg-black rounded-2xl overflow-hidden aspect-video relative shadow-2xl border border-white/5">
                             <MuxPlayer
                                streamType="on-demand"
                                playbackId={editingLesson.mux_playback_id}
                                metadata={{
                                  video_id: editingLesson.id,
                                  video_title: editingLesson.title,
                                }}
                                primaryColor="#2DD4BF"
                             />
                           </div>
                        ) : (
                           <div className="w-full h-40 bg-white/5 dark:bg-white/2 rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center gap-4 text-center px-6">
                              {editingLesson.mux_upload_id ? (
                                <>
                                  <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-amber-500 animate-spin text-2xl">sync</span>
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Procesando Video...</p>
                                    <p className="text-[10px] text-gray-500 mt-1">Mux está preparando tu contenido. Se actualizará solo en breve.</p>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-gray-500 text-2xl">no_video</span>
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-gray-500">Sin video cargado</p>
                                    <p className="text-[10px] text-gray-400 mt-1">Usa la sección principal para cargar un nuevo video.</p>
                                  </div>
                                </>
                              )}
                           </div>
                        )
                      ) : null }
                    </section>

                    <section className="space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-blue-400 text-sm">attachment</span>
                          <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">Recursos</h3>
                        </div>
                        <label className="text-[10px] uppercase font-bold bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white px-3 py-2 rounded-xl cursor-pointer transition-all flex items-center gap-2 border border-white/5">
                          <span className="material-symbols-outlined text-[14px]">add</span>
                          <span>{uploadingMaterial ? 'Subiendo...' : 'Documento'}</span>
                          <input type="file" className="hidden" disabled={uploadingMaterial} onChange={handleMaterialUpload} />
                        </label>
                      </div>
                      
                      {(!editingLesson.materials || editingLesson.materials.length === 0) ? (
                        <div className="text-[11px] text-gray-500 py-6 text-center border border-dashed border-white/5 rounded-2xl bg-white/2">
                          No hay documentos o PDFs adjuntos.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {editingLesson.materials.map((mat, idx) => (
                            <div key={idx} className="group flex justify-between items-center bg-white/5 hover:bg-white/10 border border-white/5 p-3 rounded-2xl transition-all">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                  <span className="material-symbols-outlined text-blue-400 text-base">description</span>
                                </div>
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate max-w-[180px]">{mat.title}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const newMats = [...editingLesson.materials];
                                  newMats.splice(idx, 1);
                                  setEditingLesson({...editingLesson, materials: newMats});
                                }}
                                className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                                title="Eliminar recurso"
                              >
                                <span className="material-symbols-outlined text-base">delete</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  </>
                ) : (
                  <section className="bg-linear-to-br from-violet-500/10 to-blue-500/5 p-6 rounded-3xl border border-violet-500/10">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-violet-500/20 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-violet-400 text-2xl">quiz</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white">Lección de Evaluación</h4>
                        <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                          Este contenido se autogestiona. Las preguntas, opciones y lógica de puntaje deben configurarse desde el <span className="text-violet-400 font-bold">Constructor de Evaluaciones</span> incorporado.
                        </p>
                      </div>
                    </div>
                  </section>
                )}
                
                <section className="bg-[#141829] p-6 rounded-3xl border border-white/5 mt-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">Estado de Publicación</p>
                      <p className="text-[10px] text-gray-400 mt-1">¿Visible para los estudiantes?</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={editingLesson.is_published}
                        onChange={(e) => setEditingLesson({ ...editingLesson, is_published: e.target.checked })}
                      />
                      <div className="w-12 h-6.5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5.5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner"></div>
                    </label>
                  </div>
                </section>

                {/* Extra space for scrolling */}
                <div className="h-4" />
              </div>
            )}
          </div>

          <SheetFooter className="p-6 border-t border-white/5 bg-white dark:bg-[#0B0F1A] shrink-0 z-10 shadow-[0_-10px_20px_rgba(0,0,0,0.1)]">
            <div className="max-w-4xl mx-auto w-full flex sm:flex-row flex-col gap-3">
              <button
                type="button"
                onClick={() => setIsLessonModalOpen(false)}
                className="flex-1 px-6 py-3.5 rounded-2xl font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/5 transition-all text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveLesson}
                disabled={isSubmittingLesson || !editingLesson?.title.trim()}
                className="flex-1 px-6 py-3.5 bg-linear-to-r from-primary to-cyan-400 hover:from-cyan-400 hover:to-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 transition-all disabled:opacity-50 disabled:grayscale text-sm"
              >
                {isSubmittingLesson ? "Guardando..." : "Guardar Lección"}
              </button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Quiz Builder for Editing */}
      {editingQuizLessonId && (
        <QuizBuilder 
          modules={localModules} 
          editLessonId={editingQuizLessonId} 
          onCloseEdit={() => setEditingQuizLessonId(null)} 
        />
      )}

      {/* Blog Modal */}
      {isBlogModalOpen && editingBlog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 shrink-0">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-rose-500">article</span>
                Crear Entrada de Blog
              </h2>
              <p className="text-xs text-gray-400">Crea contenido de texto enriquecido como en un editor de Word.</p>
            </div>
            <div className="flex-1 overflow-y-auto px-6 pb-2 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Título</label>
                <input
                  type="text"
                  value={editingBlog.title}
                  onChange={(e) => setEditingBlog({ ...editingBlog, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-rose-500/50 text-gray-900 dark:text-white"
                  placeholder="Ej. Guía Completa de Anatomía del Hombro"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Contenido</label>
                <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 min-h-[250px]">
                  <RichTextEditor
                    content={editingBlog.content}
                    onChange={(content) => setEditingBlog({ ...editingBlog, content })}
                    placeholder="Escribe tu artículo aquí con texto enriquecido..."
                  />
                </div>
              </div>
            </div>
            <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 shrink-0">
              <button type="button" onClick={() => setIsBlogModalOpen(false)} disabled={isSubmittingBlog}
                className="px-6 py-2.5 rounded-xl font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Cancelar</button>
              <button type="button" onClick={handleSaveBlog} disabled={isSubmittingBlog || !editingBlog.title.trim() || !editingBlog.content.trim()}
                className="px-6 py-2.5 bg-rose-500 hover:bg-rose-400 text-white rounded-xl font-semibold shadow-lg shadow-rose-500/25 transition-all disabled:opacity-50">
                {isSubmittingBlog ? "Guardando..." : "Publicar Blog"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audio Modal */}
      {isAudioModalOpen && editingAudio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-800 shadow-2xl">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-500">headphones</span>
                Añadir Audio
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Título</label>
                  <input type="text" value={editingAudio.title} onChange={(e) => setEditingAudio({ ...editingAudio, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-gray-900 dark:text-white"
                    placeholder="Ej. Podcast - Introducción a USG" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Archivo de Audio</label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl cursor-pointer bg-gray-50 dark:bg-black/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <span className="material-symbols-outlined text-3xl text-gray-400 mb-2">audio_file</span>
                      <p className="text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">{editingAudio.file ? editingAudio.file.name : 'Haz click para subir'}</span></p>
                      {!editingAudio.file && <p className="text-xs text-gray-500 dark:text-gray-400">MP3, WAV, OGG</p>}
                    </div>
                    <input type="file" className="hidden" accept="audio/*" onChange={(e) => e.target.files && setEditingAudio({ ...editingAudio, file: e.target.files[0] })} />
                  </label>
                </div>
              </div>
            </div>
            <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
              <button type="button" onClick={() => setIsAudioModalOpen(false)} disabled={isSubmittingAudio}
                className="px-6 py-2.5 rounded-xl font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Cancelar</button>
              <button type="button" onClick={handleSaveAudio} disabled={isSubmittingAudio || !editingAudio.title.trim() || !editingAudio.file}
                className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50">
                {isSubmittingAudio ? "Subiendo..." : "Subir Audio"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Infographic Modal */}
      {isInfographicModalOpen && editingInfographic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-800 shadow-2xl">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-orange-500">photo_library</span>
                Añadir Infografía
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Título</label>
                  <input type="text" value={editingInfographic.title} onChange={(e) => setEditingInfographic({ ...editingInfographic, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-gray-900 dark:text-white"
                    placeholder="Ej. Anatomía del Plexo Braquial" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Imágenes (múltiples)</label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl cursor-pointer bg-gray-50 dark:bg-black/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <span className="material-symbols-outlined text-3xl text-gray-400 mb-2">add_photo_alternate</span>
                      <p className="text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">{editingInfographic.files.length > 0 ? `${editingInfographic.files.length} archivos seleccionados` : 'Selecciona imágenes'}</span></p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, WebP • Múltiples archivos</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" multiple onChange={(e) => {
                      if (e.target.files) setEditingInfographic({ ...editingInfographic, files: [...editingInfographic.files, ...Array.from(e.target.files)] })
                    }} />
                  </label>
                  {editingInfographic.files.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {editingInfographic.files.map((f, i) => (
                        <span key={i} className="text-[10px] bg-orange-500/10 text-orange-400 px-2 py-1 rounded-lg flex items-center gap-1">
                          {f.name}
                          <button type="button" onClick={() => setEditingInfographic({ ...editingInfographic, files: editingInfographic.files.filter((_, idx) => idx !== i) })} className="hover:text-red-400">
                            <span className="material-symbols-outlined text-[12px]">close</span>
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
              <button type="button" onClick={() => setIsInfographicModalOpen(false)} disabled={isSubmittingInfographic}
                className="px-6 py-2.5 rounded-xl font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Cancelar</button>
              <button type="button" onClick={handleSaveInfographic} disabled={isSubmittingInfographic || !editingInfographic.title.trim() || editingInfographic.files.length === 0}
                className="px-6 py-2.5 bg-orange-500 hover:bg-orange-400 text-white rounded-xl font-semibold shadow-lg shadow-orange-500/25 transition-all disabled:opacity-50">
                {isSubmittingInfographic ? "Subiendo..." : "Subir Infografía"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
