import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import AppShell from '../components/AppShell'
import FeedbackMessage from '../components/FeedbackMessage'
import { getApiErrorMessage } from '../api/client'
import { getPerfilMe, trocarSenhaPerfil } from '../api/perfil'
import { useAuth } from '../hooks/useAuth'

function toInitials(nome) {
  if (!nome) {
    return 'OC'
  }

  const partes = nome
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)

  if (partes.length === 1) {
    return partes[0].slice(0, 2).toUpperCase()
  }

  return `${partes[0][0]}${partes[1][0]}`.toUpperCase()
}

function formatPerfilValue(value) {
  return value ? String(value) : 'Nao informado'
}

export default function Perfil() {
  const { user, logout } = useAuth()
  const [perfil, setPerfil] = useState(null)
  const [loadingPerfil, setLoadingPerfil] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      senhaAtual: '',
      novaSenha: '',
      confirmacaoSenha: '',
    },
  })

  async function carregarPerfil() {
    setFetchError('')
    setLoadingPerfil(true)

    try {
      const data = await getPerfilMe()
      setPerfil(data)
    } catch (error) {
      setFetchError(getApiErrorMessage(error, 'Nao foi possivel carregar os dados do perfil.'))
    } finally {
      setLoadingPerfil(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void carregarPerfil()
  }, [])

  async function onSubmit(values) {
    setSubmitError('')
    setSubmitSuccess('')

    try {
      await trocarSenhaPerfil({
        senhaAtual: values.senhaAtual,
        novaSenha: values.novaSenha,
        confirmacaoSenha: values.confirmacaoSenha,
      })

      reset()
      setSubmitSuccess('Senha alterada com sucesso.')
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, 'Nao foi possivel alterar a senha.'))
    }
  }

  return (
    <AppShell
      title="Perfil"
      subtitle="Gerencie seus dados de acesso e atualize sua senha."
      user={user}
      onLogout={logout}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="surface-card space-y-6 rounded-[28px] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-[var(--ink-900)]">Dados da conta</h1>
              <p className="mt-1 text-sm text-[var(--ink-500)]">Dados derivados da sessao ativa.</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="btn-secondary shrink-0 whitespace-nowrap py-2"
              title="Encerrar sessao"
            >
              Sair da conta
            </button>
          </div>

          {fetchError ? <FeedbackMessage type="error" message={fetchError} /> : null}

          {loadingPerfil ? (
            <p className="text-sm text-[var(--ink-500)]">Carregando dados...</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-500)] text-sm font-semibold text-white">
                  {toInitials(perfil?.nome || user?.nome)}
                </div>
                <div>
                  <p className="text-base font-semibold text-[var(--ink-900)]">{formatPerfilValue(perfil?.nome || user?.nome)}</p>
                  <p className="text-sm text-[var(--ink-500)]">{formatPerfilValue(perfil?.email || user?.email)}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-black/6 bg-[var(--surface-muted)] p-4">
                <h2 className="text-sm font-semibold text-[var(--ink-700)]">Identidade</h2>
                <div className="mt-3 space-y-2 text-sm text-[var(--ink-700)]">
                  <div className="flex items-center justify-between gap-4">
                    <span>Perfil</span>
                    <span className="font-semibold text-[var(--ink-900)]">{formatPerfilValue(perfil?.perfil || user?.perfil)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>ClinicaId</span>
                    <span className="font-semibold text-[var(--ink-900)]">{formatPerfilValue(perfil?.clinicaId)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>DentistaId</span>
                    <span className="font-semibold text-[var(--ink-900)]">
                      {perfil?.dentistaId ? formatPerfilValue(perfil.dentistaId) : 'Nao vinculado'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="surface-card space-y-5 rounded-[28px] p-6">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--ink-900)]">Seguranca</h1>
            <p className="mt-1 text-sm text-[var(--ink-500)]">Altere a sua senha de acesso.</p>
          </div>

          <FeedbackMessage type="error" message={submitError} />
          <FeedbackMessage type="success" message={submitSuccess} />

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-[var(--ink-700)]" htmlFor="senhaAtual">
                Senha atual
              </label>
              <input
                id="senhaAtual"
                type="password"
                autoComplete="current-password"
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 outline-none transition focus:border-[var(--brand-500)]"
                {...register('senhaAtual', { required: 'Informe a senha atual.' })}
              />
              {errors.senhaAtual ? <p className="text-xs text-red-600">{errors.senhaAtual.message}</p> : null}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-[var(--ink-700)]" htmlFor="novaSenha">
                Nova senha
              </label>
              <input
                id="novaSenha"
                type="password"
                autoComplete="new-password"
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 outline-none transition focus:border-[var(--brand-500)]"
                {...register('novaSenha', {
                  required: 'Informe a nova senha.',
                  minLength: { value: 3, message: 'Informe pelo menos 3 caracteres.' },
                })}
              />
              {errors.novaSenha ? <p className="text-xs text-red-600">{errors.novaSenha.message}</p> : null}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-[var(--ink-700)]" htmlFor="confirmacaoSenha">
                Confirmar nova senha
              </label>
              <input
                id="confirmacaoSenha"
                type="password"
                autoComplete="new-password"
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 outline-none transition focus:border-[var(--brand-500)]"
                {...register('confirmacaoSenha', {
                  required: 'Confirme a nova senha.',
                })}
              />
              {errors.confirmacaoSenha ? <p className="text-xs text-red-600">{errors.confirmacaoSenha.message}</p> : null}
            </div>

            <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Atualizando...' : 'Alterar senha'}
            </button>
          </form>
        </section>
      </div>
    </AppShell>
  )
}
