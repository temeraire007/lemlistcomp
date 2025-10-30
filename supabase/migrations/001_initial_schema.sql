-- Initial Database Schema for LemList Competitor
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. USERS TABLE
-- ============================================
-- Stores user information synced from Clerk
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on clerk_user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON users(clerk_user_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
-- Using the new Clerk + Supabase integration (2025)
CREATE POLICY "Users can read own data" ON users
  FOR SELECT
  USING (
    clerk_user_id = (auth.jwt() ->> 'sub')
  );

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE
  USING (
    clerk_user_id = (auth.jwt() ->> 'sub')
  );

CREATE POLICY "System can insert users" ON users
  FOR INSERT
  WITH CHECK (true);

-- ============================================
-- 2. HELPER FUNCTION: Get current user ID
-- ============================================
-- This function gets the current user's UUID from their Clerk ID
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
DECLARE
  current_user_id UUID;
BEGIN
  SELECT id INTO current_user_id
  FROM users
  WHERE clerk_user_id = auth.jwt() ->> 'sub';
  
  RETURN current_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. UPDATED_AT TRIGGER
-- ============================================
-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for users table
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- NOTES
-- ============================================
-- This is the foundation schema. Additional tables will be added:
-- - campaigns: Store email campaigns
-- - leads: Store lead contacts
-- - email_activities: Track email sends, opens, clicks
-- - templates: Store email templates
-- 
-- Each table will have proper RLS policies to ensure data isolation

