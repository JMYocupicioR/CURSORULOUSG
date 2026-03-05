"use client"

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// PDF components imported statically. pdf renderer imported dynamically on click.
// Formateo de fecha
const formatDate = (dateString?: string) => {
  if (!dateString) return new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  const d = new Date(dateString);
  return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
};

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  borderRoot: {
    border: '2pt solid #0f172a',
    borderRadius: 8,
    flex: 1,
    padding: 30,
    position: 'relative'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    alignItems: 'center'
  },
  headerText: {
    fontSize: 12,
    color: '#64748b'
  },
  title: {
    fontSize: 32,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 20,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#475569',
    marginBottom: 40,
  },
  presentedTo: {
    fontSize: 12,
    textAlign: 'center',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 10,
  },
  studentName: {
    fontSize: 28,
    textAlign: 'center',
    color: '#0f172a',
    fontWeight: 'bold',
    marginBottom: 30,
    borderBottom: '1pt solid #cbd5e1',
    marginHorizontal: 100,
    paddingBottom: 5,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    color: '#334155',
    lineHeight: 1.5,
    marginHorizontal: 60,
    marginBottom: 50,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
  },
  signatureBox: {
    width: 200,
    alignItems: 'center',
  },
  signatureLine: {
    borderTop: '1pt solid #0f172a',
    width: '100%',
    marginTop: 40,
    marginBottom: 8,
  },
  signatureName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  signatureRole: {
    fontSize: 10,
    color: '#64748b',
  },
  dateBox: {
    position: 'absolute',
    top: 30,
    right: 30,
    fontSize: 10,
    color: '#64748b'
  }
});

// Document Component
const CertificateDocument = ({ studentName, date }: { studentName: string, date: string }) => (
  <Document>
    <Page size="A4" orientation="landscape" style={styles.page}>
      <View style={styles.borderRoot}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Avalado por: Sociedad Mexicana de Medicina Física</Text>
          <Text style={styles.dateBox}>Emitido: {formatDate(date)}</Text>
        </View>

        <Text style={styles.title}>CERTIFICADO DE FINALIZACIÓN</Text>
        <Text style={styles.subtitle}>Diplomado en Rehabilitación Intervencionista</Text>

        <Text style={styles.presentedTo}>Este certificado es otorgado a</Text>
        <Text style={styles.studentName}>{studentName || "Estudiante"}</Text>

        <Text style={styles.description}>
          Por haber completado con éxito todos los módulos obligatorios, talleres presenciales y
          cuestionarios de evaluación del diplomado, demostrando competencia en los fundamentos y técnicas
          de la Rehabilitación Intervencionista y Ecografía Musculoesquelética.
        </Text>

        <View style={styles.footer}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureName}>Dr. Raúl Morales</Text>
            <Text style={styles.signatureRole}>Director General del Curso</Text>
          </View>

          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureName}>Sociedad Mexicana</Text>
            <Text style={styles.signatureRole}>Mesa Directiva (Aval)</Text>
          </View>
        </View>
      </View>
    </Page>
  </Document>
);

export function CertificateGenerator({ 
  studentName = "Estudiante", 
  date = new Date().toISOString(),
  className
}: { 
  studentName?: string, 
  date?: string,
  className?: string 
}) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return (
    <div className="flex items-center gap-2 text-violet-500 font-semibold bg-violet-500/10 px-4 py-2 rounded-xl">
      <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
      Preparando certificado...
    </div>
  );

  const handleDownload = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const { pdf } = await import('@react-pdf/renderer');
      const doc = <CertificateDocument studentName={studentName} date={date} />;
      const blob = await pdf(doc).toBlob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Certificado_DrRaulMorales_${studentName.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error generating student certificate:", err);
      alert("Hubo un error al generar el PDF del certificado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className={cn(
        "flex items-center justify-center gap-2 px-6 py-3 bg-linear-to-r from-violet-600 to-primary text-white font-bold rounded-2xl hover:opacity-90 transition-opacity shadow-lg shadow-primary/20",
        className,
        loading ? "opacity-70 cursor-not-allowed" : ""
      )}
    >
      {loading ? (
        <>
          <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
          Generando PDF...
        </>
      ) : (
        <>
          <span className="material-symbols-outlined text-base">workspace_premium</span>
          ¡Descargar Certificado!
        </>
      )}
    </button>
  );
}

