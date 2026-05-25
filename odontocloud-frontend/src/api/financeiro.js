import client from './client'

function normalizeDateToIso(value) {
  if (!value) {
    return undefined
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return undefined
  }

  return parsed.toISOString().slice(0, 10)
}

export async function getContasReceberPorPeriodo(filtros = {}) {
  const params = {
    dataInicio: normalizeDateToIso(filtros.dataInicio),
    dataFim: normalizeDateToIso(filtros.dataFim),
    status: filtros.status || undefined,
  }

  const response = await client.get('/api/financeiro/receber', {
    params,
  })

  return Array.isArray(response.data) ? response.data : []
}

export async function getContasReceberPendentesPorPaciente(pacienteId) {
  const response = await client.get('/api/financeiro/pendentes', {
    params: {
      pacienteId,
    },
  })

  return Array.isArray(response.data) ? response.data : []
}

export async function criarContaReceber(payload) {
  const response = await client.post('/api/financeiro/receber', payload)
  return response.data
}

export async function darBaixaContaReceber(contaId, payload) {
  const response = await client.patch(`/api/financeiro/receber/${contaId}`, payload)
  return response.data
}

export async function atualizarContaReceber(contaId, payload) {
  const response = await client.put(`/api/financeiro/receber/${contaId}`, payload)
  return response.data
}

export async function excluirContaReceber(contaId) {
  await client.delete(`/api/financeiro/receber/${contaId}`)
}

export async function getContasPagarPendentes() {
  const response = await client.get('/api/financeiro/contas-pagar/pendentes')
  return Array.isArray(response.data) ? response.data : []
}

export async function criarContaPagar(payload) {
  const response = await client.post('/api/financeiro/contas-pagar', payload)
  return response.data
}

export async function pagarContaPagar(contaPagarId) {
  const response = await client.patch(`/api/financeiro/contas-pagar/${contaPagarId}/pagar`)
  return response.data
}

export async function atualizarContaPagar(contaPagarId, payload) {
  const response = await client.put(`/api/financeiro/contas-pagar/${contaPagarId}`, payload)
  return response.data
}

export async function excluirContaPagar(contaPagarId) {
  await client.delete(`/api/financeiro/contas-pagar/${contaPagarId}`)
}
