/**
 * Shared Data Collection Utilities for UI Components (Tables, Lists, Grids)
 *
 * Provides shared algorithms for string normalization, multi-type sorting,
 * pagination calculation, and Golden Ratio pagination bar rendering.
 */

/**
 * Safely converts unknown values into displayable strings
 */
export function safeString(val: unknown): string {
  if (val === null || val === undefined) return ''
  if (typeof val === 'string') return val
  if (typeof val === 'number' || typeof val === 'boolean' || typeof val === 'bigint') {
    return val.toString()
  }
  if (val instanceof Date) return val.toISOString()
  if (typeof val === 'object') {
    try {
      return JSON.stringify(val)
    } catch {
      return ''
    }
  }
  return typeof (val as { toString?: () => string }).toString === 'function'
    ? (val as { toString: () => string }).toString()
    : ''
}

/**
 * Universal sorting engine for collection items
 */
export function sortData<T extends Record<string, unknown>>(
  items: T[],
  key: string,
  direction: 'asc' | 'desc' | null,
): T[] {
  if (!direction || !key) return [...items]

  return [...items].sort((a, b) => {
    const valA = a[key]
    const valB = b[key]

    if (valA === valB) return 0
    if (valA === undefined || valA === null) return 1
    if (valB === undefined || valB === null) return -1

    let comparison = 0
    if (typeof valA === 'number' && typeof valB === 'number') {
      comparison = valA - valB
    } else if (typeof valA === 'boolean' && typeof valB === 'boolean') {
      comparison = valA === valB ? 0 : valA ? 1 : -1
    } else if (valA instanceof Date && valB instanceof Date) {
      comparison = valA.getTime() - valB.getTime()
    } else {
      comparison = safeString(valA).localeCompare(safeString(valB), undefined, {
        numeric: true,
        sensitivity: 'base',
      })
    }

    return direction === 'desc' ? -comparison : comparison
  })
}

export interface PaginationResult<T> {
  items: T[]
  total: number
  totalPages: number
  currentPage: number
  pageSize: number
  startItem: number
  endItem: number
}

/**
 * Calculates pagination offsets, page counts, and slices local items if not remote
 */
export function calculatePagination<T>(
  data: T[],
  page: number,
  pageSize: number,
  explicitTotal?: number,
  isRemote = false,
): PaginationResult<T> {
  const total = explicitTotal !== undefined && explicitTotal >= 0 ? explicitTotal : data.length
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)))
  const currentPage = Math.max(1, Math.min(page, totalPages))
  const startItem = total === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, total)

  let items = data
  if (!isRemote) {
    const startIndex = (currentPage - 1) * pageSize
    items = data.slice(startIndex, startIndex + pageSize)
  }

  return {
    items,
    total,
    totalPages,
    currentPage,
    pageSize,
    startItem,
    endItem,
  }
}

/**
 * Computes an array of page numbers and ellipsis tokens for smart pagination UI
 */
export function getSmartPaginationPages(
  currentPage: number,
  totalPages: number,
): (number | string)[] {
  const pages: (number | string)[] = []

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (currentPage > 3) pages.push('...')

    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)
    for (let i = start; i <= end; i++) pages.push(i)

    if (currentPage < totalPages - 2) pages.push('...')
    pages.push(totalPages)
  }

  return pages
}

/**
 * Shared HTML renderer for Golden Ratio pagination bars
 */
export function renderPaginationHtml(options: {
  currentPage: number
  totalPages: number
  pageSize: number
  totalCount: number
  startItem: number
  endItem: number
  pageSizeOptions?: number[]
}): string {
  const {
    currentPage,
    totalPages,
    pageSize,
    totalCount,
    startItem,
    endItem,
    pageSizeOptions = [5, 10, 25, 50],
  } = options

  const pageButtons = getSmartPaginationPages(currentPage, totalPages)

  return /*html*/ `
    <div class="pagination-container" part="pagination">
      <div class="pagination-left">
        <span class="pagination-info">
          Showing <strong>${startItem}–${endItem}</strong> of <strong>${totalCount}</strong>
        </span>
        <div class="page-size-selector">
          <label for="page-size-select">Show:</label>
          <select id="page-size-select" class="page-size-select" part="page-size-select">
            ${pageSizeOptions
              .map(
                (opt) => `
              <option value="${opt}" ${opt === pageSize ? 'selected' : ''}>${opt}</option>
            `,
              )
              .join('')}
          </select>
        </div>
      </div>

      <div class="pagination-controls" part="pagination-controls">
        <button
          type="button"
          class="page-btn page-first"
          ${currentPage === 1 ? 'disabled' : ''}
          title="First Page"
          part="page-first"
        >«</button>
        <button
          type="button"
          class="page-btn page-prev"
          ${currentPage === 1 ? 'disabled' : ''}
          title="Previous Page"
          part="page-prev"
        >‹</button>

        ${pageButtons
          .map((p) => {
            if (p === '...') {
              return `<span class="page-ellipsis">…</span>`
            }
            const isCurrent = p === currentPage
            return `<button
              type="button"
              class="page-btn page-num ${isCurrent ? 'active' : ''}"
              data-page="${p}"
              part="page-num ${isCurrent ? 'page-num-active' : ''}"
            >${p}</button>`
          })
          .join('')}

        <button
          type="button"
          class="page-btn page-next"
          ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}
          title="Next Page"
          part="page-next"
        >›</button>
        <button
          type="button"
          class="page-btn page-last"
          ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}
          title="Last Page"
          part="page-last"
        >»</button>
      </div>
    </div>
  `
}

/**
 * Ensures modal backdrop clicks only trigger dismissal if the pointerdown
 * also originated directly on the backdrop (preventing accidental dismissals when
 * dragging text, inputs, or scrollbars from inside the modal card).
 */
export function createBackdropDismissHandler(onClose: () => void) {
  let isBackdropDown = false

  const onPointerDown = (e: PointerEvent | MouseEvent) => {
    if (e.target === e.currentTarget) {
      isBackdropDown = true
    }
  }

  const onClick = (e: MouseEvent) => {
    if (isBackdropDown && e.target === e.currentTarget) {
      onClose()
    }
    isBackdropDown = false
  }

  return { onPointerDown, onClick }
}
