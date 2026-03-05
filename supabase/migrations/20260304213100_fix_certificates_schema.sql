
-- 1. Añadir columnas a la configuración
ALTER TABLE public.certificate_config 
ADD COLUMN IF NOT EXISTS element_layout jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS background_url text DEFAULT NULL;

-- 2. Asegurar TODAS las columnas base en la tabla 'certificates'
ALTER TABLE public.certificates 
ADD COLUMN IF NOT EXISTS folio text UNIQUE,
ADD COLUMN IF NOT EXISTS recipient_name text,
ADD COLUMN IF NOT EXISTS recipient_email text,
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS course_name text,
ADD COLUMN IF NOT EXISTS course_hours text,
ADD COLUMN IF NOT EXISTS issued_by text DEFAULT 'Dr. Raúl Morales',
ADD COLUMN IF NOT EXISTS issue_date timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS pdf_url text,
ADD COLUMN IF NOT EXISTS storage_path text,
ADD COLUMN IF NOT EXISTS qr_url text,
ADD COLUMN IF NOT EXISTS is_manual boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- 3. Crear el depósito para imágenes de certificados
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificate-assets', 'certificate-assets', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Dar permisos de lectura pública a las imágenes
DROP POLICY IF EXISTS "Public Access for certificate-assets" ON storage.objects;
CREATE POLICY "Public Access for certificate-assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'certificate-assets');

-- =========================================================
-- IMPORTANTE: RECARGAR EL CACHÉ DE ESQUEMA DE SUPABASE API
-- =========================================================
NOTIFY pgrst, 'reload schema';
