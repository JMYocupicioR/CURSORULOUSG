"use client"

import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, ArrowRight, Github } from "lucide-react"
import Link from "next/link"
import { login } from "./actions"

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const [showPassword, setShowPassword] = useState(false)
  const searchParams = useSearchParams()
  const loginError = searchParams.get('error')

  return (
    <div className="min-h-screen flex flex-col lg:flex-row overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-primary/30 selection:text-primary">
      
      {/* Left Column: Form Section */}
      <div className="flex flex-1 flex-col items-center justify-center p-6 bg-background-light dark:bg-background-dark lg:w-1/2 relative z-10 transition-colors duration-500">
        
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="w-full max-w-[420px] space-y-8 relative">
          
          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="flex items-center justify-center group px-4 py-2 rounded-2xl transition-all duration-300">
               <div className="relative">
                 <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150 group-hover:scale-200 transition-transform duration-500" />
                 <img src="/logos/raulmoralescolor.png" alt="Dr. Raúl Morales" className="h-16 w-auto object-contain relative z-10" />
               </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Bienvenido de nuevo</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Ingresa tus credenciales para acceder a tu curso</p>
            </div>
          </div>

          {/* Login Form */}
          <div className="bg-white dark:bg-surface-dark p-8 rounded-2xl border border-slate-200 dark:border-border/10 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-6">
            {loginError && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <span className="material-symbols-outlined text-red-400 text-lg shrink-0">error</span>
                <p className="text-sm text-red-400 font-medium">
                  {loginError === 'credentials'
                    ? 'Email o contraseña incorrectos. Verifica tus datos e intenta de nuevo.'
                    : loginError === 'not_confirmed'
                    ? 'Tu correo aún no ha sido confirmado. Revisa tu bandeja de entrada.'
                    : 'Ocurrió un error al iniciar sesión. Intenta de nuevo.'}
                </p>
              </div>
            )}
            <form action={login} className="flex flex-col gap-5">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Correo Electrónico</Label>
                  <div className="relative group">
                     <Input 
                      id="email" 
                      name="email"
                      type="email" 
                      placeholder="nombre@ejemplo.com" 
                      className="h-12 bg-slate-50 dark:bg-background-dark border-slate-200 dark:border-border/10 focus:border-primary focus:ring-primary/20 transition-all rounded-xl pl-4 pr-10"
                      required
                    />
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl group-focus-within:text-primary transition-colors">mail</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Contraseña</Label>
                    <Link href="/forgot-password" className="text-xs font-bold text-primary hover:text-blue-600 transition-colors">¿Olvidaste tu contraseña?</Link>
                  </div>
                  <div className="relative group">
                    <Input 
                      id="password" 
                      name="password"
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      className="h-12 bg-slate-50 dark:bg-background-dark border-slate-200 dark:border-border/10 focus:border-primary focus:ring-primary/20 transition-all rounded-xl pl-4 pr-10"
                      required
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              </div>

              <Button type="submit" className="mt-2 w-full h-12 rounded-xl bg-primary hover:bg-blue-600 text-white font-bold text-base transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-[0.98]">
                <span>Iniciar Sesión</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-100 dark:border-border/5"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-surface-dark px-2 text-slate-400 font-bold tracking-widest">O continúa con</span>
              </div>
            </div>

            <Button variant="outline" className="w-full h-12 rounded-xl border-slate-200 dark:border-border/10 hover:bg-slate-50 dark:hover:bg-white/5 font-bold transition-all flex items-center gap-3">
              <Github className="w-5 h-5" />
              <span>GitHub</span>
            </Button>
          </div>

          {/* Footer Link */}
          <div className="text-center pt-4">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              ¿No tienes una cuenta?{" "}
              <Link href="/register" className="text-primary font-bold hover:underline decoration-2 underline-offset-4 decoration-primary/30">
                Regístrate gratis
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Column: Hero/Visual Section */}
      <div className="hidden lg:flex flex-1 relative bg-[#0B2559] overflow-hidden">
        
        {/* Abstract shapes and patterns */}
        <div className="absolute inset-0 z-0">
           <div className="absolute -top-[10%] -right-[10%] w-[80%] h-[80%] bg-[radial-gradient(circle_at_center,_#00B4D8_0%,_transparent_70%)] opacity-20 blur-[100px]" />
           <div className="absolute -bottom-[20%] -left-[20%] w-[70%] h-[70%] bg-[radial-gradient(circle_at_center,_#00B4D8_0%,_transparent_70%)] opacity-10 blur-[100px]" />
           
           {/* Grid pattern overlay */}
           <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        </div>

        <div className="relative z-10 w-full flex flex-col justify-end p-16 space-y-8">
           <div className="space-y-4 max-w-lg">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Acceso Exclusivo
             </div>
             <h2 className="text-5xl font-black text-white leading-tight">
               Lidera la ecografía neuromuscular.
             </h2>
             <p className="text-lg text-blue-100/70 font-medium">
                Accede a lecciones en alta definición, evaluaciones interactivas y material exclusivo diseñado para especialistas.
             </p>
           </div>
           
           {/* Visual element: stylized ultrasound visualization */}
           <div className="flex gap-4">
              {[1, 0.7, 0.4].map((op, i) => (
                <div key={i} className="flex gap-1 items-end">
                   {[35, 52, 28, 58, 42].map((h, j) => (
                     <div 
                      key={j} 
                      className="w-1.5 bg-primary rounded-full transition-all duration-1000 animate-pulse"
                      style={{ height: `${h}px`, opacity: op }} 
                    />
                   ))}
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  )
}
