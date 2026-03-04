import Link from "next/link"
import { Logo } from "@/components/ui/logo"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

async function signOutAction() {
  "use server"
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}

export default async function PendingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase.from("profiles").select("full_name, email").eq("id", user.id).single()
    : { data: null }

  const name = profile?.full_name || "Doctor/a"
  const email = profile?.email || user?.email || ""

  return (
    <div className="min-h-screen bg-[#080B14] flex flex-col items-center justify-center p-6">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 border-b border-white/5 px-6 py-4 flex items-center justify-between bg-[#080B14]/90 backdrop-blur-sm">
        <Logo variant="dark" compact />
        <form action={signOutAction}>
          <button
            type="submit"
            className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            Cerrar sesión
          </button>
        </form>
      </div>

      <div className="w-full max-w-lg text-center space-y-6 mt-16">
        {/* Icon */}
        <div className="mx-auto w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl text-amber-400">hourglass_top</span>
        </div>

        {/* Heading */}
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Bienvenido/a, {name.split(" ")[0]} 👋
          </h1>
          <p className="text-gray-400 leading-relaxed">
            Tu cuenta ha sido creada exitosamente. Estamos revisando tu información y activaremos tu acceso al curso en breve.
          </p>
        </div>

        {/* Info card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-primary text-base">email</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Correo registrado</p>
              <p className="text-sm text-gray-400">{email}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-amber-400 text-base">pending</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Estado de cuenta</p>
              <p className="text-sm text-amber-400 font-medium">Pendiente de activación</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-emerald-400 text-base">schedule</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Tiempo estimado</p>
              <p className="text-sm text-gray-400">Serás notificado al correo una vez activado.</p>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="bg-white/3 border border-white/5 rounded-2xl p-5 text-left">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Próximos pasos</p>
          <div className="space-y-3">
            {[
              { done: true, text: "Registro de cuenta completado" },
              { done: true, text: "Correo de verificación enviado" },
              { done: false, text: "Activación de acceso por el equipo" },
              { done: false, text: "Acceso completo al diplomado" },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${step.done ? "bg-emerald-500" : "bg-white/10 border border-white/20"}`}>
                  {step.done && <span className="material-symbols-outlined text-white text-[12px]">check</span>}
                </div>
                <p className={`text-sm ${step.done ? "text-white" : "text-gray-500"}`}>{step.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <p className="text-xs text-gray-600">
          ¿Dudas? Contáctanos a{" "}
          <a href="mailto:drmoralesrehabilita@gmail.com" className="text-primary hover:text-cyan-400 transition-colors underline">
            drmoralesrehabilita@gmail.com
          </a>
        </p>
      </div>
    </div>
  )
}
