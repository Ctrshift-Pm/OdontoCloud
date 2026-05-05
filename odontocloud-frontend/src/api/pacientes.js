import client from './client'

export async function getPacientes() {
  const { data } = await client.get('/api/pacientes')
  return data
}

export async function criarPaciente(pacienteData) {
  const { data } = await client.post('/api/pacientes', pacienteData)
  return data
}

export async function createPaciente(payload) {
  const { data } = await client.post('/api/pacientes', payload)
  return data
}
