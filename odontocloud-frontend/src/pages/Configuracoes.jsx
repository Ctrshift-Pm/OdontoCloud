import { useEffect, useMemo, useState } from 'react'
import { getApiErrorMessage } from '../api/client'
import { obterDentistas, atualizarAgendaDentista } from '../api/agenda'
import { DEFAULT_AGENDA_CONFIG } from '../components/agenda/agendaUtils'
import AppShell from '../components/AppShell'
import FeedbackMessage from '../components/FeedbackMessage'
import { useAuth } from '../hooks/useAuth'

const DURACOES_SUGERIDAS = [10, 15, 20, 30, 45, 60, 75, 90, 105, 120]
const DIAS_DA_SEMANA = [
  { valor: 0, nome: 'Domingo' },
  { valor: 1, nome: 'Segunda-feira' },
  { valor: 2, nome: 'Terca-feira' },
  { valor: 3, nome: 'Quarta-feira' },
  { valor: 4, nome: 'Quinta-feira' },
  { valor: 5, nome: 'Sexta-feira' },
  { valor: 6, nome: 'Sabado' },
]

function normalizarDias(dias) {
  if (!Array.isArray(dias) || dias.length === 0) {
    return [...DEFAULT_AGENDA_CONFIG.diasDaSemana]
  }

  const limpo = dias.filter((dia) => Number.isInteger(dia) && dia >= 0 && dia <= 6)
  return limpo.length > 0 ? [...new Set(limpo)].sort((left, right) => left - right) : [...DEFAULT_AGENDA_CONFIG.diasDaSemana]
}

function toDiasLabel(diasDaSemana) {
  return new Set(diasDaSemana)
}

export default function Configuracoes() {
  const { user, logout } = useAuth()
  const [dentistas, setDentistas] = useState([])
  const [selectedDentistaId, setSelectedDentistaId] = useState('')
  const [inicio, setInicio] = useState(DEFAULT_AGENDA_CONFIG.inicio)
  const [fim, setFim] = useState(DEFAULT_AGENDA_CONFIG.fim)
  const [duracaoPadraoMinutos, setDuracaoPadraoMinutos] = useState(DEFAULT_AGENDA_CONFIG.duracaoPadraoMinutos)
  const [diasDaSemana, setDiasDaSemana] = useState([...DEFAULT_AGENDA_CONFIG.diasDaSemana])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  const dentistasOptions = useMemo(
    () =>
      dentistas
        .map((dentista) => ({
          id: dentista.id,
          nome: dentista.nome,
          agendaConfig: dentista.agendaConfig ?? null,
        }))
        .sort((left, right) => left.nome.localeCompare(right.nome)),
    [dentistas],
  )

  async function carregarDentistas(selectedIdToPreserve = null) {
    setCarregando(true)
    setErro('')

    try {
      const response = await obterDentistas()
      const list = Array.isArray(response) ? response : []
      const selectedId = selectedIdToPreserve && list.some((item) => item.id === selectedIdToPreserve) ? selectedIdToPreserve : list[0]?.id ?? ''
      setDentistas(list)

      setSelectedDentistaId(selectedId)

      const selecionado = list.find((item) => item.id === selectedId)
      const agendaConfig = selecionado?.agendaConfig

      if (!agendaConfig) {
        setInicio(DEFAULT_AGENDA_CONFIG.inicio)
        setFim(DEFAULT_AGENDA_CONFIG.fim)
        setDuracaoPadraoMinutos(DEFAULT_AGENDA_CONFIG.duracaoPadraoMinutos)
        setDiasDaSemana([...DEFAULT_AGENDA_CONFIG.diasDaSemana])
      }
      else {
        setInicio(agendaConfig.inicio || DEFAULT_AGENDA_CONFIG.inicio)
        setFim(agendaConfig.fim || DEFAULT_AGENDA_CONFIG.fim)
        setDuracaoPadraoMinutos(
          Number.isInteger(agendaConfig.duracaoPadraoMinutos)
            ? agendaConfig.duracaoPadraoMinutos
            : DEFAULT_AGENDA_CONFIG.duracaoPadraoMinutos,
        )
        setDiasDaSemana(normalizarDias(agendaConfig.diasDaSemana))
      }
    } catch (error) {
      setErro(getApiErrorMessage(error, 'Nao foi possivel carregar os dentistas.'))
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void carregarDentistas()
  }, [])

  function onToggleDia(targetDia) {
    setDiasDaSemana((atual) =>
      atual.includes(targetDia) ? atual.filter((dia) => dia !== targetDia) : [...atual, targetDia].sort((left, right) => left - right),
    )
  }

  async function salvarAgendaConfig(event) {
    event.preventDefault()
    setErro('')
    setSucesso('')

    if (!selectedDentistaId) {
      setErro('Selecione um dentista para salvar.')
      return
    }

    if (!diasDaSemana.length) {
      setErro('Selecione pelo menos um dia de atendimento.')
      return
    }

    setSalvando(true)

    try {
      const payload = {
        inicio,
        fim,
        duracaoPadraoMinutos: Number(duracaoPadraoMinutos),
        diasDaSemana: [...new Set(diasDaSemana)],
      }

      await atualizarAgendaDentista(selectedDentistaId, payload)
      setSucesso('Configuracao da agenda salva com sucesso.')
      await carregarDentistas(selectedDentistaId)
    } catch (error) {
      setErro(getApiErrorMessage(error, 'Nao foi possivel salvar a configuracao.'))
    } finally {
      setSalvando(false)
    }
  }

  const diasSelecionados = toDiasLabel(diasDaSemana)

  return (
    <AppShell title="Configuracoes" subtitle="Regras operacionais da agenda por dentista." user={user} onLogout={logout}>
      <section className="surface-card rounded-[28px] p-4 sm:p-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-[var(--ink-900)]">Agenda por dentista</h1>
          <p className="text-sm text-[var(--ink-500)]">Ajuste horarios, duracao padrao e dias de atendimento por profissional.</p>
        </div>

        <div className="mt-6 space-y-4">
          <FeedbackMessage type="error" message={erro} />
          <FeedbackMessage type="success" message={sucesso} />
        </div>

        {carregando ? (
          <p className="mt-6 text-sm text-[var(--ink-500)]">Carregando dentistas...</p>
        ) : dentistasOptions.length === 0 ? (
          <p className="mt-6 text-sm text-[var(--ink-500)]">
            Nao ha dentistas cadastrados nesta clinica para configurar agenda.
          </p>
        ) : (
          <form className="mt-6 space-y-6" onSubmit={salvarAgendaConfig}>
            <div className="space-y-2">
              <label htmlFor="config-dentista" className="text-sm font-semibold text-[var(--ink-700)]">
                Dentista
              </label>
              <select
                id="config-dentista"
                data-testid="configuracoes-dentista"
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 outline-none transition focus:border-[var(--brand-500)]"
                value={selectedDentistaId}
                onChange={(event) => {
                  const idSelecionado = event.target.value
                  const selecionado = dentistasOptions.find((item) => item.id === idSelecionado)

                  setSelectedDentistaId(idSelecionado)
                  setErro('')
                  setSucesso('')

                  if (!selecionado || !selecionado.agendaConfig) {
                    setInicio(DEFAULT_AGENDA_CONFIG.inicio)
                    setFim(DEFAULT_AGENDA_CONFIG.fim)
                    setDuracaoPadraoMinutos(DEFAULT_AGENDA_CONFIG.duracaoPadraoMinutos)
                    setDiasDaSemana([...DEFAULT_AGENDA_CONFIG.diasDaSemana])
                    return
                  }

                  setInicio(selecionado.agendaConfig.inicio || DEFAULT_AGENDA_CONFIG.inicio)
                  setFim(selecionado.agendaConfig.fim || DEFAULT_AGENDA_CONFIG.fim)
                  setDuracaoPadraoMinutos(
                    Number.isInteger(selecionado.agendaConfig.duracaoPadraoMinutos)
                      ? selecionado.agendaConfig.duracaoPadraoMinutos
                      : DEFAULT_AGENDA_CONFIG.duracaoPadraoMinutos,
                  )
                  setDiasDaSemana(normalizarDias(selecionado.agendaConfig.diasDaSemana))
                }}
              >
                <option value="">Selecione um dentista</option>
                {dentistasOptions.map((dentista) => (
                  <option key={dentista.id} value={dentista.id}>
                    {dentista.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label htmlFor="agenda-inicio" className="text-sm font-semibold text-[var(--ink-700)]">
                  Inicio
                </label>
                <input
                  id="agenda-inicio"
                  data-testid="agenda-inicio"
                  type="time"
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 outline-none transition focus:border-[var(--brand-500)]"
                  value={inicio}
                  onChange={(event) => setInicio(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="agenda-fim" className="text-sm font-semibold text-[var(--ink-700)]">
                  Fim
                </label>
                <input
                  id="agenda-fim"
                  data-testid="agenda-fim"
                  type="time"
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 outline-none transition focus:border-[var(--brand-500)]"
                  value={fim}
                  onChange={(event) => setFim(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="agenda-duracao" className="text-sm font-semibold text-[var(--ink-700)]">
                  Duracao padrao (minutos)
                </label>
                <select
                  id="agenda-duracao"
                  data-testid="agenda-duracao"
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 outline-none transition focus:border-[var(--brand-500)]"
                  value={duracaoPadraoMinutos}
                  onChange={(event) => setDuracaoPadraoMinutos(Number(event.target.value))}
                >
                  {DURACOES_SUGERIDAS.map((duracao) => (
                    <option key={duracao} value={duracao}>
                      {duracao} min
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-[var(--ink-700)]">Dias de atendimento</p>
                <p className="text-sm text-[var(--ink-500)]">
                  Sábado e domingo podem ser ativados por dentista de forma independente.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
                {DIAS_DA_SEMANA.map((dia) => {
                  const marcado = diasSelecionados.has(dia.valor)
                  return (
                    <label key={dia.valor} className="flex cursor-pointer items-center gap-2 rounded-xl border border-black/10 px-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        data-testid={`agenda-dia-${dia.valor}`}
                        checked={marcado}
                        onChange={() => onToggleDia(dia.valor)}
                      />
                      <span>{dia.nome}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="submit"
                disabled={salvando || !selectedDentistaId || diasDaSemana.length === 0}
                className="btn-primary w-full sm:w-auto"
              >
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        )}
      </section>
    </AppShell>
  )
}
