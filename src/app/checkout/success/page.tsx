"use client"

import Link from "next/link"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function CheckoutSuccessPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to login after 6 seconds so the user can access their account
    const t = setTimeout(() => router.push('/login'), 6000)
    return () => clearTimeout(t)
  }, [router])

  return (
    <div className="min-h-screen bg-[#080B14] flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Animated success ring */}
        <div className="relative mx-auto w-28 h-28">
          <div className="absolute inset-0 rounded-full border-4 border-green-500/20 animate-ping" />
          <div className="absolute inset-0 rounded-full border-4 border-green-500/40" />
          <div className="w-full h-full rounded-full bg-green-500/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-green-400 text-5xl">check_circle</span>
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-black text-white mb-3">¡Pago Exitoso!</h1>
          <p className="text-gray-400 leading-relaxed">
            Tu inscripción al <strong className="text-white">Diplomado en Rehabilitación Intervencionista</strong> ha sido confirmada.
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left space-y-4">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">¿Qué sigue?</h2>
          {[
            {
              icon: "mail",
              color: "text-blue-400",
              title: "Revisa tu correo",
              desc: "Recibirás un email para configurar tu contraseña de acceso.",
            },
            {
              icon: "lock_open",
              color: "text-primary",
              title: "Establece tu contraseña",
              desc: "Sigue el enlace del email para crear tu contraseña.",
            },
            {
              icon: "school",
              color: "text-green-400",
              title: "Accede al Dashboard",
              desc: "Todo el contenido del diplomado estará disponible de inmediato.",
            },
          ].map((step) => (
            <div key={step.icon} className="flex items-start gap-3">
              <span className={`material-symbols-outlined text-xl shrink-0 mt-0.5 ${step.color}`}>{step.icon}</span>
              <div>
                <p className="text-sm font-semibold text-white">{step.title}</p>
                <p className="text-xs text-gray-500">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="w-full bg-primary hover:bg-cyan-500 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">login</span>
            Ir a Iniciar Sesión
          </Link>
          <p className="text-xs text-gray-600">
            Serás redirigido automáticamente en unos segundos...
          </p>
        </div>
      </div>
    </div>
  )
}
