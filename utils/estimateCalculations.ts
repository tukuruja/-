/**
 * Estimate Calculation Utilities
 *
 * Functions for calculating line item totals, section totals,
 * and overall estimate totals with margin calculations.
 */

import type {
    Estimate,
    EstimateSection,
    EstimateLineItem,
    EstimateOption,
    EstimateExtraWork,
} from '../types/estimate';

// =============================================================================
// Line Item Calculations
// =============================================================================

/**
 * Calculate totals for a single line item
 */
export function calculateLineItemTotals(item: Pick<EstimateLineItem, 'quantity' | 'costUnitPrice' | 'sellingUnitPrice' | 'adjustmentAmount'>) {
    const costTotal = item.quantity * item.costUnitPrice;
    const sellingTotal = item.quantity * item.sellingUnitPrice + (item.adjustmentAmount ?? 0);
    const grossMarginRate =
          sellingTotal > 0 ? (sellingTotal - costTotal) / sellingTotal : 0;

  return {
        costTotal,
        sellingTotal,
        grossMarginRate,
  };
}

/**
 * Update line item with recalculated totals
 */
export function recalculateLineItem(item: EstimateLineItem): EstimateLineItem {
    const totals = calculateLineItemTotals(item);
    return {
          ...item,
          costTotal: totals.costTotal,
          sellingTotal: totals.sellingTotal,
          grossMarginRate: totals.grossMarginRate,
    };
}

// =============================================================================
// Section Calculations
// =============================================================================

/**
 * Calculate totals for a section based on its line items
 */
export function calculateSectionTotals(section: Pick<EstimateSection, 'lineItems'>) {
    // Only include items that are not options, or are selected options
  const includedItems = section.lineItems.filter(
        (item) => !item.isOption || item.isSelected
      );

  const costTotal = includedItems.reduce((sum, item) => sum + item.costTotal, 0);
    const sellingTotal = includedItems.reduce((sum, item) => sum + item.sellingTotal, 0);

  return {
        costTotal,
        sellingTotal,
  };
}

/**
 * Update section with recalculated totals
 */
export function recalculateSection(section: EstimateSection): EstimateSection {
    // First recalculate all line items
  const recalculatedItems = section.lineItems.map(recalculateLineItem);

  // Then calculate section totals
  const totals = calculateSectionTotals({ lineItems: recalculatedItems });

  return {
        ...section,
        lineItems: recalculatedItems,
        costTotal: totals.costTotal,
        sellingTotal: totals.sellingTotal,
  };
}

// =============================================================================
// Estimate Calculations
// =============================================================================

/**
 * Calculate tax amount for a single line item, respecting per-item
 * isTaxExempt flag and optional per-item taxRate override.
 */
function calculateLineItemTax(item: EstimateLineItem, defaultTaxRate: number): number {
    if (item.isTaxExempt) return 0;
    const rate = item.taxRate ?? defaultTaxRate;
    return Math.round(item.sellingTotal * rate);
}

/**
 * Calculate all totals for an estimate
 */
export function calculateEstimateTotals(estimate: Pick<Estimate, 'sections' | 'options' | 'extraWorks' | 'overheadsTotal' | 'discountAmount' | 'taxRate'>) {
    // Sum section totals
  const sellingSubtotal = estimate.sections.reduce(
        (sum, section) => sum + section.sellingTotal,
        0
      );
    const costSubtotal = estimate.sections.reduce(
          (sum, section) => sum + section.costTotal,
          0
        );

  // Add selected options
  const selectedOptionsTotal = estimate.options
      .filter((option) => option.isSelected)
      .reduce((sum, option) => sum + option.sellingAmount, 0);

  const selectedOptionsCost = estimate.options
      .filter((option) => option.isSelected)
      .reduce((sum, option) => sum + option.costAmount, 0);

  // Add approved extra works
  const approvedExtraWorksTotal = estimate.extraWorks
      .filter((ew) => ew.status === 'approved')
      .reduce((sum, ew) => sum + ew.sellingAmount, 0);

  const approvedExtraWorksCost = estimate.extraWorks
      .filter((ew) => ew.status === 'approved')
      .reduce((sum, ew) => sum + ew.costAmount, 0);

  // Calculate tax per line item (respecting isTaxExempt and per-item taxRate)
  const lineItemTax = estimate.sections.reduce((sum, section) => {
        const includedItems = section.lineItems.filter(
                (item) => !item.isOption || item.isSelected
              );
        return sum + includedItems.reduce(
                (itemSum, item) => itemSum + calculateLineItemTax(item, estimate.taxRate),
                0
              );
  }, 0);

  // Tax on overheads and discounts (use estimate-level taxRate)
  const overheadsTax = Math.round(
        (estimate.overheadsTotal - estimate.discountAmount) * estimate.taxRate
      );

  // Tax on options and extra works (use estimate-level taxRate)
  const optionsTax = Math.round(selectedOptionsTotal * estimate.taxRate);
    const extraWorksTax = Math.round(approvedExtraWorksTotal * estimate.taxRate);

  const taxAmount = lineItemTax + overheadsTax + optionsTax + extraWorksTax;

  // Calculate taxable amount (for reference / backwards compat)
  const subtotalBeforeOverheads =
        sellingSubtotal + selectedOptionsTotal + approvedExtraWorksTotal;
    const taxableAmount =
          subtotalBeforeOverheads + estimate.overheadsTotal - estimate.discountAmount;

  // Grand total
  const grandTotal = taxableAmount + taxAmount;

  // Margin calculations
  const totalCost = costSubtotal + selectedOptionsCost + approvedExtraWorksCost;
    const grossMargin = sellingSubtotal - costSubtotal;
    const grossMarginRate = sellingSubtotal > 0 ? grossMargin / sellingSubtotal : 0;

  return {
        sellingSubtotal,
        costSubtotal,
        taxAmount,
        grandTotal,
        grossMargin,
        grossMarginRate,
        totalCost,
        selectedOptionsTotal,
        approvedExtraWorksTotal,
  };
}

/**
 * Fully recalculate an estimate and all its nested items
 */
export function recalculateEstimate(estimate: Estimate): Estimate {
    // Recalculate all sections (which recalculates all line items)
  const recalculatedSections = estimate.sections.map(recalculateSection);

  // Calculate estimate totals
  const totals = calculateEstimateTotals({
        sections: recalculatedSections,
        options: estimate.options,
        extraWorks: estimate.extraWorks,
        overheadsTotal: estimate.overheadsTotal,
        discountAmount: estimate.discountAmount,
        taxRate: estimate.taxRate,
  });

  return {
        ...estimate,
        sections: recalculatedSections,
        sellingSubtotal: totals.sellingSubtotal,
        costSubtotal: totals.costSubtotal,
        taxAmount: totals.taxAmount,
        grandTotal: totals.grandTotal,
  };
}

// =============================================================================
// Margin Helpers
// =============================================================================

/**
 * Calculate selling price from cost and target margin rate
 */
export function calculateSellingFromMargin(costPrice: number, marginRate: number): number {
    if (marginRate >= 1) return 0; // Invalid margin rate
  return Math.round(costPrice / (1 - marginRate));
}

/**
 * Calculate cost price from selling and margin rate
 */
export function calculateCostFromMargin(sellingPrice: number, marginRate: number): number {
    return Math.round(sellingPrice * (1 - marginRate));
}

/**
 * Get margin rate status for display
 */
export function getMarginStatus(marginRate: number): 'good' | 'warning' | 'low' {
    if (marginRate >= 0.2) return 'good';
    if (marginRate >= 0.1) return 'warning';
    return 'low';
}

// =============================================================================
// Formatting Helpers
// =============================================================================

/**
 * Format number as Japanese Yen currency
 */
export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('ja-JP', {
          style: 'currency',
          currency: 'JPY',
          maximumFractionDigits: 0,
    }).format(value);
}

/**
 * Format number with thousands separator
 */
export function formatNumber(value: number, decimals = 0): string {
    return new Intl.NumberFormat('ja-JP', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
    }).format(value);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals = 1): string {
    return `${(value * 100).toFixed(decimals)}%`;
}

// =============================================================================
// Validation Helpers
// =============================================================================

/**
 * Validate line item data
 */
export function validateLineItem(item: Partial<EstimateLineItem>): string[] {
    const errors: string[] = [];

  if (!item.name || item.name.trim() === '') {
        errors.push('名称は必須です');
  }

  if (!item.unit || item.unit.trim() === '') {
        errors.push('単位は必須です');
  }

  if (item.quantity !== undefined && item.quantity < 0) {
        errors.push('数量は0以上である必要があります');
  }

  if (item.costUnitPrice !== undefined && item.costUnitPrice < 0) {
        errors.push('原価単価は0以上である必要があります');
  }

  if (item.sellingUnitPrice !== undefined && item.sellingUnitPrice < 0) {
        errors.push('売価単価は0以上である必要があります');
  }

  return errors;
}

/**
 * Check if estimate has any negative margins
 */
export function hasNegativeMargins(estimate: Estimate): boolean {
    return estimate.sections.some((section) =>
          section.lineItems.some(
                  (item) => item.sellingUnitPrice < item.costUnitPrice
                        )
                                    );
}

/**
 * Get items with low margins (below threshold)
 */
export function getLowMarginItems(
    estimate: Estimate,
    threshold = 0.1
  ): EstimateLineItem[] {
    const lowMarginItems: EstimateLineItem[] = [];

  for (const section of estimate.sections) {
        for (const item of section.lineItems) {
                if ((item.grossMarginRate ?? 0) < threshold && item.sellingUnitPrice > 0) {
                          lowMarginItems.push(item);
                }
        }
  }

  return lowMarginItems;
}
