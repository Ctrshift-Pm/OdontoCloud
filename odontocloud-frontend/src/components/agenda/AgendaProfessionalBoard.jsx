import AgendaCurrentTimeLine from './AgendaCurrentTimeLine'
import AgendaProfessionalColumn from './AgendaProfessionalColumn'
import AgendaProfessionalHeader from './AgendaProfessionalHeader'
import {
  PROFESSIONAL_COLUMN_MIN_WIDTH,
  SLOT_HEIGHT,
  TIME_COLUMN_WIDTH,
  buildProfessionalTimeScale,
  buildProfessionalBoardGroups,
  getCurrentTimeOffset,
} from './agendaUtils'

export default function AgendaProfessionalBoard({
  anchorDate,
  dentistas,
  agendamentos,
  agendaConfig,
  onSlotClick,
  onEventClick,
}) {
  const timeScale = buildProfessionalTimeScale(agendaConfig.inicio, agendaConfig.fim, agendaConfig.duracaoPadraoMinutos)
  const slotCount = timeScale.slots.length
  const gridHeight = slotCount * SLOT_HEIGHT
  const groupedColumns = buildProfessionalBoardGroups(agendamentos, dentistas)
  const currentTimeOffset = getCurrentTimeOffset(anchorDate, agendaConfig.inicio, agendaConfig.duracaoPadraoMinutos)
  const clampedCurrentTimeOffset = currentTimeOffset == null || currentTimeOffset > gridHeight
    ? null
    : Math.max(0, currentTimeOffset)
  const hasAppointments = agendamentos.length > 0
  const columnsCount = Math.max(1, groupedColumns.length)
  const hasProfessionals = groupedColumns.length > 0

  return (
    <section
      className="surface-card overflow-x-auto overflow-y-hidden"
      style={{
        ['--agenda-slot-height']: `${SLOT_HEIGHT}px`,
        ['--agenda-time-column-width']: `${TIME_COLUMN_WIDTH}px`,
        ['--agenda-professional-column-width']: `${PROFESSIONAL_COLUMN_MIN_WIDTH}px`,
      }}
    >
      <div className="min-w-[calc(var(--agenda-time-column-width)+var(--agenda-professional-column-width))]">
        <div
          className="grid"
          style={{
            gridTemplateColumns: `var(--agenda-time-column-width) repeat(${columnsCount}, minmax(var(--agenda-professional-column-width), 1fr))`,
          }}
        >
          <div className="border-b border-black/8 bg-white" />

          {groupedColumns.map(({ dentista }) => (
            <AgendaProfessionalHeader key={dentista.id} dentista={dentista} />
          ))}

          {!hasProfessionals ? <div className="border-b border-black/8 bg-white" /> : null}
        </div>

        <div className="relative">
          <AgendaCurrentTimeLine top={clampedCurrentTimeOffset} columnsCount={columnsCount} timeColumnWidth={TIME_COLUMN_WIDTH} />

          <div
            className="grid"
            style={{
              gridTemplateColumns: `var(--agenda-time-column-width) repeat(${columnsCount}, minmax(var(--agenda-professional-column-width), 1fr))`,
            }}
          >
            <div className="relative border-r border-black/8 bg-[#fcf8f7]" style={{ height: `${gridHeight}px` }}>
              <div className="absolute inset-0 grid" style={{ gridTemplateRows: `repeat(${slotCount}, var(--agenda-slot-height))` }}>
                {timeScale.markers.map(({ label, isHour }) => (
                  <div key={label} className="border-b border-black/6 px-4 pt-2 text-[13px] text-[var(--ink-600)]">
                    {isHour ? label : ''}
                  </div>
                ))}
              </div>
            </div>

            {groupedColumns.map(({ dentista, items }) => (
              <AgendaProfessionalColumn
                key={`${dentista.id}-column`}
                dayIso={anchorDate.toISOString()}
                dentista={dentista}
                agendaConfig={agendaConfig}
                slots={timeScale.slots}
                gridHeight={gridHeight}
                events={items}
                onSlotClick={onSlotClick}
                onEventClick={onEventClick}
              />
            ))}

            {!hasProfessionals ? (
              <div className="relative border-l border-black/6 bg-white" style={{ height: `${gridHeight}px` }} />
            ) : null}
          </div>

          {!hasProfessionals ? (
            <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center px-6 pt-24">
              <div className="rounded-full border border-black/8 bg-white/92 px-4 py-2 text-[13px] text-[var(--ink-600)] shadow-[0_10px_24px_rgba(17,17,17,0.05)]">
                Selecione ao menos um profissional para visualizar a agenda.
              </div>
            </div>
          ) : null}

          {hasProfessionals && !hasAppointments ? (
            <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center px-6 pt-24">
              <div className="rounded-full border border-black/8 bg-white/92 px-4 py-2 text-[13px] text-[var(--ink-600)] shadow-[0_10px_24px_rgba(17,17,17,0.05)]">
                Nenhum agendamento para os filtros selecionados neste dia.
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
