import client from './client'

export async function getPerfilMe() {
  const { data } = await client.get('/api/perfil/me')
  return data
}

export async function trocarSenhaPerfil(payload) {
  const { data } = await client.patch('/api/perfil/senha', payload)
  return data
}
