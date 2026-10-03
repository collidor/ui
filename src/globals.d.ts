import type {
  UIButton,
  UIInput,
  UINumberInput,
  UISlider,
  UISwitch,
  UISelect,
  UIField,
  UICard,
  UITabs,
  UITab,
  UIIcon,
  UITooltip,
  UIDialog,
  UITable,
  UIPagination,
  UIList,
  UIStructForm,
  UIProgress,
  UIDrawer,
  UISegmentedControl,
  UISegmentItem,
  UIAlert,
  UIToast,
  UIToastContainer,
  UIMenu,
  UIMenuItem,
  UIMenuDivider,
  UIAccordion,
  UIAccordionItem,
  UIChip,
  UIChipGroup,
  UIPopover,
  UIContextMenu,
} from './index.ts'

declare global {
  interface HTMLElementTagNameMap {
    'ui-button': UIButton
    'ui-input': UIInput
    'ui-number-input': UINumberInput
    'ui-slider': UISlider
    'ui-switch': UISwitch
    'ui-select': UISelect
    'ui-field': UIField
    'ui-card': UICard
    'ui-tabs': UITabs
    'ui-tab': UITab
    'ui-icon': UIIcon
    'ui-tooltip': UITooltip
    'ui-dialog': UIDialog
    'ui-table': UITable
    'ui-pagination': UIPagination
    'ui-list': UIList
    'ui-struct-form': UIStructForm
    'ui-progress': UIProgress
    'ui-drawer': UIDrawer
    'ui-segmented-control': UISegmentedControl
    'ui-segment-item': UISegmentItem
    'ui-alert': UIAlert
    'ui-toast': UIToast
    'ui-toast-container': UIToastContainer
    'ui-menu': UIMenu
    'ui-menu-item': UIMenuItem
    'ui-menu-divider': UIMenuDivider
    'ui-accordion': UIAccordion
    'ui-accordion-item': UIAccordionItem
    'ui-chip': UIChip
    'ui-chip-group': UIChipGroup
    'ui-popover': UIPopover
    'ui-context-menu': UIContextMenu
  }
}

export {}
