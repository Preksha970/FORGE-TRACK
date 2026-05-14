-- ForgeTrack Seed Data
-- Only mentor accounts are seeded. All other data (students, sessions, attendance, materials)
-- should be created through the application UI by the mentor.

-- Clear data
DELETE FROM attendance;
DELETE FROM materials;
DELETE FROM sessions;
DELETE FROM students;
DELETE FROM users;

-- Setup Mentor Users
-- Note: Replace these UUIDs when setting up real auth via Supabase UI, or run script below.
DO $$
DECLARE
  mentor1_id UUID := gen_random_uuid();
  mentor2_id UUID := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
  VALUES 
    (mentor1_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'nischay@theboringpeople.in', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW()),
    (mentor2_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'varun@theboringpeople.in', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW());

  INSERT INTO public.users (id, email, role, display_name)
  VALUES 
    (mentor1_id, 'nischay@theboringpeople.in', 'mentor', 'Nischay B K'),
    (mentor2_id, 'varun@theboringpeople.in', 'mentor', 'Varun');
END
$$;
