import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { obterAgendamentos, obterDentistas } from '../api/agenda'
import { getApiErrorMessage } from '../api/client'
import { getPacientes } from '../api/pacientes'
import AgendaBoard from '../components/agenda/AgendaBoard'
import AgendaProfessionalBoard from '../components/agenda/AgendaProfessionalBoard'
import AgendaToolbar from '../components/agenda/AgendaToolbar'
import {
  DENTIST_COLOR_PALETTE,
  DEFAULT_AGENDA_CONFIG,
  addDays,
  addMonths,
  getRangeEndExclusive,
  getRangeStart,
  mergeAgendaConfigs,
  parseAgendaTimeToMinutes,
  startOfDay,
} from '../components/agenda/agendaUtils'
import ModalAgendamento from '../components/agenda/ModalAgendamento'
import AppShell from '../components/AppShell'
import FeedbackMessage from '../components/FeedbackMessage'
import { useAuth } from '../hooks/useAuth'

function mapStatusToColor(status) {
  switch (String(status || '').toLowerCase().trim()) {
    case 'confirmado':
    case 'atendido':
      return 'green'
    case 'falta':
      return 'red'
    case 'cancelado':
      return 'gray'
    case 'remarcado':
      return 'pink'
    case 'pendente':
      return 'amber'
    default:
      return 'blue'
  }
}

function roundToNextSlot(date = new Date()) {
  const next = new Date(date)
  next.setSeconds(0, 0)

  const minutes = next.getMinutes()
  const roundedMinutes = minutes <= 30 ? 30 : 60

  if (roundedMinutes === 60) {
    next.setHours(next.getHours() + 1, 0, 0, 0)
  } else {
    next.setMinutes(30, 0, 0)
  }

  if (next.getHours() < 8) {
    next.setHours(8, 0, 0, 0)
  }

  return next
}

function toMinuteString(totalMinutes) {
  const safeMinute = Math.max(0, Number(totalMinutes) || 0)
  const hour = Math.floor(safeMinute / 60)
  const minute = safeMinute % 60

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function getCombinedAgendaConfig(dentistas, selectedDentistaIds) {
  if (dentistas.length === 0) {
    return DEFAULT_AGENDA_CONFIG
  }

  const selectedDentistas = selectedDentistaIds.length > 0
    ? dentistas.filter((dentista) => selectedDentistaIds.includes(dentista.id))
    : dentistas

  if (selectedDentistas.length === 0) {
    return DEFAULT_AGENDA_CONFIG
  }

  const merged = mergeAgendaConfigs(selectedDentistas)

  return {
    inicio: toMinuteString(merged.inicio),
    fim: toMinuteString(merged.fim),
    duracaoPadraoMinutos: merged.duracaoPadraoMinutos,
    diasDaSemana: merged.diasDaSemana,
  }
}

function toDateInputValue(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function toTimeInputValue(date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function buildAgendaProps(items, dentistaColorMap) {
  return items.map((item) => {
    const status = String(item.status || 'Agendado').trim()
    const start = new Date(item.dataHora)
    const end = new Date(start.getTime() + (item.duracaoMinutos * 60000))

    return {
      id: item.id,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      patient_name: item.pacienteNome,
      procedure: item.procedimento,
      status_color: mapStatusToColor(status),
      status_label: status,
      dentist_color: dentistaColorMap[item.dentistaId] || DENTIST_COLOR_PALETTE[0],
      raw: item,
    }
  })
}

export default function Agenda() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [anchorDate, setAnchorDate] = useState(() => new Date())
  const [dentistas, setDentistas] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [selectedDentistaIds, setSelectedDentistaIds] = useState([])
  const [hasInitializedDentistaSelection, setHasInitializedDentistaSelection] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState('Todos')
  const [viewMode, setViewMode] = useState('day')
  const [agendamentos, setAgendamentos] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [pageSuccess, setPageSuccess] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [selectedEventData, setSelectedEventData] = useState(null)

  const dentistaColorMap = useMemo(
    () =>
      dentistas.reduce((accumulator, dentista, index) => {
        accumulator[dentista.id] = DENTIST_COLOR_PALETTE[index % DENTIST_COLOR_PALETTE.length]
        return accumulator
      }, {}),
    [dentistas],
  )

  const visibleDentistas = useMemo(() => {
    return dentistas.filter((dentista) => selectedDentistaIds.includes(dentista.id))
  }, [dentistas, selectedDentistaIds])

  const activeAgendaConfig = useMemo(
    () => getCombinedAgendaConfig(dentistas, selectedDentistaIds),
    [dentistas, selectedDentistaIds],
  )

  const filteredAgendamentos = useMemo(() => {
    const rangeStart = getRangeStart(anchorDate, viewMode)
    const rangeEndExclusive = getRangeEndExclusive(anchorDate, viewMode)

    return agendamentos.filter((appointment) => {
      const appointmentDate = new Date(appointment.dataHora)
      const matchesDate = appointmentDate >= rangeStart && appointmentDate < rangeEndExclusive
      const matchesDentista = selectedDentistaIds.length === 0 || selectedDentistaIds.includes(appointment.dentistaId)
      const matchesStatus = selectedStatus === 'Todos' || appointment.status === selectedStatus

      return matchesDate && matchesDentista && matchesStatus
    })
  }, [agendamentos, anchorDate, selectedDentistaIds, selectedStatus, viewMode])

  const agendaProps = useMemo(
    () => buildAgendaProps(filteredAgendamentos, dentistaColorMap),
    [filteredAgendamentos, dentistaColorMap],
  )

  const loadAgenda = useCallback(async () => {
    setIsLoading(true)
    setPageError('')

    try {
      const start = getRangeStart(anchorDate, viewMode)
      const end = getRangeEndExclusive(anchorDate, viewMode)
      const response = await obterAgendamentos(start.toISOString(), end.toISOString())

      const visibleAppointments = (Array.isArray(response) ? response : []).filter(
        (appointment) => String(appointment.status || '').trim().toLowerCase() !== 'cancelado',
      )

      setAgendamentos(visibleAppointments)
    } catch (error) {
      setPageSuccess('')
      setPageError(getApiErrorMessage(error, 'Nao foi possivel carregar a agenda.'))
    } finally {
      setIsLoading(false)
    }
  }, [anchorDate, viewMode])

  useEffect(() => {
    queueMicrotask(() => {
      void loadReferenceData()
    })
  }, [])

  useEffect(() => {
    queueMicrotask(() => {
      void loadAgenda()
    })
  }, [loadAgenda])

  useEffect(() => {
    if (dentistas.length === 0 || hasInitializedDentistaSelection) {
      return
    }

    setSelectedDentistaIds(dentistas.map((dentista) => dentista.id))
    setHasInitializedDentistaSelection(true)
  }, [dentistas, hasInitializedDentistaSelection])

  useEffect(() => {
    const modalRequest = location.state?.openCreateModal

    if (!modalRequest || pacientes.length === 0) {
      return
    }

    const baseDate = roundToNextSlot(new Date())

    queueMicrotask(() => {
      setAnchorDate(baseDate)
      setPageSuccess('')
      setModalMode('create')
      setSelectedEventData({
        date: toDateInputValue(baseDate),
        time: toTimeInputValue(baseDate),
        pacienteId: modalRequest.patientId || '',
        patientName: modalRequest.patientName || '',
        dentistaId: visibleDentistas[0]?.id || dentistas[0]?.id || '',
      })
      setIsModalOpen(true)
      navigate(location.pathname, { replace: true, state: {} })
    })
  }, [location.pathname, location.state, navigate, pacientes.length, visibleDentistas, dentistas])

  async function loadReferenceData() {
    try {
      const [dentistasResponse, pacientesResponse] = await Promise.all([
        obterDentistas(),
        getPacientes(),
      ])

      setDentistas(Array.isArray(dentistasResponse) ? dentistasResponse : [])
      setPacientes(Array.isArray(pacientesResponse) ? pacientesResponse : [])
    } catch (error) {
      setPageSuccess('')
      setPageError(getApiErrorMessage(error, 'Nao foi possivel carregar os dados de apoio da agenda.'))
    }
  }

  function handleOpenCreateModal(dateIso, horario, dentistaId) {
    setPageSuccess('')
    setModalMode('create')

    const targetDentistaId = dentistaId || visibleDentistas[0]?.id || dentistas[0]?.id || ''
    const defaultConfig = dentistas.find((dentista) => String(dentista.id) === String(targetDentistaId))?.agendaConfig

    setSelectedEventData({
      date: toDateInputValue(new Date(dateIso)),
      time: horario,
      dentistaId: targetDentistaId,
      duracaoPadraoMinutos: Number(defaultConfig?.duracaoPadraoMinutos) || activeAgendaConfig.duracaoPadraoMinutos,
    })
    setIsModalOpen(true)
  }

  function handleOpenEditModal(agendamento) {
    setPageSuccess('')
    setModalMode('edit')
    setSelectedEventData(agendamento.raw)
    setIsModalOpen(true)
  }

  async function handleSaved(message = 'Agendamento salvo com sucesso.') {
    setPageError('')
    setPageSuccess('')

    const [agendamentosResult, referenciaResult] = await Promise.allSettled([
      loadAgenda(),
      loadReferenceData(),
    ])

    if (agendamentosResult.status === 'rejected' || referenciaResult.status === 'rejected') {
      const erro = agendamentosResult.reason || referenciaResult.reason
      setPageError(getApiErrorMessage(erro, 'Nao foi possivel atualizar os dados da agenda.'))
      return
    }

    setPageSuccess(message)
  }

  function closeModal() {
    setIsModalOpen(false)
    setSelectedEventData(null)
  }

  function toggleDentista(dentistaId) {
    setSelectedDentistaIds((current) => {
      if (current.includes(dentistaId)) {
        return current.filter((id) => id !== dentistaId)
      }

      return [...current, dentistaId]
    })
  }

  function toggleAllDentistas() {
    setSelectedDentistaIds((current) => {
      if (current.length === dentistas.length) {
        return []
      }

      return dentistas.map((dentista) => dentista.id)
    })
  }

  function handleNavigatePrevious() {
    setAnchorDate((current) => {
      if (viewMode === 'month') {
        return addMonths(current, -1)
      }

      if (viewMode === 'week') {
        return addDays(current, -7)
      }

      return addDays(current, -1)
    })
  }

  function handleNavigateNext() {
    setAnchorDate((current) => {
      if (viewMode === 'month') {
        return addMonths(current, 1)
      }

      if (viewMode === 'week') {
        return addDays(current, 7)
      }

      return addDays(current, 1)
    })
  }

  const modalInstanceKey = `${isModalOpen ? 'open' : 'closed'}-${modalMode}-${selectedEventData?.id || 'new'}`
  const normalizedAgendaConfig = {
    inicio: parseAgendaTimeToMinutes(activeAgendaConfig.inicio, 480),
    fim: parseAgendaTimeToMinutes(activeAgendaConfig.fim, 1080),
    duracaoPadraoMinutos: activeAgendaConfig.duracaoPadraoMinutos,
    diasDaSemana: activeAgendaConfig.diasDaSemana,
  }

  return (
    <>
      <AppShell
        title="Agenda Multi-profissional"
        subtitle=""
        user={user}
        onLogout={logout}
        actions={<></>}
      >
        <div className="space-y-4">
          <FeedbackMessage type="error" message={pageError} />
          <FeedbackMessage type="success" message={pageSuccess} />
          <FeedbackMessage type="info" message={isLoading ? 'Carregando agendamentos...' : ''} />

          <AgendaToolbar
            anchorDate={anchorDate}
            viewMode={viewMode}
            dentistas={dentistas}
            selectedDentistaIds={selectedDentistaIds}
            selectedStatus={selectedStatus}
            onPrevious={handleNavigatePrevious}
            onToday={() => setAnchorDate(startOfDay(new Date()))}
            onNext={handleNavigateNext}
            onOpenCreate={() => handleOpenCreateModal(anchorDate.toISOString(), '09:00', visibleDentistas[0]?.id || dentistas[0]?.id)}
            onToggleDentista={toggleDentista}
            onSelectAllDentistas={toggleAllDentistas}
            onStatusChange={setSelectedStatus}
            onViewModeChange={setViewMode}
          />

          {viewMode === 'day' ? (
            <AgendaProfessionalBoard
              anchorDate={anchorDate}
              dentistas={visibleDentistas}
              agendamentos={agendaProps}
              agendaConfig={normalizedAgendaConfig}
              onSlotClick={handleOpenCreateModal}
              onEventClick={handleOpenEditModal}
            />
          ) : (
            <AgendaBoard
              agendamentos={agendaProps}
              anchorDate={anchorDate}
              viewMode={viewMode}
              dentistas={dentistas}
              selectedDentistaId={selectedDentistaIds.length === 1 ? selectedDentistaIds[0] : ''}
              onPrevious={handleNavigatePrevious}
              onToday={() => setAnchorDate(startOfDay(new Date()))}
              onNext={handleNavigateNext}
              onViewModeChange={setViewMode}
              onSlotClick={handleOpenCreateModal}
              onEventClick={handleOpenEditModal}
              onSelectDate={(date) => {
                setAnchorDate(startOfDay(date))
                setViewMode('day')
              }}
              agendaConfig={activeAgendaConfig}
            />
          )}
        </div>
      </AppShell>

      <ModalAgendamento
        key={modalInstanceKey}
        isOpen={isModalOpen}
        mode={modalMode}
        slotData={modalMode === 'create' ? selectedEventData : null}
        selectedEventData={modalMode === 'edit' ? selectedEventData : null}
        pacientes={pacientes}
        dentistas={dentistas}
        selectedAgendaConfig={activeAgendaConfig}
        onClose={closeModal}
        onSaved={handleSaved}
      />
    </>
  )
}
