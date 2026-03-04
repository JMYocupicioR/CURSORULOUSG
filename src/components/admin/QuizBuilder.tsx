"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { createQuiz, getQuizByLessonId, updateQuiz } from "@/app/actions/contentSetup"
import { useForm, useFieldArray, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { createClient } from "@/lib/supabase/client"

interface Module {
  id: string
  title: string
  lessons?: { id: string; title: string, lesson_type: string }[]
}

const optionSchema = z.object({
  id: z.string(),
  text: z.string().min(1, "El texto de la opción no puede estar vacío"),
  feedback_clinical: z.string().optional()
})

const findingSchema = z.object({
  type: z.string().default('text'),
  label: z.string().min(1, "La etiqueta es requerida"),
  value: z.string().min(1, "El valor es requerido")
})

const questionSchema = z.object({
  id: z.string(),
  questionText: z.string().min(5, "La pregunta debe tener al menos 5 caracteres"),
  difficulty: z.coerce.number().min(1).max(5).default(1),
  is_critical: z.boolean().default(false),
  pearl: z.string().optional(),
  source_reference: z.string().optional(),
  findings: z.array(findingSchema).optional(),
  options: z.array(optionSchema).min(2, "Se requieren al menos 2 opciones"),
  correctOptionId: z.string().min(1, "Debes seleccionar una opción correcta"),
  score: z.coerce.number().default(1),
  imageFile: z.any().optional(), // For internal form state
  imagePreview: z.string().optional()
})

const quizSchema = z.object({
  selectedModule: z.string().min(1, "Debes seleccionar un módulo"),
  selectedLesson: z.string().min(1, "Debes seleccionar una lección"),
  quizTitle: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  minScore: z.coerce.number().min(1).max(100),
  questions: z.array(questionSchema).min(1, "Debe haber al menos 1 pregunta")
})

type QuizFormValues = z.infer<typeof quizSchema>

export function QuizBuilder({ 
  modules = [],
  editLessonId,
  onCloseEdit
}: { 
  modules: Module[]
  editLessonId?: string
  onCloseEdit?: () => void
}) {
  const [isOpen, setIsOpen] = useState(!!editLessonId)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null)
  const supabase = createClient()

  const defaultQuizValues: Partial<QuizFormValues> = {
    selectedModule: "",
    selectedLesson: "",
    quizTitle: "",
    minScore: 80,
    questions: [{
      id: `temp-${Date.now()}`,
      questionText: "",
      difficulty: 1,
      is_critical: false,
      pearl: "",
      source_reference: "",
      findings: [],
      options: [
        { id: "A", text: "", feedback_clinical: "" },
        { id: "B", text: "", feedback_clinical: "" },
        { id: "C", text: "", feedback_clinical: "" },
        { id: "D", text: "", feedback_clinical: "" }
      ],
      correctOptionId: "A",
      score: 1,
      imageFile: undefined,
      imagePreview: undefined
    }]
  }

  const methods = useForm<QuizFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(quizSchema) as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    defaultValues: defaultQuizValues as any
  })

  // Explicitly import and use SubmitHandler if needed, though react-hook-form handles it if the form type matches.
  const { register, control, handleSubmit, watch, setValue, reset, formState: { errors } } = methods


  const { fields: questionFields, append: appendQuestion, remove: removeQuestion } = useFieldArray({
    control,
    name: "questions"
  })

  const selectedModule = watch("selectedModule")
  const activeModule = modules.find(m => m.id === selectedModule)

  useEffect(() => {
    if (editLessonId) {
      setIsOpen(true)
      const fetchQuiz = async () => {
        const res = await getQuizByLessonId(editLessonId)
        if (res.success && res.data) {
           const dbQuiz = res.data;
           setEditingQuizId(dbQuiz.id)
           
           // eslint-disable-next-line @typescript-eslint/no-explicit-any
           const mappedQuestions = dbQuiz.questions?.map((q: any) => ({
             id: q.id,
             questionText: q.question_text,
             difficulty: q.difficulty || 1,
             is_critical: q.is_critical || false,
             pearl: q.pearl || "",
             source_reference: q.source_reference || "",
             findings: q.findings || [],
             options: q.options || [],
             correctOptionId: q.correct_option_id,
             score: q.score || 1,
             imagePreview: q.image_url || undefined
           })) || defaultQuizValues.questions;

           let parentModuleId = "";
           modules.forEach(m => {
             if (m.lessons?.some(l => l.id === editLessonId)) {
               parentModuleId = m.id;
             }
           });

           reset({
             selectedModule: parentModuleId,
             selectedLesson: editLessonId,
             quizTitle: dbQuiz.title,
             minScore: dbQuiz.min_score_to_pass || 80,
             questions: mappedQuestions
           })
        }
      }
      fetchQuiz()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editLessonId, modules])

  const handleClose = () => {
    setIsOpen(false)
    if (onCloseEdit) onCloseEdit()
    if (!editLessonId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      reset(defaultQuizValues as any)
    }
  }

  const processForm = async (data: QuizFormValues) => {
    setIsSubmitting(true)
    
    try {
      // 1. Upload Images if any
      const questionsToPersist = await Promise.all(data.questions.map(async (q) => {
        let imageUrl = null;
        
        if (q.imageFile instanceof File) {
          const fileExt = q.imageFile.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('question_images')
            .upload(fileName, q.imageFile);

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('question_images')
              .getPublicUrl(fileName);
            imageUrl = publicUrl;
          } else {
            console.error("Image upload error:", uploadError);
            toast.error(`Error subiendo imagen para la pregunta: ${q.questionText}`);
          }
        }

        return {
          questionText: q.questionText,
          options: q.options,
          correctOptionId: q.correctOptionId,
          score: q.score,
          difficulty: q.difficulty,
          is_critical: q.is_critical,
          pearl: q.pearl,
          source_reference: q.source_reference,
          image_url: imageUrl || q.imagePreview,
          findings: q.findings || []
        }
      }))

      let result;
      if (editLessonId && editingQuizId) {
        result = await updateQuiz({
          quizId: editingQuizId,
          title: data.quizTitle,
          minScore: data.minScore,
          questions: questionsToPersist
        })
      } else {
        result = await createQuiz({
          lessonId: data.selectedLesson,
          title: data.quizTitle,
          minScore: data.minScore,
          questions: questionsToPersist
        })
      }
      
      if (result?.success) {
        toast.success(editLessonId ? "Evaluación actualizada exitosamente" : "Evaluación guardada exitosamente")
        handleClose()
      } else {
        toast.error(result?.error || "Error al guardar la evaluación")
      }
    } catch (error) {
       console.error(error)
       toast.error("Ocurrió un error inesperado")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {!editLessonId && (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-5 py-3 text-xs text-violet-500 bg-violet-500/10 hover:bg-violet-500/20 rounded-xl transition-colors font-semibold mt-4"
        >
          <span className="material-symbols-outlined text-base">quiz</span>
          Constructor de Evaluaciones
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white dark:bg-[#0B0F1A] rounded-none sm:rounded-2xl w-full max-w-4xl h-full sm:h-auto sm:max-h-[90vh] flex flex-col border-0 sm:border border-gray-200 dark:border-white/5 shadow-xl overflow-hidden">
            
            <div className="p-6 border-b border-gray-200 dark:border-white/5 flex items-center justify-between shrink-0 bg-white dark:bg-gray-900/40">
              <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800 dark:text-gray-100">
                <span className="material-symbols-outlined text-violet-600 dark:text-violet-400">quiz</span>
                {editLessonId ? "Edición de Cuestionario" : "Constructor de Cuestionarios Interactivo"}
              </h2>
              <button 
                type="button" 
                onClick={handleClose} 
                className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors bg-gray-50 dark:bg-white/5 p-1.5 rounded-full shadow-sm hover:bg-gray-100 dark:hover:bg-white/10"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30 dark:bg-gray-900">
              <FormProvider {...methods}>
                <form id="quiz-form" onSubmit={handleSubmit(processForm)} className="space-y-8">
                  {/* Basic Quiz Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 bg-white dark:bg-gray-800/40 rounded-2xl border border-gray-200 dark:border-gray-700/60 shadow-sm">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Título de Evaluación</label>
                      <input 
                        type="text" 
                        {...register("quizTitle")}
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 text-gray-800 dark:text-gray-100 placeholder-gray-400"
                        placeholder="Ej: Quiz Módulo 1"
                      />
                      {errors.quizTitle && <p className="text-red-500 text-xs mt-1.5">{errors.quizTitle.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Puntaje Mínimo (%)</label>
                      <input 
                        type="number" 
                        {...register("minScore")}
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 text-gray-800 dark:text-gray-100"
                      />
                      {errors.minScore && <p className="text-red-500 text-xs mt-1.5">{errors.minScore.message}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Módulo</label>
                      <select 
                        {...register("selectedModule")}
                        onChange={(e) => {
                           setValue("selectedModule", e.target.value)
                           setValue("selectedLesson", "") // reset lesson
                        }}
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 text-gray-800 dark:text-gray-100"
                      >
                        <option value="" disabled className="dark:bg-gray-900">Selecciona Módulo</option>
                        {modules.map(m => (
                          <option key={m.id} value={m.id} className="dark:bg-gray-900">{m.title}</option>
                        ))}
                      </select>
                      {errors.selectedModule && <p className="text-red-500 text-xs mt-1.5">{errors.selectedModule.message}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Asignar a Lección</label>
                      <select 
                        {...register("selectedLesson")}
                        disabled={!selectedModule || !!editLessonId}
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50 text-gray-800 dark:text-gray-100"
                      >
                         <option value="" disabled className="dark:bg-gray-900">Selecciona una lección</option>
                         {activeModule?.lessons?.map(l => (
                            <option key={l.id} value={l.id} className="dark:bg-gray-900">{l.title}</option>
                         ))}
                      </select>
                      {errors.selectedLesson && <p className="text-red-500 text-xs mt-1.5">{errors.selectedLesson.message}</p>}
                    </div>
                  </div>

                  {/* Questions Section */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
                        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200 flex items-center gap-2">
                            <span className="material-symbols-outlined text-violet-500">format_list_numbered</span>
                            Preguntas
                        </h3>
                        <span className="text-xs font-bold bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 px-3 py-1 rounded-full border border-violet-200 dark:border-violet-800">
                            {questionFields.length} Preguntas
                        </span>
                    </div>

                    {errors.questions?.message && <p className="text-red-500 text-sm font-medium">{errors.questions.message}</p>}

                    {questionFields.map((q, qIndex) => (
                      <div key={q.id} className="bg-white dark:bg-gray-800/40 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm relative space-y-6 transition-all">
                        {questionFields.length > 1 && (
                            <button 
                                type="button"
                                onClick={() => removeQuestion(qIndex)}
                                className="absolute top-5 right-5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg transition-colors"
                                title="Eliminar pregunta"
                            >
                                <span className="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                        )}
                        
                        <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-700/50 pb-4">
                            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-violet-600 text-white text-xs font-bold shadow-sm">{qIndex + 1}</span>
                            <h4 className="font-bold text-gray-700 dark:text-gray-300">Detalles de la Pregunta</h4>
                        </div>

                        {/* Top Question Params */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                            <div className="md:col-span-8">
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Caso Clínico (Stem)</label>
                                <textarea 
                                    {...register(`questions.${qIndex}.questionText`)}
                                    rows={4}
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                                    placeholder="Describe el caso clínico o la pregunta principal..."
                                />
                                {errors.questions?.[qIndex]?.questionText && <p className="text-red-500 text-xs mt-1.5">{errors.questions[qIndex]?.questionText?.message}</p>}
                            </div>
                            <div className="md:col-span-4 flex flex-col gap-4 justify-between h-full pt-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Dificultad (1-5)</label>
                                    <input 
                                        type="number" 
                                        min="1" max="5"
                                        {...register(`questions.${qIndex}.difficulty`)}
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 text-gray-800 dark:text-gray-100"
                                    />
                                </div>
                                <div className="flex items-center justify-between p-3.5 border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 rounded-xl transition-colors hover:bg-red-100 dark:hover:bg-red-900/20">
                                    <label className="text-xs font-bold text-red-700 dark:text-red-400 cursor-pointer flex-1 flex items-center gap-2" htmlFor={`critical-${qIndex}`}>
                                        <span className="material-symbols-outlined text-[16px]">warning</span>
                                        ¿Pregunta Crítica?
                                    </label>
                                    <input 
                                        type="checkbox" 
                                        id={`critical-${qIndex}`}
                                        {...register(`questions.${qIndex}.is_critical`)}
                                        className="w-4 h-4 text-red-600 bg-white dark:bg-gray-900 border-gray-300 dark:border-red-800 rounded focus:ring-red-500 focus:ring-offset-gray-900"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Optional Image */}
                        <div className="p-5 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50/50 dark:bg-gray-900/50 hover:bg-gray-50 dark:hover:bg-gray-900/80 transition-colors">
                             <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Imagen de Apoyo (Opcional)</label>
                             <div className="flex items-center gap-4">
                                <label className="cursor-pointer bg-white px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">upload_file</span>
                                    <span>Subir Imagen...</span>
                                    <input 
                                        type="file" 
                                        className="sr-only" 
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) {
                                                setValue(`questions.${qIndex}.imageFile`, file)
                                                setValue(`questions.${qIndex}.imagePreview`, URL.createObjectURL(file))
                                            }
                                        }}
                                    />
                                </label>
                                {watch(`questions.${qIndex}.imagePreview`) && (
                                    <div className="relative w-20 h-20 rounded overflow-hidden border border-gray-200">
                                        <img src={watch(`questions.${qIndex}.imagePreview`)} className="object-cover w-full h-full" alt="Preview"/>
                                        <button 
                                            type="button" 
                                            onClick={() => {
                                                setValue(`questions.${qIndex}.imageFile`, undefined)
                                                setValue(`questions.${qIndex}.imagePreview`, undefined)
                                            }}
                                            className="absolute top-0 right-0 bg-red-500 text-white p-0.5"
                                        >
                                            <span className="material-symbols-outlined text-xs">close</span>
                                        </button>
                                    </div>
                                )}
                             </div>
                        </div>

                        {/* Findings */}
                        <FindingsField control={control} register={register} qIndex={qIndex} />

                        {/* Options */}
                        <div className="pt-6 border-t border-gray-100 dark:border-white/10">
                             <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Opciones y Respuestas</label>
                             {errors.questions?.[qIndex]?.options && <p className="text-red-500 text-xs mb-3">{errors.questions[qIndex]?.options?.message}</p>}
                             
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {watch(`questions.${qIndex}.options`).map((opt, optIndex) => {
                                    const isCorrect = watch(`questions.${qIndex}.correctOptionId`) === opt.id;
                                    return (
                                        <div key={opt.id} className={`p-5 rounded-xl border-2 transition-all flex flex-col gap-3 ${isCorrect ? 'border-green-500 bg-green-50/50 dark:bg-green-900/10' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                                            <div className="flex items-center gap-3">
                                                <input 
                                                    type="radio"
                                                    value={opt.id}
                                                    {...register(`questions.${qIndex}.correctOptionId`)}
                                                    className="w-4 h-4 text-blue-500 focus:ring-blue-500 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 cursor-pointer"
                                                />
                                                <span className={`text-sm font-bold ${isCorrect ? 'text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'}`}>
                                                    OPCIÓN {opt.id} {isCorrect && <span className="text-green-600 dark:text-green-500 ml-2">✓ Correcta</span>}
                                                </span>
                                            </div>
                                            
                                            <div className="space-y-3">
                                                <input 
                                                    type="text"
                                                    {...register(`questions.${qIndex}.options.${optIndex}.text`)}
                                                    className={`w-full text-sm py-2 px-4 rounded-lg border ${isCorrect ? 'border-green-300 dark:border-green-800 focus:border-green-500' : 'border-gray-200 dark:border-gray-700 focus:border-blue-500'} focus:outline-none bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 transition-colors`}
                                                    placeholder="Texto de la opción..."
                                                />
                                                {errors.questions?.[qIndex]?.options?.[optIndex]?.text && <p className="text-red-500 text-xs">{errors.questions[qIndex]?.options?.[optIndex]?.text?.message}</p>}
                                                
                                                <input 
                                                    type="text"
                                                    {...register(`questions.${qIndex}.options.${optIndex}.feedback_clinical`)}
                                                    className={`w-full text-xs py-2 px-4 rounded-lg border ${isCorrect ? 'border-green-300 dark:border-green-800 focus:border-green-500' : 'border-gray-200 dark:border-gray-700 focus:border-blue-500'} focus:outline-none bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 transition-colors`}
                                                    placeholder="Explicación clínica u observación (opcional)..."
                                                />
                                            </div>
                                        </div>
                                    )
                                })}
                             </div>
                             {errors.questions?.[qIndex]?.correctOptionId && <p className="text-red-500 text-xs mt-3">{errors.questions[qIndex]?.correctOptionId?.message}</p>}
                        </div>

                        {/* Pearls and References */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100 dark:border-white/10 mt-2">
                            <div>
                                <label className="flex items-center gap-2 text-xs font-bold text-yellow-600 dark:text-yellow-500 mb-2 uppercase tracking-wider">
                                    <span className="material-symbols-outlined text-base">lightbulb</span> Perla del Consejo
                                </label>
                                <textarea 
                                    {...register(`questions.${qIndex}.pearl`)}
                                    rows={3}
                                    className="w-full bg-yellow-50 dark:bg-gray-800/60 border border-yellow-200 dark:border-yellow-900/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 resize-none text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
                                    placeholder="Concepto clave para recordar..."
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                                    <span className="material-symbols-outlined text-base">menu_book</span> Bibliografía
                                </label>
                                <textarea 
                                    {...register(`questions.${qIndex}.source_reference`)}
                                    rows={3}
                                    className="w-full bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 resize-none text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
                                    placeholder="Ej. Fleischer Ultrasonido, 8va Ed..."
                                />
                            </div>
                        </div>

                      </div>
                    ))}

                    <button 
                      type="button"
                      onClick={() => appendQuestion({
                          id: `temp-${Date.now()}`,
                          questionText: "",
                          difficulty: 1,
                          is_critical: false,
                          pearl: "",
                          source_reference: "",
                          findings: [],
                          options: [
                            { id: "A", text: "", feedback_clinical: "" },
                            { id: "B", text: "", feedback_clinical: "" },
                            { id: "C", text: "", feedback_clinical: "" },
                            { id: "D", text: "", feedback_clinical: "" }
                          ],
                          correctOptionId: "A",
                          score: 1
                      })}
                      className="w-full flex items-center justify-center gap-2 py-5 border-2 border-dashed border-violet-800/30 dark:border-violet-500/30 rounded-2xl text-sm font-bold text-violet-700 dark:text-violet-400 hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/10 transition-all shadow-sm"
                    >
                      <span className="material-symbols-outlined text-xl">add_circle</span>
                      Añadir Nueva Pregunta
                    </button>
                  </div>

                </form>
              </FormProvider>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-white/5 flex flex-col md:flex-row justify-end gap-3 shrink-0 bg-white dark:bg-gray-900/40">
              <button 
                type="button"
                onClick={() => setIsOpen(false)} 
                disabled={isSubmitting}
                className="w-full md:w-auto px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                form="quiz-form"
                disabled={isSubmitting}
                className="w-full md:w-auto px-8 py-2.5 rounded-xl text-sm font-bold bg-violet-600 text-white hover:bg-violet-500 flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-violet-500/20"
              >
                {isSubmitting ? (
                  <><span className="material-symbols-outlined shrink-0 animate-spin text-sm">progress_activity</span> Guardando y Subiendo...</>
                ) : (
                  <><span className="material-symbols-outlined shrink-0 text-sm">publish</span> Publicar Evaluación</>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  )
}

// Sub-component Helper
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FindingsField({ control, register, qIndex }: { control: any, register: any, qIndex: number }) {
    const { fields, append, remove } = useFieldArray({
        control,
        name: `questions.${qIndex}.findings`
    });

    return (
        <div className="p-5 border border-blue-200 dark:border-blue-900/30 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 transition-colors">
            <div className="flex items-center justify-between mb-4">
                <label className="flex items-center gap-2 text-xs font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wider">
                    <span className="material-symbols-outlined text-base">stethoscope</span> Hallazgos Clínicos
                </label>
                <button 
                    type="button" 
                    onClick={() => append({ type: 'text', label: '', value: '' })}
                    className="text-xs font-bold text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 flex items-center gap-1 bg-white dark:bg-blue-900/40 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800/50 shadow-sm transition-all hover:shadow-md"
                >
                    <span className="material-symbols-outlined text-[16px]">add</span> Añadir Hallazgo
                </button>
            </div>

            {fields.length === 0 ? (
                <p className="text-xs text-blue-500/70 dark:text-blue-400/50 italic text-center py-4 bg-white/50 dark:bg-black/10 rounded-lg">No se han añadido hallazgos.</p>
            ) : (
                <div className="space-y-3">
                    {fields.map((field, fIndex) => (
                        <div key={field.id} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-white dark:bg-gray-800 p-2 rounded-lg border border-blue-100 dark:border-gray-700 shadow-sm">
                            <input 
                                type="text"
                                {...register(`questions.${qIndex}.findings.${fIndex}.label`)}
                                placeholder="Ej. Laboratorio, Signo..."
                                className="w-full sm:w-1/3 text-xs py-2 px-3 rounded-md border border-gray-200 dark:border-gray-600 focus:outline-none focus:border-blue-500 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                            />
                            <div className="w-full flex-1 flex gap-2 items-center">
                                <input 
                                    type="text"
                                    {...register(`questions.${qIndex}.findings.${fIndex}.value`)}
                                    placeholder="Ej. Leucocitosis 15k, Murphy Positivo..."
                                    className="w-full text-xs py-2 px-3 rounded-md border border-gray-200 dark:border-gray-600 focus:outline-none focus:border-blue-500 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                                />
                                <button 
                                    type="button" 
                                    onClick={() => remove(fIndex)}
                                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-600 transition-colors shrink-0"
                                >
                                    <span className="material-symbols-outlined text-[16px]">close</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
