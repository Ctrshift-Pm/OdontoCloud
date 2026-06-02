import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import {
  BellIcon,
  CalendarIcon,
  ClipboardIcon,
  CloseIcon,
  DashboardIcon,
  HelpIcon,
  LogoutIcon,
  MenuIcon,
  MoneyIcon,
  PatientsIcon,
  SettingsIcon,
  SignatureIcon,
  SparklesIcon,
  UserCircleIcon,
} from './AppIcons'

function BrandMark() {
  return (
    <div className="flex h-9.5 w-9.5 items-center justify-center rounded-full bg-[linear-gradient(180deg,#f6f7f7_0%,#e7ecec_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]">
      <div className="h-5 w-5 rounded-full bg-[radial-gradient(circle_at_top,#ffffff_0%,#d8dfdf_88%)] shadow-[0_4px_10px_rgba(17,17,17,0.08)]" />
    </div>
  )
}

const primaryNavItems = [
  { to: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { to: '/agenda', label: 'Agendamentos', icon: CalendarIcon },
  { to: '/pacientes', label: 'Pacientes', icon: PatientsIcon },
  { to: '/financeiro', label: 'Faturamento', icon: MoneyIcon },
  { to: '/prontuario', label: 'Procedimentos', icon: ClipboardIcon },
  { to: '/configuracoes', label: 'Configuracoes', icon: SettingsIcon },
]

const secondaryNavItems = [
  { to: '/ia-atendimento', label: 'IA Atendimento', icon: SparklesIcon },
  { to: '/assinatura-digital', label: 'Assinatura Digital', icon: SignatureIcon, badge: 'Soon' },
  { to: '/perfil', label: 'Perfil', icon: UserCircleIcon },
]

const FOCUSABLE_ELEMENT_SELECTOR =
  'a[href], area[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function getFocusableElements(container) {
  if (!container) {
    return []
  }

  return Array.from(container.querySelectorAll(FOCUSABLE_ELEMENT_SELECTOR)).filter((element) => {
    const isVisible = element.offsetParent !== null || element === document.activeElement
    return isVisible
  })
}

function NavItem({ item, onClick }) {
  const Icon = item.icon

  return (
    <NavLink
      to={item.to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-[12px] px-3 py-2.25 text-[13px] transition-colors ${
          isActive
            ? 'bg-[#e8e4e4] text-[var(--ink-900)]'
            : 'text-[var(--ink-700)] hover:bg-[#f1edec] hover:text-[var(--ink-900)]'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span className={isActive ? 'text-[var(--ink-900)]' : 'text-[var(--ink-700)]'}>
            <Icon />
          </span>
          <span className="font-medium">{item.label}</span>
          {item.badge ? (
            <span className="ml-auto rounded-full bg-[#ece7e6] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--ink-700)]">
              {item.badge}
            </span>
          ) : null}
        </>
      )}
    </NavLink>
  )
}

function SidebarContent({ onLogout, onNavigate }) {
  return (
    <div className="flex h-full flex-col justify-between p-3">
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3 px-1 py-1">
          <BrandMark />
          <div>
            <div className="text-[15px] font-medium leading-tight text-[var(--ink-900)]">OdontoCloud</div>
            <div className="text-[11px] leading-tight text-[var(--ink-500)]">Clinica Principal</div>
          </div>
        </div>

        <nav className="flex flex-col gap-1" aria-label="Navegacao principal">
          {primaryNavItems.map((item) => (
            <NavItem key={item.to} item={item} onClick={onNavigate} />
          ))}
        </nav>

        <div className="border-t border-[var(--border-strong)] pt-3">
          <nav className="flex flex-col gap-1" aria-label="Navegacao secundaria">
            {secondaryNavItems.map((item) => (
              <NavItem key={item.to} item={item} onClick={onNavigate} />
            ))}
          </nav>
        </div>
      </div>

      <div className="flex flex-col gap-3.5">
        <Link to="/agenda" onClick={onNavigate} className="btn-primary h-10.5 w-full px-4.5 text-[13px]">
          Novo agendamento
        </Link>

        <div className="space-y-1">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-[12px] px-3 py-2.25 text-left text-[13px] text-[var(--ink-700)] transition-colors hover:bg-[#f1edec] hover:text-[var(--ink-900)]"
          >
            <HelpIcon />
            <span className="font-medium">Ajuda</span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-[12px] px-3 py-2.25 text-left text-[13px] text-[var(--ink-700)] transition-colors hover:bg-[#f1edec] hover:text-[var(--ink-900)]"
          >
            <LogoutIcon />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function HeaderControls({ actions }) {
  return (
    <div className="flex items-center gap-2">
      <div className="hidden items-center gap-2 rounded-full bg-[#ece7e6] px-3 py-1.5 md:flex">
        <span className="h-2 w-2 rounded-full bg-black" />
        <span className="text-[12px] font-medium text-[var(--ink-900)]">Clinica Principal - Plano Starter</span>
      </div>

      <button
        type="button"
        className="relative inline-flex h-8.5 w-8.5 items-center justify-center rounded-full text-[var(--ink-900)] transition-colors hover:bg-[#f1edec]"
        aria-label="Notificacoes"
      >
        <BellIcon />
        <span className="absolute right-[10px] top-[10px] h-2 w-2 rounded-full bg-black ring-2 ring-[#fdf8f8]" />
      </button>

      {actions}
    </div>
  )
}

export default function AppShell({
  title,
  subtitle,
  user,
  onLogout,
  actions,
  children,
  headerVariant = 'default',
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const mobileMenuRef = useRef(null)
  const previousFocusRef = useRef(null)

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return undefined
    }

    const menu = mobileMenuRef.current
    if (!menu) {
      return undefined
    }

    previousFocusRef.current = document.activeElement
    document.body.style.overflow = 'hidden'

    const focusableElements = getFocusableElements(menu)
    const firstElement = focusableElements[0] || menu
    const lastElement = focusableElements.at(-1) || menu

    firstElement?.focus()

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        setIsMobileMenuOpen(false)
        return
      }

      if (event.key !== 'Tab' || !focusableElements.length) {
        return
      }

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      }

      if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
      previousFocusRef.current?.focus?.()
    }
  }, [isMobileMenuOpen])

  const currentDate = useMemo(
    () =>
      new Intl.DateTimeFormat('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
      }).format(new Date()),
    [],
  )

  const resolvedActions = actions || (
    <Link to="/agenda" className="btn-primary h-11 px-6">
      Novo agendamento
    </Link>
  )

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--ink-900)] lg:flex">
      <button
        type="button"
        onClick={() => setIsMobileMenuOpen(true)}
        className="glass-panel fixed left-4 top-4 z-40 inline-flex h-10 w-10 items-center justify-center rounded-full lg:hidden"
        aria-label="Abrir menu principal"
        aria-expanded={isMobileMenuOpen}
      >
        <MenuIcon />
      </button>

      <button
        type="button"
        onClick={onLogout}
        className="glass-panel fixed right-4 top-4 z-40 inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium lg:hidden"
        aria-label="Encerrar sessao"
      >
        <LogoutIcon />
        <span>Sair</span>
      </button>

      <aside
        ref={mobileMenuRef}
        className={`fixed inset-y-4 left-4 z-50 w-[min(16rem,calc(100vw-2rem))] rounded-[20px] border border-[var(--border-strong)] bg-[rgba(253,248,248,0.96)] shadow-[0_20px_50px_rgba(17,17,17,0.12)] backdrop-blur-xl transition-transform duration-200 lg:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-[108%]'
        }`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!isMobileMenuOpen}
      >
        <div className="flex items-center justify-between border-b border-[var(--border-strong)] px-5 py-3.5">
          <div className="text-[13px] font-medium text-[var(--ink-900)]">Menu principal</div>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--ink-900)] transition-colors hover:bg-[#f1edec]"
            aria-label="Fechar menu principal"
          >
            <CloseIcon />
          </button>
        </div>
        <SidebarContent onLogout={onLogout} onNavigate={() => setIsMobileMenuOpen(false)} />
      </aside>

      {isMobileMenuOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          role="presentation"
          onMouseDown={() => setIsMobileMenuOpen(false)}
        />
      ) : null}

      <aside
        className="hidden h-screen shrink-0 border-r border-[var(--border-strong)] bg-[rgba(253,248,248,0.58)] backdrop-blur-xl lg:fixed lg:left-0 lg:top-0 lg:block"
        style={{ width: 'var(--app-sidebar-width)' }}
      >
        <SidebarContent onLogout={onLogout} />
      </aside>

      <main className="min-h-screen flex-1" style={{ marginLeft: 'var(--app-sidebar-offset)' }}>
        <header className="sticky top-0 z-20 border-b border-[var(--border-strong)] bg-[rgba(253,248,248,0.82)] backdrop-blur-xl">
          <div
            className="mx-auto flex w-full items-center justify-between gap-3.5 px-[var(--app-page-x)] pb-3 pt-14 sm:px-6 lg:px-[var(--app-page-x-lg)] lg:py-0"
            style={{ maxWidth: 'var(--app-max-width)', minHeight: 'var(--app-header-height)' }}
          >
            <div className="min-w-0">
              {headerVariant === 'dashboard' ? (
                <h1 className="truncate text-[1.48rem] font-medium tracking-[-0.045em] text-[var(--ink-900)] lg:text-[1.68rem]">
                  {title}
                </h1>
              ) : (
                <div>
                  <h1 className="text-[1.48rem] font-medium tracking-[-0.045em] text-[var(--ink-900)] lg:text-[1.6rem]">
                    {title}
                  </h1>
                  {subtitle ? <p className="mt-1 text-[11px] text-[var(--ink-500)] lg:text-[12px]">{subtitle}</p> : null}
                </div>
              )}
            </div>

            <div className="hidden shrink-0 lg:flex">
              <HeaderControls actions={resolvedActions} />
            </div>
          </div>

          {headerVariant !== 'dashboard' ? (
            <div className="border-t border-[var(--border-strong)]/70 px-6 py-2.5 text-[11px] capitalize text-[var(--ink-500)] lg:hidden">
              {currentDate}
            </div>
          ) : null}
        </header>

        <div
          className="mx-auto w-full px-[var(--app-page-x)] pb-6 pt-3.5 sm:px-5 lg:px-[var(--app-page-x-lg)] lg:pt-4.5"
          style={{ maxWidth: 'var(--app-max-width)' }}
        >
          {headerVariant === 'dashboard' ? null : (
            <div className="mb-4 flex flex-wrap items-center gap-2 lg:hidden">
              <span className="stat-pill capitalize">{currentDate}</span>
              {user?.perfil ? <span className="stat-pill">{user.perfil}</span> : null}
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  )
}
