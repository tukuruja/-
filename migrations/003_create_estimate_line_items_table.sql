-- Migration: 003_create_estimate_line_items_table.sql
-- Description: Create ESTIMATE_LINE_ITEMS table with dual pricing
-- Date: 2026-04-13

CREATE TABLE estimate_line_items (
  id VARCHAR(36) PRIMARY KEY,
  section_id VARCHAR(36) NOT NULL REFERENCES estimate_sections(id) ON DELETE CASCADE,

  -- Item details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  work_type VARCHAR(100),        -- 工種 (for new_build mode)
  specification VARCHAR(255),    -- 仕様
  unit VARCHAR(20),              -- 式, m2, m, 個, etc.
  quantity DECIMAL(10,3) DEFAULT 1,

  -- Pricing (dual pricing: cost vs selling)
  cost_unit_price DECIMAL(15,2) DEFAULT 0,     -- 原価単価
  selling_unit_price DECIMAL(15,2) DEFAULT 0,  -- 売価単価
  cost_total DECIMAL(15,2) DEFAULT 0,          -- qty * cost_unit_price
  selling_total DECIMAL(15,2) DEFAULT 0,       -- qty * selling_unit_price
  gross_margin_rate DECIMAL(5,4),              -- 粗利率
  adjustment_amount DECIMAL(15,2) DEFAULT 0,   -- 端数調整・値引き

  -- Tax handling (some items tax-exempt)
  tax_rate DECIMAL(5,4),                       -- NULL = use estimate default
  is_tax_exempt BOOLEAN DEFAULT false,

  -- Remarks (separate internal vs client)
  remarks_internal TEXT,                       -- 社内メモ (hidden from client)
  remarks_client TEXT,                         -- 施主向け備考

  -- Visibility flags
  is_internal_only BOOLEAN DEFAULT false,      -- 社内のみ表示
  is_client_visible BOOLEAN DEFAULT true,      -- 施主向け表示
  is_option BOOLEAN DEFAULT false,             -- オプション項目
  is_selected BOOLEAN DEFAULT true,            -- オプション選択状態

  sort_order INT DEFAULT 0,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_estimate_line_items_section ON estimate_line_items(section_id);
CREATE INDEX idx_estimate_line_items_sort ON estimate_line_items(section_id, sort_order);
CREATE INDEX idx_estimate_line_items_option ON estimate_line_items(is_option, is_selected);

-- Comments
COMMENT ON TABLE estimate_line_items IS 'Individual line items within estimate sections';
COMMENT ON COLUMN estimate_line_items.cost_unit_price IS '原価単価 - internal cost per unit';
COMMENT ON COLUMN estimate_line_items.selling_unit_price IS '売価単価 - client-facing price per unit';
COMMENT ON COLUMN estimate_line_items.gross_margin_rate IS '粗利率 - calculated as (selling - cost) / selling';
COMMENT ON COLUMN estimate_line_items.remarks_internal IS '社内メモ - hidden from client preview';
COMMENT ON COLUMN estimate_line_items.remarks_client IS '施主向け備考 - visible in client preview';
COMMENT ON COLUMN estimate_line_items.is_internal_only IS 'If true, item only shown in internal view';
COMMENT ON COLUMN estimate_line_items.is_option IS 'If true, item is optional and can be toggled';
