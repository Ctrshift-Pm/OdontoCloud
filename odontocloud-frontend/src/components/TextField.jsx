import { forwardRef } from 'react'

const TextField = forwardRef(function TextField({ label, error, className = '', ...props }, ref) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-500)]">
        {label}
      </span>
      <input
        ref={ref}
        {...props}
        className={`w-full rounded-[20px] border bg-white/88 px-4 py-3.5 text-sm text-[var(--ink-900)] outline-none transition placeholder:text-[var(--ink-400)] ${
          error
            ? 'border-red-300 bg-red-50/72 focus:border-red-400 focus:ring-4 focus:ring-red-100'
            : 'border-black/8 focus:border-black/20 focus:ring-4 focus:ring-black/5'
        }`}
      />
      {error ? <span className="mt-2 block text-sm text-[var(--danger-600)]">{error}</span> : null}
    </label>
  )
})

export default TextField
