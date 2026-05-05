import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { obterAgendamentos, obterDentistas } from '../api/agenda'
import { getApiErrorMessage } from '../api/client'
import { getPacientes } from '../api/pacientes'
import AgendaBoard from '../components/agenda/AgendaBoard'
import {
  DENTIST_COLOR_PALETTE,
  addDays,
  addMonths,
  DEFAULT_AGENDA_CONFIG,
  parseAgendaTimeToMinutes,
  getRangeEndExclusive,
  getRangeStart,
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

function getDentistaAgendaConfig(dentistas, selectedDentistaId) {
  if (dentistas.length === 0) {
    return DEFAULT_AGENDA_CONFIG
  }

  const defaultConfig = DEFAULT_AGENDA_CONFIG
  const selected = selectedDentistaId
    ? dentistas.find((dentista) => dentista.id === selectedDentistaId)
    : null

  if (selected?.agendaConfig) {
    return selected.agendaConfig
  }

  if (!selectedDentistaId) {
    const validConfigs = dentistas
      .map((dentista) => dentista.agendaConfig)
      .filter(Boolean)

    if (validConfigs.length === 0) {
      return {
        ...defaultConfig,
        diasDaSemana: [0, 1, 2, 3, 4, 5, 6],
      }
    }

    const dias = new Set()
    for (const config of validConfigs) {
      if (Array.isArray(config.diasDaSemana)) {
        config.diasDaSemana.forEach((dia) => {
          dias.add(dia)
        })
      }
    }

    const start = Math.min(
      ...validConfigs.map((config) => parseAgendaTimeToMinutes(config?.inicio, parseAgendaTimeToMinutes(defaultConfig.inicio, 480))),
    )
    const end = Math.max(
      ...validConfigs.map((config) => parseAgendaTimeToMinutes(config?.fim, parseAgendaTimeToMinutes(defaultConfig.fim, 1080))),
    )
    const slot = Math.min(
      ...validConfigs.map((config) => config?.duracaoPadraoMinutos ?? defaultConfig.duracaoPadraoMinutos),
    )

    return {
      inicio: toMinuteString(start),
      fim: toMinuteString(end),
      duracaoPadraoMinutos: Number.isInteger(slot) && slot > 0 ? slot : defaultConfig.duracaoPadraoMinutos,
      diasDaSemana: dias.size > 0 ? Array.from(dias).sort((left, right) => left - right) : [0, 1, 2, 3, 4, 5, 6],
    }
  }

  return defaultConfig
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

function moveAnchorDate(currentDate, viewMode, direction) {
  if (viewMode === 'day') {
    return addDays(currentDate, direction)
  }

  if (viewMode === 'month') {
    return addMonths(currentDate, direction)
  }

  return addDays(currentDate, direction * 7)
}

export default function Agenda() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [anchorDate, setAnchorDate] = useState(() => new Date())
  const [viewMode, setViewMode] = useState('week')
  const [dentistas, setDentistas] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [selectedDentistaId, setSelectedDentistaId] = useState('')
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

  const agendaProps = useMemo(
    () => buildAgendaProps(agendamentos, dentistaColorMap),
    [agendamentos, dentistaColorMap],
  )

  const activeAgendaConfig = useMemo(
    () => getDentistaAgendaConfig(dentistas, selectedDentistaId),
    [dentistas, selectedDentistaId],
  )

  const loadAgenda = useCallback(async () => {
    setIsLoading(true)
    setPageError('')

    try {
      const start = getRangeStart(anchorDate, viewMode)
      const end = getRangeEndExclusive(anchorDate, viewMode)
      const response = await obterAgendamentos(
        start.toISOString(),
        end.toISOString(),
        selectedDentistaId || undefined,
      )

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
  }, [anchorDate, selectedDentistaId, viewMode])

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
    const modalRequest = location.state?.openCreateModal

    if (!modalRequest || pacientes.length === 0) {
      return
    }

    const baseDate = roundToNextSlot(new Date())

    queueMicrotask(() => {
      setAnchorDate(baseDate)
      setViewMode('day')
      setPageSuccess('')
      setModalMode('create')
      setSelectedEventData({
        date: toDateInputValue(baseDate),
        time: toTimeInputValue(baseDate),
        patientId: modalRequest.patientId || '',
        patientName: modalRequest.patientName || '',
      })
      setIsModalOpen(true)
      navigate(location.pathname, { replace: true, state: {} })
    })
  }, [location.pathname, location.state, navigate, pacientes.length])

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

  function handleOpenCreateModal(date, horario, preselectedPatient = null) {
    setPageSuccess('')
    setModalMode('create')
    const targetDentistaId = selectedDentistaId || (dentistas[0]?.id || '')
    const defaultConfig = getDentistaAgendaConfig(dentistas, targetDentistaId)

    setSelectedEventData({
      date,
      time: horario,
      dentistaId: targetDentistaId,
      patientId: preselectedPatient?.patientId || '',
      patientName: preselectedPatient?.patientName || '',
      duracaoPadraoMinutos: defaultConfig.duracaoPadraoMinutos,
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
    await Promise.all([loadAgenda(), loadReferenceData()])
    setPageSuccess(message)
  }

  function closeModal() {
    setIsModalOpen(false)
    setSelectedEventData(null)
  }

  const modalInstanceKey = `${isModalOpen ? 'open' : 'closed'}-${modalMode}-${selectedEventData?.id || 'new'}`

  return (
    <>
      <AppShell
        title="Agenda"
        subtitle="Grade diaria, semanal e mensal com identidade visual separando dentista e status."
        user={user}
        onLogout={logout}
        actions={
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <label className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[var(--ink-700)]">
              <span>Dentista</span>
              <select
                value={selectedDentistaId}
                onChange={(event) => setSelectedDentistaId(event.target.value)}
                className="bg-transparent text-sm text-[var(--ink-900)] outline-none"
              >
                <option value="">Todos</option>
                {dentistas.map((dentista) => (
                  <option key={dentista.id} value={dentista.id}>
                    {dentista.nome}
                  </option>
                ))}
              </select>
            </label>
          </div>
        }
      >
        <div className="space-y-6">
          <FeedbackMessage type="error" message={pageError} />
          <FeedbackMessage type="success" message={pageSuccess} />
          <FeedbackMessage type="info" message={isLoading ? 'Carregando agendamentos...' : ''} />

          <AgendaBoard
            agendamentos={agendaProps}
            anchorDate={anchorDate}
            viewMode={viewMode}
            agendaConfig={activeAgendaConfig}
            onPrevious={() => setAnchorDate((current) => moveAnchorDate(current, viewMode, -1))}
            onToday={() => setAnchorDate(startOfDay(new Date()))}
            onNext={() => setAnchorDate((current) => moveAnchorDate(current, viewMode, 1))}
            onViewModeChange={setViewMode}
            onSlotClick={handleOpenCreateModal}
            onEventClick={handleOpenEditModal}
            onSelectDate={(date) => {
              setAnchorDate(date)
              setViewMode('day')
            }}
          />
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
