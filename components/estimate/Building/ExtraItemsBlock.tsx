/**
 * ExtraItemsBlock Component
 *
 * Manages extra works (追加工事), exclusions (別途工事),
 * and options (オプション) for building estimates.
 */

import React, { useState } from 'react';
import type {
  EstimateExtraWork,
  EstimateExclusion,
  EstimateOption,
} from '../../../types/estimate';

// =============================================================================
// Sub-components
// =============================================================================

interface ExtraWorkRowProps {
  item: EstimateExtraWork;
  onUpdate: (id: string, updates: Partial<EstimateExtraWork>) => void;
  onDelete: (id: string) => void;
  showCost?: boolean;
  readOnly?: boolean;
}

function ExtraWorkRow({ item, onUpdate, onDelete, showCost = true, readOnly = false }: ExtraWorkRowProps) {
  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(v);

  return (
    <div className={`extra-row status-${item.status}`}>
      <div className="extra-row-main">
        <input
          type="text"
          className="extra-name"
          value={item.name}
          onChange={(e) => onUpdate(item.id, { name: e.target.value })}
          disabled={readOnly}
          placeholder="追加工事名..."
        />

        <select
          className="extra-status"
          value={item.status}
          onChange={(e) => onUpdate(item.id, { status: e.target.value as EstimateExtraWork['status'] })}
          disabled={readOnly}
        >
          <option value="pending">保留</option>
          <option value="approved">承認</option>
          <option value="rejected">却下</option>
        </select>

        <input
          type="number"
          className="extra-amount"
          value={item.sellingAmount}
          onChange={(e) => onUpdate(item.id, { sellingAmount: parseFloat(e.target.value) || 0 })}
          disabled={readOnly}
          placeholder="売価"
          step="1000"
          min="0"
        />

        {showCost && (
          <input
            type="number"
            className="extra-amount cost"
            value={item.costAmount}
            onChange={(e) => onUpdate(item.id, { costAmount: parseFloat(e.target.value) || 0 })}
            disabled={readOnly}
            placeholder="原価"
            step="1000"
            min="0"
          />
        )}

        {!readOnly && (
          <button type="button" className="delete-btn" onClick={() => onDelete(item.id)} title="削除">
            ×
          </button>
        )}
      </div>

      {item.description !== undefined && (
        <textarea
          className="extra-desc"
          value={item.description ?? ''}
          onChange={(e) => onUpdate(item.id, { description: e.target.value })}
          disabled={readOnly}
          placeholder="備考..."
          rows={1}
        />
      )}
    </div>
  );
}

interface ExclusionRowProps {
  item: EstimateExclusion;
  onUpdate: (id: string, updates: Partial<EstimateExclusion>) => void;
  onDelete: (id: string) => void;
  readOnly?: boolean;
}

function ExclusionRow({ item, onUpdate, onDelete, readOnly = false }: ExclusionRowProps) {
  return (
    <div className="exclusion-row">
      <input
        type="text"
        className="exclusion-name"
        value={item.name}
        onChange={(e) => onUpdate(item.id, { name: e.target.value })}
        disabled={readOnly}
        placeholder="別途工事名..."
      />

      <input
        type="text"
        className="exclusion-desc"
        value={item.description ?? ''}
        onChange={(e) => onUpdate(item.id, { description: e.target.value })}
        disabled={readOnly}
        placeholder="説明..."
      />

      {!readOnly && (
        <button type="button" className="delete-btn" onClick={() => onDelete(item.id)} title="削除">
          ×
        </button>
      )}
    </div>
  );
}

interface OptionRowProps {
  item: EstimateOption;
  onUpdate: (id: string, updates: Partial<EstimateOption>) => void;
  onDelete: (id: string) => void;
  showCost?: boolean;
  readOnly?: boolean;
}

function OptionRow({ item, onUpdate, onDelete, showCost = true, readOnly = false }: OptionRowProps) {
  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(v);

  return (
    <div className={`option-row ${item.isSelected ? 'selected' : ''}`}>
      <label className="option-toggle">
        <input
          type="checkbox"
          checked={item.isSelected}
          onChange={(e) => onUpdate(item.id, { isSelected: e.target.checked })}
          disabled={readOnly}
        />
        <span className="toggle-indicator">{item.isSelected ? '✓' : '○'}</span>
      </label>

      <input
        type="text"
        className="option-name"
        value={item.name}
        onChange={(e) => onUpdate(item.id, { name: e.target.value })}
        disabled={readOnly}
        placeholder="オプション名..."
      />

      <input
        type="number"
        className="option-amount"
        value={item.sellingAmount}
        onChange={(e) => onUpdate(item.id, { sellingAmount: parseFloat(e.target.value) || 0 })}
        disabled={readOnly}
        placeholder="売価"
        step="1000"
        min="0"
      />

      {showCost && (
        <input
          type="number"
          className="option-amount cost"
          value={item.costAmount}
          onChange={(e) => onUpdate(item.id, { costAmount: parseFloat(e.target.value) || 0 })}
          disabled={readOnly}
          placeholder="原価"
          step="1000"
          min="0"
        />
      )}

      {!readOnly && (
        <button type="button" className="delete-btn" onClick={() => onDelete(item.id)} title="削除">
          ×
        </button>
      )}
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

interface ExtraItemsBlockProps {
  extraWorks: EstimateExtraWork[];
  exclusions: EstimateExclusion[];
  options: EstimateOption[];
  onExtraWorkAdd: () => void;
  onExtraWorkUpdate: (id: string, updates: Partial<EstimateExtraWork>) => void;
  onExtraWorkDelete: (id: string) => void;
  onExclusionAdd: () => void;
  onExclusionUpdate: (id: string, updates: Partial<EstimateExclusion>) => void;
  onExclusionDelete: (id: string) => void;
  onOptionAdd: () => void;
  onOptionUpdate: (id: string, updates: Partial<EstimateOption>) => void;
  onOptionDelete: (id: string) => void;
  showCostColumn?: boolean;
  readOnly?: boolean;
}

export function ExtraItemsBlock({
  extraWorks,
  exclusions,
  options,
  onExtraWorkAdd,
  onExtraWorkUpdate,
  onExtraWorkDelete,
  onExclusionAdd,
  onExclusionUpdate,
  onExclusionDelete,
  onOptionAdd,
  onOptionUpdate,
  onOptionDelete,
  showCostColumn = true,
  readOnly = false,
}: ExtraItemsBlockProps) {
  const [expandedSections, setExpandedSections] = useState({
    extraWorks: true,
    exclusions: true,
    options: true,
  });

  const toggleSection = (key: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(v);

  const approvedExtraTotal = extraWorks
    .filter((ew) => ew.status === 'approved')
    .reduce((sum, ew) => sum + ew.sellingAmount, 0);

  const selectedOptionsTotal = options
    .filter((o) => o.isSelected)
    .reduce((sum, o) => sum + o.sellingAmount, 0);

  return (
    <div className="extra-items-block">
      {/* Extra Works (追加工事) */}
      <div className="extra-section">
        <div className="section-header" onClick={() => toggleSection('extraWorks')}>
          <span className="section-icon">{expandedSections.extraWorks ? '▼' : '▶'}</span>
          <h3 className="section-title">追加工事</h3>
          <span className="section-count">{extraWorks.length}件</span>
          {approvedExtraTotal > 0 && (
            <span className="section-total">{formatCurrency(approvedExtraTotal)}</span>
          )}
          {!readOnly && (
            <button
              type="button"
              className="add-btn"
              onClick={(e) => {
                e.stopPropagation();
                onExtraWorkAdd();
              }}
            >
              +追加
            </button>
          )}
        </div>

        {expandedSections.extraWorks && (
          <div className="section-content">
            {extraWorks.length === 0 ? (
              <p className="empty-message">追加工事はありません</p>
            ) : (
              extraWorks.map((item) => (
                <ExtraWorkRow
                  key={item.id}
                  item={item}
                  onUpdate={onExtraWorkUpdate}
                  onDelete={onExtraWorkDelete}
                  showCost={showCostColumn}
                  readOnly={readOnly}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Exclusions (別途工事) */}
      <div className="extra-section">
        <div className="section-header" onClick={() => toggleSection('exclusions')}>
          <span className="section-icon">{expandedSections.exclusions ? '▼' : '▶'}</span>
          <h3 className="section-title">別途工事</h3>
          <span className="section-count">{exclusions.length}件</span>
          {!readOnly && (
            <button
              type="button"
              className="add-btn"
              onClick={(e) => {
                e.stopPropagation();
                onExclusionAdd();
              }}
            >
              +追加
            </button>
          )}
        </div>

        {expandedSections.exclusions && (
          <div className="section-content">
            {exclusions.length === 0 ? (
              <p className="empty-message">別途工事はありません</p>
            ) : (
              exclusions.map((item) => (
                <ExclusionRow
                  key={item.id}
                  item={item}
                  onUpdate={onExclusionUpdate}
                  onDelete={onExclusionDelete}
                  readOnly={readOnly}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Options (オプション) */}
      <div className="extra-section">
        <div className="section-header" onClick={() => toggleSection('options')}>
          <span className="section-icon">{expandedSections.options ? '▼' : '▶'}</span>
          <h3 className="section-title">オプション</h3>
          <span className="section-count">
            {options.filter((o) => o.isSelected).length}/{options.length}件選択
          </span>
          {selectedOptionsTotal > 0 && (
            <span className="section-total">{formatCurrency(selectedOptionsTotal)}</span>
          )}
          {!readOnly && (
            <button
              type="button"
              className="add-btn"
              onClick={(e) => {
                e.stopPropagation();
                onOptionAdd();
              }}
            >
              +追加
            </button>
          )}
        </div>

        {expandedSections.options && (
          <div className="section-content">
            {options.length === 0 ? (
              <p className="empty-message">オプションはありません</p>
            ) : (
              options.map((item) => (
                <OptionRow
                  key={item.id}
                  item={item}
                  onUpdate={onOptionUpdate}
                  onDelete={onOptionDelete}
                  showCost={showCostColumn}
                  readOnly={readOnly}
                />
              ))
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .extra-items-block {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .extra-section {
          border: 1px solid var(--color-border, #e5e7eb);
          border-radius: 0.5rem;
          background: white;
          overflow: hidden;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: var(--color-surface, #f9fafb);
          cursor: pointer;
          user-select: none;
        }

        .section-header:hover {
          background: var(--color-surface-hover, #f3f4f6);
        }

        .section-icon {
          font-size: 0.75rem;
          color: var(--color-text-secondary, #6b7280);
        }

        .section-title {
          font-size: 0.875rem;
          font-weight: 600;
          margin: 0;
          flex: 1;
        }

        .section-count {
          font-size: 0.75rem;
          color: var(--color-text-secondary, #6b7280);
          padding: 0.125rem 0.375rem;
          background: var(--color-surface, #e5e7eb);
          border-radius: 0.25rem;
        }

        .section-total {
          font-size: 0.875rem;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
          color: var(--color-primary, #2563eb);
        }

        .add-btn {
          padding: 0.25rem 0.75rem;
          background: var(--color-primary, #2563eb);
          color: white;
          border: none;
          border-radius: 0.25rem;
          cursor: pointer;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .add-btn:hover {
          background: var(--color-primary-dark, #1d4ed8);
        }

        .section-content {
          padding: 0.75rem 1rem;
          border-top: 1px solid var(--color-border, #e5e7eb);
        }

        .empty-message {
          text-align: center;
          color: var(--color-text-secondary, #6b7280);
          font-size: 0.875rem;
          padding: 1rem;
          margin: 0;
        }

        /* Extra Work Row */
        .extra-row {
          padding: 0.5rem;
          margin-bottom: 0.5rem;
          border: 1px solid var(--color-border, #e5e7eb);
          border-radius: 0.375rem;
          border-left: 3px solid var(--color-text-secondary, #6b7280);
        }

        .extra-row.status-approved {
          border-left-color: var(--color-success, #16a34a);
          background: var(--color-success-light, #dcfce7);
        }

        .extra-row.status-rejected {
          border-left-color: var(--color-error, #dc2626);
          background: var(--color-error-light, #fee2e2);
          opacity: 0.6;
        }

        .extra-row-main {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .extra-name,
        .exclusion-name,
        .option-name {
          flex: 1;
          padding: 0.375rem 0.5rem;
          border: 1px solid transparent;
          border-radius: 0.25rem;
          font-size: 0.875rem;
          background: transparent;
        }

        .extra-name:focus,
        .exclusion-name:focus,
        .option-name:focus {
          border-color: var(--color-primary, #2563eb);
          background: white;
          outline: none;
        }

        .extra-status {
          padding: 0.375rem 0.5rem;
          border: 1px solid var(--color-border, #e5e7eb);
          border-radius: 0.25rem;
          font-size: 0.75rem;
          background: white;
        }

        .extra-amount,
        .option-amount {
          width: 120px;
          padding: 0.375rem 0.5rem;
          border: 1px solid transparent;
          border-radius: 0.25rem;
          font-size: 0.875rem;
          text-align: right;
          font-variant-numeric: tabular-nums;
          background: transparent;
        }

        .extra-amount:focus,
        .option-amount:focus {
          border-color: var(--color-primary, #2563eb);
          background: white;
          outline: none;
        }

        .extra-amount.cost,
        .option-amount.cost {
          color: var(--color-text-secondary, #6b7280);
        }

        .extra-desc {
          display: block;
          width: 100%;
          margin-top: 0.25rem;
          padding: 0.25rem 0.5rem;
          border: 1px solid transparent;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          color: var(--color-text-secondary, #6b7280);
          resize: vertical;
          background: transparent;
        }

        .extra-desc:focus {
          border-color: var(--color-primary, #2563eb);
          background: white;
          outline: none;
        }

        /* Exclusion Row */
        .exclusion-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          margin-bottom: 0.5rem;
          border: 1px solid var(--color-border, #e5e7eb);
          border-radius: 0.375rem;
        }

        .exclusion-desc {
          flex: 1;
          padding: 0.375rem 0.5rem;
          border: 1px solid transparent;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          color: var(--color-text-secondary, #6b7280);
          background: transparent;
        }

        .exclusion-desc:focus {
          border-color: var(--color-primary, #2563eb);
          background: white;
          outline: none;
        }

        /* Option Row */
        .option-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          margin-bottom: 0.5rem;
          border: 1px solid var(--color-border, #e5e7eb);
          border-radius: 0.375rem;
          transition: background 0.2s;
        }

        .option-row.selected {
          background: var(--color-success-light, #dcfce7);
          border-color: var(--color-success, #16a34a);
        }

        .option-toggle {
          display: flex;
          align-items: center;
          cursor: pointer;
        }

        .option-toggle input {
          display: none;
        }

        .toggle-indicator {
          font-size: 1.25rem;
          width: 1.5rem;
          text-align: center;
        }

        .delete-btn {
          background: none;
          border: none;
          padding: 0.25rem 0.5rem;
          cursor: pointer;
          font-size: 1.25rem;
          color: var(--color-text-secondary, #6b7280);
          opacity: 0;
          transition: opacity 0.2s;
        }

        .extra-row:hover .delete-btn,
        .exclusion-row:hover .delete-btn,
        .option-row:hover .delete-btn {
          opacity: 1;
        }

        .delete-btn:hover {
          color: var(--color-error, #dc2626);
        }
      `}</style>
    </div>
  );
}

export default ExtraItemsBlock;
