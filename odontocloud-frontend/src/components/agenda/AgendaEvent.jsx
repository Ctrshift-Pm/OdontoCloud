import { getEventPosition, getStatusColorStyle } from './agendaUtils'

function formatTimeRange(startValue, endValue) {
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return `${formatter.format(new Date(startValue))} - ${formatter.format(new Date(endValue))}`
}

export default function AgendaEvent({ agendamento, startMinute, slotMinutes, gridHeight, onClick }) {
  const statusPalette = getStatusColorStyle(agendamento.status_color)
  const { top, height } = getEventPosition(agendamento, startMinute, slotMinutes)
  const preferredHeight = Math.max(28, height - 4)
  const safeGridHeight = Number(gridHeight) || 0
  const maxTop = safeGridHeight > 0 ? Math.max(0, safeGridHeight - preferredHeight - 2) : top
  const renderedTop = safeGridHeight > 0 ? Math.min(top + 2, maxTop) : top + 2
  const maxAvailableHeight = safeGridHeight > 0
    ? Math.max(0, safeGridHeight - renderedTop - 2)
    : preferredHeight
  const cardHeight = Math.max(0, Math.min(preferredHeight, maxAvailableHeight || preferredHeight))
  const width = `${100 / agendamento.columnCount}%`
  const left = `${(100 / agendamento.columnCount) * agendamento.columnIndex}%`
  const dentistColor = agendamento.dentist_color || '#0F766E'
  const patientName = agendamento.patient_name || 'Paciente sem nome'
  const procedure = agendamento.procedure || 'Procedimento não informado'
  const statusLabel = agendamento.status_label || 'Agendado'
  const timeRange = formatTimeRange(agendamento.start_time, agendamento.end_time)

  if (cardHeight <= 0) {
    return null
  }

  return (
    <article
      className={`absolute z-10 overflow-hidden rounded-[12px] border border-black/8 px-2 py-1.5 text-[9px] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${statusPalette.card}`}
      onClick={(event) => {
        event.stopPropagation()
        onClick?.(agendamento)
      }}
      style={{
        top: `${renderedTop}px`,
        left,
        width: `calc(${width} - 6px)`,
        height: `${cardHeight}px`,
        borderLeftWidth: '4px',
        borderLeftColor: dentistColor,
        borderLeftStyle: 'solid',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-[8px] font-semibold text-[var(--ink-900)]">{procedure}</div>
          <div className="mt-1 truncate text-[7px] leading-relaxed text-[var(--ink-600)]">{patientName}</div>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-[7px] font-medium text-[var(--ink-600)]">{timeRange}</div>
        </div>
      </div>

      <div className="mt-1 flex items-center gap-1 text-[7px] text-[var(--ink-500)]">
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${statusPalette.badge.split(' ')[0]}`} />
        <span>{statusLabel}</span>
      </div>
    </article>
  )
}
