import { describe, expect, it } from 'vitest'
import '../../index.ts'
import {
  UI_EVENTS,
  UI_TAG_NAMES,
  type UITable,
  type UIList,
  type UIPagination,
  type UICombobox,
  type UIStructForm,
  type UIMenu,
  type UIDrawer,
  type UIDialog,
  type UITabs,
  type UIStepper,
  type UITableSortEvent,
  type UITableRowClickEvent,
  type UITablePageRequestEvent,
  type UITablePageSizeChangeEvent,
  type UIListItemClickEvent,
  type UIListPageRequestEvent,
  type UIComboboxChangeEvent,
  type UIComboboxPageRequestEvent,
  type UIStructFormSubmitEvent,
  type UIDrawerOpenEvent,
  type UIDialogOpenEvent,
} from '../../index.ts'
import { mount } from '../harness.ts'

interface Hero {
  id: string
  name: string
  power: number
}

describe('standardized v2 event system & typed listeners', () => {
  it('provides strongly-typed generic addEventListener and HTMLElementTagNameMap inference', () => {
    // Verify newly added HTMLElementTagNameMap entries compile without casts
    const combobox: UICombobox = document.createElement('ui-combobox')
    const stepper: UIStepper = document.createElement('ui-stepper')
    const step = document.createElement('ui-step')
    expect(combobox.tagName.toLowerCase()).toBe(UI_TAG_NAMES.COMBOBOX)
    expect(stepper.tagName.toLowerCase()).toBe(UI_TAG_NAMES.STEPPER)
    expect(step.tagName.toLowerCase()).toBe(UI_TAG_NAMES.STEP)

    const table = mount(document.createElement('ui-table') as UITable<Hero>)
    table.selectable = true
    table.columns = [
      { key: 'name', label: 'Name', sortable: true },
      { key: 'power', label: 'Power', sortable: true },
    ]
    table.data = [
      { id: '1', name: 'Achilles', power: 99 },
      { id: '2', name: 'Odysseus', power: 92 },
    ]

    const sortEvents: UITableSortEvent<Hero>[] = []
    const rowClicks: UITableRowClickEvent<Hero>[] = []
    const selectionNames: string[][] = []

    // Zero casts on listener parameters — TypeScript infers exact generic event types
    table.addEventListener(UI_EVENTS.SORT, (event) => {
      const sortBy: string = event.detail.sortBy
      const firstPower: number | undefined = event.detail.data[0]?.power
      expect(typeof sortBy).toBe('string')
      expect(typeof firstPower).toBe('number')
      sortEvents.push(event)
    })

    table.addEventListener(UI_EVENTS.ROW_CLICK, (event) => {
      const heroName: string = event.detail.row.name
      const key: string = event.detail.key
      const selected: boolean = event.detail.selected
      expect(heroName.length).toBeGreaterThan(0)
      expect(typeof key).toBe('string')
      expect(typeof selected).toBe('boolean')
      rowClicks.push(event)
    })

    table.addEventListener(UI_EVENTS.SELECTION_CHANGE, (event) => {
      selectionNames.push(event.detail.selectedRows.map((row) => row.name))
    })

    table.sort('power', 'asc')
    expect(sortEvents).toHaveLength(1)
    expect(sortEvents[0].detail.sortBy).toBe('power')
    expect(sortEvents[0].detail.sortDirection).toBe('asc')
    expect(sortEvents[0].detail.data[0].name).toBe('Odysseus')

    const firstRow = table.shadowRoot?.querySelector<HTMLTableRowElement>('tbody tr')
    firstRow?.click()

    expect(rowClicks).toHaveLength(1)
    expect(rowClicks[0].detail).toEqual({
      row: { id: '2', name: 'Odysseus', power: 92 },
      index: 0,
      key: '2',
      selected: true,
    })
    expect(selectionNames).toEqual([['Odysseus']])
  })

  it('ignores clicks on nested interactive buttons inside table cells', () => {
    const table = mount(document.createElement('ui-table') as UITable<Hero>)
    table.columns = [
      { key: 'name', label: 'Name' },
      {
        key: 'actions',
        label: 'Actions',
        formatter: () => {
          const btn = document.createElement('button')
          btn.className = 'nested-action'
          const span = document.createElement('span')
          span.textContent = 'Edit'
          btn.appendChild(span)
          return btn
        },
      },
    ]
    table.data = [{ id: '1', name: 'Hector', power: 95 }]

    const rowClicks: UITableRowClickEvent<Hero>[] = []
    table.addEventListener(UI_EVENTS.ROW_CLICK, (event) => {
      rowClicks.push(event)
    })

    const nestedSpan = table.shadowRoot?.querySelector<HTMLElement>('.nested-action span')
    nestedSpan?.click()
    expect(rowClicks).toHaveLength(0)
  })

  it('does not emit ui-page-request on client-side table and avoids duplicate pagination events on page size change', async () => {
    const table = mount(document.createElement('ui-table') as UITable<Hero>)
    table.pagination = true
    table.pageSize = 2
    table.page = 2
    table.columns = [{ key: 'name', label: 'Name', sortable: true }]
    table.data = [
      { id: '1', name: 'A', power: 1 },
      { id: '2', name: 'B', power: 2 },
      { id: '3', name: 'C', power: 3 },
      { id: '4', name: 'D', power: 4 },
      { id: '5', name: 'E', power: 5 },
    ]
    await table.updateComplete

    const pageRequests: UITablePageRequestEvent<Hero>[] = []
    const pageChanges: number[] = []
    const pageSizeChanges: UITablePageSizeChangeEvent[] = []

    table.addEventListener(UI_EVENTS.PAGE_REQUEST, (e) => pageRequests.push(e))
    table.addEventListener(UI_EVENTS.PAGE_CHANGE, (e) => pageChanges.push(e.detail.page))
    table.addEventListener(UI_EVENTS.PAGE_SIZE_CHANGE, (e) => pageSizeChanges.push(e))

    // Client-side sort & page changes never emit ui-page-request
    table.sort('name', 'desc')
    table.setPage(2)
    expect(pageRequests).toHaveLength(0)
    expect(pageChanges).toEqual([2])

    // Changing page size through embedded <ui-pagination> emits ui-page-size-change once,
    // resets page to 1, and does not trigger a second ui-page-change that clobbers page!
    const pager = table.shadowRoot?.querySelector<UIPagination>('ui-pagination')!
    pager.setPageSize(5)
    await table.updateComplete

    expect(table.pageSize).toBe(5)
    expect(table.page).toBe(1)
    expect(pageSizeChanges).toHaveLength(1)
    expect(pageSizeChanges[0].detail).toEqual({
      page: 1,
      pageSize: 5,
      totalPages: 1,
      total: 5,
    })
    expect(pageChanges).toEqual([2])
    expect(pageRequests).toHaveLength(0)
  })

  it('unifies ui-page-request for remote table pagination, sorting, and infinite scroll append', async () => {
    const table = mount(document.createElement('ui-table') as UITable<Hero>)
    table.remote = true
    table.pagination = true
    table.page = 1
    table.pageSize = 2
    table.total = 4
    table.columns = [{ key: 'name', label: 'Name', sortable: true }]
    table.data = [
      { id: '1', name: 'Alpha', power: 10 },
      { id: '2', name: 'Beta', power: 20 },
    ]
    await table.updateComplete

    const requests: UITablePageRequestEvent<Hero>[] = []
    table.addEventListener(UI_EVENTS.PAGE_REQUEST, (event) => {
      requests.push(event)
      if (event.detail.reason === 'scroll') {
        event.detail.resolve({
          data: [{ id: '3', name: 'Gamma', power: 30 }],
          total: 4,
        })
      }
    })

    // Trigger page size change on remote table -> single ui-page-request with reason 'page-size'
    table.setPageSize(3)
    expect(requests).toHaveLength(1)
    expect(requests[0].detail.reason).toBe('page-size')
    expect(requests[0].detail.append).toBe(false)
    expect(requests[0].detail.page).toBe(1)
    expect(requests[0].detail.pageSize).toBe(3)

    // Trigger infinite scroll -> unified payload + resolve() appends rows
    const scroller = table.shadowRoot?.querySelector<HTMLElement>('.table-scroll-container')!
    Object.defineProperty(scroller, 'scrollTop', { value: 950, configurable: true })
    Object.defineProperty(scroller, 'clientHeight', { value: 100, configurable: true })
    Object.defineProperty(scroller, 'scrollHeight', { value: 1000, configurable: true })
    scroller.dispatchEvent(new Event('scroll'))

    expect(requests).toHaveLength(2)
    expect(requests[1].detail.reason).toBe('scroll')
    expect(requests[1].detail.append).toBe(true)
    expect(requests[1].detail.page).toBe(2)
    expect(table.data.map((r) => r.name)).toEqual(['Alpha', 'Beta', 'Gamma'])
  })

  it('unifies UIList remote sort, page-size-change, item-click key, and scroll resolve append', async () => {
    const list = mount(document.createElement('ui-list') as UIList<Hero>)
    list.remote = true
    list.selectable = true
    list.page = 1
    list.pageSize = 2
    list.total = 4
    list.data = [
      { id: 'h1', name: 'Ajax', power: 88 },
      { id: 'h2', name: 'Diomedes', power: 91 },
    ]
    await list.updateComplete

    const sorts: string[] = []
    const pageSizeChanges: number[] = []
    const requests: UIListPageRequestEvent<Hero>[] = []
    const itemClicks: UIListItemClickEvent<Hero>[] = []

    list.addEventListener(UI_EVENTS.SORT, (e) => sorts.push(`${e.detail.sortBy}:${e.detail.sortDirection}`))
    list.addEventListener(UI_EVENTS.PAGE_SIZE_CHANGE, (e) => pageSizeChanges.push(e.detail.pageSize))
    list.addEventListener(UI_EVENTS.PAGE_REQUEST, (e) => {
      requests.push(e)
      if (e.detail.append) {
        e.detail.resolve({
          data: [{ id: 'h3', name: 'Patroclus', power: 85 }],
          total: 4,
        })
      }
    })
    list.addEventListener(UI_EVENTS.ITEM_CLICK, (e) => itemClicks.push(e))

    // Remote sort emits ui-sort AND ui-page-request (reason: 'sort')
    list.sort('power', 'desc')
    expect(sorts).toEqual(['power:desc'])
    expect(requests).toHaveLength(1)
    expect(requests[0].detail.reason).toBe('sort')

    // Page size change emits ui-page-size-change AND ui-page-request (reason: 'page-size')
    list.setPageSize(5)
    expect(pageSizeChanges).toEqual([5])
    expect(requests).toHaveLength(2)
    expect(requests[1].detail.reason).toBe('page-size')

    // Scroll resolve appends items
    const scroller = list.shadowRoot?.querySelector<HTMLElement>('.list-content')!
    Object.defineProperty(scroller, 'scrollTop', { value: 950, configurable: true })
    Object.defineProperty(scroller, 'clientHeight', { value: 100, configurable: true })
    Object.defineProperty(scroller, 'scrollHeight', { value: 1000, configurable: true })
    scroller.dispatchEvent(new Event('scroll'))

    expect(requests).toHaveLength(3)
    expect(requests[2].detail.reason).toBe('scroll')
    expect(requests[2].detail.append).toBe(true)
    expect(list.data.map((h) => h.id)).toEqual(['h1', 'h2', 'h3'])

    // Item click includes key and selected
    const firstItem = list.shadowRoot?.querySelector<HTMLElement>('.list-item')
    firstItem?.click()
    expect(itemClicks).toHaveLength(1)
    expect(itemClicks[0].detail).toEqual({
      item: { id: 'h1', name: 'Ajax', power: 88 },
      index: 0,
      key: 'h1',
      selected: true,
    })
  })

  it('supports resolve() on UICombobox ui-page-request for both search and scroll', async () => {
    const combobox = mount(document.createElement('ui-combobox'))
    combobox.remote = true
    combobox.total = 4
    combobox.page = 1
    combobox.pageSize = 2
    combobox.options = [
      { value: 'a', label: 'Alpha' },
      { value: 'b', label: 'Beta' },
    ]
    combobox.open = true
    await combobox.updateComplete

    const events: UIComboboxPageRequestEvent[] = []
    combobox.addEventListener(UI_EVENTS.PAGE_REQUEST, (event) => {
      events.push(event)
      event.detail.resolve({
        options: [{ value: 'c', label: 'Gamma' }],
        total: 3,
      })
    })

    const dropdown = combobox.shadowRoot?.querySelector<HTMLElement>('.combobox-dropdown-list')!
    Object.defineProperty(dropdown, 'scrollTop', { value: 500, configurable: true })
    Object.defineProperty(dropdown, 'clientHeight', { value: 240, configurable: true })
    Object.defineProperty(dropdown, 'scrollHeight', { value: 750, configurable: true })
    dropdown.dispatchEvent(new Event('scroll'))
    await combobox.updateComplete

    expect(events).toHaveLength(1)
    expect(events[0].detail.reason).toBe('scroll')
    expect(events[0].detail.append).toBe(true)
    expect(combobox.options.map((o) => o.value)).toEqual(['a', 'b', 'c'])
    expect(combobox.total).toBe(3)
  })

  it('standardizes overlay ui-open/ui-close events and prevents internal tab/step event leakage', async () => {
    // UIDrawer emits ui-open with placement & ui-close via both methods and open property
    const drawer = mount(document.createElement('ui-drawer') as UIDrawer)
    drawer.placement = 'left'
    const drawerOpens: UIDrawerOpenEvent[] = []
    let drawerCloses = 0
    drawer.addEventListener(UI_EVENTS.OPEN, (e) => drawerOpens.push(e))
    drawer.addEventListener(UI_EVENTS.CLOSE, () => {
      drawerCloses++
    })

    drawer.show()
    drawer.close()
    drawer.open = true
    drawer.open = false
    expect(drawerOpens.map((e) => e.detail.placement)).toEqual(['left', 'left'])
    expect(drawerCloses).toBe(2)

    // UIDialog emits ui-open with presentation
    const dialog = mount(document.createElement('ui-dialog') as UIDialog)
    const inner = dialog.shadowRoot?.querySelector('dialog')
    if (inner && typeof inner.showModal !== 'function') {
      inner.showModal = () => {
        inner.open = true
      }
      inner.show = () => {
        inner.open = true
      }
      inner.close = () => {
        inner.open = false
      }
    }
    const dialogOpens: UIDialogOpenEvent[] = []
    dialog.addEventListener(UI_EVENTS.OPEN, (e) => dialogOpens.push(e))
    dialog.show()
    dialog.close()
    dialog.showModal()
    expect(dialogOpens.map((e) => e.detail.presentation)).toEqual(['modeless', 'modal'])

    // UIMenu dropdown emits ui-open and ui-close
    const menu = mount(document.createElement('ui-menu') as UIMenu)
    menu.dropdown = true
    let menuOpens = 0
    let menuCloses = 0
    menu.addEventListener(UI_EVENTS.OPEN, () => {
      menuOpens++
    })
    menu.addEventListener(UI_EVENTS.CLOSE, () => {
      menuCloses++
    })
    menu.show()
    menu.close()
    expect(menuOpens).toBe(1)
    expect(menuCloses).toBe(1)

    // UITabs and UIStepper do not leak internal selection events outside
    const wrapper = mount(document.createElement('div'))
    const tabs = document.createElement('ui-tabs') as UITabs
    const tab1 = document.createElement('ui-tab')
    tab1.value = 'one'
    tabs.appendChild(tab1)
    wrapper.appendChild(tabs)

    const stepper = document.createElement('ui-stepper') as UIStepper
    const step1 = document.createElement('ui-step')
    step1.step = 1
    stepper.appendChild(step1)
    wrapper.appendChild(stepper)

    const leaked: string[] = []
    for (const evtName of ['tab-selected', 'step-selected', 'ui-internal-tab-select', 'ui-internal-step-select']) {
      wrapper.addEventListener(evtName, () => leaked.push(evtName))
    }

    tab1.click()
    step1.click()
    expect(leaked).toEqual([])
  })

  it('infers generic option and form value types for UICombobox<O> and UIStructForm<TValues>', async () => {
    interface CloudRegion {
      value: 'us-east' | 'eu-west'
      label: string
      latencyMs: number
    }

    const combobox = mount(document.createElement('ui-combobox') as UICombobox<CloudRegion>)
    combobox.options = [
      { value: 'us-east', label: 'US East', latencyMs: 18 },
      { value: 'eu-west', label: 'EU West', latencyMs: 62 },
    ]
    combobox.open = true
    await combobox.updateComplete

    const changeEvents: UIComboboxChangeEvent<CloudRegion>[] = []
    combobox.addEventListener(UI_EVENTS.CHANGE, (event) => {
      const latency: number | undefined = event.detail.selectedOptions[0]?.latencyMs
      expect(typeof latency).toBe('number')
      changeEvents.push(event)
    })

    const optEl = combobox.shadowRoot?.querySelectorAll<HTMLElement>('.combobox-option')[1]
    optEl?.click()
    await combobox.updateComplete

    expect(changeEvents).toHaveLength(1)
    expect(changeEvents[0].detail.selectedOptions[0].latencyMs).toBe(62)

    interface ProfileForm {
      username: string
      age: number
    }

    const form = mount(document.createElement('ui-struct-form') as UIStructForm<ProfileForm>)
    form.fields = [
      { key: 'username', label: 'Username', widget: 'text' },
      { key: 'age', label: 'Age', widget: 'number' },
    ]
    form.values = { username: 'ada', age: 36 }

    const submits: UIStructFormSubmitEvent<ProfileForm>[] = []
    form.addEventListener(UI_EVENTS.FORM_CHANGE, (event) => {
      const username: string = event.detail.values.username
      expect(typeof username).toBe('string')
    })
    form.addEventListener(UI_EVENTS.FORM_SUBMIT, (event) => {
      const age: number = event.detail.values.age
      expect(typeof age).toBe('number')
      submits.push(event)
    })

    form.setFieldValue('username', 'grace')
    form.submit()

    expect(submits).toHaveLength(1)
    expect(submits[0].detail.values).toEqual({ username: 'grace', age: 36 })
  })
})
