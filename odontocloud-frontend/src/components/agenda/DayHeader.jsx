export default function DayHeader({ day }) {
  return (
    <div
      className={`border-b-2 border-black/8 px-3 py-[11px] text-center text-[13px] font-semibold text-[var(--ink-700)] ${
        day.isToday ? 'bg-sky-50' : 'bg-white'
      }`}
    >
      <span className={day.isToday ? 'text-sky-700' : ''}>{day.shortLabel}</span>
      {day.isToday ? (
        <span className="ml-2 rounded-full bg-sky-600 px-2 py-0.5 text-[10px] font-semibold text-white">
          Hoje
        </span>
      ) : null}
    </div>
  )
}
