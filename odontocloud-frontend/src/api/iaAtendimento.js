import client from './client'

export async function getIaLeads() {
  const { data } = await client.get('/api/ia-atendimento')
  return data
}

export async function getIaLead(leadId) {
  const { data } = await client.get(`/api/ia-atendimento/${leadId}`)
  return data
}

export async function criarIaLead(payload) {
  const { data } = await client.post('/api/ia-atendimento', payload)
  return data
}

export async function atualizarIaLeadStatus(leadId, status) {
  const { data } = await client.patch(`/api/ia-atendimento/${leadId}/status`, { status })
  return data
}

export async function assumirIaLead(leadId) {
  const { data } = await client.patch(`/api/ia-atendimento/${leadId}/assumir`)
  return data
}

export async function adicionarIaMensagem(leadId, payload) {
  const { data } = await client.post(`/api/ia-atendimento/${leadId}/mensagens`, payload)
  return data
}
