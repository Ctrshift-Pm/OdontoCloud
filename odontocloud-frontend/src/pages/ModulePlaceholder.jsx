import AppShell from '../components/AppShell'
import { useAuth } from '../hooks/useAuth'

export default function ModulePlaceholder({ title, subtitle }) {
  const { user, logout } = useAuth()

  return (
    <AppShell
      title={title}
      subtitle={subtitle || 'Modulo em construcao. A navegacao ja esta preparada para a versao completa.'}
      user={user}
      onLogout={logout}
    >
      <div className="surface-card max-w-3xl rounded-[28px] p-8">
        <div className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
          Em breve
        </div>
        <h2 className="mt-4 text-2xl font-semibold text-[var(--ink-900)]">{title}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--ink-500)]">
          Este espaco ja existe na navegacao para manter a estrutura fiel ao prototipo. O modulo sera conectado ao backend
          em uma iteracao posterior sem quebrar o layout global.
        </p>
      </div>
    </AppShell>
  )
}
