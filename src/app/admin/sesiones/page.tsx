import { AdminHeader } from "@/components/admin/AdminHeader"
import { getAllLiveSessions } from "@/lib/data"
import { LiveSessionsClient } from "@/components/admin/LiveSessionsClient"
import { createClient } from "@/lib/supabase/server"

export default async function AdminSesionesPage() {
  const sessions = await getAllLiveSessions()
  
  // Fetch active students for recipient selector
  const supabase = await createClient()
  const { data: students } = await supabase
    .from("profiles")
    .select("id, full_name, email, specialty")
    .neq("role", "admin")
    .eq("is_active", true)
    .order("full_name", { ascending: true })

  return (
    <div className="flex flex-col h-full">
      <AdminHeader title="Clases en Vivo" subtitle="Calendario y gestión de sesiones" />
      <div className="flex-1 overflow-y-auto p-6">
        <LiveSessionsClient
          sessions={sessions}
          students={students || []}
        />
      </div>
    </div>
  )
}
