import { expect, test } from '@playwright/test'
import process from 'node:process'

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5189'
const TEST_USER_EMAIL = process.env.E2E_USER_EMAIL || 'admin@clinicasorrir.com.br'
const TEST_USER_PASSWORD = process.env.E2E_USER_PASSWORD || '123'

function gerarCpfValido() {
  const base = String(Date.now()).padStart(9, '0').slice(-9).split('').map((char) => Number(char))

  const calcularDigito = (digitos, pesoInicial) => {
    const soma = digitos.reduce((acc, numero, index) => acc + numero * (pesoInicial - index), 0)
    const resto = soma % 11
    const digito = resto < 2 ? 0 : 11 - resto
    return digito
  }

  const primeiro = calcularDigito(base, 10)
  const segundo = calcularDigito([...base, primeiro], 11)

  return [...base, primeiro, segundo].join('')
}

function todayDateString() {
  return new Date().toISOString().slice(0, 10)
}

function firstMonthDateString() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`
}

async function waitForContaReceberNaListaPendente(request, token, contaId) {
  await expect
    .poll(
      async () => {
        const contas = await getContasReceberPendentes(request, token)
        return contas.some((item) => item.id === contaId)
      },
      {
        intervals: [200, 400, 800],
        timeout: 10000,
      },
    )
    .toBeTruthy()
}

async function getContaReceberPorId(request, token, contaId) {
  const response = await request.get(`${API_BASE_URL}/api/financeiro/receber`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  expect(response.ok()).toBeTruthy()
  const contas = await response.json()
  return contas.find((item) => item.id === contaId)
}

async function aplicarFiltroContasReceber(page, { dataInicio, dataFim, status } = {}) {
  const responseWait = page.waitForResponse(
    (response) => response.url().includes('/api/financeiro/receber') && response.request().method() === 'GET',
  )

  await page.getByLabel('Data inicio').fill(dataInicio ?? firstMonthDateString())
  await page.getByLabel('Data fim').fill(dataFim ?? todayDateString())

  if (status === undefined) {
    await page.getByLabel('Status').selectOption({ index: 0 })
  } else if (status === '') {
    await page.getByLabel('Status').selectOption({ value: '' })
  } else {
    await page.getByLabel('Status').selectOption(status)
  }

  await page.getByRole('button', { name: 'Consultar', exact: true }).click()
  await responseWait
}

function findContaLinha(page, contaId) {
  return page.locator(`[data-conta-id="${contaId}"]:visible`)
}

async function expectMaskedMoneyValue(input, expected) {
  const actualValue = (await input.inputValue()).replace(/\u00a0/g, ' ')
  expect(actualValue).toBe(expected)
}

async function expectMaskedPercentValue(input, expected) {
  const actualValue = (await input.inputValue()).replace(/\u00a0/g, ' ')
  expect(actualValue).toBe(expected)
}

async function expectContaReceberAcoesPendentes(row, contaId) {
  await expect(
    row.getByRole('button', { name: `Editar conta a receber ${String(contaId).slice(0, 8)}`, exact: true }),
  ).toBeVisible()
  await expect(
    row.getByRole('button', { name: `Excluir conta a receber ${String(contaId).slice(0, 8)}`, exact: true }),
  ).toBeVisible()
}

async function loginViaUi(page) {
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'Acesse sua clinica' })).toBeVisible()

  await page.getByPlaceholder('admin@clinicasorrir.com.br').fill(TEST_USER_EMAIL)
  await page.getByPlaceholder('Sua senha').fill(TEST_USER_PASSWORD)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/pacientes/)
}

async function loginToken(request) {
  const response = await request.post(`${API_BASE_URL}/api/auth/login`, {
    data: {
      email: TEST_USER_EMAIL,
      senha: TEST_USER_PASSWORD,
    },
  })

  expect(response.ok()).toBeTruthy()
  const auth = await response.json()
  expect(auth.token).toBeTruthy()
  return auth.token
}

async function seedPaciente(request, token, nomePaciente) {
  const response = await request.post(`${API_BASE_URL}/api/pacientes`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    data: {
      Nome: nomePaciente,
      Cpf: gerarCpfValido(),
      TelefoneWhatsapp: '(11) 99999-8888',
      DataNascimento: null,
    },
  })

  expect(response.ok()).toBeTruthy()
  return response.json()
}

async function seedContaReceber(request, token, pacienteId) {
  const response = await request.post(`${API_BASE_URL}/api/financeiro/receber`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    data: {
      PacienteId: pacienteId,
      ItemPlanoTratamentoId: null,
      DentistaId: null,
      ValorBase: 190.0,
      Desconto: 0,
      DataVencimento: new Date().toISOString(),
    },
  })

  expect(response.ok()).toBeTruthy()
  return response.json()
}

async function seedContaPagar(request, token, fornecedor = `Financeiro Playwright ${Date.now()}`) {
  const response = await request.post(`${API_BASE_URL}/api/financeiro/contas-pagar`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    data: {
      FornecedorDestinatario: fornecedor,
      Categoria: 'Comissao',
      Descricao: 'Conta seed para verificacao da tela financeira',
      Valor: 123.45,
      DataVencimento: new Date().toISOString(),
    },
  })

  expect(response.ok()).toBeTruthy()
  return response.json()
}

async function getContasReceberPendentes(request, token) {
  const response = await request.get(`${API_BASE_URL}/api/financeiro/receber?status=Pendente`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  expect(response.ok()).toBeTruthy()
  return response.json()
}

async function getContasPagarPendentesViaApi(request, token) {
  const response = await request.get(`${API_BASE_URL}/api/financeiro/contas-pagar/pendentes`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  expect(response.ok()).toBeTruthy()
  return response.json()
}

test('carrega a tela financeira e renderiza contas a pagar pendentes', async ({ page, request }) => {
  const token = await loginToken(request)
  await seedContaPagar(request, token)

  await loginViaUi(page)

  await page.goto('/financeiro')
  await expect(page.getByRole('heading', { name: 'Financeiro', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Contas a pagar pendentes / atrasadas' })).toBeVisible()

  await expect(page.getByText('Contas a pagar pendentes / atrasadas')).toBeVisible()
})

test('cria, edita e exclui conta a receber', async ({ page, request }) => {
  const token = await loginToken(request)
  const nomePaciente = `Paciente CRUD ${Date.now()}`
  const paciente = await seedPaciente(request, token, nomePaciente)
  const criarContaResponse = page.waitForResponse(
    (response) => response.url().includes('/api/financeiro/receber') && response.request().method() === 'POST',
  )

  await loginViaUi(page)
  await page.goto('/financeiro')
  await expect(page.getByRole('heading', { name: 'Financeiro', exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Criar conta a receber' }).click()

  const modalCriarContaReceber = page.locator('.surface-card').filter({
    has: page.getByRole('heading', { name: 'Criar conta a receber', exact: true }),
  })

  await expect(
    modalCriarContaReceber.getByRole('heading', {
      name: 'Criar conta a receber',
      exact: true,
    }),
  ).toBeVisible()

  await page.locator('#conta-receber-paciente').selectOption(paciente.id)
  await page.getByLabel('Valor base').fill('10001')
  await expectMaskedMoneyValue(page.getByLabel('Valor base'), 'R$ 100,01')
  await page.getByLabel('Desconto (%)').fill('1000')
  await expectMaskedPercentValue(page.getByLabel('Desconto (%)'), '10,00%')
  await page.locator('#conta-receber-vencimento').fill(new Date().toISOString().slice(0, 10))
  await modalCriarContaReceber.getByRole('button', { name: 'Criar conta', exact: true }).click()

  await expect(page.getByText('Conta a receber criada com sucesso.')).toBeVisible()
  const conta = await criarContaResponse.then((response) => response.json())
  await waitForContaReceberNaListaPendente(request, token, conta.id)
  await aplicarFiltroContasReceber(page, {
    dataInicio: firstMonthDateString(),
    dataFim: todayDateString(),
    status: '',
  })

  const row = findContaLinha(page, conta.id)
  await expect(row).toBeVisible()
  await expectContaReceberAcoesPendentes(row, conta.id)
  await row.locator(`button[aria-label="Editar conta a receber ${conta.id.slice(0, 8)}"]`).click()

  const modalEditarContaReceber = page.locator('.surface-card').filter({
    has: page.getByRole('heading', { name: 'Editar conta a receber', exact: true }),
  })

  await expect(
    modalEditarContaReceber.getByRole('heading', {
      name: 'Editar conta a receber',
      exact: true,
    }),
  ).toBeVisible()
  await expectMaskedMoneyValue(page.getByLabel('Valor base'), 'R$ 100,01')
  await page.getByLabel('Desconto (%)').fill('2000')
  await expectMaskedPercentValue(page.getByLabel('Desconto (%)'), '20,00%')
  await modalEditarContaReceber.getByRole('button', { name: 'Salvar alteracoes', exact: true }).click()
  await expect(page.getByText('Conta a receber atualizada com sucesso.')).toBeVisible()

  const contasAtualizadas = await getContasReceberPendentes(request, token)
  const contaAtualizada = contasAtualizadas.find((item) => item.id === conta.id)
  expect(contaAtualizada?.valorFinal).toBe(80.01)

  await row.locator(`button[aria-label="Excluir conta a receber ${conta.id.slice(0, 8)}"]`).click()
  const confirmacaoExclusaoContaReceber = page.locator('.surface-card').filter({
    has: page.getByRole('heading', { name: 'Confirmar exclusao', exact: true }),
  })

  await expect(confirmacaoExclusaoContaReceber.getByRole('heading', { name: 'Confirmar exclusao', exact: true })).toBeVisible()
  await confirmacaoExclusaoContaReceber.getByRole('button', { name: 'Confirmar', exact: true }).click()
  await expect(page.getByText('Conta a receber excluida com sucesso.')).toBeVisible()
  await expect(row).not.toBeVisible()
  await expect(page.locator(`[data-conta-id="${conta.id}"]`)).toHaveCount(0)
})

test('valida acoes de conta a receber no layout mobile', async ({ page, request }) => {
  const token = await loginToken(request)
  const nomePaciente = `Paciente Mobile ${Date.now()}`
  const paciente = await seedPaciente(request, token, nomePaciente)
  const criarContaResponse = page.waitForResponse(
    (response) => response.url().includes('/api/financeiro/receber') && response.request().method() === 'POST',
  )

  await loginViaUi(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/financeiro')

  await expect(page.getByRole('heading', { name: 'Financeiro', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Criar conta a receber' }).click()

  const modalCriarContaReceber = page.locator('.surface-card').filter({
    has: page.getByRole('heading', { name: 'Criar conta a receber', exact: true }),
  })

  await page.locator('#conta-receber-paciente').selectOption(paciente.id)
  await page.getByLabel('Valor base').fill('15050')
  await expectMaskedMoneyValue(page.getByLabel('Valor base'), 'R$ 150,50')
  await page.getByLabel('Desconto (%)').fill('0')
  await expectMaskedPercentValue(page.getByLabel('Desconto (%)'), '0,00%')
  await page.locator('#conta-receber-vencimento').fill(todayDateString())
  await modalCriarContaReceber.getByRole('button', { name: 'Criar conta', exact: true }).click()
  await expect(page.getByText('Conta a receber criada com sucesso.')).toBeVisible()
  const conta = await criarContaResponse.then((response) => response.json())
  await waitForContaReceberNaListaPendente(request, token, conta.id)
  await aplicarFiltroContasReceber(page, {
    dataInicio: '2000-01-01',
    dataFim: '2099-12-31',
    status: '',
  })

  const row = findContaLinha(page, conta.id)
  await expect(row).toBeVisible()
  await expectContaReceberAcoesPendentes(row, conta.id)

  await row.locator(`button[aria-label="Excluir conta a receber ${conta.id.slice(0, 8)}"]`).click()
  const confirmacaoExclusaoContaReceber = page.locator('.surface-card').filter({
    has: page.getByRole('heading', { name: 'Confirmar exclusao', exact: true }),
  })

  await expect(confirmacaoExclusaoContaReceber.getByRole('button', { name: 'Confirmar', exact: true })).toBeVisible()
  await confirmacaoExclusaoContaReceber.getByRole('button', { name: 'Confirmar', exact: true }).click()
  await expect(page.getByText('Conta a receber excluida com sucesso.')).toBeVisible()
  await expect(page.locator(`[data-conta-id="${conta.id}"]`)).toHaveCount(0)
})

test('cria, edita e exclui conta a pagar', async ({ page, request }) => {
  const token = await loginToken(request)

  await loginViaUi(page)
  await page.goto('/financeiro')
  await expect(page.getByRole('heading', { name: 'Financeiro', exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Criar conta a pagar' }).click()
  const modalCriarContaPagar = page.locator('.surface-card').filter({
    has: page.getByRole('heading', { name: 'Criar conta a pagar', exact: true }),
  })

  await expect(
    modalCriarContaPagar.getByRole('heading', {
      name: 'Criar conta a pagar',
      exact: true,
    }),
  ).toBeVisible()

  const fornecedor = `Fornecedor CRUD ${Date.now()}`
  await page.getByLabel('Fornecedor / destinatario').fill(fornecedor)
  await page.getByLabel('Categoria').fill('Comissao')
  await page.getByLabel('Descricao').fill('Conta criada no e2e')
  await page.getByLabel('Valor').fill('33340')
  await expectMaskedMoneyValue(page.getByLabel('Valor'), 'R$ 333,40')
  await page.locator('#conta-pagar-vencimento').fill('2099-12-15')
  await modalCriarContaPagar.getByRole('button', { name: 'Criar conta', exact: true }).click()

  await expect(page.getByText('Conta a pagar criada com sucesso.')).toBeVisible()

  const contasPagar = await getContasPagarPendentesViaApi(request, token)
  const contaPagar = contasPagar.find((item) => item.fornecedorDestinatario === fornecedor)
  expect(contaPagar).toBeTruthy()

  const row = page.locator(`[data-conta-pagar-id="${contaPagar.id}"]`).first()
  await expect(row).toBeVisible()
  await row.locator(`button[aria-label="Editar conta a pagar ${contaPagar.id.slice(0, 8)}"]`).click()

  const modalEditarContaPagar = page.locator('.surface-card').filter({
    has: page.getByRole('heading', { name: 'Editar conta a pagar', exact: true }),
  })

  await expect(
    modalEditarContaPagar.getByRole('heading', {
      name: 'Editar conta a pagar',
      exact: true,
    }),
  ).toBeVisible()
  await page.getByLabel('Valor').fill('44480')
  await expectMaskedMoneyValue(page.getByLabel('Valor'), 'R$ 444,80')
  await modalEditarContaPagar.getByRole('button', { name: 'Salvar alteracoes', exact: true }).click()
  await expect(page.getByText('Conta a pagar atualizada com sucesso.')).toBeVisible()

  const contasPagarAtualizadas = await getContasPagarPendentesViaApi(request, token)
  const contaPagarAtualizada = contasPagarAtualizadas.find((item) => item.id === contaPagar.id)
  expect(contaPagarAtualizada?.valor).toBe(444.8)
  await row.locator(`button[aria-label="Excluir conta a pagar ${contaPagar.id.slice(0, 8)}"]`).click()
  const confirmacaoExclusaoContaPagar = page.locator('.surface-card').filter({
    has: page.getByRole('heading', { name: 'Confirmar exclusao', exact: true }),
  })

  await expect(confirmacaoExclusaoContaPagar.getByRole('heading', { name: 'Confirmar exclusao', exact: true })).toBeVisible()
  await confirmacaoExclusaoContaPagar.getByRole('button', { name: 'Confirmar', exact: true }).click()
  await expect(page.getByText('Conta a pagar excluida com sucesso.')).toBeVisible()
  await expect(row).not.toBeVisible()
  await expect(page.locator(`[data-conta-pagar-id="${contaPagar.id}"]`)).toHaveCount(0)
})

test('realiza baixa de conta a receber', async ({ page, request }) => {
  const token = await loginToken(request)
  const nomePaciente = `Paciente Playwright ${Date.now()}`
  const paciente = await seedPaciente(request, token, nomePaciente)
  const conta = await seedContaReceber(request, token, paciente.id)
  await waitForContaReceberNaListaPendente(request, token, conta.id)
  const contasResponse = await request.get(`${API_BASE_URL}/api/financeiro/receber?status=Pendente`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  expect(contasResponse.ok()).toBeTruthy()
  const contas = await contasResponse.json()
  expect(contas.some((item) => item.id === conta.id)).toBe(true)

  await loginViaUi(page)
  await page.goto('/financeiro')
  await expect(page.getByRole('heading', { name: 'Financeiro', exact: true })).toBeVisible()
  await aplicarFiltroContasReceber(page, {
    dataInicio: '2000-01-01',
    dataFim: '2099-12-31',
    status: 'Pendente',
  })

  const contaRow = findContaLinha(page, conta.id)

  await expect(contaRow).toBeVisible({ timeout: 20000 })
  const baixaButton = contaRow.locator(`button[data-testid="financeiro-btn-baixa-${conta.id}"]`)
  await expect(baixaButton).toBeVisible()
  await baixaButton.click()

  await expect(page.getByRole('heading', { name: 'Baixa de conta a receber', exact: true })).toBeVisible()
  const valorPagoInput = page.getByRole('textbox', { name: 'Valor pago' })
  await valorPagoInput.fill('10001')
  await expectMaskedMoneyValue(valorPagoInput, 'R$ 100,01')
  await page.getByLabel('Forma de pagamento').selectOption('Pix')
  await page.getByRole('button', { name: 'Confirmar baixa' }).click()

  await expect(page.getByText('Baixa registrada com sucesso.')).toBeVisible()
  const contaAtualizada = await getContaReceberPorId(request, token, conta.id)
  expect(contaAtualizada).toBeTruthy()
  expect(contaAtualizada?.status).not.toBe('Pendente')

  const statusAtual = contaAtualizada?.status || ''
  await aplicarFiltroContasReceber(page, {
    dataInicio: '2000-01-01',
    dataFim: '2099-12-31',
    status: statusAtual,
  })

  const contaRowAtualizada = findContaLinha(page, conta.id)
  await expect(contaRowAtualizada).toBeVisible({ timeout: 10000 })
  await expect(contaRowAtualizada.getByText(statusAtual)).toBeVisible()
})

test('realiza pagamento de conta a pagar', async ({ page, request }) => {
  const token = await loginToken(request)
  const fornecedor = `Fornecedor Playwright ${Date.now()}`
  const conta = await seedContaPagar(request, token, fornecedor)

  await loginViaUi(page)
  await page.goto('/financeiro')
  await expect(page.getByRole('heading', { name: 'Financeiro', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Contas a pagar pendentes / atrasadas' })).toBeVisible()

  const contaRow = page.locator(`[data-conta-pagar-id="${conta.id}"]`).first()
  const pagarButton = contaRow.locator(`button[data-testid="financeiro-btn-pagar-${conta.id}"]`)

  await expect(contaRow).toBeVisible({ timeout: 20000 })
  await expect(pagarButton).toBeVisible()
  await pagarButton.click()

  const pagamentoModal = page.locator('.surface-card').filter({
    has: page.getByRole('heading', { name: 'Pagamento de conta a pagar', exact: true }),
  })

  await expect(pagamentoModal).toBeVisible()
  await expect(pagamentoModal.getByRole('heading', { name: 'Pagamento de conta a pagar', exact: true })).toBeVisible()
  await expect(pagamentoModal.getByText(fornecedor)).toBeVisible()
  await expect(pagamentoModal.getByText(conta.descricao)).toBeVisible()
  await expect(pagamentoModal.getByText('Status atual')).toBeVisible()

  await pagamentoModal.getByRole('button', { name: 'Confirmar pagamento' }).click()

  await expect(page.getByText('Conta a pagar liquidada com sucesso.')).toBeVisible()
  await expect(contaRow).not.toBeVisible({ timeout: 20000 })

  const contasPendentes = await getContasPagarPendentesViaApi(request, token)
  const removida = contasPendentes.every((item) => item.id !== conta.id)
  expect(removida).toBe(true)
})
