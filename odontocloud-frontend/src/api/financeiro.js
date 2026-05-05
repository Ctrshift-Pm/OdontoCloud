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

export async function darBaixaContaReceber(contaId, payload) {
  const response = await client.patch(`/api/financeiro/receber/${contaId}`, payload)
  return response.data
}

export async function getContasPagarPendentes() {
  const response = await client.get('/api/financeiro/contas-pagar/pendentes')
  return Array.isArray(response.data) ? response.data : []
}

export async function pagarContaPagar(contaPagarId) {
  const response = await client.patch(`/api/financeiro/contas-pagar/${contaPagarId}/pagar`)
  return response.data
}
