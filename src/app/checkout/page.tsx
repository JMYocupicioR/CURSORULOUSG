"use client"

import { useState, useTransition } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Logo } from "@/components/ui/logo"
import { createCheckoutSession } from "@/app/actions/stripe"

export default function CheckoutPage() {
  const searchParams = useSearchParams()
  const canceled = searchParams.get("canceled") === "true"
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleCheckout = () => {
    setError(null)
    if (!email || !email.includes("@")) {
      setError("Por favor ingresa un correo electrónico válido.")
      return
    }

    const formData = new FormData()
    formData.set("email", email)

    startTransition(async () => {
      const result = await createCheckoutSession(formData)
      if (result?.url) {
        window.location.href = result.url
      } else if (result?.error) {
        setError(result.error)
      }
    })
  }

  return (
    <div className="min-h-screen bg-[#080B14] flex flex-col">
      {/* Top Bar */}
      <div className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <Logo variant="dark" compact />
        <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Volver
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-5xl grid md:grid-cols-2 gap-12 items-start">

          {/* Left: Program Summary */}
          <div className="space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block" />
                Nueva Cohorte Abierta
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white leading-tight mb-4">
                Diplomado en{" "}
                <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-blue-400">
                  Rehabilitación Intervencionista
                </span>{" "}
                Guiada por Ultrasonido
              </h1>
              <p className="text-gray-400 leading-relaxed">
                Acceso inmediato a todo el contenido del programa, incluyendo videos HD, micro-aprendizaje, evaluaciones y certificado con aval académico.
              </p>
            </div>

            <div className="space-y-4">
              {[
                { icon: "play_circle", label: "Video HD con tecnología Mux", desc: "Reproducción sin interrupciones en cualquier dispositivo" },
                { icon: "bolt", label: "Micro-aprendizaje", desc: "Lecciones cortas complementarias organizadas por categoría" },
                { icon: "quiz", label: "Evaluaciones con feedback clínico", desc: "Preguntas reales con \"Perlas Clínicas\" y bibliografía" },
                { icon: "workspace_premium", label: "Certificado descargable", desc: "Con aval de la Sociedad Mexicana de Medicina Física" },
              ].map((item) => (
                <div key={item.icon} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-primary text-xl">{item.icon}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
              <div className="text-3xl font-black text-white">
                <span className="text-sm text-gray-400 font-normal">MXN</span>
                {" "}—
              </div>
              <div>
                <p className="text-xs text-gray-400 line-through"></p>
                <p className="text-xs text-primary font-semibold">Pago único · Acceso de por vida</p>
              </div>
            </div>
          </div>

          {/* Right: Checkout Form */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/50">

            {canceled && (
              <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
                <span className="material-symbols-outlined text-amber-400 text-base mt-0.5">warning</span>
                <div>
                  <p className="text-sm font-semibold text-amber-300">Pago cancelado</p>
                  <p className="text-xs text-amber-400/80">No se realizó ningún cargo. Puedes intentarlo nuevamente cuando quieras.</p>
                </div>
              </div>
            )}

            <div className="mb-8">
              <h2 className="text-xl font-bold text-white mb-1">Completa tu inscripción</h2>
              <p className="text-sm text-gray-400">Ingresa tu correo y te redirigiremos a la pasarela segura de pago.</p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleCheckout() }}
                  placeholder="doctor@ejemplo.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                />
                <p className="text-[10px] text-gray-600 mt-1.5">Usaremos este correo para crear tu acceso al curso.</p>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base shrink-0">error</span>
                  {error}
                </div>
              )}
            </div>

            <button
              onClick={handleCheckout}
              disabled={isPending}
              className="w-full bg-primary hover:bg-cyan-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2 text-base"
            >
              {isPending ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-xl">autorenew</span>
                  Redirigiendo a Stripe...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-xl">lock</span>
                  Pagar con Stripe
                </>
              )}
            </button>

            <div className="mt-6 flex items-center justify-center gap-4 text-[10px] text-gray-600">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-green-500">shield</span>
                Pago SSL Seguro
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-blue-400">credit_card</span>
                Visa, MC, AMEX
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-yellow-400">verified</span>
                Stripe Certified
              </span>
            </div>

            <p className="mt-4 text-center text-[11px] text-gray-600">
              ¿Ya tienes acceso?{" "}
              <Link href="/login" className="text-primary hover:text-cyan-400 underline transition-colors">
                Iniciar sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
