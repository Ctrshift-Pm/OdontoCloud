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

async function seedContaPagar(request, token) {
  const response = await request.post(`${API_BASE_URL}/api/financeiro/contas-pagar`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    data: {
      FornecedorDestinatario: `Financeiro Playwright ${Date.now()}`,
      Categoria: 'Comissao',
      Descricao: 'Conta seed para verificacao da tela financeira',
      Valor: 123.45,
      DataVencimento: new Date().toISOString(),
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

test('realiza baixa de conta a receber', async ({ page, request }) => {
  const token = await loginToken(request)
  const nomePaciente = `Paciente Playwright ${Date.now()}`
  const paciente = await seedPaciente(request, token, nomePaciente)
  const conta = await seedContaReceber(request, token, paciente.id)
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

  const contaRow = page.locator(`tr[data-testid="financeiro-linha-receber"][data-conta-id="${conta.id}"]`)

  await expect(contaRow).toBeVisible({ timeout: 20000 })
  const baixaButton = contaRow.locator(`button[data-testid="financeiro-btn-baixa-${conta.id}"]`)
  await expect(baixaButton).toBeVisible()
  await baixaButton.click()

  await expect(page.getByRole('heading', { name: 'Baixa de conta a receber', exact: true })).toBeVisible()
  await page.getByRole('spinbutton', { name: 'Valor pago' }).fill(String(conta.valorFinal))
  await page.getByLabel('Forma de pagamento').selectOption('Pix')
  await page.getByRole('button', { name: 'Confirmar baixa' }).click()

  await expect(page.getByText('Baixa registrada com sucesso.')).toBeVisible()
  await expect(baixaButton).not.toBeVisible()
  await expect(contaRow.getByText('Pago')).toBeVisible()
})
