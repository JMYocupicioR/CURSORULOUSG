-- ============================================================
-- FORUM TABLES MIGRATION
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- Forum Threads (hilos principales del foro)
CREATE TABLE IF NOT EXISTS forum_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  is_pinned BOOLEAN DEFAULT FALSE,
  is_official BOOLEAN DEFAULT FALSE,
  reply_count INT DEFAULT 0,
  like_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Forum Posts (respuestas dentro de cada hilo)
CREATE TABLE IF NOT EXISTS forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES forum_threads(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  body TEXT NOT NULL,
  like_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Thread Likes (para evitar likes duplicados)
CREATE TABLE IF NOT EXISTS forum_thread_likes (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES forum_threads(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, thread_id)
);

-- Indexes para rendimiento
CREATE INDEX IF NOT EXISTS idx_forum_threads_created ON forum_threads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_posts_thread ON forum_posts(thread_id);

-- ─── RLS Policies ──────────────────────────────────────────────────────────

ALTER TABLE forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_thread_likes ENABLE ROW LEVEL SECURITY;

-- Leer hilos: alumnos activos y admins
CREATE POLICY "Enrolled users can view threads" ON forum_threads
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM enrollments e WHERE e.user_id = auth.uid() AND e.status = 'active')
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Crear hilos: alumnos activos y admins
CREATE POLICY "Enrolled users can create threads" ON forum_threads
  FOR INSERT WITH CHECK (
    auth.uid() = author_id AND (
      EXISTS (SELECT 1 FROM enrollments e WHERE e.user_id = auth.uid() AND e.status = 'active')
      OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
    )
  );

-- Eliminar hilos: solo el autor o admin
CREATE POLICY "Authors can delete own threads" ON forum_threads
  FOR DELETE USING (
    auth.uid() = author_id OR
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Posts: leer
CREATE POLICY "Enrolled users can view posts" ON forum_posts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM enrollments e WHERE e.user_id = auth.uid() AND e.status = 'active')
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Posts: crear
CREATE POLICY "Enrolled users can create posts" ON forum_posts
  FOR INSERT WITH CHECK (
    auth.uid() = author_id AND (
      EXISTS (SELECT 1 FROM enrollments e WHERE e.user_id = auth.uid() AND e.status = 'active')
      OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
    )
  );

-- Likes
CREATE POLICY "Users can view likes" ON forum_thread_likes FOR SELECT USING (true);
CREATE POLICY "Users can manage own likes" ON forum_thread_likes
  FOR ALL USING (auth.uid() = user_id);

-- ─── Trigger: actualizar reply_count automáticamente ──────────────────────

CREATE OR REPLACE FUNCTION update_thread_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_threads SET reply_count = reply_count + 1, updated_at = NOW() WHERE id = NEW.thread_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_threads SET reply_count = GREATEST(reply_count - 1, 0) WHERE id = OLD.thread_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_thread_reply_count ON forum_posts;
CREATE TRIGGER trg_thread_reply_count
  AFTER INSERT OR DELETE ON forum_posts
  FOR EACH ROW EXECUTE FUNCTION update_thread_reply_count();

-- ─── Función para toggle like (llama como RPC) ────────────────────────────

CREATE OR REPLACE FUNCTION toggle_thread_like(p_thread_id UUID)
RETURNS TABLE(liked BOOLEAN, new_count INT) AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM forum_thread_likes
    WHERE user_id = auth.uid() AND thread_id = p_thread_id
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM forum_thread_likes WHERE user_id = auth.uid() AND thread_id = p_thread_id;
    UPDATE forum_threads SET like_count = GREATEST(like_count - 1, 0) WHERE id = p_thread_id;
    RETURN QUERY SELECT FALSE, (SELECT like_count FROM forum_threads WHERE id = p_thread_id);
  ELSE
    INSERT INTO forum_thread_likes (user_id, thread_id) VALUES (auth.uid(), p_thread_id);
    UPDATE forum_threads SET like_count = like_count + 1 WHERE id = p_thread_id;
    RETURN QUERY SELECT TRUE, (SELECT like_count FROM forum_threads WHERE id = p_thread_id);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
