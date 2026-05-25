/* global process */
import { expect, test } from '@playwright/test'

const LOGIN_EMAIL = 'admin@clinicasorrir.com.br'
const LOGIN_PASSWORD = '123'
const API_URL = process.env.PLAYWRIGHT_API_URL || process.env.API_BASE_URL || 'http://localhost:5189'

function calcularDigitoCpf(digitos, pesoInicial) {
  const soma = digitos.reduce((total, digito, index) => total + digito * (pesoInicial - index), 0)
  const resto = soma % 11
  return resto < 2 ? 0 : 11 - resto
}

function gerarCpfValido() {
  const base = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10))

  if (base.every((digit) => digit === base[0])) {
    base[0] = (base[0] + 1) % 10
  }

  const primeiro = calcularDigitoCpf(base, 10)
  const segundo = calcularDigitoCpf([...base, primeiro], 11)
  return `${base.join('')}${primeiro}${segundo}`
}

async function loginComUi(page) {
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'Acesse sua clinica' })).toBeVisible()
  await page.getByPlaceholder(LOGIN_EMAIL).fill(LOGIN_EMAIL)
  await page.getByPlaceholder('Sua senha').fill(LOGIN_PASSWORD)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/pacientes/)
}

async function obterToken(request) {
  const response = await request.post(`${API_URL}/api/auth/login`, {
    data: {
      Email: LOGIN_EMAIL,
      Senha: LOGIN_PASSWORD,
    },
  })

  expect(response.status()).toBe(200)
  const body = await response.json()
  expect(body).toHaveProperty('token')
  return body.token
}

async function criarPaciente(request, token, nome) {
  const response = await request.post(`${API_URL}/api/pacientes`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    data: {
      Nome: nome,
      Cpf: gerarCpfValido(),
      TelefoneWhatsapp: '11999990000',
    },
  })

  expect(response.status()).toBe(200)
  return response.json()
}

async function getToken(request) {
  const response = await request.post(`${API_URL}/api/auth/login`, {
    data: {
      Email: LOGIN_EMAIL,
      Senha: LOGIN_PASSWORD,
    },
  })

  expect(response.status()).toBe(200)
  const body = await response.json()
  expect(body.token).toBeTruthy()
  return body.token
}

test('abre a aba Kanban de pacientes e move paciente entre colunas', async ({ page, request }) => {
  const token = await obterToken(request)
  const nomePaciente = `Paciente Kanban MVP ${Date.now()}`
  const paciente = await criarPaciente(request, token, nomePaciente, `${Date.now()}`)

  await loginComUi(page)
  await page.getByPlaceholder('Buscar por nome, CPF ou telefone').fill(nomePaciente)
  await page.getByRole('button', { name: 'Kanban' }).click()
  await expect(page.getByRole('heading', { name: /^Novo \(/ })).toBeVisible()

  const pacienteCard = page.locator('article', { hasText: nomePaciente })
  await expect(pacienteCard).toBeVisible()

  const select = pacienteCard.locator('select')
  const patchRequest = page.waitForResponse(
    (response) => response.url().endsWith(`/api/pacientes/${paciente.id}/crm-kanban`) && response.request().method() === 'PATCH',
  )
  await select.selectOption('Contato')
  const response = await patchRequest
  expect(response.status()).toBe(200)

  await page.reload()
  await page.getByPlaceholder('Buscar por nome, CPF ou telefone').fill(nomePaciente)
  await page.getByRole('button', { name: 'Kanban' }).click()
  await expect(page.getByRole('heading', { name: /^Contato \(/ })).toBeVisible()

  const colunaContato = page.locator('section', { has: page.getByRole('heading', { name: /^Contato \(/ }) })
  await expect(colunaContato.locator('article', { hasText: nomePaciente })).toBeVisible()
})

test('pagina lista e kanban de pacientes com tamanhos configuraveis', async ({ page, request }) => {
  const token = await obterToken(request)
  const marcador = `Paciente Paginacao ${Date.now()}`

  for (let index = 1; index <= 12; index += 1) {
    await criarPaciente(request, token, `${marcador}-${String(index).padStart(2, '0')}`, `${Date.now()}${index}`)
  }

  await loginComUi(page)
  await page.getByPlaceholder('Buscar por nome, CPF ou telefone').fill(marcador)

  await expect(page.getByText('Exibindo 1-10 de 12 pacientes.')).toBeVisible()
  await page.getByLabel('Itens por pagina').selectOption('20')
  await expect(page.getByText('Exibindo 1-12 de 12 pacientes.')).toBeVisible()

  await page.getByRole('button', { name: 'Kanban' }).click()
  await page.getByLabel('Itens por pagina').selectOption('10')
  await expect(page.getByText('Exibindo 1-10 de 12 pacientes.')).toBeVisible()
  await page.getByRole('button', { name: 'Proxima' }).click()
  await expect(page.getByText('Exibindo 11-12 de 12 pacientes.')).toBeVisible()

  await page.getByLabel('Itens por pagina').selectOption('50')
  await expect(page.getByText('Exibindo 11-12 de 12 pacientes.')).toBeVisible()

  await page.getByRole('button', { name: 'Lista' }).click()
  await page.getByLabel('Itens por pagina').selectOption('100')
  await expect(page.getByText('Exibindo 1-12 de 12 pacientes.')).toBeVisible()
})

test('menu mobile é acessivel e permite navegação entre módulos', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 812 })

  await loginComUi(page)

  const menuButton = page.getByRole('button', { name: 'Abrir menu principal' })
  await expect(menuButton).toBeVisible()
  await menuButton.click()

  const mobileNav = page.getByRole('navigation', { name: 'Navegacao principal' })
  await expect(mobileNav).toBeVisible()
  await expect(mobileNav.getByRole('link', { name: 'Agenda' })).toBeVisible()

  await mobileNav.getByRole('link', { name: 'Agenda' }).click()
  await expect(page.getByRole('heading', { name: 'Agenda' })).toBeVisible()

  await page.getByRole('button', { name: 'Abrir menu principal' }).click()
  await expect(mobileNav).not.toBeVisible()
  await menuButton.click()
  await expect(mobileNav).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(mobileNav).not.toBeVisible()
})

test('smoke básico de acessibilidade com busca, ação de linha e modal', async ({ page, request }) => {
  const token = await getToken(request)
  const nomePaciente = `Paciente A11y ${Date.now()}`
  const paciente = await criarPaciente(request, token, nomePaciente)

  await loginComUi(page)
  await expect(page.getByRole('searchbox', { name: 'Buscar paciente por nome, CPF ou telefone' })).toBeVisible()

  await page.getByRole('button', { name: 'Novo paciente' }).click()
  const modalTitle = 'Novo paciente'
  await expect(page.getByRole('dialog', { name: modalTitle })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Fechar modal' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: modalTitle })).not.toBeVisible()

  await page.getByPlaceholder('Buscar por nome, CPF ou telefone').fill(nomePaciente)
  await expect(page.getByRole('link', { name: `Abrir conversa no WhatsApp de ${paciente.nome}` })).toBeVisible()
  await expect(page.getByRole('button', { name: `Novo agendamento para ${paciente.nome}` })).toBeVisible()
})
