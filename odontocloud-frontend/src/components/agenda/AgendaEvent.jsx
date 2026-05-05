import { getEventPosition, getStatusColorStyle } from './agendaUtils'

function formatTimeRange(startValue, endValue) {
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return `${formatter.format(new Date(startValue))} - ${formatter.format(new Date(endValue))}`
}

export default function AgendaEvent({ agendamento, startMinute, slotMinutes, onClick }) {
  const statusPalette = getStatusColorStyle(agendamento.status_color)
  const { top, height } = getEventPosition(agendamento, startMinute, slotMinutes)
  const width = `${100 / agendamento.columnCount}%`
  const left = `${(100 / agendamento.columnCount) * agendamento.columnIndex}%`
  const dentistColor = agendamento.dentist_color || '#0F766E'
  const patientName = agendamento.patient_name || 'Paciente sem nome'
  const procedure = agendamento.procedure || 'Procedimento não informado'
  const statusLabel = agendamento.status_label || 'Agendado'
  const timeRange = formatTimeRange(agendamento.start_time, agendamento.end_time)

  return (
    <article
      className={`absolute z-10 overflow-hidden rounded-xl border border-black/8 px-3 py-2 text-[12px] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${statusPalette.card}`}
      onClick={(event) => {
        event.stopPropagation()
        onClick?.(agendamento)
      }}
      style={{
        top: `${top + 2}px`,
        left,
        width: `calc(${width} - 8px)`,
        height: `${Math.max(42, height - 4)}px`,
        borderLeftWidth: '6px',
        borderLeftColor: dentistColor,
        borderLeftStyle: 'solid',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-[11px] font-semibold text-[var(--ink-900)]">{patientName}</div>
          <div className="mt-0.5 truncate text-[10px] leading-relaxed text-[var(--ink-500)]">{procedure}</div>
        </div>

        <span
          className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] ${statusPalette.badge}`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="mt-2 text-[10px] font-medium text-[var(--ink-700)]">{timeRange}</div>
    </article>
  )
}
