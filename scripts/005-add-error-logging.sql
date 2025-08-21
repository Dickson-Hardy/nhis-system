-- Migration: Add Error Logging Tables
-- This migration adds comprehensive error logging capabilities for TPA and Admin oversight

-- Create error_logs table
CREATE TABLE IF NOT EXISTS error_logs (
    id SERIAL PRIMARY KEY,
    batch_id INTEGER REFERENCES batches(id),
    claim_id INTEGER REFERENCES claims(id),
    tpa_id INTEGER REFERENCES tpas(id) NOT NULL,
    facility_id INTEGER REFERENCES facilities(id),
    
    -- Error Classification
    error_type VARCHAR(100) NOT NULL CHECK (error_type IN ('validation', 'discrepancy', 'fraud', 'quality')),
    error_category VARCHAR(100) NOT NULL CHECK (error_category IN ('missing_data', 'duplicate', 'cost_anomaly', 'decision_mismatch')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    
    -- Error Details
    error_code VARCHAR(50) NOT NULL,
    error_title VARCHAR(255) NOT NULL,
    error_description TEXT NOT NULL,
    
    -- Data Validation
    field_name VARCHAR(100),
    expected_value TEXT,
    actual_value TEXT,
    
    -- Financial Validation
    expected_amount DECIMAL(15,2),
    actual_amount DECIMAL(15,2),
    amount_deviation DECIMAL(15,2),
    deviation_percentage DECIMAL(5,2),
    
    -- Status and Resolution
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'ignored')),
    resolution TEXT,
    resolved_by INTEGER REFERENCES users(id),
    resolved_at TIMESTAMP,
    
    -- Audit Fields
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create error_rules table
CREATE TABLE IF NOT EXISTS error_rules (
    id SERIAL PRIMARY KEY,
    rule_name VARCHAR(255) NOT NULL,
    rule_description TEXT NOT NULL,
    
    -- Rule Configuration
    error_type VARCHAR(100) NOT NULL,
    error_category VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    
    -- Validation Criteria
    field_name VARCHAR(100),
    validation_type VARCHAR(50),
    validation_rule TEXT,
    threshold_value DECIMAL(15,2),
    
    -- Financial Thresholds
    min_amount DECIMAL(15,2),
    max_amount DECIMAL(15,2),
    max_deviation_percentage DECIMAL(5,2),
    
    -- Rule Status
    is_active BOOLEAN DEFAULT true,
    is_automated BOOLEAN DEFAULT true,
    
    -- Audit Fields
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create error_reviews table
CREATE TABLE IF NOT EXISTS error_reviews (
    id SERIAL PRIMARY KEY,
    batch_id INTEGER REFERENCES batches(id),
    tpa_id INTEGER REFERENCES tpas(id),
    
    -- Review Details
    review_type VARCHAR(50) NOT NULL CHECK (review_type IN ('tpa_review', 'admin_review', 'joint_review')),
    review_status VARCHAR(50) DEFAULT 'pending' CHECK (review_status IN ('pending', 'in_progress', 'completed', 'escalated')),
    
    -- Review Content
    review_notes TEXT,
    action_items TEXT,
    recommendations TEXT,
    
    -- Participants
    tpa_reviewer INTEGER REFERENCES users(id),
    admin_reviewer INTEGER REFERENCES users(id),
    
    -- Timestamps
    tpa_reviewed_at TIMESTAMP,
    admin_reviewed_at TIMESTAMP,
    completed_at TIMESTAMP,
    
    -- Audit Fields
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_error_logs_tpa_id ON error_logs(tpa_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_batch_id ON error_logs(batch_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_claim_id ON error_logs(claim_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_status ON error_logs(status);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_error_rules_error_type ON error_rules(error_type);
CREATE INDEX IF NOT EXISTS idx_error_rules_is_active ON error_rules(is_active);

CREATE INDEX IF NOT EXISTS idx_error_reviews_batch_id ON error_reviews(batch_id);
CREATE INDEX IF NOT EXISTS idx_error_reviews_tpa_id ON error_reviews(tpa_id);
CREATE INDEX IF NOT EXISTS idx_error_reviews_review_status ON error_reviews(review_status);

-- Insert default error rules
INSERT INTO error_rules (rule_name, rule_description, error_type, error_category, severity, field_name, validation_type, validation_rule, max_amount, max_deviation_percentage, created_by) VALUES
('Missing Primary Diagnosis', 'Flag claims missing primary diagnosis', 'validation', 'missing_data', 'high', 'primary_diagnosis', 'required', 'NOT NULL AND LENGTH(TRIM(primary_diagnosis)) > 0', NULL, NULL, 1),
('Missing Submission Date', 'Flag claims missing submission date', 'validation', 'missing_data', 'high', 'date_of_claim_submission', 'required', 'NOT NULL', NULL, NULL, 1),
('Missing Treatment Procedure', 'Flag claims missing treatment procedure', 'validation', 'missing_data', 'medium', 'treatment_procedure', 'required', 'NOT NULL AND LENGTH(TRIM(treatment_procedure)) > 0', NULL, NULL, 1),
('Rejected with Approved Cost', 'Flag rejected claims with approved costs', 'discrepancy', 'decision_mismatch', 'critical', 'approved_cost_of_care', 'custom', 'decision = ''rejected'' AND approved_cost_of_care > 0', 0, 100, 1),
('No Decision with Approved Cost', 'Flag claims with approved costs but no decision', 'discrepancy', 'decision_mismatch', 'high', 'decision', 'custom', 'decision IS NULL AND approved_cost_of_care > 0', 0, 100, 1),
('Excessive Claim Cost', 'Flag claims with unusually high costs', 'fraud', 'cost_anomaly', 'critical', 'total_cost_of_care', 'range', 'total_cost_of_care <= 1000000', 1000000, NULL, 1),
('Invalid Claim Cost', 'Flag claims with zero or negative costs', 'validation', 'cost_anomaly', 'high', 'total_cost_of_care', 'range', 'total_cost_of_care > 0', 1, NULL, 1),
('Cost Outliers', 'Flag claims with costs significantly above batch average', 'fraud', 'cost_anomaly', 'high', 'total_cost_of_care', 'custom', 'total_cost_of_care > (SELECT AVG(total_cost_of_care) * 3 FROM claims WHERE batch_number = error_logs.batch_number)', NULL, 200, 1),
('Duplicate Claims', 'Flag duplicate claim IDs within batches', 'fraud', 'duplicate', 'critical', 'unique_claim_id', 'custom', 'COUNT(*) > 1 GROUP BY unique_claim_id, batch_number', NULL, NULL, 1);

-- Add comments for documentation
COMMENT ON TABLE error_logs IS 'Comprehensive error logging for data quality issues, discrepancies, and validation errors';
COMMENT ON TABLE error_rules IS 'Configurable rules for automated error detection and validation';
COMMENT ON TABLE error_reviews IS 'Collaborative review sessions between TPA and Admin users for error resolution';

COMMENT ON COLUMN error_logs.error_type IS 'Classification of error: validation, discrepancy, fraud, or quality';
COMMENT ON COLUMN error_logs.error_category IS 'Specific category: missing_data, duplicate, cost_anomaly, decision_mismatch';
COMMENT ON COLUMN error_logs.severity IS 'Error severity level: low, medium, high, or critical';
COMMENT ON COLUMN error_logs.amount_deviation IS 'Difference between expected and actual amounts';
COMMENT ON COLUMN error_logs.deviation_percentage IS 'Percentage deviation from expected values';

-- Create a view for easy error analysis
CREATE OR REPLACE VIEW error_summary AS
SELECT 
    el.tpa_id,
    t.name as tpa_name,
    el.facility_id,
    f.name as facility_name,
    COUNT(*) as total_errors,
    COUNT(CASE WHEN el.status = 'open' THEN 1 END) as open_errors,
    COUNT(CASE WHEN el.status = 'resolved' THEN 1 END) as resolved_errors,
    COUNT(CASE WHEN el.severity = 'critical' THEN 1 END) as critical_errors,
    COUNT(CASE WHEN el.severity = 'high' THEN 1 END) as high_errors,
    COUNT(CASE WHEN el.severity = 'medium' THEN 1 END) as medium_errors,
    COUNT(CASE WHEN el.severity = 'low' THEN 1 END) as low_errors,
    MAX(el.created_at) as last_error_date
FROM error_logs el
LEFT JOIN tpas t ON el.tpa_id = t.id
LEFT JOIN facilities f ON el.facility_id = f.id
GROUP BY el.tpa_id, t.name, el.facility_id, f.name;

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE ON error_logs TO tpa_role;
-- GRANT SELECT, INSERT, UPDATE ON error_rules TO admin_role;
-- GRANT SELECT, INSERT, UPDATE ON error_reviews TO tpa_role, admin_role;
