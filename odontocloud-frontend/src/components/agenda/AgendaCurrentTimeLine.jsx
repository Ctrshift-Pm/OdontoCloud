export default function AgendaCurrentTimeLine({ top, columnsCount, timeColumnWidth }) {
  if (top == null || columnsCount <= 0) {
    return null
  }

  return (
    <div
      className="pointer-events-none absolute left-0 right-0 z-20"
      style={{
        top: `${top}px`,
      }}
    >
      <div className="absolute left-[calc(var(--agenda-time-column-width)-6px)] top-[-5px] h-3 w-3 rounded-full bg-black" />
      <div className="ml-[var(--agenda-time-column-width)] h-px w-[calc(100%-var(--agenda-time-column-width))] bg-black/90" />
    </div>
  )
}
