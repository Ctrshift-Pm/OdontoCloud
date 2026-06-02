import axios from 'axios'
import { clearAuthSession, getAccessToken } from '../store/authStore'

const baseURL = import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:5189'

const client = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

client.interceptors.request.use((config) => {
  const token = getAccessToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status

    if ((status === 401 || status === 403) && window.location.pathname !== '/login') {
      clearAuthSession()
      window.location.assign('/login')
    }

    return Promise.reject(error)
  },
)

function normalizeUserFacingMessage(message) {
  if (!message || typeof message !== 'string') {
    return ''
  }

  const normalized = message.trim()
  const lower = normalized.toLowerCase()

  if (!normalized) {
    return ''
  }

  if (
    lower.includes('network error') ||
    lower.includes('failed to fetch') ||
    lower.includes('load failed') ||
    lower.includes('err_network') ||
    lower.includes('err_failed')
  ) {
    return 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.'
  }

  if (lower.includes('timeout')) {
    return 'A conexão demorou mais do que o esperado. Tente novamente em instantes.'
  }

  if (
    lower.includes('unauthorized') ||
    lower.includes('invalid credentials') ||
    lower.includes('invalid email or password') ||
    lower.includes('credenciais invalidas') ||
    lower.includes('credenciais inválidas')
  ) {
    return 'E-mail ou senha inválidos.'
  }

  if (lower.includes('forbidden')) {
    return 'Você não tem permissão para executar esta ação.'
  }

  if (lower.includes('not found')) {
    return 'O recurso solicitado não foi encontrado.'
  }

  if (lower.includes('too many requests')) {
    return 'Muitas tentativas em sequência. Aguarde um instante e tente novamente.'
  }

  if (lower.includes('internal server error')) {
    return 'O servidor encontrou um erro interno. Tente novamente em instantes.'
  }

  return normalized
}

export function getApiErrorMessage(error, fallbackMessage = 'Não foi possível concluir a operação.') {
  const axiosCode = error?.code?.toLowerCase?.()

  if (axiosCode === 'econnaborted' || axiosCode === 'err_timeout') {
    return 'A conexão demorou mais do que o esperado. Tente novamente em instantes.'
  }

  if (!error?.response) {
    return (
      normalizeUserFacingMessage(error?.message) ||
      'Não foi possível conectar à API. Verifique se o backend está em execução.'
    )
  }

  const { data, status } = error.response

  if (data?.errors) {
    const firstMessage = Object.values(data.errors)
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .find(Boolean)

    if (firstMessage) {
      return normalizeUserFacingMessage(firstMessage)
    }
  }

  if (typeof data === 'string' && data.trim()) {
    return normalizeUserFacingMessage(data)
  }

  if (data?.error) {
    return normalizeUserFacingMessage(data.error)
  }

  if (data?.title) {
    return normalizeUserFacingMessage(data.title)
  }

  if (status === 401) {
    return 'E-mail ou senha inválidos.'
  }

  if (status === 403) {
    return 'Você não tem permissão para acessar este recurso.'
  }

  if (status === 404) {
    return 'O serviço solicitado não foi encontrado.'
  }

  if (status === 408) {
    return 'A solicitação expirou. Tente novamente.'
  }

  if (status === 429) {
    return 'Muitas tentativas em sequência. Aguarde um instante e tente novamente.'
  }

  if (status >= 500) {
    return 'O servidor encontrou um erro interno. Tente novamente em instantes.'
  }

  return normalizeUserFacingMessage(fallbackMessage)
}

export default client
