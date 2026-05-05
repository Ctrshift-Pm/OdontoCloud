import { expect, test } from '@playwright/test'
import process from 'node:process'

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5189'
const TEST_USER_EMAIL = process.env.E2E_USER_EMAIL || 'admin@clinicasorrir.com.br'
const TEST_USER_PASSWORD = process.env.E2E_USER_PASSWORD || '123'

function calculateCpfDigit(partialDigits) {
  const total = partialDigits.reduce((acc, digit, index) => {
    const factor = partialDigits.length + 1 - index
    return acc + digit * factor
  }, 0)

  const rest = total % 11
  const digit = rest < 2 ? 0 : 11 - rest
  return digit
}

function generateValidCpf() {
  const base = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10))

  if (base.every((digit) => digit === base[0])) {
    base[0] = (base[0] + 1) % 10
  }

  const firstDigit = calculateCpfDigit(base)
  const secondDigit = calculateCpfDigit([...base, firstDigit])

  return [...base, firstDigit, secondDigit].join('')
}

async function loginToken(request) {
  const response = await request.post(`${API_BASE_URL}/api/auth/login`, {
    data: {
      email: TEST_USER_EMAIL,
      senha: TEST_USER_PASSWORD,
    },
  })

  expect(response.ok()).toBeTruthy()
  const login = await response.json()
  expect(login.token).toBeTruthy()

  return login.token
}

async function ensurePacienteSeed(request) {
  const token = await loginToken(request)
  const headers = { Authorization: `Bearer ${token}` }
  const existingResponse = await request.get(`${API_BASE_URL}/api/pacientes`, { headers })

  expect(existingResponse.ok()).toBeTruthy()
  const pacientes = await existingResponse.json()

  if (pacientes?.length) {
    return pacientes[0]
  }

  const nome = `Paciente E2E ${Date.now()}`
  const cpf = generateValidCpf()

  const createResponse = await request.post(`${API_BASE_URL}/api/pacientes`, {
    headers,
    data: {
      Nome: nome,
      Cpf: cpf,
      TelefoneWhatsapp: '11999998877',
      DataNascimento: '1990-01-01',
    },
  })

  expect(createResponse.ok()).toBeTruthy()
  return await createResponse.json()
}

async function selectToothViaSvgOrFallback(page, toothCode) {
  const selectorTexto = new RegExp(`Selecionar dente ${toothCode}`, 'i')
  const byRole = page.getByRole('button', { name: selectorTexto })
  if (await byRole.count()) {
    const count = await byRole.count()
    for (let i = 0; i < count; i += 1) {
      const candidate = byRole.nth(i)
      const conectado = await candidate
        .evaluate((element) => element?.isConnected)
        .catch(() => false)
      if (!conectado) {
        continue
      }

      const visivel = await candidate
        .isVisible()
        .catch(() => false)
      if (!visivel) {
        continue
      }

      await candidate.scrollIntoViewIfNeeded().catch(() => {})
      await candidate.click()
      return
    }
  }

  const byId = page.locator(`#tooth-${toothCode}`)
  const isAttached = await byId
    .evaluate((element) => element?.isConnected)
    .catch(() => false)
  if (!isAttached) {
    throw new Error(`Elemento dente ${toothCode} não está carregado no DOM`)
  }

  await byId.scrollIntoViewIfNeeded().catch(() => {})
  await expect(byId).toBeVisible()
  await byId.click()
}

async function salvarEstadoNoTooth(page, toothCode, novoEstado) {
  await selectToothViaSvgOrFallback(page, toothCode)

  const dialog = page.getByRole('dialog', { name: `Edicao do dente ${toothCode}` })
  await expect(dialog).toBeVisible()

  const statusSelect = dialog.getByLabel('Novo estado')
  await expect(statusSelect).toBeVisible()
  await statusSelect.selectOption(novoEstado)

  const botaoSalvar = dialog.getByRole('button', { name: 'Salvar' })
  await expect(botaoSalvar).toBeVisible()
  await botaoSalvar.click()
  await expect(dialog).toBeHidden()
}

async function selecionarPacienteComBusca(page, paciente) {
  const buscaInput = page.getByLabel('Buscar paciente')
  const quickButton = page.getByRole('button', { name: `Selecionar paciente ${paciente.nome}` })
  const seletorPaciente = page.locator('#filtroPaciente')

  await buscaInput.fill(paciente.nome)
  await expect(page.getByText(paciente.nome).first()).toBeVisible()

  if (await quickButton.count()) {
    await quickButton.first().click()
    await expect(seletorPaciente).toHaveValue(paciente.id)
    return
  }

  await seletorPaciente.selectOption(paciente.id)
}

test('deve logar com seed e atualizar estado de dente no prontuario', async ({ page, request }) => {
  const paciente = await ensurePacienteSeed(request)

  await page.goto('/login')

  await page.getByPlaceholder('admin@clinicasorrir.com.br').fill(TEST_USER_EMAIL)
  await page.getByPlaceholder('Sua senha').fill(TEST_USER_PASSWORD)
  await page.getByRole('button', { name: 'Entrar' }).click()

  await expect(page).toHaveURL(/\/pacientes/)

  await page.goto('/prontuario')

  const seletorPaciente = page.locator('#filtroPaciente')
  await seletorPaciente.selectOption(paciente.id)

  await salvarEstadoNoTooth(page, 55, 'protese')
  await salvarEstadoNoTooth(page, 18, 'carie')

  const token = await loginToken(request)
  const prontuarioAtualResponse = await request.get(`${API_BASE_URL}/api/prontuario/${paciente.id}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  expect(prontuarioAtualResponse.ok()).toBeTruthy()
  const prontuarioAtual = await prontuarioAtualResponse.json()

  expect(prontuarioAtual.odontograma['18']).toBe('carie')
  expect(prontuarioAtual.odontograma['55']).toBe('protese')
})

test('deve filtrar paciente por nome, cpf e telefone na busca', async ({ page, request }) => {
  const paciente = await ensurePacienteSeed(request)

  await page.goto('/login')

  await page.getByPlaceholder('admin@clinicasorrir.com.br').fill(TEST_USER_EMAIL)
  await page.getByPlaceholder('Sua senha').fill(TEST_USER_PASSWORD)
  await page.getByRole('button', { name: 'Entrar' }).click()

  await expect(page).toHaveURL(/\/pacientes/)
  await page.goto('/prontuario')

  await selecionarPacienteComBusca(page, paciente)

  const buscaInput = page.getByLabel('Buscar paciente')
  await buscaInput.fill(paciente.cpf.replace(/\D/g, ''))
  await expect(page.getByText(paciente.nome).first()).toBeVisible()

  const quickByNome = page.getByRole('button', { name: `Selecionar paciente ${paciente.nome}` })
  if (await quickByNome.count()) {
    await quickByNome.first().click()
  } else {
    await page.locator('#filtroPaciente').selectOption(paciente.id)
  }
  await expect(page.locator('#filtroPaciente')).toHaveValue(paciente.id)

  await buscaInput.fill(paciente.telefoneWhatsapp.replace(/\D/g, ''))
  await expect(page.getByText(paciente.nome).first()).toBeVisible()
})

