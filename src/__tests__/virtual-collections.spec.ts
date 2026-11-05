import { describe, expect, it, vi, beforeEach } from 'vitest'
import '../index.ts'
import { UIList, UITable } from '../index.ts'

describe('Windowed DOM Virtualization in UIList & UITable (Ticket 010)', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  describe('UIList Virtual Scrolling', () => {
    it('renders only a windowed subset of DOM nodes for 1,000 items', async () => {
      const list = document.createElement('ui-list') as UIList
      const bigItems = Array.from({ length: 1000 }, (_, i) => ({
        id: `item_${i}`,
        title: `Item Title #${i}`,
        description: `Description for item ${i}`,
      }))
      list.data = bigItems
      list.virtual = { enabled: true, itemHeight: 50, overscan: 2 }
      document.body.appendChild(list)
      await list.updateComplete

      const sizer = list.shadowRoot!.querySelector('.virtual-sizer') as HTMLElement
      expect(sizer).toBeDefined()
      expect(sizer.style.height).toBe('50000px') // 1000 * 50px

      const renderedItems = sizer.querySelectorAll('.list-item')
      // Only visible slice + overscan (~15-20 nodes), definitely not 1,000
      expect(renderedItems.length).toBeLessThan(30)
      expect(renderedItems.length).toBeGreaterThan(0)
    })

    it('emits ui-get-page when scrolling near bottom of virtual remote list', async () => {
      const list = document.createElement('ui-list') as UIList
      list.remote = true
      list.page = 1
      list.pageSize = 50
      list.total = 500
      list.data = Array.from({ length: 50 }, (_, i) => ({ id: `id_${i}`, title: `Row ${i}` }))
      list.virtual = { enabled: true, itemHeight: 40, threshold: 20 }
      document.body.appendChild(list)
      await list.updateComplete

      const pageSpy = vi.fn()
      list.addEventListener('ui-get-page', pageSpy)

      const scrollContainer = list.shadowRoot!.querySelector('.list-content') as HTMLElement
      // Mock scroll positions for JSDOM
      Object.defineProperty(scrollContainer, 'scrollTop', { value: 1950, writable: true })
      Object.defineProperty(scrollContainer, 'clientHeight', { value: 400, writable: true })
      Object.defineProperty(scrollContainer, 'scrollHeight', { value: 2000, writable: true })

      scrollContainer.dispatchEvent(new Event('scroll'))
      expect(pageSpy).toHaveBeenCalledTimes(1)
      expect(pageSpy.mock.calls[0][0].detail.page).toBe(2)
    })
  })

  describe('UITable Virtual Scrolling', () => {
    it('renders spacer rows and windowed visible slice for 1,000 table rows', async () => {
      const table = document.createElement('ui-table') as UITable
      const bigRows = Array.from({ length: 1000 }, (_, i) => ({
        id: `row_${i}`,
        name: `Server Node #${i}`,
        status: i % 2 === 0 ? 'active' : 'idle',
      }))
      table.columns = [
        { key: 'id', title: 'ID' },
        { key: 'name', title: 'Name' },
        { key: 'status', title: 'Status' },
      ]
      table.data = bigRows
      table.virtual = { enabled: true, itemHeight: 40, overscan: 3 }
      document.body.appendChild(table)
      await table.updateComplete

      const tbody = table.shadowRoot!.querySelector('tbody') as HTMLElement
      expect(tbody).toBeDefined()

      const dataRows = tbody.querySelectorAll('tr:not(.virtual-spacer-top):not(.virtual-spacer-bottom)')
      // Should only render windowed visible rows (~15-25), not 1,000!
      expect(dataRows.length).toBeLessThan(35)
      expect(dataRows.length).toBeGreaterThan(0)

      const bottomSpacer = tbody.querySelector('.virtual-spacer-bottom') as HTMLElement
      expect(bottomSpacer).toBeDefined()
      expect(parseFloat(bottomSpacer.style.height)).toBeGreaterThan(30000)
    })

    it('emits ui-get-page on scroll near bottom when remote is true', async () => {
      const table = document.createElement('ui-table') as UITable
      table.remote = true
      table.page = 1
      table.pageSize = 50
      table.total = 500
      table.columns = [{ key: 'id', title: 'ID' }]
      table.data = Array.from({ length: 50 }, (_, i) => ({ id: `row_${i}` }))
      table.virtual = { enabled: true, itemHeight: 40, threshold: 20 }
      document.body.appendChild(table)
      await table.updateComplete

      const pageSpy = vi.fn()
      table.addEventListener('ui-get-page', pageSpy)

      const scrollContainer = table.shadowRoot!.querySelector('.table-scroll-container') as HTMLElement
      Object.defineProperty(scrollContainer, 'scrollTop', { value: 1950, writable: true })
      Object.defineProperty(scrollContainer, 'clientHeight', { value: 400, writable: true })
      Object.defineProperty(scrollContainer, 'scrollHeight', { value: 2000, writable: true })

      scrollContainer.dispatchEvent(new Event('scroll'))
      expect(pageSpy).toHaveBeenCalledTimes(1)
      expect(pageSpy.mock.calls[0][0].detail.page).toBe(2)
    })
  })
})
