---
name: Admin CRUD Operations
description: Guía para implementar operaciones CRUD de administrador en CursoUSG. Cubre activación/desactivación de alumnos, aprobación de acceso, eliminación en cascada, y protección contra auto-eliminación.
---

# Admin CRUD Operations

## Operaciones Existentes

| Acción | Función | Archivo |
|--------|---------|---------|
| Activar/Desactivar alumno | `toggleStudentStatus()` | `src/app/actions/admin.ts` |
| Aprobar solicitud de acceso | `approveAccessRequest()` | `src/app/actions/admin.ts` |
| Eliminar alumno completo | `deleteStudent()` | `src/app/actions/admin.ts` |

## Flujo de Eliminación en Cascada

Al eliminar un alumno, el orden de operaciones es **crítico** para evitar FK violations:

```
1. lesson_progress  →  DELETE WHERE user_id = X
2. enrollments      →  DELETE WHERE user_id = X
3. profiles         →  DELETE WHERE id = X
4. auth.users       →  admin.deleteUser(X)
```

> ⚠️ Siempre usar `createAdminClient()` para eliminación en cascada, ya que RLS bloquearía las operaciones cruzadas.

## Protección contra Auto-Eliminación

```typescript
if (user.id === userId) {
  return { success: false, error: "No puedes eliminar tu propia cuenta" }
}
```

Esta verificación SIEMPRE debe estar antes de cualquier operación de eliminación de usuario.

## Toggle de Estado

El patrón de toggle es simple pero verifica que la actualización realmente afectó filas:

```typescript
const { data, error } = await adminClient
  .from("profiles")
  .update({ is_active: isActive })
  .eq("id", userId)
  .select("id, is_active")

if (!data || data.length === 0) {
  return { success: false, error: "No se encontró el usuario" }
}
```

## Panel Admin: Datos en Tiempo Real

El dashboard admin (`src/app/admin/page.tsx`) calcula:
- **Total de médicos**: `profiles.filter(role !== 'admin').length`
- **Tasa de finalización**: promedio de `enrollments.progress`
- **Ingresos del mes**: `payments.filter(status === 'paid').reduce(sum, amount)`
- **Distribución por especialidad**: agrupación de `profiles.specialty`

### ⚠️ Problema Conocido: Gráfico de Ventas Hardcodeado
El gráfico de barras SVG usa datos estáticos `[35, 45, 40, 60, 55, 70]`. Para datos reales, se necesita:
1. Agrupar `payments` por mes
2. Pasar los datos como prop al componente del gráfico

## Flujo de Aprobación de Acceso

```
Registro → is_active: false → /pending → Admin aprueba → is_active: true → /dashboard
```

Columnas relevantes en `profiles`:
- `is_active` (boolean) — controla acceso al contenido
- `role` (string) — "admin" o "student"

## Tabla de Alumnos (Admin)

La vista de alumnos está en `src/app/admin/alumnos/`. Requiere:
- Filtrado por estado (activo/pendiente/completado)
- Búsqueda por nombre/email/especialidad (🔴 no implementado aún)
- Acciones de bulk (🔴 no implementado aún)

## Logging

Todos los actions de admin logean en consola con el prefijo `[Admin]`:
```typescript
console.log("[Admin] toggleStudentStatus success:", data)
console.error("[Admin] deleteStudent auth error:", JSON.stringify(error))
```
