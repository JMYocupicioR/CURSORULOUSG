---
name: Content Management with Mux
description: Gestión de contenido educativo con Mux video, quizzes, documentos, e imágenes. Cubre el flujo completo de upload, tipos de lección, QuizBuilder, reordenamiento drag-and-drop, y limpieza de storage.
---

# Content Management with Mux

## Tipos de Lección

| Tipo | `lesson_type` | Campos Clave | Función de Creación |
|------|--------------|--------------|---------------------|
| Video | `"video"` | `mux_asset_id`, `mux_playback_id`, `mux_upload_id` | `createMuxDirectUpload()` |
| Documento | `"document"` | `materials: [{title, url}]` | `createDocumentLesson()` |
| Imagen | `"image"` | `thumbnail_url` | `createImageLesson()` |
| Link | `"link"` | `materials: [{title, url}]` | `createLinkLesson()` |
| Quiz | `"quiz"` | Quiz ID en tabla `quizzes` | `createQuiz()` |

## Flujo de Video con Mux

### 1. Crear Direct Upload
```typescript
const upload = await mux.video.uploads.create({
  cors_origin: "*",
  new_asset_settings: {
    playback_policy: ["public"],
    video_quality: "basic",
    normalize_audio: true,
  },
  test: process.env.NODE_ENV === "development",
})
```

### 2. Guardar Lección Borrador
Se crea la lección con `is_published: false` y `mux_upload_id`:
```typescript
await supabase.from("lessons").insert({
  module_id,
  title: title || "Nueva Lección (Procesando Video...)",
  lesson_type: "video",
  mux_upload_id: upload.id,
  is_published: false
})
```

### 3. Webhook de Mux
El webhook en `src/app/api/webhooks/` recibe el evento `video.asset.ready` con el `asset_id` y `playback_id` finales. Estos se actualizan en la lección.

### 4. Player Dual
El componente `DualPlayer.tsx` soporta dos streams simultáneos (cámara + ultrasonido).

## QuizBuilder

El `QuizBuilder.tsx` (~36KB) es el componente más complejo. Soporta:
- Preguntas con opciones múltiples
- Feedback clínico por opción (`feedback_clinical`)
- Puntaje por pregunta y dificultad
- Preguntas críticas (`is_critical`)
- Imágenes de referencia (`image_url`)
- Perlas clínicas (`pearl`)
- Referencias bibliográficas (`source_reference`)
- Hallazgos ecográficos (`findings: [{type, label, value}]`)

### Flujo de Quiz
```
createQuiz() → inserta quiz + questions
updateQuiz() → borra questions previas → re-inserta (delete + insert pattern)
submitQuizAttempt() → registra intento → si passed, marca lección completada
```

## Módulos

### Crear/Editar
```typescript
createModule({ title, description, thumbnail_url, prerequisite_module_id })
updateModule(id, { title, description, thumbnail_url, prerequisite_module_id })
```

### Prerequisitos
Los módulos pueden tener `prerequisite_module_id` que bloquea el acceso hasta completar el módulo anterior.

## Reordenamiento (Drag & Drop)

```typescript
// Actualiza order_index en paralelo para todos los elementos
const promises = lessonIds.map((id, index) =>
  supabase.from("lessons").update({ order_index: index }).eq("id", id)
)
await Promise.all(promises)
```

Componente: `SortableLessonItem.tsx` usa `@dnd-kit/core` y `@dnd-kit/sortable`.

## Limpieza de Storage al Eliminar

Al eliminar módulo o lección, se limpian archivos huérfanos:

```typescript
// Extraer paths de storage
const path = thumbnailUrl.split('/thumbnails/')[1]  // bucket: thumbnails
const mPath = materialUrl.split('/docs/')[1]          // bucket: docs

// Limpiar después de eliminar de DB
await supabase.storage.from("thumbnails").remove(thumbnailsToDelete)
await supabase.storage.from("docs").remove(docsToDelete)
```

## Archivos de Referencia
- `src/app/actions/contentSetup.ts` — todas las funciones CRUD
- `src/components/admin/QuizBuilder.tsx` — editor de quizzes
- `src/components/admin/UploadEngine.tsx` — motor de subida
- `src/components/admin/SortableLessonItem.tsx` — drag & drop
- `src/components/player/DualPlayer.tsx` — reproductor dual
- `src/app/api/webhooks/` — webhook de Mux
