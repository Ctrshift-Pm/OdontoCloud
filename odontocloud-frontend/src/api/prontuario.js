import client from './client'

export async function getProntuarioPorPaciente(pacienteId) {
  const { data } = await client.get(`/api/prontuario/${pacienteId}`)
  return data
}

export async function atualizarOdontogramaDente(prontuarioId, dente, status) {
  const { data } = await client.patch(`/api/prontuario/${prontuarioId}/odontograma/${dente}`, {
    status,
  })

  return data
}

export async function atualizarAnamnese(prontuarioId, anamnese) {
  const { data } = await client.patch(`/api/prontuario/${prontuarioId}/anamnese`, {
    anamnese,
  })

  return data
}

