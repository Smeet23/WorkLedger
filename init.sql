-- Initial database setup for WorkLedger
-- This file runs when the Docker container is first created

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enum types for better data integrity
CREATE TYPE subscription_tier AS ENUM ('startup', 'growth', 'enterprise');
CREATE TYPE employee_role AS ENUM ('developer', 'designer', 'manager', 'sales', 'marketing', 'other');
CREATE TYPE skill_level AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');
CREATE TYPE certificate_status AS ENUM ('draft', 'issued', 'revoked');

-- Set timezone
SET timezone = 'UTC';

-- Create initial schemas for better organization
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS tracking;
CREATE SCHEMA IF NOT EXISTS certificates;

-- Grant permissions
GRANT ALL ON SCHEMA auth TO workledger_user;
GRANT ALL ON SCHEMA core TO workledger_user;
GRANT ALL ON SCHEMA tracking TO workledger_user;
GRANT ALL ON SCHEMA certificates TO workledger_user;