/**
 * Accessible Live Region Announcer for screen readers (NVDA, JAWS, VoiceOver).
 *
 * Screen readers frequently fail to observe dynamic aria-live / role="alert" regions
 * nested inside Web Component Shadow DOM roots. This singleton creates and updates
 * a visually-hidden live region in the document body.
 */

export function announceLive(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  if (typeof document === 'undefined' || !message.trim()) return

  const id = priority === 'assertive' ? 'ui-live-announcer-assertive' : 'ui-live-announcer-polite'
  let container = document.getElementById(id)
  if (!container) {
    container = document.createElement('div')
    container.id = id
    container.setAttribute('aria-live', priority)
    container.setAttribute('aria-atomic', 'true')
    container.style.cssText =
      'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;'
    document.body.appendChild(container)
  }

  container.textContent = ''
  requestAnimationFrame(() => {
    if (container) {
      container.textContent = message
    }
  })
}
