---
name: Supabase Server Actions Pattern
description: Patrón estándar para crear server actions seguros con Supabase en CursoUSG. Incluye verificación de admin, manejo de errores, revalidación, y uso de service role client.
---

# Supabase Server Actions Pattern

## Estructura Base

Todos los server actions en CursoUSG siguen el mismo patrón:

```typescript
"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
```

## Patrón de Verificación de Admin

Existen dos variantes según el nivel de acceso requerido:

### Variante 1: Verificación inline (usada en `admin.ts`)
```typescript
export async function myAdminAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: "No autenticado" }
  }

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (callerProfile?.role !== "admin") {
    return { success: false, error: "Sin permisos de administrador" }
  }

  // ... operación con adminClient o supabase
}
```

### Variante 2: Helper `verifyAdmin()` (usada en `contentSetup.ts`)
```typescript
async function verifyAdmin(supabase: SupabaseClient) {
  const { data: user } = await supabase.auth.getUser()
  if (!user?.user) return false
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.user.id).single()
  return profile?.role === "admin"
}

export async function myAction(data: { ... }) {
  const supabase = await createClient()
  if (!(await verifyAdmin(supabase))) {
    return { success: false, error: "Not an admin" }
  }
  // ...
}
```

## Cuándo Usar `createAdminClient` vs `createClient`

| Cliente | Uso | RLS |
|---------|-----|-----|
| `createClient()` | Operaciones del usuario autenticado | ✅ Respeta RLS |
| `createAdminClient()` | Operaciones admin que requieren bypass | ❌ Bypass total |

**Regla**: Usa `createAdminClient()` solo cuando:
- Modificas datos de OTRO usuario (ej: `toggleStudentStatus`)
- Necesitas eliminar datos en cascada cruzando tablas con RLS
- Accedes a `auth.admin.deleteUser()`

## Return Type Estándar

Todos los actions retornan:
```typescript
Promise<{ success: boolean; error?: string; [key: string]: any }>
```

## Revalidación

Siempre llamar `revalidatePath()` después de mutaciones exitosas:
```typescript
revalidatePath("/admin/alumnos")    // para cambios de estudiantes
revalidatePath("/admin/contenido")  // para cambios de contenido
revalidatePath("/dashboard")        // para progreso del estudiante
revalidatePath("/community")        // para cambios del foro
```

## Archivos de Referencia
- `src/app/actions/admin.ts` — CRUD de alumnos
- `src/app/actions/contentSetup.ts` — gestión de contenido y quizzes
- `src/app/actions/certificates.ts` — sistema de certificados
- `src/app/actions/forum.ts` — foro comunitario
- `src/app/actions/stripe.ts` — pagos
- `src/lib/supabase/server.ts` — cliente SSR
- `src/lib/supabase/admin.ts` — cliente service role

## Errores Comunes a Evitar
1. **No usar `createClient` sin `await`** — es async en este proyecto
2. **No olvidar `revalidatePath`** — sin esto, el cache de Next.js mostrará datos viejos
3. **No asumir que el usuario existe** — siempre verificar `user?.user?.id`
4. **Error code `PGRST116`** — significa "no rows found" en Supabase, no es un error real en muchos contextos (ej: primer enrollment)
