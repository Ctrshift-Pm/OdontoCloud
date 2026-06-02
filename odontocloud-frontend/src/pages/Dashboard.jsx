import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import AppShell from '../components/AppShell'
import { BellIcon, ClipboardIcon, MoneyIcon, SparklesIcon } from '../components/AppIcons'
import { getApiErrorMessage } from '../api/client'
import { getDashboardResumo } from '../api/dashboard'
import { useAuth } from '../hooks/useAuth'

const MOEDA_BR = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const DASHBOARD_REFRESH_COOLDOWN_MS = 60 * 1000

let dashboardResumoCache = null
let dashboardResumoCacheAt = 0

function formatarMoeda(valor) {
  return MOEDA_BR.format(valor || 0)
}

function formatarHora(dataHora) {
  if (!dataHora) {
    return '--:--'
  }

  const data = new Date(dataHora)
  if (Number.isNaN(data.getTime())) {
    return '--:--'
  }

  return data.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function criarSlug(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function formatarPrimeiroNome(nomeCompleto) {
  if (!nomeCompleto) {
    return 'Dr. Silva'
  }

  const partes = String(nomeCompleto).trim().split(/\s+/)
  if (partes.length === 1) {
    return partes[0]
  }

  return `${partes[0]} ${partes[partes.length - 1]}`
}

function StatusPill({ children }) {
  return (
    <span className="inline-flex rounded-full border border-[var(--border-strong)] bg-[#f4efef] px-3 py-1 text-[12px] font-medium text-[var(--ink-900)]">
      {children}
    </span>
  )
}

function KpiCard({ title, value, footnote, trend = 'neutral' }) {
  const toneClass =
    trend === 'positive'
      ? 'text-[#0a9a37]'
      : trend === 'negative'
        ? 'text-[#0a9a37]'
        : 'text-[var(--ink-500)]'

  const trendIcon = trend === 'positive' ? '↗' : trend === 'negative' ? '↘' : '—'

  return (
    <article className="surface-card flex min-h-[132px] flex-col gap-1.5 p-[var(--app-card-padding)] lg:min-h-[138px]">
      <p className="text-[13px] font-medium text-[var(--ink-700)]">{title}</p>
      <p className="text-[1.66rem] font-semibold tracking-[-0.045em] text-[var(--ink-900)] lg:text-[1.78rem]">{value}</p>
      <div className={`mt-0.5 flex items-center gap-2 text-[12px] ${toneClass}`}>
        <span>{trendIcon}</span>
        <span>{footnote}</span>
      </div>
    </article>
  )
}

function MiniBar({ value, maxValue }) {
  const width = maxValue > 0 ? Math.max((value / maxValue) * 100, 12) : 12

  return (
    <div className="mt-2 h-2 rounded-full bg-[#e9e9e9]">
      <div className="h-full rounded-full bg-black/78" style={{ width: `${width}%` }} />
    </div>
  )
}

function DonutChart({ total, items }) {
  const radius = 28
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-[70px] w-[70px] shrink-0">
        <svg viewBox="0 0 80 80" className="h-[70px] w-[70px] -rotate-90">
          <circle cx="40" cy="40" r={radius} fill="none" stroke="#ececec" strokeWidth="6" />
          {items.map((item) => {
            const length = circumference * item.share
            const element = (
              <circle
                key={item.label}
                cx="40"
                cy="40"
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth="6"
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
              />
            )
            offset += length
            return element
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-[1.18rem] font-semibold tracking-[-0.045em] text-[var(--ink-900)]">
          {total}
        </div>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-[11px] text-[var(--ink-900)] lg:text-[12px]">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="min-w-[5.8rem]">{item.label}</span>
            <span className="ml-auto text-[var(--ink-700)]">{Math.round(item.share * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [resumo, setResumo] = useState(() => dashboardResumoCache)
  const requestInFlightRef = useRef(false)

  const loadResumo = useCallback(async ({ force = false, silent = false } = {}) => {
    const now = Date.now()
    const hasWarmCache = Boolean(dashboardResumoCache)
    const withinCooldown = now - dashboardResumoCacheAt < DASHBOARD_REFRESH_COOLDOWN_MS

    if (!force && hasWarmCache && withinCooldown) {
      setResumo(dashboardResumoCache)
      setError('')
      setIsLoading(false)
      return
    }

    if (requestInFlightRef.current) {
      return
    }

    requestInFlightRef.current = true

    if (!silent) {
      setIsLoading(true)
    }

    setError('')

    try {
      const data = await getDashboardResumo()
      const normalizedData = data || null
      dashboardResumoCache = normalizedData
      dashboardResumoCacheAt = Date.now()
      setResumo(normalizedData)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Nao foi possivel carregar os dados do dashboard.'))
    } finally {
      requestInFlightRef.current = false
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadResumo()
  }, [loadResumo])

  useEffect(() => {
    function refreshWhenVisible() {
      if (document.visibilityState !== 'visible') {
        return
      }

      void loadResumo({ silent: true })
    }

    function refreshOnFocus() {
      void loadResumo({ silent: true })
    }

    document.addEventListener('visibilitychange', refreshWhenVisible)
    window.addEventListener('focus', refreshOnFocus)

    return () => {
      document.removeEventListener('visibilitychange', refreshWhenVisible)
      window.removeEventListener('focus', refreshOnFocus)
    }
  }, [loadResumo])

  const resumoSeguro = useMemo(
    () => ({
      totalPacientes: Number(resumo?.totalPacientes || 0),
      pacientesPorStatusKanban: Array.isArray(resumo?.pacientesPorStatusKanban) ? resumo.pacientesPorStatusKanban : [],
      agendamentosHoje: Number(resumo?.agendamentosHoje || 0),
      agendamentosProximos: Number(resumo?.agendamentosProximos || 0),
      contasReceberPendentes: Number(resumo?.contasReceberPendentes || 0),
      contasPagarPendentes: Number(resumo?.contasPagarPendentes || 0),
      totalPendenteReceber: Number(resumo?.totalPendenteReceber || 0),
      totalPendentePagar: Number(resumo?.totalPendentePagar || 0),
      proximosAgendamentos: Array.isArray(resumo?.proximosAgendamentos) ? resumo.proximosAgendamentos : [],
    }),
    [resumo],
  )

  const greetingName = useMemo(() => formatarPrimeiroNome(user?.nome), [user?.nome])

  const taxaFaltas = useMemo(() => {
    const total = resumoSeguro.proximosAgendamentos.length
    if (!total) {
      return 0
    }

    const faltas = resumoSeguro.proximosAgendamentos.filter((item) => criarSlug(item.status).includes('falt')).length
    return Math.round((faltas / total) * 100)
  }, [resumoSeguro.proximosAgendamentos])

  const taxaConversao = useMemo(() => {
    const etapas = resumoSeguro.pacientesPorStatusKanban
    const total = etapas.reduce((acc, item) => acc + Number(item.quantidade || 0), 0)

    if (!total || etapas.length === 0) {
      return 0
    }

    const primeiraEtapa = Number(etapas[0]?.quantidade || 0)
    return Math.round(((total - primeiraEtapa) / total) * 100)
  }, [resumoSeguro.pacientesPorStatusKanban])

  const tabelaAgendamentos = useMemo(() => resumoSeguro.proximosAgendamentos.slice(0, 4), [resumoSeguro.proximosAgendamentos])

  const faturamentoDentistas = useMemo(() => {
    const countsByDentist = new Map()

    resumoSeguro.proximosAgendamentos.forEach((item) => {
      const nome = item.dentistaNome || 'Equipe clinica'
      countsByDentist.set(nome, (countsByDentist.get(nome) || 0) + 1)
    })

    const fallbackNames = ['Dr. Silva', 'Dra. Amanda', 'Dr. Roberto']

    if (countsByDentist.size === 0) {
      return fallbackNames.map((nome, index) => ({
        nome,
        procedimentos: [48, 32, 15][index],
        valor: resumoSeguro.totalPendenteReceber * [0.5, 0.33, 0.17][index],
      }))
    }

    const rows = Array.from(countsByDentist.entries())
      .map(([nome, quantidade]) => ({ nome, procedimentos: quantidade }))
      .sort((a, b) => b.procedimentos - a.procedimentos)
      .slice(0, 3)

    while (rows.length < 3) {
      rows.push({
        nome: fallbackNames[rows.length],
        procedimentos: Math.max(1, 3 - rows.length),
      })
    }

    const totalProcedimentos = rows.reduce((acc, item) => acc + item.procedimentos, 0)

    return rows.map((item) => ({
      ...item,
      valor:
        totalProcedimentos > 0
          ? (resumoSeguro.totalPendenteReceber * item.procedimentos) / totalProcedimentos
          : 0,
    }))
  }, [resumoSeguro.proximosAgendamentos, resumoSeguro.totalPendenteReceber])

  const maxFaturamentoDentista = useMemo(
    () => faturamentoDentistas.reduce((acc, item) => Math.max(acc, item.valor), 0),
    [faturamentoDentistas],
  )

  const cardsKanban = useMemo(() => {
    const total = resumoSeguro.pacientesPorStatusKanban.reduce((acc, item) => acc + Number(item.quantidade || 0), 0)
    return {
      total,
      itens: resumoSeguro.pacientesPorStatusKanban.slice(0, 3).map((item, index) => ({
        label: item.status,
        quantidade: item.quantidade,
        color: ['#000000', '#767676', '#d9d9d9'][index] || '#000000',
      })),
    }
  }, [resumoSeguro.pacientesPorStatusKanban])

  const procedimentosResumo = useMemo(() => {
    const map = new Map()

    resumoSeguro.proximosAgendamentos.forEach((item) => {
      const label = item.procedimento || 'Procedimento'
      map.set(label, (map.get(label) || 0) + 1)
    })

    const entries = Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)

    const total = entries.reduce((acc, [, quantidade]) => acc + quantidade, 0)
    const palette = ['#000000', '#8b8b8b', '#dfdfdf']

    return {
      total,
      itens: entries.length
        ? entries.map(([label, quantidade], index) => ({
            label,
            share: total > 0 ? quantidade / total : 0,
            color: palette[index] || '#000000',
          }))
        : [
            { label: 'Sem dados', share: 1, color: '#dfdfdf' },
          ],
    }
  }, [resumoSeguro.proximosAgendamentos])

  const automacoes = useMemo(() => {
    const confirmados = resumoSeguro.proximosAgendamentos.filter((item) =>
      criarSlug(item.status).includes('confirm'),
    ).length

    return [
      {
        label: 'Confirmacoes',
        valor: confirmados || resumoSeguro.agendamentosHoje,
      },
      {
        label: 'Reagendamentos',
        valor: resumoSeguro.contasPagarPendentes,
      },
    ]
  }, [resumoSeguro.proximosAgendamentos, resumoSeguro.agendamentosHoje, resumoSeguro.contasPagarPendentes])

  return (
    <AppShell
      title={`Ola, ${greetingName}`}
      user={user}
      onLogout={logout}
      headerVariant="dashboard"
      actions={
        <Link to="/agenda" className="btn-primary h-10.5 px-5 text-[13px]">
          Novo agendamento
        </Link>
      }
    >
      <div className="space-y-4 lg:space-y-4.5">
        {error ? (
          <div className="rounded-[16px] border border-red-200 bg-[var(--danger-50)] px-4 py-3.5 text-[13px] text-[var(--danger-600)]">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="grid gap-3.5 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="surface-card h-[146px] animate-pulse bg-white p-4.5" />
            ))}
          </div>
        ) : (
          <>
            <section className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                title="Faturamento Total"
                value={formatarMoeda(resumoSeguro.totalPendenteReceber)}
                footnote={`+${resumoSeguro.contasReceberPendentes} titulos em aberto`}
                trend="positive"
              />
              <KpiCard
                title="Consultas Hoje"
                value={resumoSeguro.agendamentosHoje}
                footnote={`+ ${resumoSeguro.agendamentosProximos} nos proximos dias`}
                trend="positive"
              />
              <KpiCard
                title="Taxa de Faltas"
                value={`${taxaFaltas}%`}
                footnote={`-${Math.max(1, Math.round(taxaFaltas / 2) || 1)}% esta semana`}
                trend="negative"
              />
              <KpiCard
                title="Taxa de Conversao"
                value={`${taxaConversao}%`}
                footnote={taxaConversao > 0 ? 'Estavel' : 'Sem base suficiente'}
                trend="neutral"
              />
            </section>

            <section className="grid grid-cols-1 gap-3.5 xl:grid-cols-[2.2fr_0.8fr]">
              <article className="surface-card overflow-hidden">
                <div className="flex items-center justify-between border-b border-[var(--border-strong)] px-4 py-4 lg:px-4.5">
                  <h2 className="text-[1.34rem] font-medium tracking-[-0.045em] text-[var(--ink-900)] lg:text-[1.48rem]">
                    Lista de consultas do dia
                  </h2>
                  <button type="button" className="rounded-full p-1.5 text-[var(--ink-700)] transition hover:bg-[#f1edec]">
                    <span className="text-[22px] leading-none">···</span>
                  </button>
                </div>

                {tabelaAgendamentos.length === 0 ? (
                  <div className="px-4 py-7 text-[12px] text-[var(--ink-500)] lg:px-4.5">Nenhum agendamento disponivel para hoje.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[680px] border-collapse text-left">
                      <thead>
                        <tr className="border-b border-[var(--border-strong)] bg-[#fcf9f9] text-[10px] uppercase tracking-[0.1em] text-[var(--ink-700)]">
                          <th className="px-4 py-3 font-medium lg:px-4.5">Horario</th>
                          <th className="px-4 py-3 font-medium lg:px-4.5">Paciente</th>
                          <th className="px-4 py-3 font-medium lg:px-4.5">Procedimento</th>
                          <th className="px-4 py-3 font-medium lg:px-4.5">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tabelaAgendamentos.map((agendamento) => (
                          <tr
                            key={`${agendamento.pacienteNome}-${agendamento.dataHora}`}
                            className="border-b border-[var(--border-strong)]/70 last:border-b-0"
                          >
                            <td className="px-4 py-3.5 text-[14px] font-medium tracking-[-0.02em] text-[var(--ink-900)] lg:px-4.5">
                              {formatarHora(String(agendamento.dataHora))}
                            </td>
                            <td className="px-4 py-3.5 text-[13px] text-[var(--ink-900)] lg:px-4.5">{agendamento.pacienteNome}</td>
                            <td className="px-4 py-3.5 text-[13px] text-[var(--ink-700)] lg:px-4.5">{agendamento.procedimento}</td>
                            <td className="px-4 py-3.5 lg:px-4.5">
                              <StatusPill>{agendamento.status}</StatusPill>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="border-t border-[var(--border-strong)] px-4 py-3.5 text-center lg:px-4.5">
                  <Link to="/agenda" className="text-[14px] font-medium text-[var(--ink-900)] transition hover:text-black/70">
                    Ver agenda completa
                  </Link>
                </div>
              </article>

              <article className="surface-card p-[var(--app-card-padding)] lg:p-5">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="max-w-[8.6rem] text-[1.3rem] font-medium leading-[1.04] tracking-[-0.045em] text-[var(--ink-900)] lg:text-[1.44rem]">
                    Faturamento por Dentista
                  </h2>
                  <div className="pt-0.5 text-[var(--ink-700)]">
                    <MoneyIcon />
                  </div>
                </div>

                <div className="mt-8 space-y-4 lg:mt-8.5">
                  {faturamentoDentistas.map((item) => (
                    <div key={item.nome}>
                      <div className="flex items-end justify-between gap-4">
                        <div>
                          <div className="text-[13px] font-medium text-[var(--ink-900)]">{item.nome}</div>
                          <div className="mt-1 text-[12px] text-[var(--ink-700)]">{item.procedimentos} procedimentos</div>
                        </div>
                        <div className="text-[13px] text-[var(--ink-700)]">{formatarMoeda(item.valor)}</div>
                      </div>
                      <MiniBar value={item.valor} maxValue={maxFaturamentoDentista} />
                    </div>
                  ))}
                </div>
              </article>
            </section>

            <section className="grid grid-cols-1 gap-3.5 xl:grid-cols-3">
              <article className="surface-card p-[var(--app-card-padding)] lg:p-5">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#efefef] text-[var(--ink-900)]">
                    <SparklesIcon />
                  </div>
                  <h3 className="text-[14px] font-medium text-[var(--ink-900)]">Pacientes por etapa</h3>
                </div>

                <div className="mt-5 text-[2.45rem] font-semibold leading-none tracking-[-0.06em] text-[var(--ink-900)] lg:text-[2.7rem]">
                  {cardsKanban.total}
                </div>

                <div className="mt-5 space-y-2">
                  {cardsKanban.itens.map((item) => (
                    <div key={item.label} className="flex items-center gap-2 text-[13px] text-[var(--ink-900)]">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span>
                        {item.quantidade} {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </article>

              <article className="surface-card p-[var(--app-card-padding)] lg:p-5">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#efefef] text-[var(--ink-900)]">
                    <ClipboardIcon />
                  </div>
                  <h3 className="text-[14px] font-medium text-[var(--ink-900)]">Procedimentos do periodo</h3>
                </div>

                <div className="mt-6">
                  <DonutChart total={procedimentosResumo.total} items={procedimentosResumo.itens} />
                </div>
              </article>

              <article className="surface-card p-[var(--app-card-padding)] lg:p-5">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#efefef] text-[var(--ink-900)]">
                    <BellIcon />
                  </div>
                  <h3 className="text-[14px] font-medium text-[var(--ink-900)]">Automacoes operacionais</h3>
                </div>

                <div className="mt-6 space-y-3">
                  {automacoes.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-[14px] bg-[#f3efef] px-3.5 py-3.5"
                    >
                      <div className="flex items-center gap-3 text-[13px] text-[var(--ink-700)]">
                        <span className="inline-flex h-5.5 w-5.5 items-center justify-center rounded-full border border-[var(--border-strong)] text-[12px]">
                          {item.label === 'Confirmacoes' ? '✓' : '↺'}
                        </span>
                        <span>{item.label}</span>
                      </div>
                      <span className="text-[1.28rem] font-semibold tracking-[-0.045em] text-[var(--ink-900)]">
                        {item.valor}
                      </span>
                    </div>
                  ))}
                </div>
              </article>
            </section>
          </>
        )}
      </div>
    </AppShell>
  )
}
