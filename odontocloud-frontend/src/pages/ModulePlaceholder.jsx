import AppShell from '../components/AppShell'
import { useAuth } from '../hooks/useAuth'

export default function ModulePlaceholder({ title, subtitle }) {
  const { user, logout } = useAuth()

  return (
    <AppShell
      title={title}
      subtitle={subtitle || 'Módulo em breve. Esta área ainda não possui transações ativas.'}
      user={user}
      onLogout={logout}
    >
      <div className="surface-card max-w-3xl rounded-[28px] p-8">
        <div className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
          Em breve
        </div>
        <h2 className="mt-4 text-2xl font-semibold text-[var(--ink-900)]">{title}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--ink-500)]">
          Este módulo já aparece no menu para manter a navegação do MVP completa, mas ainda não está disponível para uso operacional.
          Não há transações ativas nesta rota.
        </p>
      </div>
    </AppShell>
  )
}
