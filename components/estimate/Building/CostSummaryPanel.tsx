/**
 * CostSummaryPanel Component
 *
 * Displays estimate totals with cost, selling, margin breakdown.
 * Includes editable fields for overheads, discount, and tax.
 */

import React from 'react';
import type { Estimate } from '../../../types/estimate';

interface CostSummaryPanelProps {
  estimate: Estimate;
  onUpdate?: (updates: Partial<Estimate>) => void;
  showCostColumn?: boolean;
  readOnly?: boolean;
}

export function CostSummaryPanel({
  estimate,
  onUpdate,
  showCostColumn = true,
  readOnly = false,
}: CostSummaryPanelProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const grossMargin = estimate.sellingSubtotal - estimate.costSubtotal;
  const grossMarginRate =
    estimate.sellingSubtotal > 0 ? (grossMargin / estimate.sellingSubtotal) * 100 : 0;

  const handleFieldChange = (field: keyof Estimate, value: number) => {
    if (readOnly || !onUpdate) return;
    onUpdate({ [field]: value });
  };

  return (
    <div className="cost-summary-panel">
      <h3 className="panel-title">見積合計</h3>

      <div className="summary-grid">
        {/* Subtotals */}
        <div className="summary-section">
          <h4 className="section-title">小計</h4>

          {showCostColumn && (
            <div className="summary-row">
              <span className="row-label">原価小計</span>
              <span className="row-value cost">{formatCurrency(estimate.costSubtotal)}</span>
            </div>
          )}

          <div className="summary-row">
            <span className="row-label">売価小計</span>
            <span className="row-value selling">{formatCurrency(estimate.sellingSubtotal)}</span>
          </div>

          {showCostColumn && (
            <div className="summary-row highlight">
              <span className="row-label">粗利</span>
              <span className={`row-value margin ${grossMarginRate >= 20 ? 'good' : grossMarginRate >= 10 ? 'warning' : 'low'}`}>
                {formatCurrency(grossMargin)}
                <span className="margin-rate">({grossMarginRate.toFixed(1)}%)</span>
              </span>
            </div>
          )}
        </div>

        {/* Adjustments */}
        <div className="summary-section">
          <h4 className="section-title">調整</h4>

          <div className="summary-row editable">
            <span className="row-label">諸経費</span>
            {readOnly ? (
              <span className="row-value">{formatCurrency(estimate.overheadsTotal)}</span>
            ) : (
              <input
                type="number"
                value={estimate.overheadsTotal}
                onChange={(e) => handleFieldChange('overheadsTotal', parseFloat(e.target.value) || 0)}
                className="row-input"
                step="1000"
                min="0"
              />
            )}
          </div>

          <div className="summary-row editable">
            <span className="row-label">値引き</span>
            {readOnly ? (
              <span className="row-value discount">-{formatCurrency(estimate.discountAmount)}</span>
            ) : (
              <input
                type="number"
                value={estimate.discountAmount}
                onChange={(e) => handleFieldChange('discountAmount', parseFloat(e.target.value) || 0)}
                className="row-input"
                step="1000"
                min="0"
              />
            )}
          </div>
        </div>

        {/* Tax */}
        <div className="summary-section">
          <h4 className="section-title">消費税</h4>

          <div className="summary-row editable">
            <span className="row-label">税率</span>
            {readOnly ? (
              <span className="row-value">{(estimate.taxRate * 100).toFixed(0)}%</span>
            ) : (
              <select
                value={estimate.taxRate}
                onChange={(e) => handleFieldChange('taxRate', parseFloat(e.target.value))}
                className="row-select"
              >
                <option value="0.10">10%</option>
                <option value="0.08">8%</option>
                <option value="0">0% (非課税)</option>
              </select>
            )}
          </div>

          <div className="summary-row">
            <span className="row-label">消費税額</span>
            <span className="row-value">{formatCurrency(estimate.taxAmount)}</span>
          </div>
        </div>

        {/* Grand Total */}
        <div className="summary-section total">
          <div className="summary-row grand-total">
            <span className="row-label">見積合計（税込）</span>
            <span className="row-value">{formatCurrency(estimate.grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Options Summary */}
      {estimate.options.length > 0 && (
        <div className="options-summary">
          <h4 className="section-title">オプション</h4>
          <div className="options-list">
            {estimate.options.map((option) => (
              <div
                key={option.id}
                className={`option-row ${option.isSelected ? 'selected' : ''}`}
              >
                <span className="option-name">
                  {option.isSelected ? '✓' : '○'} {option.name}
                </span>
                <span className="option-amount">{formatCurrency(option.sellingAmount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .cost-summary-panel {
          background: var(--card, #fffdf9);
          border: 1px solid var(--border, #e6dbcf);
          border-radius: var(--radius-sm, 12px);
          padding: 1rem;
          font-family: "BIZ UDPGothic", "Noto Sans JP", sans-serif;
        }

        .panel-title {
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 1rem 0;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid var(--accent, #0a6a5b);
          color: var(--ink, #1d1916);
        }

        .summary-grid {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .summary-section {
          padding: 0.75rem;
          background: var(--bg-accent, #f9f4ec);
          border-radius: 10px;
        }

        .summary-section.total {
          background: var(--accent, #0a6a5b);
          color: white;
        }

        .section-title {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          color: var(--muted, #6a6259);
          margin: 0 0 0.5rem 0;
        }

        .summary-section.total .section-title {
          color: rgba(255, 255, 255, 0.8);
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.25rem 0;
        }

        .summary-row.highlight {
          padding: 0.5rem;
          margin: 0.25rem -0.5rem;
          background: rgba(10, 106, 91, 0.08);
          border-radius: 6px;
        }

        .summary-row.grand-total {
          padding: 0.5rem 0;
        }

        .row-label {
          font-size: 0.875rem;
          color: var(--ink, #1d1916);
        }

        .row-value {
          font-size: 1rem;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
        }

        .row-value.cost {
          color: var(--muted, #6a6259);
        }

        .row-value.selling {
          color: var(--ink, #1d1916);
        }

        .row-value.margin.good {
          color: var(--accent, #0a6a5b);
        }

        .row-value.margin.warning {
          color: var(--accent-2, #c65e1a);
        }

        .row-value.margin.low {
          color: #dc2626;
        }

        .row-value.discount {
          color: #dc2626;
        }

        .margin-rate {
          font-size: 0.75rem;
          font-weight: normal;
          margin-left: 0.25rem;
        }

        .grand-total .row-label {
          font-size: 1rem;
          font-weight: 600;
        }

        .grand-total .row-value {
          font-size: 1.5rem;
        }

        .row-input,
        .row-select {
          width: 120px;
          padding: 0.25rem 0.5rem;
          border: 1px solid var(--border, #e6dbcf);
          border-radius: 6px;
          font-size: 0.875rem;
          text-align: right;
          font-family: inherit;
          background: var(--card, #fffdf9);
          color: var(--ink, #1d1916);
          transition: border-color 0.2s;
        }

        .row-input:focus,
        .row-select:focus {
          outline: none;
          border-color: var(--accent, #0a6a5b);
        }

        .options-summary {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border, #e6dbcf);
        }

        .options-list {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .option-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem;
          background: var(--bg-accent, #f9f4ec);
          border-radius: 6px;
          font-size: 0.875rem;
        }

        .option-row.selected {
          background: rgba(10, 106, 91, 0.12);
        }

        .option-name {
          color: var(--muted, #6a6259);
        }

        .option-row.selected .option-name {
          color: var(--accent, #0a6a5b);
        }

        .option-amount {
          font-weight: 600;
          font-variant-numeric: tabular-nums;
          color: var(--ink, #1d1916);
        }
      `}</style>
    </div>
  );
}

export default CostSummaryPanel;
