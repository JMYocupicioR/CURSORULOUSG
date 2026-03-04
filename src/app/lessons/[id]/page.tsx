import { getLesson, getUserLessonProgress, getLessonQuiz, getUserEnrollment, getModules, getUserProfile, getUserCompletedLessons } from "@/lib/data"
import { notFound, redirect } from "next/navigation"
import { LessonClient } from "./LessonClient"
import { Header } from "@/components/dashboard/header"

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lesson = await getLesson(id)
  
  if (!lesson) {
    notFound()
  }

  const enrollment = await getUserEnrollment()
  
  if (enrollment?.status === "blocked") {
    redirect("/dashboard?error=module_blocked")
  }

  const [progress, profile, allModules, completedLessons] = await Promise.all([
    getUserLessonProgress(id),
    getUserProfile(),
    getModules(),
    getUserCompletedLessons(),
  ])

  const isCompleted = progress?.is_completed || false
  const userName = profile?.full_name || "Estudiante"

  // Find the module of this lesson and its sibling lessons for navigation
  const currentModule = allModules.find(m => m.id === lesson.module_id)
  
  // --- Check Prerequisites ---
  // 1. Module Level
  if (currentModule?.prerequisite_module_id) {
    const prereqModule = allModules.find(m => m.id === currentModule.prerequisite_module_id)
    if (prereqModule) {
      const publishedLessonsInPrereq = prereqModule.lessons?.filter(l => l.is_published) || []
      const isPrereqCompleted = publishedLessonsInPrereq.length > 0 && 
        publishedLessonsInPrereq.every(l => completedLessons.includes(l.id))
      
      if (!isPrereqCompleted) {
        redirect("/dashboard?error=module_locked")
      }
    }
  }

  // 2. Lesson Level
  if (lesson.prerequisite_lesson_id && !completedLessons.includes(lesson.prerequisite_lesson_id)) {
    redirect("/dashboard?error=lesson_locked")
  }

  // --- Map Sibling Lessons ---
  const moduleLessons = (currentModule?.lessons || []).map(l => ({
    ...l,
    is_completed: completedLessons.includes(l.id),
    is_locked: !!(l.prerequisite_lesson_id && !completedLessons.includes(l.prerequisite_lesson_id))
  }))

  // If it's a quiz type lesson, fetch the quiz data
  let quizData = null;
  if (lesson.lesson_type === 'quiz') {
    quizData = await getLessonQuiz(id);
  }

  return (
    <>
      <Header userName={userName} />
      <div className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark font-body">
        <LessonClient 
          lesson={lesson} 
          isCompleted={isCompleted} 
          quizData={quizData}
          moduleLessons={moduleLessons}
          moduleTitle={currentModule?.title || ""}
        />
      </div>
    </>
  )
}
