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

  it('selects option and emits ui-change and change events in single-select mode', async () => {
    const el = document.createElement('ui-combobox') as UICombobox
    el.options = [
      { value: 'aws', label: 'Amazon Web Services' },
      { value: 'gcp', label: 'Google Cloud Platform' },
      { value: 'azure', label: 'Microsoft Azure' },
    ]
    document.body.appendChild(el)
    await el.updateComplete

    const changeSpy = vi.fn()
    el.addEventListener('ui-change', changeSpy)

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

  it('debounces async search and emits ui-get-page when remote is true', async () => {
    vi.useFakeTimers()
    const el = document.createElement('ui-combobox') as UICombobox
    el.remote = true
    el.debounceMs = 150
    document.body.appendChild(el)
    await el.updateComplete

    const pageSpy = vi.fn()
    el.addEventListener('ui-get-page', pageSpy)

    const input = el.shadowRoot!.querySelector('.combobox-search-input') as HTMLInputElement
    input.value = 'prod-cluster'
    input.dispatchEvent(new Event('input'))

    expect(pageSpy).not.toHaveBeenCalled()

    vi.advanceTimersByTime(160)
    expect(pageSpy).toHaveBeenCalledTimes(1)
    expect(pageSpy.mock.calls[0][0].detail).toEqual({
      page: 1,
      pageSize: 50,
      search: 'prod-cluster',
      append: false,
    })

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
    el.addEventListener('ui-get-page', pageSpy)

    const dropdownList = el.shadowRoot!.querySelector('.combobox-dropdown-list') as HTMLElement
    // Mock scroll near bottom
    Object.defineProperty(dropdownList, 'scrollTop', { value: 500, configurable: true })
    Object.defineProperty(dropdownList, 'clientHeight', { value: 240, configurable: true })
    Object.defineProperty(dropdownList, 'scrollHeight', { value: 750, configurable: true })

    dropdownList.dispatchEvent(new Event('scroll'))
    await el.updateComplete

    expect(pageSpy).toHaveBeenCalledTimes(1)
    expect(pageSpy.mock.calls[0][0].detail).toEqual({
      page: 2,
      pageSize: 10,
      search: '',
      append: true,
    })
    expect(el.page).toBe(2)
  })
})

