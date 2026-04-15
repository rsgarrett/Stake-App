-- Fix RLS policies for meetings to allow inserts during development
-- This allows authenticated users to create meetings without requiring elevated roles

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Elevated roles can manage meetings" ON meetings;

-- Create a more permissive policy for development
-- Allows any authenticated user to manage meetings (for development when auth is bypassed)
-- This is less secure but allows development without full user setup
CREATE POLICY "Allow authenticated users to manage meetings"
  ON meetings FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

