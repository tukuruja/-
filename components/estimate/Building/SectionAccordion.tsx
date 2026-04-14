/**
 * SectionAccordion Component
 *
 * Collapsible section container for estimate sections.
 * Displays section header with totals and expandable line items.
 */

import React, { useState } from 'react';
import type { EstimateSection } from '../../../types/estimate';

interface SectionAccordionProps {
  section: EstimateSection;
  isExpanded?: boolean;
  onToggle?: (sectionId: string, isExpanded: boolean) => void;
  onSectionUpdate?: (sectionId: string, updates: Partial<EstimateSection>) => void;
  onDeleteSection?: (sectionId: string) => void;
  showCostColumn?: boolean;
  children?: React.ReactNode;
}

export function SectionAccordion({
  section,
  isExpanded: controlledExpanded,
  onToggle,
  onSectionUpdate,
  onDeleteSection,
  showCostColumn = true,
  children,
}: SectionAccordionProps) {
  const [internalExpanded, setInternalExpanded] = useState(section.isExpanded);
  const isExpanded = controlledExpanded ?? internalExpanded;

  const handleToggle = () => {
    const newExpanded = !isExpanded;
    setInternalExpanded(newExpanded);
    onToggle?.(section.id, newExpanded);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const marginRate =
    section.sellingTotal > 0
      ? ((section.sellingTotal - section.costTotal) / section.sellingTotal) * 100
      : 0;

  return (
    <div className={`section-accordion ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="section-header" onClick={handleToggle}>
        <div className="section-header-left">
          <button
            type="button"
            className="expand-button"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? '閉じる' : '開く'}
          >
            <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
          </button>

          <div className="section-info">
            {section.code && <span className="section-code">{section.code}</span>}
            <span className="section-name">{section.name}</span>
          </div>
        </div>

        <div className="section-header-right">
          {showCostColumn && (
            <div className="section-cost">
              <span className="cost-label">原価</span>
              <span className="cost-value">{formatCurrency(section.costTotal)}</span>
            </div>
          )}

          <div className="section-selling">
            <span className="selling-label">売価</span>
            <span className="selling-value">{formatCurrency(section.sellingTotal)}</span>
          </div>

          {showCostColumn && (
            <div className="section-margin">
              <span className="margin-label">粗利</span>
              <span className={`margin-value ${marginRate >= 20 ? 'good' : marginRate >= 10 ? 'warning' : 'low'}`}>
                {marginRate.toFixed(1)}%
              </span>
            </div>
          )}

          {onDeleteSection && (
            <button
              type="button"
              className="delete-button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteSection(section.id);
              }}
              aria-label="セクションを削除"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="section-content">
          {children}

          {section.lineItems.length === 0 && (
            <div className="empty-section">
              <p>明細がありません</p>
              <p className="empty-hint">「+追加」ボタンで明細を追加してください</p>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .section-accordion {
          border: 1px solid var(--border, #e6dbcf);
          border-radius: var(--radius-sm, 12px);
          margin-bottom: 0.5rem;
          background: var(--card, #fffdf9);
          font-family: "BIZ UDPGothic", "Noto Sans JP", sans-serif;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          cursor: pointer;
          user-select: none;
          background: var(--bg-accent, #f9f4ec);
          border-radius: var(--radius-sm, 12px) var(--radius-sm, 12px) 0 0;
          transition: background 0.2s ease;
        }

        .section-accordion.collapsed .section-header {
          border-radius: var(--radius-sm, 12px);
        }

        .section-header:hover {
          background: rgba(10, 106, 91, 0.08);
        }

        .section-header-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .expand-button {
          background: none;
          border: none;
          padding: 0.25rem;
          cursor: pointer;
          font-size: 0.75rem;
          color: var(--muted, #6a6259);
        }

        .section-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .section-code {
          font-size: 0.75rem;
          padding: 0.125rem 0.5rem;
          background: rgba(10, 106, 91, 0.12);
          color: var(--accent, #0a6a5b);
          border-radius: 6px;
          font-weight: 500;
        }

        .section-name {
          font-weight: 600;
          font-size: 1rem;
          color: var(--ink, #1d1916);
        }

        .section-header-right {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .section-cost,
        .section-selling,
        .section-margin {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .cost-label,
        .selling-label,
        .margin-label {
          font-size: 0.625rem;
          color: var(--muted, #6a6259);
          text-transform: uppercase;
        }

        .cost-value,
        .selling-value {
          font-size: 0.875rem;
          font-weight: 500;
          font-variant-numeric: tabular-nums;
          color: var(--ink, #1d1916);
        }

        .margin-value {
          font-size: 0.875rem;
          font-weight: 600;
        }

        .margin-value.good {
          color: var(--accent, #0a6a5b);
        }

        .margin-value.warning {
          color: var(--accent-2, #c65e1a);
        }

        .margin-value.low {
          color: #dc2626;
        }

        .delete-button {
          background: none;
          border: none;
          padding: 0.25rem 0.5rem;
          cursor: pointer;
          font-size: 1.25rem;
          color: var(--muted, #6a6259);
          opacity: 0;
          transition: opacity 0.2s;
        }

        .section-header:hover .delete-button {
          opacity: 1;
        }

        .delete-button:hover {
          color: #dc2626;
        }

        .section-content {
          padding: 1rem;
          border-top: 1px solid var(--border, #e6dbcf);
        }

        .empty-section {
          text-align: center;
          padding: 2rem;
          color: var(--muted, #6a6259);
        }

        .empty-hint {
          font-size: 0.875rem;
          margin-top: 0.5rem;
        }
      `}</style>
    </div>
  );
}

export default SectionAccordion;
