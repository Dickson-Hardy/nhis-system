-- Create tables for NHIS Healthcare Management System

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('tpa', 'facility', 'nhis_admin')),
  name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- TPAs table
CREATE TABLE IF NOT EXISTS tpas (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Healthcare Facilities table
CREATE TABLE IF NOT EXISTS facilities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  state VARCHAR(100) NOT NULL,
  address TEXT,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  tpa_id INTEGER REFERENCES tpas(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Claims table (main table with all Excel fields)
CREATE TABLE IF NOT EXISTS claims (
  id SERIAL PRIMARY KEY,
  serial_number INTEGER,
  unique_beneficiary_id VARCHAR(100) NOT NULL,
  unique_claim_id VARCHAR(100) NOT NULL UNIQUE,
  tpa_id INTEGER REFERENCES tpas(id) NOT NULL,
  facility_id INTEGER REFERENCES facilities(id) NOT NULL,
  batch_number VARCHAR(100),
  hospital_number VARCHAR(100),
  
  -- Patient Information
  date_of_admission DATE,
  beneficiary_name VARCHAR(255) NOT NULL,
  date_of_birth DATE,
  age INTEGER,
  address TEXT,
  phone_number VARCHAR(20),
  nin VARCHAR(20),
  
  -- Treatment Information
  date_of_treatment DATE,
  date_of_discharge DATE,
  primary_diagnosis TEXT,
  secondary_diagnosis TEXT,
  treatment_procedure TEXT,
  quantity INTEGER,
  cost DECIMAL(12,2),
  
  -- Submission Information
  date_of_claim_submission DATE,
  month_of_submission VARCHAR(20),
  
  -- Cost Breakdown
  cost_of_investigation DECIMAL(12,2),
  cost_of_procedure DECIMAL(12,2),
  cost_of_medication DECIMAL(12,2),
  cost_of_other_services DECIMAL(12,2),
  total_cost_of_care DECIMAL(12,2),
  approved_cost_of_care DECIMAL(12,2),
  
  -- Decision and Payment
  decision VARCHAR(50) CHECK (decision IN ('approved', 'rejected', 'pending')),
  reason_for_rejection TEXT,
  date_of_claims_payment DATE,
  tpa_remarks TEXT,
  
  -- System fields
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected')),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Batches table
CREATE TABLE IF NOT EXISTS batches (
  id SERIAL PRIMARY KEY,
  batch_number VARCHAR(100) NOT NULL UNIQUE,
  tpa_id INTEGER REFERENCES tpas(id) NOT NULL,
  total_claims INTEGER DEFAULT 0,
  total_amount DECIMAL(15,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'reviewed', 'approved')),
  submitted_at TIMESTAMP,
  reviewed_at TIMESTAMP,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_claims_tpa_id ON claims(tpa_id);
CREATE INDEX IF NOT EXISTS idx_claims_facility_id ON claims(facility_id);
CREATE INDEX IF NOT EXISTS idx_claims_batch_number ON claims(batch_number);
CREATE INDEX IF NOT EXISTS idx_claims_unique_claim_id ON claims(unique_claim_id);
CREATE INDEX IF NOT EXISTS idx_facilities_tpa_id ON facilities(tpa_id);
CREATE INDEX IF NOT EXISTS idx_batches_tpa_id ON batches(tpa_id);
