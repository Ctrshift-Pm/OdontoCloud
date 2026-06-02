import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  adicionarIaMensagem,
  assumirIaLead,
  atualizarIaLeadStatus,
  criarIaLead,
  getIaLeads,
} from '../api/iaAtendimento'
import { getApiErrorMessage } from '../api/client'
import AppShell from '../components/AppShell'
import FeedbackMessage from '../components/FeedbackMessage'
import { CalendarIcon } from '../components/AppIcons'
import { useAuth } from '../hooks/useAuth'

const statusOptions = [
  { value: 'Novo', label: 'Novo' },
  { value: 'EmQualificacao', label: 'Em qualificação' },
  { value: 'Agendado', label: 'Agendado' },
  { value: 'Perdido', label: 'Perdido' },
]

const statusLabels = {
  Novo: 'Novo',
  EmQualificacao: 'Em qualificação',
  Agendado: 'Agendado',
  Perdido: 'Perdido',
}

function normalizeText(value) {
  return (value || '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function getInitials(name) {
  return String(name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
}

function formatDateTime(value) {
  if (!value) {
    return 'Não definido'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatTime(value) {
  if (!value) {
    return 'Agora'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function getLastMessage(lead) {
  return [...(lead.mensagens || [])].sort((a, b) => new Date(b.enviadaEmUtc) - new Date(a.enviadaEmUtc))[0]
}

function urgencyTone(urgency) {
  if (urgency >= 5) {
    return 'bg-red-50 text-red-700 ring-1 ring-red-200'
  }

  if (urgency >= 4) {
    return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
  }

  return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
}

function urgencyLabel(urgency) {
  if (urgency >= 5) {
    return 'Crítico'
  }

  if (urgency >= 4) {
    return 'Urgente'
  }

  if (urgency >= 3) {
    return 'Prioritário'
  }

  return 'Estável'
}

function InboxSearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="m16 16 4 4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" aria-hidden="true">
      <path
        d="M6.8 4.75h2.1c.47 0 .88.32 1 .78l.53 2.17c.1.4-.03.82-.35 1.08l-1.2 1c.82 1.62 2.1 2.9 3.72 3.72l1-1.2c.26-.32.68-.45 1.08-.35l2.17.53c.46.12.78.53.78 1v2.1c0 .58-.44 1.05-1.02 1.1-.41.03-.82.05-1.23.05-6.02 0-10.9-4.88-10.9-10.9 0-.41.02-.82.05-1.23.05-.58.52-1.02 1.1-1.02Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MessageIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" aria-hidden="true">
      <path
        d="M5.75 6.25h12.5A1.75 1.75 0 0 1 20 8v8a1.75 1.75 0 0 1-1.75 1.75H8.5L4 20V8a1.75 1.75 0 0 1 1.75-1.75Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" aria-hidden="true">
      <path
        d="m5 19 3.25-.6L18 8.65a1.6 1.6 0 0 0-2.26-2.26L6 16.15 5 19Zm8.5-10.75 2.25 2.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function HistoryIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" aria-hidden="true">
      <path
        d="M4.5 12A7.5 7.5 0 1 0 7 6.4M4.5 4.75v3.5H8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" aria-hidden="true">
      <circle cx="12" cy="5.5" r="1.4" fill="currentColor" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" />
      <circle cx="12" cy="18.5" r="1.4" fill="currentColor" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M4 19 20 12 4 5l2.75 7L4 19Zm2.75-7H20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function InboxRow({ lead, selected, onSelect }) {
  const lastMessage = getLastMessage(lead)

  return (
    <button
      type="button"
      onClick={() => onSelect(lead.id)}
      className={`flex w-full items-start gap-3 border-b border-black/6 px-5 py-4 text-left transition ${
        selected ? 'bg-[#f7f4f3]' : 'bg-white hover:bg-[#faf7f6]'
      }`}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#ece8e7] text-[13px] font-semibold text-[var(--ink-900)]">
        {getInitials(lead.nome)}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-[15px] font-medium text-[var(--ink-900)]">{lead.nome}</div>
            <div className="mt-1 truncate text-[13px] text-[var(--ink-600)]">
              {lastMessage?.conteudo || lead.resumoInteracao || lead.motivoContato}
            </div>
          </div>

          <div className="shrink-0 text-right">
            <div className="text-[12px] text-[var(--ink-500)]">{formatTime(lastMessage?.enviadaEmUtc || lead.createdAt)}</div>
            <div className="mt-2 inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-[#f3e9e8] px-2 text-[11px] font-semibold text-[#ba4f4f]">
              {lead.urgencia}
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="text-[12px] text-[var(--ink-500)]">WhatsApp</div>
          <div className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${urgencyTone(lead.urgencia)}`}>
            {urgencyLabel(lead.urgencia)}
          </div>
        </div>
      </div>
    </button>
  )
}

function ChatBubble({ mensagem }) {
  const isPatient = mensagem.direcao === 'Paciente'

  return (
    <div className={`flex items-end gap-3 ${isPatient ? 'justify-start' : 'justify-end'}`}>
      {isPatient ? (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ece8e7] text-[10px] font-semibold text-[var(--ink-700)]">
          P
        </div>
      ) : null}

      <div className={`max-w-[82%] ${isPatient ? '' : 'order-first'}`}>
        <div
          className={`rounded-[24px] border px-5 py-4 text-[15px] leading-8 ${
            isPatient
              ? 'border-black/8 bg-white text-[var(--ink-800)]'
              : 'border-black bg-black text-white shadow-[0_16px_40px_rgba(17,17,17,0.18)]'
          }`}
        >
          {mensagem.conteudo}
        </div>
        <div className={`mt-2 text-[12px] text-[var(--ink-500)] ${isPatient ? 'pl-3' : 'pr-3 text-right'}`}>
          {formatTime(mensagem.enviadaEmUtc)}
        </div>
      </div>
    </div>
  )
}

function EmptyConversationState({ onCreate, creating }) {
  return (
    <div className="flex h-full min-h-[720px] flex-col items-center justify-center px-8 text-center">
      <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[#f2eeed] text-[var(--ink-400)]">
        <MessageIcon />
      </div>
      <h2 className="mt-8 text-[2rem] font-medium tracking-[-0.04em] text-[var(--ink-900)]">Nenhum contato selecionado</h2>
      <p className="mt-4 max-w-[30rem] text-[17px] leading-8 text-[var(--ink-500)]">
        Selecione um contato da fila para ver a conversa do pré-atendimento, os detalhes do paciente e o resumo da triagem da IA.
      </p>
      <button type="button" onClick={onCreate} disabled={creating} className="btn-primary mt-8 min-w-[12rem]">
        {creating ? 'Criando...' : 'Criar lead de teste'}
      </button>
    </div>
  )
}

export default function IaAtendimento() {
  const { user, logout } = useAuth()
  const [leads, setLeads] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function loadLeads() {
    try {
      setError('')
      const data = await getIaLeads()
      setLeads(data)
      setSelectedId((current) => current || data[0]?.id || null)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Não foi possível carregar os atendimentos de IA.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadLeads()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [])

  const filteredLeads = useMemo(() => {
    const needle = normalizeText(searchTerm)

    return leads
      .filter((lead) => {
        if (!needle) {
          return true
        }

        return [lead.nome, lead.telefoneWhatsapp, lead.motivoContato, lead.procedimentoInteresse]
          .some((value) => normalizeText(value).includes(needle))
      })
      .sort((a, b) => b.urgencia - a.urgencia || new Date(a.createdAt) - new Date(b.createdAt))
  }, [leads, searchTerm])

  const selectedLead = leads.find((lead) => lead.id === selectedId) || filteredLeads[0] || null
  const orderedMessages = useMemo(
    () => [...(selectedLead?.mensagens || [])].sort((a, b) => new Date(a.enviadaEmUtc) - new Date(b.enviadaEmUtc)),
    [selectedLead],
  )

  function mergeLead(updatedLead) {
    setLeads((current) => current.map((lead) => (lead.id === updatedLead.id ? updatedLead : lead)))
    setSelectedId(updatedLead.id)
  }

  async function handleAssume() {
    if (!selectedLead) {
      return
    }

    try {
      setSaving(true)
      setError('')
      mergeLead(await assumirIaLead(selectedLead.id))
    } catch (err) {
      setError(getApiErrorMessage(err, 'Não foi possível assumir a conversa.'))
    } finally {
      setSaving(false)
    }
  }

  async function handleStatusChange(event) {
    if (!selectedLead) {
      return
    }

    try {
      setSaving(true)
      setError('')
      mergeLead(await atualizarIaLeadStatus(selectedLead.id, event.target.value))
    } catch (err) {
      setError(getApiErrorMessage(err, 'Não foi possível atualizar o status.'))
    } finally {
      setSaving(false)
    }
  }

  async function handleSendMessage(event) {
    event.preventDefault()

    if (!selectedLead || !message.trim()) {
      return
    }

    try {
      setSaving(true)
      setError('')
      mergeLead(await adicionarIaMensagem(selectedLead.id, { direcao: 'Humano', conteudo: message.trim() }))
      setMessage('')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Não foi possível enviar a mensagem.'))
    } finally {
      setSaving(false)
    }
  }

  async function handleCreateDemoLead() {
    try {
      setCreating(true)
      setError('')
      const lead = await criarIaLead({
        nome: 'Lead WhatsApp',
        telefoneWhatsapp: '+55 11 96666-2026',
        motivoContato: 'Dor moderada e dúvida sobre horário',
        urgencia: 4,
        procedimentoInteresse: 'Urgência odontológica',
        resumoInteracao: 'Contato criado para simular entrada da IA de pré-atendimento.',
        sentimento: 'Preocupado',
        mensagemInicial: 'Estou com dor desde ontem e queria saber se tem horário hoje.',
      })

      setLeads((current) => [lead, ...current])
      setSelectedId(lead.id)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Não foi possível criar o lead de teste.'))
    } finally {
      setCreating(false)
    }
  }

  return (
    <AppShell title="IA Pré-atendimento" user={user} onLogout={logout} actions={<></>}>
      <div className="space-y-5">
        <FeedbackMessage message={error} />

        <section className="grid gap-0 overflow-hidden rounded-[28px] border border-black/8 bg-white shadow-[0_18px_50px_rgba(17,17,17,0.06)] xl:grid-cols-[28rem_minmax(0,1fr)]">
          <aside className="border-r border-black/8 bg-[#fdfafa]">
            <div className="border-b border-black/8 px-5 py-5">
              <div className="flex items-center gap-3">
                <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(180deg,#f4f0ef_0%,#e8e3e2_100%)] text-[15px] font-semibold text-[var(--ink-900)]">
                  {selectedLead ? getInitials(selectedLead.nome) : 'IA'}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[1.1rem] font-medium tracking-[-0.03em] text-[var(--ink-900)]">
                    {selectedLead?.nome || 'Fila de contatos'}
                  </div>
                  <div className="mt-1 text-[13px] text-[var(--ink-500)]">
                    {selectedLead ? selectedLead.telefoneWhatsapp : 'WhatsApp ativo'}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-b border-black/8 px-5 py-4">
              <label className="flex items-center gap-3 rounded-[16px] border border-black/8 bg-[#f5f1f0] px-4 py-3 text-[var(--ink-500)]">
                <InboxSearchIcon />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Buscar contatos..."
                  className="min-w-0 flex-1 bg-transparent text-[15px] text-[var(--ink-900)] outline-none placeholder:text-[var(--ink-500)]"
                />
              </label>

              <div className="mt-4 flex items-center justify-between text-[13px]">
                <div className="text-[var(--ink-500)]">
                  Ordenar por: <span className="font-medium text-[var(--ink-900)]">Urgência</span>
                </div>
                <button
                  type="button"
                  onClick={handleCreateDemoLead}
                  disabled={creating}
                  className="rounded-full border border-black/8 bg-white px-3 py-1.5 text-[12px] font-medium text-[var(--ink-700)] transition hover:bg-[#f7f4f3]"
                >
                  {creating ? 'Criando...' : 'Novo teste'}
                </button>
              </div>
            </div>

            <div className="max-h-[calc(100vh-22rem)] overflow-y-auto">
              {loading ? (
                <div className="px-5 py-8 text-[14px] text-[var(--ink-500)]">Carregando contatos...</div>
              ) : filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => (
                  <InboxRow key={lead.id} lead={lead} selected={lead.id === selectedLead?.id} onSelect={setSelectedId} />
                ))
              ) : (
                <div className="px-5 py-10 text-center text-[14px] text-[var(--ink-500)]">
                  Nenhum lead encontrado para os filtros atuais.
                </div>
              )}
            </div>
          </aside>

          {!selectedLead ? (
            <EmptyConversationState onCreate={handleCreateDemoLead} creating={creating} />
          ) : (
            <div className="grid min-h-[720px] gap-0 2xl:grid-cols-[29rem_minmax(0,1fr)]">
              <div className="border-r border-black/8 bg-[#fdfafa] p-5">
                <div className="rounded-[28px] border border-black/6 bg-white px-6 py-8 shadow-[0_16px_40px_rgba(17,17,17,0.04)]">
                  <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-[linear-gradient(180deg,#f4f0ef_0%,#ebe6e5_100%)] text-[26px] font-semibold text-[var(--ink-900)]">
                    {getInitials(selectedLead.nome)}
                  </div>
                  <div className="mt-6 text-center">
                    <div className="text-[2rem] font-medium tracking-[-0.04em] text-[var(--ink-900)]">{selectedLead.nome}</div>
                    <div className="mt-2 text-[1.05rem] text-[var(--ink-600)]">{selectedLead.telefoneWhatsapp}</div>
                  </div>

                  <div className="mt-7 flex justify-center gap-3">
                    <button type="button" className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#f2efee] text-[var(--ink-700)]">
                      <PhoneIcon />
                    </button>
                    <button type="button" className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#f2efee] text-[var(--ink-700)]">
                      <MessageIcon />
                    </button>
                    <button type="button" onClick={handleAssume} disabled={saving} className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#f2efee] text-[var(--ink-700)]">
                      <EditIcon />
                    </button>
                  </div>
                </div>

                <div className="mt-5 rounded-[28px] border border-black/6 bg-white px-6 py-6 shadow-[0_16px_40px_rgba(17,17,17,0.04)]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[1.05rem] font-medium text-[var(--ink-900)]">Análise da IA</div>
                    <div className={`rounded-full px-3 py-1 text-[12px] font-semibold ${urgencyTone(selectedLead.urgencia)}`}>
                      Urgência: {selectedLead.urgencia}/5
                    </div>
                  </div>

                  <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    <div>
                      <div className="text-[13px] text-[var(--ink-500)]">Motivo principal</div>
                      <div className="mt-2 text-[1.1rem] font-medium text-[var(--ink-900)]">{selectedLead.procedimentoInteresse}</div>
                    </div>
                    <div>
                      <div className="text-[13px] text-[var(--ink-500)]">Sentimento</div>
                      <div className="mt-2 text-[1.1rem] font-medium text-[var(--ink-900)]">{selectedLead.sentimento || 'Não classificado'}</div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="text-[13px] text-[var(--ink-500)]">Resumo da interação</div>
                    <div className="mt-3 rounded-[18px] border border-black/8 bg-[#f9f6f5] px-4 py-4 text-[15px] leading-8 text-[var(--ink-800)]">
                      {selectedLead.resumoInteracao || selectedLead.motivoContato}
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block">
                      <span className="text-[13px] text-[var(--ink-500)]">Status da conversa</span>
                      <select
                        value={selectedLead.status}
                        onChange={handleStatusChange}
                        disabled={saving}
                        className="mt-2 w-full rounded-[16px] border border-black/8 bg-[#f5f1f0] px-4 py-3 text-[15px] text-[var(--ink-900)] outline-none"
                      >
                        {statusOptions.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <Link to="/agenda" className="btn-primary flex w-full items-center justify-center gap-2.5">
                    <CalendarIcon className="h-4.5 w-4.5" />
                    Agendar consulta
                  </Link>
                  <button
                    type="button"
                    onClick={handleAssume}
                    disabled={saving}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#efebea] px-6 py-4 text-[15px] font-medium text-[var(--ink-800)] transition hover:bg-[#e8e2e1]"
                  >
                    {selectedLead.atendimentoAssumido ? 'Conversa assumida' : 'Assumir conversa'}
                  </button>
                </div>
              </div>

              <div className="flex min-h-[720px] flex-col bg-white">
                <div className="flex items-center justify-between gap-4 border-b border-black/8 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ece8e7] text-[14px] font-semibold text-[var(--ink-900)]">
                      {getInitials(selectedLead.nome)}
                    </div>
                    <div>
                      <div className="text-[1.1rem] font-medium text-[var(--ink-900)]">{selectedLead.nome}</div>
                      <div className="mt-1 flex items-center gap-2 text-[13px] text-[var(--ink-500)]">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        {selectedLead.atendimentoAssumido ? 'Humano ativo' : 'IA conduzindo'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="hidden rounded-[14px] border border-black/8 bg-[#f5f1f0] px-4 py-3 text-left md:block">
                      <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--ink-500)]">Unidade</div>
                      <div className="mt-1 text-[15px] font-medium text-[var(--ink-900)]">Matriz - São Paulo</div>
                    </div>
                    <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--ink-700)] transition hover:bg-[#f5f1f0]">
                      <HistoryIcon />
                    </button>
                    <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--ink-700)] transition hover:bg-[#f5f1f0]">
                      <MoreIcon />
                    </button>
                  </div>
                </div>

                <div className="px-6 py-6">
                  <div className="mx-auto inline-flex rounded-full bg-[#f2efee] px-4 py-2 text-[13px] font-medium text-[var(--ink-600)]">
                    Hoje
                  </div>
                </div>

                <div className="flex-1 space-y-6 overflow-y-auto px-6 pb-6">
                  {orderedMessages.length > 0 ? (
                    orderedMessages.map((mensagem) => <ChatBubble key={mensagem.id} mensagem={mensagem} />)
                  ) : (
                    <div className="rounded-[24px] border border-dashed border-black/10 px-6 py-10 text-center text-[15px] text-[var(--ink-500)]">
                      Histórico ainda vazio.
                    </div>
                  )}
                </div>

                <div className="border-t border-black/8 px-4 py-4">
                  <form onSubmit={handleSendMessage} className="flex items-center gap-3 rounded-full border border-black/8 bg-white px-4 py-3 shadow-[0_10px_24px_rgba(17,17,17,0.04)]">
                    <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--ink-500)] transition hover:bg-[#f5f1f0]">
                      <span className="text-[24px] leading-none">+</span>
                    </button>
                    <input
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      placeholder="Digite uma mensagem para intervir..."
                      className="min-w-0 flex-1 bg-transparent text-[15px] text-[var(--ink-900)] outline-none placeholder:text-[var(--ink-500)]"
                    />
                    <button
                      type="submit"
                      disabled={saving || !message.trim()}
                      className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-black text-white transition disabled:cursor-not-allowed disabled:bg-black/30"
                    >
                      <SendIcon />
                    </button>
                  </form>
                  <div className="mt-3 text-center text-[13px] text-[var(--ink-500)]">
                    {selectedLead.atendimentoAssumido ? 'Humano está conduzindo o atendimento.' : 'IA está conduzindo o atendimento.'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  )
}
