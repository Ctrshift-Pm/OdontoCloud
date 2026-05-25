import { expect, test } from '@playwright/test'
import process from 'node:process'

const TEST_USER_EMAIL = process.env.E2E_USER_EMAIL || 'admin@clinicasorrir.com.br'
const TEST_USER_PASSWORD = process.env.E2E_USER_PASSWORD || '123'

async function login(page) {
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'Acesse sua clinica' })).toBeVisible()
  await page.getByPlaceholder('admin@clinicasorrir.com.br').fill(TEST_USER_EMAIL)
  await page.getByPlaceholder('Sua senha').fill(TEST_USER_PASSWORD)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/pacientes/)
}

async function abrirConfiguracoes(page) {
  await page.getByRole('link', { name: 'Configuracoes' }).click()
  await expect(page.getByRole('heading', { name: 'Agenda por dentista' })).toBeVisible()
}

async function selecionarPrimeiroDentista(page) {
  const select = page.getByTestId('configuracoes-dentista')
  await select.waitFor({ state: 'visible' })

  const opcoes = select.locator('option')
  const totalOpcoes = await opcoes.count()
  expect(totalOpcoes).toBeGreaterThan(1)

  const optionText = await opcoes.nth(1).textContent()
  await select.selectOption({ index: 1 })

  return (optionText ?? '').trim()
}

function toStringSet(values) {
  return new Set(values)
}

async function obterConfigAgendaAtual(page) {
  return {
    inicio: await page.getByTestId('agenda-inicio').inputValue(),
    fim: await page.getByTestId('agenda-fim').inputValue(),
    duracao: await page.getByTestId('agenda-duracao').inputValue(),
    dias: await Promise.all(
      Array.from({ length: 7 }, (_, indice) => page.getByTestId(`agenda-dia-${indice}`).isChecked()),
    ),
  }
}

async function aplicarConfigAgenda(page, config) {
  await page.getByTestId('agenda-inicio').fill(config.inicio)
  await page.getByTestId('agenda-fim').fill(config.fim)
  await page.getByTestId('agenda-duracao').selectOption(config.duracao)

  for (let indice = 0; indice <= 6; indice += 1) {
    const checkbox = page.getByTestId(`agenda-dia-${indice}`)
    if (config.dias[indice]) {
      await checkbox.check()
    } else {
      await checkbox.uncheck()
    }
  }

  await expect(page.getByRole('button', { name: 'Salvar' })).toBeEnabled()
  await page.getByRole('button', { name: 'Salvar' }).click()
  await expect(page.getByText('Configuracao da agenda salva com sucesso.')).toBeVisible()
}

test.describe.configure({ mode: 'serial' })

test('salva configuração de agenda por dentista e preserva após recarregar', async ({ page }) => {
  await login(page)
  await abrirConfiguracoes(page)

  await expect(page.getByText('Sábado e domingo podem ser ativados por dentista de forma independente.')).toBeVisible()

  const nomeDentista = await selecionarPrimeiroDentista(page)
  expect(nomeDentista.length).toBeGreaterThan(0)
  const configOriginal = await obterConfigAgendaAtual(page)

  try {
    await page.getByTestId('agenda-inicio').fill('07:30')
    await page.getByTestId('agenda-fim').fill('19:00')
    await page.getByTestId('agenda-duracao').selectOption('90')

    for (let indice = 0; indice <= 6; indice += 1) {
      await page.getByTestId(`agenda-dia-${indice}`).uncheck()
    }

    await page.getByTestId('agenda-dia-0').check()
    await page.getByTestId('agenda-dia-6').check()

    const diasEsperados = toStringSet([0, 6])
    for (let indice = 0; indice <= 6; indice += 1) {
      const checked = await page.getByTestId(`agenda-dia-${indice}`).isChecked()
      if (indice === 0 || indice === 6) {
        expect(checked).toBe(true)
      } else {
        expect(checked).toBe(false)
      }
    }

    await expect(page.getByRole('button', { name: 'Salvar' })).toBeEnabled()
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page.getByText('Configuracao da agenda salva com sucesso.')).toBeVisible()

    await page.reload()
    await abrirConfiguracoes(page)
    await selecionarPrimeiroDentista(page)

    await expect(page.getByTestId('agenda-inicio')).toHaveValue('07:30')
    await expect(page.getByTestId('agenda-fim')).toHaveValue('19:00')
    await expect(page.getByTestId('agenda-duracao')).toHaveValue('90')
    expect(diasEsperados.has(0)).toBe(true)
    expect(diasEsperados.has(6)).toBe(true)
    expect(await page.getByTestId('agenda-dia-0').isChecked()).toBe(true)
    expect(await page.getByTestId('agenda-dia-6').isChecked()).toBe(true)
    expect(await page.getByTestId('agenda-dia-1').isChecked()).toBe(false)
    expect(await page.getByTestId('agenda-dia-2').isChecked()).toBe(false)
    expect(await page.getByTestId('agenda-dia-3').isChecked()).toBe(false)
    expect(await page.getByTestId('agenda-dia-4').isChecked()).toBe(false)
    expect(await page.getByTestId('agenda-dia-5').isChecked()).toBe(false)
  } finally {
    await aplicarConfigAgenda(page, configOriginal)
  }
})
