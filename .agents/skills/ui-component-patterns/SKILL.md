---
name: UI Component Patterns
description: Patrones de diseño UI para CursoUSG con shadcn/ui, Tailwind CSS v4, Radix primitives, Material Symbols, y dark mode. Incluye cards, tablas, progress bars, sidebars, y convenciones de estilo.
---

# UI Component Patterns

## Stack de UI

| Capa | Tecnología | Propósito |
|------|-----------|-----------|
| CSS | Tailwind CSS v4 | Utility-first styles |
| Componentes | shadcn/ui | Componentes base (Dialog, Select, Switch, etc.) |
| Primitivas | Radix UI | Accesibilidad (Accordion, Dropdown, Checkbox, etc.) |
| Íconos | Material Symbols Outlined | Iconografía consistente |
| Themes | next-themes | Dark mode toggle |
| Toasts | Sonner | Notificaciones temporales |

## Dark Mode

Configurado con `next-themes` y clases CSS custom:
```css
/* globals.css */
.bg-background-light { ... }
.dark .bg-background-dark { ... }
.bg-surface-light { ... }
.dark .bg-surface-dark { ... }
```

Patrón de uso:
```tsx
<div className="bg-surface-light dark:bg-surface-dark text-gray-900 dark:text-white">
```

## Cards con Efecto Decorativo

Patrón prevalente en dashboard y admin:
```tsx
<div className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden relative group">
  {/* Blur decorativo */}
  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
  <div className="p-6 md:p-8 relative z-10">
    {/* Contenido */}
  </div>
</div>
```

## Status Badges

```tsx
function StatusBadge({ status }: { status: string }) {
  const styles = {
    active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    completed: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    pending: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  }
  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}
```

## Tag/Pill de Estado

```tsx
<span className="px-3 py-1 text-xs font-semibold text-primary bg-primary/10 rounded-full border border-primary/20">
  EN PROGRESO
</span>
```

## Progress Bars

```tsx
<div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
  <div
    className="bg-primary h-3 rounded-full shadow-lg shadow-primary/30 transition-all duration-500"
    style={{ width: `${percent}%` }}
  />
</div>
```

## Íconos (Material Symbols)

Se usa Google Material Symbols Outlined (no Material Icons):
```tsx
<span className="material-symbols-outlined">play_circle</span>
<span className="material-symbols-outlined text-primary text-xl">videocam</span>
```

Íconos comunes: `play_circle`, `lock`, `description`, `quiz`, `image`, `link`, `check_circle`, `history`, `school`, `workspace_premium`, `calendar_month`, `warning`, `groups`, `trending_up`, `star`, `payments`, `bolt`, `add_circle`.

## KPI Cards (Admin)

```tsx
<div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5 p-5 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group">
  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
    <span className="material-symbols-outlined text-primary text-xl">{icon}</span>
  </div>
  <p className="text-2xl font-bold">{value}</p>
  <p className="text-xs text-gray-500">{label}</p>
</div>
```

## Tablas Responsivas

```tsx
<div className="overflow-x-auto">
  <table className="w-full">
    <thead>
      <tr className="border-b border-gray-100 dark:border-white/5">
        <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">
          Columna
        </th>
      </tr>
    </thead>
    <tbody>
      <tr className="border-b border-gray-50 dark:border-white/3 hover:bg-gray-50 dark:hover:bg-white/2 transition-colors">
        <td className="px-6 py-3.5">{contenido}</td>
      </tr>
    </tbody>
  </table>
</div>
```

## Sidebars

Dos sidebars en la app:
- **Admin**: `AdminSidebar.tsx` — navegación entre secciones admin
- **Student**: `sidebar.tsx` (en `components/dashboard/`) — navegación de contenido del curso
- **Layout**: `Sidebar.tsx` + `SidebarClient.tsx` (en `components/layout/`) — sidebar general colapsable

## Botones Primarios

```tsx
<Link className="bg-primary hover:bg-cyan-500 text-white font-semibold py-3 px-6 rounded-xl shadow-lg shadow-primary/25 transition-transform active:scale-95 flex items-center justify-center gap-2">
  <span className="material-symbols-outlined">play_circle</span>
  Continuar Lección
</Link>
```

## Color Principal

El color `primary` del proyecto es cian/turquesa (`#00B4D8` o `#0ea5e9`), definido en `globals.css` como variable CSS.

## Archivos de Referencia
- `src/app/globals.css` — sistema de diseño y variables
- `src/components/ui/` — componentes shadcn base
- `src/components/admin/AdminSidebar.tsx` — sidebar admin
- `src/components/dashboard/sidebar.tsx` — sidebar estudiante
- `src/components/dashboard/header.tsx` — header del dashboard
- `components.json` — configuración shadcn
