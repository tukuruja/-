-- Migration: 005_create_cost_settings_table.sql
-- Description: Create COST_SETTINGS table for company-wide defaults
-- Date: 2026-04-13

CREATE TABLE cost_settings (
  id VARCHAR(36) PRIMARY KEY,
  company_id VARCHAR(36) NOT NULL REFERENCES companies(id),

  -- Default overhead rates
  site_management_rate DECIMAL(5,4) DEFAULT 0.05,  -- 現場管理費率 5%
  general_expense_rate DECIMAL(5,4) DEFAULT 0.10,  -- 諸経費率 10%
  default_margin_rate DECIMAL(5,4) DEFAULT 0.20,   -- デフォルト粗利率 20%

  -- Tax settings
  default_tax_rate DECIMAL(5,4) DEFAULT 0.10,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(company_id)
);

-- Index
CREATE INDEX idx_cost_settings_company ON cost_settings(company_id);

-- Comments
COMMENT ON TABLE cost_settings IS 'Company-wide default rates for estimates';
COMMENT ON COLUMN cost_settings.site_management_rate IS '現場管理費率 - default 5%';
COMMENT ON COLUMN cost_settings.general_expense_rate IS '諸経費率 - default 10%';
COMMENT ON COLUMN cost_settings.default_margin_rate IS 'デフォルト粗利率 - default 20%';
