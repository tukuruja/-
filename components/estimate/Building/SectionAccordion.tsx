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
          border: 1px solid var(--color-border, #e5e7eb);
          border-radius: 0.5rem;
          margin-bottom: 0.5rem;
          background: white;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          cursor: pointer;
          user-select: none;
          background: var(--color-surface, #f9fafb);
          border-radius: 0.5rem 0.5rem 0 0;
        }

        .section-accordion.collapsed .section-header {
          border-radius: 0.5rem;
        }

        .section-header:hover {
          background: var(--color-surface-hover, #f3f4f6);
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
          color: var(--color-text-secondary, #6b7280);
        }

        .section-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .section-code {
          font-size: 0.75rem;
          padding: 0.125rem 0.375rem;
          background: var(--color-primary-light, #dbeafe);
          color: var(--color-primary, #2563eb);
          border-radius: 0.25rem;
        }

        .section-name {
          font-weight: 600;
          font-size: 1rem;
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
          color: var(--color-text-secondary, #6b7280);
          text-transform: uppercase;
        }

        .cost-value,
        .selling-value {
          font-size: 0.875rem;
          font-weight: 500;
          font-variant-numeric: tabular-nums;
        }

        .margin-value {
          font-size: 0.875rem;
          font-weight: 600;
        }

        .margin-value.good {
          color: var(--color-success, #16a34a);
        }

        .margin-value.warning {
          color: var(--color-warning, #ca8a04);
        }

        .margin-value.low {
          color: var(--color-error, #dc2626);
        }

        .delete-button {
          background: none;
          border: none;
          padding: 0.25rem 0.5rem;
          cursor: pointer;
          font-size: 1.25rem;
          color: var(--color-text-secondary, #6b7280);
          opacity: 0;
          transition: opacity 0.2s;
        }

        .section-header:hover .delete-button {
          opacity: 1;
        }

        .delete-button:hover {
          color: var(--color-error, #dc2626);
        }

        .section-content {
          padding: 1rem;
          border-top: 1px solid var(--color-border, #e5e7eb);
        }

        .empty-section {
          text-align: center;
          padding: 2rem;
          color: var(--color-text-secondary, #6b7280);
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
