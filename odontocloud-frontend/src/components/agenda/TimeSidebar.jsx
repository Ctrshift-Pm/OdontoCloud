import { SLOT_HEIGHT } from './agendaUtils'

export default function TimeSidebar({ labels }) {
  return (
    <div className="border-r border-black/10 bg-[#F8F7F4]">
      {labels.map((label) => (
        <div
          key={label}
          className="border-b border-black/8 px-1.5 text-right text-[8px] text-[var(--ink-500)]"
          style={{ height: `${SLOT_HEIGHT}px`, lineHeight: `${SLOT_HEIGHT}px` }}
        >
          {label}
        </div>
      ))}
    </div>
  )
}
