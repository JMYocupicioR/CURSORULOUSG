-- Script para crear el sistema de Micro-Aprendizaje
-- Ejecutar este script en el SQL Editor de Supabase

-- 1. Crear tabla micro_lessons
CREATE TABLE IF NOT EXISTS public.micro_lessons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER DEFAULT 5,
    category TEXT DEFAULT 'General',
    thumbnail_url TEXT,
    video_url TEXT,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilitar RLS (Row Level Security)
ALTER TABLE public.micro_lessons ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas de seguridad (Policies)
-- Los usuarios autenticados pueden ver las lecciones publicadas
CREATE POLICY "Public micro_lessons are viewable by everyone."
ON public.micro_lessons FOR SELECT
TO authenticated
USING (is_published = true);

-- Los administradores (rol 'admin' en config o por defecto service_role puede saltarse esto) pueden hacer todo
-- Como estamos usando service_role para las acciones de admin, no necesitamos una policy adicional para inserts/updates
-- si se hace desde Server Actions con admin client. Sin embargo, para mayor seguridad y permisos de select sin filtros:
CREATE POLICY "Admins can do everything on micro_lessons."
ON public.micro_lessons TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);
