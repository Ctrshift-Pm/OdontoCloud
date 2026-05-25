import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AppShell from '../components/AppShell'
import { getApiErrorMessage } from '../api/client'
import { getDashboardResumo } from '../api/dashboard'
import { useAuth } from '../hooks/useAuth'

const MOEDA_BR = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const FORMATO_DATA_HORA = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
})

function formatarMoeda(valor) {
  return MOEDA_BR.format(valor || 0)
}

function formatarDataHora(dataHora) {
  if (!dataHora) {
    return 'Sem data'
  }

  const data = new Date(dataHora)
  if (Number.isNaN(data.getTime())) {
    return 'Data invalida'
  }

  return FORMATO_DATA_HORA.format(data)
}

function MetricCard({ label, value }) {
  return (
    <div className="rounded-[24px] border border-black/10 bg-white px-5 py-4">
      <div className="text-sm text-[var(--ink-500)]">{label}</div>
      <div className="mt-3 text-3xl font-semibold text-[var(--ink-900)]">{value}</div>
    </div>
  )
}

function ListaVazia({ mensagem }) {
  return <p className="rounded-2xl border border-black/10 bg-stone-50 px-4 py-4 text-sm text-[var(--ink-500)]">{mensagem}</p>
}

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [resumo, setResumo] = useState(null)

  const loadResumo = async () => {
    setIsLoading(true)
    setError('')

    try {
      const data = await getDashboardResumo()
      setResumo(data || null)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Nao foi possivel carregar os dados do dashboard.'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadResumo()
  }, [])

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

  return (
    <AppShell title="Dashboard" subtitle="Indicadores operacionais em tempo real da clinica." user={user} onLogout={logout}>
      <div className="space-y-6">
        {isLoading ? (
          <div className="rounded-[28px] border border-black/10 bg-[var(--surface-muted)] px-6 py-10 text-center text-sm text-[var(--ink-500)]">
            Carregando dados do dashboard...
          </div>
        ) : (
          <>
            {error ? (
              <div className="rounded-[28px] border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-700">
                {error}
                <button
                  type="button"
                  onClick={loadResumo}
                  className="ml-4 inline-flex rounded-xl border border-red-300 px-3 py-1.5 text-sm font-medium hover:bg-red-100"
                >
                  Tentar novamente
                </button>
              </div>
            ) : null}

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-7">
              <MetricCard label="Pacientes totais" value={resumoSeguro.totalPacientes} />
              <MetricCard label="Agendamentos de hoje" value={resumoSeguro.agendamentosHoje} />
              <MetricCard label="Proximos agendamentos" value={resumoSeguro.agendamentosProximos} />
              <MetricCard label="Contas a receber pendentes" value={resumoSeguro.contasReceberPendentes} />
              <MetricCard label="Contas a pagar pendentes / atrasadas" value={resumoSeguro.contasPagarPendentes} />
              <MetricCard label="Total pendente a receber" value={formatarMoeda(resumoSeguro.totalPendenteReceber)} />
              <MetricCard label="Total pendente a pagar" value={formatarMoeda(resumoSeguro.totalPendentePagar)} />
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <div className="surface-card p-6">
                <h2 className="text-lg font-semibold text-[var(--ink-900)]">Pacientes por status do funil</h2>
                <p className="mt-1 text-sm text-[var(--ink-500)]">
                  Visao consolidada do CRM para monitorar a distribuicao por etapa.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {resumoSeguro.pacientesPorStatusKanban.length === 0 ? (
                    <ListaVazia mensagem="Nenhum paciente encontrado para o funil ainda." />
                  ) : (
                    resumoSeguro.pacientesPorStatusKanban.map((item) => (
                      <div
                        key={item.status}
                        className="rounded-2xl border border-black/10 bg-stone-50 px-4 py-3 text-sm"
                      >
                        <div className="text-[var(--ink-500)]">{item.status}</div>
                        <div className="mt-1 text-2xl font-semibold text-[var(--ink-900)]">{item.quantidade}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="surface-card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--ink-900)]">Proximos agendamentos</h2>
                    <p className="mt-1 text-sm text-[var(--ink-500)]">
                      Lista curta para acompanhar os compromissos proximos de 7 dias.
                    </p>
                  </div>
                  <Link
                    to="/agenda"
                    className="text-sm font-semibold text-[var(--accent-600)] hover:text-[var(--accent-700)]"
                  >
                    Ver agenda
                  </Link>
                </div>

                <div className="mt-6 space-y-3">
                  {resumoSeguro.proximosAgendamentos.length === 0 ? (
                    <ListaVazia mensagem="Nenhum agendamento nos proximos 7 dias." />
                  ) : (
                    resumoSeguro.proximosAgendamentos.map((agendamento) => (
                      <article
                        key={`${agendamento.pacienteNome}-${agendamento.dataHora}`}
                        className="rounded-2xl border border-black/10 bg-stone-50 px-4 py-3 text-sm"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-semibold text-[var(--ink-900)]">{agendamento.pacienteNome}</p>
                          <span className="rounded-lg bg-stone-200 px-2 py-1 text-xs text-[var(--ink-600)]">
                            {agendamento.status}
                          </span>
                        </div>
                        <p className="mt-2 text-[var(--ink-500)]">{agendamento.procedimento}</p>
                        <div className="mt-2 flex flex-wrap gap-3 text-xs text-[var(--ink-500)]">
                          <span>Dentista: {agendamento.dentistaNome || 'Nao definido'}</span>
                          <span>Data: {formatarDataHora(String(agendamento.dataHora))}</span>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </AppShell>
  )
}
