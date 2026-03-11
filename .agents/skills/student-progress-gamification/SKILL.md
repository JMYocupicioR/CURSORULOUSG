---
name: Student Progress & Gamification
description: Sistema de tracking de progreso por lección/módulo, racha de estudio (study streak), actividad reciente, prerequisitos, y gamificación del aprendizaje.
---

# Student Progress & Gamification

## Tablas Involucradas

| Tabla | Propósito |
|-------|-----------|
| `lesson_progress` | Track individual: `user_id`, `lesson_id`, `is_completed`, `score`, `completed_at` |
| `enrollments` | Progreso global por módulo: `user_id`, `module_id`, `progress` (0-100) |
| `quiz_attempts` | Historial de intentos de quiz: `score`, `passed` |

## Completar una Lección

```typescript
export async function completeLessonProgress(lessonId: string, score: number | null = null) {
  await supabase.from("lesson_progress").upsert({
    user_id: user.id,
    lesson_id: lessonId,
    is_completed: true,
    score: score,
    completed_at: new Date().toISOString()
  }, { onConflict: "user_id, lesson_id" })  // ← upsert evita duplicados
}
```

## Flujo de Quiz

```
1. Estudiante responde quiz
2. submitQuizAttempt() → registra en quiz_attempts
3. Si passed === true:
   └─→ completeLessonProgress() → marca lección como completada
4. Un trigger de PostgreSQL recalcula enrollments.progress
```

## Racha de Estudio (Study Streak)

El cálculo se hace íntegramente en el servidor desde `lesson_progress`:

```typescript
type StudyStreak = {
  currentStreak: number     // Días consecutivos estudiando
  totalActiveDays: number   // Total de días con actividad
  last7Days: boolean[]      // [6 días atrás, ..., hoy] → UI del widget
}
```

### Algoritmo
1. Extraer fechas únicas de `completed_at`
2. Desde hoy hacia atrás, contar días consecutivos con actividad
3. Tolerancia: si hoy no tiene actividad, no rompe la racha (podría ser temprano en el día)

### Widget UI
```
🔥 Racha de Estudio     7
 L  M  X  J  V  S  D
[✓][✓][✓][ ][✓][✓][✓]
5 días activos en total · ¡Sigue así!
```

## Prerequisitos de Módulos

Los módulos tienen `prerequisite_module_id` opcional:

```typescript
// En dashboard:
if (activeModule?.prerequisite_module_id) {
  const prereqModule = modules.find(m => m.id === activeModule.prerequisite_module_id)
  const publishedLessons = prereqModule.lessons?.filter(l => l.is_published)
  const isPrereqCompleted = publishedLessons.every(l => completedLessons.includes(l.id))
  isModuleLocked = !isPrereqCompleted
}
```

Si está bloqueado, se muestra un botón deshabilitado con icono de candado: "Bloqueado: Requiere Módulo Anterior".

## Botón "Continuar Lección"

Encuentra la primera lección NO completada del módulo activo:
```typescript
const firstIncompleteLesson = activeModule?.lessons
  ?.filter(l => l.is_published && !completedLessons.includes(l.id))?.[0]
```

Si todas están completadas, cambia a: "Repasar Módulo".

## Actividad Reciente

```typescript
getRecentActivity(limit = 5) → {
  lesson_id, lesson_title, completed_at, lesson_type, score
}
```

Muestra ícono por tipo:
- `quiz` → quiz
- `document` → description
- `image` → image
- `link` → link
- default → play_circle

Y tiempo relativo: "Hace 5m", "Hace 2h", "Hace 3d".

## Métricas del Dashboard

| Métrica | Cálculo |
|---------|---------|
| Tiempo de estudio | `completedLessons.length * 15 / 60` horas (⚠️ estimado) |
| Cursos completados | Módulos donde TODAS las lecciones publicadas están completadas |
| Progreso del módulo | `enrollment.progress` (calculado por trigger de PostgreSQL) |

## Certificados Automáticos

La migración `20260309230000_fix_enrollment_autocreation_and_module_certs.sql` incluye triggers que:
1. Auto-crean enrollments cuando un estudiante progresa en un módulo
2. Emiten certificados de módulo cuando `progress = 100`
3. Emiten certificado global cuando todos los módulos están completados

## Archivos de Referencia
- `src/app/actions/contentSetup.ts` — `completeLessonProgress()`, `submitQuizAttempt()`
- `src/lib/data.ts` — `getStudyStreak()`, `getRecentActivity()`, `getUserCompletedLessons()`
- `src/app/dashboard/page.tsx` — UI del dashboard completa
