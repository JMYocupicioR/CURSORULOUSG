import { Header } from "@/components/dashboard/header"
import { getUserProfile, getMicroLessons } from "@/lib/data"
import Link from "next/link"
import { MicroLessonFeed } from "./MicroLessonFeed"

export default async function MicrolearningCatalogPage() {
  const profile = await getUserProfile()
  const displayName = profile?.full_name || "Estudiante"
  
  // Gets all published micro-lessons
  const microLessons = await getMicroLessons(true)

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background-light dark:bg-background-dark font-body">
      <div className="hidden md:block">
        <Header userName={displayName} />
      </div>
      <div className="flex-1 relative">
        {microLessons.length > 0 ? (
          <MicroLessonFeed lessons={microLessons} />
        ) : (
          <div className="h-full flex items-center justify-center p-8">
            <div className="bg-surface-light dark:bg-surface-dark rounded-2xl p-12 text-center border border-dashed border-gray-300 dark:border-gray-700 max-w-3xl mx-auto w-full shadow-sm">
              <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4 block">video_library</span>
              <h3 className="text-xl font-bold text-secondary dark:text-white mb-2">Aún no hay temas disponibles</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Pronto agregaremos nuevo contenido en esta sección.
              </p>
              <Link href="/dashboard" className="mt-6 inline-block bg-primary text-white font-bold py-2 px-6 rounded-lg transition-colors hover:bg-cyan-500">
                Volver al Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
