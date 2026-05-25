import { useEffect, useId, useRef } from 'react'

const FOCUSABLE_ELEMENT_SELECTOR =
  'a[href], area[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function getFocusableElements(container) {
  if (!container) {
    return []
  }

  return Array.from(container.querySelectorAll(FOCUSABLE_ELEMENT_SELECTOR)).filter((element) => {
    const isVisible = element.offsetParent !== null || element === document.activeElement
    return isVisible
  })
}

export default function Modal({ isOpen, title, description, onClose, children, footer }) {
  const modalContainerRef = useRef(null)
  const previouslyFocusedElement = useRef(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    previouslyFocusedElement.current = document.activeElement
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      const focusableElements = getFocusableElements(modalContainerRef.current)
      if (event.key !== 'Tab' || focusableElements.length === 0) {
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements.at(-1)

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      }

      if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    const focusableElements = getFocusableElements(modalContainerRef.current)
    const firstElement = focusableElements[0] || modalContainerRef.current
    if (firstElement) {
      firstElement.focus()
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''

      if (previouslyFocusedElement.current?.focus) {
        previouslyFocusedElement.current.focus()
      }
    }
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-stone-950/55 px-4 py-4 backdrop-blur-sm sm:items-center sm:py-8"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        ref={modalContainerRef}
        className="surface-card flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex="-1"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="border-b border-black/5 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id={titleId} className="text-xl font-semibold text-[var(--ink-900)]">
                {title}
              </h2>
              {description ? <p id={descriptionId} className="mt-1 text-sm text-[var(--ink-500)]">{description}</p> : null}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-black/8 text-[var(--ink-500)] transition hover:bg-[var(--surface-muted)]"
              aria-label="Fechar modal"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path
                  d="M6 6l12 12M18 6 6 18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer ? <div className="border-t border-black/5 bg-white px-6 py-4">{footer}</div> : null}
      </div>
    </div>
  )
}
