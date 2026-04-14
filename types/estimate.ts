/**
 * Building Estimate Types
 *
 * Type definitions for the building estimate feature (新築・リフォーム見積)
 * Supports both new construction (new_build) and renovation (reform) modes.
 */

// =============================================================================
// Type Discriminators
// =============================================================================

/** Estimate type discriminator - determines overall estimate structure */
export type EstimateType = 'standard' | 'civil' | 'building';

/** Building mode - only applicable when estimateType === 'building' */
export type BuildingMode = 'new_build' | 'reform';

/** Estimate stage for tracking progress */
export type EstimateStage = 'concept' | 'basic' | 'detailed' | 'final';

/** Estimate status for workflow */
export type EstimateStatus = 'draft' | 'sent' | 'approved' | 'rejected';

// =============================================================================
// Section Types
// =============================================================================

/** Section category for filtering */
export type SectionCategory = 'new_build' | 'reform' | 'common';

/** Section type for classification */
export type SectionType = 'trade' | 'part' | 'common';

// =============================================================================
// Building Types (Japanese)
// =============================================================================

/** Building type classification */
export type BuildingType = '住宅' | '店舗' | 'マンション' | '事務所' | '倉庫' | 'その他';

/** Structure type classification */
export type StructureType = '木造' | '鉄骨' | 'RC' | 'SRC' | '混構造';

// =============================================================================
// Section Templates
// =============================================================================

/** New Build (新築) Trade-based Sections - 工種別 */
export const NEW_BUILD_SECTIONS = [
  { code: 'temporary', name: '仮設工事', sortOrder: 1 },
  { code: 'frame', name: '躯体・木工事', sortOrder: 2 },
  { code: 'steel', name: '鉄骨工事', sortOrder: 3 },
  { code: 'rc', name: 'RC工事', sortOrder: 4 },
  { code: 'roof', name: '屋根工事', sortOrder: 5 },
  { code: 'exterior', name: '外壁工事', sortOrder: 6 },
  { code: 'doors', name: '建具工事', sortOrder: 7 },
  { code: 'interior', name: '内装工事', sortOrder: 8 },
  { code: 'plumbing', name: '設備工事', sortOrder: 9 },
  { code: 'electrical', name: '電気工事', sortOrder: 10 },
  { code: 'painting', name: '塗装工事', sortOrder: 11 },
  { code: 'waterproof', name: '防水工事', sortOrder: 12 },
  { code: 'landscaping', name: '外構工事', sortOrder: 13 },
  { code: 'overhead', name: '諸経費', sortOrder: 14 },
  { code: 'management', name: '現場管理費', sortOrder: 15 },
] as const;

/** Reform (リフォーム) Part-based Sections - 部位別 */
export const REFORM_SECTIONS = [
  { code: 'kitchen', name: 'キッチン', sortOrder: 1 },
  { code: 'bathroom', name: '浴室', sortOrder: 2 },
  { code: 'toilet', name: 'トイレ', sortOrder: 3 },
  { code: 'washroom', name: '洗面', sortOrder: 4 },
  { code: 'ldk', name: 'LDK', sortOrder: 5 },
  { code: 'bedroom', name: '居室', sortOrder: 6 },
  { code: 'hallway', name: '廊下・玄関', sortOrder: 7 },
  { code: 'exterior_wall', name: '外壁', sortOrder: 8 },
  { code: 'roof', name: '屋根', sortOrder: 9 },
  { code: 'landscaping', name: '外構', sortOrder: 10 },
  { code: 'other', name: 'その他', sortOrder: 11 },
] as const;

/** Common unit options for line items */
export const UNIT_OPTIONS = [
  { value: '式', label: '式 (set)' },
  { value: 'm2', label: 'm² (square meter)' },
  { value: 'm', label: 'm (meter)' },
  { value: '個', label: '個 (piece)' },
  { value: '本', label: '本 (stick/bar)' },
  { value: '枚', label: '枚 (sheet)' },
  { value: '箇所', label: '箇所 (location)' },
  { value: '台', label: '台 (unit/machine)' },
  { value: '人工', label: '人工 (man-day)' },
  { value: 'kg', label: 'kg' },
  { value: 't', label: 't (ton)' },
] as const;

// =============================================================================
// Main Interfaces
// =============================================================================

/** Main Estimate entity */
export interface Estimate {
  id: string;
  companyId: string;
  projectId?: string;
  counterpartyId?: string;

  // Type discriminators
  estimateType: EstimateType;
  buildingMode?: BuildingMode;

  // Building-specific fields
  buildingType?: BuildingType;
  structureType?: StructureType;
  estimateStage?: EstimateStage;
  floorArea?: number; // m2

  // Core fields
  title?: string;
  status: EstimateStatus;
  validUntil?: string; // ISO date
  notes?: string;

  // Totals (computed, stored for performance)
  sellingSubtotal: number;
  costSubtotal: number;
  overheadsTotal: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;

  // Related entities
  sections: EstimateSection[];
  extraWorks: EstimateExtraWork[];
  exclusions: EstimateExclusion[];
  options: EstimateOption[];

  // Audit fields
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

/** Section within an estimate */
export interface EstimateSection {
  id: string;
  estimateId: string;
  parentSectionId?: string; // For nested sections

  // Classification
  category?: SectionCategory;
  sectionType?: SectionType;
  code?: string;
  name: string;

  // Display
  sortOrder: number;
  isExpanded: boolean;

  // Computed totals
  sellingTotal: number;
  costTotal: number;

  // Related entities
  lineItems: EstimateLineItem[];
  childSections?: EstimateSection[]; // For nested display

  // Audit fields
  createdAt: string;
  updatedAt: string;
}

/** Individual line item within a section */
export interface EstimateLineItem {
  id: string;
  sectionId: string;

  // Item details
  name: string;
  description?: string;
  workType?: string; // 工種 (for new_build mode)
  specification?: string; // 仕様
  unit: string;
  quantity: number;

  // Dual pricing
  costUnitPrice: number; // 原価単価
  sellingUnitPrice: number; // 売価単価
  costTotal: number; // qty * costUnitPrice
  sellingTotal: number; // qty * sellingUnitPrice
  grossMarginRate?: number; // 粗利率
  adjustmentAmount: number; // 端数調整

  // Tax handling
  taxRate?: number; // NULL = use estimate default
  isTaxExempt: boolean;

  // Remarks (internal vs client)
  remarksInternal?: string; // Hidden from client
  remarksClient?: string; // Visible to client

  // Visibility flags
  isInternalOnly: boolean;
  isClientVisible: boolean;
  isOption: boolean;
  isSelected: boolean;

  // Display
  sortOrder: number;

  // Audit fields
  createdAt: string;
  updatedAt: string;
}

/** Extra work / Change order */
export interface EstimateExtraWork {
  id: string;
  estimateId: string;
  name: string;
  description?: string;
  sellingAmount: number;
  costAmount: number;
  status: 'pending' | 'approved' | 'rejected';
  sortOrder: number;
  createdAt: string;
}

/** Exclusion item */
export interface EstimateExclusion {
  id: string;
  estimateId: string;
  name: string;
  description?: string;
  sortOrder: number;
  createdAt: string;
}

/** Optional item */
export interface EstimateOption {
  id: string;
  estimateId: string;
  name: string;
  description?: string;
  sellingAmount: number;
  costAmount: number;
  isSelected: boolean;
  sortOrder: number;
  createdAt: string;
}

/** Company-wide cost settings */
export interface CostSettings {
  id: string;
  companyId: string;
  siteManagementRate: number; // 現場管理費率
  generalExpenseRate: number; // 諸経費率
  defaultMarginRate: number; // デフォルト粗利率
  defaultTaxRate: number;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// Request/Response Types
// =============================================================================

/** Create estimate request */
export interface EstimateCreateRequest {
  companyId: string;
  projectId?: string;
  counterpartyId?: string;
  estimateType: EstimateType;
  buildingMode?: BuildingMode;
  buildingType?: BuildingType;
  structureType?: StructureType;
  estimateStage?: EstimateStage;
  floorArea?: number;
  title?: string;
  notes?: string;
  validUntil?: string;
}

/** Update estimate request */
export interface EstimateUpdateRequest {
  projectId?: string;
  counterpartyId?: string;
  buildingMode?: BuildingMode;
  buildingType?: BuildingType;
  structureType?: StructureType;
  estimateStage?: EstimateStage;
  floorArea?: number;
  title?: string;
  status?: EstimateStatus;
  notes?: string;
  validUntil?: string;
  overheadsTotal?: number;
  discountAmount?: number;
  taxRate?: number;
}

/** Add section request */
export interface EstimateSectionCreateRequest {
  parentSectionId?: string;
  category?: SectionCategory;
  sectionType?: SectionType;
  code?: string;
  name: string;
  sortOrder?: number;
}

/** Add line item request */
export interface EstimateLineItemCreateRequest {
  name: string;
  description?: string;
  workType?: string;
  specification?: string;
  unit: string;
  quantity: number;
  costUnitPrice: number;
  sellingUnitPrice: number;
  taxRate?: number;
  isTaxExempt?: boolean;
  remarksInternal?: string;
  remarksClient?: string;
  isInternalOnly?: boolean;
  isClientVisible?: boolean;
  isOption?: boolean;
  isSelected?: boolean;
  sortOrder?: number;
}

/** Client-facing estimate preview (hides cost data) */
export interface EstimatePreview {
  id: string;
  title?: string;
  status: EstimateStatus;
  validUntil?: string;
  buildingType?: BuildingType;
  structureType?: StructureType;
  floorArea?: number;
  sections: EstimateSectionPreview[];
  exclusions: EstimateExclusion[];
  options: EstimateOptionPreview[];
  sellingSubtotal: number;
  overheadsTotal: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
}

/** Section preview (client-facing) */
export interface EstimateSectionPreview {
  id: string;
  name: string;
  lineItems: EstimateLineItemPreview[];
  sellingTotal: number;
}

/** Line item preview (client-facing, no cost data) */
export interface EstimateLineItemPreview {
  id: string;
  name: string;
  description?: string;
  specification?: string;
  unit: string;
  quantity: number;
  sellingUnitPrice: number;
  sellingTotal: number;
  remarksClient?: string;
  isOption: boolean;
  isSelected: boolean;
}

/** Option preview (client-facing, no cost data) */
export interface EstimateOptionPreview {
  id: string;
  name: string;
  description?: string;
  sellingAmount: number;
  isSelected: boolean;
}

// =============================================================================
// Utility Types
// =============================================================================

/** Section template for auto-generation */
export interface SectionTemplate {
  code: string;
  name: string;
  sortOrder: number;
}

/** Get sections for building mode */
export function getSectionsForMode(mode: BuildingMode): readonly SectionTemplate[] {
  return mode === 'new_build' ? NEW_BUILD_SECTIONS : REFORM_SECTIONS;
}

/** Type guard for building estimate */
export function isBuildingEstimate(estimate: Estimate): boolean {
  return estimate.estimateType === 'building';
}

/** Type guard for new build mode */
export function isNewBuildMode(estimate: Estimate): boolean {
  return estimate.estimateType === 'building' && estimate.buildingMode === 'new_build';
}

/** Type guard for reform mode */
export function isReformMode(estimate: Estimate): boolean {
  return estimate.estimateType === 'building' && estimate.buildingMode === 'reform';
}
