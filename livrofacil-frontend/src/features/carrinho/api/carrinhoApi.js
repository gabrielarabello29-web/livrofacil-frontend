const API_URL = 'http://localhost:8080/api'

async function tratarResposta(response) {
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw { status: response.status, erro: data.erro || 'Erro', mensagem: data.mensagem || 'Não foi possível concluir a operação.', erros: data.erros || {}, caminho: data.caminho || '', timestamp: data.timestamp || null }
  return data
}

function query({ token, clienteId, quantidade } = {}) {
  const params = new URLSearchParams()
  if (token) params.set('token', token)
  if (clienteId) params.set('clienteId', String(clienteId))
  if (quantidade !== undefined) params.set('quantidade', String(quantidade))
  const texto = params.toString()
  return texto ? `?${texto}` : ''
}

async function request(path, options = {}) {
  let response
  try { response = await fetch(`${API_URL}${path}`, options) } catch { throw { status: 0, mensagem: 'Não foi possível conectar ao backend.' } }
  return tratarResposta(response)
}

export function criarOuAssociarCarrinho({ token = null, clienteId = null } = {}) {
  return request('/carrinhos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, clienteId }) })
}

export function buscarCarrinho(id, identidade) { return request(`/carrinhos/${id}${query(identidade)}`) }
export function adicionarItem(id, payload, identidade) { return request(`/carrinhos/${id}/itens${query(identidade)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }) }
export function atualizarItem(id, itemId, quantidade, identidade) { return request(`/carrinhos/${id}/itens/${itemId}${query({ ...identidade, quantidade })}`, { method: 'PUT' }) }
export function removerItem(id, itemId, identidade) { return request(`/carrinhos/${id}/itens/${itemId}${query(identidade)}`, { method: 'DELETE' }) }
