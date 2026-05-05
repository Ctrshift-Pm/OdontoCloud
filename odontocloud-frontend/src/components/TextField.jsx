import { forwardRef } from 'react'

const TextField = forwardRef(function TextField({ label, error, className = '', ...props }, ref) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-medium text-[var(--ink-700)]">{label}</span>
      <input
        ref={ref}
        {...props}
        className={`w-full rounded-2xl border px-4 py-3 text-sm text-[var(--ink-900)] outline-none transition placeholder:text-[var(--ink-500)] ${
          error
            ? 'border-red-300 bg-red-50/60 focus:border-red-400'
            : 'border-black/12 bg-white focus:border-[var(--brand-500)]'
        }`}
      />
      {error ? <span className="mt-2 block text-sm text-[var(--danger-600)]">{error}</span> : null}
    </label>
  )
})

export default TextField
