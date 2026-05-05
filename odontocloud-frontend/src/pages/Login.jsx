import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import { loginRequest } from '../api/auth'
import { getApiErrorMessage } from '../api/client'
import FeedbackMessage from '../components/FeedbackMessage'
import TextField from '../components/TextField'
import { useAuth } from '../hooks/useAuth'

function BrandMark() {
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-[var(--brand-500)] text-white shadow-xl shadow-emerald-900/25">
      <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
        <path
          d="M12 3c-3.9 0-7 2.9-7 7.2 0 4.2 2 10.6 7 10.6s7-6.4 7-10.6C19 5.9 15.9 3 12 3Z"
          fill="currentColor"
          opacity="0.26"
        />
        <path
          d="M8.3 8.8c0-1.1.9-2 2-2h3.4c1.1 0 2 .9 2 2s-.9 2-2 2h-3.4c-1.1 0-2-.9-2-2Zm.4 4.8c0-.9.7-1.6 1.6-1.6h3.4c.9 0 1.6.7 1.6 1.6 0 1.8-1.4 3.3-3.3 3.3s-3.3-1.5-3.3-3.3Z"
          fill="currentColor"
        />
      </svg>
    </div>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, login } = useAuth()
  const [submitError, setSubmitError] = useState('')
  const from = location.state?.from?.pathname || '/pacientes'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      email: 'admin@clinicasorrir.com.br',
      senha: '123',
    },
  })

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/pacientes', { replace: true })
    }
  }, [isAuthenticated, navigate])

  async function onSubmit(values) {
    setSubmitError('')

    try {
      const response = await loginRequest({
        email: values.email.trim(),
        senha: values.senha,
      })

      login(response.token)
      navigate(from, { replace: true })
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, 'Credenciais invalidas.'))
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="absolute inset-0 bg-[linear-gradient(140deg,#0a3d2b_0%,#0f6e56_46%,#1d9e75_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_32%)]" />

      <div className="surface-card relative w-full max-w-[440px] rounded-[2rem] px-7 py-8 sm:px-10 sm:py-10">
        <div className="mb-8 flex items-center gap-4">
          <BrandMark />
          <div>
            <div className="text-xl font-semibold text-[var(--ink-900)]">OdontoCloud</div>
            <div className="text-sm text-[var(--ink-500)]">Gestao segura para clinicas odontologicas</div>
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--ink-900)]">Acesse sua clinica</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--ink-500)]">
            Faca login com seu usuario administrativo para acessar o CRM de pacientes.
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <FeedbackMessage type="error" message={submitError} />

          <TextField
            label="E-mail"
            type="email"
            autoComplete="email"
            placeholder="admin@clinicasorrir.com.br"
            error={errors.email?.message}
            {...register('email', {
              required: 'Informe o e-mail.',
              pattern: {
                value: /\S+@\S+\.\S+/,
                message: 'Informe um e-mail valido.',
              },
            })}
          />

          <TextField
            label="Senha"
            type="password"
            autoComplete="current-password"
            placeholder="Sua senha"
            error={errors.senha?.message}
            {...register('senha', {
              required: 'Informe a senha.',
            })}
          />

          <button type="submit" className="btn-primary mt-2 w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-5 rounded-2xl bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--ink-500)]">
          Ambiente de seed:
          <span className="ml-2 font-semibold text-[var(--ink-700)]">admin@clinicasorrir.com.br / 123</span>
        </div>
      </div>
    </div>
  )
}
