-- Migration: 001_create_estimates_table.sql
-- Description: Create the main ESTIMATES table for building estimates
-- Date: 2026-04-13

CREATE TABLE estimates (
  id VARCHAR(36) PRIMARY KEY,
  company_id VARCHAR(36) NOT NULL REFERENCES companies(id),
  project_id VARCHAR(36) REFERENCES projects(id),
  counterparty_id VARCHAR(36) REFERENCES counterparties(id),

  -- Type discriminators (nullable for backward compat)
  estimate_type VARCHAR(20) DEFAULT 'standard', -- 'standard' | 'civil' | 'building'
  building_mode VARCHAR(20), -- 'new_build' | 'reform' (only when estimate_type='building')

  -- Building-specific fields (all nullable)
  building_type VARCHAR(50),      -- '住宅' | '店舗' | 'マンション' | etc.
  structure_type VARCHAR(50),     -- '木造' | '鉄骨' | 'RC' | 'SRC'
  estimate_stage VARCHAR(20),     -- 'concept' | 'basic' | 'detailed' | 'final'
  floor_area DECIMAL(10,2),       -- 延床面積 (m2)

  -- Core fields
  title VARCHAR(255),
  status VARCHAR(20) DEFAULT 'draft', -- 'draft' | 'sent' | 'approved' | 'rejected'
  valid_until DATE,
  notes TEXT,

  -- Totals (computed, stored for performance)
  selling_subtotal DECIMAL(15,2) DEFAULT 0,
  cost_subtotal DECIMAL(15,2) DEFAULT 0,
  overheads_total DECIMAL(15,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  tax_rate DECIMAL(5,4) DEFAULT 0.10,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  grand_total DECIMAL(15,2) DEFAULT 0,

  created_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for common queries
CREATE INDEX idx_estimates_company ON estimates(company_id);
CREATE INDEX idx_estimates_project ON estimates(project_id);
CREATE INDEX idx_estimates_type ON estimates(estimate_type);
CREATE INDEX idx_estimates_status ON estimates(status);
CREATE INDEX idx_estimates_counterparty ON estimates(counterparty_id);

-- Comment on table
COMMENT ON TABLE estimates IS 'Building estimates for construction projects (新築・リフォーム見積)';
COMMENT ON COLUMN estimates.estimate_type IS 'Type discriminator: standard, civil, or building';
COMMENT ON COLUMN estimates.building_mode IS 'For building type: new_build (工種別) or reform (部位別)';
