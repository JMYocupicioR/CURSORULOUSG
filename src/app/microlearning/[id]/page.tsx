import { Header } from "@/components/dashboard/header"
import { getUserProfile, getMicroLessons } from "@/lib/data"
import Link from "next/link"
import { notFound } from "next/navigation"
import { MicroLessonViewer } from "./MicroLessonViewer"

export default async function MicrolearningLessonPage({ params }: { params: { id: string } }) {
  const profile = await getUserProfile()
  const displayName = profile?.full_name || "Estudiante"
  
  // Podríamos optimizar esto haciendo un select por ID en lib/data, 
  // pero ya que getMicroLessons hace una sola query es aceptable por ahora.
  const allMicroLessons = await getMicroLessons(true)
  const lesson = allMicroLessons.find(l => l.id === params.id)

  if (!lesson) {
    notFound()
  }

  return (
    <>
      <Header userName={displayName} />
      <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-background-light dark:bg-background-dark font-body flex justify-center">
        <div className="w-full max-w-5xl">
          <Link href="/microlearning" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary transition-colors mb-6">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Volver al Catálogo
          </Link>

          <div className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 md:p-8 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
                  {lesson.category}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">schedule</span>
                  {lesson.duration_minutes} min
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-secondary dark:text-white mb-4">
                {lesson.title}
              </h1>
              {lesson.description && (
                <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                  {lesson.description}
                </p>
              )}
            </div>

            <div className="p-6 md:p-8 bg-gray-50 dark:bg-[#080B14]">
              <MicroLessonViewer lesson={lesson} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
