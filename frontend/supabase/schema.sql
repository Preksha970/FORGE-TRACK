-- ForgeTrack Schema

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  usn TEXT UNIQUE NOT NULL,
  admission_number TEXT,
  email TEXT,
  branch_code TEXT NOT NULL,
  batch TEXT DEFAULT '2024-2028',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE CHECK (date >= '2025-08-04' AND date <= CURRENT_DATE),
  topic TEXT NOT NULL,
  month_number INTEGER NOT NULL,
  duration_hours DECIMAL(3,1) DEFAULT 2.0,
  session_type TEXT DEFAULT 'offline',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE import_log (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_rows INTEGER NOT NULL,
  imported_rows INTEGER NOT NULL,
  skipped_rows INTEGER NOT NULL,
  warnings JSONB,
  column_mapping JSONB,
  status TEXT NOT NULL
);

CREATE TABLE attendance (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id),
  session_id INTEGER NOT NULL REFERENCES sessions(id),
  present BOOLEAN NOT NULL,
  marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  marked_by TEXT DEFAULT 'system',
  import_id INTEGER REFERENCES import_log(id),
  UNIQUE(student_id, session_id)
);

CREATE TABLE materials (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES sessions(id),
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('mentor', 'student')),
  student_id INTEGER REFERENCES students(id),
  display_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Configuration
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_mentor() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'mentor');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_student_id() RETURNS INTEGER AS $$
DECLARE
  sid INTEGER;
BEGIN
  SELECT student_id INTO sid FROM public.users WHERE id = auth.uid();
  RETURN sid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "students_mentor_all" ON students FOR ALL USING (is_mentor());
CREATE POLICY "students_read_own" ON students FOR SELECT USING (id = get_student_id());

CREATE POLICY "sessions_mentor_all" ON sessions FOR ALL USING (is_mentor());
CREATE POLICY "sessions_student_read" ON sessions FOR SELECT USING (true);

CREATE POLICY "attendance_mentor_all" ON attendance FOR ALL USING (is_mentor());
CREATE POLICY "attendance_student_read" ON attendance FOR SELECT USING (student_id = get_student_id());

CREATE POLICY "materials_mentor_all" ON materials FOR ALL USING (is_mentor());
CREATE POLICY "materials_student_read" ON materials FOR SELECT USING (true);

CREATE POLICY "importlog_mentor_all" ON import_log FOR ALL USING (is_mentor());

CREATE POLICY "users_mentor_all" ON users FOR ALL USING (is_mentor());
CREATE POLICY "users_read_own" ON users FOR SELECT USING (id = auth.uid());

-- Trigger to create student auth account
CREATE OR REPLACE FUNCTION create_student_user()
RETURNS TRIGGER AS $$
DECLARE
  new_user_id UUID;
BEGIN
  new_user_id := gen_random_uuid();
  
  INSERT INTO auth.users (id, instance_id, aud, role, email, raw_user_meta_data, encrypted_password, email_confirmed_at, created_at, updated_at)
  VALUES (
    new_user_id, 
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    LOWER(NEW.usn) || '@forge.local', 
    jsonb_build_object('role', 'student'), 
    crypt(NEW.usn, gen_salt('bf')),
    NOW(),
    NOW(),
    NOW()
  );
  
  INSERT INTO public.users (id, email, role, student_id, display_name)
  VALUES (
    new_user_id,
    LOWER(NEW.usn) || '@forge.local',
    'student',
    NEW.id,
    NEW.name
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_student_created
AFTER INSERT ON students
FOR EACH ROW EXECUTE FUNCTION create_student_user();
