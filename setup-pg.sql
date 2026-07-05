-- Compass PostgreSQL Setup Script
-- This script creates the timelog user and compass database

-- 1. Create the timelog user
CREATE USER timelog WITH PASSWORD 'timelog123';

-- 2. Create the compass database
CREATE DATABASE compass OWNER timelog;

-- 3. Grant privileges
GRANT ALL PRIVILEGES ON DATABASE compass TO timelog;

-- 4. Connect to compass and set schema ownership
\c compass

-- 5. Grant schema privileges
GRANT ALL ON SCHEMA public TO timelog;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO timelog;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO timelog;
