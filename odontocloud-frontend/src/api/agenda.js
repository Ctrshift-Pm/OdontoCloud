import client from './client'

export async function obterAgendamentos(dataInicio, dataFim, dentistaId) {
  const response = await client.get('/api/agendamentos', {
    params: {
      dataInicio,
      dataFim,
      dentistaId,
    },
  })

  return Array.isArray(response.data) ? response.data : []
}

export async function criarAgendamento(dados) {
  const response = await client.post('/api/agendamentos', dados)
  return response.data
}

export async function atualizarAgendamento(id, dados) {
  const response = await client.put(`/api/agendamentos/${id}`, dados)
  return response.data
}

export async function atualizarStatus(id, novoStatus) {
  const response = await client.patch(`/api/agendamentos/${id}/status`, {
    novoStatus,
  })

  return response.data
}

export async function atualizarAgendaDentista(dentistaId, dados) {
  const response = await client.patch(`/api/dentistas/${dentistaId}/agenda-config`, dados)
  return response.data
}

export async function excluirAgendamento(id) {
  await client.delete(`/api/agendamentos/${id}`)
}

export async function obterDentistas() {
  const response = await client.get('/api/dentistas')
  return Array.isArray(response.data) ? response.data : []
}
