/**
 * Standardized v2 Event Names, Detail Interfaces, Typed CustomEvents, and
 * Component Event Maps for @collidor/ui.
 */

import type { DataSortDirection, TableColumn, TableSortDirection } from './constants.ts'
import type { UIAccordionItem } from './components/accordion.component.ts'
import type { ComboboxOption } from './components/combobox.component.ts'
import type { DrawerPlacement } from './components/drawer.component.ts'
import type { UIMenuItem } from './components/menu.component.ts'
import type { PopoverPlacement } from './components/popover.component.ts'

export const UI_EVENTS = {
  INPUT: 'ui-input',
  CHANGE: 'ui-change',
  CREATE: 'ui-create',
  OPEN: 'ui-open',
  CLOSE: 'ui-close',
  DISMISS: 'ui-dismiss',
  SELECT: 'ui-select',
  TOGGLE: 'ui-toggle',
  COLLAPSE_CHANGE: 'ui-collapse-change',
  SORT: 'ui-sort',
  PAGE_CHANGE: 'ui-page-change',
  PAGE_SIZE_CHANGE: 'ui-page-size-change',
  PAGE_REQUEST: 'ui-page-request',
  SELECTION_CHANGE: 'ui-selection-change',
  ROW_CLICK: 'ui-row-click',
  ITEM_CLICK: 'ui-item-click',
  COLUMNS_CHANGE: 'ui-columns-change',
  FORM_CHANGE: 'ui-form-change',
  FORM_SUBMIT: 'ui-form-submit',
  FORM_INVALID: 'ui-form-invalid',
  FORM_LOADING: 'ui-form-loading',
  FORM_STEP_ERROR: 'ui-form-step-error',
} as const

export type UIEventName = (typeof UI_EVENTS)[keyof typeof UI_EVENTS]

export type UIEventListener<E extends Event> =
  | ((evt: E) => void)
  | { handleEvent(object: E): void }
  | null

// ---------------------------------------------------------------------------
// Headered / Collapsible Surfaces
// ---------------------------------------------------------------------------

export interface CollapseChangeEventDetail {
  collapsed: boolean
}
export type UICollapseChangeEvent = CustomEvent<CollapseChangeEventDetail>

export interface UIHeaderedElementEventMap {
  'ui-collapse-change': UICollapseChangeEvent
}

// ---------------------------------------------------------------------------
// Pagination & Data Collections (UIPagination, UITable, UIList)
// ---------------------------------------------------------------------------

export interface PageChangeEventDetail {
  page: number
  pageSize: number
  totalPages: number
  total: number
}
export type TablePageChangeEventDetail = PageChangeEventDetail
export type ListPageChangeEventDetail = PageChangeEventDetail

export type UIPageChangeEvent = CustomEvent<PageChangeEventDetail>
export type UITablePageChangeEvent = CustomEvent<TablePageChangeEventDetail>
export type UIListPageChangeEvent = CustomEvent<ListPageChangeEventDetail>

export interface PageSizeChangeEventDetail {
  page: number
  pageSize: number
  totalPages: number
  total: number
}
export type TablePageSizeChangeEventDetail = PageSizeChangeEventDetail
export type ListPageSizeChangeEventDetail = PageSizeChangeEventDetail

export type UIPageSizeChangeEvent = CustomEvent<PageSizeChangeEventDetail>
export type UITablePageSizeChangeEvent = CustomEvent<TablePageSizeChangeEventDetail>
export type UIListPageSizeChangeEvent = CustomEvent<ListPageSizeChangeEventDetail>

export interface UIPaginationEventMap {
  'ui-page-change': UIPageChangeEvent
  'ui-page-size-change': UIPageSizeChangeEvent
}

export interface DataSortEventDetail<T = Record<string, unknown>> {
  sortBy: string
  sortDirection: DataSortDirection
  data: T[]
}
export type TableSortEventDetail<T = Record<string, unknown>> = DataSortEventDetail<T>
export type ListSortEventDetail<T = Record<string, unknown>> = DataSortEventDetail<T>

export type UITableSortEvent<T = Record<string, unknown>> = CustomEvent<TableSortEventDetail<T>>
export type UIListSortEvent<T = Record<string, unknown>> = CustomEvent<ListSortEventDetail<T>>

export type DataPageRequestReason = 'page' | 'page-size' | 'sort' | 'scroll' | 'manual'

export interface DataPageRequestParams {
  page: number
  pageSize: number
  sortBy: string
  sortDirection: DataSortDirection
  reason: DataPageRequestReason
  append: boolean
}
export type TablePageRequestParams = DataPageRequestParams
export type ListPageRequestParams = DataPageRequestParams

export interface DataPageRequestResult<T = Record<string, unknown>> {
  data: T[]
  total?: number
}

export interface DataPageRequestEventDetail<T = Record<string, unknown>>
  extends DataPageRequestParams {
  resolve: (result: DataPageRequestResult<T>) => void
}
export type TablePageRequestEventDetail<T = Record<string, unknown>> =
  DataPageRequestEventDetail<T>
export type ListPageRequestEventDetail<T = Record<string, unknown>> =
  DataPageRequestEventDetail<T>

export type UITablePageRequestEvent<T = Record<string, unknown>> = CustomEvent<
  TablePageRequestEventDetail<T>
>
export type UIListPageRequestEvent<T = Record<string, unknown>> = CustomEvent<
  ListPageRequestEventDetail<T>
>

export interface TableSelectionChangeEventDetail<T = Record<string, unknown>> {
  selectedKeys: string[]
  selectedRows: T[]
  row?: T
  index?: number
}
export type UITableSelectionChangeEvent<T = Record<string, unknown>> = CustomEvent<
  TableSelectionChangeEventDetail<T>
>

export interface ListSelectionChangeEventDetail<T = Record<string, unknown>> {
  selectedKeys: string[]
  selectedItems: T[]
  item?: T
  index?: number
}
export type UIListSelectionChangeEvent<T = Record<string, unknown>> = CustomEvent<
  ListSelectionChangeEventDetail<T>
>

export interface TableRowClickEventDetail<T = Record<string, unknown>> {
  row: T
  index: number
  key: string
  selected: boolean
}
export type UITableRowClickEvent<T = Record<string, unknown>> = CustomEvent<
  TableRowClickEventDetail<T>
>

export interface ListItemClickEventDetail<T = Record<string, unknown>> {
  item: T
  index: number
  key: string
  selected: boolean
}
export type UIListItemClickEvent<T = Record<string, unknown>> = CustomEvent<
  ListItemClickEventDetail<T>
>

export interface TableColumnsChangeEventDetail<T = Record<string, unknown>> {
  columns: TableColumn<T>[]
}
export type UITableColumnsChangeEvent<T = Record<string, unknown>> = CustomEvent<
  TableColumnsChangeEventDetail<T>
>

export interface UITableEventMap<T = Record<string, unknown>> extends UIHeaderedElementEventMap {
  'ui-sort': UITableSortEvent<T>
  'ui-page-change': UITablePageChangeEvent
  'ui-page-size-change': UITablePageSizeChangeEvent
  'ui-page-request': UITablePageRequestEvent<T>
  'ui-selection-change': UITableSelectionChangeEvent<T>
  'ui-row-click': UITableRowClickEvent<T>
  'ui-columns-change': UITableColumnsChangeEvent<T>
}

export interface UIListEventMap<T = Record<string, unknown>> extends UIHeaderedElementEventMap {
  'ui-sort': UIListSortEvent<T>
  'ui-page-change': UIListPageChangeEvent
  'ui-page-size-change': UIListPageSizeChangeEvent
  'ui-page-request': UIListPageRequestEvent<T>
  'ui-selection-change': UIListSelectionChangeEvent<T>
  'ui-item-click': UIListItemClickEvent<T>
}

// ---------------------------------------------------------------------------
// Form Controls & Navigation
// ---------------------------------------------------------------------------

export interface InputEventDetail {
  value: string
}
export interface InputChangeEventDetail {
  value: string
}
export type UIInputEvent = CustomEvent<InputEventDetail>
export type UIInputChangeEvent = CustomEvent<InputChangeEventDetail>
export interface UIInputEventMap {
  'ui-input': UIInputEvent
  'ui-change': UIInputChangeEvent
}

export interface NumberInputEventDetail {
  value: number
}
export interface NumberInputChangeEventDetail {
  value: number
}
export type UINumberInputEvent = CustomEvent<NumberInputEventDetail>
export type UINumberInputChangeEvent = CustomEvent<NumberInputChangeEventDetail>
export interface UINumberInputEventMap {
  'ui-input': UINumberInputEvent
  'ui-change': UINumberInputChangeEvent
}

export interface SliderInputEventDetail {
  value: number
}
export interface SliderChangeEventDetail {
  value: number
}
export type UISliderInputEvent = CustomEvent<SliderInputEventDetail>
export type UISliderChangeEvent = CustomEvent<SliderChangeEventDetail>
export interface UISliderEventMap {
  'ui-input': UISliderInputEvent
  'ui-change': UISliderChangeEvent
}

export interface SelectChangeEventDetail {
  value: string
}
export type UISelectChangeEvent = CustomEvent<SelectChangeEventDetail>
export interface UISelectEventMap {
  'ui-change': UISelectChangeEvent
}

export interface SwitchChangeEventDetail {
  checked: boolean
}
export type UISwitchChangeEvent = CustomEvent<SwitchChangeEventDetail>
export interface UISwitchEventMap {
  'ui-change': UISwitchChangeEvent
}

export interface SegmentedControlChangeEventDetail {
  value: string
}
export type UISegmentedControlChangeEvent = CustomEvent<SegmentedControlChangeEventDetail>
export interface UISegmentedControlEventMap {
  'ui-change': UISegmentedControlChangeEvent
}

export interface TabsChangeEventDetail {
  value: string
}
export type UITabsChangeEvent = CustomEvent<TabsChangeEventDetail>
export interface UITabsEventMap {
  'ui-change': UITabsChangeEvent
}

export interface StepperChangeEventDetail {
  activeStep: number
}
export type UIStepperChangeEvent = CustomEvent<StepperChangeEventDetail>
export interface UIStepperEventMap {
  'ui-change': UIStepperChangeEvent
}

export interface ComboboxChangeEventDetail<O extends ComboboxOption = ComboboxOption> {
  value: O['value'] | O['value'][] | ''
  selectedOptions: O[]
}
export interface ComboboxCreateEventDetail {
  value: string
  label: string
}
export type ComboboxPageRequestReason = 'search' | 'scroll'
export interface ComboboxPageRequestResult<O extends ComboboxOption = ComboboxOption> {
  options: O[]
  total?: number
}
export interface ComboboxPageRequestEventDetail<O extends ComboboxOption = ComboboxOption> {
  page: number
  pageSize: number
  search: string
  reason: ComboboxPageRequestReason
  append: boolean
  resolve: (result: ComboboxPageRequestResult<O>) => void
}
export type UIComboboxChangeEvent<O extends ComboboxOption = ComboboxOption> = CustomEvent<
  ComboboxChangeEventDetail<O>
>
export type UIComboboxCreateEvent = CustomEvent<ComboboxCreateEventDetail>
export type UIComboboxPageRequestEvent<O extends ComboboxOption = ComboboxOption> = CustomEvent<
  ComboboxPageRequestEventDetail<O>
>
export interface UIComboboxEventMap<O extends ComboboxOption = ComboboxOption> {
  'ui-change': UIComboboxChangeEvent<O>
  'ui-create': UIComboboxCreateEvent
  'ui-page-request': UIComboboxPageRequestEvent<O>
}

// ---------------------------------------------------------------------------
// Overlays, Menus, Feedback, & Disclosure
// ---------------------------------------------------------------------------

export interface AccordionToggleEventDetail {
  item: UIAccordionItem
  open: boolean
}
export type UIAccordionToggleEvent = CustomEvent<AccordionToggleEventDetail>
export interface UIAccordionItemEventMap {
  'ui-toggle': UIAccordionToggleEvent
}
export interface UIAccordionEventMap {
  'ui-toggle': UIAccordionToggleEvent
}

export interface AlertDismissEventDetail {}
export type UIAlertDismissEvent = CustomEvent<AlertDismissEventDetail>
export interface UIAlertEventMap {
  'ui-dismiss': UIAlertDismissEvent
}

export interface ToastDismissEventDetail {}
export type UIToastDismissEvent = CustomEvent<ToastDismissEventDetail>
export interface UIToastEventMap {
  'ui-dismiss': UIToastDismissEvent
}
export interface UIToastContainerEventMap {
  'ui-dismiss': UIToastDismissEvent
}

export interface ChipSelectEventDetail {
  value: string
  selected: boolean
}
export interface ChipDismissEventDetail {
  value: string
}
export type UIChipSelectEvent = CustomEvent<ChipSelectEventDetail>
export type UIChipDismissEvent = CustomEvent<ChipDismissEventDetail>
export interface UIChipEventMap {
  'ui-select': UIChipSelectEvent
  'ui-dismiss': UIChipDismissEvent
}
export interface UIChipGroupEventMap {
  'ui-select': UIChipSelectEvent
  'ui-dismiss': UIChipDismissEvent
}

export interface DialogOpenEventDetail {
  presentation: 'modal' | 'modeless'
}
export interface DialogCloseEventDetail {}
export type UIDialogOpenEvent = CustomEvent<DialogOpenEventDetail>
export type UIDialogCloseEvent = CustomEvent<DialogCloseEventDetail>
export interface UIDialogEventMap extends UIHeaderedElementEventMap {
  'ui-open': UIDialogOpenEvent
  'ui-close': UIDialogCloseEvent
}

export interface DrawerOpenEventDetail {
  placement: DrawerPlacement
}
export interface DrawerCloseEventDetail {}
export type UIDrawerOpenEvent = CustomEvent<DrawerOpenEventDetail>
export type UIDrawerCloseEvent = CustomEvent<DrawerCloseEventDetail>
export interface UIDrawerEventMap extends UIHeaderedElementEventMap {
  'ui-open': UIDrawerOpenEvent
  'ui-close': UIDrawerCloseEvent
}

export interface PopoverOpenEventDetail {
  placement: PopoverPlacement
}
export interface PopoverCloseEventDetail {}
export type UIPopoverOpenEvent = CustomEvent<PopoverOpenEventDetail>
export type UIPopoverCloseEvent = CustomEvent<PopoverCloseEventDetail>
export interface UIPopoverEventMap {
  'ui-open': UIPopoverOpenEvent
  'ui-close': UIPopoverCloseEvent
}

export interface MenuSelectEventDetail {
  value: string
  item: UIMenuItem
}
export interface MenuOpenEventDetail {}
export interface MenuCloseEventDetail {}
export type UIMenuSelectEvent = CustomEvent<MenuSelectEventDetail>
export type UIMenuOpenEvent = CustomEvent<MenuOpenEventDetail>
export type UIMenuCloseEvent = CustomEvent<MenuCloseEventDetail>
export interface UIMenuEventMap {
  'ui-select': UIMenuSelectEvent
  'ui-open': UIMenuOpenEvent
  'ui-close': UIMenuCloseEvent
}

export interface ContextMenuOpenEventDetail {
  x: number
  y: number
}
export interface ContextMenuCloseEventDetail {}
export type UIContextMenuOpenEvent = CustomEvent<ContextMenuOpenEventDetail>
export type UIContextMenuCloseEvent = CustomEvent<ContextMenuCloseEventDetail>
export interface UIContextMenuEventMap {
  'ui-select': UIMenuSelectEvent
  'ui-open': UIContextMenuOpenEvent
  'ui-close': UIContextMenuCloseEvent
}

// ---------------------------------------------------------------------------
// Struct Form
// ---------------------------------------------------------------------------

export interface StructFormChangeEventDetail<
  TValues = Record<string, unknown>,
> {
  values: TValues
  fieldKey: (keyof TValues & string) | (string & {})
  fieldValue: unknown
}
export interface StructFormSubmitEventDetail<
  TValues = Record<string, unknown>,
> {
  values: TValues
}
export interface StructFormInvalidEventDetail<
  TValues = Record<string, unknown>,
> {
  errors: Record<string, string>
  values: TValues
}
export interface StructFormLoadingEventDetail {
  loading: boolean
  fieldKey: string
}
export interface StructFormStepErrorEventDetail {
  stepKey: string
  errors: Record<string, string>
}

export type UIStructFormChangeEvent<TValues = Record<string, unknown>> =
  CustomEvent<StructFormChangeEventDetail<TValues>>
export type UIStructFormSubmitEvent<TValues = Record<string, unknown>> =
  CustomEvent<StructFormSubmitEventDetail<TValues>>
export type UIStructFormInvalidEvent<TValues = Record<string, unknown>> =
  CustomEvent<StructFormInvalidEventDetail<TValues>>
export type UIStructFormLoadingEvent = CustomEvent<StructFormLoadingEventDetail>
export type UIStructFormStepErrorEvent = CustomEvent<StructFormStepErrorEventDetail>

export interface UIStructFormEventMap<TValues = Record<string, unknown>> {
  'ui-form-change': UIStructFormChangeEvent<TValues>
  'ui-form-submit': UIStructFormSubmitEvent<TValues>
  'ui-form-invalid': UIStructFormInvalidEvent<TValues>
  'ui-form-loading': UIStructFormLoadingEvent
  'ui-form-step-error': UIStructFormStepErrorEvent
}

// ---------------------------------------------------------------------------
// Global Aggregated Event Map (used for HTMLElementEventMap augmentation)
// ---------------------------------------------------------------------------

export interface UIGlobalEventMap {
  'ui-input': UIInputEvent | UINumberInputEvent | UISliderInputEvent
  'ui-change':
    | UIInputChangeEvent
    | UINumberInputChangeEvent
    | UISliderChangeEvent
    | UISelectChangeEvent
    | UISwitchChangeEvent
    | UISegmentedControlChangeEvent
    | UITabsChangeEvent
    | UIStepperChangeEvent
    | UIComboboxChangeEvent
  'ui-create': UIComboboxCreateEvent
  'ui-open':
    | UIDialogOpenEvent
    | UIDrawerOpenEvent
    | UIPopoverOpenEvent
    | UIMenuOpenEvent
    | UIContextMenuOpenEvent
  'ui-close':
    | UIDialogCloseEvent
    | UIDrawerCloseEvent
    | UIPopoverCloseEvent
    | UIMenuCloseEvent
    | UIContextMenuCloseEvent
  'ui-dismiss': UIAlertDismissEvent | UIToastDismissEvent | UIChipDismissEvent
  'ui-select': UIMenuSelectEvent | UIChipSelectEvent
  'ui-toggle': UIAccordionToggleEvent
  'ui-collapse-change': UICollapseChangeEvent
  'ui-sort': UITableSortEvent | UIListSortEvent
  'ui-page-change': UIPageChangeEvent
  'ui-page-size-change': UIPageSizeChangeEvent
  'ui-page-request':
    | UITablePageRequestEvent
    | UIListPageRequestEvent
    | UIComboboxPageRequestEvent
  'ui-selection-change': UITableSelectionChangeEvent | UIListSelectionChangeEvent
  'ui-row-click': UITableRowClickEvent
  'ui-item-click': UIListItemClickEvent
  'ui-columns-change': UITableColumnsChangeEvent
  'ui-form-change': UIStructFormChangeEvent
  'ui-form-submit': UIStructFormSubmitEvent
  'ui-form-invalid': UIStructFormInvalidEvent
  'ui-form-loading': UIStructFormLoadingEvent
  'ui-form-step-error': UIStructFormStepErrorEvent
}

// Re-export sort direction type convenience
export type { TableSortDirection }
