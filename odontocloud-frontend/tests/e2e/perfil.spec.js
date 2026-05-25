import { expect, test } from '@playwright/test'
import process from 'node:process'

const API_BASE_URL = process.env.PLAYWRIGHT_API_URL || process.env.API_BASE_URL || 'http://localhost:5189'
const TEST_USER_EMAIL = process.env.E2E_USER_EMAIL || 'admin@clinicasorrir.com.br'
const TEST_USER_PASSWORD = process.env.E2E_USER_PASSWORD || '123'

async function alterarSenhaViaApi(request, senhaAtual, senhaNova) {
  const loginResponse = await request.post(`${API_BASE_URL}/api/auth/login`, {
    data: {
      Email: TEST_USER_EMAIL,
      Senha: senhaAtual,
    },
  })

  if (loginResponse.status() !== 200) {
    return false
  }

  const { token } = await loginResponse.json()
  if (!token) {
    return false
  }

  const resposta = await request.patch(`${API_BASE_URL}/api/perfil/senha`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    data: {
      SenhaAtual: senhaAtual,
      NovaSenha: senhaNova,
      ConfirmacaoSenha: senhaNova,
    },
  })

  return resposta.ok()
}

async function resetarSenhaAdminParaPadrao(request, senhaTemporaria) {
  const restoreComTemporaria = await alterarSenhaViaApi(request, senhaTemporaria, TEST_USER_PASSWORD).catch(() => false)
  if (restoreComTemporaria) {
    return
  }

  await alterarSenhaViaApi(request, TEST_USER_PASSWORD, TEST_USER_PASSWORD).catch(() => {})
}

function gerarSenhaTemporaria() {
  return `Perf-${Date.now()}-${Math.floor(Math.random() * 10_000)}`
}

async function loginViaUi(page, senha) {
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'Acesse sua clinica' })).toBeVisible()
  await page.getByPlaceholder('admin@clinicasorrir.com.br').fill(TEST_USER_EMAIL)
  await page.getByPlaceholder('Sua senha').fill(senha)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/pacientes/)
}

async function abrirPerfil(page) {
  await page.getByRole('link', { name: 'Perfil' }).click()
  await expect(page.getByRole('heading', { name: 'Dados da conta' })).toBeVisible()
}

async function getLoginApiStatus(request, senha) {
  const response = await request.post(`${API_BASE_URL}/api/auth/login`, {
    data: {
      Email: TEST_USER_EMAIL,
      Senha: senha,
    },
  })

  return response.status()
}

test.describe.configure({ mode: 'serial' })

test('visualiza perfil e troca senha no fluxo completo', async ({ page, request }) => {
  const senhaTemporaria = gerarSenhaTemporaria()
  try {
    await loginViaUi(page, TEST_USER_PASSWORD)
    await abrirPerfil(page)
    await expect(page.getByText('Carregando dados...')).not.toBeVisible()

    await expect(page.getByText('Dados da conta')).toBeVisible()
    await expect(page.getByRole('main').getByText('Administrador')).toBeVisible()

    await page.getByLabel('Senha atual').fill('senha-errada')
    await page.getByLabel('Nova senha', { exact: true }).fill(senhaTemporaria)
    await page.getByLabel('Confirmar nova senha', { exact: true }).fill(senhaTemporaria)
    await page.getByRole('button', { name: 'Alterar senha' }).click()
    await expect(page.getByText('Senha atual invalida.')).toBeVisible()

    await page.getByLabel('Senha atual', { exact: true }).fill(TEST_USER_PASSWORD)
    await page.getByLabel('Nova senha', { exact: true }).fill(senhaTemporaria)
    await page.getByLabel('Confirmar nova senha', { exact: true }).fill(senhaTemporaria)
    await page.getByRole('button', { name: 'Alterar senha' }).click()
    await expect(page.getByText('Senha alterada com sucesso.')).toBeVisible()

    await page.getByRole('button', { name: 'Sair da conta' }).click()
    await expect(page).toHaveURL(/\/login/)

    const statusAntigo = await getLoginApiStatus(request, TEST_USER_PASSWORD)
    expect(statusAntigo).toBe(401)

    await loginViaUi(page, senhaTemporaria)
    await abrirPerfil(page)
    await page.getByRole('button', { name: 'Sair da conta' }).click()

    await loginViaUi(page, senhaTemporaria)
    await abrirPerfil(page)
    await page.getByLabel('Senha atual', { exact: true }).fill(senhaTemporaria)
    await page.getByLabel('Nova senha', { exact: true }).fill(TEST_USER_PASSWORD)
    await page.getByLabel('Confirmar nova senha', { exact: true }).fill(TEST_USER_PASSWORD)
    await page.getByRole('button', { name: 'Alterar senha' }).click()
    await expect(page.getByText('Senha alterada com sucesso.')).toBeVisible()
  } finally {
    await resetarSenhaAdminParaPadrao(request, senhaTemporaria)
  }
})
