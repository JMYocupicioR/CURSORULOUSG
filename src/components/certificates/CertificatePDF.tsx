"use client"

import { Page, Text, View, Document, StyleSheet, Image } from "@react-pdf/renderer"
import type { ElementLayoutMap } from "@/app/actions/certificates"

type Signer = {
  name: string
  role: string
  signature_url?: string | null
}

type CertificatePDFProps = {
  recipientName: string
  courseName: string
  courseHours: string
  institutionalText: string
  folio: string
  issueDate: string
  issuedBy: string
  qrDataUrl: string // base64 QR image
  signers: Signer[]
  primaryColor?: string
  elementLayout?: ElementLayoutMap | null
  backgroundUrl?: string | null
}

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? `rgb(${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)})`
    : hex
}

export function CertificatePDF({
  recipientName,
  courseHours,
  institutionalText,
  folio,
  issueDate,
  issuedBy,
  qrDataUrl,
  signers,
  primaryColor = "#0ea5e9",
  elementLayout,
  backgroundUrl,
}: CertificatePDFProps) {
  const pc = hexToRgb(primaryColor)
  const formattedDate = new Date(issueDate).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })

  // If we have a custom layout, render with absolute positioning
  if (elementLayout) {
    return (
      <Document>
        <Page size="A4" orientation="landscape" style={absoluteStyles.page}>
          {/* Background image */}
          {backgroundUrl && (
            <Image src={backgroundUrl} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }} />
          )}
          <View style={absoluteStyles.outerBorder}>
            {/* Ornamental corners */}
            <View style={absoluteStyles.cornerTL} />
            <View style={absoluteStyles.cornerTR} />
            <View style={absoluteStyles.cornerBL} />
            <View style={absoluteStyles.cornerBR} />

            <View style={absoluteStyles.innerBorder}>
              {/* Divider (gold line) */}
              {elementLayout.divider?.visible && (
                <View style={{
                  position: "absolute",
                  left: elementLayout.divider.x,
                  top: elementLayout.divider.y,
                  width: elementLayout.divider.w,
                  height: Math.max(1, elementLayout.divider.fontSize || 2),
                  backgroundColor: "#c9a84c",
                  borderRadius: 1,
                }} />
              )}

              {/* Decorative line (under recipient name) */}
              {elementLayout.decorative_line?.visible && (
                <View style={{
                  position: "absolute",
                  left: elementLayout.decorative_line.x,
                  top: elementLayout.decorative_line.y,
                  width: elementLayout.decorative_line.w,
                  height: Math.max(1, elementLayout.decorative_line.fontSize || 1),
                  backgroundColor: "#cbd5e1",
                  borderRadius: 1,
                }} />
              )}

              {/* Header */}
              {elementLayout.header.visible && (
                <View style={{
                  position: "absolute",
                  left: elementLayout.header.x,
                  top: elementLayout.header.y,
                  width: elementLayout.header.w,
                  height: elementLayout.header.h,
                }}>
                  <Text style={{
                    fontSize: elementLayout.header.fontSize || 13,
                    fontWeight: "bold",
                    color: pc,
                    textAlign: (elementLayout.header.align || "left") as "left" | "center" | "right",
                  }}>
                    {issuedBy}
                  </Text>
                  <Text style={{
                    fontSize: 7,
                    color: "#64748b",
                    letterSpacing: 1,
                    marginTop: 1,
                    textAlign: (elementLayout.header.align || "left") as "left" | "center" | "right",
                  }}>
                    ECOGRAFÍA NEUROMUSCULOESQUELÉTICA
                  </Text>
                </View>
              )}

              {/* Folio */}
              {elementLayout.folio.visible && (
                <View style={{
                  position: "absolute",
                  left: elementLayout.folio.x,
                  top: elementLayout.folio.y,
                  width: elementLayout.folio.w,
                  height: elementLayout.folio.h,
                }}>
                  <Text style={{
                    fontSize: elementLayout.folio.fontSize || 7.5,
                    color: "#64748b",
                    textAlign: (elementLayout.folio.align || "right") as "left" | "center" | "right",
                  }}>
                    Folio: {folio}
                  </Text>
                  <Text style={{
                    fontSize: elementLayout.folio.fontSize || 7.5,
                    color: "#64748b",
                    textAlign: (elementLayout.folio.align || "right") as "left" | "center" | "right",
                    marginTop: 2,
                  }}>
                    Fecha: {formattedDate}
                  </Text>
                </View>
              )}

              {/* Title */}
              {elementLayout.title.visible && (
                <View style={{
                  position: "absolute",
                  left: elementLayout.title.x,
                  top: elementLayout.title.y,
                  width: elementLayout.title.w,
                  height: elementLayout.title.h,
                  justifyContent: "center",
                }}>
                  <Text style={{
                    fontSize: elementLayout.title.fontSize || 30,
                    fontWeight: "bold",
                    textAlign: (elementLayout.title.align || "center") as "left" | "center" | "right",
                    color: "#1e293b",
                    letterSpacing: 4,
                  }}>
                    CERTIFICADO
                  </Text>
                </View>
              )}

              {/* Recipient */}
              {elementLayout.recipient.visible && (
                <View style={{
                  position: "absolute",
                  left: elementLayout.recipient.x,
                  top: elementLayout.recipient.y,
                  width: elementLayout.recipient.w,
                  height: elementLayout.recipient.h,
                  justifyContent: "center",
                  alignItems: elementLayout.recipient.align === "left" ? "flex-start" : elementLayout.recipient.align === "right" ? "flex-end" : "center",
                }}>
                  <Text style={{
                    fontSize: 9,
                    color: "#64748b",
                    letterSpacing: 3,
                    textTransform: "uppercase",
                    textAlign: (elementLayout.recipient.align || "center") as "left" | "center" | "right",
                    marginBottom: 8,
                  }}>
                    Se otorga a
                  </Text>
                  <Text style={{
                    fontSize: elementLayout.recipient.fontSize || 24,
                    fontWeight: "bold",
                    textAlign: (elementLayout.recipient.align || "center") as "left" | "center" | "right",
                    color: "#0f172a",
                    paddingBottom: 4,
                    marginHorizontal: 20,
                  }}>
                    {recipientName}
                  </Text>
                </View>
              )}

              {/* Course Name */}
              {elementLayout.course_name?.visible && (
                <View style={{
                  position: "absolute",
                  left: elementLayout.course_name.x,
                  top: elementLayout.course_name.y,
                  width: elementLayout.course_name.w,
                  height: elementLayout.course_name.h,
                  justifyContent: "center",
                }}>
                  <Text style={{
                    fontSize: elementLayout.course_name.fontSize || 14,
                    fontWeight: "bold",
                    fontStyle: "italic",
                    textAlign: (elementLayout.course_name.align || "center") as "left" | "center" | "right",
                    color: "#1e293b",
                  }}>
                    {institutionalText.split("el ").slice(1).join("el ") || "Curso de Ecografía Neuromusculoesquelética"}
                  </Text>
                </View>
              )}

              {/* Body text */}
              {elementLayout.body.visible && (
                <View style={{
                  position: "absolute",
                  left: elementLayout.body.x,
                  top: elementLayout.body.y,
                  width: elementLayout.body.w,
                  height: elementLayout.body.h,
                  justifyContent: "center",
                }}>
                  <Text style={{
                    fontSize: elementLayout.body.fontSize || 10,
                    textAlign: (elementLayout.body.align || "center") as "left" | "center" | "right",
                    color: "#334155",
                    lineHeight: 1.7,
                  }}>
                    {institutionalText}
                  </Text>
                </View>
              )}

              {/* Course Hours */}
              {elementLayout.course_hours?.visible && courseHours && (
                <View style={{
                  position: "absolute",
                  left: elementLayout.course_hours.x,
                  top: elementLayout.course_hours.y,
                  width: elementLayout.course_hours.w,
                  height: elementLayout.course_hours.h,
                  justifyContent: "center",
                }}>
                  <Text style={{
                    fontSize: elementLayout.course_hours.fontSize || 11,
                    textAlign: (elementLayout.course_hours.align || "center") as "left" | "center" | "right",
                    color: "#475569",
                  }}>
                    (Duración: {courseHours} horas)
                  </Text>
                </View>
              )}

              {/* Date */}
              {elementLayout.date?.visible && (
                <View style={{
                  position: "absolute",
                  left: elementLayout.date.x,
                  top: elementLayout.date.y,
                  width: elementLayout.date.w,
                  height: elementLayout.date.h,
                  justifyContent: "center",
                }}>
                  <Text style={{
                    fontSize: elementLayout.date.fontSize || 9,
                    textAlign: (elementLayout.date.align || "center") as "left" | "center" | "right",
                    color: "#64748b",
                  }}>
                    Ciudad de México, a {formattedDate}
                  </Text>
                </View>
              )}

              {/* Signature */}
              {elementLayout.signature.visible && signers.map((signer, i) => (
                <View key={i} style={{
                  position: "absolute",
                  left: elementLayout.signature.x,
                  top: elementLayout.signature.y,
                  width: elementLayout.signature.w,
                  height: elementLayout.signature.h,
                  justifyContent: "flex-end",
                  alignItems: "center",
                }}>
                  {signer.signature_url ? (
                    <Image style={{ width: 80, height: 32, marginBottom: 4 }} src={signer.signature_url} />
                  ) : null}
                  <View style={{ width: "100%", borderTop: "1pt solid #0f172a", marginBottom: 4 }} />
                  <Text style={{
                    fontSize: elementLayout.signature.fontSize || 9,
                    fontWeight: "bold",
                    color: "#0f172a",
                    textAlign: "center",
                  }}>
                    {signer.name}
                  </Text>
                  <Text style={{
                    fontSize: (elementLayout.signature.fontSize || 9) * 0.85,
                    color: "#64748b",
                    textAlign: "center",
                  }}>
                    {signer.role}
                  </Text>
                </View>
              ))}

              {/* QR Code */}
              {elementLayout.qr.visible && (
                <View style={{
                  position: "absolute",
                  left: elementLayout.qr.x,
                  top: elementLayout.qr.y,
                  width: elementLayout.qr.w,
                  height: elementLayout.qr.h,
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  {qrDataUrl ? <Image style={{ width: 52, height: 52, marginBottom: 3 }} src={qrDataUrl} /> : null}
                  <Text style={{ fontSize: 6, color: "#94a3b8", textAlign: "center" }}>
                    Verificar autenticidad
                  </Text>
                  <Text style={{ fontSize: 6, color: "#94a3b8", textAlign: "center", marginTop: 2 }}>
                    Escanea el código QR
                  </Text>
                </View>
              )}

              {/* Custom Image */}
              {elementLayout.custom_image?.visible && elementLayout.custom_image.imageUrl && (
                <View style={{
                  position: "absolute",
                  left: elementLayout.custom_image.x,
                  top: elementLayout.custom_image.y,
                  width: elementLayout.custom_image.w,
                  height: elementLayout.custom_image.h,
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Image src={elementLayout.custom_image.imageUrl} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                </View>
              )}
            </View>
          </View>
        </Page>
      </Document>
    )
  }

  // ─── Fallback: original default layout ───
  const styles = StyleSheet.create({
    page: {
      flexDirection: "column",
      backgroundColor: "#fefcf3",
      padding: 0,
      fontFamily: "Helvetica",
    },
    outerBorder: {
      margin: 18,
      border: `3pt solid #c9a84c`,
      flex: 1,
      padding: 0,
      position: "relative",
    },
    innerBorder: {
      margin: 6,
      border: `1pt solid #c9a84c`,
      flex: 1,
      padding: 30,
      paddingTop: 24,
    },
    cornerTL: { position: "absolute", top: 10, left: 10, width: 20, height: 20, borderTop: "2pt solid #c9a84c", borderLeft: "2pt solid #c9a84c" },
    cornerTR: { position: "absolute", top: 10, right: 10, width: 20, height: 20, borderTop: "2pt solid #c9a84c", borderRight: "2pt solid #c9a84c" },
    cornerBL: { position: "absolute", bottom: 10, left: 10, width: 20, height: 20, borderBottom: "2pt solid #c9a84c", borderLeft: "2pt solid #c9a84c" },
    cornerBR: { position: "absolute", bottom: 10, right: 10, width: 20, height: 20, borderBottom: "2pt solid #c9a84c", borderRight: "2pt solid #c9a84c" },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 16,
    },
    logoBlock: {
      flexDirection: "column",
    },
    logoTitle: {
      fontSize: 13,
      fontWeight: "bold",
      color: pc,
    },
    logoSubtitle: {
      fontSize: 7,
      color: "#64748b",
      letterSpacing: 1,
      marginTop: 1,
    },
    certTitle: {
      fontSize: 30,
      fontWeight: "bold",
      textAlign: "center",
      color: "#1e293b",
      letterSpacing: 4,
      marginBottom: 4,
    },
    divider: {
      width: 120,
      height: 2,
      backgroundColor: "#c9a84c",
      alignSelf: "center",
      marginBottom: 14,
    },
    grantedTo: {
      fontSize: 9,
      textAlign: "center",
      color: "#64748b",
      letterSpacing: 3,
      textTransform: "uppercase",
      marginBottom: 8,
    },
    recipientName: {
      fontSize: 26,
      fontWeight: "bold",
      textAlign: "center",
      color: "#0f172a",
      marginBottom: 4,
      borderBottom: "1pt solid #cbd5e1",
      marginHorizontal: 60,
      paddingBottom: 4,
    },
    bodyText: {
      fontSize: 10,
      textAlign: "center",
      color: "#334155",
      lineHeight: 1.7,
      marginHorizontal: 60,
      marginTop: 12,
      marginBottom: 16,
    },
    footer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      marginTop: 10,
    },
    signatureBlock: {
      width: 140,
      alignItems: "center",
    },
    signatureImage: {
      width: 80,
      height: 32,
      marginBottom: 4,
    },
    signatureLine: {
      width: "100%",
      borderTop: "1pt solid #0f172a",
      marginBottom: 4,
    },
    signatureName: {
      fontSize: 9,
      fontWeight: "bold",
      color: "#0f172a",
      textAlign: "center",
    },
    signatureRole: {
      fontSize: 7.5,
      color: "#64748b",
      textAlign: "center",
    },
    folioBlock: {
      alignItems: "center",
    },
    folioText: {
      fontSize: 7.5,
      color: "#64748b",
    },
    qrImage: {
      width: 52,
      height: 52,
      marginBottom: 3,
    },
    qrLabel: {
      fontSize: 6,
      color: "#94a3b8",
      textAlign: "center",
    },
  })

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.outerBorder}>
          <View style={styles.cornerTL} />
          <View style={styles.cornerTR} />
          <View style={styles.cornerBL} />
          <View style={styles.cornerBR} />

          <View style={styles.innerBorder}>
            <View style={styles.headerRow}>
              <View style={styles.logoBlock}>
                <Text style={styles.logoTitle}>{issuedBy}</Text>
                <Text style={styles.logoSubtitle}>ECOGRAFÍA NEUROMUSCULOESQUELÉTICA</Text>
              </View>
              <View>
                <Text style={{ fontSize: 7.5, color: "#64748b", textAlign: "right" }}>
                  Folio: {folio}
                </Text>
                <Text style={{ fontSize: 7.5, color: "#64748b", textAlign: "right", marginTop: 2 }}>
                  Fecha: {formattedDate}
                </Text>
              </View>
            </View>

            <Text style={styles.certTitle}>CERTIFICADO</Text>
            <View style={styles.divider} />

            <Text style={styles.grantedTo}>Se otorga a</Text>
            <Text style={styles.recipientName}>{recipientName}</Text>

            <Text style={styles.bodyText}>
              {institutionalText}
              {courseHours ? `\n(Duración: ${courseHours} horas)` : ""}
            </Text>

            <View style={styles.footer}>
              {signers.map((signer, i) => (
                <View key={i} style={styles.signatureBlock}>
                  {signer.signature_url ? (
                    <Image style={styles.signatureImage} src={signer.signature_url} />
                  ) : null}
                  <View style={styles.signatureLine} />
                  <Text style={styles.signatureName}>{signer.name}</Text>
                  <Text style={styles.signatureRole}>{signer.role}</Text>
                </View>
              ))}

              <View style={styles.folioBlock}>
                {qrDataUrl ? <Image style={styles.qrImage} src={qrDataUrl} /> : null}
                <Text style={styles.qrLabel}>Verificar autenticidad</Text>
                <Text style={[styles.qrLabel, { marginTop: 2 }]}>Escanea el código QR</Text>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}

// ─── Styles for the absolute‐positioned layout ───
const absoluteStyles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#fefcf3",
    padding: 0,
    fontFamily: "Helvetica",
  },
  outerBorder: {
    margin: 18,
    border: "3pt solid #c9a84c",
    flex: 1,
    padding: 0,
    position: "relative",
  },
  innerBorder: {
    margin: 6,
    border: "1pt solid #c9a84c",
    flex: 1,
    position: "relative",
  },
  cornerTL: { position: "absolute", top: 10, left: 10, width: 20, height: 20, borderTop: "2pt solid #c9a84c", borderLeft: "2pt solid #c9a84c" },
  cornerTR: { position: "absolute", top: 10, right: 10, width: 20, height: 20, borderTop: "2pt solid #c9a84c", borderRight: "2pt solid #c9a84c" },
  cornerBL: { position: "absolute", bottom: 10, left: 10, width: 20, height: 20, borderBottom: "2pt solid #c9a84c", borderLeft: "2pt solid #c9a84c" },
  cornerBR: { position: "absolute", bottom: 10, right: 10, width: 20, height: 20, borderBottom: "2pt solid #c9a84c", borderRight: "2pt solid #c9a84c" },
})
