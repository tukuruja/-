/**
 * LineItemTable Component
 *
 * Editable table for estimate line items with dual pricing columns.
 * Supports inline editing, drag-and-drop reordering, and visibility toggles.
 */

import React, { useState, useCallback } from 'react';
import type { EstimateLineItem, EstimateLineItemCreateRequest } from '../../../types/estimate';
import { UNIT_OPTIONS } from '../../../types/estimate';

interface LineItemTableProps {
  items: EstimateLineItem[];
  onItemAdd: (item: EstimateLineItemCreateRequest) => void;
  onItemUpdate: (itemId: string, updates: Partial<EstimateLineItem>) => void;
  onItemDelete: (itemId: string) => void;
  onReorder?: (itemIds: string[]) => void;
  showCostColumn?: boolean;
  readOnly?: boolean;
}

export function LineItemTable({
  items,
  onItemAdd,
  onItemUpdate,
  onItemDelete,
  onReorder,
  showCostColumn = true,
  readOnly = false,
}: LineItemTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<Partial<EstimateLineItemCreateRequest>>({});

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('ja-JP').format(value);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleAddItem = useCallback(() => {
    if (!newItem.name || !newItem.unit) return;

    onItemAdd({
      name: newItem.name,
      unit: newItem.unit,
      quantity: newItem.quantity ?? 1,
      costUnitPrice: newItem.costUnitPrice ?? 0,
      sellingUnitPrice: newItem.sellingUnitPrice ?? 0,
      description: newItem.description,
      specification: newItem.specification,
    });

    setNewItem({});
  }, [newItem, onItemAdd]);

  const handleCellChange = useCallback(
    (itemId: string, field: keyof EstimateLineItem, value: string | number | boolean) => {
      const item = items.find((i) => i.id === itemId);
      if (!item) return;

      const updates: Partial<EstimateLineItem> = { [field]: value };

      // Recalculate totals if quantity or prices change
      if (field === 'quantity' || field === 'costUnitPrice' || field === 'sellingUnitPrice') {
        const quantity = field === 'quantity' ? Number(value) : item.quantity;
        const costUnitPrice = field === 'costUnitPrice' ? Number(value) : item.costUnitPrice;
        const sellingUnitPrice = field === 'sellingUnitPrice' ? Number(value) : item.sellingUnitPrice;

        updates.costTotal = quantity * costUnitPrice;
        updates.sellingTotal = quantity * sellingUnitPrice;
        updates.grossMarginRate =
          sellingUnitPrice > 0 ? (sellingUnitPrice - costUnitPrice) / sellingUnitPrice : 0;
      }

      onItemUpdate(itemId, updates);
    },
    [items, onItemUpdate]
  );

  return (
    <div className="line-item-table">
      <table>
        <thead>
          <tr>
            <th className="col-name">名称</th>
            <th className="col-spec">仕様</th>
            <th className="col-unit">単位</th>
            <th className="col-qty">数量</th>
            {showCostColumn && <th className="col-cost">原価単価</th>}
            <th className="col-selling">売価単価</th>
            {showCostColumn && <th className="col-cost-total">原価計</th>}
            <th className="col-selling-total">売価計</th>
            {showCostColumn && <th className="col-margin">粗利率</th>}
            {!readOnly && <th className="col-actions">操作</th>}
          </tr>
        </thead>

        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              className={`
                ${item.isOption ? 'option-item' : ''}
                ${item.isOption && !item.isSelected ? 'unselected' : ''}
                ${item.isInternalOnly ? 'internal-only' : ''}
              `}
            >
              <td className="col-name">
                {item.isOption && (
                  <label className="option-checkbox">
                    <input
                      type="checkbox"
                      checked={item.isSelected}
                      onChange={(e) => handleCellChange(item.id, 'isSelected', e.target.checked)}
                      disabled={readOnly}
                    />
                  </label>
                )}
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => handleCellChange(item.id, 'name', e.target.value)}
                  disabled={readOnly}
                  className="cell-input"
                />
              </td>

              <td className="col-spec">
                <input
                  type="text"
                  value={item.specification ?? ''}
                  onChange={(e) => handleCellChange(item.id, 'specification', e.target.value)}
                  disabled={readOnly}
                  className="cell-input"
                  placeholder="—"
                />
              </td>

              <td className="col-unit">
                <select
                  value={item.unit}
                  onChange={(e) => handleCellChange(item.id, 'unit', e.target.value)}
                  disabled={readOnly}
                  className="cell-select"
                >
                  {UNIT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.value}
                    </option>
                  ))}
                </select>
              </td>

              <td className="col-qty">
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleCellChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                  disabled={readOnly}
                  className="cell-input number"
                  step="0.001"
                  min="0"
                />
              </td>

              {showCostColumn && (
                <td className="col-cost">
                  <input
                    type="number"
                    value={item.costUnitPrice}
                    onChange={(e) =>
                      handleCellChange(item.id, 'costUnitPrice', parseFloat(e.target.value) || 0)
                    }
                    disabled={readOnly}
                    className="cell-input number"
                    step="1"
                    min="0"
                  />
                </td>
              )}

              <td className="col-selling">
                <input
                  type="number"
                  value={item.sellingUnitPrice}
                  onChange={(e) =>
                    handleCellChange(item.id, 'sellingUnitPrice', parseFloat(e.target.value) || 0)
                  }
                  disabled={readOnly}
                  className="cell-input number"
                  step="1"
                  min="0"
                />
              </td>

              {showCostColumn && (
                <td className="col-cost-total">
                  <span className="cell-value">{formatCurrency(item.costTotal)}</span>
                </td>
              )}

              <td className="col-selling-total">
                <span className="cell-value">{formatCurrency(item.sellingTotal)}</span>
              </td>

              {showCostColumn && (
                <td className="col-margin">
                  <span
                    className={`margin-badge ${
                      (item.grossMarginRate ?? 0) >= 0.2
                        ? 'good'
                        : (item.grossMarginRate ?? 0) >= 0.1
                        ? 'warning'
                        : 'low'
                    }`}
                  >
                    {((item.grossMarginRate ?? 0) * 100).toFixed(1)}%
                  </span>
                </td>
              )}

              {!readOnly && (
                <td className="col-actions">
                  <button
                    type="button"
                    className="action-button option"
                    onClick={() => handleCellChange(item.id, 'isOption', !item.isOption)}
                    title={item.isOption ? 'オプション解除' : 'オプションにする'}
                  >
                    {item.isOption ? '◉' : '○'}
                  </button>
                  <button
                    type="button"
                    className="action-button delete"
                    onClick={() => onItemDelete(item.id)}
                    title="削除"
                  >
                    ×
                  </button>
                </td>
              )}
            </tr>
          ))}

          {/* New item row */}
          {!readOnly && (
            <tr className="new-item-row">
              <td className="col-name">
                <input
                  type="text"
                  value={newItem.name ?? ''}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="名称を入力..."
                  className="cell-input"
                />
              </td>

              <td className="col-spec">
                <input
                  type="text"
                  value={newItem.specification ?? ''}
                  onChange={(e) => setNewItem({ ...newItem, specification: e.target.value })}
                  placeholder="仕様"
                  className="cell-input"
                />
              </td>

              <td className="col-unit">
                <select
                  value={newItem.unit ?? '式'}
                  onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                  className="cell-select"
                >
                  {UNIT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.value}
                    </option>
                  ))}
                </select>
              </td>

              <td className="col-qty">
                <input
                  type="number"
                  value={newItem.quantity ?? 1}
                  onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 1 })}
                  className="cell-input number"
                  step="0.001"
                  min="0"
                />
              </td>

              {showCostColumn && (
                <td className="col-cost">
                  <input
                    type="number"
                    value={newItem.costUnitPrice ?? 0}
                    onChange={(e) =>
                      setNewItem({ ...newItem, costUnitPrice: parseFloat(e.target.value) || 0 })
                    }
                    className="cell-input number"
                    step="1"
                    min="0"
                  />
                </td>
              )}

              <td className="col-selling">
                <input
                  type="number"
                  value={newItem.sellingUnitPrice ?? 0}
                  onChange={(e) =>
                    setNewItem({ ...newItem, sellingUnitPrice: parseFloat(e.target.value) || 0 })
                  }
                  className="cell-input number"
                  step="1"
                  min="0"
                />
              </td>

              {showCostColumn && <td className="col-cost-total">—</td>}
              <td className="col-selling-total">—</td>
              {showCostColumn && <td className="col-margin">—</td>}

              <td className="col-actions">
                <button
                  type="button"
                  className="add-button"
                  onClick={handleAddItem}
                  disabled={!newItem.name}
                  title="追加"
                >
                  +追加
                </button>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <style jsx>{`
        .line-item-table {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }

        th,
        td {
          padding: 0.5rem;
          text-align: left;
          border-bottom: 1px solid var(--color-border, #e5e7eb);
        }

        th {
          font-weight: 600;
          font-size: 0.75rem;
          text-transform: uppercase;
          color: var(--color-text-secondary, #6b7280);
          background: var(--color-surface, #f9fafb);
        }

        .col-name {
          min-width: 200px;
        }
        .col-spec {
          min-width: 120px;
        }
        .col-unit {
          width: 70px;
        }
        .col-qty,
        .col-cost,
        .col-selling {
          width: 100px;
        }
        .col-cost-total,
        .col-selling-total {
          width: 120px;
          text-align: right;
        }
        .col-margin {
          width: 80px;
          text-align: center;
        }
        .col-actions {
          width: 80px;
          text-align: center;
        }

        .cell-input,
        .cell-select {
          width: 100%;
          padding: 0.25rem 0.5rem;
          border: 1px solid transparent;
          border-radius: 0.25rem;
          background: transparent;
          font-size: 0.875rem;
        }

        .cell-input:focus,
        .cell-select:focus {
          outline: none;
          border-color: var(--color-primary, #2563eb);
          background: white;
        }

        .cell-input.number {
          text-align: right;
          font-variant-numeric: tabular-nums;
        }

        .cell-value {
          font-variant-numeric: tabular-nums;
        }

        .margin-badge {
          display: inline-block;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .margin-badge.good {
          background: var(--color-success-light, #dcfce7);
          color: var(--color-success, #16a34a);
        }

        .margin-badge.warning {
          background: var(--color-warning-light, #fef3c7);
          color: var(--color-warning, #ca8a04);
        }

        .margin-badge.low {
          background: var(--color-error-light, #fee2e2);
          color: var(--color-error, #dc2626);
        }

        .option-item {
          background: var(--color-surface, #f9fafb);
        }

        .option-item.unselected {
          opacity: 0.5;
        }

        .internal-only {
          background: var(--color-warning-light, #fef3c7);
        }

        .option-checkbox {
          margin-right: 0.5rem;
        }

        .action-button {
          background: none;
          border: none;
          padding: 0.25rem;
          cursor: pointer;
          font-size: 1rem;
          color: var(--color-text-secondary, #6b7280);
        }

        .action-button:hover {
          color: var(--color-primary, #2563eb);
        }

        .action-button.delete:hover {
          color: var(--color-error, #dc2626);
        }

        .new-item-row {
          background: var(--color-surface, #f9fafb);
        }

        .add-button {
          padding: 0.25rem 0.75rem;
          background: var(--color-primary, #2563eb);
          color: white;
          border: none;
          border-radius: 0.25rem;
          cursor: pointer;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .add-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .add-button:hover:not(:disabled) {
          background: var(--color-primary-dark, #1d4ed8);
        }
      `}</style>
    </div>
  );
}

export default LineItemTable;
