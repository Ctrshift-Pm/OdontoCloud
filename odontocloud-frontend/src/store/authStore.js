import { createContext, createElement, useContext, useEffect, useState } from 'react'

const STORAGE_KEY = 'odontocloud.auth'
const listeners = new Set()
const AuthContext = createContext(null)

function notify(session) {
  listeners.forEach((listener) => listener(session))
}

function readSession() {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw)
  } catch {
    window.localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

function decodeBase64Url(input) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
  return window.atob(padded)
}

function getClaim(payload, ...keys) {
  const key = keys.find((candidate) => payload?.[candidate] !== undefined)
  return key ? payload[key] : ''
}

function buildSessionFromToken(token) {
  const [, payloadSegment] = token.split('.')

  if (!payloadSegment) {
    throw new Error('JWT invalido.')
  }

  const payload = JSON.parse(decodeBase64Url(payloadSegment))

  return {
    token,
    user: {
      id: getClaim(
        payload,
        'nameid',
        'sub',
        'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier',
      ),
      clinicaId: getClaim(payload, 'ClinicaId'),
      dentistaId: getClaim(payload, 'DentistaId'),
      nome: getClaim(
        payload,
        'unique_name',
        'name',
        'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
      ),
      email: getClaim(
        payload,
        'email',
        'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
      ),
      perfil: getClaim(
        payload,
        'role',
        'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
      ),
    },
  }
}

export function getAccessToken() {
  return readSession()?.token || null
}

export function persistAuthToken(token) {
  const session = buildSessionFromToken(token)
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  notify(session)
  return session
}

export function clearAuthSession() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(STORAGE_KEY)
  notify(null)
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readSession())

  useEffect(() => {
    function handleStorage(event) {
      if (event.key === STORAGE_KEY) {
        setSession(readSession())
      }
    }

    function handleSubscription(nextSession) {
      setSession(nextSession)
    }

    listeners.add(handleSubscription)
    window.addEventListener('storage', handleStorage)

    return () => {
      listeners.delete(handleSubscription)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  const value = {
    token: session?.token || null,
    user: session?.user || null,
    isAuthenticated: Boolean(session?.token),
    login: (token) => persistAuthToken(token),
    logout: () => {
      clearAuthSession()
      window.location.assign('/login')
    },
  }

  return createElement(AuthContext.Provider, { value }, children)
}

export function useAuthContext() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuthContext deve ser usado dentro de AuthProvider.')
  }

  return context
}
