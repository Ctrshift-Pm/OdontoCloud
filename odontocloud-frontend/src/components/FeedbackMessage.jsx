const variants = {
  error: {
    container: 'border border-red-200/80 bg-[var(--danger-50)]/88 text-[var(--danger-600)] backdrop-blur-sm',
    title: 'Atencao',
  },
  success: {
    container: 'border border-emerald-200/80 bg-[var(--success-50)]/88 text-[var(--success-600)] backdrop-blur-sm',
    title: 'Sucesso',
  },
  info: {
    container: 'border border-sky-200/80 bg-[var(--info-50)]/88 text-[var(--info-600)] backdrop-blur-sm',
    title: 'Informacao',
  },
}

export default function FeedbackMessage({ type = 'error', message }) {
  if (!message) {
    return null
  }

  const variant = variants[type] || variants.error

  return (
    <div className={`rounded-[22px] px-4 py-3 text-sm ${variant.container}`}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em]">{variant.title}</div>
      <div className="mt-1.5 leading-6">{message}</div>
    </div>
  )
}
