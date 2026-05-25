export const DEFAULT_START_HOUR = 8
export const DEFAULT_END_HOUR = 18
export const DEFAULT_SLOT_MINUTES = 30
export const SLOT_HEIGHT = 44
export const TIME_COLUMN_WIDTH = 64
export const DAY_COLUMN_MIN_WIDTH = 180
export const WEEK_DAYS_COUNT = 7
export const DEFAULT_DIAS_SEMANA = [0, 1, 2, 3, 4, 5, 6]
export const DEFAULT_AGENDA_CONFIG = {
  inicio: `${String(DEFAULT_START_HOUR).padStart(2, '0')}:00`,
  fim: `${String(DEFAULT_END_HOUR).padStart(2, '0')}:00`,
  duracaoPadraoMinutos: DEFAULT_SLOT_MINUTES,
  diasDaSemana: DEFAULT_DIAS_SEMANA,
}

export const DENTIST_COLOR_PALETTE = [
  '#0F766E',
  '#2563EB',
  '#D97706',
  '#9333EA',
  '#DB2777',
  '#059669',
  '#DC2626',
  '#7C3AED',
]

export const STATUS_COLOR_STYLES = {
  blue: {
    badge: 'bg-sky-100 text-sky-700 ring-1 ring-sky-200',
    card: 'bg-sky-50/80 ring-sky-200/70',
  },
  green: {
    badge: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
    card: 'bg-emerald-50/80 ring-emerald-200/70',
  },
  amber: {
    badge: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
    card: 'bg-amber-50/80 ring-amber-200/70',
  },
  red: {
    badge: 'bg-red-100 text-red-700 ring-1 ring-red-200',
    card: 'bg-red-50/80 ring-red-200/70',
  },
  pink: {
    badge: 'bg-pink-100 text-pink-700 ring-1 ring-pink-200',
    card: 'bg-pink-50/80 ring-pink-200/70',
  },
  gray: {
    badge: 'bg-stone-100 text-stone-700 ring-1 ring-stone-200',
    card: 'bg-stone-100/70 ring-stone-200/70',
  },
}

export function addDays(date, amount) {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

export function addMonths(date, amount) {
  const next = new Date(date)
  next.setMonth(next.getMonth() + amount)
  return next
}

export function startOfDay(date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

export function startOfMonth(date) {
  const next = startOfDay(date)
  next.setDate(1)
  return next
}

export function endOfMonthExclusive(date) {
  return startOfMonth(addMonths(date, 1))
}

export function getMonday(date = new Date()) {
  const base = startOfDay(date)
  const day = base.getDay()
  const diff = day === 0 ? -6 : 1 - day
  return addDays(base, diff)
}

export function toDateKey(value) {
  const date = value instanceof Date ? value : new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function buildDayMeta(date) {
  const iso = toDateKey(date)
  const today = toDateKey(new Date())

  return {
    date,
    iso,
    dayOfWeek: date.getDay(),
    isToday: iso === today,
    shortLabel: new Intl.DateTimeFormat('pt-BR', {
      weekday: 'short',
      day: 'numeric',
    }).format(date),
    longLabel: new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date),
    dayNumber: new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
    }).format(date),
  }
}

export function getDayView(anchorDate = new Date()) {
  return [buildDayMeta(startOfDay(anchorDate))]
}

export function getWeekDays(anchorDate = new Date()) {
  const monday = getMonday(anchorDate)

  return Array.from({ length: WEEK_DAYS_COUNT }, (_, index) => buildDayMeta(addDays(monday, index)))
}

export function getMonthMatrix(anchorDate = new Date()) {
  const firstDay = startOfMonth(anchorDate)
  const dayOfWeek = firstDay.getDay()
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const gridStart = addDays(firstDay, diff)
  const activeMonth = firstDay.getMonth()

  return Array.from({ length: 35 }, (_, index) => {
    const date = addDays(gridStart, index)
    return {
      ...buildDayMeta(date),
      isCurrentMonth: date.getMonth() === activeMonth,
    }
  })
}

export function formatWeekLabel(anchorDate = new Date()) {
  const days = getWeekDays(anchorDate)
  const first = days[0]?.date ?? new Date()
  const last = days[days.length - 1]?.date ?? new Date()
  const weekStart = capitalizeWeekday(new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(first))
  const weekEnd = capitalizeWeekday(new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(last))

  return `${weekStart} a ${weekEnd} • ${new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(first)} a ${new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(last)}`
}

export function formatDayLabel(anchorDate = new Date()) {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(anchorDate)
}

export function formatMonthLabel(anchorDate = new Date()) {
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(anchorDate)
}

export function parseAgendaTimeToMinutes(value, fallbackMinutes) {
  const [hour, minute] = String(value || '').split(':').map(Number)
  if (Number.isNaN(hour) || Number.isNaN(minute))
  {
    return fallbackMinutes
  }

  return (hour * 60) + minute
}

function normalizeScheduleConfig(config) {
  const inicio = parseAgendaTimeToMinutes(config?.inicio, DEFAULT_START_HOUR * 60)
  const fim = parseAgendaTimeToMinutes(config?.fim, DEFAULT_END_HOUR * 60)
  const slot = typeof config?.duracaoPadraoMinutos === 'number' ? config.duracaoPadraoMinutos : DEFAULT_SLOT_MINUTES
  const duracaoPadrao = Number.isInteger(slot) && slot > 0 ? slot : DEFAULT_SLOT_MINUTES

  return {
    inicio,
    fim,
    duracaoPadraoMinutos: duracaoPadrao,
    diasDaSemana: Array.isArray(config?.diasDaSemana) ? config.diasDaSemana : DEFAULT_DIAS_SEMANA,
  }
}

export function normalizeWeekdayAgenda(config) {
  const normalized = normalizeScheduleConfig(config)
  if (normalized.inicio >= normalized.fim)
  {
    return {
      ...normalized,
      inicio: DEFAULT_START_HOUR * 60,
      fim: DEFAULT_END_HOUR * 60,
    }
  }

  return normalized
}

export function buildTimeLabels(startTime = DEFAULT_START_HOUR * 60, endTime = DEFAULT_END_HOUR * 60, slotMinutes = DEFAULT_SLOT_MINUTES) {
  const labels = []
  const duration = Math.max(1, Number(slotMinutes) || DEFAULT_SLOT_MINUTES)
  const safeStart = Math.max(0, Math.min(24 * 60, Number(startTime) || DEFAULT_START_HOUR * 60))
  const safeEnd = Math.max(safeStart + duration, Math.min(24 * 60, Number(endTime) || DEFAULT_END_HOUR * 60))

  for (let totalMinutes = safeStart; totalMinutes <= safeEnd; totalMinutes += duration)
  {
    const hour = Math.floor(totalMinutes / 60)
    const minute = totalMinutes % 60
    labels.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)
  }

  return labels
}

export function getRangeStart(anchorDate = new Date(), viewMode = 'week') {
  if (viewMode === 'day') {
    return startOfDay(anchorDate)
  }

  if (viewMode === 'month') {
    return startOfMonth(anchorDate)
  }

  return getWeekDays(anchorDate)[0]?.date ?? startOfDay(anchorDate)
}

export function getRangeEndExclusive(anchorDate = new Date(), viewMode = 'week') {
  if (viewMode === 'day') {
    return addDays(getRangeStart(anchorDate, viewMode), 1)
  }

  if (viewMode === 'month') {
    return endOfMonthExclusive(anchorDate)
  }

  return addDays(getRangeStart(anchorDate, viewMode), WEEK_DAYS_COUNT)
}

function capitalizeWeekday(label) {
  return `${label.charAt(0).toUpperCase()}${label.slice(1)}`
}

export function getMinutesFromStart(date, startMinute = DEFAULT_START_HOUR * 60) {
  return ((date.getHours() * 60 + date.getMinutes()) - startMinute)
}

export function getEventPosition(event, startMinute = DEFAULT_START_HOUR * 60, slotMinutes = DEFAULT_SLOT_MINUTES) {
  const start = new Date(event.start_time)
  const end = new Date(event.end_time)
  const minutesFromStart = Math.max(0, getMinutesFromStart(start, startMinute))
  const duration = Math.max(slotMinutes, Math.round((end.getTime() - start.getTime()) / 60000))

  return {
    top: (minutesFromStart / slotMinutes) * SLOT_HEIGHT,
    height: (duration / slotMinutes) * SLOT_HEIGHT,
  }
}

function eventsOverlap(left, right) {
  return new Date(left.start_time) < new Date(right.end_time) &&
    new Date(left.end_time) > new Date(right.start_time)
}

export function layoutDayEvents(events) {
  const sortedEvents = [...events].sort((left, right) =>
    new Date(left.start_time).getTime() - new Date(right.start_time).getTime())

  const clusters = []

  for (const event of sortedEvents) {
    const lastCluster = clusters[clusters.length - 1]

    if (!lastCluster) {
      clusters.push({
        end: new Date(event.end_time),
        items: [event],
      })
      continue
    }

    if (new Date(event.start_time) < lastCluster.end) {
      lastCluster.items.push(event)

      if (new Date(event.end_time) > lastCluster.end) {
        lastCluster.end = new Date(event.end_time)
      }

      continue
    }

    clusters.push({
      end: new Date(event.end_time),
      items: [event],
    })
  }

  return clusters.flatMap((cluster) => {
    const laidOut = []
    const columns = []

    for (const event of cluster.items) {
      let columnIndex = 0

      while (columns[columnIndex] && eventsOverlap(columns[columnIndex], event)) {
        columnIndex += 1
      }

      columns[columnIndex] = event
      laidOut.push({
        ...event,
        columnIndex,
      })
    }

    const columnCount = Math.max(1, columns.length)

    return laidOut.map((event) => ({
      ...event,
      columnCount,
    }))
  })
}

export function getStatusColorStyle(statusColor) {
  const normalized = String(statusColor || 'gray').toLowerCase()
  return STATUS_COLOR_STYLES[normalized] || STATUS_COLOR_STYLES.gray
}

export function getDentistColor(dentistaId, dentistaColorMap) {
  return dentistaColorMap?.[dentistaId] || DENTIST_COLOR_PALETTE[0]
}
