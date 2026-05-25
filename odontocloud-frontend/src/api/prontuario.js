import client from './client'

export async function getProntuarioPorPaciente(pacienteId) {
  const { data } = await client.get(`/api/prontuario/${pacienteId}`)
  return data
}

export async function atualizarOdontogramaDente(prontuarioId, dente, status, cariePercentual = null) {
  const { data } = await client.patch(`/api/prontuario/${prontuarioId}/odontograma/${dente}`, {
    status,
    cariePercentual,
  })

  return data
}

export async function atualizarDenticaoAtiva(prontuarioId, denticaoAtiva) {
  const { data } = await client.patch(`/api/prontuario/${prontuarioId}/denticao`, {
    denticaoAtiva,
  })

  return data
}

export async function atualizarAnamnese(prontuarioId, anamnese) {
  const { data } = await client.patch(`/api/prontuario/${prontuarioId}/anamnese`, {
    anamnese,
  })

  return data
}

