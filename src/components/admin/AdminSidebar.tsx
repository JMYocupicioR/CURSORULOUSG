"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/ui/logo"
import { logout } from "@/app/login/actions"

interface UserProfile {
  full_name: string | null
  email: string | null
  role: string | null
  specialty: string | null
  phone: string | null
}

const adminNavItems = [
  { href: "/admin", icon: "space_dashboard", label: "Dashboard" },
  { href: "/admin/alumnos", icon: "school", label: "Gestión de Alumnos" },
  { href: "/admin/contenido", icon: "video_library", label: "Contenido del Curso" },
  { href: "/admin/microlearning", icon: "bolt", label: "Micro-Aprendizaje" },
  { href: "/admin/certificados", icon: "workspace_premium", label: "Certificados" },
]

function getInitials(name: string | null | undefined): string {
  if (!name) return "A"
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("")
}

export function AdminSidebar({ userProfile }: { userProfile: UserProfile | null }) {
  const pathname = usePathname()
  const displayName = userProfile?.full_name || "Administrador"
  const initials = getInitials(userProfile?.full_name)

  return (
    <aside className="w-72 bg-[#0a1628] text-white hidden md:flex flex-col shrink-0 relative overflow-y-auto z-20 shadow-2xl font-body sidebar-scroll">
      {/* Logo Section */}
      <div className="p-6 flex flex-col items-center border-b border-white/5">
        <Logo showSubtitle />
      </div>

      {/* User Profile Card */}
      <div className="px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3">
          <div className="w-10 h-10 rounded-full bg-linear-to-br from-primary to-cyan-400 flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
            <span className="text-sm font-bold text-white">{initials}</span>
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-white truncate">{displayName}</p>
            <p className="text-xs text-primary/80 truncate">Director General</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-1">
        <p className="px-4 text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-3">
          Administración
        </p>
        {adminNavItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                isActive
                  ? "bg-primary/15 text-white shadow-lg shadow-primary/5 border border-primary/20"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <span
                className={cn(
                  "material-symbols-outlined text-[22px] transition-colors duration-200",
                  isActive ? "text-primary" : "text-gray-500 group-hover:text-primary"
                )}
              >
                {item.icon}
              </span>
              <span className="font-medium text-sm">{item.label}</span>
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-7 bg-primary rounded-r-full" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-3 border-t border-white/5 space-y-1">
        {/* Settings */}
        <Link
          href="/admin/configuracion"
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
            pathname === "/admin/configuracion"
              ? "bg-primary/15 text-white border border-primary/20"
              : "text-gray-400 hover:bg-white/5 hover:text-white"
          )}
        >
          <span
            className={cn(
              "material-symbols-outlined text-[22px] transition-colors duration-200",
              pathname === "/admin/configuracion" ? "text-primary" : "text-gray-500 group-hover:text-primary"
            )}
          >
            settings
          </span>
          <span className="font-medium text-sm">Configuración</span>
        </Link>

        {/* Logout */}
        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all duration-200 group cursor-pointer"
          >
            <span className="material-symbols-outlined text-[22px] text-gray-600 group-hover:text-red-400 transition-colors duration-200">
              logout
            </span>
            <span className="font-medium text-sm">Cerrar Sesión</span>
          </button>
        </form>
      </div>
    </aside>
  )
}
