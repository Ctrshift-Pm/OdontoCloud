import client from './client'

export async function getDashboardResumo() {
  const response = await client.get('/api/dashboard/resumo')
  return response.data
}
