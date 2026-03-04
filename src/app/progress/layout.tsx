import { Sidebar } from "@/components/dashboard/sidebar"
import { getUserProfile } from "@/lib/data"

export default async function ProgressLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const userProfile = await getUserProfile()

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-200 transition-colors duration-300 font-body">
      <Sidebar userProfile={userProfile} />
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {children}
      </main>
    </div>
  )
}
