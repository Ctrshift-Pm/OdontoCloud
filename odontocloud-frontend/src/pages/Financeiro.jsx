import { useCallback, useEffect, useMemo, useState } from 'react'
import Modal from '../components/Modal'
import TextField from '../components/TextField'
import FeedbackMessage from '../components/FeedbackMessage'
import AppShell from '../components/AppShell'
import { getApiErrorMessage } from '../api/client'
import { getPacientes } from '../api/pacientes'
import {
  criarContaPagar,
  criarContaReceber,
  darBaixaContaReceber,
  atualizarContaPagar,
  atualizarContaReceber,
  excluirContaPagar,
  excluirContaReceber,
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

function parseMoneyValue(value) {
  if (value === null || value === undefined) {
    return NaN
  }

  const normalized = String(value)
    .replace(/R\$\s?/gi, '')
    .trim()
    .replace(/\s+/g, '')

  if (!normalized) {
    return NaN
  }

  const hasNegative = normalized.startsWith('-')
  const raw = hasNegative ? normalized.slice(1) : normalized

  if (!/\d/.test(raw)) {
    return NaN
  }

  const hasComma = raw.includes(',')
  const hasDot = raw.includes('.')
  const sanitized = raw.replace(/[^0-9.,]/g, '')

  if (!hasComma && !hasDot) {
    return Number((hasNegative ? '-' : '') + sanitized)
  }

  const lastCommaIndex = sanitized.lastIndexOf(',')
  const lastDotIndex = sanitized.lastIndexOf('.')

  const decimalSeparator =
    hasComma && hasDot
      ? (lastCommaIndex > lastDotIndex ? ',' : '.')
      : hasComma
        ? (sanitized.slice(lastCommaIndex + 1).replace(/\D/g, '').length <= 2 ? ',' : null)
        : (sanitized.slice(lastDotIndex + 1).replace(/\D/g, '').length <= 2 ? '.' : null)

  if (decimalSeparator === null) {
    return Number((hasNegative ? '-' : '') + sanitized.replace(/[.,]/g, ''))
  }

  const thousandSeparator = decimalSeparator === ',' ? '.' : ','
  const parts = sanitized.split(decimalSeparator)

  if (parts.length !== 2) {
    return NaN
  }

  const integerPart = parts[0].replace(new RegExp(`\\${thousandSeparator}`, 'g'), '').replace(/[^\d]/g, '')
  const decimalPart = parts[1].replace(/[^\d]/g, '')

  return Number(`${hasNegative ? '-' : ''}${integerPart || '0'}.${decimalPart || '00'}`)
}

function formatMoneyInput(value) {
  const parsed = parseMoneyValue(value)
  if (Number.isNaN(parsed)) {
    return ''
  }

  return toMoney(parsed)
}

function formatMoneyTypingInput(value) {
  const digits = String(value || '').replace(/\D/g, '')
  if (!digits) {
    return 'R$ 0,00'
  }

  return toMoney(Number(digits) / 100)
}

function parsePercentValue(value) {
  if (value === null || value === undefined) {
    return NaN
  }

  const normalized = String(value)
    .replace(/%/g, '')
    .replace(/\s+/g, '')
    .trim()

  if (!normalized) {
    return NaN
  }

  const hasNegative = normalized.startsWith('-')
  const raw = hasNegative ? normalized.slice(1) : normalized
  const sanitized = raw.replace(/[^0-9.,]/g, '')
  const decimalSeparator = sanitized.lastIndexOf(',') > sanitized.lastIndexOf('.') ? ',' : '.'
  const integerPart = sanitized
    .slice(0, Math.max(sanitized.lastIndexOf(decimalSeparator), 0))
    .replace(/[^\d]/g, '')
  const decimalPart = sanitized.includes(decimalSeparator)
    ? sanitized.slice(sanitized.lastIndexOf(decimalSeparator) + 1).replace(/[^\d]/g, '')
    : ''

  if (!/\d/.test(sanitized)) {
    return NaN
  }

  if (!sanitized.includes(',') && !sanitized.includes('.')) {
    return Number((hasNegative ? '-' : '') + sanitized)
  }

  return Number(`${hasNegative ? '-' : ''}${integerPart || '0'}.${decimalPart || '0'}`)
}

function formatPercentInput(value) {
  const parsed = parsePercentValue(value)
  if (Number.isNaN(parsed)) {
    return ''
  }

  return `${parsed.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`
}

function formatPercentTypingInput(value) {
  const digits = String(value || '').replace(/\D/g, '')
  if (!digits) {
    return '0,00%'
  }

  return `${(Number(digits) / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`
}

function calculateDiscountAmount(valorBase, descontoPercentual) {
  const amount = valorBase * (descontoPercentual / 100)
  return Math.round(amount * 100) / 100
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

function canEditarOuExcluir(status) {
  const normalized = String(status || '').toLowerCase()
  return normalized === 'pendente' || normalized === 'atrasado'
}

function emptyFormValidation(values, required) {
  const errors = {}

  required.forEach((field) => {
    if (!values[field]) {
      errors[field] = 'Campo obrigatorio.'
    }
  })

  return errors
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
  const [isPagarContaModalOpen, setIsPagarContaModalOpen] = useState(false)
  const [selectedContaPagar, setSelectedContaPagar] = useState(null)
  const [pagarContaError, setPagarContaError] = useState('')
  const [pagarContaLoading, setPagarContaLoading] = useState(false)
  const [isContaReceberFormOpen, setIsContaReceberFormOpen] = useState(false)
  const [isContaPagarFormOpen, setIsContaPagarFormOpen] = useState(false)
  const [editingContaReceber, setEditingContaReceber] = useState(null)
  const [editingContaPagar, setEditingContaPagar] = useState(null)
  const [contaReceberForm, setContaReceberForm] = useState({
    pacienteId: '',
    valorBase: '',
    desconto: '0,00%',
    dataVencimento: todayDateInputValue(),
  })
  const [contaPagarForm, setContaPagarForm] = useState({
    fornecedorDestinatario: '',
    categoria: '',
    descricao: '',
    valor: 'R$ 0,00',
    dataVencimento: todayDateInputValue(),
  })
  const [formErrors, setFormErrors] = useState({})
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

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
    setValorPago(formatMoneyInput(conta?.valorFinal))
    setFormaPagamento(FORMA_PAGO_PADRAO)
    setBaixaError('')
    setIsModalOpen(true)
  }

  function closeBaixaModal() {
    setIsModalOpen(false)
    setSelectedConta(null)
    setBaixaError('')
  }

  function openPagarContaModal(contaPagar) {
    setSelectedContaPagar(contaPagar)
    setPagarContaError('')
    setIsPagarContaModalOpen(true)
  }

  function closePagarContaModal() {
    setIsPagarContaModalOpen(false)
    setSelectedContaPagar(null)
    setPagarContaError('')
  }

  function clearContaReceberForm() {
    setContaReceberForm({
      pacienteId: '',
      valorBase: '',
      desconto: '0,00%',
      dataVencimento: todayDateInputValue(),
    })
    setEditingContaReceber(null)
    setFormErrors({})
  }

  function clearContaPagarForm() {
    setContaPagarForm({
      fornecedorDestinatario: '',
      categoria: '',
      descricao: '',
      valor: 'R$ 0,00',
      dataVencimento: todayDateInputValue(),
    })
    setEditingContaPagar(null)
    setFormErrors({})
  }

  function openCriarContaReceberModal() {
    clearContaReceberForm()
    setIsContaReceberFormOpen(true)
  }

  function openEditarContaReceberModal(contaReceber) {
    setEditingContaReceber(contaReceber)
    setContaReceberForm({
      pacienteId: contaReceber.pacienteId || '',
      valorBase: formatMoneyInput(contaReceber.valorBase || 0),
      desconto: formatPercentInput(
        Number(contaReceber.valorBase || 0) > 0
          ? (Number(contaReceber.desconto || 0) / Number(contaReceber.valorBase || 0)) * 100
          : 0,
      ),
      dataVencimento: contaReceber.dataVencimento ? contaReceber.dataVencimento.slice(0, 10) : todayDateInputValue(),
    })
    setFormErrors({})
    setIsContaReceberFormOpen(true)
  }

  function closeContaReceberFormModal() {
    setIsContaReceberFormOpen(false)
    clearContaReceberForm()
  }

  function openCriarContaPagarModal() {
    clearContaPagarForm()
    setIsContaPagarFormOpen(true)
  }

  function openEditarContaPagarModal(contaPagar) {
    setEditingContaPagar(contaPagar)
    setContaPagarForm({
      fornecedorDestinatario: contaPagar.fornecedorDestinatario || '',
      categoria: contaPagar.categoria || '',
      descricao: contaPagar.descricao || '',
      valor: formatMoneyInput(contaPagar.valor || 0),
      dataVencimento: contaPagar.dataVencimento ? contaPagar.dataVencimento.slice(0, 10) : todayDateInputValue(),
    })
    setFormErrors({})
    setIsContaPagarFormOpen(true)
  }

  function closeContaPagarFormModal() {
    setIsContaPagarFormOpen(false)
    clearContaPagarForm()
  }

  function openDeleteConfirm(type, conta) {
    setDeleteTarget({ type, conta })
    setIsDeleteConfirmOpen(true)
  }

  function closeDeleteConfirm() {
    setDeleteTarget(null)
    setIsDeleteConfirmOpen(false)
  }

  async function darBaixaConta(event) {
    event.preventDefault()

    if (!selectedConta) {
      return
    }

    setBaixaError('')
    const valorNumerico = parseMoneyValue(valorPago)

    if (!valorPago || Number.isNaN(valorNumerico) || valorNumerico <= 0) {
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
    openPagarContaModal(contaPagar)
  }

  async function confirmarPagamentoContaPagar() {
    if (!selectedContaPagar) {
      return
    }

    setSectionErrors((errors) => ({ ...errors, contasPagar: '' }))
    setPagarContaError('')
    setPagarContaLoading(true)

    try {
      const response = await pagarContaPagar(selectedContaPagar.id)
      const status = String(response?.status || '').toLowerCase()
      setPageMessage(
        status === 'pago'
          ? 'Conta a pagar liquidada com sucesso.'
          : `Conta a pagar liquidada com sucesso.`,
      )
      closePagarContaModal()
      await loadContasPagar()
    } catch (error) {
      setPagarContaError(getApiErrorMessage(error, 'Nao foi possivel pagar a conta a pagar.'))
    } finally {
      setPagarContaLoading(false)
    }
  }

  async function salvarContaReceber(event) {
    event.preventDefault()

    setPageError('')
    const numericValorBase = parseMoneyValue(contaReceberForm.valorBase)
    const numericDescontoPercentual = parsePercentValue(contaReceberForm.desconto)
    const normalizedDescontoPercentual = Number.isNaN(numericDescontoPercentual) ? 0 : numericDescontoPercentual
    const normalizedDesconto = calculateDiscountAmount(numericValorBase, normalizedDescontoPercentual)
    const errors = {
      ...(emptyFormValidation(
        {
          pacienteId: editingContaReceber ? 'ok' : contaReceberForm.pacienteId,
          valorBase: numericValorBase > 0 ? 'ok' : '',
          dataVencimento: contaReceberForm.dataVencimento,
        },
        ['pacienteId', 'valorBase', 'dataVencimento'],
      )),
    }

    if (Number.isNaN(numericValorBase) || numericValorBase <= 0) {
      errors.valorBase = 'Informe o valor base.'
    }

    if (Number.isNaN(numericDescontoPercentual) && contaReceberForm.desconto?.trim()) {
      errors.desconto = 'Informe o desconto em percentual.'
    }

    if (normalizedDescontoPercentual < 0 || normalizedDescontoPercentual > 100) {
      errors.desconto = 'Desconto deve estar entre 0,00% e 100,00%.'
    }

    if (!contaReceberForm.dataVencimento) {
      errors.dataVencimento = 'Informe data de vencimento.'
    }

    if (editingContaReceber && !editingContaReceber.id) {
      errors.pacienteId = 'Conta invalida para edicao.'
    }

    setFormErrors(errors)
    if (Object.keys(errors).length > 0) {
      return
    }

    try {
      const payload = {
        valorBase: numericValorBase,
        desconto: normalizedDesconto,
        dataVencimento: contaReceberForm.dataVencimento,
      }

      if (editingContaReceber) {
        await atualizarContaReceber(editingContaReceber.id, payload)
        setPageMessage('Conta a receber atualizada com sucesso.')
      } else {
        await criarContaReceber({
          pacienteId: contaReceberForm.pacienteId,
          itemPlanoTratamentoId: null,
          dentistaId: null,
          valorBase: numericValorBase,
          desconto: normalizedDesconto,
          dataVencimento: contaReceberForm.dataVencimento,
        })
        setPageMessage('Conta a receber criada com sucesso.')
      }

      closeContaReceberFormModal()
      await Promise.all([
        loadContasReceber({
          dataInicio: filtroDataInicioAplicado,
          dataFim: filtroDataFimAplicado,
          status: filtroStatusAplicado,
        }),
        loadContasPendentes(),
      ])
    } catch (error) {
      setFormErrors({ _form: getApiErrorMessage(error, 'Nao foi possivel salvar a conta a receber.') })
    }
  }

  async function salvarContaPagar(event) {
    event.preventDefault()

    const numericValor = parseMoneyValue(contaPagarForm.valor)
    const errors = emptyFormValidation(contaPagarForm, ['fornecedorDestinatario', 'categoria', 'descricao', 'dataVencimento'])
    if (Number.isNaN(numericValor) || numericValor <= 0) {
      errors.valor = 'Informe um valor valido.'
    }

    if (!contaPagarForm.categoria) {
      errors.categoria = errors.categoria || 'Informe a categoria.'
    }

    setFormErrors(errors)
    if (Object.keys(errors).length > 0) {
      return
    }

    try {
      const payload = {
        fornecedorDestinatario: contaPagarForm.fornecedorDestinatario,
        categoria: contaPagarForm.categoria,
        descricao: contaPagarForm.descricao,
        valor: numericValor,
        dataVencimento: contaPagarForm.dataVencimento,
      }

      if (editingContaPagar) {
        await atualizarContaPagar(editingContaPagar.id, payload)
        setPageMessage('Conta a pagar atualizada com sucesso.')
      } else {
        await criarContaPagar(payload)
        setPageMessage('Conta a pagar criada com sucesso.')
      }

      closeContaPagarFormModal()
      await loadContasPagar()
    } catch (error) {
      setFormErrors({ _form: getApiErrorMessage(error, 'Nao foi possivel salvar a conta a pagar.') })
    }
  }

  async function excluirConta() {
    if (!deleteTarget) {
      return
    }

    try {
      setDeleteLoading(true)
      if (deleteTarget.type === 'receber') {
        await excluirContaReceber(deleteTarget.conta.id)
        setPageMessage('Conta a receber excluida com sucesso.')
      } else {
        await excluirContaPagar(deleteTarget.conta.id)
        setPageMessage('Conta a pagar excluida com sucesso.')
      }

      await Promise.all([
        loadContasReceber({
          dataInicio: filtroDataInicioAplicado,
          dataFim: filtroDataFimAplicado,
          status: filtroStatusAplicado,
        }),
        loadContasPendentes(),
        loadContasPagar(),
      ])
      closeDeleteConfirm()
    } catch (error) {
      setPageError(getApiErrorMessage(error, 'Nao foi possivel excluir a conta.'))
      closeDeleteConfirm()
    } finally {
      setDeleteLoading(false)
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

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="btn-primary text-xs"
                onClick={openCriarContaReceberModal}
              >
                Criar conta a receber
              </button>
              <div className="text-xs text-[var(--ink-500)]">Total de registros: {contasReceber.length}</div>
            </div>
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
                        {canEditarOuExcluir(conta.status) ? (
                          <>
                            <button
                              type="button"
                              className="mr-2 rounded-xl border border-black/10 bg-white px-3 py-1 text-xs font-semibold"
                              onClick={() => openEditarContaReceberModal(conta)}
                              aria-label={`Editar conta a receber ${String(conta.id).slice(0, 8)}`}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              className="rounded-xl border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-red-700"
                              onClick={() => openDeleteConfirm('receber', conta)}
                              aria-label={`Excluir conta a receber ${String(conta.id).slice(0, 8)}`}
                              data-testid={`financeiro-btn-excluir-receber-${conta.id}`}
                            >
                              Excluir
                            </button>
                          </>
                        ) : null}
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
                  {canEditarOuExcluir(conta.status) ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="rounded-xl border border-black/10 bg-white px-3 py-1 text-xs font-semibold"
                        onClick={() => openEditarContaReceberModal(conta)}
                        aria-label={`Editar conta a receber ${String(conta.id).slice(0, 8)}`}
                    data-testid={`financeiro-btn-editar-receber-${conta.id}`}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="rounded-xl border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-red-700"
                        onClick={() => openDeleteConfirm('receber', conta)}
                        aria-label={`Excluir conta a receber ${String(conta.id).slice(0, 8)}`}
                    data-testid={`financeiro-btn-excluir-receber-${conta.id}`}
                      >
                        Excluir
                      </button>
                    </div>
                  ) : null}

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
          <div className="mb-4 flex items-start justify-between gap-3">
            <h2 className="text-lg font-semibold text-[var(--ink-900)]">Contas a pagar pendentes / atrasadas</h2>
            <button type="button" className="btn-primary text-xs" onClick={openCriarContaPagarModal}>
              Criar conta a pagar
            </button>
          </div>
          <p className="text-sm text-[var(--ink-500)]">
            Endpoint consumido em: <span className="font-semibold">GET /api/financeiro/contas-pagar/pendentes</span>.
          </p>

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
                    <th className="py-3 pr-3 font-medium">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {contasPagar.map((contaPagarItem) => (
                    <tr
                      key={contaPagarItem.id}
                      className="border-b border-black/6"
                      data-conta-pagar-id={contaPagarItem.id}
                    >
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
                        {canEditarOuExcluir(contaPagarItem.status) ? (
                          <>
                            <button
                              type="button"
                              className="mr-2 rounded-xl border border-black/10 bg-white px-3 py-1 text-xs font-semibold"
                              onClick={() => openEditarContaPagarModal(contaPagarItem)}
                              aria-label={`Editar conta a pagar ${String(contaPagarItem.id).slice(0, 8)}`}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              className="rounded-xl border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-red-700"
                              onClick={() => openDeleteConfirm('pagar', contaPagarItem)}
                              aria-label={`Excluir conta a pagar ${String(contaPagarItem.id).slice(0, 8)}`}
                              data-testid={`financeiro-btn-excluir-pagar-${contaPagarItem.id}`}
                            >
                              Excluir
                            </button>
                          </>
                        ) : null}

                        {canPagar(contaPagarItem.status) ? (
                          <button
                            type="button"
                            className="rounded-xl border border-black/10 bg-white px-3 py-1 text-xs font-semibold"
                            onClick={() => void pagarConta(contaPagarItem)}
                            aria-label={`Abrir confirmacao de pagamento da conta a pagar ${String(contaPagarItem.id).slice(0, 8)}`}
                            data-testid={`financeiro-btn-pagar-${contaPagarItem.id}`}
                          >
                            Pagar
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
              <article
                key={contaPagarItem.id}
                className="rounded-2xl border border-black/10 bg-white p-3"
                data-conta-pagar-id={contaPagarItem.id}
              >
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
                {canEditarOuExcluir(contaPagarItem.status) ? (
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-black/10 pt-3">
                    <button
                      type="button"
                      className="rounded-xl border border-black/10 bg-white px-3 py-1 text-xs font-semibold"
                      onClick={() => openEditarContaPagarModal(contaPagarItem)}
                      aria-label={`Editar conta a pagar ${String(contaPagarItem.id).slice(0, 8)}`}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="rounded-xl border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-red-700"
                      onClick={() => openDeleteConfirm('pagar', contaPagarItem)}
                      aria-label={`Excluir conta a pagar ${String(contaPagarItem.id).slice(0, 8)}`}
                    >
                      Excluir
                    </button>
                  </div>
                ) : null}

                {canPagar(contaPagarItem.status) ? (
                  <button
                    type="button"
                    className="mt-3 rounded-xl border border-black/10 bg-white px-3 py-1 text-xs font-semibold"
                    onClick={() => void pagarConta(contaPagarItem)}
                    aria-label={`Abrir confirmacao de pagamento da conta a pagar ${String(contaPagarItem.id).slice(0, 8)}`}
                    data-testid={`financeiro-btn-pagar-${contaPagarItem.id}`}
                  >
                    Pagar
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
            type="text"
            inputMode="decimal"
            value={valorPago}
            onChange={(event) => setValorPago(formatMoneyTypingInput(event.target.value))}
            placeholder="R$ 0,00"
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

      <Modal
        isOpen={isContaReceberFormOpen}
        onClose={closeContaReceberFormModal}
        title={editingContaReceber ? 'Editar conta a receber' : 'Criar conta a receber'}
        description={editingContaReceber ? `Conta ${String(editingContaReceber.id).slice(0, 8)}` : 'Novo lancamento a receber'}
        footer={
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button type="button" className="btn-secondary" onClick={closeContaReceberFormModal}>
              Fechar
            </button>
            <button type="submit" form="form-conta-receber" className="btn-primary">
              {editingContaReceber ? 'Salvar alteracoes' : 'Criar conta'}
            </button>
          </div>
        }
      >
        <form id="form-conta-receber" className="space-y-4" onSubmit={salvarContaReceber}>
          {formErrors._form ? <FeedbackMessage type="error" message={formErrors._form} /> : null}

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--ink-700)]" htmlFor="conta-receber-paciente">
              Paciente
            </label>
            <select
              id="conta-receber-paciente"
              value={contaReceberForm.pacienteId}
              onChange={(event) => setContaReceberForm((state) => ({ ...state, pacienteId: event.target.value }))}
              disabled={Boolean(editingContaReceber)}
              className="w-full rounded-2xl border border-black/12 bg-white px-3 py-2 text-sm text-[var(--ink-900)]"
            >
              <option value="">Selecione</option>
              {pacientes.map((paciente) => (
                <option key={paciente.id} value={paciente.id}>
                  {paciente.nome}
                </option>
              ))}
            </select>
            {formErrors.pacienteId ? <p className="mt-1 text-xs text-red-700">{formErrors.pacienteId}</p> : null}
          </div>

          <TextField
            label="Valor base"
            type="text"
            inputMode="decimal"
            value={contaReceberForm.valorBase}
            onChange={(event) =>
              setContaReceberForm((state) => ({ ...state, valorBase: formatMoneyTypingInput(event.target.value) }))
            }
            placeholder="R$ 0,00"
            error={formErrors.valorBase}
          />

          <TextField
            label="Desconto (%)"
            type="text"
            inputMode="decimal"
            value={contaReceberForm.desconto}
            onChange={(event) =>
              setContaReceberForm((state) => ({ ...state, desconto: formatPercentTypingInput(event.target.value) }))
            }
            placeholder="0,00%"
            error={formErrors.desconto}
          />

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--ink-700)]" htmlFor="conta-receber-vencimento">
              Vencimento
            </label>
            <input
              id="conta-receber-vencimento"
              type="date"
              value={contaReceberForm.dataVencimento}
              onChange={(event) => setContaReceberForm((state) => ({ ...state, dataVencimento: event.target.value }))}
              className="w-full rounded-2xl border border-black/12 bg-white px-3 py-2 text-sm text-[var(--ink-900)]"
            />
            {formErrors.dataVencimento ? <p className="mt-1 text-xs text-red-700">{formErrors.dataVencimento}</p> : null}
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isContaPagarFormOpen}
        onClose={closeContaPagarFormModal}
        title={editingContaPagar ? 'Editar conta a pagar' : 'Criar conta a pagar'}
        description={editingContaPagar ? `Conta ${String(editingContaPagar.id).slice(0, 8)}` : 'Novo lancamento a pagar'}
        footer={
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button type="button" className="btn-secondary" onClick={closeContaPagarFormModal}>
              Fechar
            </button>
            <button type="submit" form="form-conta-pagar" className="btn-primary">
              {editingContaPagar ? 'Salvar alteracoes' : 'Criar conta'}
            </button>
          </div>
        }
      >
        <form id="form-conta-pagar" className="space-y-4" onSubmit={salvarContaPagar}>
          {formErrors._form ? <FeedbackMessage type="error" message={formErrors._form} /> : null}

          <TextField
            label="Fornecedor / destinatario"
            value={contaPagarForm.fornecedorDestinatario}
            onChange={(event) => setContaPagarForm((state) => ({ ...state, fornecedorDestinatario: event.target.value }))}
            error={formErrors.fornecedorDestinatario}
          />
          <TextField
            label="Categoria"
            value={contaPagarForm.categoria}
            onChange={(event) => setContaPagarForm((state) => ({ ...state, categoria: event.target.value }))}
            error={formErrors.categoria}
          />
          <TextField
            label="Descricao"
            value={contaPagarForm.descricao}
            onChange={(event) => setContaPagarForm((state) => ({ ...state, descricao: event.target.value }))}
            error={formErrors.descricao}
          />
          <TextField
            label="Valor"
            type="text"
            inputMode="decimal"
            value={contaPagarForm.valor}
            onChange={(event) => setContaPagarForm((state) => ({ ...state, valor: formatMoneyTypingInput(event.target.value) }))}
            placeholder="R$ 0,00"
            error={formErrors.valor}
          />
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--ink-700)]" htmlFor="conta-pagar-vencimento">
              Vencimento
            </label>
            <input
              id="conta-pagar-vencimento"
              type="date"
              value={contaPagarForm.dataVencimento}
              onChange={(event) => setContaPagarForm((state) => ({ ...state, dataVencimento: event.target.value }))}
              className="w-full rounded-2xl border border-black/12 bg-white px-3 py-2 text-sm text-[var(--ink-900)]"
            />
            {formErrors.dataVencimento ? <p className="mt-1 text-xs text-red-700">{formErrors.dataVencimento}</p> : null}
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isDeleteConfirmOpen}
        onClose={closeDeleteConfirm}
        title="Confirmar exclusao"
        description={deleteTarget ? `Confirma a exclusao da conta ${String(deleteTarget.conta?.id || '').slice(0, 8)}?` : ''}
        footer={
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button type="button" className="btn-secondary" onClick={closeDeleteConfirm} disabled={deleteLoading}>
              Cancelar
            </button>
            <button type="button" className="btn-primary" onClick={() => void excluirConta()} disabled={deleteLoading}>
              {deleteLoading ? 'Excluindo...' : 'Confirmar'}
            </button>
          </div>
        }
      >
        <p className="text-sm text-[var(--ink-500)]">Ao confirmar, o registro sera removido permanentemente.</p>
      </Modal>

      <Modal
        isOpen={isPagarContaModalOpen}
        onClose={closePagarContaModal}
        title="Pagamento de conta a pagar"
        description={selectedContaPagar ? `Conta ${String(selectedContaPagar.id).slice(0, 8)}` : ''}
        footer={
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="btn-secondary"
              onClick={closePagarContaModal}
              disabled={pagarContaLoading}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => void confirmarPagamentoContaPagar()}
              disabled={pagarContaLoading}
            >
              {pagarContaLoading ? 'Liquidando...' : 'Confirmar pagamento'}
            </button>
          </div>
        }
      >
        <FeedbackMessage type="error" message={pagarContaError} />

        {selectedContaPagar ? (
          <div className="space-y-2 text-sm">
            <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-[var(--ink-700)]">
              Confirme o pagamento da conta abaixo para concluir a liquidacao.
            </div>
            <CardRow label="Fornecedor" value={selectedContaPagar.fornecedorDestinatario} />
            <CardRow label="Descricao" value={selectedContaPagar.descricao} />
            <CardRow label="Vencimento" value={toDateString(selectedContaPagar.dataVencimento)} />
            <CardRow label="Valor" value={toMoney(selectedContaPagar.valor)} />
            <CardRow label="Status atual" value={selectedContaPagar.status} />
          </div>
        ) : null}
      </Modal>
    </AppShell>
  )
}
