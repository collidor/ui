/**
 * Web Component UI Library for Axon and Graph Nodes
 * Enforces strictly Golden Ratio relative spacing/margins and OKLCH derived colors.
 */

// Import design tokens and theme presets (loaded via HTML/bundler or CSS import)
// import './tokens.css'
// import './components.css'
// import './themes/neumorphic.css'
// import './themes/jewel-artnouveau.css'

// Import and register all custom elements
import './components/button.component.ts'
import './components/input.component.ts'
import './components/number-input.component.ts'
import './components/slider.component.ts'
import './components/switch.component.ts'
import './components/select.component.ts'
import './components/field.component.ts'
import './components/card.component.ts'
import './components/tabs.component.ts'
import './components/icon.component.ts'
import './components/tooltip.component.ts'
import './components/dialog.component.ts'
import './components/table.component.ts'
import './components/pagination.component.ts'
import './components/list.component.ts'
import './components/stat-card.component.ts'
import './components/struct-form.component.ts'
import './components/progress.component.ts'
import './components/drawer.component.ts'
import './components/segmented-control.component.ts'
import './components/alert.component.ts'
import './components/toast.component.ts'
import './components/menu.component.ts'
import './components/accordion.component.ts'
import './components/chip.component.ts'
import './components/popover.component.ts'
import './components/context-menu.component.ts'

// Export Base Classes & Types
export { UIElement } from './base.element.ts'
export {
  UIHeaderedElement,
  HEADER_SURFACES,
  type HeaderSurface,
} from './headerSurface.ts'
export * from './constants.ts'
export * from './dataCollection.utils.ts'
export { announceLive } from './announcer.ts'

// Export Custom Element Classes
export { UIButton } from './components/button.component.ts'
export { UIInput } from './components/input.component.ts'
export { UINumberInput } from './components/number-input.component.ts'
export { UISlider } from './components/slider.component.ts'
export { UISwitch } from './components/switch.component.ts'
export { UISelect } from './components/select.component.ts'
export { UIField } from './components/field.component.ts'
export { UICard } from './components/card.component.ts'
export { UITabs, UITab } from './components/tabs.component.ts'
export { UIIcon } from './components/icon.component.ts'
export { UITooltip } from './components/tooltip.component.ts'
export { UIDialog } from './components/dialog.component.ts'
export { UITable } from './components/table.component.ts'
export { UIPagination, type PaginationMode, type StepperFormat } from './components/pagination.component.ts'
export { UIList } from './components/list.component.ts'
export { UIStatCard } from './components/stat-card.component.ts'
export { UIStructForm } from './components/struct-form.component.ts'
export { UIProgress } from './components/progress.component.ts'
export { UIDrawer, type DrawerPlacement } from './components/drawer.component.ts'
export { UISegmentedControl, UISegmentItem } from './components/segmented-control.component.ts'
export { UIAlert } from './components/alert.component.ts'
export { UIToast, UIToastContainer, type ToastOptions } from './components/toast.component.ts'
export { UIMenu, UIMenuItem, UIMenuDivider } from './components/menu.component.ts'
export { UIAccordion, UIAccordionItem } from './components/accordion.component.ts'
export { UIChip, UIChipGroup } from './components/chip.component.ts'
export { UIPopover, type PopoverType, type PopoverPlacement } from './components/popover.component.ts'
export { UIContextMenu } from './components/context-menu.component.ts'

// Export OKLCH Accessibility Contrast Engine
export {
  DEFAULT_OKLCH_CONTRAST_THRESHOLD,
  DEFAULT_DARK_TEXT_LIGHTNESS,
  DEFAULT_LIGHT_TEXT_LIGHTNESS,
  DEFAULT_DARK_MUTED_LIGHTNESS,
  DEFAULT_LIGHT_MUTED_LIGHTNESS,
  inferContrastLightness,
  inferMutedLightness,
  cssContrastExpression,
  cssMutedContrastExpression,
  type OklchColor,
} from './colorContrast.ts'
