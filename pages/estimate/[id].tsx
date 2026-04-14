/**
 * Estimate Detail Page
 *
 * Main page for viewing and editing an estimate.
 * Routes to building-specific UI when estimateType === 'building'.
 */

import React, { useState, useCallback, useMemo } from 'react';
import type {
  Estimate,
  EstimateType,
  BuildingMode,
  EstimateSection,
  EstimateLineItem,
  EstimateLineItemCreateRequest,
  EstimateExtraWork,
  EstimateExclusion,
  EstimateOption,
} from '../../types/estimate';
import { getSectionsForMode, isBuildingEstimate } from '../../types/estimate';
import {
  BuildingModeToggle,
  SectionAccordion,
  LineItemTable,
  ExtraItemsBlock,
  CostSummaryPanel,
  EstimatePreview,
} from '../../components/estimate/Building';
import {
  recalculateEstimate,
  formatCurrency,
} from '../../utils/estimateCalculations';

// =============================================================================
// Estimate Type Selector
// =============================================================================

interface EstimateTypeSelectorProps {
  value: EstimateType;
  onChange: (type: EstimateType) => void;
  disabled?: boolean;
}

function EstimateTypeSelector({ value, onChange, disabled }: EstimateTypeSelectorProps) {
  return (
    <div className="estimate-type-selector">
      <label className="selector-label">見積種別</label>
      <div className="selector-buttons">
        {([
          { type: 'standard' as EstimateType, label: '一般', icon: '📋' },
          { type: 'civil' as EstimateType, label: '土木', icon: '🚧' },
          { type: 'building' as EstimateType, label: '建築', icon: '🏠' },
        ]).map(({ type, label, icon }) => (
          <button
            key={type}
            type="button"
            className={`type-button ${value === type ? 'active' : ''}`}
            onClick={() => onChange(type)}
            disabled={disabled}
          >
            <span>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      <style jsx>{`
        .estimate-type-selector {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .selector-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--color-text-secondary, #6b7280);
        }
        .selector-buttons {
          display: flex;
          gap: 0.25rem;
          background: var(--color-surface, #f5f5f5);
          padding: 0.25rem;
          border-radius: 0.5rem;
        }
        .type-button {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 0.375rem;
          background: transparent;
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.2s;
        }
        .type-button:hover:not(:disabled) {
          background: var(--color-surface-hover, #ebebeb);
        }
        .type-button.active {
          background: var(--color-primary, #2563eb);
          color: white;
        }
        .type-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

// =============================================================================
// Building Estimate Header
// =============================================================================

interface BuildingHeaderProps {
  estimate: Estimate;
  onUpdate: (updates: Partial<Estimate>) => void;
  readOnly?: boolean;
}

function BuildingHeader({ estimate, onUpdate, readOnly }: BuildingHeaderProps) {
  return (
    <div className="building-header">
      <div className="header-fields">
        <div className="field-group">
          <label>建物種別</label>
          <select
            value={estimate.buildingType ?? ''}
            onChange={(e) => onUpdate({ buildingType: e.target.value as any })}
            disabled={readOnly}
          >
            <option value="">選択...</option>
            <option value="住宅">住宅</option>
            <option value="店舗">店舗</option>
            <option value="マンション">マンション</option>
            <option value="事務所">事務所</option>
            <option value="倉庫">倉庫</option>
            <option value="その他">その他</option>
          </select>
        </div>

        <div className="field-group">
          <label>構造</label>
          <select
            value={estimate.structureType ?? ''}
            onChange={(e) => onUpdate({ structureType: e.target.value as any })}
            disabled={readOnly}
          >
            <option value="">選択...</option>
            <option value="木造">木造</option>
            <option value="鉄骨">鉄骨</option>
            <option value="RC">RC</option>
            <option value="SRC">SRC</option>
            <option value="混構造">混構造</option>
          </select>
        </div>

        <div className="field-group">
          <label>延床面積 (m²)</label>
          <input
            type="number"
            value={estimate.floorArea ?? ''}
            onChange={(e) => onUpdate({ floorArea: parseFloat(e.target.value) || undefined })}
            disabled={readOnly}
            placeholder="0.00"
            step="0.01"
            min="0"
          />
        </div>

        <div className="field-group">
          <label>段階</label>
          <select
            value={estimate.estimateStage ?? ''}
            onChange={(e) => onUpdate({ estimateStage: e.target.value as any })}
            disabled={readOnly}
          >
            <option value="">選択...</option>
            <option value="concept">概算</option>
            <option value="basic">基本</option>
            <option value="detailed">詳細</option>
            <option value="final">確定</option>
          </select>
        </div>
      </div>

      <style jsx>{`
        .building-header {
          padding: 1rem;
          background: var(--color-surface, #f9fafb);
          border: 1px solid var(--color-border, #e5e7eb);
          border-radius: 0.5rem;
          margin-bottom: 1rem;
        }
        .header-fields {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem;
        }
        .field-group {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .field-group label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--color-text-secondary, #6b7280);
        }
        .field-group select,
        .field-group input {
          padding: 0.5rem;
          border: 1px solid var(--color-border, #e5e7eb);
          border-radius: 0.375rem;
          font-size: 0.875rem;
        }
        .field-group select:focus,
        .field-group input:focus {
          outline: none;
          border-color: var(--color-primary, #2563eb);
        }
      `}</style>
    </div>
  );
}

// =============================================================================
// Main Estimate Page
// =============================================================================

interface EstimatePageProps {
  estimateId: string;
}

export default function EstimatePage({ estimateId }: EstimatePageProps) {
  // TODO: Replace with actual API call (useEffect + fetch)
  const [estimate, setEstimate] = useState<Estimate>({
    id: estimateId,
    companyId: '',
    estimateType: 'building',
    buildingMode: 'new_build',
    status: 'draft',
    sellingSubtotal: 0,
    costSubtotal: 0,
    overheadsTotal: 0,
    discountAmount: 0,
    taxRate: 0.10,
    taxAmount: 0,
    grandTotal: 0,
    sections: [],
    extraWorks: [],
    exclusions: [],
    options: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [showCostColumn, setShowCostColumn] = useState(true);

  // --- Estimate-level updates ---
  const handleEstimateUpdate = useCallback((updates: Partial<Estimate>) => {
    setEstimate((prev) => {
      const updated = { ...prev, ...updates };
      return recalculateEstimate(updated);
    });
  }, []);

  // --- Type change ---
  const handleTypeChange = useCallback((type: EstimateType) => {
    handleEstimateUpdate({
      estimateType: type,
      buildingMode: type === 'building' ? 'new_build' : undefined,
    });
  }, [handleEstimateUpdate]);

  // --- Mode change ---
  const handleModeChange = useCallback((mode: BuildingMode) => {
    const templates = getSectionsForMode(mode);
    const sections: EstimateSection[] = templates.map((tpl, idx) => ({
      id: `section-${tpl.code}-${Date.now()}`,
      estimateId: estimate.id,
      category: mode,
      sectionType: mode === 'new_build' ? 'trade' : 'part',
      code: tpl.code,
      name: tpl.name,
      sortOrder: idx,
      isExpanded: false,
      sellingTotal: 0,
      costTotal: 0,
      lineItems: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    handleEstimateUpdate({ buildingMode: mode, sections });
  }, [estimate.id, handleEstimateUpdate]);

  // --- Section operations ---
  const handleSectionToggle = useCallback((sectionId: string, isExpanded: boolean) => {
    setEstimate((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId ? { ...s, isExpanded } : s
      ),
    }));
  }, []);

  const handleDeleteSection = useCallback((sectionId: string) => {
    setEstimate((prev) => {
      const updated = {
        ...prev,
        sections: prev.sections.filter((s) => s.id !== sectionId),
      };
      return recalculateEstimate(updated);
    });
  }, []);

  // --- Line item operations ---
  const handleItemAdd = useCallback((sectionId: string, item: EstimateLineItemCreateRequest) => {
    setEstimate((prev) => {
      const updated = {
        ...prev,
        sections: prev.sections.map((s) => {
          if (s.id !== sectionId) return s;
          const newItem: EstimateLineItem = {
            id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            sectionId,
            name: item.name,
            description: item.description,
            workType: item.workType,
            specification: item.specification,
            unit: item.unit,
            quantity: item.quantity,
            costUnitPrice: item.costUnitPrice,
            sellingUnitPrice: item.sellingUnitPrice,
            costTotal: item.quantity * item.costUnitPrice,
            sellingTotal: item.quantity * item.sellingUnitPrice,
            grossMarginRate: item.sellingUnitPrice > 0
              ? (item.sellingUnitPrice - item.costUnitPrice) / item.sellingUnitPrice
              : 0,
            adjustmentAmount: 0,
            isTaxExempt: item.isTaxExempt ?? false,
            isInternalOnly: item.isInternalOnly ?? false,
            isClientVisible: item.isClientVisible ?? true,
            isOption: item.isOption ?? false,
            isSelected: item.isSelected ?? true,
            sortOrder: s.lineItems.length,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          return { ...s, lineItems: [...s.lineItems, newItem] };
        }),
      };
      return recalculateEstimate(updated);
    });
  }, []);

  const handleItemUpdate = useCallback((sectionId: string, itemId: string, updates: Partial<EstimateLineItem>) => {
    setEstimate((prev) => {
      const updated = {
        ...prev,
        sections: prev.sections.map((s) => {
          if (s.id !== sectionId) return s;
          return {
            ...s,
            lineItems: s.lineItems.map((i) =>
              i.id === itemId ? { ...i, ...updates } : i
            ),
          };
        }),
      };
      return recalculateEstimate(updated);
    });
  }, []);

  const handleItemDelete = useCallback((sectionId: string, itemId: string) => {
    setEstimate((prev) => {
      const updated = {
        ...prev,
        sections: prev.sections.map((s) => {
          if (s.id !== sectionId) return s;
          return {
            ...s,
            lineItems: s.lineItems.filter((i) => i.id !== itemId),
          };
        }),
      };
      return recalculateEstimate(updated);
    });
  }, []);

  // --- Extra items operations ---
  const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const handleExtraWorkAdd = useCallback(() => {
    setEstimate((prev) => ({
      ...prev,
      extraWorks: [
        ...prev.extraWorks,
        {
          id: generateId(),
          estimateId: prev.id,
          name: '',
          sellingAmount: 0,
          costAmount: 0,
          status: 'pending' as const,
          sortOrder: prev.extraWorks.length,
          createdAt: new Date().toISOString(),
        },
      ],
    }));
  }, []);

  const handleExclusionAdd = useCallback(() => {
    setEstimate((prev) => ({
      ...prev,
      exclusions: [
        ...prev.exclusions,
        {
          id: generateId(),
          estimateId: prev.id,
          name: '',
          sortOrder: prev.exclusions.length,
          createdAt: new Date().toISOString(),
        },
      ],
    }));
  }, []);

  const handleOptionAdd = useCallback(() => {
    setEstimate((prev) => ({
      ...prev,
      options: [
        ...prev.options,
        {
          id: generateId(),
          estimateId: prev.id,
          name: '',
          sellingAmount: 0,
          costAmount: 0,
          isSelected: false,
          sortOrder: prev.options.length,
          createdAt: new Date().toISOString(),
        },
      ],
    }));
  }, []);

  // --- Render ---
  const isBuilding = isBuildingEstimate(estimate);

  return (
    <div className="estimate-page">
      {/* Page Header */}
      <header className="page-header">
        <div className="header-top">
          <h1 className="page-title">
            {estimate.title || '新規見積'}
            <span className="status-badge">{estimate.status}</span>
          </h1>

          <div className="header-actions">
            <button
              type="button"
              className={`view-toggle ${viewMode === 'edit' ? 'active' : ''}`}
              onClick={() => setViewMode('edit')}
            >
              編集
            </button>
            <button
              type="button"
              className={`view-toggle ${viewMode === 'preview' ? 'active' : ''}`}
              onClick={() => setViewMode('preview')}
            >
              プレビュー
            </button>

            {viewMode === 'edit' && (
              <label className="cost-toggle">
                <input
                  type="checkbox"
                  checked={showCostColumn}
                  onChange={(e) => setShowCostColumn(e.target.checked)}
                />
                原価表示
              </label>
            )}
          </div>
        </div>

        {/* Estimate Type Selector */}
        <EstimateTypeSelector
          value={estimate.estimateType}
          onChange={handleTypeChange}
          disabled={viewMode === 'preview'}
        />

        {/* Building Mode Toggle */}
        {isBuilding && estimate.buildingMode && viewMode === 'edit' && (
          <BuildingModeToggle
            value={estimate.buildingMode}
            onChange={handleModeChange}
          />
        )}
      </header>

      {/* Preview Mode */}
      {viewMode === 'preview' ? (
        <EstimatePreview
          estimate={{
            id: estimate.id,
            title: estimate.title,
            status: estimate.status,
            validUntil: estimate.validUntil,
            buildingType: estimate.buildingType,
            structureType: estimate.structureType,
            floorArea: estimate.floorArea,
            sections: estimate.sections
              .filter((s) => s.lineItems.some((i) => i.isClientVisible))
              .map((s) => ({
                id: s.id,
                name: s.name,
                sellingTotal: s.sellingTotal,
                lineItems: s.lineItems
                  .filter((i) => i.isClientVisible && (!i.isOption || i.isSelected))
                  .map((i) => ({
                    id: i.id,
                    name: i.name,
                    specification: i.specification,
                    unit: i.unit,
                    quantity: i.quantity,
                    sellingUnitPrice: i.sellingUnitPrice,
                    sellingTotal: i.sellingTotal,
                    remarksClient: i.remarksClient,
                    isOption: i.isOption,
                    isSelected: i.isSelected,
                  })),
              })),
            exclusions: estimate.exclusions,
            options: estimate.options.map((o) => ({
              id: o.id,
              name: o.name,
              description: o.description,
              sellingAmount: o.sellingAmount,
              isSelected: o.isSelected,
            })),
            sellingSubtotal: estimate.sellingSubtotal,
            overheadsTotal: estimate.overheadsTotal,
            discountAmount: estimate.discountAmount,
            taxRate: estimate.taxRate,
            taxAmount: estimate.taxAmount,
            grandTotal: estimate.grandTotal,
          }}
        />
      ) : (
        /* Edit Mode */
        <div className="estimate-content">
          {/* Building-specific header fields */}
          {isBuilding && (
            <BuildingHeader
              estimate={estimate}
              onUpdate={handleEstimateUpdate}
            />
          )}

          {/* Sections */}
          <div className="sections-area">
            {estimate.sections.map((section) => (
              <SectionAccordion
                key={section.id}
                section={section}
                onToggle={handleSectionToggle}
                onDeleteSection={handleDeleteSection}
                showCostColumn={showCostColumn}
              >
                <LineItemTable
                  items={section.lineItems}
                  onItemAdd={(item) => handleItemAdd(section.id, item)}
                  onItemUpdate={(itemId, updates) => handleItemUpdate(section.id, itemId, updates)}
                  onItemDelete={(itemId) => handleItemDelete(section.id, itemId)}
                  showCostColumn={showCostColumn}
                />
              </SectionAccordion>
            ))}
          </div>

          {/* Extra Items */}
          <div className="extra-area">
            <ExtraItemsBlock
              extraWorks={estimate.extraWorks}
              exclusions={estimate.exclusions}
              options={estimate.options}
              onExtraWorkAdd={handleExtraWorkAdd}
              onExtraWorkUpdate={(id, updates) =>
                setEstimate((prev) => ({
                  ...prev,
                  extraWorks: prev.extraWorks.map((ew) =>
                    ew.id === id ? { ...ew, ...updates } : ew
                  ),
                }))
              }
              onExtraWorkDelete={(id) =>
                setEstimate((prev) => ({
                  ...prev,
                  extraWorks: prev.extraWorks.filter((ew) => ew.id !== id),
                }))
              }
              onExclusionAdd={handleExclusionAdd}
              onExclusionUpdate={(id, updates) =>
                setEstimate((prev) => ({
                  ...prev,
                  exclusions: prev.exclusions.map((ex) =>
                    ex.id === id ? { ...ex, ...updates } : ex
                  ),
                }))
              }
              onExclusionDelete={(id) =>
                setEstimate((prev) => ({
                  ...prev,
                  exclusions: prev.exclusions.filter((ex) => ex.id !== id),
                }))
              }
              onOptionAdd={handleOptionAdd}
              onOptionUpdate={(id, updates) =>
                setEstimate((prev) => {
                  const updated = {
                    ...prev,
                    options: prev.options.map((o) =>
                      o.id === id ? { ...o, ...updates } : o
                    ),
                  };
                  return recalculateEstimate(updated);
                })
              }
              onOptionDelete={(id) =>
                setEstimate((prev) => {
                  const updated = {
                    ...prev,
                    options: prev.options.filter((o) => o.id !== id),
                  };
                  return recalculateEstimate(updated);
                })
              }
              showCostColumn={showCostColumn}
            />
          </div>

          {/* Cost Summary */}
          <div className="summary-area">
            <CostSummaryPanel
              estimate={estimate}
              onUpdate={handleEstimateUpdate}
              showCostColumn={showCostColumn}
            />
          </div>
        </div>
      )}

      <style jsx>{`
        .estimate-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 1.5rem;
        }

        .page-header {
          margin-bottom: 1.5rem;
        }

        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .page-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .status-badge {
          font-size: 0.75rem;
          font-weight: 500;
          padding: 0.25rem 0.5rem;
          background: var(--color-surface, #e5e7eb);
          border-radius: 0.25rem;
          color: var(--color-text-secondary, #6b7280);
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .view-toggle {
          padding: 0.5rem 1rem;
          border: 1px solid var(--color-border, #e5e7eb);
          background: white;
          cursor: pointer;
          font-size: 0.875rem;
        }

        .view-toggle:first-child {
          border-radius: 0.375rem 0 0 0.375rem;
        }

        .view-toggle:nth-child(2) {
          border-radius: 0 0.375rem 0.375rem 0;
          border-left: none;
        }

        .view-toggle.active {
          background: var(--color-primary, #2563eb);
          color: white;
          border-color: var(--color-primary, #2563eb);
        }

        .cost-toggle {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.875rem;
          cursor: pointer;
          margin-left: 1rem;
        }

        .estimate-content {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .sections-area {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .summary-area {
          max-width: 400px;
          margin-left: auto;
        }
      `}</style>
    </div>
  );
}
