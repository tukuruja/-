-- Migration: 004_create_estimate_extras_table.sql
-- Description: Create supporting tables for extra works, exclusions, and options
-- Date: 2026-04-13

-- 追加工事 (Extra/Change Orders)
CREATE TABLE estimate_extra_works (
  id VARCHAR(36) PRIMARY KEY,
  estimate_id VARCHAR(36) NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  selling_amount DECIMAL(15,2) DEFAULT 0,
  cost_amount DECIMAL(15,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 別途工事 (Exclusions)
CREATE TABLE estimate_exclusions (
  id VARCHAR(36) PRIMARY KEY,
  estimate_id VARCHAR(36) NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- オプション設定
CREATE TABLE estimate_options (
  id VARCHAR(36) PRIMARY KEY,
  estimate_id VARCHAR(36) NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  selling_amount DECIMAL(15,2) DEFAULT 0,
  cost_amount DECIMAL(15,2) DEFAULT 0,
  is_selected BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_estimate_extra_works_estimate ON estimate_extra_works(estimate_id);
CREATE INDEX idx_estimate_extra_works_status ON estimate_extra_works(status);
CREATE INDEX idx_estimate_exclusions_estimate ON estimate_exclusions(estimate_id);
CREATE INDEX idx_estimate_options_estimate ON estimate_options(estimate_id);
CREATE INDEX idx_estimate_options_selected ON estimate_options(is_selected);

-- Comments
COMMENT ON TABLE estimate_extra_works IS '追加工事 - Change orders and extra work items';
COMMENT ON TABLE estimate_exclusions IS '別途工事 - Items explicitly excluded from estimate';
COMMENT ON TABLE estimate_options IS 'Optional items that client can select/deselect';
