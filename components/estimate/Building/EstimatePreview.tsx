/**
 * EstimatePreview Component
 *
 * Client-facing read-only view of an estimate.
 * Hides cost data, internal remarks, and internal-only items.
 */

import React from 'react';
import type { EstimatePreview as EstimatePreviewType } from '../../../types/estimate';

interface EstimatePreviewProps {
  estimate: EstimatePreviewType;
  companyName?: string;
  projectName?: string;
}

export function EstimatePreview({
  estimate,
  companyName,
  projectName,
}: EstimatePreviewProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(dateString));
  };

  return (
    <div className="estimate-preview">
      {/* Header */}
      <header className="preview-header">
        <h1 className="preview-title">御 見 積 書</h1>
        <div className="preview-meta">
          <div className="meta-row">
            <span className="meta-label">見積番号</span>
            <span className="meta-value">{estimate.id.slice(0, 8).toUpperCase()}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">有効期限</span>
            <span className="meta-value">{formatDate(estimate.validUntil)}</span>
          </div>
        </div>
      </header>

      {/* Project Info */}
      <section className="preview-section project-info">
        <div className="info-block">
          <h2 className="info-title">{projectName || '御中'}</h2>
          <p className="info-subtitle">下記の通りお見積り申し上げます</p>
        </div>

        <div className="grand-total-block">
          <span className="grand-total-label">御見積金額（税込）</span>
          <span className="grand-total-value">{formatCurrency(estimate.grandTotal)}</span>
        </div>
      </section>

      {/* Building Info */}
      {(estimate.buildingType || estimate.structureType || estimate.floorArea) && (
        <section className="preview-section building-info">
          <h3 className="section-title">工事概要</h3>
          <div className="info-grid">
            {estimate.buildingType && (
              <div className="info-item">
                <span className="item-label">建物種別</span>
                <span className="item-value">{estimate.buildingType}</span>
              </div>
            )}
            {estimate.structureType && (
              <div className="info-item">
                <span className="item-label">構造</span>
                <span className="item-value">{estimate.structureType}</span>
              </div>
            )}
            {estimate.floorArea && (
              <div className="info-item">
                <span className="item-label">延床面積</span>
                <span className="item-value">{estimate.floorArea.toFixed(2)} m²</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Sections */}
      <section className="preview-section estimate-details">
        <h3 className="section-title">見積明細</h3>

        {estimate.sections.map((section) => (
          <div key={section.id} className="estimate-section">
            <div className="section-header">
              <span className="section-name">{section.name}</span>
              <span className="section-total">{formatCurrency(section.sellingTotal)}</span>
            </div>

            <table className="items-table">
              <thead>
                <tr>
                  <th className="col-name">項目</th>
                  <th className="col-spec">仕様</th>
                  <th className="col-unit">単位</th>
                  <th className="col-qty">数量</th>
                  <th className="col-price">単価</th>
                  <th className="col-total">金額</th>
                </tr>
              </thead>
              <tbody>
                {section.lineItems
                  .filter((item) => !item.isOption || item.isSelected)
                  .map((item) => (
                    <tr
                      key={item.id}
                      className={item.isOption ? 'option-item' : ''}
                    >
                      <td className="col-name">
                        {item.isOption && <span className="option-badge">オプション</span>}
                        {item.name}
                        {item.remarksClient && (
                          <span className="item-remark">{item.remarksClient}</span>
                        )}
                      </td>
                      <td className="col-spec">{item.specification || '—'}</td>
                      <td className="col-unit">{item.unit}</td>
                      <td className="col-qty">{item.quantity}</td>
                      <td className="col-price">{formatCurrency(item.sellingUnitPrice)}</td>
                      <td className="col-total">{formatCurrency(item.sellingTotal)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ))}
      </section>

      {/* Options (unselected) */}
      {estimate.options.filter((o) => !o.isSelected).length > 0 && (
        <section className="preview-section options-available">
          <h3 className="section-title">追加オプション（別途）</h3>
          <ul className="options-list">
            {estimate.options
              .filter((o) => !o.isSelected)
              .map((option) => (
                <li key={option.id} className="option-item">
                  <span className="option-name">{option.name}</span>
                  <span className="option-price">{formatCurrency(option.sellingAmount)}</span>
                </li>
              ))}
          </ul>
        </section>
      )}

      {/* Exclusions */}
      {estimate.exclusions.length > 0 && (
        <section className="preview-section exclusions">
          <h3 className="section-title">別途工事（本見積に含まず）</h3>
          <ul className="exclusions-list">
            {estimate.exclusions.map((exclusion) => (
              <li key={exclusion.id}>
                {exclusion.name}
                {exclusion.description && <span className="exclusion-desc">（{exclusion.description}）</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Summary */}
      <section className="preview-section summary">
        <table className="summary-table">
          <tbody>
            <tr>
              <th>小計</th>
              <td>{formatCurrency(estimate.sellingSubtotal)}</td>
            </tr>
            {estimate.overheadsTotal > 0 && (
              <tr>
                <th>諸経費</th>
                <td>{formatCurrency(estimate.overheadsTotal)}</td>
              </tr>
            )}
            {estimate.discountAmount > 0 && (
              <tr className="discount">
                <th>お値引き</th>
                <td>-{formatCurrency(estimate.discountAmount)}</td>
              </tr>
            )}
            <tr>
              <th>消費税（{(estimate.taxRate * 100).toFixed(0)}%）</th>
              <td>{formatCurrency(estimate.taxAmount)}</td>
            </tr>
            <tr className="grand-total">
              <th>御見積合計（税込）</th>
              <td>{formatCurrency(estimate.grandTotal)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Footer */}
      <footer className="preview-footer">
        {companyName && <p className="company-name">{companyName}</p>}
        <p className="footer-note">
          ※ 本見積書の有効期限は発行日より{estimate.validUntil ? '上記期日' : '30日間'}とさせていただきます。
        </p>
      </footer>

      <style jsx>{`
        .estimate-preview {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
          background: var(--card, #fffdf9);
          font-family: "BIZ UDPGothic", "Noto Sans JP", sans-serif;
          line-height: 1.6;
          border-radius: var(--radius, 18px);
        }

        .preview-header {
          text-align: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid var(--ink, #1d1916);
        }

        .preview-title {
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: 0.5em;
          margin: 0 0 1rem 0;
          color: var(--ink, #1d1916);
        }

        .preview-meta {
          display: flex;
          justify-content: flex-end;
          gap: 2rem;
        }

        .meta-row {
          display: flex;
          gap: 0.5rem;
          font-size: 0.875rem;
        }

        .meta-label {
          color: var(--muted, #6a6259);
        }

        .preview-section {
          margin-bottom: 2rem;
        }

        .project-info {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 1rem;
          background: var(--bg-accent, #f9f4ec);
          border-radius: var(--radius-sm, 12px);
        }

        .info-title {
          font-size: 1.25rem;
          margin: 0;
          border-bottom: 1px solid var(--ink, #1d1916);
          padding-bottom: 0.25rem;
          color: var(--ink, #1d1916);
        }

        .info-subtitle {
          margin: 0.5rem 0 0 0;
          font-size: 0.875rem;
          color: var(--muted, #6a6259);
        }

        .grand-total-block {
          text-align: right;
        }

        .grand-total-label {
          display: block;
          font-size: 0.75rem;
          color: var(--muted, #6a6259);
          margin-bottom: 0.25rem;
        }

        .grand-total-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--accent, #0a6a5b);
        }

        .section-title {
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 0.75rem 0;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--border, #e6dbcf);
          color: var(--ink, #1d1916);
        }

        .building-info .info-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        .info-item {
          display: flex;
          flex-direction: column;
        }

        .item-label {
          font-size: 0.75rem;
          color: var(--muted, #6a6259);
        }

        .item-value {
          font-weight: 500;
          color: var(--ink, #1d1916);
        }

        .estimate-section {
          margin-bottom: 1.5rem;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0.75rem;
          background: var(--bg-accent, #f9f4ec);
          border-radius: 8px;
          font-weight: 600;
          color: var(--ink, #1d1916);
        }

        .items-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }

        .items-table th,
        .items-table td {
          padding: 0.5rem;
          text-align: left;
          border-bottom: 1px solid var(--border, #e6dbcf);
        }

        .items-table th {
          font-weight: 600;
          background: var(--bg, #f4efe8);
          font-size: 0.75rem;
          text-transform: uppercase;
          color: var(--muted, #6a6259);
        }

        .col-unit,
        .col-qty,
        .col-price,
        .col-total {
          text-align: right;
          white-space: nowrap;
        }

        .col-spec {
          color: var(--muted, #6a6259);
        }

        .option-badge {
          display: inline-block;
          padding: 0.125rem 0.5rem;
          background: rgba(10, 106, 91, 0.12);
          color: var(--accent, #0a6a5b);
          font-size: 0.625rem;
          border-radius: 6px;
          margin-right: 0.5rem;
          font-weight: 500;
        }

        .item-remark {
          display: block;
          font-size: 0.75rem;
          color: var(--muted, #6a6259);
          margin-top: 0.25rem;
        }

        .options-list,
        .exclusions-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .options-list li,
        .exclusions-list li {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem;
          border-bottom: 1px solid var(--border, #e6dbcf);
          color: var(--ink, #1d1916);
        }

        .exclusion-desc {
          color: var(--muted, #6a6259);
          font-size: 0.875rem;
        }

        .summary-table {
          width: 100%;
          max-width: 400px;
          margin-left: auto;
          border-collapse: collapse;
        }

        .summary-table th,
        .summary-table td {
          padding: 0.5rem 1rem;
          border-bottom: 1px solid var(--border, #e6dbcf);
        }

        .summary-table th {
          text-align: left;
          font-weight: 500;
          color: var(--ink, #1d1916);
        }

        .summary-table td {
          text-align: right;
          font-variant-numeric: tabular-nums;
          color: var(--ink, #1d1916);
        }

        .summary-table .discount td {
          color: #dc2626;
        }

        .summary-table .grand-total {
          font-size: 1.125rem;
          font-weight: 700;
        }

        .summary-table .grand-total th,
        .summary-table .grand-total td {
          border-bottom: 2px solid var(--accent, #0a6a5b);
          padding-top: 1rem;
          color: var(--accent, #0a6a5b);
        }

        .preview-footer {
          margin-top: 3rem;
          text-align: center;
          font-size: 0.875rem;
          color: var(--muted, #6a6259);
        }

        .company-name {
          font-size: 1rem;
          font-weight: 600;
          color: var(--ink, #1d1916);
          margin-bottom: 0.5rem;
        }

        .footer-note {
          margin: 0;
        }

        @media print {
          .estimate-preview {
            padding: 0;
            border-radius: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default EstimatePreview;
