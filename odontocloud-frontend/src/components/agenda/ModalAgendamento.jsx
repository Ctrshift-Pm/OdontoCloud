import { useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { atualizarAgendamento, criarAgendamento, excluirAgendamento } from '../../api/agenda'
import { createPaciente } from '../../api/pacientes'
import { getApiErrorMessage } from '../../api/client'
import FeedbackMessage from '../FeedbackMessage'
import Modal from '../Modal'

function toDateInputValue(value) {
  const date = value instanceof Date ? value : new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function toTimeInputValue(value) {
  const date = value instanceof Date ? value : new Date(value)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function sanitizeDigits(value) {
  return String(value || '').replace(/\D/g, '')
}

const STATUS_OPTIONS = ['Agendado', 'Confirmado', 'Atendido', 'Pendente', 'Remarcado', 'Falta', 'Cancelado']
const DURATION_OPTIONS = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 135, 150]

function getDefaultDurationFromConfig(config) {
  const duration = Number(config?.duracaoPadraoMinutos)
  return Number.isFinite(duration) && duration > 0 ? duration : 60
}

function buildDefaultValues({ mode, selectedEventData, slotData, dentistas, pacientes, selectedAgendaConfig }) {
  if (mode === 'edit' && selectedEventData) {
    const date = new Date(selectedEventData.dataHora)
    const paciente = pacientes.find((item) => item.id === selectedEventData.pacienteId)

    return {
      pacienteId: selectedEventData.pacienteId || '',
      patientSearch: paciente?.nome || selectedEventData.pacienteNome || '',
      dentistaId: selectedEventData.dentistaId || '',
      procedimento: selectedEventData.procedimento || '',
      data: toDateInputValue(date),
      horario: toTimeInputValue(date),
      duracaoMinutos: selectedEventData.duracaoMinutos || 60,
      status: selectedEventData.status || 'Agendado',
      observacoes: selectedEventData.observacoes || '',
      novoPacienteNome: '',
      novoPacienteTelefone: '',
      novoPacienteCpf: '',
    }
  }

    return {
    pacienteId: slotData?.patientId || '',
    patientSearch: slotData?.patientName || '',
      dentistaId: slotData?.dentistaId || dentistas[0]?.id || '',
    procedimento: '',
    data: slotData?.date || toDateInputValue(new Date()),
    horario: slotData?.time || '09:00',
      duracaoMinutos: getDefaultDurationFromConfig(
        slotData?.duracaoPadraoMinutos
          ? { duracaoPadraoMinutos: slotData.duracaoPadraoMinutos }
          : selectedAgendaConfig,
      ),
    status: 'Agendado',
    observacoes: '',
    novoPacienteNome: '',
    novoPacienteTelefone: '',
    novoPacienteCpf: '',
  }
}

function formatPatientMeta(paciente) {
  return [paciente.cpf, paciente.telefoneWhatsapp].filter(Boolean).join(' • ')
}

export default function ModalAgendamento({
  isOpen,
  mode,
  slotData,
  selectedEventData,
  pacientes,
  dentistas,
  selectedAgendaConfig,
  onClose,
  onSaved,
}) {
  const [patientMode, setPatientMode] = useState('existente')
  const [feedbackError, setFeedbackError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false)

  const defaultValues = useMemo(
    () => buildDefaultValues({
      mode,
      selectedEventData,
      slotData,
      dentistas,
      pacientes,
      selectedAgendaConfig,
    }),
    [mode, selectedEventData, slotData, dentistas, selectedAgendaConfig, pacientes],
  )

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues })

  const patientSearch = useWatch({ control, name: 'patientSearch' })
  const selectedPacienteId = useWatch({ control, name: 'pacienteId' })
  const selectedDentistaId = useWatch({ control, name: 'dentistaId' })

  const selectedAgendaForForm = useMemo(() => {
    const bySelection = dentistas.find((dentista) => dentista.id === selectedDentistaId)?.agendaConfig
    return bySelection || selectedAgendaConfig
  }, [dentistas, selectedDentistaId, selectedAgendaConfig])

  const filteredPacientes = useMemo(() => {
    const normalizedSearch = String(patientSearch || '').trim().toLowerCase()

    if (!normalizedSearch) {
      return pacientes.slice(0, 8)
    }

    return pacientes
      .filter((paciente) => {
        const haystack = [paciente.nome, paciente.cpf, paciente.telefoneWhatsapp]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return haystack.includes(normalizedSearch)
      })
      .slice(0, 8)
  }, [pacientes, patientSearch])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    reset(defaultValues)
  }, [defaultValues, isOpen, reset])

  useEffect(() => {
    if (!isOpen || mode !== 'create' || !selectedAgendaForForm) {
      return
    }

    setValue('duracaoMinutos', getDefaultDurationFromConfig(selectedAgendaForForm), {
      shouldDirty: false,
      shouldValidate: true,
    })
  }, [isOpen, mode, selectedAgendaForForm, setValue])

  function handlePatientSearchChange(value) {
    setFeedbackError('')
    setValue('patientSearch', value, {
      shouldDirty: true,
      shouldValidate: false,
    })

    const matchingPaciente = pacientes.find((paciente) => paciente.id === selectedPacienteId)

    if (!matchingPaciente || matchingPaciente.nome !== value) {
      setValue('pacienteId', '', {
        shouldDirty: true,
        shouldValidate: true,
      })
    }
  }

  function handleSelectPaciente(paciente) {
    setValue('patientSearch', paciente.nome, {
      shouldDirty: true,
      shouldValidate: false,
    })
    setValue('pacienteId', paciente.id, {
      shouldDirty: true,
      shouldValidate: true,
    })
    setIsPatientDropdownOpen(false)
  }

  async function handleSave(values) {
    setFeedbackError('')

    try {
      let pacienteId = values.pacienteId

      if (mode === 'create' && patientMode === 'novo') {
        const novoPaciente = await createPaciente({
          nome: values.novoPacienteNome.trim(),
          cpf: sanitizeDigits(values.novoPacienteCpf),
          dataNascimento: null,
          telefoneWhatsapp: sanitizeDigits(values.novoPacienteTelefone),
        })

        pacienteId = novoPaciente.id
      }

      const payload = {
        pacienteId,
        dentistaId: values.dentistaId,
        dataHora: new Date(`${values.data}T${values.horario}:00`).toISOString(),
        duracaoMinutos: Number(values.duracaoMinutos),
        status: values.status,
        procedimento: values.procedimento.trim(),
        observacoes: values.observacoes?.trim() || null,
      }

      if (mode === 'edit' && selectedEventData?.id) {
        await atualizarAgendamento(selectedEventData.id, payload)
      } else {
        await criarAgendamento(payload)
      }

      await onSaved?.(mode === 'edit' ? 'Agendamento atualizado com sucesso.' : 'Agendamento criado com sucesso.')
      onClose()
    } catch (error) {
      setFeedbackError(getApiErrorMessage(error, 'Nao foi possivel salvar o agendamento.'))
    }
  }

  async function handleDeleteAppointment() {
    if (!selectedEventData?.id) {
      return
    }

    const confirmed = window.confirm('Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.')
    if (!confirmed) {
      return
    }

    setFeedbackError('')
    setIsDeleting(true)

    try {
      await excluirAgendamento(selectedEventData.id)
      onClose()
      await onSaved?.('Agendamento excluido com sucesso.')
    } catch (error) {
      setFeedbackError(getApiErrorMessage(error, 'Nao foi possivel excluir o agendamento.'))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'edit' ? 'Editar Agendamento' : 'Novo Agendamento'}
      description={mode === 'edit'
        ? 'Atualize data, status e procedimento sem perder o contexto da agenda.'
        : 'Busque um paciente existente ou cadastre um novo sem sair do fluxo.'}
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {mode === 'edit' ? (
              <button
                type="button"
                onClick={handleDeleteAppointment}
                disabled={isSubmitting || isDeleting}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                  <path
                    d="M5 7h14m-9 0V5.8c0-.4.3-.8.8-.8h2.4c.5 0 .8.4.8.8V7m-7.2 0 .7 10.2c0 .9.7 1.6 1.6 1.6h4.2c.9 0 1.6-.7 1.6-1.6L16.2 7M10 10.5v4.5m4-4.5v4.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {isDeleting ? 'Excluindo...' : 'Excluir'}
              </button>
            ) : null}
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="btn-secondary px-4 py-2.5"
              onClick={onClose}
              disabled={isSubmitting || isDeleting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="modal-agendamento-form"
              className="btn-primary px-4 py-2.5"
              disabled={isSubmitting || isDeleting}
            >
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      }
    >
      <form id="modal-agendamento-form" className="space-y-4" onSubmit={handleSubmit(handleSave)}>
        <FeedbackMessage type="error" message={feedbackError} />

        {mode === 'create' ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPatientMode('existente')}
              className={`rounded-lg px-3 py-2 text-[13px] font-medium transition ${
                patientMode === 'existente'
                  ? 'bg-[var(--brand-500)] text-white'
                  : 'border border-black/10 bg-white text-[var(--ink-700)]'
              }`}
            >
              Paciente existente
            </button>
            <button
              type="button"
              onClick={() => setPatientMode('novo')}
              className={`rounded-lg px-3 py-2 text-[13px] font-medium transition ${
                patientMode === 'novo'
                  ? 'bg-[var(--brand-500)] text-white'
                  : 'border border-black/10 bg-white text-[var(--ink-700)]'
              }`}
            >
              + Novo paciente
            </button>
          </div>
        ) : null}

        {patientMode === 'existente' || mode === 'edit' ? (
          <div className="space-y-2">
            <input
              type="hidden"
              {...register('pacienteId', {
                required: 'Selecione o paciente na lista ou use + Novo paciente.',
              })}
            />

            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-[var(--ink-700)]">Paciente</span>
              <div className="relative">
                <input
                  type="text"
                  value={patientSearch || ''}
                  onFocus={() => setIsPatientDropdownOpen(true)}
                  onBlur={() => {
                    window.setTimeout(() => {
                      setIsPatientDropdownOpen(false)
                    }, 120)
                  }}
                  onChange={(event) => handlePatientSearchChange(event.target.value)}
                  className="w-full rounded-md border border-black/15 bg-white px-3.5 py-2.5 text-[14px] text-[var(--ink-900)] outline-none focus:border-[var(--brand-500)]"
                  placeholder="Digite nome, CPF ou telefone"
                />

                {isPatientDropdownOpen ? (
                  <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xl">
                    {filteredPacientes.length > 0 ? (
                      filteredPacientes.map((paciente) => (
                        <button
                          key={paciente.id}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => handleSelectPaciente(paciente)}
                          className="flex w-full flex-col items-start gap-1 border-b border-black/5 px-4 py-3 text-left transition hover:bg-[var(--surface-muted)] last:border-b-0"
                        >
                          <span className="text-sm font-semibold text-[var(--ink-900)]">{paciente.nome}</span>
                          <span className="text-xs text-[var(--ink-500)]">{formatPatientMeta(paciente) || 'Sem metadados adicionais'}</span>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-[var(--ink-500)]">
                        Nenhum paciente encontrado. Use a aba <strong>+ Novo paciente</strong>.
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </label>

            {!selectedPacienteId && patientSearch ? (
              <div className="rounded-xl bg-amber-50 px-3 py-2 text-[12px] text-amber-700">
                Selecione um paciente do autocomplete ou troque para <strong>+ Novo paciente</strong>.
              </div>
            ) : null}

            {errors.pacienteId?.message ? (
              <span className="block text-sm text-[var(--danger-600)]">{errors.pacienteId.message}</span>
            ) : null}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md bg-[#E6F1FB] px-3 py-2 text-[12px] text-[#185FA5]">
              Cadastro rapido do novo paciente
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium text-[var(--ink-700)]">Nome *</span>
                <input
                  {...register('novoPacienteNome', { required: patientMode === 'novo' ? 'Informe o nome.' : false })}
                  className="w-full rounded-md border border-black/15 bg-white px-3.5 py-2.5 text-[14px] text-[var(--ink-900)] outline-none focus:border-[var(--brand-500)]"
                  placeholder="Nome completo"
                />
                {errors.novoPacienteNome?.message ? <span className="mt-1 block text-sm text-[var(--danger-600)]">{errors.novoPacienteNome.message}</span> : null}
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium text-[var(--ink-700)]">Telefone *</span>
                <input
                  {...register('novoPacienteTelefone', { required: patientMode === 'novo' ? 'Informe o telefone.' : false })}
                  className="w-full rounded-md border border-black/15 bg-white px-3.5 py-2.5 text-[14px] text-[var(--ink-900)] outline-none focus:border-[var(--brand-500)]"
                  placeholder="(11) 99999-9999"
                />
                {errors.novoPacienteTelefone?.message ? <span className="mt-1 block text-sm text-[var(--danger-600)]">{errors.novoPacienteTelefone.message}</span> : null}
              </label>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-[var(--ink-700)]">CPF *</span>
              <input
                {...register('novoPacienteCpf', { required: patientMode === 'novo' ? 'Informe o CPF.' : false })}
                className="w-full rounded-md border border-black/15 bg-white px-3.5 py-2.5 text-[14px] text-[var(--ink-900)] outline-none focus:border-[var(--brand-500)]"
                placeholder="000.000.000-00"
              />
              {errors.novoPacienteCpf?.message ? <span className="mt-1 block text-sm text-[var(--danger-600)]">{errors.novoPacienteCpf.message}</span> : null}
            </label>
          </div>
        )}

        <div className="border-t border-black/8 pt-4" />

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-[var(--ink-700)]">Dentista</span>
            <select
              {...register('dentistaId', { required: 'Selecione o dentista.' })}
              className="w-full rounded-md border border-black/15 bg-white px-3.5 py-2.5 text-[14px] text-[var(--ink-900)] outline-none focus:border-[var(--brand-500)]"
            >
              <option value="">Selecione</option>
              {dentistas.map((dentista) => (
                <option key={dentista.id} value={dentista.id}>
                  {dentista.nome}
                </option>
              ))}
            </select>
            {errors.dentistaId?.message ? <span className="mt-1 block text-sm text-[var(--danger-600)]">{errors.dentistaId.message}</span> : null}
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-[var(--ink-700)]">Procedimento</span>
            <input
              {...register('procedimento', { required: 'Informe o procedimento.' })}
              className="w-full rounded-md border border-black/15 bg-white px-3.5 py-2.5 text-[14px] text-[var(--ink-900)] outline-none focus:border-[var(--brand-500)]"
              placeholder="Ex.: Avaliacao"
            />
            {errors.procedimento?.message ? <span className="mt-1 block text-sm text-[var(--danger-600)]">{errors.procedimento.message}</span> : null}
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-[var(--ink-700)]">Data</span>
            <input
              type="date"
              {...register('data', { required: 'Informe a data.' })}
              className="w-full rounded-md border border-black/15 bg-white px-3.5 py-2.5 text-[14px] text-[var(--ink-900)] outline-none focus:border-[var(--brand-500)]"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-[var(--ink-700)]">Horario</span>
            <input
              type="time"
              {...register('horario', { required: 'Informe o horario.' })}
              className="w-full rounded-md border border-black/15 bg-white px-3.5 py-2.5 text-[14px] text-[var(--ink-900)] outline-none focus:border-[var(--brand-500)]"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-[var(--ink-700)]">Duracao</span>
            <select
              {...register('duracaoMinutos', { required: 'Informe a duracao.' })}
              className="w-full rounded-md border border-black/15 bg-white px-3.5 py-2.5 text-[14px] text-[var(--ink-900)] outline-none focus:border-[var(--brand-500)]"
            >
              {DURATION_OPTIONS.map((value) => (
                <option key={value} value={value}>{value} min</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-[var(--ink-700)]">Status</span>
            <select
              {...register('status', { required: 'Informe o status.' })}
              className="w-full rounded-md border border-black/15 bg-white px-3.5 py-2.5 text-[14px] text-[var(--ink-900)] outline-none focus:border-[var(--brand-500)]"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-[var(--ink-700)]">Observacoes</span>
          <textarea
            rows={4}
            {...register('observacoes')}
            className="w-full rounded-md border border-black/15 bg-white px-3.5 py-2.5 text-[14px] text-[var(--ink-900)] outline-none focus:border-[var(--brand-500)]"
            placeholder="Notas internas..."
          />
        </label>

        <label className="flex items-center gap-2 rounded-md bg-[var(--brand-50)] px-3 py-2 text-[13px] text-[var(--brand-700)]">
          <input type="checkbox" defaultChecked className="accent-[var(--brand-500)]" />
          <span>Enviar confirmacao via WhatsApp</span>
        </label>
      </form>
    </Modal>
  )
}
