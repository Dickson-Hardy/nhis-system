-- Seed initial data for NHIS Healthcare Management System

-- Insert sample TPAs
INSERT INTO tpas (name, code, contact_email, contact_phone, address) VALUES
('HealthCare International TPA', 'HCI-TPA', 'admin@hci-tpa.com', '+234-800-1234-001', 'Plot 123, Victoria Island, Lagos'),
('MediCare Plus TPA', 'MCP-TPA', 'info@medicareplus.com', '+234-800-1234-002', 'No. 45, Garki District, Abuja'),
('WellHealth TPA Services', 'WHS-TPA', 'contact@wellhealth.com', '+234-800-1234-003', 'Block A, GRA, Port Harcourt'),
('Premium Health TPA', 'PHT-TPA', 'support@premiumhealth.com', '+234-800-1234-004', 'Ring Road, Ibadan, Oyo State');

-- Insert NHIS Admin user
INSERT INTO users (email, password, role, name) VALUES
('admin@nhis.gov.ng', '$2b$12$PJySFGdwztrPElkrUrLLP.BHImXDNBDrjpj/SWO8fjKwY6ZoQ7ZIO', 'nhis_admin', 'NHIS Administrator');

-- Insert sample TPA users
INSERT INTO users (email, password, role, name, tpa_id) VALUES
('admin@hci-tpa.com', '$2b$12$PJySFGdwztrPElkrUrLLP.BHImXDNBDrjpj/SWO8fjKwY6ZoQ7ZIO', 'tpa', 'HCI TPA Admin', 1),
('admin@medicareplus.com', '$2b$12$PJySFGdwztrPElkrUrLLP.BHImXDNBDrjpj/SWO8fjKwY6ZoQ7ZIO', 'tpa', 'MediCare Plus Admin', 2),
('admin@wellhealth.com', '$2b$12$PJySFGdwztrPElkrUrLLP.BHImXDNBDrjpj/SWO8fjKwY6ZoQ7ZIO', 'tpa', 'WellHealth Admin', 3),
('admin@premiumhealth.com', '$2b$12$PJySFGdwztrPElkrUrLLP.BHImXDNBDrjpj/SWO8fjKwY6ZoQ7ZIO', 'tpa', 'Premium Health Admin', 4);

-- Insert some realistic healthcare facilities (these can be used for real data)
INSERT INTO facilities (name, code, state, address, contact_email, contact_phone, tpa_id) VALUES
('Lagos University Teaching Hospital', 'LUTH-001', 'Lagos', 'Idi-Araba, Surulere, Lagos', 'admin@luth.edu.ng', '+234-1-7740123', 1),
('National Hospital Abuja', 'NHA-002', 'FCT', 'Central Business District, Abuja', 'info@nationalhospital.gov.ng', '+234-9-4613000', 2),
('University of Port Harcourt Teaching Hospital', 'UPTH-003', 'Rivers', 'East-West Road, Port Harcourt', 'admin@upth.edu.ng', '+234-84-300700', 3),
('University College Hospital Ibadan', 'UCH-004', 'Oyo', 'Queen Elizabeth Road, Ibadan', 'info@uch-ibadan.org.ng', '+234-2-2410088', 4),
('Ahmadu Bello University Teaching Hospital', 'ABUTH-005', 'Kaduna', 'Shika, Zaria, Kaduna', 'admin@abuth.org.ng', '+234-69-550011', 1),
('Federal Medical Centre Yola', 'FMC-YL-006', 'Adamawa', 'Jimeta, Yola', 'admin@fmcyola.org', '+234-75-627890', 2),
('Jos University Teaching Hospital', 'JUTH-007', 'Plateau', 'Jos, Plateau State', 'info@juth.edu.ng', '+234-73-464123', 3),
('Federal Medical Centre Lokoja', 'FMC-LK-008', 'Kogi', 'Lokoja, Kogi State', 'admin@fmclokoja.org', '+234-58-220456', 4),
('Usmanu Danfodiyo University Teaching Hospital', 'UDUTH-009', 'Sokoto', 'Sokoto, Sokoto State', 'info@uduth.edu.ng', '+234-60-235789', 1),
('Federal Medical Centre Asaba', 'FMC-AS-010', 'Delta', 'Asaba, Delta State', 'admin@fmcasaba.org', '+234-56-282123', 2),
('RASHEED SHEKONI FEDERAL UNIVERSITY TEACHING HOSPITAL DUTSE', 'JG0027', 'Jigawa', 'Dutse, Jigawa State', 'admin@rsufth.edu.ng', '+234-64-721890', 1);

-- Insert sample facility users (these will be used to test real uploads)
INSERT INTO users (email, password, role, name, facility_id) VALUES
('admin@luth.edu.ng', '$2b$12$PJySFGdwztrPElkrUrLLP.BHImXDNBDrjpj/SWO8fjKwY6ZoQ7ZIO', 'facility', 'LUTH Administrator', 1),
('admin@upth.edu.ng', '$2b$12$PJySFGdwztrPElkrUrLLP.BHImXDNBDrjpj/SWO8fjKwY6ZoQ7ZIO', 'facility', 'UPTH Administrator', 3),
('info@uch-ibadan.org.ng', '$2b$12$PJySFGdwztrPElkrUrLLP.BHImXDNBDrjpj/SWO8fjKwY6ZoQ7ZIO', 'facility', 'UCH Administrator', 4),
('admin@rsufth.edu.ng', '$2b$12$PJySFGdwztrPElkrUrLLP.BHImXDNBDrjpj/SWO8fjKwY6ZoQ7ZIO', 'facility', 'RSUFTH Administrator', 11);

-- No demo claims or batches - system ready for real data upload
