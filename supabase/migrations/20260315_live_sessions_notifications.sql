-- =====================================================
-- MIGRATION: Live Sessions + Notifications System
-- Run this in Supabase SQL Editor: 
-- https://supabase.com/dashboard/project/sgpxbajxvpvcsyxhcnbg/sql/new
-- =====================================================

-- Step 1: Add new columns to live_sessions table
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS meeting_url TEXT DEFAULT '';
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'zoom';
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS duration_minutes INT DEFAULT 60;
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS send_to_all BOOLEAN DEFAULT true;
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS created_by UUID;

-- Step 2: Create session_recipients table
CREATE TABLE IF NOT EXISTS session_recipients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id, user_id)
);

-- Step 3: Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  type TEXT DEFAULT 'live_session',
  reference_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Step 4: Enable RLS
ALTER TABLE session_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Step 5: RLS Policies for session_recipients
CREATE POLICY session_recipients_admin_all ON session_recipients
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY session_recipients_student_select ON session_recipients
  FOR SELECT USING (user_id = auth.uid());

-- Step 6: RLS Policies for notifications
CREATE POLICY notifications_user_select ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY notifications_user_update ON notifications
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY notifications_admin_all ON notifications
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
