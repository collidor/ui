import { describe, it, expect } from 'vitest'
import { mount, record } from '../harness.ts'
import '../../components/struct-form.component.ts'
import type { UIStructForm, StructFormChangeEventDetail } from '../../components/struct-form.component.ts'

describe('UIStructForm with UITable & Subform Dialog', () => {
  it('renders <ui-table> with columns, rows and aggregations', async () => {
    const form = mount(document.createElement('ui-struct-form') as UIStructForm)
    
    // Mock FormStructSchema with toFormTree
    const mockSchema = {
      descriptor: { kind: 'struct', fields: {} },
      toFormTree(values: Record<string, unknown>) {
        return {
          nodes: [
            {
              kind: 'layout',
              key: 'row1',
              path: 'row1',
              layoutKind: 'row',
              children: [
                {
                  kind: 'field',
                  key: 'orderNumber',
                  path: 'orderNumber',
                  label: 'Order Reference',
                  widget: 'text',
                  widgetProps: {},
                  required: true,
                },
              ],
            },
            {
              kind: 'field',
              key: 'items',
              path: 'items',
              label: 'Purchased Items',
              widget: 'table',
              widgetProps: {
                columns: [
                  { key: 'description', label: 'Item Name', width: '50%' },
                  { key: 'quantity', label: 'Qty', width: '20%', type: 'number' },
                  { key: 'unitPrice', label: 'Price', width: '30%', type: 'number' },
                ],
                aggregations: [
                  { column: 'unitPrice', op: 'sum', label: 'Subtotal' },
                ],
              },
              descriptor: {
                kind: 'array',
                items: {
                  kind: 'struct',
                  fields: {
                    description: { kind: 'string', title: 'Item Name' },
                    quantity: { kind: 'number', title: 'Qty' },
                    unitPrice: { kind: 'number', title: 'Price' },
                  },
                },
              },
              required: true,
            },
          ],
          fieldsByKey: {},
        }
      },
    }

    form.values = {
      orderNumber: 'ORD-123',
      items: [
        { description: 'Keyboard', quantity: 1, unitPrice: 100 },
        { description: 'Mouse', quantity: 2, unitPrice: 50 },
      ],
    }
    form.schema = mockSchema
    await form.updateComplete

    const root = form.shadowRoot!
    const formRow = root.querySelector('.form-row')
    expect(formRow).toBeTruthy()

    // Verifies <ui-table> is used directly without duplication
    const uiTable = root.querySelector('ui-table')
    expect(uiTable).toBeTruthy()
    expect((uiTable as any).data.length).toBe(2)

    const subtotalBadge = root.querySelector('.aggregation-badge')
    expect(subtotalBadge?.textContent).toContain('Subtotal')
    expect(subtotalBadge?.textContent).toContain('150')
  })

  it('opens subform dialog on Add Item and appends new entry upon submission', async () => {
    const form = mount(document.createElement('ui-struct-form') as UIStructForm)
    const changes = record<StructFormChangeEventDetail>(form, 'ui-form-change')

    const mockSchema = {
      descriptor: { kind: 'struct', fields: {} },
      toFormTree() {
        return {
          nodes: [
            {
              kind: 'field',
              key: 'items',
              label: 'Items',
              widget: 'table',
              widgetProps: {
                columns: [
                  { key: 'name', label: 'Name' },
                  { key: 'price', label: 'Price', type: 'number' },
                ],
              },
              descriptor: {
                kind: 'array',
                items: {
                  kind: 'struct',
                  fields: {
                    name: { kind: 'string', title: 'Name' },
                    price: { kind: 'number', title: 'Price' },
                  },
                },
              },
            },
          ],
          fieldsByKey: {},
        }
      },
    }

    form.values = { items: [{ name: 'Item 1', price: 10 }] }
    form.schema = mockSchema
    await form.updateComplete

    const addBtn = form.shadowRoot!.querySelector('.btn-table-add') as HTMLElement
    expect(addBtn).toBeTruthy()
    addBtn.click()
    await form.updateComplete

    const dialog = form.shadowRoot!.querySelector('ui-dialog')
    expect(dialog).toBeTruthy()
    expect((dialog as any).open).toBe(true)

    // The subform inside dialog
    const subform = form.shadowRoot!.querySelector('.subform-instance') as UIStructForm
    expect(subform).toBeTruthy()

    // Submit subform with new item
    subform.setFieldValue('name', 'Item 2')
    subform.setFieldValue('price', 25)
    subform.submit()
    await form.updateComplete

    // Form value updated
    expect((form.values.items as any[]).length).toBe(2)
    expect((form.values.items as any[])[1].name).toBe('Item 2')
    expect(changes.length).toBeGreaterThan(0)
  })

  it('removes table rows via action trigger', async () => {
    const form = mount(document.createElement('ui-struct-form') as UIStructForm)

    const mockSchema = {
      descriptor: { kind: 'struct', fields: {} },
      toFormTree() {
        return {
          nodes: [
            {
              kind: 'field',
              key: 'items',
              label: 'Items',
              widget: 'table',
              widgetProps: {
                columns: [{ key: 'name', label: 'Name' }],
              },
            },
          ],
          fieldsByKey: {},
        }
      },
    }

    form.values = { items: [{ name: 'Item 1' }, { name: 'Item 2' }] }
    form.schema = mockSchema
    await form.updateComplete

    const uiTable = form.shadowRoot!.querySelector('ui-table') as any
    expect(uiTable).toBeTruthy()
    
    // Test the action formatter remove trigger directly
    const actionCol = uiTable.columns.find((c: any) => c.key === '__actions')
    expect(actionCol).toBeTruthy()

    const actionContainer = actionCol.formatter(null, { name: 'Item 1' }, 0) as HTMLElement
    const delBtn = actionContainer.querySelector('.btn-action-del') as HTMLButtonElement
    expect(delBtn).toBeTruthy()

    delBtn.click()
    await form.updateComplete

    expect((form.values.items as any).length).toBe(1)
    expect((form.values.items as any)[0].name).toBe('Item 2')
  })

  it('renders tags widget and allows adding/removing chips', async () => {
    const form = mount(document.createElement('ui-struct-form') as UIStructForm)

    const mockSchema = {
      descriptor: { kind: 'struct', fields: {} },
      toFormTree() {
        return {
          nodes: [
            {
              kind: 'field',
              key: 'tags',
              label: 'Tags',
              widget: 'tags',
              widgetProps: {},
            },
          ],
          fieldsByKey: {},
        }
      },
    }

    form.values = { tags: ['dev', 'design'] }
    form.schema = mockSchema
    await form.updateComplete

    const chips = form.shadowRoot!.querySelectorAll('.tag-chip')
    expect(chips.length).toBe(2)

    const tagInput = form.shadowRoot!.querySelector('.tag-input') as HTMLInputElement
    tagInput.value = 'testing'
    tagInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await form.updateComplete

    expect((form.values.tags as string[]).includes('testing')).toBe(true)

    const delBtn = form.shadowRoot!.querySelector('.tag-del-btn') as HTMLButtonElement
    delBtn.click()
    await form.updateComplete

    expect((form.values.tags as string[]).length).toBe(2)
  })

  it('renders multi-step wizard with stepper progress and step navigation', async () => {
    const form = mount(document.createElement('ui-struct-form') as UIStructForm)

    const mockSchema = {
      descriptor: { kind: 'struct', fields: {} },
      toFormTree() {
        return {
          nodes: [
            {
              kind: 'layout',
              key: 'wizardRoot',
              path: 'wizardRoot',
              layoutKind: 'steps',
              children: [
                {
                  kind: 'layout',
                  key: 'step1',
                  path: 'step1',
                  layoutKind: 'section',
                  options: { title: '1. Identity' },
                  children: [
                    {
                      kind: 'field',
                      key: 'username',
                      label: 'Username',
                      widget: 'text',
                      widgetProps: {},
                    },
                  ],
                },
                {
                  kind: 'layout',
                  key: 'step2',
                  path: 'step2',
                  layoutKind: 'section',
                  options: { title: '2. Review' },
                  children: [
                    {
                      kind: 'field',
                      key: 'confirm',
                      label: 'Confirm',
                      widget: 'switch',
                      widgetProps: {},
                    },
                  ],
                },
              ],
            },
          ],
          fieldsByKey: {},
        }
      },
    }

    form.values = { username: 'alice', confirm: true }
    form.schema = mockSchema
    await form.updateComplete

    const stepper = form.shadowRoot!.querySelector('ui-stepper')
    expect(stepper).toBeTruthy()

    const stepItems = form.shadowRoot!.querySelectorAll('ui-step')
    expect(stepItems.length).toBe(2)
    expect(stepItems[0].hasAttribute('active')).toBe(true)

    // Current step has username field
    expect(form.shadowRoot!.querySelector('ui-input[data-key="username"]')).toBeTruthy()
    expect(form.shadowRoot!.querySelector('ui-switch[data-key="confirm"]')).toBeNull()

    // Click Next Step
    const nextBtn = form.shadowRoot!.querySelector('.btn-step-next') as HTMLElement
    expect(nextBtn).toBeTruthy()
    nextBtn.click()
    await form.updateComplete

    // Step 2 is now active
    expect(form.shadowRoot!.querySelectorAll('ui-step')[1].hasAttribute('active')).toBe(true)
    expect(form.shadowRoot!.querySelector('ui-switch[data-key="confirm"]')).toBeTruthy()
  })

  it('validates current step and blocks moving to next step when invalid', async () => {
    const form = mount(document.createElement('ui-struct-form') as UIStructForm)

    const mockSchema = {
      validate(values: any) {
        const issues: any[] = []
        if (!values.username || values.username.length < 3) {
          issues.push({ path: ['username'], message: 'Username must be at least 3 characters' })
        }
        return { issues: issues.length ? issues : undefined, value: values }
      },
      toFormTree() {
        return {
          nodes: [
            {
              kind: 'layout',
              layoutKind: 'steps',
              key: 'wizard',
              options: { validateOnNext: true },
              children: [
                {
                  kind: 'layout',
                  layoutKind: 'section',
                  key: 'step1',
                  options: { title: '1. Account' },
                  children: [
                    {
                      kind: 'field',
                      key: 'username',
                      label: 'Username',
                      widget: 'text',
                      widgetProps: {},
                    },
                  ],
                },
                {
                  kind: 'layout',
                  layoutKind: 'section',
                  key: 'step2',
                  options: { title: '2. Profile' },
                  children: [
                    {
                      kind: 'field',
                      key: 'bio',
                      label: 'Bio',
                      widget: 'text',
                      widgetProps: {},
                    },
                  ],
                },
              ],
            },
          ],
          fieldsByKey: {},
        }
      },
    }

    form.values = { username: 'a' } // Invalid: < 3 chars
    form.schema = mockSchema
    await form.updateComplete

    // Try to click Next Step
    const nextBtn = form.shadowRoot!.querySelector('.btn-step-next') as HTMLElement
    expect(nextBtn).toBeTruthy()
    nextBtn.click()
    await form.updateComplete

    // Navigation is blocked: still on step 0
    const steps = form.shadowRoot!.querySelectorAll('ui-step')
    expect(steps[0].hasAttribute('active')).toBe(true)
    expect(steps[1].hasAttribute('active')).toBe(false)

    // Error alert is displayed
    const stepAlert = form.shadowRoot!.querySelector('.step-alert')
    expect(stepAlert).toBeTruthy()
    expect(form.errors['username']).toBe('Username must be at least 3 characters')

    // Field error is displayed on ui-field
    const uiField = form.shadowRoot!.querySelector('ui-field')
    expect(uiField?.getAttribute('error')).toBe('Username must be at least 3 characters')

    // Fix the value
    form.setFieldValue('username', 'valid_username')
    await form.updateComplete

    // Now click Next Step
    nextBtn.click()
    await form.updateComplete

    // Step 2 is now active!
    expect(form.shadowRoot!.querySelectorAll('ui-step')[1].hasAttribute('active')).toBe(true)
    expect(form.shadowRoot!.querySelector('.step-alert')).toBeNull()
  })

  it('renders select widget with options populated from descriptor and widgetProps', async () => {
    const form = mount(document.createElement('ui-struct-form') as UIStructForm)

    const mockSchema = {
      toFormTree() {
        return {
          nodes: [
            {
              kind: 'field',
              key: 'industry',
              path: 'industry',
              label: 'Industry Sector',
              widget: 'select',
              widgetProps: {
                options: [
                  { value: 'technology', label: 'Technology' },
                  { value: 'finance', label: 'Finance' },
                  { value: 'healthcare', label: 'Healthcare' },
                ],
              },
              descriptor: {
                kind: 'enum',
                values: ['technology', 'finance', 'healthcare'],
              },
            },
          ],
          fieldsByKey: {},
        }
      },
    }

    form.values = { industry: 'finance' }
    form.schema = mockSchema
    await form.updateComplete

    const selectEl = form.shadowRoot!.querySelector('ui-select[data-key="industry"]') as any
    expect(selectEl).toBeTruthy()
    expect(selectEl.value).toBe('finance')

    // Verify options are passed and rendered inside ui-select
    await selectEl.updateComplete
    const innerOptions = selectEl.shadowRoot!.querySelectorAll('option')
    expect(innerOptions.length).toBe(3)
    expect(innerOptions[0].value).toBe('technology')
    expect(innerOptions[1].value).toBe('finance')
    expect(innerOptions[2].value).toBe('healthcare')

    // Inner select has value 'finance'
    const innerSelect = selectEl.shadowRoot!.querySelector('select')
    expect(innerSelect?.value).toBe('finance')
  })
})

describe('UIStructForm DataSource Engine & Virtualization', () => {
  it('fetches options via HTTP data source with fetchInterceptor and renders in <ui-combobox>', async () => {
    const form = mount(document.createElement('ui-struct-form') as UIStructForm)
    const interceptedCalls: Array<{ url: string; init: RequestInit }> = []

    form.fetchInterceptor = async (url: string, init: RequestInit) => {
      interceptedCalls.push({ url, init })
      return {
        ok: true,
        status: 200,
        json: async () => ({
          items: [
            { id: 'c-alpha', name: 'Cluster Alpha', region: 'us-east' },
            { id: 'c-beta', name: 'Cluster Beta', region: 'us-east' },
          ],
          total: 2,
        }),
      } as unknown as Response
    }

    form.values = { region: 'us-east' }
    form.fields = [
      {
        key: 'region',
        label: 'Region',
        widget: 'text',
      },
      {
        key: 'cluster',
        label: 'Kubernetes Cluster',
        widget: 'combobox',
        virtual: { enabled: true, itemHeight: 36 },
        dataSource: {
          type: 'http',
          url: '/api/v1/clusters',
          query: { region: '$values.region', page: '$page' },
          valueKey: 'id',
          labelKey: 'name',
          dependsOn: ['region'],
        },
      },
    ]

    await form.updateComplete
    // Wait for async fetch to resolve and trigger update
    await new Promise((r) => setTimeout(r, 50))
    await form.updateComplete

    expect(interceptedCalls.length).toBe(1)
    expect(interceptedCalls[0].url).toContain('/api/v1/clusters?region=us-east&page=1')

    const combobox = form.shadowRoot!.querySelector('ui-combobox[data-key="cluster"]') as any
    expect(combobox).toBeTruthy()
    expect(combobox.options.length).toBe(2)
    expect(combobox.options[0]).toEqual(
      expect.objectContaining({ value: 'c-alpha', label: 'Cluster Alpha' }),
    )
    expect(combobox.virtual).toEqual(expect.objectContaining({ enabled: true, itemHeight: 36 }))
    expect(combobox.remote).toBe(true)
    expect(combobox.total).toBe(2)
  })

  it('reactively clears and refetches dependent field when parent field changes', async () => {
    const form = mount(document.createElement('ui-struct-form') as UIStructForm)
    const interceptedUrls: string[] = []

    form.fetchInterceptor = async (url: string) => {
      interceptedUrls.push(url)
      const isEU = url.includes('region=eu-central')
      return {
        ok: true,
        status: 200,
        json: async () => ({
          items: isEU
            ? [{ id: 'eu-1', name: 'Frankfurt Prod' }]
            : [{ id: 'us-1', name: 'Virginia Prod' }],
          total: 1,
        }),
      } as unknown as Response
    }

    form.values = { region: 'us-east', cluster: 'us-1' }
    form.fields = [
      { key: 'region', widget: 'text' },
      {
        key: 'cluster',
        widget: 'combobox',
        dataSource: {
          type: 'http',
          url: '/api/v1/clusters',
          query: { region: '$values.region' },
          valueKey: 'id',
          labelKey: 'name',
          dependsOn: ['region'],
        },
      },
    ]

    await form.updateComplete
    await new Promise((r) => setTimeout(r, 50))
    await form.updateComplete

    expect(interceptedUrls.length).toBe(1)
    expect(interceptedUrls[0]).toContain('region=us-east')

    // Change parent region to 'eu-central'
    form.setFieldValue('region', 'eu-central')
    await form.updateComplete
    await new Promise((r) => setTimeout(r, 50))
    await form.updateComplete

    // Dependent cluster field value must be reset/cleared
    expect(form.getFieldValue('cluster')).toBeUndefined()

    // Second fetch should have occurred with new region
    expect(interceptedUrls.length).toBe(2)
    expect(interceptedUrls[1]).toContain('region=eu-central')

    const combobox = form.shadowRoot!.querySelector('ui-combobox[data-key="cluster"]') as any
    expect(combobox.options[0].value).toBe('eu-1')
  })

  it('appends items on infinite scroll ui-get-page event', async () => {
    const form = mount(document.createElement('ui-struct-form') as UIStructForm)

    form.fetchInterceptor = async (url: string) => {
      const isPage2 = url.includes('page=2')
      return {
        ok: true,
        status: 200,
        json: async () => ({
          items: isPage2
            ? [{ id: 'c3', name: 'Cluster Gamma' }]
            : [{ id: 'c1', name: 'Cluster Alpha' }, { id: 'c2', name: 'Cluster Beta' }],
          total: 3,
        }),
      } as unknown as Response
    }

    const fieldDef: StructFormField = {
      key: 'cluster',
      widget: 'combobox',
      dataSource: {
        type: 'http',
        url: '/api/v1/clusters',
        query: { page: '$page' },
        valueKey: 'id',
        labelKey: 'name',
      },
    }

    form.fields = [fieldDef]
    await form.updateComplete
    await new Promise((r) => setTimeout(r, 50))
    await form.updateComplete

    const combobox = form.shadowRoot!.querySelector('ui-combobox[data-key="cluster"]') as any
    expect(combobox.options.length).toBe(2)

    // Trigger page 2 append
    combobox.dispatchEvent(
      new CustomEvent('ui-get-page', {
        detail: { page: 2, append: true },
        bubbles: true,
        composed: true,
      }),
    )

    await new Promise((r) => setTimeout(r, 50))
    await form.updateComplete

    // Combined options should have 3 items
    expect(combobox.options.length).toBe(3)
    expect(combobox.options.map((o: any) => o.value)).toEqual(['c1', 'c2', 'c3'])
  })

  it('supports provider data source via dataProviders map', async () => {
    const form = mount(document.createElement('ui-struct-form') as UIStructForm)
    const providerCalledWith: any[] = []

    form.dataProviders = {
      tenantService: async (params: Record<string, unknown>) => {
        providerCalledWith.push(params)
        return {
          items: [
            { id: 'org-1', name: 'Acme Corp' },
            { id: 'org-2', name: 'Globex Ltd' },
          ],
          total: 2,
        }
      },
    }

    form.values = { domain: 'acme.com' }
    form.fields = [
      { key: 'domain', widget: 'text' },
      {
        key: 'tenant',
        widget: 'combobox',
        dataSource: {
          type: 'provider',
          key: 'tenantService',
          params: { domain: '$values.domain' },
          valueKey: 'id',
          labelKey: 'name',
        },
      },
    ]

    await form.updateComplete
    await new Promise((r) => setTimeout(r, 50))
    await form.updateComplete

    expect(providerCalledWith.length).toBe(1)
    expect(providerCalledWith[0].domain).toBe('acme.com')

    const combobox = form.shadowRoot!.querySelector('ui-combobox[data-key="tenant"]') as any
    expect(combobox.options.length).toBe(2)
    expect(combobox.options[0].label).toBe('Acme Corp')
  })

  it('displays form loader bar, field spinner, and emits ui-form-loading during async fetching', async () => {
    const form = mount(document.createElement('ui-struct-form') as UIStructForm)
    const loadingEvents: any[] = []
    form.addEventListener('ui-form-loading', (e: any) => {
      loadingEvents.push({ ...e.detail, isFetching: form.isFetching })
    })

    let resolveFetch: (val: any) => void = () => {}
    const slowFetchPromise = new Promise((resolve) => {
      resolveFetch = resolve
    })

    form.fetchInterceptor = async () => {
      await slowFetchPromise
      return new Response(JSON.stringify([{ id: 'reg-1', name: 'US East' }]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    form.fields = [
      {
        key: 'region',
        label: 'Deployment Region',
        widget: 'combobox',
        dataSource: {
          url: '/api/v1/regions',
          valueKey: 'id',
          labelKey: 'name',
        },
      },
    ]

    await form.updateComplete

    // Form is currently fetching
    expect(form.isFetching).toBe(true)
    const loaderBar = form.shadowRoot!.querySelector('.form-loader-bar')
    expect(loaderBar).toBeTruthy()
    expect(loaderBar?.getAttribute('role')).toBe('progressbar')

    const fieldEl = form.shadowRoot!.querySelector('ui-field') as any
    expect(fieldEl.loading).toBe(true)
    expect(fieldEl.shadowRoot!.querySelector('.field-spinner')).toBeTruthy()

    const combobox = form.shadowRoot!.querySelector('ui-combobox') as any
    expect(combobox.loading).toBe(true)
    expect(combobox.shadowRoot!.querySelector('.spinner')).toBeTruthy()

    // Verify initial start loading event
    expect(loadingEvents.length).toBeGreaterThan(0)
    expect(loadingEvents[0].loading).toBe(true)

    // Complete the fetch
    resolveFetch(null)
    await new Promise((r) => setTimeout(r, 20))
    await form.updateComplete

    // Loader bar removed, isFetching false
    expect(form.isFetching).toBe(false)
    expect(form.shadowRoot!.querySelector('.form-loader-bar')).toBeNull()
    expect(fieldEl.loading).toBe(false)
    expect(combobox.loading).toBe(false)

    // Last loading event was loading: false
    const lastEvent = loadingEvents[loadingEvents.length - 1]
    expect(lastEvent.loading).toBe(false)
  })

  it('renders bounded number as ui-number-input unless specified as range/slider', async () => {
    const form = mount(document.createElement('ui-struct-form') as UIStructForm)

    // Standard struct schema like: s.struct({ age: s.number().integer().min(18).max(120).describe('User age') })
    const mockSchema = {
      descriptor: {
        kind: 'struct',
        fields: {
          age: {
            kind: 'integer',
            min: 18,
            max: 120,
            title: 'User age',
          },
          volume: {
            kind: 'number',
            min: 0,
            max: 100,
            title: 'Volume Level',
            metadata: {
              widget: 'range',
            },
          },
        },
      },
    }

    form.values = { age: 25, volume: 80 }
    form.schema = mockSchema
    await form.updateComplete

    const root = form.shadowRoot!

    // Age should be <ui-number-input>, NOT <ui-slider>
    const ageInput = root.querySelector('ui-number-input[data-key="age"]') as any
    expect(ageInput).toBeTruthy()
    expect(ageInput.getAttribute('min')).toBe('18')
    expect(ageInput.getAttribute('max')).toBe('120')

    // Volume should be <ui-slider> since widget: 'range' was specified
    const volumeSlider = root.querySelector('ui-slider[data-key="volume"]') as any
    expect(volumeSlider).toBeTruthy()
    expect(volumeSlider.getAttribute('min')).toBe('0')
    expect(volumeSlider.getAttribute('max')).toBe('100')
  })
})


