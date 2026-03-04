"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import type { ElementLayout, ElementLayoutMap } from "@/app/actions/certificates"
import { uploadCertificateAsset } from "@/app/actions/certificates"

// ─────────────────────────────────────────────────
// DEFAULT LAYOUT — 12 elements, no overlaps
// ─────────────────────────────────────────────────
export const DEFAULT_LAYOUT: ElementLayoutMap = {
  header:          { x: 30,  y: 24,  w: 300, h: 44,  visible: true,  fontSize: 13,  align: "left" },
  folio:           { x: 580, y: 24,  w: 220, h: 30,  visible: true,  fontSize: 7.5, align: "right" },
  title:           { x: 0,   y: 80,  w: 842, h: 44,  visible: true,  fontSize: 30,  align: "center" },
  divider:         { x: 341, y: 128, w: 160, h: 4,   visible: true,  fontSize: 2,   align: "center" },
  recipient:       { x: 60,  y: 146, w: 722, h: 56,  visible: true,  fontSize: 24,  align: "center" },
  decorative_line: { x: 260, y: 206, w: 320, h: 3,   visible: true,  fontSize: 1,   align: "center" },
  course_name:     { x: 60,  y: 218, w: 722, h: 30,  visible: true,  fontSize: 14,  align: "center" },
  body:            { x: 60,  y: 256, w: 722, h: 50,  visible: true,  fontSize: 10,  align: "center" },
  course_hours:    { x: 60,  y: 312, w: 722, h: 24,  visible: true,  fontSize: 11,  align: "center" },
  date:            { x: 60,  y: 346, w: 722, h: 24,  visible: true,  fontSize: 9,   align: "center" },
  signature:       { x: 30,  y: 400, w: 160, h: 80,  visible: true,  fontSize: 9,   align: "center" },
  qr:              { x: 700, y: 400, w: 80,  h: 80,  visible: true,  fontSize: 6,   align: "center" },
  custom_image:    { x: 350, y: 490, w: 140, h: 60,  visible: false, fontSize: 8,   align: "center", imageUrl: "" },
}

// Canvas dimensions (A4 landscape in pts)
const CANVAS_W = 842
const CANVAS_H = 595

type ElementKey = keyof ElementLayoutMap

// ─────────────────────────────────────────────────
// ELEMENT DEFINITIONS
// ─────────────────────────────────────────────────
const ELEMENT_META: Record<ElementKey, { label: string; icon: string; color: string; description: string }> = {
  header:          { label: "Encabezado",       icon: "badge",              color: "#3b82f6", description: "Nombre del instructor / institución" },
  folio:           { label: "Folio",            icon: "tag",               color: "#6366f1", description: "Número de folio y fecha" },
  title:           { label: "Título",           icon: "title",             color: "#8b5cf6", description: "Palabra 'CERTIFICADO'" },
  divider:         { label: "Divisor Dorado",   icon: "horizontal_rule",   color: "#ca8a04", description: "Línea decorativa bajo el título" },
  recipient:       { label: "Destinatario",     icon: "person",            color: "#06b6d4", description: "Nombre del médico/estudiante" },
  decorative_line: { label: "Línea Nombre",     icon: "remove",            color: "#a855f7", description: "Línea bajo el nombre" },
  course_name:     { label: "Nombre Curso",     icon: "school",            color: "#0891b2", description: "Nombre completo del curso" },
  body:            { label: "Texto",            icon: "article",           color: "#10b981", description: "Texto institucional descriptivo" },
  course_hours:    { label: "Horas del Curso",  icon: "schedule",          color: "#f97316", description: "Duración en horas del programa" },
  date:            { label: "Fecha de Emisión", icon: "calendar_month",    color: "#ec4899", description: "Lugar y fecha de expedición" },
  signature:       { label: "Firma",            icon: "draw",              color: "#f59e0b", description: "Firma del director del curso" },
  qr:              { label: "Código QR",        icon: "qr_code_2",         color: "#ef4444", description: "Código QR de verificación" },
  custom_image:    { label: "Imagen",           icon: "image",             color: "#14b8a6", description: "Logo, sello o imagen personalizada" },
}

// Render order (z-index priority from back to front)
const ELEMENT_ORDER: ElementKey[] = [
  "custom_image", "divider", "decorative_line", "header", "folio", "title",
  "recipient", "course_name", "body", "course_hours", "date",
  "signature", "qr",
]

type Props = {
  layout: ElementLayoutMap
  onLayoutChange: (layout: ElementLayoutMap) => void
  backgroundUrl: string
  onBackgroundChange: (url: string) => void
  config: {
    primary_color: string
    course_name: string
    course_hours: string
    folio_prefix: string
    institutional_text: string
  }
}

// ─────────────────────────────────────────────────
// ELEMENT CONTENT RENDERER
// ─────────────────────────────────────────────────
function ElementContent({ elKey, el, config, scale }: { elKey: ElementKey; el: ElementLayout; config: Props["config"]; scale: number }) {
  const fs = (size: number) => size * scale

  switch (elKey) {
    case "header":
      return (
        <div className="flex flex-col" style={{ textAlign: (el.align || "left") as "left" | "center" | "right" }}>
          <span style={{ fontSize: fs(el.fontSize || 13), fontWeight: 700, color: config.primary_color }}>Dr. Raúl Morales</span>
          <span style={{ fontSize: fs(7), color: "#64748b", letterSpacing: 1 * scale, marginTop: 1 * scale }}>Ecografía Neuromusculoesquelética</span>
        </div>
      )
    case "title":
      return (
        <span style={{ fontSize: fs(el.fontSize || 30), fontWeight: 700, letterSpacing: 4 * scale, color: "#1e293b", textAlign: (el.align || "center") as "left" | "center" | "right", width: "100%" }}>
          CERTIFICADO
        </span>
      )
    case "divider":
      return <div style={{ width: "100%", height: Math.max(1, fs(el.fontSize || 2)), backgroundColor: "#c9a84c", borderRadius: 1 }} />
    case "decorative_line":
      return <div style={{ width: "100%", height: Math.max(1, fs(el.fontSize || 1)), backgroundColor: "#cbd5e1", borderRadius: 1 }} />
    case "recipient":
      return (
        <div className="flex flex-col items-center w-full" style={{ textAlign: (el.align || "center") as "left" | "center" | "right" }}>
          <span style={{ fontSize: fs(8), color: "#64748b", letterSpacing: 2 * scale, textTransform: "uppercase", marginBottom: 4 * scale }}>Se otorga a</span>
          <span style={{ fontSize: fs(el.fontSize || 24), fontWeight: 700, color: "#0f172a", display: "inline-block" }}>[Nombre del Médico]</span>
        </div>
      )
    case "course_name":
      return (
        <span style={{ fontSize: fs(el.fontSize || 14), fontWeight: 600, color: "#1e293b", textAlign: (el.align || "center") as "left" | "center" | "right", width: "100%", fontStyle: "italic" }}>
          {config.course_name || "Curso de Ecografía Neuromusculoesquelética"}
        </span>
      )
    case "course_hours":
      return (
        <span style={{ fontSize: fs(el.fontSize || 11), color: "#475569", textAlign: (el.align || "center") as "left" | "center" | "right", width: "100%" }}>
          (Duración: {config.course_hours || "120"} horas)
        </span>
      )
    case "body":
      return (
        <span style={{ fontSize: fs(el.fontSize || 10), color: "#334155", lineHeight: 1.7, textAlign: (el.align || "center") as "left" | "center" | "right", width: "100%" }}>
          {config.institutional_text || `Por haber completado satisfactoriamente el curso impartido por el Dr. Raúl Morales.`}
        </span>
      )
    case "date":
      return (
        <span style={{ fontSize: fs(el.fontSize || 9), color: "#64748b", textAlign: (el.align || "center") as "left" | "center" | "right", width: "100%" }}>
          Ciudad de México, a {new Date().toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}
        </span>
      )
    case "folio":
      return (
        <div className="flex flex-col w-full" style={{ textAlign: (el.align || "right") as "left" | "center" | "right" }}>
          <span style={{ fontSize: fs(el.fontSize || 7.5), color: "#64748b" }}>Folio: {config.folio_prefix}0001</span>
          <span style={{ fontSize: fs(el.fontSize || 7.5), color: "#64748b", marginTop: 1 * scale }}>
            Fecha: {new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
          </span>
        </div>
      )
    case "signature":
      return (
        <div className="flex flex-col items-center justify-end w-full h-full" style={{ paddingBottom: 4 * scale }}>
          <div style={{ width: "80%", borderBottom: "1px solid #374151", marginBottom: 3 * scale }} />
          <span style={{ fontSize: fs(el.fontSize || 9), color: "#0f172a", fontWeight: 700, textAlign: "center" }}>Dr. Raúl Morales</span>
          <span style={{ fontSize: fs((el.fontSize || 9) * 0.8), color: "#64748b", textAlign: "center" }}>Director del Curso</span>
        </div>
      )
    case "qr":
      return (
        <div className="flex flex-col items-center justify-center w-full h-full">
          <div className="rounded flex items-center justify-center" style={{ width: Math.min(el.w, el.h - 16) * scale * 0.65, height: Math.min(el.w, el.h - 16) * scale * 0.65, backgroundColor: "#e5e7eb" }}>
            <span className="material-symbols-outlined" style={{ fontSize: Math.min(el.w, el.h - 16) * scale * 0.4, color: "#9ca3af" }}>qr_code_2</span>
          </div>
          <span style={{ fontSize: fs(el.fontSize || 6), color: "#9ca3af", marginTop: 2 * scale }}>Verificar</span>
        </div>
      )
    case "custom_image":
      return el.imageUrl ? (
        <img src={el.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} draggable={false} />
      ) : (
        <div className="flex flex-col items-center justify-center w-full h-full rounded" style={{ backgroundColor: "#f1f5f9", border: "2px dashed #cbd5e1" }}>
          <span className="material-symbols-outlined" style={{ fontSize: fs(16), color: "#94a3b8" }}>add_photo_alternate</span>
          <span style={{ fontSize: fs(7), color: "#94a3b8", marginTop: 2 * scale }}>Subir imagen</span>
        </div>
      )
    default:
      return null
  }
}

// ─────────────────────────────────────────────────
// MAIN DESIGNER COMPONENT
// ─────────────────────────────────────────────────
export default function CertificateDesigner({ layout, onLayoutChange, backgroundUrl, onBackgroundChange, config }: Props) {
  const [selected, setSelected] = useState<ElementKey | null>(null)
  const [dragging, setDragging] = useState<ElementKey | null>(null)
  const [resizing, setResizing] = useState<{ key: ElementKey; corner: string } | null>(null)
  const [previewMode, setPreviewMode] = useState(false)
  const [showManager, setShowManager] = useState(true)
  const [uploading, setUploading] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bgInputRef = useRef<HTMLInputElement>(null)
  const dragOffset = useRef({ x: 0, y: 0 })
  const resizeStart = useRef({ mx: 0, my: 0, ow: 0, oh: 0, ox: 0, oy: 0 })
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const updateScale = () => {
      if (canvasRef.current) setScale(canvasRef.current.clientWidth / CANVAS_W)
    }
    updateScale()
    window.addEventListener("resize", updateScale)
    return () => window.removeEventListener("resize", updateScale)
  }, [])

  const updateElement = useCallback(
    (key: ElementKey, updates: Partial<ElementLayout>) => {
      onLayoutChange({ ...layout, [key]: { ...layout[key], ...updates } })
    },
    [layout, onLayoutChange]
  )

  // ── Upload handler ────────────────────────────
  const handleUpload = useCallback(async (file: File, target: "image" | "background") => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", target === "background" ? "backgrounds" : "images")
      const result = await uploadCertificateAsset(formData)
      if (result.success && result.url) {
        if (target === "background") {
          onBackgroundChange(result.url)
        } else if (selected) {
          updateElement(selected, { imageUrl: result.url, visible: true })
        }
      }
    } finally {
      setUploading(false)
    }
  }, [selected, updateElement, onBackgroundChange])

  // ── Drag handlers ──────────────────────────────
  const handlePointerDown = useCallback(
    (e: React.PointerEvent, key: ElementKey) => {
      if (previewMode) return
      e.preventDefault()
      e.stopPropagation()
      const rect = canvasRef.current!.getBoundingClientRect()
      const mx = (e.clientX - rect.left) / scale
      const my = (e.clientY - rect.top) / scale
      dragOffset.current = { x: mx - layout[key].x, y: my - layout[key].y }
      setDragging(key)
      setSelected(key)
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [layout, scale, previewMode]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!canvasRef.current) return
      const rect = canvasRef.current.getBoundingClientRect()
      const mx = (e.clientX - rect.left) / scale
      const my = (e.clientY - rect.top) / scale

      if (dragging) {
        let nx = mx - dragOffset.current.x
        let ny = my - dragOffset.current.y
        const el = layout[dragging]
        nx = Math.max(0, Math.min(CANVAS_W - el.w, nx))
        ny = Math.max(0, Math.min(CANVAS_H - el.h, ny))
        updateElement(dragging, { x: Math.round(nx), y: Math.round(ny) })
      }

      if (resizing) {
        const { key, corner } = resizing
        const { mx: smx, my: smy, ow, oh, ox, oy } = resizeStart.current
        const dx = mx - smx
        const dy = my - smy
        let newW = ow, newH = oh, newX = ox, newY = oy
        if (corner.includes("r")) newW = Math.max(30, ow + dx)
        if (corner.includes("l")) { newW = Math.max(30, ow - dx); newX = ox + dx }
        if (corner.includes("b")) newH = Math.max(3, oh + dy)
        if (corner.includes("t")) { newH = Math.max(3, oh - dy); newY = oy + dy }
        newX = Math.max(0, newX); newY = Math.max(0, newY)
        if (newX + newW > CANVAS_W) newW = CANVAS_W - newX
        if (newY + newH > CANVAS_H) newH = CANVAS_H - newY
        updateElement(key, { x: Math.round(newX), y: Math.round(newY), w: Math.round(newW), h: Math.round(newH) })
      }
    },
    [dragging, resizing, layout, scale, updateElement]
  )

  const handlePointerUp = useCallback(() => { setDragging(null); setResizing(null) }, [])

  const handleResizeStart = useCallback(
    (e: React.PointerEvent, key: ElementKey, corner: string) => {
      e.preventDefault(); e.stopPropagation()
      const rect = canvasRef.current!.getBoundingClientRect()
      const mx = (e.clientX - rect.left) / scale
      const my = (e.clientY - rect.top) / scale
      resizeStart.current = { mx, my, ow: layout[key].w, oh: layout[key].h, ox: layout[key].x, oy: layout[key].y }
      setResizing({ key, corner })
      setSelected(key)
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [layout, scale]
  )

  const visibleElements = ELEMENT_ORDER.filter((k) => layout[k]?.visible)

  return (
    <div className="space-y-4">
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">design_services</span>
          Editor Visual de Certificado
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowManager(!showManager)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${showManager ? "bg-primary/10 text-primary" : "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/15"}`}
          >
            <span className="material-symbols-outlined text-sm">dashboard_customize</span>
            Elementos
          </button>
          <button
            onClick={() => { setPreviewMode(!previewMode); setSelected(null) }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${previewMode ? "bg-primary text-white" : "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/15"}`}
          >
            <span className="material-symbols-outlined text-sm">{previewMode ? "edit" : "preview"}</span>
            {previewMode ? "Modo Edición" : "Vista Previa"}
          </button>
          <button
            onClick={() => { onLayoutChange(DEFAULT_LAYOUT); setSelected(null) }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/15 flex items-center gap-1.5 transition-all"
          >
            <span className="material-symbols-outlined text-sm">restart_alt</span>
            Restablecer
          </button>
          <button
            onClick={() => bgInputRef.current?.click()}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${backgroundUrl ? "bg-teal-500/10 text-teal-600" : "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/15"}`}
          >
            <span className="material-symbols-outlined text-sm">wallpaper</span>
            {backgroundUrl ? "Cambiar Fondo" : "Fondo"}
          </button>
          {backgroundUrl && (
            <button
              onClick={() => onBackgroundChange("")}
              className="px-2 py-1.5 rounded-lg text-xs font-semibold text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center gap-1 transition-all"
            >
              <span className="material-symbols-outlined text-sm">delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, "image"); e.target.value = "" }} />
      <input ref={bgInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, "background"); e.target.value = "" }} />

      {/* ── Canvas ── */}
      <div className="bg-gray-100 dark:bg-gray-900/50 rounded-xl p-3 overflow-hidden">
        <div style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}`, maxWidth: "100%", position: "relative" }}>
          <div
            ref={canvasRef}
            className="w-full h-full relative overflow-hidden select-none"
            style={{ background: backgroundUrl ? `url(${backgroundUrl}) center/cover no-repeat` : "linear-gradient(135deg, #fefcf3 0%, #fdf8e7 100%)", borderRadius: 8, boxShadow: "0 4px 24px rgba(0,0,0,.12), 0 0 0 1px rgba(201,168,76,0.3)" }}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onClick={(e) => { if (e.target === canvasRef.current) setSelected(null) }}
          >
            {/* Uploading overlay */}
            {uploading && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-50 rounded-lg">
                <div className="bg-white dark:bg-gray-900 rounded-xl px-6 py-4 flex items-center gap-3 shadow-2xl">
                  <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Subiendo imagen...</span>
                </div>
              </div>
            )}

            {/* Decorative borders */}
            <div className="absolute" style={{ inset: `${12 * scale}px`, border: "2.5px solid #c9a84c", borderRadius: 4, pointerEvents: "none" }} />
            <div className="absolute" style={{ inset: `${18 * scale}px`, border: "1px solid #c9a84c", borderRadius: 2, pointerEvents: "none" }} />

            {/* Corner ornaments */}
            {[
              { top: 8 * scale, left: 8 * scale, bt: "2px solid #c9a84c", bl: "2px solid #c9a84c" },
              { top: 8 * scale, right: 8 * scale, bt: "2px solid #c9a84c", br: "2px solid #c9a84c" },
              { bottom: 8 * scale, left: 8 * scale, bb: "2px solid #c9a84c", bl: "2px solid #c9a84c" },
              { bottom: 8 * scale, right: 8 * scale, bb: "2px solid #c9a84c", br: "2px solid #c9a84c" },
            ].map((s, i) => (
              <div key={i} className="absolute" style={{
                width: 18 * scale, height: 18 * scale, pointerEvents: "none",
                ...(s.top !== undefined ? { top: s.top } : {}), ...(s.bottom !== undefined ? { bottom: s.bottom } : {}),
                ...(s.left !== undefined ? { left: s.left } : {}), ...(s.right !== undefined ? { right: s.right } : {}),
                borderTop: s.bt, borderBottom: s.bb, borderLeft: s.bl, borderRight: s.br,
              }} />
            ))}

            {/* Center guide when dragging */}
            {dragging && !previewMode && (
              <div className="absolute" style={{ left: "50%", top: 0, bottom: 0, width: 1, background: "rgba(59,130,246,0.25)", pointerEvents: "none", zIndex: 50 }} />
            )}

            {/* ── Draggable elements ── */}
            {visibleElements.map((key, idx) => {
              const el = layout[key]
              if (!el) return null
              const meta = ELEMENT_META[key]
              const isSelected = selected === key && !previewMode

              return (
                <div
                  key={key}
                  className="absolute group"
                  style={{
                    left: el.x * scale, top: el.y * scale, width: el.w * scale, height: el.h * scale,
                    cursor: previewMode ? "default" : dragging === key ? "grabbing" : "grab",
                    zIndex: dragging === key ? 30 : isSelected ? 20 : idx + 1,
                    touchAction: "none",
                  }}
                  onPointerDown={(e) => handlePointerDown(e, key)}
                >
                  {/* Selection border */}
                  {!previewMode && (
                    <div className="absolute inset-0 rounded transition-all" style={{
                      border: isSelected ? `2px solid ${meta.color}` : `1px dashed ${meta.color}33`,
                      backgroundColor: isSelected ? `${meta.color}08` : "transparent",
                    }} />
                  )}

                  {/* Element label */}
                  {!previewMode && (
                    <div className="absolute -top-4 left-0 px-1.5 rounded-t text-[8px] font-bold text-white whitespace-nowrap" style={{
                      backgroundColor: meta.color,
                      fontSize: Math.max(8, 9 * scale), lineHeight: `${Math.max(12, 14 * scale)}px`,
                      transform: `scale(${1 / scale})`, transformOrigin: "bottom left",
                    }}>
                      {meta.label}
                    </div>
                  )}

                  {/* Content */}
                  <div className="w-full h-full flex items-center overflow-hidden px-1" style={{
                    justifyContent: el.align === "center" ? "center" : el.align === "right" ? "flex-end" : "flex-start",
                  }}>
                    <ElementContent elKey={key} el={el} config={config} scale={scale} />
                  </div>

                  {/* Resize handles */}
                  {isSelected && (
                    <>
                      {["tl", "tr", "bl", "br", "t", "b", "l", "r"].map((corner) => {
                        const pos: React.CSSProperties = {}
                        const sz = 8
                        if (corner.includes("t")) pos.top = -sz / 2
                        if (corner.includes("b")) pos.bottom = -sz / 2
                        if (corner.includes("l")) pos.left = -sz / 2
                        if (corner.includes("r")) pos.right = -sz / 2
                        if (corner === "t" || corner === "b") { pos.left = "50%"; pos.transform = "translateX(-50%)" }
                        if (corner === "l" || corner === "r") { pos.top = "50%"; pos.transform = "translateY(-50%)" }
                        const cursors: Record<string, string> = { tl: "nw-resize", tr: "ne-resize", bl: "sw-resize", br: "se-resize", t: "n-resize", b: "s-resize", l: "w-resize", r: "e-resize" }
                        return (
                          <div key={corner} className="absolute rounded-full" style={{
                            ...pos, width: sz, height: sz, backgroundColor: meta.color,
                            border: "2px solid white", cursor: cursors[corner], zIndex: 40,
                            boxShadow: "0 1px 3px rgba(0,0,0,.2)",
                          }} onPointerDown={(e) => handleResizeStart(e, key, corner)} />
                        )
                      })}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Properties panel (when element selected) ── */}
      {selected && !previewMode && layout[selected] && (
        <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200"
          style={{ borderLeftColor: ELEMENT_META[selected].color, borderLeftWidth: 3 }}>
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm" style={{ color: ELEMENT_META[selected].color }}>{ELEMENT_META[selected].icon}</span>
              Propiedades: {ELEMENT_META[selected].label}
            </h4>
            <button onClick={() => setSelected(null)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
              <span className="material-symbols-outlined text-gray-400 text-base">close</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "X", key: "x" as const, max: CANVAS_W - layout[selected].w },
              { label: "Y", key: "y" as const, max: CANVAS_H - layout[selected].h },
              { label: "Ancho", key: "w" as const, max: CANVAS_W - layout[selected].x, min: 30 },
              { label: "Alto", key: "h" as const, max: CANVAS_H - layout[selected].y, min: 3 },
            ].map(({ label, key: k, max, min }) => (
              <div key={k}>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">{label}</label>
                <input type="number" value={layout[selected][k]}
                  onChange={(e) => updateElement(selected, { [k]: Math.max(min || 0, Math.min(max, +e.target.value)) })}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white outline-none font-mono" />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 flex-wrap pt-1">
            {/* Font size — hide for pure decorative lines and images */}
            {selected !== "qr" && selected !== "divider" && selected !== "decorative_line" && selected !== "custom_image" && (
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Tamaño</label>
                <input type="range" min={6} max={40} step={0.5} value={layout[selected].fontSize || 10}
                  onChange={(e) => updateElement(selected, { fontSize: +e.target.value })} className="w-20 accent-primary" />
                <span className="text-xs font-mono text-gray-600 dark:text-gray-300 w-8">{layout[selected].fontSize || 10}</span>
              </div>
            )}

            {/* Line thickness for dividers */}
            {(selected === "divider" || selected === "decorative_line") && (
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Grosor</label>
                <input type="range" min={1} max={6} step={0.5} value={layout[selected].fontSize || 2}
                  onChange={(e) => updateElement(selected, { fontSize: +e.target.value })} className="w-20 accent-primary" />
                <span className="text-xs font-mono text-gray-600 dark:text-gray-300 w-8">{layout[selected].fontSize || 2}px</span>
              </div>
            )}

            {/* Image upload for custom_image */}
            {selected === "custom_image" && (
              <div className="flex items-center gap-2">
                <button onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-500/10 text-teal-600 hover:bg-teal-500/20 transition-colors">
                  <span className="material-symbols-outlined text-sm">upload</span>
                  {layout[selected].imageUrl ? "Cambiar Imagen" : "Subir Imagen"}
                </button>
                {layout[selected].imageUrl && (
                  <button onClick={() => updateElement(selected, { imageUrl: "" })}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                    <span className="material-symbols-outlined text-sm">delete</span>
                    Quitar
                  </button>
                )}
              </div>
            )}

            {/* Alignment — hide for decorative elements and images */}
            {selected !== "divider" && selected !== "decorative_line" && selected !== "qr" && selected !== "custom_image" && (
              <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-white/10 rounded-lg p-0.5">
                {(["left", "center", "right"] as const).map((a) => (
                  <button key={a} onClick={() => updateElement(selected, { align: a })}
                    className={`p-1.5 rounded-md transition-all ${layout[selected].align === a ? "bg-white dark:bg-white/20 shadow-sm text-primary" : "text-gray-400 hover:text-gray-600"}`}>
                    <span className="material-symbols-outlined text-sm">
                      {a === "left" ? "format_align_left" : a === "center" ? "format_align_center" : "format_align_right"}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Visibility toggle */}
            <button onClick={() => { updateElement(selected, { visible: false }); setSelected(null) }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
              <span className="material-symbols-outlined text-sm">visibility_off</span>
              Ocultar
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          ELEMENT MANAGER PANEL
      ══════════════════════════════════════════ */}
      {showManager && (
        <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/5 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
            <h4 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">dashboard_customize</span>
              Gestión de Elementos
              <span className="text-[10px] font-normal text-gray-400 ml-1">{visibleElements.length} / {ELEMENT_ORDER.length} visibles</span>
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-100 dark:bg-white/5">
            {ELEMENT_ORDER.map((key) => {
              const meta = ELEMENT_META[key]
              const el = layout[key]
              if (!el) return null
              const isVis = el.visible
              const isSel = selected === key

              return (
                <div key={key}
                  className={`bg-white dark:bg-gray-950 p-3 flex items-center gap-3 transition-all cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5`}
                  style={isSel ? { outline: `2px solid ${meta.color}`, outlineOffset: -2 } : {}}
                  onClick={() => { if (!previewMode) setSelected(key) }}
                >
                  {/* Icon */}
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${meta.color}15` }}>
                    <span className="material-symbols-outlined text-base" style={{ color: isVis ? meta.color : "#9ca3af" }}>{meta.icon}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold truncate ${isVis ? "text-gray-900 dark:text-white" : "text-gray-400 line-through"}`}>
                      {meta.label}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate">{meta.description}</p>
                    {isVis && (
                      <p className="text-[9px] text-gray-300 dark:text-gray-600 font-mono mt-0.5">
                        x:{el.x} y:{el.y} · {el.w}×{el.h}
                      </p>
                    )}
                  </div>

                  {/* Visibility toggle */}
                  <button
                    onClick={(e) => { e.stopPropagation(); updateElement(key, { visible: !isVis }); if (!isVis) setSelected(key) }}
                    className={`p-1.5 rounded-lg transition-all shrink-0 ${isVis ? "text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" : "text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20"}`}
                    title={isVis ? "Ocultar elemento" : "Mostrar elemento"}
                  >
                    <span className="material-symbols-outlined text-base">{isVis ? "visibility" : "visibility_off"}</span>
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <p className="text-[10px] text-gray-400 text-center">
        {previewMode
          ? "Vista previa • Haz clic en \"Modo Edición\" para modificar la posición de los elementos"
          : "Arrastra los elementos para posicionarlos • Clic para seleccionar • El diseño se aplica al PDF final"}
      </p>
    </div>
  )
}
