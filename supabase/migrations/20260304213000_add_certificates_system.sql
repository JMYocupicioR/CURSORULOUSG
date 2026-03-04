-- ============================================================
-- CERTIFICATE CONFIG TABLE
-- Stores the admin-configurable template settings
-- ============================================================
CREATE TABLE IF NOT EXISTS public.certificate_config (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  course_name text NOT NULL DEFAULT 'Curso de Ecografía Neuromusculoesquelética',
  folio_prefix text NOT NULL DEFAULT 'CERT-USG-',
  course_hours text NOT NULL DEFAULT '120',
  institutional_text text DEFAULT 'Se otorga el presente certificado por haber completado satisfactoriamente el Curso de Ecografía Neuromusculoesquelética impartido por el Dr. Raúl Morales.',
  primary_color text DEFAULT '#0ea5e9',
  border_style text DEFAULT 'double',
  orientation text DEFAULT 'landscape',
  signers jsonb DEFAULT '[{"name":"Dr. Raúl Morales","role":"Director del Curso","signature_url":null}]',
  auto_issue boolean DEFAULT true,
  min_progress integer DEFAULT 100,
  require_evaluations boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.certificate_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage config" ON public.certificate_config;
CREATE POLICY "Admins manage config" ON public.certificate_config
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Allow anyone to read config (needed for public certificate rendering)
DROP POLICY IF EXISTS "Public can read config" ON public.certificate_config;
CREATE POLICY "Public can read config" ON public.certificate_config
  FOR SELECT USING (true);

-- Seed a single default config row
INSERT INTO public.certificate_config (course_name, folio_prefix, course_hours)
VALUES ('Curso de Ecografía Neuromusculoesquelética', 'CERT-USG-', '120')
ON CONFLICT DO NOTHING;

-- ============================================================
-- CERTIFICATES TABLE
-- Each issued certificate gets a row here
-- ============================================================
CREATE TABLE IF NOT EXISTS public.certificates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  folio text UNIQUE NOT NULL,
  recipient_name text NOT NULL,
  recipient_email text,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  course_name text NOT NULL,
  course_hours text,
  issued_by text DEFAULT 'Dr. Raúl Morales',
  issue_date timestamptz DEFAULT now(),
  pdf_url text,          -- public URL in Supabase Storage
  storage_path text,     -- internal path in the bucket
  qr_url text,           -- public verify URL
  is_manual boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Anyone can read certificates (for public verification page)
DROP POLICY IF EXISTS "Public can read certificates" ON public.certificates;
CREATE POLICY "Public can read certificates" ON public.certificates
  FOR SELECT USING (true);

-- Admins can do everything
DROP POLICY IF EXISTS "Admins manage certificates" ON public.certificates;
CREATE POLICY "Admins manage certificates" ON public.certificates
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Users can view their own certificates
DROP POLICY IF EXISTS "Users can view own certificates" ON public.certificates;
CREATE POLICY "Users can view own certificates" ON public.certificates
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- CERTIFICATES STORAGE BUCKET
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificates', 'certificates', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
DROP POLICY IF EXISTS "Public Access for certificates" ON storage.objects;
CREATE POLICY "Public Access for certificates" ON storage.objects
  FOR SELECT USING (bucket_id = 'certificates');

-- Only admins can upload/delete
DROP POLICY IF EXISTS "Admins can upload certificates" ON storage.objects;
CREATE POLICY "Admins can upload certificates" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'certificates' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can delete certificates" ON storage.objects;
CREATE POLICY "Admins can delete certificates" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'certificates' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
