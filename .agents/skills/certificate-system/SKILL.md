---
name: Certificate System
description: Sistema completo de certificados configurables con folios secuenciales, QR de verificación, layout visual configurable, y generación de PDF con react-pdf.
---

# Certificate System

## Arquitectura

```
certificate_config (1 row)  →  Configuración global del diseño
certificates (N rows)       →  Certificados emitidos individuales
certificate-assets (bucket) →  Imágenes, fondos, firmas
```

## Configuración (`certificate_config`)

La tabla tiene una sola fila que define la apariencia global:

```typescript
type CertificateConfig = {
  id: string
  course_name: string          // "Diplomado en Rehabilitación Intervencionista..."
  folio_prefix: string         // "DLM-" → genera "DLM-0001", "DLM-0002"...
  course_hours: string         // "120 horas"
  institutional_text: string   // Texto del cuerpo del certificado
  primary_color: string        // "#0ea5e9"
  border_style: string         // Estilo del borde
  orientation: string          // "landscape" | "portrait"
  signers: Array<{             // Firmantes
    name: string
    role: string
    signature_url: string | null
  }>
  auto_issue: boolean          // Emitir automáticamente al completar
  min_progress: number         // Progreso mínimo requerido (0-100)
  require_evaluations: boolean // Requiere aprobar evaluaciones
  element_layout: ElementLayoutMap | null  // Layout visual de cada elemento
  background_url: string | null // Imagen de fondo
}
```

## Element Layout

Cada elemento del certificado tiene posición y visibilidad configurable:

```typescript
type ElementLayout = {
  x: number; y: number      // Posición
  w: number; h: number      // Dimensiones
  visible: boolean           // Mostrar/ocultar
  fontSize?: number
  align?: "left" | "center" | "right"
  imageUrl?: string          // Para elementos con imagen
}
```

Elementos disponibles: `header`, `title`, `recipient`, `body`, `signature`, `qr`, `folio`, `course_name`, `course_hours`, `date`, `divider`, `decorative_line`, `custom_image`.

## Emisión de Certificados

### Generación de Folio Secuencial
```typescript
async function getNextFolioNumber(supabase, prefix) {
  const { count } = await supabase
    .from("certificates")
    .select("*", { count: "exact", head: true })
    .ilike("folio", `${prefix}%`)

  const nextNum = (count ?? 0) + 1
  return `${prefix}${String(nextNum).padStart(4, "0")}`
}
```

### URL de Verificación QR
```typescript
const qrUrl = `${baseUrl}/verify/${folio}`
```
La ruta `/verify/[folio]` es pública y permite verificar la autenticidad del certificado.

### Emisión Manual vs Automática
- **Manual**: Admin emite desde `/admin/certificados` con `is_manual: true`
- **Automática**: Se dispara cuando `auto_issue: true` y el alumno cumple `min_progress`

## Subida de Assets

```typescript
export async function uploadCertificateAsset(formData: FormData) {
  // Validaciones:
  // - Tamaño máximo: 5 MB
  // - Tipos permitidos: PNG, JPEG, WebP, SVG
  // - Bucket: "certificate-assets"
  // - Nombre: `${folder}/${timestamp}_${random}.${ext}`
}
```

## Generación de PDF

El componente `CertificateGenerator.tsx` usa `@react-pdf/renderer` para generar PDFs descargables del lado del cliente.

Props del certificado:
```typescript
{
  folio, recipientName, courseName, courseHours,
  institutionalText, issueDate, issuedBy, qrUrl,
  signers, primaryColor, elementLayout, backgroundUrl
}
```

## Dashboard de Certificados del Estudiante

En `src/app/dashboard/page.tsx` se muestran los certificados con:
- Distinción visual entre certificado global (🎓) y por módulo (🏅)
- Botón de descarga PDF integrado
- Fecha de emisión formateada

## Archivos de Referencia
- `src/app/actions/certificates.ts` — server actions CRUD
- `src/components/student/CertificateGenerator.tsx` — generador PDF
- `src/components/certificates/` — componentes del sistema
- `src/app/admin/certificados/` — admin panel
- `src/app/verify/` — verificación pública QR
- `src/lib/data.ts` — `getCertificateConfig()`, `getCertificatesList()`, `getCertificateByFolio()`
