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

export function getApiErrorMessage(error, fallbackMessage = 'Nao foi possivel concluir a operacao.') {
  if (!error?.response) {
    return 'Nao foi possivel conectar a API. Verifique se o backend esta em execucao.'
  }

  const { data, status } = error.response

  if (data?.errors) {
    const firstMessage = Object.values(data.errors)
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .find(Boolean)

    if (firstMessage) {
      return firstMessage
    }
  }

  if (typeof data === 'string' && data.trim()) {
    return data
  }

  if (data?.error) {
    return data.error
  }

  if (data?.title) {
    return data.title
  }

  if (status === 401) {
    return 'Credenciais invalidas.'
  }

  return fallbackMessage
}

export default client
