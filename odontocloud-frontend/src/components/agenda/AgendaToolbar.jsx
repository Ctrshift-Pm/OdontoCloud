import { formatMonthLabel, formatProfessionalDateLabel, formatWeekLabel } from './agendaUtils'

const STATUS_OPTIONS = ['Todos', 'Agendado', 'Confirmado', 'Pendente', 'Remarcado', 'Falta', 'Atendido']
const VIEW_OPTIONS = [
  { value: 'day', label: 'Dia' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
]

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path d="m15 18-6-6 6-6" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path d="m9 18 6-6-6-6" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function FilterPill({ label, value, children }) {
  return (
    <label className="flex h-11 items-center gap-2 rounded-full border border-black/10 bg-[#f4f1f0] px-4 text-[13px] text-[var(--ink-700)]">
      <span className="text-[12px] text-[var(--ink-500)]">{label}</span>
      {children || <span className="font-medium text-[var(--ink-900)]">{value}</span>}
    </label>
  )
}

export default function AgendaToolbar({
  anchorDate,
  viewMode,
  dentistas,
  selectedDentistaIds,
  selectedStatus,
  onPrevious,
  onToday,
  onNext,
  onOpenCreate,
  onToggleDentista,
  onSelectAllDentistas,
  onStatusChange,
  onViewModeChange,
}) {
  const selectedCount = selectedDentistaIds.length
  const isAllSelected = selectedCount === dentistas.length
  const selectedLabel = selectedCount === 1 ? '1 selecionado' : `${selectedCount} selecionados`
  const allSelectedLabel = dentistas.length === 1 ? '1 selecionado' : `${dentistas.length} selecionados`
  const dateLabel = viewMode === 'month'
    ? formatMonthLabel(anchorDate)
    : viewMode === 'week'
      ? formatWeekLabel(anchorDate)
      : formatProfessionalDateLabel(anchorDate)

  return (
    <div className="surface-card overflow-visible">
      <div className="border-b border-black/8 px-4 py-4 lg:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={onToday} className="btn-secondary h-10 rounded-[14px] px-5 text-[13px]">
              Hoje
            </button>

            <div className="inline-flex items-center gap-1 rounded-full px-1 py-1 text-[var(--ink-800)]">
              <button type="button" onClick={onPrevious} className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-[var(--surface-muted)]" aria-label="Dia anterior">
                <ChevronLeftIcon />
              </button>
              <div className="min-w-[180px] text-center text-[14px] font-medium text-[var(--ink-900)] lg:min-w-[220px]">
                {dateLabel}
              </div>
              <button type="button" onClick={onNext} className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-[var(--surface-muted)]" aria-label="Próximo período">
                <ChevronRightIcon />
              </button>
            </div>
          </div>

          <button type="button" onClick={onOpenCreate} className="btn-primary h-11 rounded-full px-5 text-[13px]">
            Novo agendamento
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <details className="group relative">
            <summary className="flex h-11 cursor-pointer list-none items-center gap-2 rounded-full border border-black/10 bg-[#f4f1f0] px-4 text-[13px] text-[var(--ink-700)]">
              <span className="text-[12px] text-[var(--ink-500)]">Profissionais</span>
              <span className="font-medium text-[var(--ink-900)]">
                {isAllSelected ? allSelectedLabel : selectedLabel}
              </span>
            </summary>

            <div className="absolute left-0 top-[calc(100%+8px)] z-30 min-w-[260px] rounded-[18px] border border-black/8 bg-white p-3 shadow-[0_20px_50px_rgba(17,17,17,0.12)]">
              <label className="flex items-center gap-2 rounded-[12px] px-2 py-2 text-[13px] text-[var(--ink-800)] hover:bg-[var(--surface-muted)]">
                <input type="checkbox" checked={isAllSelected} onChange={onSelectAllDentistas} className="accent-black" />
                <span>Todos os profissionais</span>
              </label>
              <div className="mt-2 space-y-1">
                {dentistas.map((dentista) => (
                  <label key={dentista.id} className="flex items-center gap-2 rounded-[12px] px-2 py-2 text-[13px] text-[var(--ink-800)] hover:bg-[var(--surface-muted)]">
                    <input
                      type="checkbox"
                      checked={selectedDentistaIds.includes(dentista.id)}
                      onChange={() => onToggleDentista(dentista.id)}
                      className="accent-black"
                    />
                    <span>{dentista.nome}</span>
                  </label>
                ))}
              </div>
            </div>
          </details>

          <FilterPill label="Status">
            <select value={selectedStatus} onChange={(event) => onStatusChange(event.target.value)} className="bg-transparent font-medium text-[var(--ink-900)] outline-none">
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </FilterPill>

          <div className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-[#f4f1f0] p-1">
            {VIEW_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onViewModeChange(option.value)}
                className={`rounded-full px-4 py-2 text-[13px] font-medium transition ${
                  viewMode === option.value
                    ? 'bg-black text-white'
                    : 'text-[var(--ink-700)] hover:bg-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
