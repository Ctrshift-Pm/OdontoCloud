import { expect, test } from '@playwright/test'

const LOGIN_EMAIL = 'admin@clinicasorrir.com.br'
const LOGIN_PASSWORD = '123'

function calculateCpfDigit(partialDigits) {
  const total = partialDigits.reduce((acc, digit, index) => {
    const factor = partialDigits.length + 1 - index
    return acc + digit * factor
  }, 0)

  const rest = total % 11
  return rest < 2 ? 0 : 11 - rest
}

function generateValidCpf() {
  const partialDigits = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10))

  if (partialDigits.every((digit) => digit === partialDigits[0])) {
    partialDigits[0] = (partialDigits[0] + 1) % 10
  }

  const firstDigit = calculateCpfDigit(partialDigits)
  const secondDigit = calculateCpfDigit([...partialDigits, firstDigit])

  return [...partialDigits, firstDigit, secondDigit].join('')
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
  const selector = `button[data-day-index="${dayOfWeekIndex}"][data-time="${horario}"]`
  const slotButton = page.locator(selector)

  await expect(slotButton).toHaveCount(1)
  await slotButton.first().click()
  await expect(page.getByRole('heading', { name: 'Novo Agendamento' })).toBeVisible()
}

async function criarAgendamento(page, pacienteNome, procedimento, horario = null, opcional = { fechaModal: true }) {
  await page.getByRole('button', { name: '+ Novo paciente' }).click()

  const novoPacienteNomeInput = page.locator('input[name="novoPacienteNome"]')
  const novoPacienteTelefoneInput = page.locator('input[name="novoPacienteTelefone"]')
  const novoPacienteCpfInput = page.locator('input[name="novoPacienteCpf"]')

  await expect(novoPacienteNomeInput).toBeVisible()
  await novoPacienteNomeInput.fill(pacienteNome)
  await novoPacienteTelefoneInput.fill('11999990000')
  await novoPacienteCpfInput.fill(generateValidCpf())

  await page.getByLabel('Procedimento').fill(procedimento)

  if (horario) {
    await page.getByLabel('Horario').fill(horario)
  }

  const postResponse = page.waitForResponse(
    (response) => response.url().includes('/api/agendamentos') && response.request().method() === 'POST',
  )

  await page.getByRole('button', { name: 'Salvar' }).click()
  const response = await postResponse

  if (opcional.statusEsperado) {
    expect(response.status()).toBe(opcional.statusEsperado)
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

test('fluxo completo da agenda com criação, cancelamento e exclusão', async ({ page }) => {
  const id = Date.now()
  const pacienteCancelado = `Paciente Cancelado ${id}`
  const pacienteExcluido = `Paciente Excluir ${id}`

  await loginComSeed(page)
  await abrirAgenda(page)

  await abrirModalPorSlot(page, 1, '09:30')
  await criarAgendamento(page, pacienteCancelado, 'Avaliacao inicial', '09:30')

  await expect(page.getByText(pacienteCancelado)).toBeVisible()

  await page
    .locator('article', { hasText: pacienteCancelado })
    .first()
    .click()
  await expect(page.getByRole('heading', { name: 'Editar Agendamento' })).toBeVisible()
  await salvarStatusCancelado(page)
  await expect(page.locator('article', { hasText: pacienteCancelado })).toHaveCount(0)

  await abrirModalPorSlot(page, 1, '10:00')
  await criarAgendamento(page, pacienteExcluido, 'Limpeza', '10:00')
  await expect(page.getByText(pacienteExcluido)).toBeVisible()

  await page.locator('article', { hasText: pacienteExcluido }).first().click()
  await expect(page.getByRole('heading', { name: 'Editar Agendamento' })).toBeVisible()

  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Excluir' }).click()
  await expect(page.getByText('Agendamento excluido com sucesso.')).toBeVisible()
  await expect(page.locator('article', { hasText: pacienteExcluido })).toHaveCount(0)
})

test('não permite salvar fora da agenda configurada e mantém o modal', async ({ page }) => {
  const id = Date.now()
  const pacienteBloqueado = `Paciente Fora da Agenda ${id}`

  await loginComSeed(page)
  await abrirAgenda(page)

  await abrirModalPorSlot(page, 1, '09:30')
  await criarAgendamento(
    page,
    pacienteBloqueado,
    'Avaliacao Fora',
    '07:00',
    { fechaModal: false, statusEsperado: 400 },
  )

  await expect(page.getByRole('heading', { name: 'Novo Agendamento' })).toBeVisible()
})

test('exibe todos os dias da semana no modo semanal, incluindo sábado e domingo', async ({ page }) => {
  await loginComSeed(page)
  await abrirAgenda(page)

  await expect(page.getByRole('button', { name: /^Criar agendamento em/ }).first()).toBeVisible()
  await expect(page.locator('button[data-day-index="6"][data-time="09:00"]')).toHaveCount(1)
  await expect(page.locator('button[data-day-index="0"][data-time="09:00"]')).toHaveCount(1)
  await expect(page.locator('button[data-day-index="6"][data-time="09:00"]')).toHaveAttribute('data-available', 'false')
  await expect(page.locator('button[data-day-index="0"][data-time="09:00"]')).toHaveAttribute('data-available', 'false')
  await expect(page.locator('button[data-day-index="6"][data-time="09:00"]')).toBeVisible()
  await expect(page.locator('button[data-day-index="0"][data-time="09:00"]')).toBeVisible()
})
