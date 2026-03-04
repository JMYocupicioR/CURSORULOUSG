-- Tabla para registrar cada intento de un estudiante en un quiz
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    passed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Políticas RLS para quiz_attempts
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Los estudiantes pueden ver sus propios intentos
CREATE POLICY "Students can view their own attempts"
    ON public.quiz_attempts FOR SELECT
    USING (auth.uid() = user_id);

-- Los administradores y creadores pueden ver todos los intentos
CREATE POLICY "Staff can view all attempts"
    ON public.quiz_attempts FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'creator')
      )
    );

-- Solo el sistema (acciones de servidor ruteadas por el usuario autenticado) puede insertar sus propios intentos
CREATE POLICY "Users can insert their own attempts"
    ON public.quiz_attempts FOR INSERT
    WITH CHECK (auth.uid() = user_id);
