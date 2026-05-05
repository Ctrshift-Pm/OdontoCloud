const variants = {
  error: {
    container: 'border border-red-200 bg-[var(--danger-50)] text-[var(--danger-600)]',
    title: 'Atencao',
  },
  success: {
    container: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
    title: 'Sucesso',
  },
  info: {
    container: 'border border-sky-200 bg-sky-50 text-sky-700',
    title: 'Informacao',
  },
}

export default function FeedbackMessage({ type = 'error', message }) {
  if (!message) {
    return null
  }

  const variant = variants[type] || variants.error

  return (
    <div className={`rounded-2xl px-4 py-3 text-sm ${variant.container}`}>
      <div className="font-semibold">{variant.title}</div>
      <div className="mt-1 leading-6">{message}</div>
    </div>
  )
}
