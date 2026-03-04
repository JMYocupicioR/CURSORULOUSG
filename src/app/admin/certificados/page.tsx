import { getCertificateConfig, getCertificatesList } from "@/lib/data"
import CertificadosClient from "@/components/certificates/CertificadosClient"

export default async function CertificadosPage() {
  const [config, certificates] = await Promise.all([
    getCertificateConfig(),
    getCertificatesList(),
  ])

  return (
    <CertificadosClient
      initialConfig={config}
      initialCertificates={certificates}
    />
  )
}
