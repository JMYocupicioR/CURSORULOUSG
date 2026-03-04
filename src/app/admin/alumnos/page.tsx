import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AlumnosClient, StudentDetail } from "./AlumnosClient"

export default async function AlumnosPage() {
  const supabase = await createClient()

  const { data: userAuth } = await supabase.auth.getUser()
  if (!userAuth?.user) redirect('/login')
  
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userAuth.user.id).single()
  if (profile?.role !== 'admin') redirect('/login')

  // Obtener alumnos (asegurarse de incluir los que tienen role null)
  const { data: studentsData } = await supabase
    .from("profiles")
    .select("id, full_name, email, specialty, state, created_at, is_active")
    .or("role.neq.admin,role.is.null")
    .order("created_at", { ascending: false })
  
  // Obtener progreso de lecciones
  const { data: allProgress } = await supabase.from("lesson_progress").select("user_id, lesson_id, is_completed, score").eq("is_completed", true)

  // Obtener total de lecciones publicadas para calcular progreso global
  const { data: allLessons } = await supabase.from("lessons").select("id, module_id, lesson_type").eq("is_published", true)
  const totalLessonsCount = allLessons?.length || 0

  // Obtener todos los modulos para las calificaciones
  const { data: modules } = await supabase.from("modules").select("id, title").order("created_at", { ascending: true })

  // Construir Data
  const students: StudentDetail[] = (studentsData || []).map(student => {
    // Calculo de progreso global
    const studentProgress = allProgress?.filter(p => p.user_id === student.id) || []
    const progressPercentage = totalLessonsCount === 0 ? 0 : Math.round((studentProgress.length / totalLessonsCount) * 100)
    
    // Status
    let status: "active" | "completed" | "pending" = "pending"
    if (progressPercentage === 100) status = "completed"
    else if (progressPercentage > 0) status = "active"

    // Calificaciones por modulo
    let totalScoreSum = 0;
    let evalModules = 0;

    const moduleGrades = (modules || []).map(mod => {
      // Lecciones de este modulo 
      const modLessons = allLessons?.filter(l => l.module_id === mod.id) || []
      
      // Tiene quizzes este modulo?
      const quizLessons = modLessons.filter(l => l.lesson_type === 'quiz')
      
      let quizScore = null;
      let mStatus: "Pendiente" | "En Progreso" | "Completado" = "Pendiente"

      // Calcular si el modulo esta completado
      const completedModLessons = studentProgress.filter(p => modLessons.some(ml => ml.id === p.lesson_id))
      if (completedModLessons.length === modLessons.length && modLessons.length > 0) mStatus = "Completado"
      else if (completedModLessons.length > 0) mStatus = "En Progreso"

      // Calcular calificacion (promedio de los quizzes del modulo usando el puntaje guardado en lesson_progress)
      if (quizLessons.length > 0) {
        let sum = 0;
        let count = 0;
        quizLessons.forEach(ql => {
          const prog = studentProgress.find(p => p.lesson_id === ql.id)
          if (prog && prog.score !== null) {
            sum += prog.score;
            count++;
          }
        })
        if (count > 0) {
          quizScore = Math.round(sum / count)
          totalScoreSum += quizScore;
          evalModules++;
        }
      }

      return {
        moduleId: mod.id,
        moduleTitle: mod.title,
        quizScore,
        status: mStatus
      }
    })

    return {
      id: student.id,
      name: student.full_name || "Sin Nombre",
      email: student.email || "Sin Email",
      specialty: student.specialty || "No especificada",
      city: student.state || "No especificada",
      progress: progressPercentage,
      status,
      enrollDate: student.created_at,
      lastAccess: "Acceso Activo",
      globalGrade: evalModules > 0 ? Math.round(totalScoreSum / evalModules) : null,
      moduleGrades,
      isActive: student.is_active ?? false,
    }
  })

  // Calcular Stats Globales
  const stats = {
    total: students.length,
    completed: students.filter(s => s.status === 'completed').length,
    inProgress: students.filter(s => s.status === 'active').length,
    pending: students.filter(s => s.status === 'pending').length
  }

  return <AlumnosClient students={students} stats={stats} />
}
