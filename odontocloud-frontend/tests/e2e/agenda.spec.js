import { expect, test } from '@playwright/test'
import process from 'node:process'

const LOGIN_EMAIL = 'admin@clinicasorrir.com.br'
const LOGIN_PASSWORD = '123'
const API_BASE_URL = process.env.PLAYWRIGHT_API_URL || process.env.API_BASE_URL || 'http://localhost:5189'
const SLOT_TIMES = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30']
const POST_TIMEOUT_MS = 45_000
const TEST_RUN_ID = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 16)
let pacienteSequence = 0
test.describe.configure({ mode: 'serial' })

async function obterTokenAdmin(request) {
  const response = await request.post(`${API_BASE_URL}/api/auth/login`, {
    data: {
      Email: LOGIN_EMAIL,
      Senha: LOGIN_PASSWORD,
    },
  })

  expect(response.ok()).toBeTruthy()
  const body = await response.json()
  expect(body.token).toBeTruthy()

  return body.token
}

async function obterPrimeiroDentistaId(request, token) {
  const response = await request.get(`${API_BASE_URL}/api/dentistas`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  expect(response.ok()).toBeTruthy()
  const dentistas = await response.json()
  expect(Array.isArray(dentistas)).toBeTruthy()
  return dentistas[0]?.id
}

async function garantirAgendaPadrao(request) {
  const token = await obterTokenAdmin(request)
  const dentistaId = await obterPrimeiroDentistaId(request, token)
  if (!dentistaId) {
    return
  }

  const response = await request.patch(`${API_BASE_URL}/api/dentistas/${dentistaId}/agenda-config`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    data: {
      inicio: '08:00',
      fim: '18:00',
      duracaoPadraoMinutos: 30,
      diasDaSemana: [0, 1, 2, 3, 4, 5, 6],
    },
  })

  expect(response.ok()).toBeTruthy()
}

function calculateCpfDigit(partialDigits) {
  const total = partialDigits.reduce((acc, digit, index) => {
    const factor = partialDigits.length + 1 - index
    return acc + digit * factor
  }, 0)

  const rest = total % 11
  return rest < 2 ? 0 : 11 - rest
}

function generateDeterministicCpf(seed) {
  let seedValue = 0
  const seedText = String(seed || 'agenda-seed')

  for (let index = 0; index < seedText.length; index += 1)
  {
    seedValue = (seedValue * 31 + seedText.charCodeAt(index)) % 1_000_000_000
  }

  const partialDigits = seedValue
    .toString()
    .padStart(9, '0')
    .slice(0, 9)
    .split('')
    .map((value) => Number(value))

  if (partialDigits.every((digit) => digit === partialDigits[0]))
  {
    partialDigits[0] = (partialDigits[0] + 1) % 10
  }

  const firstDigit = calculateCpfDigit(partialDigits)
  const secondDigit = calculateCpfDigit([...partialDigits, firstDigit])

  return [...partialDigits, firstDigit, secondDigit].join('')
}

function makePacienteId(testInfo, tag) {
  pacienteSequence += 1
  const retry = testInfo.retry ?? 0
  return `${TEST_RUN_ID}-${tag}-${testInfo.workerIndex ?? 0}-${retry}-${pacienteSequence}`
}

function makePacienteNome(baseNome, testInfo, tag) {
  return `${baseNome} ${makePacienteId(testInfo, tag)}`
}

async function getValidationErrorMessage(page) {
  const modalRoot = page.getByRole('heading', { name: 'Novo Agendamento' }).locator('..').locator('..')
  const text = (await modalRoot.textContent()) || ''

  if (!text.trim()) {
    return null
  }

  const lines = text
    .split('\n')
    .map((value) => value.trim())
    .filter(Boolean)

  const validationLine = lines.find((line) =>
    /(erro|aten[cç][aã]o|o?correu um erro|inval|obrigator|duplic|nao permitido|fora da agenda|já|already|required)/i.test(
      line,
    ),
  )

  return validationLine || null
}

async function loginComSeed(page) {
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'Acesse sua clinica' })).toBeVisible()

  await page.getByPlaceholder('admin@clinicasorrir.com.br').fill(LOGIN_EMAIL)
  await page.getByPlaceholder('Sua senha').fill(LOGIN_PASSWORD)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/pacientes/)
}

async function abrirAgenda(page) {
  await page.getByRole('link', { name: 'Agenda' }).click()
  await expect(page.getByRole('heading', { name: 'Agenda' })).toBeVisible()
}

async function abrirModalPorSlot(page, dayOfWeekIndex, horario = '09:00') {
  const isCreateModalVisible = await page.getByRole('heading', { name: 'Novo Agendamento' }).isVisible()
  const isEditModalVisible = await page.getByRole('heading', { name: 'Editar Agendamento' }).isVisible()

  if (isCreateModalVisible || isEditModalVisible) {
    throw new Error('Modal de agendamento ainda aberto. O fluxo deve aguardar o fechamento antes de abrir outro slot.')
  }

  const preferredSlot = horario
  const candidates = [preferredSlot, ...SLOT_TIMES.filter((item) => item !== preferredSlot)]

  for (const candidate of candidates) {
    const selector = `button[data-day-index="${dayOfWeekIndex}"][data-time="${candidate}"]`
    const slotButton = page.locator(selector)

    await expect(slotButton).toHaveCount(1)
    if (await slotButton.getAttribute('data-available') === 'false')
    {
      continue
    }

    await slotButton.first().click({ force: true })

    const isCreate = page.getByRole('heading', { name: 'Novo Agendamento' })
    const isEdit = page.getByRole('heading', { name: 'Editar Agendamento' })
    const result = await Promise.race([
      isCreate.waitFor({ state: 'visible', timeout: 1500 }).then(() => 'create'),
      isEdit.waitFor({ state: 'visible', timeout: 1500 }).then(() => 'edit'),
    ])

    if (result === 'create') {
      return candidate
    }

    await page.getByRole('button', { name: 'Cancelar' }).click()
    await expect(isEdit).not.toBeVisible()
  }

  throw new Error('Nenhum slot livre encontrado para abrir o modal de novo agendamento.')
}

async function criarAgendamento(page, pacienteNome, procedimento, horario = null, opcional = { fechaModal: true }) {
  await page.getByRole('button', { name: '+ Novo paciente' }).click()

  const novoPacienteNomeInput = page.locator('input[name="novoPacienteNome"]')
  const novoPacienteTelefoneInput = page.locator('input[name="novoPacienteTelefone"]')
  const novoPacienteCpfInput = page.locator('input[name="novoPacienteCpf"]')

  await expect(novoPacienteNomeInput).toBeVisible()
  await novoPacienteNomeInput.fill(pacienteNome)
  await novoPacienteTelefoneInput.fill('11999990000')
  await novoPacienteCpfInput.fill(generateDeterministicCpf(`agenda-${pacienteNome}`))

  await page.getByLabel('Procedimento').fill(procedimento)

  if (horario) {
    await page.getByLabel('Horario').fill(horario)
  }

  const postResponse = page.waitForResponse(
    (response) => response.url().includes('/api/agendamentos') && response.request().method() === 'POST',
    { timeout: POST_TIMEOUT_MS },
  )

  await page.getByRole('button', { name: 'Salvar' }).click()

  let response
  try {
    response = await postResponse
  } catch (error) {
    const validationMessage = await getValidationErrorMessage(page)
    const modalAberto = await page
      .getByRole('heading', { name: 'Novo Agendamento' })
      .isVisible()
      .catch(() => false)

    if (validationMessage)
    {
      throw new Error(
        `Falha de validação antes do POST /api/agendamentos: ${validationMessage}`,
      )
    }

    if (modalAberto)
    {
      throw new Error(
        `POST /api/agendamentos não foi disparado em ${POST_TIMEOUT_MS}ms e o modal ainda está aberto. Verifique validações bloqueando o envio.`,
      )
    }

    throw error
  }

  const status = response.status()
  if (opcional.statusEsperado) {
    expect(status).toBe(opcional.statusEsperado)
  } else {
    expect(status).toBeGreaterThanOrEqual(200)
    expect(status).toBeLessThan(300)
  }

  if (opcional.fechaModal) {
    await expect(page.getByRole('heading', { name: 'Novo Agendamento' })).not.toBeVisible()
  }
}

async function salvarStatusCancelado(page) {
  await page.getByLabel('Status').selectOption('Cancelado')
  await page.getByRole('button', { name: 'Salvar' }).click()
  await expect(page.getByRole('heading', { name: 'Editar Agendamento' })).not.toBeVisible()
}

test('fluxo completo da agenda com criação, cancelamento e exclusão', async ({ page, request }, testInfo) => {
  await garantirAgendaPadrao(request)
  const pacienteCancelado = makePacienteNome('Paciente Cancelado', testInfo, 'cancelado')
  const pacienteExcluido = makePacienteNome('Paciente Excluir', testInfo, 'excluido')

  await loginComSeed(page)
  await abrirAgenda(page)

  const horarioCriacaoCancelado = await abrirModalPorSlot(page, 1, '09:00')
  await criarAgendamento(page, pacienteCancelado, 'Avaliacao inicial', horarioCriacaoCancelado)

  await expect(page.getByText(pacienteCancelado)).toBeVisible()

  await page
    .locator('article', { hasText: pacienteCancelado })
    .first()
    .click()
  await expect(page.getByRole('heading', { name: 'Editar Agendamento' })).toBeVisible()
  await salvarStatusCancelado(page)
  await expect(page.locator('article', { hasText: pacienteCancelado })).toHaveCount(0)

  const horarioCriacaoExclusao = await abrirModalPorSlot(page, 1, '10:00')
  await criarAgendamento(page, pacienteExcluido, 'Limpeza', horarioCriacaoExclusao)
  await expect(page.getByText(pacienteExcluido)).toBeVisible()

  await page.locator('article', { hasText: pacienteExcluido }).first().click()
  await expect(page.getByRole('heading', { name: 'Editar Agendamento' })).toBeVisible()

  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Excluir' }).click()
  await expect(page.getByText('Agendamento excluido com sucesso.')).toBeVisible()
  await expect(page.locator('article', { hasText: pacienteExcluido })).toHaveCount(0)
})

test('não permite salvar fora da agenda configurada e mantém o modal', async ({ page, request }, testInfo) => {
  await garantirAgendaPadrao(request)
  const pacienteBloqueado = makePacienteNome('Paciente Fora da Agenda', testInfo, 'fora-agenda')

  await loginComSeed(page)
  await abrirAgenda(page)

  await abrirModalPorSlot(page, 1, '09:30')
  await criarAgendamento(
    page,
    pacienteBloqueado,
    'Avaliacao Fora',
    '04:00',
    { fechaModal: false, statusEsperado: 400 },
  )

  await expect(page.getByRole('heading', { name: 'Novo Agendamento' })).toBeVisible()
})

test('exibe e cria agendamento em sábado e domingo no padrão da semana', async ({ page, request }, testInfo) => {
  await garantirAgendaPadrao(request)
  await loginComSeed(page)
  await abrirAgenda(page)

  await expect(page.getByRole('button', { name: /^Criar agendamento em/ }).first()).toBeVisible()
  for (let index = 0; index < 8; index += 1) {
    await page.getByRole('button', { name: 'Próximo' }).click()
  }

  const weekDayIndexes = [1, 2, 3, 4, 5, 6, 0]

  const horarioFimDeSemana = '08:00'

  for (const dayIndex of weekDayIndexes) {
    await expect(page.locator(`button[data-day-index="${dayIndex}"][data-time="${horarioFimDeSemana}"]`)).toHaveCount(1)
    await expect(page.locator(`button[data-day-index="${dayIndex}"][data-time="${horarioFimDeSemana}"]`)).toBeVisible()
  }

  await expect(page.locator(`button[data-day-index="6"][data-time="${horarioFimDeSemana}"]`)).toHaveAttribute('data-available', 'true')
  await expect(page.locator(`button[data-day-index="0"][data-time="${horarioFimDeSemana}"]`)).toHaveAttribute('data-available', 'true')

  const nomeSabadou = makePacienteNome('Paciente Final de Semana', testInfo, 'sabado')
  const nomeDomingau = makePacienteNome('Paciente Final de Semana', testInfo, 'domingo')
  const horarioSabado = await abrirModalPorSlot(page, 6, horarioFimDeSemana)
  await criarAgendamento(page, nomeSabadou, 'Consulta no Sábado', horarioSabado, { fechaModal: false, statusEsperado: 200 })
  await expect(page.getByText(nomeSabadou)).toBeVisible()
  if (await page.getByRole('heading', { name: 'Novo Agendamento' }).isVisible())
  {
    await page.getByRole('button', { name: 'Cancelar' }).click()
  }

  const horarioDomingo = await abrirModalPorSlot(page, 0, horarioFimDeSemana)
  await criarAgendamento(page, nomeDomingau, 'Consulta no Domingo', horarioDomingo, { fechaModal: false, statusEsperado: 200 })
  await expect(page.getByText(nomeDomingau)).toBeVisible()
  if (await page.getByRole('heading', { name: 'Novo Agendamento' }).isVisible())
  {
    await page.getByRole('button', { name: 'Cancelar' }).click()
  }
})
