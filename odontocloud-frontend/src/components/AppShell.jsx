import { NavLink } from 'react-router-dom'

function BrandMark({ compact = false }) {
  return (
    <div
      className={`flex items-center justify-center rounded-2xl bg-[var(--brand-500)] text-white shadow-lg shadow-emerald-900/20 ${
        compact ? 'h-10 w-10' : 'h-12 w-12'
      }`}
    >
      <svg viewBox="0 0 24 24" className={compact ? 'h-5 w-5' : 'h-6 w-6'} aria-hidden="true">
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

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d="M4 5.5A1.5 1.5 0 0 1 5.5 4H10v6H4V5.5Zm10 0A1.5 1.5 0 0 1 15.5 4H20v10h-6V5.5ZM4 14h6v6H5.5A1.5 1.5 0 0 1 4 18.5V14Zm10 4.5a1.5 1.5 0 0 0 1.5 1.5H20v-4h-6v2.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d="M7 3v3m10-3v3M4 10h16M6 5h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SparklesIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d="m12 3 1.4 4.6L18 9l-4.6 1.4L12 15l-1.4-4.6L6 9l4.6-1.4L12 3Zm6 10 0 0m0 0 .8 2.2L21 16l-2.2.8L18 19l-.8-2.2L15 16l2.2-.8L18 13ZM6 14l.9 2.1L9 17l-2.1.9L6 20l-.9-2.1L3 17l2.1-.9L6 14Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PatientsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d="M7.5 12.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm9 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM2.5 19a5 5 0 0 1 10 0m2 0a4 4 0 0 1 7 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ClipboardIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d="M9 4h6a2 2 0 0 1 2 2v1h1a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1V6a2 2 0 0 1 2-2Zm0 3h6V6H9v1Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SignatureIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d="M4 17c2.5-2.8 4.6-4.2 6.2-4.2 1.4 0 1.9 1.2 2.6 1.2 1.1 0 1.8-2 3.4-2 1.2 0 2 .8 3.8 3m-9.5-6.5 2.2-2.2a1.8 1.8 0 1 1 2.5 2.5L13 11"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MoneyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Zm8 7a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm-6-5h.5m11 0H18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm7.2 3.5-.9-.5a7.7 7.7 0 0 0-.5-1.3l.4-1a1 1 0 0 0-.2-1.1l-1.1-1.1a1 1 0 0 0-1.1-.2l-1 .4c-.4-.2-.8-.4-1.3-.5l-.5-.9A1 1 0 0 0 12 4h-1.5a1 1 0 0 0-.9.6l-.5.9c-.5.1-.9.3-1.3.5l-1-.4a1 1 0 0 0-1.1.2L4.6 7a1 1 0 0 0-.2 1.1l.4 1c-.2.4-.4.8-.5 1.3l-.9.5a1 1 0 0 0-.6.9V13a1 1 0 0 0 .6.9l.9.5c.1.5.3.9.5 1.3l-.4 1a1 1 0 0 0 .2 1.1l1.1 1.1a1 1 0 0 0 1.1.2l1-.4c.4.2.8.4 1.3.5l.5.9a1 1 0 0 0 .9.6H12a1 1 0 0 0 .9-.6l.5-.9c.5-.1.9-.3 1.3-.5l1 .4a1 1 0 0 0 1.1-.2l1.1-1.1a1 1 0 0 0 .2-1.1l-.4-1c.2-.4.4-.8.5-1.3l.9-.5a1 1 0 0 0 .6-.9v-1.5a1 1 0 0 0-.6-.9Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const navSections = [
  {
    title: 'Principal',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: DashboardIcon, upcoming: true },
      { to: '/agenda', label: 'Agenda', icon: CalendarIcon, badge: '3' },
      { to: '/ia-atendimento', label: 'IA Atendimento', icon: SparklesIcon, badge: '7', upcoming: true },
    ],
  },
  {
    title: 'Clinica',
    items: [
      { to: '/pacientes', label: 'Pacientes / CRM', icon: PatientsIcon },
      { to: '/prontuario', label: 'Prontuario', icon: ClipboardIcon },
      { to: '/assinatura-digital', label: 'Assinatura Digital', icon: SignatureIcon, upcoming: true },
    ],
  },
  {
    title: 'Gestao',
    items: [
      { to: '/financeiro', label: 'Financeiro', icon: MoneyIcon },
      { to: '/configuracoes', label: 'Configuracoes', icon: SettingsIcon, upcoming: true },
    ],
  },
]

function NavBadge({ item, isActive }) {
  if (item.badge) {
    return (
      <span
        className={`min-w-6 rounded-full px-2 py-1 text-center text-[10px] font-semibold ${
          isActive ? 'bg-white/18 text-white' : 'bg-white/8 text-white/70'
        }`}
      >
        {item.badge}
      </span>
    )
  }

  if (item.upcoming) {
    return (
      <span
        className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
          isActive ? 'bg-white/18 text-white' : 'bg-white/8 text-white/50'
        }`}
      >
        Em breve
      </span>
    )
  }

  return null
}

function NavItem({ item }) {
  const Icon = item.icon

  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        `flex items-center justify-between rounded-2xl px-3 py-3 text-sm font-medium transition ${
          isActive
            ? 'bg-[var(--brand-500)] text-white shadow-lg shadow-emerald-950/25'
            : 'text-white/65 hover:bg-white/6 hover:text-white'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span className="flex items-center gap-3">
            <Icon />
            {item.label}
          </span>
          <NavBadge item={item} isActive={isActive} />
        </>
      )}
    </NavLink>
  )
}

export default function AppShell({ title, subtitle, user, onLogout, actions, children }) {
  const currentDate = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).format(new Date())

  return (
    <div className="h-screen overflow-hidden bg-[var(--surface)] text-[var(--ink-900)]">
      <div className="flex h-screen">
        <aside className="hidden h-screen w-72 shrink-0 flex-col bg-stone-950 text-white lg:fixed lg:inset-y-0 lg:left-0 lg:flex">
          <div className="border-b border-white/8 px-6 py-6">
            <div className="flex items-center gap-3">
              <BrandMark />
              <div>
                <div className="text-lg font-semibold">OdontoCloud</div>
                <div className="text-sm text-white/45">Gestao clinica multi-tenant</div>
              </div>
            </div>
          </div>

          <nav className="flex flex-1 flex-col px-4 py-6">
            <div className="space-y-6">
              {navSections.map((section) => (
                <div key={section.title}>
                  <div className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.24em] text-white/35">
                    {section.title}
                  </div>

                  <div className="space-y-1">
                    {section.items.map((item) => (
                      <NavItem key={item.to} item={item} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </nav>

          <div className="mt-auto border-t border-white/8 px-4 py-4">
            <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--brand-500)] text-sm font-semibold text-white">
                {user?.nome?.slice(0, 2).toUpperCase() || 'OC'}
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-white">{user?.nome || 'Usuario'}</div>
                <div className="truncate text-xs text-white/45">{user?.perfil || 'Perfil nao informado'}</div>
              </div>

              <button
                type="button"
                onClick={onLogout}
                className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/70 transition hover:bg-white/8 hover:text-white"
              >
                Sair
              </button>
            </div>
          </div>
        </aside>

        <main className="flex h-screen flex-1 flex-col overflow-hidden lg:ml-72">
          <header className="border-b border-black/5 bg-white/80 px-4 py-4 backdrop-blur lg:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <div className="lg:hidden">
                  <BrandMark compact />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-700)]">
                    OdontoCloud
                  </p>
                  <h1 className="mt-1 text-2xl font-semibold text-[var(--ink-900)]">{title}</h1>
                  {subtitle ? <p className="mt-1 text-sm text-[var(--ink-500)]">{subtitle}</p> : null}
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="text-sm capitalize text-[var(--ink-500)]">{currentDate}</div>
                <div className="flex items-center gap-3">{actions}</div>
                <button type="button" onClick={onLogout} className="btn-secondary lg:hidden">
                  Sair
                </button>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
