import AgendaProfessionalEvent from './AgendaProfessionalEvent'

export default function AgendaProfessionalColumn({
  dayIso,
  dentista,
  agendaConfig,
  slots,
  gridHeight,
  events,
  onSlotClick,
  onEventClick,
}) {
  return (
    <div className="relative border-l border-black/6 bg-white" style={{ height: `${gridHeight}px` }}>
      <div className="absolute inset-0 grid" style={{ gridTemplateRows: `repeat(${slots.length}, var(--agenda-slot-height))` }}>
        {slots.map((label, index) => (
          <button
            key={`${dentista.id}-${label}`}
            type="button"
            onClick={() => onSlotClick?.(dayIso, label, dentista.id)}
            className="border-b border-black/6 text-left outline-none transition hover:bg-[rgba(17,17,17,0.025)] focus-visible:bg-[rgba(17,17,17,0.035)]"
            aria-label={`Criar agendamento para ${dentista.nome} às ${label}`}
            data-slot-index={index}
          />
        ))}
      </div>

      <div className="relative">
        {events.map((agendamento) => (
          <AgendaProfessionalEvent
            key={agendamento.id ?? `${agendamento.start_time}-${agendamento.patient_name}`}
            agendamento={agendamento}
            startMinute={agendaConfig.inicio}
            slotMinutes={agendaConfig.duracaoPadraoMinutos}
            gridHeight={gridHeight}
            onClick={onEventClick}
          />
        ))}
      </div>
    </div>
  )
}
