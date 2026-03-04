"use client"

import { useState } from "react"
import Link from "next/link"
import { Logo } from "@/components/ui/logo"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { 
  Menu, 
  ArrowRight, 
  PlayCircle, 
  Play, 
  Volume2, 
  Maximize, 
  Scan, 
  Eye, 
  Crosshair, 
  BookOpen, 
  Hand, 
  Footprints, 
  Syringe, 
  Download,
  Hospital,
  GraduationCap,
  FlaskConical,
  Dna,
  HeartPulse
} from "lucide-react"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  return (
    <div className="min-h-screen font-sans bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 overflow-x-hidden antialiased">
      {/* Navbar */}
      <div className="sticky top-0 z-50 w-full border-b border-surface-highlight bg-background-dark/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo variant="dark" compact />
          <nav className="hidden md:flex items-center gap-8">
            <Link className="text-slate-300 hover:text-white text-sm font-medium transition-colors" href="#program">Programa</Link>
            <Link className="text-slate-300 hover:text-white text-sm font-medium transition-colors" href="#methodology">Metodología</Link>
            <Link className="text-slate-300 hover:text-white text-sm font-medium transition-colors" href="/temario">Temario</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/register">
                <Button className="hidden sm:flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-bold text-white transition hover:bg-primary/90">
                    Inscribirme Ahora
                </Button>
            </Link>
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="sm:hidden">
                <button className="text-white p-2">
                  <Menu className="w-6 h-6" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-background-dark border-surface-highlight w-64">
                <nav className="flex flex-col gap-6 pt-8">
                  <Link href="#program" className="text-slate-300 hover:text-white text-sm font-medium transition-colors" onClick={() => setMobileMenuOpen(false)}>Programa</Link>
                  <Link href="#methodology" className="text-slate-300 hover:text-white text-sm font-medium transition-colors" onClick={() => setMobileMenuOpen(false)}>Metodología</Link>
                  <Link href="/temario" className="text-slate-300 hover:text-white text-sm font-medium transition-colors" onClick={() => setMobileMenuOpen(false)}>Temario</Link>
                  <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full h-10 rounded-lg bg-primary text-white font-bold text-sm">Inscribirme Ahora</Button>
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      <main className="flex flex-col">
        {/* Hero Section */}
        <section className="relative flex min-h-[600px] flex-col justify-center overflow-hidden py-16 lg:py-24">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-linear-to-r from-background-dark via-background-dark/90 to-transparent z-10"></div>
            <div className="absolute inset-0 bg-linear-to-t from-background-dark via-transparent to-transparent z-10"></div>
            {/* Using img for external source to avoid Next.js config requirement for now */}
            <img 
                alt="Doctor performing ultrasound guided procedure in dark room" 
                className="h-full w-full object-cover opacity-60" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCLvALLsJGZ5dQL1KrpVdL29z2luaqM1sWjPhoQxywfzZx7BTo-Ku18z5r7z2tc_oCAAJF0NvD_62VJD2V8MolhlHeXrKRdbFupQb7XWmoIm1ioeAYgU4jWcEOaUEFNWRz6tsz-IJ2q_JSOhOk7-UFP2aiqUmd25wQtU6CS6GC6lo83yAKotWdSWtwJitHwjhTJpG2t91D1DL6VJEU393PvV6KsAGD_QuCngHR6aunqn05FVVKRP0j12GBuNwPpkAn-HTSHcs-tBYBr"
            />
          </div>
          <div className="relative z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 mb-6 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span className="text-xs font-medium text-primary-300 uppercase tracking-wider">Nueva Cohorte Abierta</span>
              </div>
              <h1 className="text-4xl font-black text-white sm:text-5xl md:text-6xl lg:text-7xl tracking-tighter mb-6 leading-[1.1]">
                Diplomado Internacional de <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-blue-400">Rehabilitación Intervencionista</span>
              </h1>
              <p className="mt-4 max-w-xl text-lg text-slate-300 leading-relaxed mb-8">
                Domina procedimientos guiados por ecografía con entrenamiento clínico aplicado, casos reales y metodología de alta precisión. Eleva tu práctica con un programa estructurado para resultados medibles.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/register">
                  <button className="h-12 px-8 rounded-lg bg-primary text-white font-bold text-base transition-all hover:bg-blue-600 hover:shadow-[0_0_20px_rgba(23,115,207,0.5)] flex items-center justify-center gap-2 w-full sm:w-auto">
                    <span>Inscribirme Ahora</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
                <Link href="/temario">
                  <button className="h-12 px-8 rounded-lg border border-slate-600 bg-surface-dark/50 backdrop-blur text-white font-medium hover:bg-surface-dark transition-colors flex items-center justify-center gap-2 w-full sm:w-auto">
                    <PlayCircle className="w-5 h-5" />
                    <span>Ver Temario</span>
                  </button>
                </Link>
              </div>
              <div className="mt-10 flex items-center gap-4 text-sm text-slate-400">
                <div className="flex -space-x-2">
                  <img alt="Doctor profile" className="inline-block h-8 w-8 rounded-full ring-2 ring-background-dark object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCqnGJUfqpTKADcwFI_u-97C-OsXKVgAiOncoIOLWPAPdbiMJVtaYeDcm_E3IK3t0fbIlo-D5erHDpFZg1lQsw4xPxtHVsZHCuCdQCDNug91riuepF_PZ66knUuhdLIqJ66VwWcMjWbGiwdZJccD6lSoUdNF_XyIG964qUVtVbgxkwLLzgELWLGglnAMyK-fkidFMRi0YWnEda5HoSoOUP91KmIIOHTwJqBzvzK93umUfexJTRDfU5xeSr1F2lBvlgjNpKnmTQ5bczm"/>
                  <img alt="Specialist profile" className="inline-block h-8 w-8 rounded-full ring-2 ring-background-dark object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBqhKsSwuwJzVrTWmyBBS3in3SRvncMfijApG0Be60gar6NciG1qROJ6vVpGnv-Hlvc3JxL5651fg8GxmK9FhAVNFeqS60IWaNDGpSZ23AH1hat4-b14CFFU6-WGQh38RCyk_2tcmQ7RiUUTXDUHFLEN9H194phsdrRTqxDPGuca64keJxZGh8-wQZvmpfxKr05RvPAKeuNBMrAM652Gj_Jf8C3I0vwSxfinD_67wBAVWkkqO_TSOTzPPGjcWWO4aRxrj_VNhd_b4os"/>
                  <img alt="Student profile" className="inline-block h-8 w-8 rounded-full ring-2 ring-background-dark object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCO-D0GR2SgeU1F0uwvB0n_2QoDZ1sQW5X3VGPE6ywEmU7EXgqRgQS9l--62DBv61sP_Ew2gX3QIr_XjYyADyzjzeMMRkjGXQxO7X0w7lFyG_A8M_mQwLUS-FxRViZHPRQ0Qtuhk_TyEJS6DqZQlYmanFD6XsTvYpq81ZzXguqdQnQQEQwALhfw5BrieUG7C56Bu0MARYpLe8-dbqCMmwYP30rkokbx3A1--k-Em3hWJ_-Cusm7tmIu5zIT3Q_TtiJC5A6cIAB3PXY1"/>
                </div>
                <p>Únete a <span className="text-white font-semibold">1,200+</span> profesionales médicos</p>
              </div>
              <div className="mt-6 max-w-2xl rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-blue-100">
                <span className="font-semibold text-white">+</span>{" "}
                Certificado con aval académico por parte de la{" "}
                <span className="font-semibold text-white">Sociedad Mexicana de Medicina Física y Rehabilitación A.C.</span>
              </div>
            </div>
          </div>
        </section>

        {/* Partners Section */}
        <section className="border-y border-surface-highlight bg-surface-dark py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm font-medium text-slate-500 mb-6 uppercase tracking-widest">Respaldo Científico Por</p>
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5 items-center justify-items-center opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
              <div className="flex items-center gap-2 font-bold text-xl text-white"><Hospital className="w-8 h-8" />ASOC_MED</div>
              <div className="flex items-center gap-2 font-bold text-xl text-white"><GraduationCap className="w-8 h-8" />UNIV_INTL</div>
              <div className="flex items-center gap-2 font-bold text-xl text-white"><FlaskConical className="w-8 h-8" />CONSEJO_CI</div>
              <div className="flex items-center gap-2 font-bold text-xl text-white"><Dna className="w-8 h-8" />NEURO_LAB</div>
              <div className="hidden lg:flex items-center gap-2 font-bold text-xl text-white"><HeartPulse className="w-8 h-8" />INST_CARD</div>
            </div>
          </div>
        </section>

        {/* Methodology Section */}
        <section className="py-20 bg-background-dark relative" id="methodology">
            {/* Grid Pattern manually simulated/styled in CSS or just use a subtle background if available, user provided style class bg-grid-pattern which we missed. 
                Let's add the style directly or assume global CSS. 
            */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#293038 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1">
                <div className="relative rounded-2xl border border-surface-highlight bg-surface-dark p-2 shadow-2xl shadow-blue-900/20">
                  <div className="flex items-center justify-between px-4 py-2 bg-black/40 rounded-t-lg border-b border-surface-highlight mb-1">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="text-xs text-slate-400 font-mono">LIVE_FEED_01.mp4</div>
                  </div>
                  <div className="grid grid-cols-2 gap-1 h-64 sm:h-80 bg-black">
                    <div className="relative w-full h-full overflow-hidden group">
                      <img alt="Close up of medical procedure on arm" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCx17edKVZNneG8QGArWTBxXXm_CjUvMkyzub-eZJXOLnDiuTBQZgMndaHQHOK005BybDUcvSo79sgwSxtKegTl-fLSUN78d5ubBmbOEIldX7xr8B7liLVWkfQHxGVq1vTc4Wl6TyASF4reBN__fJ24Nor-90ljNFzhLRpxcaZAzxnr7sYg8wUldH7jJah4PxhbyugVOJ7YplhH1J2H6mgBvIYauAw7S1uwLvTdx7pNrlvofECbjXXlwrlQxAQa3q97v0x27pmQowG9"/>
                      <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-[10px] text-white font-mono border border-white/10">CAM EXT 1</div>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 border border-primary/50 rounded-full flex items-center justify-center">
                        <div className="w-1 h-1 bg-primary rounded-full"></div>
                      </div>
                    </div>
                    <div className="relative w-full h-full overflow-hidden group bg-slate-900">
                      <img alt="Ultrasound monitor screen showing muscle tissue" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity mix-blend-luminosity" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCXDZvhn7NnXO6vTSXiYm-5Xfqy_x4EVyeEbu3160WICZnXGdp5p7S6JHZPV8b-Qahui3iabA-2gKZrqcHPHYZ_2uWT8jtHChjB4KUIZfoM60tc4zcN_i1bqV3jvtuIKjSShqdhvn3u7E0lb5g-Mm-UI0D5-kflPVJecYJd10pm0ZN2OBQx5SO5JWSKGrHo08_hpz3NbtmQLWE39Xtbt34EotRfrt5fVPM1iCxIcQKIIb7T4veND3v7nPXLPFengz95MRCVnf5xokRL"/>
                      <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-[10px] text-white font-mono border border-white/10">FEED ECO</div>
                      <div className="absolute top-4 right-4 text-primary text-xs font-mono animate-pulse">GRABANDO...</div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between px-4 py-2">
                    <div className="flex items-center gap-4 text-slate-400">
                      <Play className="bg-transparent hover:text-white cursor-pointer w-5 h-5" />
                      <Volume2 className="bg-transparent hover:text-white cursor-pointer w-5 h-5" />
                      <div className="h-1 w-24 bg-surface-highlight rounded-full overflow-hidden">
                        <div className="h-full w-1/3 bg-primary"></div>
                      </div>
                      <span className="text-xs font-mono">04:23 / 12:45</span>
                    </div>
                    <Maximize className="bg-transparent hover:text-white cursor-pointer w-5 h-5" />
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2 flex flex-col gap-6">
                <div className="inline-flex w-fit items-center gap-2 rounded-lg bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                  <Scan className="w-5 h-5" />
                  Tecnología de Doble Pantalla
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  La Ventaja de la Pantalla Dual
                </h2>
                <p className="text-lg text-slate-400">
                  Experimenta nuestro exclusivo reproductor de video dual. Observa la anatomía externa y la colocación de la aguja lado a lado con la señal de ultrasonido en tiempo real para una precisión inigualable.
                </p>
                <div className="grid gap-6">
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-highlight text-primary">
                      <Eye className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Aprendizaje Simultáneo</h3>
                      <p className="mt-1 text-sm text-slate-400">Observa los movimientos de la mano y la imagen interna resultante en el momento exacto.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-highlight text-primary">
                      <Crosshair className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Visualización de la Aguja</h3>
                      <p className="mt-1 text-sm text-slate-400">Domina el arte del seguimiento de la aguja con superposiciones de alto contraste y comentarios de expertos.</p>
                    </div>
                  </div>
                </div>
                <div className="pt-4">
                  <a className="inline-flex items-center gap-2 text-primary hover:text-blue-400 font-semibold transition-colors group" href="#methodology">
                    Ver Demostración
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Program / Modules Section */}
        <section className="py-20 bg-surface-dark border-t border-surface-highlight" id="program">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 md:text-center max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Módulos del Plan de Estudios</h2>
              <p className="mt-4 text-lg text-slate-400">Un camino integral desde la física básica hasta la intervención avanzada. Diseñado para una rápida adquisición de habilidades.</p>
            </div>
            <div className="mb-8 rounded-2xl border border-primary/25 bg-primary/10 p-5 text-center">
              <p className="text-sm sm:text-base text-blue-100">
                Al concluir el programa y cumplir los criterios académicos, obtendrás{" "}
                <span className="font-semibold text-white">Certificado con aval académico por parte de la Sociedad Mexicana de Medicina Física y Rehabilitación A.C.</span>
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="group relative flex flex-col overflow-hidden rounded-xl border border-surface-highlight bg-background-dark p-6 transition-all hover:border-primary/50 hover:bg-surface-highlight/50">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 group-hover:text-blue-300 transition-colors">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-white">Fundamentos</h3>
                <p className="mb-6 flex-1 text-sm text-slate-400">Física del ultrasonido, botonología y reconocimiento de artefactos. La base esencial para todos los procedimientos.</p>
                <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-4">
                  <span className="text-xs font-mono text-slate-500">MÓD 01</span>
                  <span className="text-xs font-medium text-primary">4 Semanas</span>
                </div>
              </div>
              <div className="group relative flex flex-col overflow-hidden rounded-xl border border-surface-highlight bg-background-dark p-6 transition-all hover:border-primary/50 hover:bg-surface-highlight/50">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 group-hover:text-emerald-300 transition-colors">
                  <Hand className="w-6 h-6" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-white">Miembro Superior</h3>
                <p className="mb-6 flex-1 text-sm text-slate-400">Patología de hombro, codo y muñeca. Técnicas de inyección para manguito rotador y túnel carpiano.</p>
                <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-4">
                  <span className="text-xs font-mono text-slate-500">MÓD 02</span>
                  <span className="text-xs font-medium text-primary">6 Semanas</span>
                </div>
              </div>
              <div className="group relative flex flex-col overflow-hidden rounded-xl border border-surface-highlight bg-background-dark p-6 transition-all hover:border-primary/50 hover:bg-surface-highlight/50">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 group-hover:text-amber-300 transition-colors">
                  <Footprints className="w-6 h-6" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-white">Miembro Inferior</h3>
                <p className="mb-6 flex-1 text-sm text-slate-400">Intervenciones de cadera, rodilla y tobillo. Enfoque en fascia plantar, tendón de Aquiles e inyecciones intraarticulares.</p>
                <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-4">
                  <span className="text-xs font-mono text-slate-500">MÓD 03</span>
                  <span className="text-xs font-medium text-primary">6 Semanas</span>
                </div>
              </div>
              <div className="group relative flex flex-col overflow-hidden rounded-xl border border-surface-highlight bg-background-dark p-6 transition-all hover:border-primary/50 hover:bg-surface-highlight/50">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 group-hover:text-purple-300 transition-colors">
                  <Syringe className="w-6 h-6" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-white">Infiltración</h3>
                <p className="mb-6 flex-1 text-sm text-slate-400">Hidrodisección avanzada, bloqueos nerviosos y aplicaciones de medicina regenerativa (PRP/Células Madre).</p>
                <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-4">
                  <span className="text-xs font-mono text-slate-500">MÓD 04</span>
                  <span className="text-xs font-medium text-primary">4 Semanas</span>
                </div>
              </div>
            </div>
            <div className="mt-12 text-center">
              <Link href="/temario" className="inline-flex items-center justify-center rounded-lg border border-surface-highlight bg-transparent px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-surface-highlight">
                Ver Temario Completo
                <Download className="ml-2 w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="relative py-20 bg-primary overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1551601651-2a8555f1a136?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] opacity-10 bg-cover bg-center mix-blend-overlay"></div>
          <div className="mx-auto max-w-4xl px-4 text-center relative z-10">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-6">
              ¿Listo para elevar tu práctica médica?
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-blue-100 mb-10">
              Únete a la próxima cohorte de especialistas en rehabilitación intervencionista. Plazas limitadas para el próximo semestre.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/register">
                <button className="rounded-lg bg-white px-8 py-4 text-base font-bold text-primary shadow-lg transition-transform hover:scale-105">
                  Inscribirme Ahora
                </button>
              </Link>
              <a href="mailto:drmoralesrehabilita@gmail.com" className="rounded-lg border border-white/30 bg-primary-600/50 px-8 py-4 text-base font-bold text-white hover:bg-primary-700/50 transition-colors inline-block">
                Contactar a Admisiones
              </a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-background-dark py-12 border-t border-surface-highlight">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <Logo variant="dark" compact />
              <div className="text-slate-500 text-sm">
                © {new Date().getFullYear()} Diplomado en Rehabilitación Intervencionista. Todos los derechos reservados.
              </div>
              <div className="flex gap-6">
                <Link className="text-slate-400 hover:text-white transition-colors" href="/privacidad">Privacidad</Link>
                <Link className="text-slate-400 hover:text-white transition-colors" href="/terminos">Términos</Link>
                <Link className="text-slate-400 hover:text-white transition-colors" href="/soporte">Soporte</Link>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
