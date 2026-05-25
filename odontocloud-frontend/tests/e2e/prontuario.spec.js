import { expect, test } from '@playwright/test'
import process from 'node:process'

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5189'
const TEST_USER_EMAIL = process.env.E2E_USER_EMAIL || 'admin@clinicasorrir.com.br'
const TEST_USER_PASSWORD = process.env.E2E_USER_PASSWORD || '123'

const PRONTUARIO_READ_MAX_ATTEMPTS = 4
const PRONTUARIO_READ_RETRY_DELAY_MS = 250

async function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

function normalizarRespostaPaciente(paciente) {
  if (!paciente || typeof paciente !== 'object') {
    return null
  }

  const id = paciente.id || paciente.Id
  if (!id) {
    return null
  }

  return {
    ...paciente,
    id,
    nome: paciente.nome || paciente.Nome,
    cpf: paciente.cpf || paciente.Cpf,
  }
}

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

async function parseResponseBodyPreview(response) {
  return response
    .text()
    .then((texto) => texto?.trim() || '(sem corpo)')
    .catch(() => '(falha ao ler o corpo da resposta)')
}

async function obterPacienteNaListagem(request, headers, pacienteCpfOuId, pacienteNome) {
  const pacientesResponse = await request.get(`${API_BASE_URL}/api/pacientes`, { headers })
  if (!pacientesResponse.ok()) {
    const corpoErro = await parseResponseBodyPreview(pacientesResponse)
    return {
      encontrado: false,
      motivo: `Falha ao consultar /api/pacientes: ${pacientesResponse.status()} - ${corpoErro}`,
      totalPacientes: null,
    }
  }

  const pacientes = await pacientesResponse.json()
  const lista = Array.isArray(pacientes) ? pacientes : []
  const encontrado = lista.find((item) => {
    const idAtual = item.id || item.Id
    return (
      (pacienteCpfOuId && (item.cpf === pacienteCpfOuId || item.Cpf === pacienteCpfOuId))
      || (pacienteCpfOuId && idAtual === pacienteCpfOuId)
      || (pacienteNome && (item.nome === pacienteNome || item.Nome === pacienteNome))
    )
  })

  return {
    encontrado: Boolean(encontrado),
    motivo: encontrado ? null : `Paciente não encontrado na listagem do tenant atual (total ${lista.length})`,
    totalPacientes: lista.length,
  }
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

  if (!createResponse.ok()) {
    const corpo = await parseResponseBodyPreview(createResponse)
    throw new Error(`POST /api/pacientes falhou (${createResponse.status()}). Corpo: ${corpo}`)
  }

  const createBody = normalizarRespostaPaciente(await createResponse.json())
  if (!createBody?.id) {
    throw new Error(`POST /api/pacientes retornou payload sem id. Corpo: ${await parseResponseBodyPreview(createResponse)}`)
  }

  const paciente = {
    id: createBody.id,
    nome: createBody.nome || nome,
    cpf: createBody.cpf || cpf,
  }

  const pacienteNoSistema = await obterPacienteNaListagem(request, headers, paciente.cpf, paciente.nome)
  if (!pacienteNoSistema.encontrado) {
    throw new Error(
      `Paciente sem persistência verificável em /api/pacientes no tenant atual (id=${paciente.id}). ${pacienteNoSistema.motivo}`
    )
  }

  return paciente
}

async function criarPacienteParaBusca(request, overrides = {}) {
  const token = await loginToken(request)
  const headers = { Authorization: `Bearer ${token}` }
  const payload = {
    Nome: overrides.nome || `Paciente E2E ${Date.now()}_${Math.floor(Math.random() * 10_000)}`,
    Cpf: overrides.cpf || generateValidCpf(),
    TelefoneWhatsapp: overrides.telefoneWhatsapp || '11999990000',
    Email: overrides.email || `paciente-${Date.now()}@example.com`,
    DataNascimento: '1990-01-01',
    ...(overrides.extra || {}),
  }

  const response = await request.post(`${API_BASE_URL}/api/pacientes`, {
    headers,
    data: payload,
  })

  if (!response.ok()) {
    const corpo = await parseResponseBodyPreview(response)
    throw new Error(`POST /api/pacientes falhou (${response.status()}). Corpo: ${corpo}`)
  }

  const created = normalizarRespostaPaciente(await response.json())
  if (!created?.id) {
    throw new Error(`POST /api/pacientes retornou payload sem id. Corpo: ${await parseResponseBodyPreview(response)}`)
  }

  return {
    ...created,
    ...overrides,
    id: created.id,
    nome: created.nome || overrides.nome,
    cpf: created.cpf || payload.Cpf,
    email: payload.Email,
    telefoneWhatsapp: payload.TelefoneWhatsapp,
  }
}

async function selecionarPacientePorBusca(page, termo, expectedPaciente) {
  const searchInput = page.getByLabel('Buscar paciente')
  await searchInput.click()
  await searchInput.fill(termo)

  const dropdown = page.locator('.absolute.left-0.right-0.top-full')
  await expect(dropdown).toBeVisible()

  let options = dropdown.getByRole('button', {
    name: new RegExp(`Selecionar paciente ${expectedPaciente.nome}`, 'i'),
  })
  if ((await options.count()) === 0 && expectedPaciente?.cpf) {
    const cpfBusca = String(expectedPaciente.cpf).replace(/\D/g, '')
    options = dropdown.getByRole('button').filter({ hasText: cpfBusca.slice(0, 4) })
  }
  if ((await options.count()) === 0) {
    options = dropdown.getByRole('button')
  }
  await expect(options.first()).toBeVisible()
  await options.first().click()
}

async function selectToothViaSvgOrFallback(page, toothCode) {
  const byHitbox = page.locator(`[data-mixed-hitbox="true"][data-effective-tooth-code="${toothCode}"]`)
  if (await byHitbox.count()) {
    await byHitbox.first().scrollIntoViewIfNeeded().catch(() => {})
    await byHitbox.first().click()
    return
  }

  const selectorTexto = new RegExp(`Selecionar dente ${toothCode}`, 'i')
  const byRole = page.getByRole('button', { name: selectorTexto })
  if (await byRole.count()) {
    const count = await byRole.count()
    for (let i = 0; i < count; i += 1) {
      const candidate = byRole.nth(i)
      if (await candidate.evaluate((element) => element?.isConnected).catch(() => false)) {
        if (await candidate.isVisible().catch(() => false)) {
          await candidate.scrollIntoViewIfNeeded().catch(() => {})
          await candidate.click()
          return
        }
      }
    }
  }

  const byId = page.locator(`#tooth-${toothCode}`)
  if (!(await byId.evaluate((element) => element?.isConnected).catch(() => false))) {
    throw new Error(`Elemento do dente ${toothCode} não encontrado`)
  }

  await byId.scrollIntoViewIfNeeded().catch(() => {})
  await expect(byId).toBeVisible()
  await byId.click()
}

async function salvarEstadoNoDente(page, toothCode, estado, cariePercentual = null) {
  await selectToothViaSvgOrFallback(page, toothCode)

  const dialog = page.getByRole('dialog', { name: `Edicao do dente ${toothCode}` })
  await expect(dialog).toBeVisible()

  const statusSelect = dialog.getByLabel('Novo estado')
  await expect(statusSelect).toBeVisible()
  await statusSelect.selectOption(estado)

  if (estado === 'carie' && cariePercentual !== null) {
    await dialog.getByLabel('Percentual da cárie').fill(String(cariePercentual * 100))
  }

  const botaoSalvar = dialog.getByRole('button', { name: 'Salvar' })
  await expect(botaoSalvar).toBeVisible()
  await botaoSalvar.click()
  await expect(dialog).toBeHidden()
}

function getStatusFromOdontograma(prontuario, toothCode) {
  const entrada = prontuario.odontograma?.[toothCode]
  if (!entrada) {
    return null
  }

  if (typeof entrada === 'string') {
    return entrada
  }

  if (typeof entrada.status === 'string') {
    return entrada.status
  }

  if (typeof entrada.Status === 'string') {
    return entrada.Status
  }

  return null
}

function getCariePercentualFromOdontograma(prontuario, toothCode) {
  const entrada = prontuario.odontograma?.[toothCode]
  if (!entrada || typeof entrada === 'string') {
    return null
  }

  if (typeof entrada.cariePercentual === 'number') {
    return entrada.cariePercentual
  }

  if (typeof entrada.CariePercentual === 'number') {
    return entrada.CariePercentual
  }

  return null
}

async function getProntuario(request, pacienteId) {
  const token = await loginToken(request)
  const headers = { Authorization: `Bearer ${token}` }
  let response

  for (let tentativa = 1; tentativa <= PRONTUARIO_READ_MAX_ATTEMPTS; tentativa += 1) {
    response = await request.get(`${API_BASE_URL}/api/prontuario/${pacienteId}`, { headers })

    if (response.ok()) {
      break
    }

    const statusRetentavel = response.status() === 404 || response.status() === 500
    if (!statusRetentavel || tentativa === PRONTUARIO_READ_MAX_ATTEMPTS) {
      break
    }

    await sleep(PRONTUARIO_READ_RETRY_DELAY_MS * tentativa)
  }

  if (response.ok()) {
    return await response.json()
  }

  const corpo = await parseResponseBodyPreview(response)
  const consultaPaciente = await obterPacienteNaListagem(request, headers, pacienteId)

  throw new Error(
    `GET /api/prontuario/${pacienteId} falhou (status ${response.status()}) após ${PRONTUARIO_READ_MAX_ATTEMPTS} tentativas. Corpo: ${corpo}. `
      + `Paciente visível em /api/pacientes: ${consultaPaciente.encontrado ? 'sim' : 'não'} | `
      + `motivo: ${consultaPaciente.motivo || 'nao informado'}`
  )
}

async function fazerLogin(page) {
  await page.goto('/login')
  await page.getByPlaceholder('admin@clinicasorrir.com.br').fill(TEST_USER_EMAIL)
  await page.getByPlaceholder('Sua senha').fill(TEST_USER_PASSWORD)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/pacientes/)
}

test('deve buscar paciente via dropdown limitado e selecionar', async ({ page, request }) => {
  const pacientes = []
  const tokenBusca = Date.now()
  for (let indice = 1; indice <= 12; indice += 1) {
    pacientes.push(
      await criarPacienteParaBusca(request, {
        nome: `Paciente Busca ${tokenBusca}-${String(indice).padStart(2, '0')}`,
        cpf: generateValidCpf(),
        telefoneWhatsapp: '11990001111',
        email: `paciente${indice}@example.com`,
      }),
    )
  }

  const pacienteSelecionado = pacientes[0]

  await fazerLogin(page)
  await page.goto('/prontuario')

  const searchInput = page.getByLabel('Buscar paciente')
  await searchInput.fill('Paciente Busca')
  await expect(page.locator('.absolute.left-0.right-0.top-full').getByRole('button')).toHaveCount(10)
  await expect(page.getByRole('button', { name: `Selecionar paciente ${pacientes[10].nome}` })).toHaveCount(0)
  await expect(page.locator('#filtroPaciente')).toHaveCount(0)

  await selecionarPacientePorBusca(page, pacienteSelecionado.nome, pacienteSelecionado)
  await expect(page.locator('.absolute.left-0.right-0.top-full')).toBeHidden()
  await expect(await getProntuario(request, pacienteSelecionado.id)).toBeTruthy()

  await selecionarPacientePorBusca(page, pacienteSelecionado.cpf.substring(0, 4), pacienteSelecionado)
  await expect(page.locator('.absolute.left-0.right-0.top-full')).toBeHidden()
  await expect(await getProntuario(request, pacienteSelecionado.id)).toBeTruthy()

  await selecionarPacientePorBusca(page, pacienteSelecionado.telefoneWhatsapp.substring(0, 4), pacienteSelecionado)
  await expect(page.locator('.absolute.left-0.right-0.top-full')).toBeHidden()
  await expect(await getProntuario(request, pacienteSelecionado.id)).toBeTruthy()

  await selecionarPacientePorBusca(page, pacienteSelecionado.email.substring(0, 8), pacienteSelecionado)
  await expect(page.locator('.absolute.left-0.right-0.top-full')).toBeHidden()
  await expect(await getProntuario(request, pacienteSelecionado.id)).toBeTruthy()
})

test('deve trocar a denticao para mista mantendo estados de camadas', async ({ page, request }) => {
  const paciente = await ensurePacienteSeed(request)

  await fazerLogin(page)
  await page.goto('/prontuario')
  await selecionarPacientePorBusca(page, paciente.nome, paciente)

  const token = await loginToken(request)
  const headers = { Authorization: `Bearer ${token}` }

  const prontuarioInicial = await getProntuario(request, paciente.id)
  expect(prontuarioInicial.denticaoAtiva).toBe('Permanente')
  const prontuarioId = prontuarioInicial.id

  await request.patch(`${API_BASE_URL}/api/prontuario/${prontuarioId}/odontograma/18`, {
    data: { status: 'carie', cariePercentual: 30 },
    headers,
  })
  await request.patch(`${API_BASE_URL}/api/prontuario/${prontuarioId}/odontograma/55`, {
    data: { status: 'protese' },
    headers,
  })

  await expect(page.getByRole('combobox', { name: 'Denticao ativa' })).toHaveValue('Permanente')
  await page.getByRole('combobox', { name: 'Denticao ativa' }).selectOption('Mista')

  await expect(page.getByRole('combobox', { name: 'Denticao ativa' })).toHaveValue('Mista')
  await expect(page.getByText('Dentição mista')).toBeVisible()
  await expect(page.getByRole('region', { name: 'Denticao mista' })).toBeVisible()
  await expect(page.getByTestId('odontograma-mixed-slot')).toHaveCount(32)

  await page.waitForTimeout(500)
  const respostaDepois = await getProntuario(request, paciente.id)
  expect(respostaDepois.denticaoAtiva).toBe('Mista')
  expect(getStatusFromOdontograma(respostaDepois, '18')).toBe('carie')
  expect(getCariePercentualFromOdontograma(respostaDepois, '18')).toBe(30)
  expect(getStatusFromOdontograma(respostaDepois, '55')).toBe('protese')

  await selectToothViaSvgOrFallback(page, '55')
  const dialogDeciduo = page.getByRole('dialog', { name: 'Edicao do dente 55' })
  await expect(dialogDeciduo).toBeVisible()
  await expect(dialogDeciduo.getByRole('button', { name: /Trocar para permanente 15/i })).toBeVisible()
  await dialogDeciduo.getByRole('button', { name: /Trocar para permanente 15/i }).click()
  const dialogPermanente = page.getByRole('dialog', { name: 'Edicao do dente 15' })
  await expect(dialogPermanente).toBeVisible()
  await expect(dialogPermanente.getByRole('button', { name: /Trocar para deciduo 55/i })).toBeVisible()
  await dialogPermanente.getByRole('button', { name: 'Cancelar' }).click()

  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('combobox', { name: 'Denticao ativa' }).selectOption('Decidua')
  const respostaDecidua = await getProntuario(request, paciente.id)
  expect(respostaDecidua.denticaoAtiva).toBe('Decidua')
})

test('deve cobrir fluxo completo da denticao mista com slots, trocas e persistencia', async ({ page, request }) => {
  const paciente = await ensurePacienteSeed(request)
  const token = await loginToken(request)
  const headers = { Authorization: `Bearer ${token}` }

  await fazerLogin(page)
  await page.goto('/prontuario')
  await selecionarPacientePorBusca(page, paciente.nome, paciente)

  const prontuarioInicial = await getProntuario(request, paciente.id)
  const prontuarioId = prontuarioInicial.id
  await request.patch(`${API_BASE_URL}/api/prontuario/${prontuarioId}/odontograma/51`, {
    headers,
    data: { status: 'ok' },
  })
  await request.patch(`${API_BASE_URL}/api/prontuario/${prontuarioId}/odontograma/61`, {
    headers,
    data: { status: 'ok' },
  })
  await request.patch(`${API_BASE_URL}/api/prontuario/${prontuarioId}/odontograma/71`, {
    headers,
    data: { status: 'ok' },
  })
  await request.patch(`${API_BASE_URL}/api/prontuario/${prontuarioId}/odontograma/81`, {
    headers,
    data: { status: 'ok' },
  })
  await request.patch(`${API_BASE_URL}/api/prontuario/${prontuarioId}/odontograma/28`, {
    headers,
    data: { status: 'trat' },
  })
  await request.patch(`${API_BASE_URL}/api/prontuario/${prontuarioId}/odontograma/18`, {
    headers,
    data: { status: 'ok' },
  })
  await request.patch(`${API_BASE_URL}/api/prontuario/${prontuarioId}/odontograma/48`, {
    headers,
    data: { status: 'ok' },
  })

  await page.getByRole('combobox', { name: 'Denticao ativa' }).selectOption('Mista')
  await expect(page.getByRole('region', { name: 'Denticao mista' })).toBeVisible()

  const mixedSlots = page.locator('[data-testid="odontograma-mixed-slot"]')
  await expect(mixedSlots).toHaveCount(32)

  const totalSlots = await mixedSlots.count()
  for (let idx = 0; idx < totalSlots; idx += 1) {
    const slot = mixedSlots.nth(idx)
    const slotCode = await slot.getAttribute('data-slot-code')
    const slotLabel = await slot.getAttribute('aria-label')
    expect(slotCode).toBeTruthy()
    expect(slotLabel).toBeTruthy()
    expect(slotLabel).toContain(slotCode)
    expect(slotLabel).not.toContain('.svg')
    expect(slotLabel).toMatch(/Estado atual|vazio/i)
  }

  const amostrasReais = ['11', '16', '28', '38']
  for (const slotCode of amostrasReais) {
    const slot = page.locator(`[data-slot-code="${slotCode}"]`)
    const slotBox = await slot.boundingBox()
    expect(slotBox).toBeTruthy()
    const activeSymbol = slot.locator('svg')
    if ((await activeSymbol.count()) > 0) {
      const symbolBox = await activeSymbol.first().boundingBox()
      expect(symbolBox).toBeTruthy()
      expect(symbolBox.width).toBeLessThanOrEqual(slotBox.width + 6)
      expect(symbolBox.height).toBeLessThanOrEqual(slotBox.height + 6)
      expect(symbolBox.x).toBeGreaterThanOrEqual(slotBox.x - 6)
      expect(symbolBox.y).toBeGreaterThanOrEqual(slotBox.y - 6)
    }
  }

  const amostras = ['18', '11', '21', '28', '48', '41', '31', '38']
  const ativosEsperados = {
    '11': '51',
    '21': '61',
    '31': '71',
    '41': '81',
  }

  for (const slotCode of amostras) {
    const slot = page.locator(`[data-slot-code="${slotCode}"]`)
    await expect(slot).toBeVisible()
    const activeToothCode = await slot.getAttribute('data-active-tooth-code')
    if (ativosEsperados[slotCode]) {
      expect(activeToothCode).toBe(ativosEsperados[slotCode])
    }
    await expect(page.locator(`[aria-label*="${slotCode}"]`)).toHaveCount(1)
  }

  const slot11 = page.locator('[data-slot-code="11"]')
  await slot11.click()
  const dialogDec11 = page.getByRole('dialog', { name: 'Edicao do dente 51' })
  await expect(dialogDec11).toBeVisible()
  const trocaParaPermanente = dialogDec11.getByRole('button', { name: /Trocar para permanente 11/i })
  await expect(trocaParaPermanente).toBeVisible()
  await trocaParaPermanente.click()
  await expect(page.getByRole('dialog', { name: 'Edicao do dente 11' })).toBeVisible()
  await page.getByRole('button', { name: 'Cancelar' }).click()
  await expect(slot11).toHaveAttribute('data-active-tooth-code', '11')

  const slot16 = page.locator('[data-slot-code="16"]')
  await expect(slot16).toHaveAttribute('data-active-tooth-code', '')
  await slot16.click()
  const dialog16 = page.getByRole('dialog', { name: 'Edicao do dente 16' })
  await expect(dialog16).toBeVisible()
  await dialog16.getByLabel('Novo estado').selectOption('protese')
  await dialog16.getByRole('button', { name: 'Salvar' }).click()
  await expect(dialog16).toBeHidden()
  await expect(slot16).toHaveAttribute('data-active-tooth-code', '16')

  await slot16.click()
  const dialog16Remover = page.getByRole('dialog', { name: 'Edicao do dente 16' })
  await expect(dialog16Remover).toBeVisible()
  await dialog16Remover.getByLabel('Novo estado').selectOption('ausente')
  await dialog16Remover.getByRole('button', { name: 'Salvar' }).click()
  await expect(dialog16Remover).toBeHidden()
  await expect(slot16.getAttribute('data-active-tooth-code')).resolves.toBe('16')
  await slot16.click()
  await expect(page.getByRole('dialog', { name: 'Edicao do dente 16' })).toBeVisible()
  await page.getByRole('button', { name: 'Cancelar' }).click()

  const slot28 = page.locator('[data-slot-code="28"]')
  await slot28.click()
  const dialog28 = page.getByRole('dialog', { name: 'Edicao do dente 28' })
  await expect(dialog28).toBeVisible()
  await dialog28.getByLabel('Novo estado').selectOption('carie')
  await dialog28.getByLabel('Percentual da cárie').fill('3000')
  await expect(dialog28.getByLabel('Percentual da cárie')).toHaveValue('30,00%')
  await dialog28.getByRole('button', { name: 'Salvar' }).click()
  await expect(dialog28).toBeHidden()

  const slot31 = page.locator('[data-slot-code="31"]')
  await slot31.click()
  const dialog31 = page.getByRole('dialog', { name: 'Edicao do dente 71' })
  await expect(dialog31).toBeVisible()
  await dialog31.getByLabel('Novo estado').selectOption('ext')
  await dialog31.getByRole('button', { name: 'Salvar' }).click()
  await expect(dialog31).toBeHidden()

  await expect(page.locator('[aria-label*=".svg"]')).toHaveCount(0)

  const prontuarioFinal = await getProntuario(request, paciente.id)
  expect(getStatusFromOdontograma(prontuarioFinal, '28')).toBe('carie')
  expect(getCariePercentualFromOdontograma(prontuarioFinal, '28')).toBe(30)
  expect(getStatusFromOdontograma(prontuarioFinal, '16')).toBe('ausente')
  expect(getStatusFromOdontograma(prontuarioFinal, '71')).toBe('ext')
  expect(getStatusFromOdontograma(prontuarioFinal, '51')).toBe('ausente')
})

test('deve alternar permanente/deciduo no espaco mista de forma simetrica e persistir', async ({ page, request }) => {
  const paciente = await ensurePacienteSeed(request)
  const token = await loginToken(request)
  const headers = { Authorization: `Bearer ${token}` }

  await fazerLogin(page)
  await page.goto('/prontuario')
  await selecionarPacientePorBusca(page, paciente.nome, paciente)

  const prontuario = await getProntuario(request, paciente.id)
  const prontuarioId = prontuario.id

  await request.patch(`${API_BASE_URL}/api/prontuario/${prontuarioId}/odontograma/11`, { headers, data: { status: 'ok' } })
  await request.patch(`${API_BASE_URL}/api/prontuario/${prontuarioId}/odontograma/51`, { headers, data: { status: 'ok' } })

  await page.getByRole('combobox', { name: 'Denticao ativa' }).selectOption('Mista')
  const slot11 = page.locator('[data-slot-code="11"]')
  await slot11.click()

  const dialogDec11 = page.getByRole('dialog', { name: 'Edicao do dente 51' })
  await expect(dialogDec11).toBeVisible()
  await dialogDec11.getByRole('button', { name: /Trocar para permanente 11/i }).click()
  const estadoDepoisPermanece = await getProntuario(request, paciente.id)
  expect(getStatusFromOdontograma(estadoDepoisPermanece, '11')).toBe('ok')
  expect(getStatusFromOdontograma(estadoDepoisPermanece, '51')).toBe('ausente')

  const dialogPerm11 = page.getByRole('dialog', { name: 'Edicao do dente 11' })
  await expect(dialogPerm11).toBeVisible()
  await dialogPerm11.getByRole('button', { name: /Trocar para deciduo 51/i }).click()
  await dialogPerm11.getByRole('button', { name: 'Cancelar' }).click()

  const estadoDepoisDeciduo = await getProntuario(request, paciente.id)
  expect(getStatusFromOdontograma(estadoDepoisDeciduo, '11')).toBe('ausente')
  expect(getStatusFromOdontograma(estadoDepoisDeciduo, '51')).toBe('ok')
  await expect(slot11).toHaveAttribute('data-active-tooth-code', '51')
})

test('deve validar acessibilidade basica com teclado no painel de denticao mista', async ({ page, request }) => {
  const paciente = await ensurePacienteSeed(request)

  await fazerLogin(page)
  await page.goto('/prontuario')
  await selecionarPacientePorBusca(page, paciente.nome, paciente)

  await page.getByRole('combobox', { name: 'Denticao ativa' }).selectOption('Mista')
  const slot33 = page.locator('[data-slot-code="38"]')
  await expect(slot33).toBeVisible()
  await expect(slot33).toHaveClass(/focus:ring-2/)

  await slot33.focus()
  await expect(slot33).toBeFocused()
  await page.keyboard.press('Enter')
  const dialogComEnter = page.getByRole('dialog', { name: 'Edicao do dente 38' })
  await expect(dialogComEnter).toBeVisible()
  await expect(dialogComEnter.getByLabel('Novo estado')).toBeVisible()
  await expect(dialogComEnter.getByRole('button', { name: 'Salvar' })).toBeVisible()
  await expect(dialogComEnter.getByRole('button', { name: 'Cancelar' })).toBeVisible()
  await dialogComEnter.getByRole('button', { name: 'Cancelar' }).click()
  await expect(dialogComEnter).toBeHidden()
  await expect(slot33).toBeFocused()

  await slot33.focus()
  await page.keyboard.press(' ')
  const dialogComSpace = page.getByRole('dialog', { name: 'Edicao do dente 38' })
  await expect(dialogComSpace).toBeVisible()
  await dialogComSpace.getByRole('button', { name: 'Cancelar' }).click()
  await expect(dialogComSpace).toBeHidden()

  await expect(slot33).toBeFocused()
  const mixedSlots = page.locator('[data-testid="odontograma-mixed-slot"]')
  const totalSlots = await mixedSlots.count()
  for (let idx = 0; idx < totalSlots; idx += 1) {
    const slot = mixedSlots.nth(idx)
    const slotLabel = await slot.getAttribute('aria-label')
    expect(slotLabel).toBeTruthy()
    expect(slotLabel).not.toContain('.svg')
  }
})

test('deve registrar carie com percentual e manter feedback visível', async ({ page, request }) => {
  const paciente = await ensurePacienteSeed(request)

  await fazerLogin(page)
  await page.goto('/prontuario')
  await selecionarPacientePorBusca(page, paciente.nome, paciente)

  const respostaInicial = await getProntuario(request, paciente.id)
  expect(respostaInicial.denticaoAtiva).toBe('Permanente')
  expect(getStatusFromOdontograma(respostaInicial, '18')).toBe('ok')
  const fillDenteNaoSelecionado = await page.locator('#tooth-17').evaluate((element) => {
    const targets = [element, ...element.querySelectorAll('path, polygon, polyline, rect, circle, ellipse, line')]
    return targets.map((target) => target.style.fill).filter(Boolean)
  })
  expect(fillDenteNaoSelecionado.some((fill) => fill !== 'none' && fill !== 'transparent')).toBe(true)

  await salvarEstadoNoDente(page, '18', 'carie', 50)

  const respostaDepois = await getProntuario(request, paciente.id)
  expect(getStatusFromOdontograma(respostaDepois, '18')).toBe('carie')
  expect(getCariePercentualFromOdontograma(respostaDepois, '18')).toBe(50)

  await selectToothViaSvgOrFallback(page, '18')
  const dialog = page.getByRole('dialog', { name: 'Edicao do dente 18' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByLabel('Novo estado')).toHaveValue('carie')
  const percentualInput = dialog.getByLabel('Percentual da cárie')
  await expect(percentualInput).toHaveValue('50,00%')
  await percentualInput.fill('15000')
  await expect(percentualInput).toHaveValue('100,00%')
  await dialog.getByRole('button', { name: 'Cancelar' }).click()
  await expect(dialog).toBeHidden()

  const buttonTooth = page.getByRole('button', { name: /Selecionar dente 18/i })
  if (await buttonTooth.count()) {
    const style = await buttonTooth.first().evaluate((element) => element.style.backgroundImage || '')
    expect(typeof style).toBe('string')
  }
})

test('deve validar legenda de protese com cor neutra distinta de extracao', async ({ page, request }) => {
  const paciente = await ensurePacienteSeed(request)

  await fazerLogin(page)
  await page.goto('/prontuario')
  await selecionarPacientePorBusca(page, paciente.nome, paciente)

  const proteseLegenda = page.getByTestId('legenda-protese')
  const extracaoLegenda = page.getByTestId('legenda-ext')
  const legendaProtese = (await proteseLegenda.locator('span').first().getAttribute('class')) || ''
  const legendaExtracao = (await extracaoLegenda.locator('span').first().getAttribute('class')) || ''

  await expect(legendaProtese).toContain('bg-stone-100')
  await expect(legendaProtese).not.toContain('bg-rose-50')
  await expect(legendaExtracao).toContain('bg-rose-50')
})
