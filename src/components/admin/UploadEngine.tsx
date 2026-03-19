"use client"

import { useState } from "react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { addDocumentToLesson } from '@/app/actions/contentSetup'
import * as UpChunk from '@mux/upchunk'
import { createMuxDirectUpload } from '@/app/actions/contentSetup'

type UploadType = "video" | "document"

interface UploadEngineProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  uploadType: UploadType
  moduleId: string
  moduleLessons?: { id: string; title: string }[]
}

export function UploadEngine({ open, onOpenChange, uploadType, moduleId, moduleLessons = [] }: UploadEngineProps) {
  const [selectedLesson, setSelectedLesson] = useState("")
  const [title, setTitle] = useState("")
  const [isMasterCamera, setIsMasterCamera] = useState(true)
  const [file, setFile] = useState<File | null>(null)
  
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const closeModal = () => {
    setFile(null)
    setTitle("")
    setSelectedLesson("")
    setUploadProgress(0)
    onOpenChange(false)
  }

  const doUpload = async () => {
    if (!file) return toast.error("No hay archivo seleccionado")
    if (uploadType === "video" && !title) return toast.error("Faltan campos requeridos")
    if (uploadType === "document" && (!selectedLesson || !title)) return toast.error("Faltan campos requeridos")

    setIsUploading(true)
    const supabase = createClient()
    
    if (uploadType === "video") {
      try {
        const { success, uploadUrl, error: muxError } = await createMuxDirectUpload(moduleId, title)
        if (!success || !uploadUrl) {
          setIsUploading(false)
          return toast.error("Error pidiendo url a Mux: " + muxError)
        }

        const upload = UpChunk.createUpload({
          endpoint: uploadUrl,
          file,
          chunkSize: 5120,
        })

        upload.on('error', err => {
          console.error('Mux UpChunk error:', err.detail)
          setIsUploading(false)
          toast.error("Error transfiriendo a Mux. Reintenta.")
        })

        upload.on('progress', (evt) => {
          setUploadProgress(Math.round(evt.detail as number))
        })

        upload.on('success', () => {
          setIsUploading(false)
          toast.success("El archivo se subió a Mux. Pronto estará disponible tras ser procesado.")
          closeModal()
        })
      } catch (err: unknown) {
        setIsUploading(false)
        console.error(err)
        toast.error("Error configurando Mux Upload.")
      }
    } else {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
      const bucket = "docs"
      
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, { upsert: false })

      if (uploadError) {
        setIsUploading(false)
        return toast.error("Error subiendo el archivo: " + uploadError.message)
      }

      const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(fileName)
      const fileUrl = publicUrlData.publicUrl

      const res = await addDocumentToLesson({
        lessonId: selectedLesson,
        documentTitle: title,
        documentUrl: fileUrl
      })

      setIsUploading(false)
      if (!res.success) {
        toast.error("Error al guardar documento: " + res.error)
      } else {
        toast.success("Documento añadido a la lección")
        closeModal()
      }
    }
    
    setIsUploading(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6 border border-gray-200 dark:border-white/10 shadow-xl">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">
            {uploadType === "video" ? "videocam" : "description"}
          </span>
          Subir {uploadType === "video" ? "Video" : "Documento"}
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Archivo</label>
            <div className="border border-gray-200 dark:border-white/10 rounded-lg p-3 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-black/20">
              {file ? file.name : (
                <input 
                  type="file" 
                  accept={uploadType === "video" ? "video/*" : ".pdf,.doc,.docx,.ppt,.pptx"}
                  onChange={(e) => e.target.files && setFile(e.target.files[0])}
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Título</label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              className="w-full bg-transparent border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:text-white"
              placeholder="Ej: Anatomía de Hombro"
            />
          </div>

          {uploadType === "video" ? (
            <div className="flex flex-col gap-2 mt-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer text-gray-700 dark:text-gray-300">
                <input 
                  type="radio" 
                  checked={isMasterCamera} 
                  onChange={() => setIsMasterCamera(true)}
                  className="text-primary accent-primary"
                />
                Este es el Master (Cámara Principal)
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer text-gray-700 dark:text-gray-300">
                <input 
                  type="radio" 
                  checked={!isMasterCamera} 
                  onChange={() => setIsMasterCamera(false)}
                  className="text-primary accent-primary"
                />
                Este es el video de Ecógrafo (Dual)
              </label>
            </div>
          ) : (
            <>
              {moduleLessons.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Lección</label>
                  <select 
                    value={selectedLesson} 
                    onChange={(e) => setSelectedLesson(e.target.value)}
                    className="w-full bg-transparent border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:text-white"
                  >
                    <option value="" disabled className="dark:bg-gray-900">Asignar a una lección...</option>
                    {moduleLessons.map(l => (
                      <option key={l.id} value={l.id} className="dark:bg-gray-900">{l.title}</option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}
        </div>

        <div className="mt-6 flex gap-3 justify-end">
          <button 
            onClick={closeModal} 
            disabled={isUploading}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={doUpload}
            disabled={isUploading}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary/90 flex items-center gap-2 transition-colors disabled:opacity-50 relative overflow-hidden min-w-[140px]"
          >
            {isUploading && uploadProgress > 0 && (
              <div 
                className="absolute inset-0 bg-white/20 transition-all duration-300 ease-out" 
                style={{ width: `${uploadProgress}%` }} 
              />
            )}
            <span className="relative flex items-center gap-2">
              {isUploading ? (
                <><span className="material-symbols-outlined shrink-0 animate-spin text-sm">progress_activity</span> {uploadProgress > 0 ? `${uploadProgress}%` : 'Preparando...'}</>
              ) : (
                <><span className="material-symbols-outlined shrink-0 text-sm">upload</span> Subir Archivo</>
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
