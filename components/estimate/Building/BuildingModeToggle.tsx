/**
 * BuildingModeToggle Component
 *
 * Toggle between New Build (新築) and Reform (リフォーム) modes.
 * Only visible when estimateType === 'building'.
 */

import React from 'react';
import type { BuildingMode } from '../../../types/estimate';

interface BuildingModeToggleProps {
  value: BuildingMode;
  onChange: (mode: BuildingMode) => void;
  disabled?: boolean;
}

export function BuildingModeToggle({
  value,
  onChange,
  disabled = false,
}: BuildingModeToggleProps) {
  return (
    <div className="building-mode-toggle">
      <div className="toggle-container">
        <button
          type="button"
          className={`toggle-button ${value === 'new_build' ? 'active' : ''}`}
          onClick={() => onChange('new_build')}
          disabled={disabled}
          aria-pressed={value === 'new_build'}
        >
          <span className="toggle-icon">🏗️</span>
          <span className="toggle-label">新築</span>
          <span className="toggle-sublabel">工種別</span>
        </button>

        <button
          type="button"
          className={`toggle-button ${value === 'reform' ? 'active' : ''}`}
          onClick={() => onChange('reform')}
          disabled={disabled}
          aria-pressed={value === 'reform'}
        >
          <span className="toggle-icon">🔧</span>
          <span className="toggle-label">リフォーム</span>
          <span className="toggle-sublabel">部位別</span>
        </button>
      </div>

      <style jsx>{`
        .building-mode-toggle {
          margin-bottom: 1rem;
        }

        .toggle-container {
          display: flex;
          gap: 0.5rem;
          background: var(--bg-accent, #f9f4ec);
          padding: 6px;
          border-radius: var(--radius-sm, 12px);
          border: 1px solid var(--border, #e6dbcf);
        }

        .toggle-button {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.75rem 1rem;
          border: 2px solid transparent;
          border-radius: 10px;
          background: transparent;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: "BIZ UDPGothic", "Noto Sans JP", sans-serif;
          color: var(--muted, #6a6259);
        }

        .toggle-button:hover:not(:disabled) {
          background: rgba(10, 106, 91, 0.08);
          color: var(--ink, #1d1916);
        }

        .toggle-button.active {
          background: var(--accent, #0a6a5b);
          color: #fff;
          border-color: var(--accent, #0a6a5b);
        }

        .toggle-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .toggle-icon {
          font-size: 1.5rem;
          margin-bottom: 0.25rem;
        }

        .toggle-label {
          font-size: 1rem;
          font-weight: 600;
        }

        .toggle-sublabel {
          font-size: 0.75rem;
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
}

export default BuildingModeToggle;
