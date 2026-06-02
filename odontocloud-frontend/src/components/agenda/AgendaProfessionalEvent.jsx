import { getEventPosition } from './agendaUtils'

function formatTimeRange(startValue, endValue) {
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return `${formatter.format(new Date(startValue))} - ${formatter.format(new Date(endValue))}`
}

function UserMiniIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
      <path d="M12 12.25a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5.75 6c0-2.45 2.18-4.25 5.75-4.25s5.75 1.8 5.75 4.25" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function LockMiniIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path d="M8.5 10V8a3.5 3.5 0 1 1 7 0v2m-8 0h9a1 1 0 0 1 1 1v6.5a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1V11a1 1 0 0 1 1-1Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function AgendaProfessionalEvent({ agendamento, startMinute, slotMinutes, gridHeight, onClick }) {
  const { top, height } = getEventPosition(agendamento, startMinute, slotMinutes)
  const preferredHeight = Math.max(28, height - 2)
  const safeGridHeight = Number(gridHeight) || 0
  const maxTop = safeGridHeight > 0 ? Math.max(0, safeGridHeight - preferredHeight - 2) : top
  const renderedTop = safeGridHeight > 0 ? Math.min(top + 2, maxTop) : top + 2
  const maxAvailableHeight = safeGridHeight > 0
    ? Math.max(0, safeGridHeight - renderedTop - 2)
    : preferredHeight
  const renderedHeight = Math.min(preferredHeight, maxAvailableHeight || preferredHeight)
  const cardHeight = Math.max(0, renderedHeight)
  const width = `${100 / agendamento.columnCount}%`
  const left = `${(100 / agendamento.columnCount) * agendamento.columnIndex}%`
  const timeRange = formatTimeRange(agendamento.start_time, agendamento.end_time)
  const isBlocked = agendamento.is_blocked || /reuni[aã]o|bloqueio/i.test(`${agendamento.procedure} ${agendamento.patient_name}`)
  const isCompact = cardHeight < 44
  const isTiny = cardHeight < 34

  if (cardHeight <= 0) {
    return null
  }

  return (
    <article
      className={`absolute z-10 overflow-hidden rounded-[12px] border border-black/10 bg-[rgba(249,245,245,0.96)] shadow-[0_6px_18px_rgba(17,17,17,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(17,17,17,0.1)] ${isBlocked ? 'text-[var(--ink-500)]' : 'text-[var(--ink-900)]'}`}
      onClick={(event) => {
        event.stopPropagation()
        onClick?.(agendamento)
      }}
      style={{
        top: `${renderedTop}px`,
        left,
        width: `calc(${width} - 10px)`,
        height: `${cardHeight}px`,
      }}
    >
      <div className="absolute inset-y-0 left-0 w-[4px] rounded-l-[12px]" style={{ backgroundColor: agendamento.dentist_color }} />

      <div className={`flex h-full flex-col ${isTiny ? 'justify-center px-3 py-1.5' : isCompact ? 'px-3 py-2' : 'px-4 py-3'}`}>
        {isBlocked ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-[var(--ink-500)]">
            <LockMiniIcon />
            <div className={`${isCompact ? 'mt-1 text-[12px]' : 'mt-2 text-[13px]'} font-medium`}>Reunião Clínica</div>
          </div>
        ) : (
          <>
            <div className={`flex ${isTiny ? 'items-center' : 'items-start'} justify-between gap-3`}>
              <div className="min-w-0">
                <div className={`${isTiny ? 'text-[12px]' : isCompact ? 'text-[13px]' : 'text-[14px]'} truncate font-semibold tracking-[-0.02em] leading-none`}>
                  {agendamento.procedure || 'Procedimento'}
                </div>
              </div>
              <div className={`${isTiny ? 'text-[10px]' : 'shrink-0 text-[11px]'} text-[var(--ink-500)] leading-none`}>{timeRange}</div>
            </div>

            {!isTiny ? (
              <div className={`${isCompact ? 'mt-1' : 'mt-2'} flex items-center gap-1.5 text-[12px] text-[var(--ink-700)]`}>
                <UserMiniIcon />
                <span className="truncate">{agendamento.patient_name || 'Paciente sem nome'}</span>
              </div>
            ) : null}
          </>
        )}
      </div>
    </article>
  )
}
