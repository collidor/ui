/**
 * UI Component Library Constants & Mathematical Helpers
 */

export const PHI = 1.618033988749895

/**
 * Calculates golden ratio relative spatial value given power n and optional base in px/em
 * scale = base * phi^n
 */
export function goldenSpace(power: number, base: number = 1): number {
  return base * Math.pow(PHI, power)
}

export const UI_TAG_NAMES = {
  BUTTON: 'ui-button',
  INPUT: 'ui-input',
  NUMBER_INPUT: 'ui-number-input',
  SLIDER: 'ui-slider',
  SWITCH: 'ui-switch',
  SELECT: 'ui-select',
  FIELD: 'ui-field',
  CARD: 'ui-card',
  TABS: 'ui-tabs',
  TAB: 'ui-tab',
  ICON: 'ui-icon',
  TOOLTIP: 'ui-tooltip',
  DIALOG: 'ui-dialog',
  TABLE: 'ui-table',
  PAGINATION: 'ui-pagination',
  LIST: 'ui-list',
  STAT_CARD: 'ui-stat-card',
  STRUCT_FORM: 'ui-struct-form',
  PROGRESS: 'ui-progress',
  DRAWER: 'ui-drawer',
  SEGMENTED_CONTROL: 'ui-segmented-control',
  SEGMENT_ITEM: 'ui-segment-item',
  ALERT: 'ui-alert',
  TOAST: 'ui-toast',
  TOAST_CONTAINER: 'ui-toast-container',
  MENU: 'ui-menu',
  MENU_ITEM: 'ui-menu-item',
  MENU_DIVIDER: 'ui-menu-divider',
  ACCORDION: 'ui-accordion',
  ACCORDION_ITEM: 'ui-accordion-item',
  CHIP: 'ui-chip',
  CHIP_GROUP: 'ui-chip-group',
  POPOVER: 'ui-popover',
  CONTEXT_MENU: 'ui-context-menu',
} as const

export type Variant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'accent'
  | 'info'
  | 'success'
  | 'warning'
  | 'neutral'

export type Size = 'sm' | 'md' | 'lg'

export type TableAlign = 'left' | 'center' | 'right'
export type DataSortDirection = 'asc' | 'desc' | null
export type TableSortDirection = DataSortDirection

export type ListLayout = 'list' | 'grid' | 'auto-fit'

export interface TableColumn<T = Record<string, unknown>> {
  key: string
  label?: string
  align?: TableAlign
  width?: string
  sortable?: boolean
  hidden?: boolean
  resizable?: boolean
  formatter?: (value: unknown, row: T, index: number) => string | HTMLElement
}

export interface DataSortEventDetail<T = Record<string, unknown>> {
  column: string
  direction: DataSortDirection
  data: T[]
}
export type TableSortEventDetail<T = Record<string, unknown>> = DataSortEventDetail<T>
export type ListSortEventDetail<T = Record<string, unknown>> = DataSortEventDetail<T>

export interface DataSelectionEventDetail<T = Record<string, unknown>> {
  selectedKeys: string[]
  selectedItems: T[]
  item?: T
  index?: number
}

export interface TableSelectionEventDetail<T = Record<string, unknown>> {
  selectedKeys: string[]
  selectedRows: T[]
  row?: T
  index?: number
}

export interface DataPageEventDetail {
  page: number
  pageSize: number
  totalPages: number
  total: number
}
export type TablePageEventDetail = DataPageEventDetail
export type ListPageEventDetail = DataPageEventDetail

export interface DataGetPageParams {
  page: number
  pageSize: number
  sortBy: string
  sortDirection: DataSortDirection
}
export type TableGetPageParams = DataGetPageParams
export type ListGetPageParams = DataGetPageParams

export interface DataGetPageEventDetail<T = Record<string, unknown>> extends DataGetPageParams {
  resolve?: (result: { data: T[]; total?: number }) => void
}
export type TableGetPageEventDetail<T = Record<string, unknown>> = DataGetPageEventDetail<T>
export type ListGetPageEventDetail<T = Record<string, unknown>> = DataGetPageEventDetail<T>

export interface TableColumnsChangeEventDetail<T = Record<string, unknown>> {
  columns: TableColumn<T>[]
}

export interface ListItemClickEventDetail<T = Record<string, unknown>> {
  item: T
  index: number
  selected: boolean
}
