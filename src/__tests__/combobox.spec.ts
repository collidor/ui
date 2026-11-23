import { describe, expect, it, vi, beforeEach } from 'vitest'
import '../index.ts'
import { UICombobox, UI_TAG_NAMES } from '../index.ts'

describe('UICombobox Component (Ticket 009)', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('is registered in customElements and UI_TAG_NAMES', () => {
    expect(customElements.get(UI_TAG_NAMES.COMBOBOX)).toBe(UICombobox)
    const el = document.createElement('ui-combobox')
    expect(el).toBeInstanceOf(UICombobox)
  })

  it('selects option and emits ui-change (without duplicate change) in single-select mode', async () => {
    const el = document.createElement('ui-combobox') as UICombobox
    el.options = [
      { value: 'aws', label: 'Amazon Web Services' },
      { value: 'gcp', label: 'Google Cloud Platform' },
      { value: 'azure', label: 'Microsoft Azure' },
    ]
    document.body.appendChild(el)
    await el.updateComplete

    const changeSpy = vi.fn()
    const legacyChangeSpy = vi.fn()
    el.addEventListener('ui-change', changeSpy)
    el.addEventListener('change', legacyChangeSpy)

    // Open dropdown
    el.open = true
    await el.updateComplete

    const options = el.shadowRoot!.querySelectorAll('.combobox-option')
    expect(options.length).toBe(3)

    // Click second option
    ;(options[1] as HTMLElement).click()
    await el.updateComplete

    expect(el.value).toBe('gcp')
    expect(el.open).toBe(false)
    expect(changeSpy).toHaveBeenCalledTimes(1)
    expect(legacyChangeSpy).not.toHaveBeenCalled()
    expect(changeSpy.mock.calls[0][0].detail.value).toBe('gcp')
    expect(changeSpy.mock.calls[0][0].detail.selectedOptions[0].label).toBe(
      'Google Cloud Platform',
    )
  })

  it('handles multi-select with tag chips and deletion', async () => {
    const el = document.createElement('ui-combobox') as UICombobox
    el.multiple = true
    el.options = [
      { value: 'k8s', label: 'Kubernetes' },
      { value: 'docker', label: 'Docker' },
      { value: 'podman', label: 'Podman' },
    ]
    document.body.appendChild(el)
    await el.updateComplete

    el.open = true
    await el.updateComplete

    const options = el.shadowRoot!.querySelectorAll('.combobox-option')
    ;(options[0] as HTMLElement).click()
    await el.updateComplete
    ;(options[1] as HTMLElement).click()
    await el.updateComplete

    expect(el.value).toEqual(['k8s', 'docker'])

    const tags = el.shadowRoot!.querySelectorAll('.chip-tag')
    expect(tags.length).toBe(2)

    // Click delete on first tag
    const delBtn = tags[0].querySelector('.chip-del-btn') as HTMLElement
    delBtn.click()
    await el.updateComplete

    expect(el.value).toEqual(['docker'])
  })

  it('retains labels via Option Hydration Cache across remote option updates', async () => {
    const el = document.createElement('ui-combobox') as UICombobox
    el.options = [
      { value: 'usr_1', label: 'Alice Vance' },
      { value: 'usr_2', label: 'Bob Martin' },
    ]
    el.value = 'usr_1'
    document.body.appendChild(el)
    await el.updateComplete

    // Now options are replaced by a search result not containing usr_1
    el.options = [{ value: 'usr_3', label: 'Charlie Brown' }]
    await el.updateComplete

    const input = el.shadowRoot!.querySelector('.combobox-search-input') as HTMLInputElement
    expect(input.placeholder).toBe('Alice Vance')
  })

  it('debounces async search and emits ui-page-request when remote is true', async () => {
    vi.useFakeTimers()
    const el = document.createElement('ui-combobox') as UICombobox
    el.remote = true
    el.debounceMs = 150
    document.body.appendChild(el)
    await el.updateComplete

    const pageSpy = vi.fn()
    el.addEventListener('ui-page-request', pageSpy)

    const input = el.shadowRoot!.querySelector('.combobox-search-input') as HTMLInputElement
    input.value = 'prod-cluster'
    input.dispatchEvent(new Event('input'))

    expect(pageSpy).not.toHaveBeenCalled()

    vi.advanceTimersByTime(160)
    expect(pageSpy).toHaveBeenCalledTimes(1)
    expect(pageSpy.mock.calls[0][0].detail).toEqual(
      expect.objectContaining({
        page: 1,
        pageSize: 50,
        search: 'prod-cluster',
        reason: 'search',
        append: false,
        resolve: expect.any(Function),
      }),
    )

    vi.useRealTimers()
  })

  it('renders a windowed virtual slice for 1,000 items when virtual is enabled', async () => {
    const el = document.createElement('ui-combobox') as UICombobox
    const bigData = Array.from({ length: 1000 }, (_, i) => ({
      value: `item_${i}`,
      label: `Option Row #${i}`,
    }))
    el.options = bigData
    el.virtual = { enabled: true, itemHeight: 36, overscan: 3 }
    document.body.appendChild(el)
    await el.updateComplete

    el.open = true
    await el.updateComplete

    const renderedOptions = el.shadowRoot!.querySelectorAll('.combobox-option')
    // Should NOT render 1000 DOM nodes! Only visible + overscan (~15-20 nodes)
    expect(renderedOptions.length).toBeLessThan(30)
    expect(renderedOptions.length).toBeGreaterThan(0)

    const sizer = el.shadowRoot!.querySelector('.virtual-sizer') as HTMLElement
    expect(sizer).toBeDefined()
    expect(sizer.style.height).toBe('36000px') // 1000 * 36px
  })

  it('supports creatable options when search query does not match existing options', async () => {
    const el = document.createElement('ui-combobox') as UICombobox
    el.creatable = true
    el.options = [
      { value: 'apple', label: 'Apple' },
      { value: 'banana', label: 'Banana' },
    ]
    document.body.appendChild(el)
    await el.updateComplete

    const createSpy = vi.fn()
    const changeSpy = vi.fn()
    el.addEventListener('ui-create', createSpy)
    el.addEventListener('ui-change', changeSpy)

    el.open = true
    await el.updateComplete

    const input = el.shadowRoot!.querySelector('.combobox-search-input') as HTMLInputElement
    input.value = 'Cherry'
    input.dispatchEvent(new Event('input'))
    await el.updateComplete

    const createBtn = el.shadowRoot!.querySelector('.combobox-create-option') as HTMLElement
    expect(createBtn).not.toBeNull()
    expect(createBtn.textContent).toContain('Create "Cherry"')

    createBtn.click()
    await el.updateComplete

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { value: 'Cherry', label: 'Cherry' },
      }),
    )
    expect(el.value).toBe('Cherry')
    expect(changeSpy).toHaveBeenCalled()
  })

  it('increments page and passes append: true on dropdown infinite scroll', async () => {
    const el = document.createElement('ui-combobox') as UICombobox
    el.remote = true
    el.total = 100
    el.page = 1
    el.pageSize = 10
    el.options = Array.from({ length: 10 }, (_, i) => ({
      value: `id_${i}`,
      label: `Option ${i}`,
    }))
    document.body.appendChild(el)
    await el.updateComplete

    el.open = true
    await el.updateComplete

    const pageSpy = vi.fn()
    el.addEventListener('ui-page-request', pageSpy)

    const dropdownList = el.shadowRoot!.querySelector('.combobox-dropdown-list') as HTMLElement
    // Mock scroll near bottom
    Object.defineProperty(dropdownList, 'scrollTop', { value: 500, configurable: true })
    Object.defineProperty(dropdownList, 'clientHeight', { value: 240, configurable: true })
    Object.defineProperty(dropdownList, 'scrollHeight', { value: 750, configurable: true })

    dropdownList.dispatchEvent(new Event('scroll'))
    await el.updateComplete

    expect(pageSpy).toHaveBeenCalledTimes(1)
    expect(pageSpy.mock.calls[0][0].detail).toEqual(
      expect.objectContaining({
        page: 2,
        pageSize: 10,
        search: '',
        reason: 'scroll',
        append: true,
        resolve: expect.any(Function),
      }),
    )
    expect(el.page).toBe(2)
  })

  it('opens and navigates enabled options with ArrowDown/ArrowUp, closes on Tab/Escape, and hides decorative arrow', async () => {
    const el = document.createElement('ui-combobox') as UICombobox
    el.label = 'Cloud provider'
    el.options = [
      { value: 'aws', label: 'AWS' },
      { value: 'disabled-opt', label: 'Disabled', disabled: true },
      { value: 'gcp', label: 'GCP' },
    ]
    document.body.appendChild(el)
    await el.updateComplete

    const input = el.shadowRoot!.querySelector<HTMLInputElement>('.combobox-search-input')!
    const arrow = el.shadowRoot!.querySelector('.arrow-icon')!

    expect(arrow.getAttribute('aria-hidden')).toBe('true')
    expect(input.getAttribute('aria-label')).toBe('Cloud provider')

    // focus() delegates to the search input
    el.focus()
    expect(el.shadowRoot!.activeElement).toBe(input)

    // ArrowDown opens and highlights first enabled option (index 0)
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }))
    await el.updateComplete
    expect(el.open).toBe(true)
    let options = el.shadowRoot!.querySelectorAll('.combobox-option')
    expect(options[0].classList.contains('focused')).toBe(true)

    // ArrowDown skips disabled index 1 and focuses index 2
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }))
    await el.updateComplete
    options = el.shadowRoot!.querySelectorAll('.combobox-option')
    expect(options[2].classList.contains('focused')).toBe(true)

    // Tab closes dropdown without blocking Tab navigation
    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    expect(input.dispatchEvent(tabEvent)).toBe(true)
    await el.updateComplete
    expect(el.open).toBe(false)

    // ArrowUp when closed opens dropdown and highlights last enabled option (index 2)
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true }))
    await el.updateComplete
    expect(el.open).toBe(true)
    options = el.shadowRoot!.querySelectorAll('.combobox-option')
    expect(options[2].classList.contains('focused')).toBe(true)

    // Escape closes dropdown and prevents bubbling default
    const escEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
    expect(input.dispatchEvent(escEvent)).toBe(false)
    await el.updateComplete
    expect(el.open).toBe(false)
  })
})

