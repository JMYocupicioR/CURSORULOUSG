---
name: Forum & Community
description: Sistema de foro comunitario con threads, posts, likes vía RPC, categorías, y manejo de autorización. Incluye patrones de creación/eliminación y revalidación de paths.
---

# Forum & Community

## Tablas

| Tabla | Campos Clave |
|-------|-------------|
| `forum_threads` | `id`, `author_id`, `title`, `body`, `category`, `created_at` |
| `forum_posts` | `id`, `thread_id`, `author_id`, `body`, `created_at` |
| `forum_likes` | Manejado por RPC `toggle_thread_like` |

## Operaciones del Foro

### Crear Thread
```typescript
export async function createForumThread(data: {
  title: string; body: string; category: string
}) {
  const supabase = await createClient()
  const { data: user } = await supabase.auth.getUser()
  if (!user?.user?.id) return { success: false, error: "No autenticado" }

  // Validación básica
  if (!data.title.trim() || !data.body.trim()) {
    return { success: false, error: "El título y el contenido son requeridos." }
  }

  await supabase.from("forum_threads").insert({
    author_id: user.user.id,
    title: data.title.trim(),
    body: data.body.trim(),
    category: data.category || "General",
  })

  revalidatePath("/community")
}
```

### Crear Post (Respuesta)
```typescript
export async function createForumPost(data: {
  threadId: string; body: string
}) {
  // Similar a createForumThread pero con validación de body
  await supabase.from("forum_posts").insert({
    thread_id: data.threadId,
    author_id: user.user.id,
    body: data.body.trim(),
  })

  // Revalidar tanto el thread individual como la lista
  revalidatePath(`/community/${data.threadId}`)
  revalidatePath("/community")
}
```

### Toggle Like (RPC)
```typescript
export async function toggleThreadLike(threadId: string) {
  const { data: result } = await supabase.rpc("toggle_thread_like", {
    p_thread_id: threadId,
  })
  // El RPC maneja la lógica de insertar/eliminar el like
  revalidatePath("/community")
  return { success: true, data: result?.[0] }
}
```

> La función RPC `toggle_thread_like` está definida en las migraciones SQL y maneja la lógica de insertar o eliminar el like atómicamente.

### Eliminar Thread
```typescript
export async function deleteForumThread(threadId: string) {
  await supabase.from("forum_threads").delete().eq("id", threadId)
  revalidatePath("/community")
}
```

> ⚠️ La eliminación de thread NO verifica si el usuario es el autor o admin. Esto se maneja via RLS policies en Supabase (solo el autor o admin puede eliminar).

## Categorías

Las categorías son strings libres. Categoría por defecto: `"General"`.

Para agregar categorías fijas, se necesitaría:
1. Enum en la DB o tabla de categorías
2. Select en el UI de creación de thread

## Revalidación Multi-Path

El foro es el único módulo que revalida múltiples paths en una sola acción:
```typescript
revalidatePath(`/community/${data.threadId}`)  // Thread individual
revalidatePath("/community")                    // Lista de threads
```

## Funcionalidad NO Implementada (Oportunidades)
- 🔴 Edición de threads/posts
- 🔴 Reportar contenido inapropiado
- 🔴 Moderación por admin (pin, lock, mover)
- 🔴 Notificaciones de respuestas
- 🔴 Búsqueda/filtro de threads
- 🔴 Paginación de posts
- 🔴 Menciones (@usuario)
- 🔴 Markdown/rich text en posts
- 🔴 Archivos adjuntos

## Setup SQL

El archivo `supabase_setup_forum.sql` contiene el esquema inicial del foro con:
- Tablas `forum_threads`, `forum_posts`
- Función RPC `toggle_thread_like`
- RLS policies para lectura pública y escritura autenticada

## Archivos de Referencia
- `src/app/actions/forum.ts` — server actions del foro
- `src/app/community/` — páginas del foro
- `supabase_setup_forum.sql` — esquema SQL del foro
