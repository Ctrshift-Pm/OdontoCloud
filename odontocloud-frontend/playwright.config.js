import process from 'node:process'
import { defineConfig } from '@playwright/test'

const FRONTEND_PORT = process.env.PLAYWRIGHT_FRONTEND_PORT ?? '5173'
const API_URL = process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:5189'

export default defineConfig({
  // Pré-requisito: a API precisa estar ativa em API_URL para os cenários reais de e2e.
  // Iniciar com:
  // dotnet run --project src/OdontoCloud.Api/OdontoCloud.Api.csproj --launch-profile http
  // Ex.: PLAYWRIGHT_API_URL=http://localhost:5189
  globalSetup: './playwright.global-setup.js',
  metadata: {
    apiUrl: API_URL,
  },
  testDir: './tests',
  testMatch: /e2e[\\/].*\.(test|spec)\.[jt]s$/,
  timeout: 90_000,
  expect: {
    timeout: 8_000,
  },
  use: {
    baseURL: `http://127.0.0.1:${FRONTEND_PORT}`,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${FRONTEND_PORT}`,
    url: `http://127.0.0.1:${FRONTEND_PORT}`,
    reuseExistingServer: true,
    timeout: 90_000,
  },
})
