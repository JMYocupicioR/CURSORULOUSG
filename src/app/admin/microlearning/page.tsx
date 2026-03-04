import { AdminHeader } from "@/components/admin/AdminHeader"
import { getMicroLessons } from "@/lib/data"
import MicrolearningClient from "./MicrolearningClient"

export default async function MicrolearningAdminPage() {
  // Pass false to get all, including unpublished
  const microLessons = await getMicroLessons(false)

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-[#0B0F1A]">
      <AdminHeader 
        title="Micro-Aprendizaje" 
        subtitle="Gestiona el contenido de estudio complementario" 
      />
      <div className="flex-1 overflow-y-auto p-6">
        <MicrolearningClient initialData={microLessons} />
      </div>
    </div>
  )
}
