-- Migration: 002_create_estimate_sections_table.sql
-- Description: Create ESTIMATE_SECTIONS table for grouping line items
-- Date: 2026-04-13

CREATE TABLE estimate_sections (
  id VARCHAR(36) PRIMARY KEY,
  estimate_id VARCHAR(36) NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  parent_section_id VARCHAR(36) REFERENCES estimate_sections(id), -- For nested sections (e.g., 屋根 > 防水)

  -- Section classification
  category VARCHAR(20),        -- 'new_build' | 'reform' | 'common'
  section_type VARCHAR(20),    -- 'trade' | 'part' | 'common'
  code VARCHAR(20),            -- 仮設, 躯体, キッチン, etc.
  name VARCHAR(100) NOT NULL,

  sort_order INT DEFAULT 0,
  is_expanded BOOLEAN DEFAULT true,

  -- Section totals (computed)
  selling_total DECIMAL(15,2) DEFAULT 0,
  cost_total DECIMAL(15,2) DEFAULT 0,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_estimate_sections_estimate ON estimate_sections(estimate_id);
CREATE INDEX idx_estimate_sections_parent ON estimate_sections(parent_section_id);
CREATE INDEX idx_estimate_sections_category ON estimate_sections(category);
CREATE INDEX idx_estimate_sections_sort ON estimate_sections(estimate_id, sort_order);

-- Comments
COMMENT ON TABLE estimate_sections IS 'Sections within an estimate (工種別 or 部位別)';
COMMENT ON COLUMN estimate_sections.category IS 'new_build: trade-based, reform: part-based, common: shared';
COMMENT ON COLUMN estimate_sections.section_type IS 'trade (工種), part (部位), or common';
COMMENT ON COLUMN estimate_sections.code IS 'Section code for template matching (temporary, frame, kitchen, etc.)';
