function iconSize(className = '') {
  return `h-5 w-5 ${className}`.trim()
}

export function DashboardIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={iconSize(className)} aria-hidden="true">
      <path
        d="M4.75 5.75A1.75 1.75 0 0 1 6.5 4h3.75v6.25H4.75v-4.5Zm9 0A1.75 1.75 0 0 1 15.5 4h3.75v9.25h-5.5v-7.5ZM4.75 13.75h5.5V20H6.5a1.75 1.75 0 0 1-1.75-1.75v-4.5Zm9 4.5A1.75 1.75 0 0 0 15.5 20h3.75v-5.25h-5.5v3.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function CalendarIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={iconSize(className)} aria-hidden="true">
      <path
        d="M7 3v3m10-3v3M4 10h16M6 5h12a2.25 2.25 0 0 1 2.25 2.25v10.5A2.25 2.25 0 0 1 18 20H6a2.25 2.25 0 0 1-2.25-2.25V7.25A2.25 2.25 0 0 1 6 5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function PatientsIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={iconSize(className)} aria-hidden="true">
      <path
        d="M7.5 12.25a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5Zm8.75-.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM2.75 19a4.75 4.75 0 0 1 9.5 0m1.75 0a3.9 3.9 0 0 1 7.25 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function MoneyIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={iconSize(className)} aria-hidden="true">
      <path
        d="M4 7.75A2.75 2.75 0 0 1 6.75 5h10.5A2.75 2.75 0 0 1 20 7.75v8.5A2.75 2.75 0 0 1 17.25 19H6.75A2.75 2.75 0 0 1 4 16.25v-8.5Zm8 6a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5ZM6.5 10h.5m10 0h.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ClipboardIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={iconSize(className)} aria-hidden="true">
      <path
        d="M9.25 4h5.5A1.75 1.75 0 0 1 16.5 5.75v1h1.75A2.25 2.25 0 0 1 20.5 9v9.25a2.25 2.25 0 0 1-2.25 2.25H5.75A2.25 2.25 0 0 1 3.5 18.25V9a2.25 2.25 0 0 1 2.25-2.25H7.5v-1A1.75 1.75 0 0 1 9.25 4Zm0 2.75h5.5V5.5h-5.5v1.25Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function SettingsIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={iconSize(className)} aria-hidden="true">
      <path
        d="M12 8.75a3.25 3.25 0 1 0 0 6.5 3.25 3.25 0 0 0 0-6.5Zm7.05 3.25-.9-.5a6.72 6.72 0 0 0-.42-1.06l.4-.95a.96.96 0 0 0-.2-1.04l-.88-.88a.96.96 0 0 0-1.04-.2l-.95.4c-.34-.16-.7-.3-1.06-.42l-.5-.9A.98.98 0 0 0 12.63 5h-1.26a.98.98 0 0 0-.88.55l-.5.9c-.36.12-.72.26-1.06.42l-.95-.4a.96.96 0 0 0-1.04.2l-.88.88a.96.96 0 0 0-.2 1.04l.4.95c-.16.34-.3.7-.42 1.06l-.9.5A.98.98 0 0 0 4.5 12v1.26c0 .37.2.72.55.88l.9.5c.12.36.26.72.42 1.06l-.4.95c-.16.37-.08.8.2 1.04l.88.88c.28.28.67.36 1.04.2l.95-.4c.34.16.7.3 1.06.42l.5.9c.16.35.5.55.88.55h1.26c.38 0 .72-.2.88-.55l.5-.9c.36-.12.72-.26 1.06-.42l.95.4c.37.16.8.08 1.04-.2l.88-.88a.96.96 0 0 0 .2-1.04l-.4-.95c.16-.34.3-.7.42-1.06l.9-.5c.35-.16.55-.5.55-.88V12.88c0-.38-.2-.72-.55-.88Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function SparklesIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={iconSize(className)} aria-hidden="true">
      <path
        d="m12 3 1.35 4.4L17.75 8.75l-4.4 1.35L12 14.5l-1.35-4.4-4.4-1.35 4.4-1.35L12 3Zm6 10.5.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8ZM6 14.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function SignatureIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={iconSize(className)} aria-hidden="true">
      <path
        d="M4 17c2.45-2.75 4.46-4.15 6.04-4.15 1.38 0 1.9 1.15 2.55 1.15 1.06 0 1.78-1.95 3.3-1.95 1.16 0 1.98.76 3.8 2.95m-9.35-6.65 2.05-2.05a1.7 1.7 0 1 1 2.4 2.4L12.65 11"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function UserCircleIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={iconSize(className)} aria-hidden="true">
      <circle cx="12" cy="8" r="3.75" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M4.25 19c0-3.4 2.9-5.75 7.75-5.75s7.75 2.35 7.75 5.75"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function HelpIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={iconSize(className)} aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M9.35 9.6a2.65 2.65 0 1 1 4.05 2.25c-.86.58-1.4 1.08-1.4 2m0 2.95h.01"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function LogoutIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={iconSize(className)} aria-hidden="true">
      <path
        d="M9 5H6.75A2.75 2.75 0 0 0 4 7.75v8.5A2.75 2.75 0 0 0 6.75 19H9m5-11 4.5 4-4.5 4m4-4H10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function BellIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={iconSize(className)} aria-hidden="true">
      <path
        d="M12 4.25a3.75 3.75 0 0 1 3.75 3.75v2.05c0 .88.2 1.74.58 2.54l.92 1.91H6.75l.92-1.9c.38-.8.58-1.67.58-2.55V8A3.75 3.75 0 0 1 12 4.25Zm-1.65 13.5a1.65 1.65 0 0 0 3.3 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function MenuIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={iconSize(className)} aria-hidden="true">
      <path
        d="M4.25 7h15.5M4.25 12h15.5M4.25 17h15.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function CloseIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={iconSize(className)} aria-hidden="true">
      <path
        d="M6 6 18 18M18 6 6 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
