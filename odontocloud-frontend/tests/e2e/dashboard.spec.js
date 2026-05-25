import { expect, test } from '@playwright/test'

const LOGIN_EMAIL = 'admin@clinicasorrir.com.br'
const LOGIN_PASSWORD = '123'

async function loginComUi(page) {
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'Acesse sua clinica' })).toBeVisible()
  await page.getByPlaceholder(LOGIN_EMAIL).fill(LOGIN_EMAIL)
  await page.getByPlaceholder('Sua senha').fill(LOGIN_PASSWORD)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/pacientes/)
}

test('dashboard carrega indicadores reais sem placeholder', async ({ page }) => {
  await loginComUi(page)
  await page.goto('/dashboard')

  const metricas = page.locator('section').first().locator('> div')
  await expect(metricas).toHaveCount(7)

  await expect(page.getByText('Pacientes totais')).toBeVisible()
  await expect(page.getByText('Agendamentos de hoje')).toBeVisible()
  await expect(page.getByText('Agendamentos de hoje').locator('..')).toContainText(/\d+/)
  await expect(page.getByText('Pacientes por status do funil')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Proximos agendamentos' })).toBeVisible()
  await expect(page.getByText('Ver agenda')).toBeVisible()

  await expect(page.getByText('Visao executiva da clinica em preparacao.')).not.toBeVisible()
  await expect(page.getByText('preparacao')).not.toBeVisible()
})
