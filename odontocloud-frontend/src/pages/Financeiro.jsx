import { useCallback, useEffect, useMemo, useState } from 'react'
import Modal from '../components/Modal'
import TextField from '../components/TextField'
import FeedbackMessage from '../components/FeedbackMessage'
import AppShell from '../components/AppShell'
import { getApiErrorMessage } from '../api/client'
import { getPacientes } from '../api/pacientes'
import {
  darBaixaContaReceber,
  getContasPagarPendentes,
  getContasReceberPendentesPorPaciente,
  getContasReceberPorPeriodo,
  pagarContaPagar,
} from '../api/financeiro'
import { useAuth } from '../hooks/useAuth'

const STATUS_OPCOES = [
  { value: '', label: 'Todos' },
  { value: 'Pendente', label: 'Pendente' },
  { value: 'Parcial', label: 'Parcial' },
  { value: 'Atrasado', label: 'Atrasado' },
  { value: 'Pago', label: 'Pago' },
  { value: 'Cancelado', label: 'Cancelado' },
  { value: 'Estornado', label: 'Estornado' },
]

const FORMAS_PAGAMENTO = ['Dinheiro', 'Pix', 'Cartao', 'Credito', 'Debito', 'Transferencia', 'Boleto', 'Outro']

const FORMA_PAGO_PADRAO = 'Dinheiro'

function todayDateInputValue() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function firstMonthDateInputValue() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`
}

function toMoney(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  })
}

function toDateString(value) {
  if (!value) {
    return 'N/A'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return String(value)
  }

  return new Intl.DateTimeFormat('pt-BR').format(parsed)
}

function CardRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-sm text-[var(--ink-500)]">{label}</span>
      <span className="text-sm font-medium text-[var(--ink-900)]">{value}</span>
    </div>
  )
}

function statusTone(status) {
  const normalized = String(status || '').toLowerCase()

  if (normalized === 'pago') {
    return 'bg-emerald-50 text-emerald-900'
  }

  if (normalized === 'parcial') {
    return 'bg-blue-50 text-blue-900'
  }

  if (normalized === 'atrasado') {
    return 'bg-red-50 text-red-900'
  }

  if (normalized === 'cancelado' || normalized === 'estornado') {
    return 'bg-stone-100 text-stone-700'
  }

  return 'bg-amber-50 text-amber-900'
}

function canDarBaixa(status) {
  const normalized = String(status || '').toLowerCase()
  return normalized !== 'pago' && normalized !== 'cancelado' && normalized !== 'estornado'
}

function canPagar(status) {
  const normalized = String(status || '').toLowerCase()
  return normalized !== 'pago' && normalized !== 'cancelado'
}

export default function Financeiro() {
  const { user, logout } = useAuth()
  const [pacientes, setPacientes] = useState([])
  const [pacienteIdPendentes, setPacienteIdPendentes] = useState('')
  const [isLoadingPacientes, setIsLoadingPacientes] = useState(true)

  const [filtroDataInicio, setFiltroDataInicio] = useState(firstMonthDateInputValue())
  const [filtroDataFim, setFiltroDataFim] = useState(todayDateInputValue())
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroDataInicioAplicado, setFiltroDataInicioAplicado] = useState(firstMonthDateInputValue())
  const [filtroDataFimAplicado, setFiltroDataFimAplicado] = useState(todayDateInputValue())
  const [filtroStatusAplicado, setFiltroStatusAplicado] = useState('')

  const [contasReceber, setContasReceber] = useState([])
  const [contasReceberPendentes, setContasReceberPendentes] = useState([])
  const [contasPagar, setContasPagar] = useState([])

  const [pageMessage, setPageMessage] = useState('')
  const [pageError, setPageError] = useState('')

  const [isLoadingFiltro, setIsLoadingFiltro] = useState(false)
  const [isLoadingContasReceberPendentes, setIsLoadingContasReceberPendentes] = useState(false)
  const [isLoadingContasPagar, setIsLoadingContasPagar] = useState(false)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedConta, setSelectedConta] = useState(null)
  const [valorPago, setValorPago] = useState('')
  const [formaPagamento, setFormaPagamento] = useState(FORMA_PAGO_PADRAO)
  const [baixaError, setBaixaError] = useState('')
  const [baixaLoading, setBaixaLoading] = useState(false)

  const [sectionErrors, setSectionErrors] = useState({
    contasReceber: '',
    contasReceberPendentes: '',
    contasPagar: '',
  })

  const pacienteNomePorId = useMemo(() => {
    const cache = {}

    pacientes.forEach((paciente) => {
      cache[paciente.id] = paciente.nome
    })

    return cache
  }, [pacientes])

  const resumo = useMemo(() => {
    const totalReceberAberto = contasReceber.reduce((acc, conta) => {
      const status = String(conta.status || '').toLowerCase()
      if (status === 'pendente' || status === 'parcial' || status === 'atrasado') {
        return acc + Number(conta.valorFinal || 0)
      }

      return acc
    }, 0)

    const vencidas = contasReceber.filter((conta) => String(conta.status || '').toLowerCase() === 'atrasado').length
    const totalPagarAberto = contasPagar.reduce((acc, conta) => {
      const status = String(conta.status || '').toLowerCase()
      if (status === 'pendente' || status === 'atrasado') {
        return acc + Number(conta.valor || 0)
      }

      return acc
    }, 0)

    const vencidasPagar = contasPagar.filter((conta) => String(conta.status || '').toLowerCase() === 'atrasado').length

    return {
      totalReceberAberto,
      vencidas,
      totalPagarAberto,
      vencidasPagar,
      contasReceberPendentes: contasReceberPendentes.length,
    }
  }, [contasReceber, contasPagar, contasReceberPendentes])

  const loadPacientes = useCallback(async () => {
    setIsLoadingPacientes(true)

    try {
      const response = await getPacientes()
      setPacientes(Array.isArray(response) ? response : [])
    } catch (error) {
      setPageError(getApiErrorMessage(error, 'Nao foi possivel carregar os pacientes para filtro de contas a receber.'))
    } finally {
      setIsLoadingPacientes(false)
    }
  }, [])

  const loadContasReceber = useCallback(
    async ({ dataInicio, dataFim, status }) => {
      setIsLoadingFiltro(true)
      setSectionErrors((errors) => ({ ...errors, contasReceber: '' }))

      try {
        const response = await getContasReceberPorPeriodo({
          dataInicio,
          dataFim,
          status,
        })

        setContasReceber(Array.isArray(response) ? response : [])
      } catch (error) {
        setSectionErrors((errors) => ({
          ...errors,
          contasReceber: getApiErrorMessage(error, 'Nao foi possivel carregar as contas a receber.'),
        }))
      } finally {
        setIsLoadingFiltro(false)
      }
    },
    [],
  )

  const loadContasPendentes = useCallback(async () => {
    setIsLoadingContasReceberPendentes(true)
    setSectionErrors((errors) => ({ ...errors, contasReceberPendentes: '' }))

    try {
      if (!pacienteIdPendentes) {
        setContasReceberPendentes([])
        setIsLoadingContasReceberPendentes(false)
        return
      }

      const response = await getContasReceberPendentesPorPaciente(pacienteIdPendentes)
      setContasReceberPendentes(Array.isArray(response) ? response : [])
    } catch (error) {
      setSectionErrors((errors) => ({
        ...errors,
        contasReceberPendentes: getApiErrorMessage(error, 'Nao foi possivel carregar as contas pendentes do paciente.'),
      }))
    } finally {
      setIsLoadingContasReceberPendentes(false)
    }
  }, [pacienteIdPendentes])

  const loadContasPagar = useCallback(async () => {
    setIsLoadingContasPagar(true)
    setSectionErrors((errors) => ({ ...errors, contasPagar: '' }))

    try {
      const response = await getContasPagarPendentes()
      setContasPagar(Array.isArray(response) ? response : [])
    } catch (error) {
      setSectionErrors((errors) => ({
        ...errors,
        contasPagar: getApiErrorMessage(error, 'Nao foi possivel carregar as contas a pagar.'),
      }))
    } finally {
      setIsLoadingContasPagar(false)
    }
  }, [])

  useEffect(() => {
    queueMicrotask(() => {
      void loadPacientes()
      void loadContasPagar()
    })
  }, [loadPacientes, loadContasPagar])

  useEffect(() => {
    queueMicrotask(() => {
      void loadContasReceber({
        dataInicio: filtroDataInicioAplicado,
        dataFim: filtroDataFimAplicado,
        status: filtroStatusAplicado,
      })
    })
  }, [loadContasReceber, filtroDataInicioAplicado, filtroDataFimAplicado, filtroStatusAplicado])

  useEffect(() => {
    queueMicrotask(() => {
      void loadContasPendentes()
    })
  }, [loadContasPendentes, pacienteIdPendentes])

  async function handleFiltroSubmit(event) {
    event.preventDefault()
    setFiltroDataInicioAplicado(filtroDataInicio)
    setFiltroDataFimAplicado(filtroDataFim)
    setFiltroStatusAplicado(filtroStatus)
  }

  function openBaixaModal(conta) {
    setSelectedConta(conta)
    setValorPago(conta?.valorFinal != null ? String(conta.valorFinal) : '')
    setFormaPagamento(FORMA_PAGO_PADRAO)
    setBaixaError('')
    setIsModalOpen(true)
  }

  function closeBaixaModal() {
    setIsModalOpen(false)
    setSelectedConta(null)
    setBaixaError('')
  }

  async function darBaixaConta(event) {
    event.preventDefault()

    if (!selectedConta) {
      return
    }

    setBaixaError('')
    const valorNumerico = Number(valorPago)

    if (!valorPago || valorNumerico <= 0 || Number.isNaN(valorNumerico)) {
      setBaixaError('Informe um valor pago valido.')
      return
    }

    setBaixaLoading(true)
    try {
      await darBaixaContaReceber(selectedConta.id, {
        valorPago: valorNumerico,
        formaPagamento,
      })

      setPageMessage('Baixa registrada com sucesso.')
      closeBaixaModal()
      await loadContasReceber({
        dataInicio: filtroDataInicioAplicado,
        dataFim: filtroDataFimAplicado,
        status: filtroStatusAplicado,
      })
      await loadContasPendentes()
    } catch (error) {
      setBaixaError(getApiErrorMessage(error, 'Nao foi possivel registrar a baixa.'))
    } finally {
      setBaixaLoading(false)
    }
  }

  async function pagarConta(contaPagar) {
    setSectionErrors((errors) => ({ ...errors, contasPagar: '' }))
    setIsLoadingContasPagar(true)

    try {
      await pagarContaPagar(contaPagar.id)
      setPageMessage('Conta a pagar liquidada com sucesso.')
      await loadContasReceber({
        dataInicio: filtroDataInicioAplicado,
        dataFim: filtroDataFimAplicado,
        status: filtroStatusAplicado,
      })
      await loadContasPagar()
    } catch (error) {
      setSectionErrors((errors) => ({
        ...errors,
        contasPagar: getApiErrorMessage(error, 'Nao foi possivel pagar a conta.'),
      }))
    } finally {
      setIsLoadingContasPagar(false)
    }
  }

  return (
    <AppShell
      title="Financeiro"
      subtitle="Resumo rapido e lancamentos de recebimento e pagamento em uma visao operacional."
      user={user}
      onLogout={logout}
      actions={
        <button type="button" className="btn-secondary text-xs" onClick={() => setPageMessage('')}>
          Limpar mensagem
        </button>
      }
    >
      <div className="space-y-6">
        <FeedbackMessage type="error" message={pageError} />
        <FeedbackMessage type="success" message={pageMessage} />

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-[22px] border border-black/8 bg-white p-5">
            <div className="text-sm text-[var(--ink-500)]">Total a receber (aberto)</div>
            <div className="mt-2 text-3xl font-semibold text-[var(--ink-900)]">{toMoney(resumo.totalReceberAberto)}</div>
          </article>

          <article className="rounded-[22px] border border-black/8 bg-white p-5">
            <div className="text-sm text-[var(--ink-500)]">Vencidas a receber</div>
            <div className="mt-2 text-3xl font-semibold text-red-900">{resumo.vencidas}</div>
          </article>

          <article className="rounded-[22px] border border-black/8 bg-white p-5">
            <div className="text-sm text-[var(--ink-500)]">Total a pagar (pendente)</div>
            <div className="mt-2 text-3xl font-semibold text-[var(--ink-900)]">{toMoney(resumo.totalPagarAberto)}</div>
          </article>

          <article className="rounded-[22px] border border-black/8 bg-white p-5">
            <div className="text-sm text-[var(--ink-500)]">Vencidas a pagar</div>
            <div className="mt-2 text-3xl font-semibold text-red-900">{resumo.vencidasPagar}</div>
          </article>
        </section>

        <section className="surface-card rounded-3xl p-5">
          <h2 className="text-lg font-semibold text-[var(--ink-900)]">Filtro contas a receber</h2>
          <p className="mt-1 text-sm text-[var(--ink-500)]">Escolha periodo e status para visualizar lancamentos.</p>

          <form className="mt-4 grid gap-3 sm:grid-cols-5" onSubmit={handleFiltroSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--ink-700)]" htmlFor="filtroDataInicio">
                Data inicio
              </label>
              <input
                id="filtroDataInicio"
                type="date"
                value={filtroDataInicio}
                onChange={(event) => setFiltroDataInicio(event.target.value)}
                className="w-full rounded-2xl border border-black/12 bg-white px-3 py-2 text-sm text-[var(--ink-900)]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--ink-700)]" htmlFor="filtroDataFim">
                Data fim
              </label>
              <input
                id="filtroDataFim"
                type="date"
                value={filtroDataFim}
                onChange={(event) => setFiltroDataFim(event.target.value)}
                className="w-full rounded-2xl border border-black/12 bg-white px-3 py-2 text-sm text-[var(--ink-900)]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--ink-700)]" htmlFor="filtroStatus">
                Status
              </label>
              <select
                id="filtroStatus"
                value={filtroStatus}
                onChange={(event) => setFiltroStatus(event.target.value)}
                className="w-full rounded-2xl border border-black/12 bg-white px-3 py-2 text-sm text-[var(--ink-900)]"
              >
                {STATUS_OPCOES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <button type="submit" className="btn-primary mt-7 w-full" disabled={isLoadingFiltro}>
                {isLoadingFiltro ? 'Consultando...' : 'Consultar'}
              </button>
            </div>
          </form>
        </section>

        <section className="surface-card overflow-hidden rounded-3xl p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--ink-900)]">Contas a receber</h2>
              <p className="mt-1 text-sm text-[var(--ink-500)]">
                Lista completa pelo periodo e status selecionados no filtro acima.
              </p>
            </div>

            <div className="text-xs text-[var(--ink-500)]">Total de registros: {contasReceber.length}</div>
          </div>

          <FeedbackMessage type="error" message={sectionErrors.contasReceber} />
          {isLoadingFiltro ? <div className="text-sm text-[var(--ink-500)]">Atualizando contas a receber...</div> : null}

          <div className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-black/10 text-left text-[var(--ink-500)]">
                    <th className="py-3 pr-3 font-medium">Paciente</th>
                    <th className="py-3 pr-3 font-medium">Vencimento</th>
                    <th className="py-3 pr-3 font-medium">Valor</th>
                    <th className="py-3 pr-3 font-medium">Status</th>
                    <th className="py-3 pr-3 font-medium">Forma</th>
                    <th className="py-3 pr-3 font-medium">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {contasReceber.map((conta) => (
                    <tr
                      key={conta.id}
                      className="border-b border-black/6"
                      data-testid="financeiro-linha-receber"
                      data-conta-id={conta.id}
                    >
                      <td className="py-3 pr-3">
                        {pacienteNomePorId[conta.pacienteId] || `Paciente ${String(conta.pacienteId).slice(0, 8)}`}
                      </td>
                      <td className="py-3 pr-3">{toDateString(conta.dataVencimento)}</td>
                      <td className="py-3 pr-3">{toMoney(conta.valorFinal)}</td>
                      <td className="py-3 pr-3">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusTone(conta.status)}`}>
                          {conta.status}
                        </span>
                      </td>
                      <td className="py-3 pr-3">{conta.formaPagamento || 'N/D'}</td>
                      <td className="py-3">
                        {canDarBaixa(conta.status) ? (
                          <button
                            type="button"
                            className="rounded-xl border border-black/10 bg-white px-3 py-1 text-xs font-semibold"
                            onClick={() => openBaixaModal(conta)}
                            aria-label={`Abrir baixa da conta ${String(conta.pacienteId).slice(0, 8)}`}
                            data-testid={`financeiro-btn-baixa-${conta.id}`}
                          >
                            Dar baixa
                          </button>
                        ) : (
                          <span className="text-xs text-[var(--ink-500)]">Sem ação</span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {contasReceber.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-sm text-[var(--ink-500)]">
                        Nenhuma conta encontrada.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-3 md:hidden">
            {contasReceber.map((conta) => (
              <article
                key={conta.id}
                data-testid="financeiro-linha-receber"
                data-conta-id={conta.id}
                className="rounded-2xl border border-black/10 bg-white p-3"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-[var(--ink-500)]">Paciente</p>
                    <p className="text-sm font-medium text-[var(--ink-900)]">
                      {pacienteNomePorId[conta.pacienteId] || `Paciente ${String(conta.pacienteId).slice(0, 8)}`}
                    </p>
                  </div>
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusTone(conta.status)}`}>
                    {conta.status}
                  </span>
                </div>

                <CardRow label="Vencimento" value={toDateString(conta.dataVencimento)} />
                <CardRow label="Valor" value={toMoney(conta.valorFinal)} />
                <CardRow label="Forma" value={conta.formaPagamento || 'N/D'} />

                <div className="mt-3 border-t border-black/10 pt-3">
                  {canDarBaixa(conta.status) ? (
                    <button
                      type="button"
                      className="rounded-xl border border-black/10 bg-white px-3 py-1 text-xs font-semibold"
                      onClick={() => openBaixaModal(conta)}
                      aria-label={`Abrir baixa da conta ${String(conta.pacienteId).slice(0, 8)}`}
                      data-testid={`financeiro-btn-baixa-${conta.id}`}
                    >
                      Dar baixa
                    </button>
                  ) : (
                    <span className="text-xs text-[var(--ink-500)]">Sem ação</span>
                  )}
                </div>
              </article>
            ))}

            {contasReceber.length === 0 ? <p className="text-sm text-[var(--ink-500)]">Nenhuma conta encontrada.</p> : null}
          </div>
        </section>

        <section className="surface-card overflow-hidden rounded-3xl p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--ink-900)]">Contas pendentes por paciente (GET /financeiro/pendentes)</h2>
              <p className="mt-1 text-sm text-[var(--ink-500)]">Selecione um paciente para ver as contas pendentes desse cliente.</p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--ink-700)]" htmlFor="pacientePendentes">
                Paciente
              </label>
              <select
                id="pacientePendentes"
                value={pacienteIdPendentes}
                onChange={(event) => setPacienteIdPendentes(event.target.value)}
                className="w-full rounded-2xl border border-black/12 bg-white px-3 py-2 text-sm text-[var(--ink-900)] sm:w-72"
                disabled={isLoadingPacientes}
              >
                <option value="">Selecione</option>
                {pacientes.map((paciente) => (
                  <option key={paciente.id} value={paciente.id}>
                    {paciente.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <FeedbackMessage type="error" message={sectionErrors.contasReceberPendentes} />
          {isLoadingContasReceberPendentes ? (
            <div className="text-sm text-[var(--ink-500)]">Carregando contas pendentes...</div>
          ) : null}

          <div className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-black/10 text-left text-[var(--ink-500)]">
                    <th className="py-3 pr-3 font-medium">Paciente</th>
                    <th className="py-3 pr-3 font-medium">Vencimento</th>
                    <th className="py-3 pr-3 font-medium">Valor</th>
                    <th className="py-3 pr-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {contasReceberPendentes.map((conta) => (
                    <tr key={conta.id} className="border-b border-black/6">
                      <td className="py-3 pr-3">{pacienteNomePorId[conta.pacienteId] || String(conta.pacienteId).slice(0, 8)}</td>
                      <td className="py-3 pr-3">{toDateString(conta.dataVencimento)}</td>
                      <td className="py-3 pr-3">{toMoney(conta.valorFinal)}</td>
                      <td className="py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusTone(conta.status)}`}
                        >
                          {conta.status}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {contasReceberPendentes.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-sm text-[var(--ink-500)]">
                        Nenhuma conta pendente para o paciente selecionado.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-3 md:hidden">
            {contasReceberPendentes.map((conta) => (
              <article key={conta.id} className="rounded-2xl border border-black/10 bg-white p-3">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-[var(--ink-900)]">
                    {pacienteNomePorId[conta.pacienteId] || String(conta.pacienteId).slice(0, 8)}
                  </p>
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusTone(conta.status)}`}>
                    {conta.status}
                  </span>
                </div>
                <CardRow label="Vencimento" value={toDateString(conta.dataVencimento)} />
                <CardRow label="Valor" value={toMoney(conta.valorFinal)} />
              </article>
            ))}

            {contasReceberPendentes.length === 0 ? (
              <p className="text-sm text-[var(--ink-500)]">Nenhuma conta pendente para o paciente selecionado.</p>
            ) : null}
          </div>
        </section>

        <section className="surface-card overflow-hidden rounded-3xl p-5">
          <div className="mb-4 flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-[var(--ink-900)]">Contas a pagar pendentes / atrasadas</h2>
            <p className="text-sm text-[var(--ink-500)]">
              Endpoint consumido em: <span className="font-semibold">GET /api/financeiro/contas-pagar/pendentes</span>.
            </p>
          </div>

          <FeedbackMessage type="error" message={sectionErrors.contasPagar} />
          {isLoadingContasPagar ? <div className="text-sm text-[var(--ink-500)]">Atualizando contas a pagar...</div> : null}

          <div className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-black/10 text-left text-[var(--ink-500)]">
                    <th className="py-3 pr-3 font-medium">Fornecedor</th>
                    <th className="py-3 pr-3 font-medium">Descricao</th>
                    <th className="py-3 pr-3 font-medium">Vencimento</th>
                    <th className="py-3 pr-3 font-medium">Valor</th>
                    <th className="py-3 pr-3 font-medium">Status</th>
                    <th className="py-3 pr-3 font-medium">Acao</th>
                  </tr>
                </thead>
                <tbody>
                  {contasPagar.map((contaPagarItem) => (
                    <tr key={contaPagarItem.id} className="border-b border-black/6">
                      <td className="py-3 pr-3">{contaPagarItem.fornecedorDestinatario}</td>
                      <td className="py-3 pr-3">{contaPagarItem.descricao}</td>
                      <td className="py-3 pr-3">{toDateString(contaPagarItem.dataVencimento)}</td>
                      <td className="py-3 pr-3">{toMoney(contaPagarItem.valor)}</td>
                      <td className="py-3 pr-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusTone(contaPagarItem.status)}`}
                        >
                          {contaPagarItem.status}
                        </span>
                      </td>
                      <td className="py-3">
                        {canPagar(contaPagarItem.status) ? (
                          <button
                            type="button"
                            className="rounded-xl border border-black/10 bg-white px-3 py-1 text-xs font-semibold"
                            onClick={() => void pagarConta(contaPagarItem)}
                            aria-label={`Dar baixa da conta a pagar ${String(contaPagarItem.id).slice(0, 8)}`}
                          >
                            Dar baixa
                          </button>
                        ) : (
                          <span className="text-xs text-[var(--ink-500)]">Sem ação</span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {contasPagar.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-sm text-[var(--ink-500)]">
                        Nenhuma conta a pagar pendente no momento.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-3 md:hidden">
            {contasPagar.map((contaPagarItem) => (
              <article key={contaPagarItem.id} className="rounded-2xl border border-black/10 bg-white p-3">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-[var(--ink-500)]">Fornecedor</p>
                    <p className="text-sm font-medium text-[var(--ink-900)]">{contaPagarItem.fornecedorDestinatario}</p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusTone(contaPagarItem.status)}`}
                  >
                    {contaPagarItem.status}
                  </span>
                </div>
                <CardRow label="Descricao" value={contaPagarItem.descricao} />
                <CardRow label="Vencimento" value={toDateString(contaPagarItem.dataVencimento)} />
                <CardRow label="Valor" value={toMoney(contaPagarItem.valor)} />

                {canPagar(contaPagarItem.status) ? (
                  <button
                    type="button"
                    className="mt-3 rounded-xl border border-black/10 bg-white px-3 py-1 text-xs font-semibold"
                    onClick={() => void pagarConta(contaPagarItem)}
                    aria-label={`Dar baixa da conta a pagar ${String(contaPagarItem.id).slice(0, 8)}`}
                  >
                    Dar baixa
                  </button>
                ) : (
                  <span className="mt-3 block text-xs text-[var(--ink-500)]">Sem ação</span>
                )}
              </article>
            ))}

            {contasPagar.length === 0 ? (
              <p className="text-sm text-[var(--ink-500)]">Nenhuma conta a pagar pendente no momento.</p>
            ) : null}
          </div>
        </section>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeBaixaModal}
        title="Baixa de conta a receber"
        description={selectedConta ? `Conta ${String(selectedConta.id).slice(0, 8)}` : ''}
        footer={
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button type="button" className="btn-secondary" onClick={closeBaixaModal} disabled={baixaLoading}>
              Fechar
            </button>
            <button type="submit" form="form-baixa" className="btn-primary" disabled={baixaLoading}>
              {baixaLoading ? 'Registrando...' : 'Confirmar baixa'}
            </button>
          </div>
        }
      >
        <form id="form-baixa" className="space-y-4" onSubmit={darBaixaConta}>
          <FeedbackMessage type="error" message={baixaError} />

          <TextField
            label="Valor pago"
            type="number"
            min="0.01"
            step="0.01"
            value={valorPago}
            onChange={(event) => setValorPago(event.target.value)}
            error={baixaError && !valorPago ? 'Informe o valor pago.' : ''}
          />

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--ink-700)]" htmlFor="formaPagamento">
              Forma de pagamento
            </label>
            <select
              id="formaPagamento"
              value={formaPagamento}
              onChange={(event) => setFormaPagamento(event.target.value)}
              className="w-full rounded-2xl border border-black/12 bg-white px-4 py-3 text-sm text-[var(--ink-900)]"
            >
              {FORMAS_PAGAMENTO.map((forma) => (
                <option key={forma} value={forma}>
                  {forma}
                </option>
              ))}
            </select>
          </div>
        </form>
      </Modal>
    </AppShell>
  )
}
