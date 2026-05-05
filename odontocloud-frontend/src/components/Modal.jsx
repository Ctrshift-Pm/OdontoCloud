import { useEffect } from 'react'

export default function Modal({ isOpen, title, description, onClose, children, footer }) {
  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
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
        className="surface-card flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="border-b border-black/5 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-[var(--ink-900)]">{title}</h2>
              {description ? <p className="mt-1 text-sm text-[var(--ink-500)]">{description}</p> : null}
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
