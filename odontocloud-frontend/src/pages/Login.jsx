import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import { loginRequest } from '../api/auth'
import { getApiErrorMessage } from '../api/client'
import FeedbackMessage from '../components/FeedbackMessage'
import { useAuth } from '../hooks/useAuth'

function BrandIcon() {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-black text-white">
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
        <path
          d="M5 4h8v15H5V4Zm9 6h5v9h-5v-9ZM7 6.4h1.7v1.8H7V6.4Zm0 3.5h1.7v1.8H7V9.9Zm0 3.5h1.7v1.8H7v-1.8Zm3 0h1.7v1.8H10v-1.8Zm0-3.5h1.7v1.8H10V9.9Zm0-3.5h1.7v1.8H10V6.4Zm5.7 6.6h1.5v1.6h-1.5v-1.6Zm0-3h1.5v1.6h-1.5v-1.6Z"
          fill="currentColor"
        />
      </svg>
    </div>
  )
}

function CloudIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-12 w-12" aria-hidden="true">
      <path
        d="M7.5 18.5h8.5a4 4 0 0 0 .6-7.9A5.5 5.5 0 0 0 6 9.8a3.8 3.8 0 0 0 1.5 8.7Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.35"
      />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      <path
        d="M4 7h16v10H4V7Zm0 0 8 6 8-6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.9"
      />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      <path
        d="M8 11V8.8A4 4 0 0 1 12 5a4 4 0 0 1 4 3.8V11m-8 0h8v8H8v-8Zm4 3.2v2.2"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.9"
      />
    </svg>
  )
}

function VisibilityOffIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M3 3l18 18M10.7 10.7a2 2 0 0 0 2.6 2.6M9.9 5.2A10.7 10.7 0 0 1 12 5c5.3 0 9.3 4.5 10 6.9a11.8 11.8 0 0 1-3.1 4.3M6.2 6.2A12.2 12.2 0 0 0 2 11.9C2.7 14.3 6.7 18.8 12 18.8c1.3 0 2.5-.2 3.6-.6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function VisibilityIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M2 12c.8-2.4 4.8-6.8 10-6.8s9.2 4.4 10 6.8c-.8 2.4-4.8 6.8-10 6.8S2.8 14.4 2 12Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
      <path
        d="M5 12h13m-5-5 5 5-5 5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  )
}

function InputField({ label, error, children, rightLabel = null }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-4">
        <label className="text-[14px] font-medium text-[#1b1b1b]">{label}</label>
        {rightLabel}
      </div>
      {children}
      {error ? <span className="text-sm text-[var(--danger-600)]">{error}</span> : null}
    </div>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, login } = useAuth()
  const [submitError, setSubmitError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const from = location.state?.from?.pathname || '/dashboard'

  const {
    register,
    handleSubmit,
    clearErrors,
    setValue,
    trigger,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      email: '',
      senha: '',
    },
  })

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    register('senha', {
      required: 'Informe a senha.',
    })
  }, [register])

  const passwordValue = watch('senha') || ''

  function handlePasswordChange(event) {
    const nextValue = event.target.value

    setValue('senha', nextValue, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: Boolean(errors.senha),
    })

    if (errors.senha && nextValue) {
      clearErrors('senha')
    }
  }

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
    <main className="flex min-h-screen w-full overflow-hidden bg-[#fdf8f8] text-[#1b1b1b]">
      <section className="relative min-h-screen w-full overflow-hidden bg-[#fdf8f8] md:hidden">
        <img
          src="/imagem_esquerda.webp"
          alt="Ambiente minimalista da clínica"
          className="absolute inset-x-0 top-0 h-[52%] w-full scale-[1.04] object-cover object-top opacity-[0.58]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.36)_0%,rgba(255,255,255,0.58)_22%,rgba(253,248,248,0.88)_48%,rgba(253,248,248,0.97)_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-[21%] h-24 bg-white/30 blur-[26px]" />
        <div className="pointer-events-none absolute -left-20 bottom-24 h-56 w-56 rounded-full bg-white/45 blur-[72px]" />
        <div className="pointer-events-none absolute -right-16 bottom-16 h-52 w-52 rounded-full bg-[#ece7e6]/70 blur-[64px]" />

        <div className="relative z-10 flex min-h-screen flex-col px-5 pb-7 pt-14">
          <div className="flex flex-col items-center">
            <div className="flex h-[102px] w-[102px] items-center justify-center rounded-[22px] bg-black text-white shadow-[0_16px_30px_rgba(0,0,0,0.16)]">
              <CloudIcon />
            </div>
            <div className="mt-7 text-center text-[3.55rem] font-semibold leading-[0.94] tracking-[-0.064em] text-black">
              OdontoCloud
            </div>
          </div>

          <div className="mt-8 rounded-[34px] border border-black/[0.05] bg-white/92 px-7 pb-8 pt-10 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_24px_60px_rgba(0,0,0,0.05)] backdrop-blur-xl">
            <header className="px-2 text-center">
              <h1 className="text-[31px] font-medium leading-[1.14] tracking-[-0.045em] text-black">
                Acesse sua conta
              </h1>
              <p className="mx-auto mt-5 max-w-[18rem] text-[14px] leading-[1.6] text-[#4c4546]">
                Bem-vindo de volta ao sistema de inteligência odontológica.
              </p>
            </header>

            <form className="mt-12 flex flex-col gap-8" onSubmit={handleSubmit(onSubmit)}>
              <FeedbackMessage type="error" message={submitError} />

              <div className="flex flex-col gap-4">
                <label className="text-[13px] font-medium uppercase tracking-[0.02em] text-[#2b2b2b]">
                  E-mail
                </label>
                <div className="flex items-center gap-4 rounded-[18px] bg-[#f5f2f2] px-6 py-[27px] text-[#8f8787]">
                  <MailIcon />
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="admin@odontocloud.com"
                    className={`min-w-0 flex-1 bg-transparent text-[16px] leading-none text-[#1b1b1b] outline-none placeholder:text-[#a19a9a] ${
                      errors.email ? 'placeholder:text-[var(--danger-600)]' : ''
                    }`}
                    {...register('email', {
                      required: 'Informe o e-mail.',
                      pattern: {
                        value: /\S+@\S+\.\S+/,
                        message: 'Informe um e-mail válido.',
                      },
                    })}
                  />
                </div>
                {errors.email ? (
                  <span className="-mt-1 text-sm text-[var(--danger-600)]">{errors.email.message}</span>
                ) : null}
              </div>

              <div className="flex flex-col gap-4">
                <label className="text-[13px] font-medium uppercase tracking-[0.02em] text-[#2b2b2b]">
                  Senha
                </label>
                <div className="flex items-center gap-4 rounded-[18px] bg-[#f5f2f2] px-6 py-[27px] text-[#8f8787]">
                  <LockIcon />
                  <input
                    name="senha"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={passwordValue}
                    onChange={handlePasswordChange}
                    onBlur={() => trigger('senha')}
                    className={`min-w-0 flex-1 bg-transparent text-[16px] leading-none text-[#1b1b1b] outline-none placeholder:text-[#a19a9a] ${
                      errors.senha ? 'placeholder:text-[var(--danger-600)]' : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="text-[#514949]"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
                  </button>
                </div>
                {errors.senha ? (
                  <span className="-mt-1 text-sm text-[var(--danger-600)]">{errors.senha.message}</span>
                ) : null}
              </div>

              <button
                type="button"
                className="-mt-1 pr-2 text-right text-[14px] font-medium text-[#3c3434] transition hover:text-black"
              >
                Esqueci minha senha
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-3 flex w-full items-center justify-center gap-3 rounded-full bg-black px-6 py-6 text-[18px] font-medium text-white transition hover:bg-[#303030] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span>{isSubmitting ? 'Entrando...' : 'Entrar no Sistema'}</span>
                <ArrowRightIcon />
              </button>
            </form>
          </div>

          <div className="mt-auto pt-7 text-center text-[14px] font-medium text-[#8f8888]">
            © 2024 OdontoCloud Systems.
          </div>
        </div>
      </section>

      <section className="relative hidden h-screen w-1/2 overflow-hidden bg-white md:block lg:w-[55%]">
        <img
          src="/imagem_esquerda.webp"
          alt="Ambiente minimalista da clínica"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white/[0.08] via-transparent to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-[18%] bg-gradient-to-t from-white/[0.12] to-transparent" />
        <div className="absolute bottom-[34px] left-[58px] z-10 max-w-[520px] text-black">
          <h1 className="text-[4.9rem] font-semibold leading-[0.92] tracking-[-0.055em] drop-shadow-[0_2px_10px_rgba(255,255,255,0.3)]">
            Precisão em
            <br />
            cada detalhe.
          </h1>
        </div>
      </section>

      <section className="relative hidden h-screen w-full items-center justify-center overflow-hidden bg-[#fdf8f8] px-6 py-8 md:flex md:w-1/2 md:px-8 lg:w-[45%]">
        <div className="pointer-events-none absolute -right-24 -top-20 h-[32rem] w-[32rem] rounded-full bg-[#dedcdc]/60 blur-[88px]" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-[26rem] w-[26rem] rounded-full bg-[#e8e3e1]/55 blur-[72px]" />

        <div className="relative z-10 flex w-full max-w-[440px] flex-col rounded-[24px] border border-black/[0.05] bg-white/82 px-10 py-12 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_24px_60px_rgba(0,0,0,0.04)] backdrop-blur-2xl sm:px-12">
          <div className="mb-8 text-black md:hidden">
            <h1 className="text-[3rem] font-semibold leading-[0.92] tracking-[-0.055em]">
              Precisão em
              <br />
              cada detalhe.
            </h1>
          </div>

          <div className="mb-10 flex items-center gap-4">
            <BrandIcon />
            <div className="text-[22px] font-bold tracking-[-0.04em] text-black sm:text-[24px]">
              OdontoCloud
            </div>
          </div>

          <header className="mb-8">
            <h2 className="text-[24px] font-medium leading-[1.3] tracking-[-0.03em] text-[#1b1b1b]">
              Acesse sua conta
            </h2>
            <p className="mt-2 max-w-[22rem] text-[14px] leading-[1.6] text-[#4c4546]">
              Bem-vindo de volta ao sistema de inteligência odontológica. Insira suas
              credenciais para continuar.
            </p>
          </header>

          <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)}>
            <FeedbackMessage type="error" message={submitError} />

            <InputField label="E-mail" error={errors.email?.message}>
              <input
                type="email"
                autoComplete="email"
                placeholder="nome@clinica.com.br"
                className={`w-full rounded-lg border bg-[#f9f9f9] px-4 py-3 text-[14px] text-[#1b1b1b] outline-none transition placeholder:text-[#747878] ${
                  errors.email
                    ? 'border-red-300 focus:border-red-400 focus:ring-1 focus:ring-red-300'
                    : 'border-[#cfc4c5] focus:border-black focus:ring-1 focus:ring-black'
                }`}
                {...register('email', {
                  required: 'Informe o e-mail.',
                  pattern: {
                    value: /\S+@\S+\.\S+/,
                    message: 'Informe um e-mail valido.',
                  },
                })}
              />
            </InputField>

            <InputField
              label="Senha"
              error={errors.senha?.message}
              rightLabel={
                <button
                  type="button"
                  className="text-[12px] font-medium tracking-[0.01em] text-[#5e5e5e] transition hover:text-black"
                >
                  Esqueci minha senha
                </button>
              }
            >
              <div className="relative">
                <input
                  name="senha"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={passwordValue}
                  onChange={handlePasswordChange}
                  onBlur={() => trigger('senha')}
                  className={`w-full rounded-lg border bg-[#f9f9f9] px-4 py-3 pr-14 text-[14px] text-[#1b1b1b] outline-none transition placeholder:text-[#747878] ${
                    errors.senha
                      ? 'border-red-300 focus:border-red-400 focus:ring-1 focus:ring-red-300'
                      : 'border-[#cfc4c5] focus:border-black focus:ring-1 focus:ring-black'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4c4546] transition hover:text-black"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
                </button>
              </div>
            </InputField>

            <button
              type="submit"
              disabled={isSubmitting}
              className="group mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-black px-6 py-4 text-[14px] font-medium text-white transition hover:bg-[#303030] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>{isSubmitting ? 'Entrando...' : 'Entrar no Sistema'}</span>
              <span className="transition-transform duration-300 group-hover:translate-x-1">
                <ArrowRightIcon />
              </span>
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}
