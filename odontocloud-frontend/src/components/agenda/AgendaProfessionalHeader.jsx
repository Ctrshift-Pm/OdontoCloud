import { getDentistaInitials, getDentistaSpecialty } from './agendaUtils'

export default function AgendaProfessionalHeader({ dentista }) {
  return (
    <div className="border-b border-black/8 bg-white px-5 py-4">
      <div className="flex items-center justify-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/10 bg-[#efeded] text-[14px] font-medium text-[var(--ink-900)]">
          {getDentistaInitials(dentista.nome)}
        </div>
        <div className="min-w-0 text-left">
          <div className="truncate text-[14px] font-medium tracking-[-0.03em] text-[var(--ink-900)]">{dentista.nome}</div>
          <div className="mt-0.5 truncate text-[12px] text-[var(--ink-600)]">{getDentistaSpecialty(dentista)}</div>
        </div>
      </div>
    </div>
  )
}
