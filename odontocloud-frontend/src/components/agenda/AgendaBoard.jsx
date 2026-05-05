import AgendaEvent from './AgendaEvent'
import DayHeader from './DayHeader'
import TimeSidebar from './TimeSidebar'
import {
  DAY_COLUMN_MIN_WIDTH,
  SLOT_HEIGHT,
  TIME_COLUMN_WIDTH,
  buildTimeLabels,
  formatDayLabel,
  formatMonthLabel,
  formatWeekLabel,
  DEFAULT_AGENDA_CONFIG,
  normalizeWeekdayAgenda,
  getDayView,
  getMonthMatrix,
  getWeekDays,
  layoutDayEvents,
  toDateKey,
  getStatusColorStyle,
} from './agendaUtils'

const VIEW_OPTIONS = [
  { value: 'day', label: 'Dia' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
]

const STATUS_LEGEND = [
  { key: 'Agendado', color: 'blue' },
  { key: 'Confirmado', color: 'green' },
  { key: 'Pendente', color: 'amber' },
  { key: 'Remarcado', color: 'pink' },
  { key: 'Falta', color: 'red' },
  { key: 'Cancelado', color: 'gray' },
]

function ViewModeButton({ option, isActive, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick?.(option.value)}
      className={`rounded-xl px-3 py-2 text-[13px] font-medium transition ${
        isActive
          ? 'bg-[var(--brand-500)] text-white shadow-sm'
          : 'bg-white text-[var(--ink-600)] hover:bg-[var(--surface-muted)]'
      }`}
    >
      {option.label}
    </button>
  )
}

function NavigationControls({ viewMode, anchorDate, onPrevious, onToday, onNext, onViewModeChange }) {
  const label = viewMode === 'day'
    ? formatDayLabel(anchorDate)
    : viewMode === 'month'
      ? formatMonthLabel(anchorDate)
      : formatWeekLabel(anchorDate)

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="rounded-2xl border border-black/8 bg-[var(--surface-muted)] px-4 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-500)]">Periodo</div>
          <div className="mt-1 text-[15px] font-semibold capitalize text-[var(--ink-900)]">{label}</div>
        </div>

        <div className="inline-flex flex-wrap items-center gap-2 rounded-2xl border border-black/8 bg-white p-1.5">
          <button type="button" className="btn-secondary px-3 py-2 text-[13px]" onClick={onPrevious}>
            Anterior
          </button>
          <button type="button" className="btn-secondary px-3 py-2 text-[13px]" onClick={onToday}>
            Hoje
          </button>
          <button type="button" className="btn-secondary px-3 py-2 text-[13px]" onClick={onNext}>
            Próximo
          </button>
        </div>
      </div>

      <div className="inline-flex items-center gap-2 rounded-2xl border border-black/8 bg-[var(--surface-muted)] p-1.5">
        {VIEW_OPTIONS.map((option) => (
          <ViewModeButton
            key={option.value}
            option={option}
            isActive={viewMode === option.value}
            onClick={onViewModeChange}
          />
        ))}
      </div>
    </div>
  )
}

function DayColumn({
  day,
  agendamentos,
  timeLabels,
  onSlotClick,
  onEventClick,
  startMinute,
  slotMinutes,
  isAvailable,
}) {
  const laidOutEvents = layoutDayEvents(agendamentos)

  return (
    <div className={`relative h-full border-r border-black/8 last:border-r-0 ${
      isAvailable ? (day.isToday ? 'bg-sky-50/70' : 'bg-white') : 'bg-stone-100/60'
    }`}>
      <div className="absolute inset-0 grid" style={{ gridTemplateRows: `repeat(${timeLabels.length}, ${SLOT_HEIGHT}px)` }}>
        {timeLabels.map((label) => (
          <button
            key={`${day.iso}-${label}`}
            type="button"
            data-day={day.iso}
            data-day-index={day.dayOfWeek}
            data-time={label}
            data-available={isAvailable ? 'true' : 'false'}
            onClick={isAvailable ? () => onSlotClick?.(day.iso, label) : undefined}
            disabled={!isAvailable}
            className={`border-b border-black/8 text-left transition ${
              day.isToday ? 'bg-sky-50/70 hover:bg-sky-100/80' : 'bg-white hover:bg-[#F8F7F4]'
            } ${isAvailable ? '' : 'cursor-not-allowed opacity-60'}`}
            aria-label={`Criar agendamento em ${day.longLabel} às ${label}`}
          />
        ))}
      </div>

      <div className="relative">
        {laidOutEvents.map((agendamento) => (
          <AgendaEvent
            key={agendamento.id ?? `${agendamento.start_time}-${agendamento.patient_name}`}
            agendamento={agendamento}
            startMinute={startMinute}
            slotMinutes={slotMinutes}
            onClick={onEventClick}
          />
        ))}
      </div>
    </div>
  )
}

function MonthView({ anchorDate, agendamentos, onSelectDate }) {
  const calendarDays = getMonthMatrix(anchorDate)
  const eventsCountByDay = agendamentos.reduce((accumulator, item) => {
    const key = toDateKey(item.start_time)
    accumulator[key] = (accumulator[key] || 0) + 1
    return accumulator
  }, {})

  return (
    <div className="overflow-auto">
      <div className="grid min-w-[860px] grid-cols-7">
        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((label) => (
          <div
            key={label}
            className="border-b border-r border-black/8 bg-stone-50 px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-500)] last:border-r-0"
          >
            {label}
          </div>
        ))}

        {calendarDays.map((day) => {
          const count = eventsCountByDay[day.iso] || 0

          return (
            <button
              key={day.iso}
              type="button"
              onClick={() => onSelectDate?.(day.date)}
              className={`min-h-[132px] border-b border-r border-black/8 px-4 py-3 text-left transition last:border-r-0 ${
                day.isToday
                  ? 'bg-sky-50 hover:bg-sky-100/70'
                  : day.isCurrentMonth
                    ? 'bg-white hover:bg-[var(--surface-muted)]'
                    : 'bg-stone-50/80 text-[var(--ink-400)] hover:bg-stone-100'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                    day.isToday ? 'bg-sky-600 text-white' : 'text-[var(--ink-800)]'
                  }`}
                >
                  {day.dayNumber}
                </span>

                {count > 0 ? (
                  <span className="rounded-full bg-[var(--brand-50)] px-2 py-1 text-[11px] font-semibold text-[var(--brand-700)]">
                    {count} consulta{count > 1 ? 's' : ''}
                  </span>
                ) : null}
              </div>

              <div className="mt-6 text-xs text-[var(--ink-500)]">
                {count > 0 ? 'Clique para abrir o dia' : 'Sem agendamentos'}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function AgendaBoard({
  agendamentos,
  anchorDate = new Date(),
  viewMode = 'week',
  onPrevious,
  onToday,
  onNext,
  onViewModeChange,
  onSlotClick,
  onEventClick,
  onSelectDate,
  agendaConfig = DEFAULT_AGENDA_CONFIG,
}) {
  const visibleDays = viewMode === 'day' ? getDayView(anchorDate) : getWeekDays(anchorDate)
  const agenda = normalizeWeekdayAgenda(agendaConfig)
  const timeLabels = buildTimeLabels(agenda.inicio, agenda.fim, agenda.duracaoPadraoMinutos)
  const gridHeight = timeLabels.length * SLOT_HEIGHT

  const eventsByDay = visibleDays.reduce((accumulator, day) => {
    accumulator[day.iso] = agendamentos.filter(
      (agendamento) => toDateKey(agendamento.start_time) === day.iso,
    )
    return accumulator
  }, {})

  return (
    <section className="surface-card overflow-hidden">
      <div className="border-b border-black/8 bg-white px-5 py-4">
        <NavigationControls
          viewMode={viewMode}
          anchorDate={anchorDate}
          onPrevious={onPrevious}
          onToday={onToday}
          onNext={onNext}
          onViewModeChange={onViewModeChange}
        />
      </div>

      <div className="border-b border-black/8 bg-white px-5 py-3">
        <div className="flex flex-wrap items-center gap-3 text-[12px] text-[var(--ink-700)]">
          <div className="font-medium text-[var(--ink-500)]">Legenda de status</div>
          {STATUS_LEGEND.map((status) => {
            const style = getStatusColorStyle(status.color)

            return <LegendBadge key={status.key} className={style.badge} label={status.key} />
          })}
        </div>
      </div>

      {viewMode === 'month' ? (
        <MonthView anchorDate={anchorDate} agendamentos={agendamentos} onSelectDate={onSelectDate} />
      ) : (
        <div className="overflow-auto">
          <div
            className="grid min-w-[964px]"
            style={{
              gridTemplateColumns: `${TIME_COLUMN_WIDTH}px repeat(${visibleDays.length}, minmax(${DAY_COLUMN_MIN_WIDTH}px, 1fr))`,
            }}
          >
            <div className="sticky top-0 z-20 border-r border-black/8 border-b-2 border-black/8 bg-[#F8F7F4] px-3 py-[11px] text-center text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-500)]">
              Hora
            </div>

            {visibleDays.map((day) => (
              <div key={day.iso} className="sticky top-0 z-20">
                <DayHeader day={day} />
              </div>
            ))}

            <div style={{ height: `${gridHeight}px` }}>
              <TimeSidebar labels={timeLabels} />
            </div>

            {visibleDays.map((day) => (
              <div key={`${day.iso}-column`} style={{ height: `${gridHeight}px` }}>
                <DayColumn
                  day={day}
                  agendamentos={eventsByDay[day.iso] || []}
                  timeLabels={timeLabels}
                  isAvailable={agenda.diasDaSemana?.length ? agenda.diasDaSemana.includes(day.dayOfWeek) : true}
                  onSlotClick={onSlotClick}
                  onEventClick={onEventClick}
                  startMinute={agenda.inicio}
                  slotMinutes={agenda.duracaoPadraoMinutos}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function LegendBadge({ className, label }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${className}`}>
      {label}
    </span>
  )
}
