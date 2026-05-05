import net from 'node:net'
import { env } from 'node:process'
const API_URL = env.PLAYWRIGHT_API_URL ?? 'http://localhost:5189'
const MAX_ATTEMPTS = 25
const RETRY_DELAY_MS = 1000
const REQUEST_TIMEOUT_MS = 1000
const parsedApiUrl = new URL(API_URL)
const API_HOST = parsedApiUrl.hostname

function getApiPort() {
  const parsed = new URL(API_URL)
  return Number(parsed.port) || (parsed.protocol === 'https:' ? 443 : 80)
}

function assertApiConnection() {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket()
    const timeoutTimer = setTimeout(() => {
      socket.destroy()
      reject(new Error(`Timeout ao conectar em ${API_URL}`))
    }, REQUEST_TIMEOUT_MS)

    socket.connect(getApiPort(), API_HOST, () => {
      clearTimeout(timeoutTimer)
      socket.destroy()
      resolve(true)
    })

    socket.on('error', (error) => {
      clearTimeout(timeoutTimer)
      socket.destroy()
      reject(error)
    })
  })
}

export default async function globalSetup() {
  let lastError

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      await assertApiConnection()
      console.log(`[playwright] API detectada em ${API_URL}`)
      return
    } catch (error) {
      lastError = error
      console.log(`[playwright] Aguardando API em ${API_URL} (${attempt}/${MAX_ATTEMPTS})...`)
      await new Promise((resolve) => {
        setTimeout(resolve, RETRY_DELAY_MS)
      })
    }
  }

  throw new Error(
    `Playwright requer API ativa em ${API_URL} (prefixo http/https). Inicie com:`
      + ` dotnet run --project src/OdontoCloud.Api/OdontoCloud.Api.csproj --launch-profile http`
      + `\nDetalhe: ${lastError ? lastError.message : 'sem resposta'}`,
  )
}

