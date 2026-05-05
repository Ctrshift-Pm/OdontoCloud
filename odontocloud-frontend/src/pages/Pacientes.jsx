import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { criarPaciente, getPacientes } from '../api/pacientes'
import { getApiErrorMessage } from '../api/client'
import AppShell from '../components/AppShell'
import FeedbackMessage from '../components/FeedbackMessage'
import Modal from '../components/Modal'
import TextField from '../components/TextField'
import { useAuth } from '../hooks/useAuth'

function onlyDigits(value) {
  return value.replace(/\D/g, '')
}

function isValidCpf(value) {
  const digits = onlyDigits(value || '')

  if (digits.length !== 11 || new Set(digits).size === 1) {
    return false
  }

  function calculateCheckDigit(length) {
    let sum = 0

    for (let index = 0; index < length; index += 1) {
      sum += Number(digits[index]) * ((length + 1) - index)
    }

    const remainder = sum % 11
    return remainder < 2 ? 0 : 11 - remainder
  }

  return Number(digits[9]) === calculateCheckDigit(9) && Number(digits[10]) === calculateCheckDigit(10)
}

function maskCpfInput(value) {
  const digits = onlyDigits(value || '').slice(0, 11)

  if (digits.length <= 3) {
    return digits
  }

  if (digits.length <= 6) {
    return digits.replace(/(\d{3})(\d+)/, '$1.$2')
  }

  if (digits.length <= 9) {
    return digits.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3')
  }

  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d+)/, '$1.$2.$3-$4')
}

function maskPhoneInput(value) {
  const digits = onlyDigits(value || '').slice(0, 11)

  if (digits.length <= 2) {
    return digits
  }

  if (digits.length <= 7) {
    return digits.replace(/(\d{2})(\d+)/, '($1) $2')
  }

  return digits.replace(/(\d{2})(\d{5})(\d+)/, '($1) $2-$3')
}

function formatCpf(value) {
  const digits = onlyDigits(value || '').slice(0, 11)

  if (digits.length !== 11) {
    return value || 'Nao informado'
  }

  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

function formatPhone(value) {
  const digits = onlyDigits(value || '')

  if (!digits) {
    return 'Nao informado'
  }

  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }

  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }

  return value
}

function formatDate(value) {
  if (!value) {
    return 'Nao informada'
  }

  const date = new Date(`${value}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('pt-BR').format(date)
}

function toIsoDate(value) {
  if (!value) {
    return null
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value
  }

  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    return null
  }

  return parsedDate.toISOString().slice(0, 10)
}

function extractApiValidationErrors(error) {
  const errors = error?.response?.data?.errors

  if (!errors || typeof errors !== 'object') {
    return {}
  }

  return Object.entries(errors).reduce((accumulator, [key, messages]) => {
    const normalizedMessages = Array.isArray(messages) ? messages.filter(Boolean) : [messages].filter(Boolean)

    if (normalizedMessages.length === 0) {
      return accumulator
    }

    accumulator[key] = normalizedMessages
    return accumulator
  }, {})
}

function mapApiFieldName(fieldName) {
  const normalized = (fieldName || '')
    .split('.')
    .at(-1)
    ?.replace(/[^a-zA-Z]/g, '')
    .toLowerCase()

  const fieldMap = {
    nome: 'nome',
    cpf: 'cpf',
    datanascimento: 'dataNascimento',
    telefonewhatsapp: 'telefoneWhatsapp',
    telefone: 'telefoneWhatsapp',
  }

  return fieldMap[normalized] || null
}

function isPacienteAtivo(paciente) {
  const status = String(paciente.status || 'Ativo').toLowerCase()
  return status === 'ativo'
}

function hasValidatedWhatsapp(paciente) {
  return onlyDigits(paciente.telefoneWhatsapp || '').length >= 10
}

function isRetornoPendente(paciente) {
  return String(paciente.status || '').toLowerCase() === 'retorno'
}

function MetricCard({ label, value, tone = 'default' }) {
  const toneMap = {
    default: 'bg-white text-[var(--ink-900)]',
    blue: 'bg-sky-50 text-sky-900',
    green: 'bg-emerald-50 text-emerald-900',
    amber: 'bg-amber-50 text-amber-900',
  }

  return (
    <div className={`rounded-[24px] border border-black/6 p-5 ${toneMap[tone] || toneMap.default}`}>
      <div className="text-sm text-[var(--ink-500)]">{label}</div>
      <div className="mt-3 text-3xl font-semibold">{value}</div>
    </div>
  )
}

function ActionIconButton({ children, title, ...props }) {
  return (
    <button
      type="button"
      title={title}
      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-black/8 bg-white text-[var(--ink-600)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--ink-900)]"
      {...props}
    >
      {children}
    </button>
  )
}

export default function Pacientes() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [pacientes, setPacientes] = useState([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [pageError, setPageError] = useState('')
  const [modalError, setModalError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [viewMode, setViewMode] = useState('lista')

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      nome: '',
      cpf: '',
      dataNascimento: '',
      telefoneWhatsapp: '',
    },
  })

  async function loadPacientes() {
    setPageError('')
    setIsLoading(true)

    try {
      const data = await getPacientes()
      setPacientes(Array.isArray(data) ? data : [])
    } catch (error) {
      setPageError(getApiErrorMessage(error, 'Nao foi possivel carregar os pacientes.'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      void loadPacientes()
    })
  }, [])

  async function onSubmit(values) {
    setModalError('')
    setSuccessMessage('')
    clearErrors()

    try {
      await criarPaciente({
        Nome: values.nome.trim(),
        Cpf: onlyDigits(values.cpf),
        DataNascimento: toIsoDate(values.dataNascimento),
        TelefoneWhatsapp: onlyDigits(values.telefoneWhatsapp),
      })

      setIsModalOpen(false)
      reset()
      await loadPacientes()
      setSuccessMessage('Paciente cadastrado com sucesso.')
    } catch (error) {
      const apiValidationErrors = extractApiValidationErrors(error)
      const genericMessages = []

      Object.entries(apiValidationErrors).forEach(([fieldName, messages]) => {
        const mappedFieldName = mapApiFieldName(fieldName)
        const message = messages.join(' ')

        if (mappedFieldName) {
          setError(mappedFieldName, {
            type: 'server',
            message,
          })
          return
        }

        genericMessages.push(message)
      })

      if (genericMessages.length > 0) {
        setModalError(genericMessages.join(' '))
        return
      }

      setModalError(getApiErrorMessage(error, 'Nao foi possivel cadastrar o paciente.'))
    }
  }

  function openModal() {
    setModalError('')
    setSuccessMessage('')
    clearErrors()
    setIsModalOpen(true)
  }

  function closeModal() {
    setModalError('')
    clearErrors()
    reset()
    setIsModalOpen(false)
  }

  const normalizedSearch = search.trim().toLowerCase()
  const filteredPacientes = pacientes.filter((paciente) => {
    if (!normalizedSearch) {
      return true
    }

    const haystack = [
      paciente.nome,
      paciente.cpf,
      paciente.telefoneWhatsapp,
      paciente.email,
      paciente.convenio,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(normalizedSearch)
  })

  const metrics = useMemo(() => ({
    total: pacientes.length,
    ativos: pacientes.filter(isPacienteAtivo).length,
    whatsappValidado: pacientes.filter(hasValidatedWhatsapp).length,
    retornosPendentes: pacientes.filter(isRetornoPendente).length,
  }), [pacientes])

  return (
    <>
      <AppShell
        title="Pacientes / CRM"
        subtitle="Base de pacientes, indicadores operacionais e ações rápidas para recepção."
        user={user}
        onLogout={logout}
        actions={
          <button type="button" className="btn-primary w-full sm:w-auto" onClick={openModal}>
            Novo Paciente
          </button>
        }
      >
        <div className="space-y-6">
          <FeedbackMessage type="success" message={successMessage} />
          <FeedbackMessage type="error" message={pageError} />

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Total de Pacientes" value={metrics.total} tone="default" />
            <MetricCard label="Ativos" value={metrics.ativos} tone="green" />
            <MetricCard label="WhatsApp Validado" value={metrics.whatsappValidado} tone="blue" />
            <MetricCard label="Retornos Pendentes" value={metrics.retornosPendentes} tone="amber" />
          </section>

          <section className="surface-card p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[var(--ink-900)]">Base de pacientes</h2>
                <p className="mt-1 text-sm text-[var(--ink-500)]">
                  Busque, acompanhe e inicie novos atendimentos sem sair do CRM.
                </p>
              </div>

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="inline-flex items-center gap-2 rounded-2xl border border-black/8 bg-[var(--surface-muted)] p-1.5">
                  <button
                    type="button"
                    onClick={() => setViewMode('lista')}
                    className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                      viewMode === 'lista' ? 'bg-white text-[var(--ink-900)] shadow-sm' : 'text-[var(--ink-500)]'
                    }`}
                  >
                    Lista
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('kanban')}
                    className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                      viewMode === 'kanban' ? 'bg-white text-[var(--ink-900)] shadow-sm' : 'text-[var(--ink-500)]'
                    }`}
                  >
                    Kanban
                  </button>
                </div>

                <div className="input-shell min-w-0 lg:w-[380px]">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-[var(--ink-500)]" aria-hidden="true">
                    <path
                      d="M10.5 18a7.5 7.5 0 1 1 5.3-2.2L21 21"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar por nome, CPF ou telefone"
                    className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-[var(--ink-900)] outline-none placeholder:text-[var(--ink-500)]"
                  />
                </div>
              </div>
            </div>

            {viewMode === 'kanban' ? (
              <div className="mt-6 rounded-[28px] border border-dashed border-black/10 bg-[var(--surface-muted)] px-6 py-10 text-center">
                <div className="text-sm font-semibold text-[var(--ink-900)]">Visão Kanban em preparação</div>
                <p className="mt-2 text-sm text-[var(--ink-500)]">
                  O controle já está pronto. A distribuição por colunas entra na próxima sprint.
                </p>
              </div>
            ) : (
              <div className="mt-6 overflow-hidden rounded-3xl border border-black/5">
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead className="bg-stone-50">
                      <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-500)]">
                        <th className="px-4 py-4">Nome</th>
                        <th className="px-4 py-4">CPF</th>
                        <th className="px-4 py-4">Telefone</th>
                        <th className="px-4 py-4">Nascimento</th>
                        <th className="px-4 py-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white text-sm text-[var(--ink-700)]">
                      {isLoading ? (
                        <tr>
                          <td className="px-4 py-10 text-center text-[var(--ink-500)]" colSpan={5}>
                            Carregando pacientes...
                          </td>
                        </tr>
                      ) : filteredPacientes.length === 0 ? (
                        <tr>
                          <td className="px-4 py-10 text-center text-[var(--ink-500)]" colSpan={5}>
                            Nenhum paciente encontrado para o filtro informado.
                          </td>
                        </tr>
                      ) : (
                        filteredPacientes.map((paciente) => (
                          <tr key={paciente.id} className="border-t border-black/5">
                            <td className="px-4 py-4">
                              <div className="font-semibold text-[var(--ink-900)]">{paciente.nome}</div>
                              <div className="mt-1 text-xs text-[var(--ink-500)]">
                                {paciente.status || 'Ativo'}
                              </div>
                            </td>
                            <td className="px-4 py-4 font-mono text-xs">{formatCpf(paciente.cpf)}</td>
                            <td className="px-4 py-4">{formatPhone(paciente.telefoneWhatsapp)}</td>
                            <td className="px-4 py-4">{formatDate(paciente.dataNascimento)}</td>
                            <td className="px-4 py-4">
                              <div className="flex justify-end gap-2">
                                <a
                                  href={hasValidatedWhatsapp(paciente) ? `https://wa.me/55${onlyDigits(paciente.telefoneWhatsapp)}` : undefined}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border transition ${
                                    hasValidatedWhatsapp(paciente)
                                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                      : 'cursor-not-allowed border-black/8 bg-stone-50 text-[var(--ink-400)]'
                                  }`}
                                  title="Abrir conversa no WhatsApp"
                                  onClick={(event) => {
                                    if (!hasValidatedWhatsapp(paciente)) {
                                      event.preventDefault()
                                    }
                                  }}
                                >
                                  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                                    <path
                                      d="M20 11.5a8 8 0 0 1-11.7 7l-4.3 1 1.1-4A8 8 0 1 1 20 11.5Zm-4.2 2c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1-.1.2-.6.8-.8 1-.1.1-.3.2-.5.1a6.5 6.5 0 0 1-1.9-1.2 7.3 7.3 0 0 1-1.4-1.8c-.1-.2 0-.3.1-.5l.4-.4c.1-.1.1-.2.2-.4s0-.3 0-.4l-.7-1.7c-.2-.3-.3-.3-.5-.3h-.4c-.1 0-.4.1-.6.3-.2.2-.8.8-.8 1.9 0 1.1.8 2.1 1 2.2.1.1 1.6 2.4 4 3.3 2.3.9 2.3.6 2.8.5.4-.1 1.4-.6 1.6-1.2.2-.5.2-1 .1-1.1-.1-.1-.3-.2-.5-.3Z"
                                      fill="currentColor"
                                    />
                                  </svg>
                                </a>

                                <ActionIconButton
                                  title="Novo agendamento"
                                  onClick={() => {
                                    navigate('/agenda', {
                                      state: {
                                        openCreateModal: {
                                          patientId: paciente.id,
                                          patientName: paciente.nome,
                                        },
                                      },
                                    })
                                  }}
                                >
                                  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                                    <path
                                      d="M12 5v14m7-7H5"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="1.8"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </ActionIconButton>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </div>
      </AppShell>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="Novo paciente"
        description="Cadastre os dados basicos do paciente para o CRM inicial."
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" className="btn-secondary" onClick={closeModal} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" form="novo-paciente-form" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar paciente'}
            </button>
          </div>
        }
      >
        <form id="novo-paciente-form" className="grid gap-5 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
          <div className="md:col-span-2">
            <FeedbackMessage type="error" message={modalError} />
          </div>

          <div className="md:col-span-2">
            <TextField
              label="Nome completo"
              type="text"
              placeholder="Ex.: Maria Aparecida Silva"
              error={errors.nome?.message}
              {...register('nome', {
                required: 'Informe o nome do paciente.',
                onChange: () => {
                  setModalError('')
                },
              })}
            />
          </div>

          <TextField
            label="CPF"
            type="text"
            inputMode="numeric"
            placeholder="000.000.000-00"
            error={errors.cpf?.message}
            {...register('cpf', {
              required: 'Informe o CPF.',
              validate: (value) => {
                const digits = onlyDigits(value)

                if (digits.length !== 11) {
                  return 'Informe um CPF com 11 digitos.'
                }

                return isValidCpf(value) || 'CPF invalido.'
              },
              onChange: (event) => {
                setModalError('')
                setValue('cpf', maskCpfInput(event.target.value), {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              },
            })}
          />

          <TextField
            label="Telefone / WhatsApp"
            type="text"
            inputMode="tel"
            placeholder="(11) 99999-9999"
            error={errors.telefoneWhatsapp?.message}
            {...register('telefoneWhatsapp', {
              required: 'Informe o telefone do paciente.',
              validate: (value) =>
                onlyDigits(value).length >= 10 || 'Informe um telefone valido.',
              onChange: (event) => {
                setModalError('')
                setValue('telefoneWhatsapp', maskPhoneInput(event.target.value), {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              },
            })}
          />

          <div className="md:col-span-2">
            <TextField
              label="Data de nascimento"
              type="date"
              error={errors.dataNascimento?.message}
              {...register('dataNascimento', {
                onChange: () => {
                  setModalError('')
                },
              })}
            />
          </div>
        </form>
      </Modal>
    </>
  )
}
