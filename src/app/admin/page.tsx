import { AdminHeader } from "@/components/admin/AdminHeader"
import { createClient } from "@/lib/supabase/server"
import { Database } from "@/types/supabase"

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    completed: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    pending: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  }
  const labels: Record<string, string> = {
    active: "Activo",
    completed: "Completado",
    pending: "Pendiente",
  }
  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  
  // Fetch profiles (excluyendo admins para las métricas de estudiantes)
  const { data: profilesData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
  const profiles = profilesData?.filter(p => p.role !== 'admin') || [];
  const totalDoctors = profiles.length;

  // Fetch enrollments for real progress data
  const { data: enrollments } = await supabase.from('enrollments').select('*');

  // Calculate completion rate
  let avgProgress = 0;
  if (enrollments && enrollments.length > 0) {
    const totalProgress = enrollments.reduce((sum, e) => sum + (e.progress || 0), 0);
    avgProgress = Math.round(totalProgress / enrollments.length);
  }

  // Fetch payments
  const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const { data: payments } = await supabase.from('payments').select('*').gte('created_at', currentMonthStart);
  
  const totalIncome = payments?.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  const pendingInvoices = payments?.filter(p => p.status === 'pending').length || 0;
  
  const kpiCards = [
    { label: "Ingresos del Mes", value: `$${totalIncome.toLocaleString()}`, change: "-", positive: true, icon: "payments" },
    { label: "Médicos Inscritos", value: totalDoctors.toString(), change: "Total", positive: true, icon: "groups" },
    { label: "Tasa de Finalización", value: `${avgProgress}%`, change: "Media", positive: true, icon: "trending_up" },
    { label: "NPS Score", value: "Pendiente", change: "-", positive: true, icon: "star" }, // Pending actual feedback table
  ];

  const specialtyCounts = profiles?.reduce((acc: Record<string, number>, profile: { specialty?: string | null }) => {
    const spec = profile.specialty || "Otros";
    acc[spec] = (acc[spec] || 0) + 1;
    return acc;
  }, {}) || {};

  const specialtiesList = (Object.entries(specialtyCounts) as [string, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([label, count], index) => {
       const colors = ["bg-primary", "bg-blue-500", "bg-violet-500", "bg-amber-500"];
       const pct = totalDoctors > 0 ? Math.round((count / totalDoctors) * 100) : 0;
       return {
         label: label.length > 15 ? label.substring(0, 15) + "..." : label,
         pct: `${pct}%`,
         color: colors[index % colors.length]
       }
    });

  const recentDoctors = profiles.slice(0, 5).map((p: Database['public']['Tables']['profiles']['Row']) => {
    const userEnrollments = enrollments?.filter(e => e.user_id === p.id) || [];
    const progress = userEnrollments.length > 0 ? Math.max(...userEnrollments.map(e => e.progress || 0)) : 0;
    const isCompleted = progress === 100;
    
    return {
      name: p.full_name || "Usuario",
      specialty: p.specialty || "General",
      city: p.state || "N/A",
      progress: progress,
      status: isCompleted ? "completed" : (progress > 0 ? "active" : "pending")
    };
  });

  return (
    <div className="flex flex-col h-full">
      <AdminHeader title="Panel Ejecutivo" subtitle="Vista general del rendimiento" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {kpiCards.map((card) => (
            <div
              key={card.label}
              className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5 p-5 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <span className="material-symbols-outlined text-primary text-xl">{card.icon}</span>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  card.positive
                    ? "text-emerald-400 bg-emerald-500/10"
                    : "text-red-400 bg-red-500/10"
                }`}>
                  {card.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Alert Banner */}
        {pendingInvoices > 0 && (
          <div className="bg-linear-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-xl px-5 py-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-amber-400 text-xl">warning</span>
            <p className="text-sm text-amber-300 font-medium flex-1">
              Hay <strong>{pendingInvoices} facturas pendientes</strong> de revisión este mes.
            </p>
            <button className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors">
              Ver detalles →
            </button>
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Ventas Mensuales</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Últimos 6 meses</p>
              </div>
              <select className="bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-xs px-3 py-1.5 text-gray-700 dark:text-gray-300 outline-none">
                <option>6 meses</option>
                <option>12 meses</option>
                <option>Este año</option>
              </select>
            </div>
            {/* SVG Chart */}
            <div className="h-48 flex items-end gap-3 px-2">
              {[35, 45, 40, 60, 55, 70].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-[10px] text-gray-400 font-medium">
                    ${(h * 650).toLocaleString()}
                  </span>
                  <div
                    className="w-full rounded-t-lg bg-linear-to-t from-primary/80 to-primary transition-all duration-500 hover:from-primary hover:to-cyan-400"
                    style={{ height: `${h * 2.5}px` }}
                  />
                  <span className="text-[10px] text-gray-500">
                    {["Sep", "Oct", "Nov", "Dic", "Ene", "Feb"][i]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Specialty Distribution */}
          <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5 p-6">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Distribución por Especialidad</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">Top especialidades</p>

            {/* Simple donut representation */}
            <div className="flex justify-center mb-6">
              <div className="relative w-32 h-32">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="3.5" className="text-gray-100 dark:text-white/5" />
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#00B4D8" strokeWidth="3.5" strokeDasharray="35 65" strokeDashoffset="0" />
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#3b82f6" strokeWidth="3.5" strokeDasharray="25 75" strokeDashoffset="-35" />
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#8b5cf6" strokeWidth="3.5" strokeDasharray="20 80" strokeDashoffset="-60" />
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#f59e0b" strokeWidth="3.5" strokeDasharray="20 80" strokeDashoffset="-80" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-gray-900 dark:text-white">{totalDoctors}</span>
                  <span className="text-[10px] text-gray-400">Total</span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              {specialtiesList.map((s) => (
                <div key={s.label} className="flex items-center gap-2.5 text-xs">
                  <span className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                  <span className="text-gray-600 dark:text-gray-300 flex-1">{s.label}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{s.pct}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Doctors Table */}
        <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Médicos Recientes</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Últimas inscripciones</p>
            </div>
            <button className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
              Ver todos →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5">
                  <th className="text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">Médico</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">Especialidad</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">Ciudad</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">Progreso</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {recentDoctors.map((doc: { name: string, specialty: string, city: string, progress: number, status: string }) => (
                  <tr key={doc.name} className="border-b border-gray-50 dark:border-white/3 hover:bg-gray-50 dark:hover:bg-white/2 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-[11px] font-bold text-primary">
                            {doc.name.split(" ").filter((w: string) => w.length > 2).slice(0,2).map((w: string) => w[0]).join("")}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{doc.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-gray-600 dark:text-gray-300">{doc.specialty}</td>
                    <td className="px-6 py-3.5 text-sm text-gray-600 dark:text-gray-300">{doc.city}</td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex-1 h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden max-w-[100px]">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${doc.progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-8">{doc.progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={doc.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  )
}
