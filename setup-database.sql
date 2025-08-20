-- Complete database setup for NHIS Healthcare Management System
-- Run this to set up the entire database from scratch

-- First, run the main schema creation
\i 0000_clean_tomorrow_man.sql

-- Then apply constraints and indexes
\i 0001_update_constraints_and_indexes.sql

-- Finally, seed with initial data
\i scripts/002-seed-initial-data.sql