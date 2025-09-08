-- NextAuth.js required tables for Supabase (Safe version)
-- Run this in your Supabase SQL editor

-- Create NextAuth tables (only if they don't exist)
CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  type VARCHAR(255) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  "providerAccountId" VARCHAR(255) NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  id_token TEXT,
  scope VARCHAR(255),
  session_state VARCHAR(255),
  oauth_token_secret VARCHAR(255),
  oauth_token VARCHAR(255),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT accounts_provider_providerAccountId_key UNIQUE(provider, "providerAccountId")
);

CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  expires TIMESTAMP WITH TIME ZONE NOT NULL,
  "sessionToken" VARCHAR(255) NOT NULL UNIQUE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  "emailVerified" TIMESTAMP WITH TIME ZONE,
  image TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires TIMESTAMP WITH TIME ZONE NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS accounts_userId_idx ON accounts("userId");
CREATE INDEX IF NOT EXISTS sessions_userId_idx ON sessions("userId");
CREATE INDEX IF NOT EXISTS sessions_sessionToken_idx ON sessions("sessionToken");
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);

-- Enable RLS (safe to run multiple times)
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can view own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can view own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can view own user record" ON users;
DROP POLICY IF EXISTS "NextAuth can manage accounts" ON accounts;
DROP POLICY IF EXISTS "NextAuth can manage sessions" ON sessions;
DROP POLICY IF EXISTS "NextAuth can manage users" ON users;
DROP POLICY IF EXISTS "NextAuth can manage verification tokens" ON verification_tokens;

-- Create RLS policies
CREATE POLICY "Users can view own accounts" ON accounts
  FOR SELECT USING (auth.uid()::text = "userId"::text);

CREATE POLICY "Users can view own sessions" ON sessions
  FOR SELECT USING (auth.uid()::text = "userId"::text);

CREATE POLICY "Users can view own user record" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

-- Allow NextAuth to manage these tables
CREATE POLICY "NextAuth can manage accounts" ON accounts
  FOR ALL USING (true);

CREATE POLICY "NextAuth can manage sessions" ON sessions
  FOR ALL USING (true);

CREATE POLICY "NextAuth can manage users" ON users
  FOR ALL USING (true);

CREATE POLICY "NextAuth can manage verification tokens" ON verification_tokens
  FOR ALL USING (true);

-- Credentials support: store password hashes
CREATE TABLE IF NOT EXISTS user_credentials (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_credentials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Manage own credentials" ON user_credentials;
CREATE POLICY "Manage own credentials" ON user_credentials
  FOR ALL USING (auth.uid()::text = user_id::text);