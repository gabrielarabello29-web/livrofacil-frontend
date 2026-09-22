const API_URL = 'http://localhost:8080/api'

export function obterMensagemErro(error) {
  const data = error?.response?.data || error?.details || error
  const mensagem = data?.mensagem || data?.message || data?.erros?.detalhe || data?.erros?.constraint || error?.message || ''
  if (/cart[aã]o.*inativ/i.test(mensagem)) return 'Este cartão está inativo e não pode ser usado no pagamento.'
  if (/bandeira.*(indispon|desabil|não.*dispon)/i.test(mensagem)) return 'A bandeira deste cartão não está disponível para pagamento.'
  if (/somente.*cr[eé]dito|tipo.*cart[aã]o/i.test(mensagem)) return 'Somente cartões de crédito podem ser usados no pagamento.'
  return mensagem || 'Não foi possível concluir a operação.'
}

async function request(path, options = {}) {
  let response
  try { response = await fetch(`${API_URL}${path}`, options) } catch { throw { status: 0, mensagem: 'Não foi possível conectar ao backend.' } }
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw { status: response.status, erro: data.erro || 'Erro', mensagem: obterMensagemErro(data), erros: data.erros || {}, response: { data } }
  return data
}

export function iniciarCompra(payload) { return request('/pedidos/iniciar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }) }
function idValido(valor) {
  const numero = Number(valor)
  return Number.isInteger(numero) && numero > 0
}

function clienteIdValido(valor) {
  return typeof valor === 'string' && valor.trim().length > 0
}

export function finalizarCompra(pedidoId, clienteId, payload = {}) {
  const carrinhoId = Number(localStorage.getItem('carrinhoId'))
  const pagamentos = Array.isArray(payload.pagamentos) ? payload.pagamentos : []
  if (!idValido(pedidoId) || !clienteIdValido(clienteId)) throw { mensagem: 'Não foi possível identificar o pedido ou o cliente.' }
  if (!idValido(carrinhoId)) throw { mensagem: 'O carrinho não foi identificado.' }
  if (!pagamentos.length) throw { mensagem: 'Selecione uma forma de pagamento.' }
  if (pagamentos.some((pagamento) => !idValido(pagamento?.formaPagamentoId) || Number(pagamento.valor) <= 0 || !Number.isInteger(Number(pagamento.parcelas)) || Number(pagamento.parcelas) < 1 || Number(pagamento.parcelas) > 12)) {
    throw { mensagem: 'Confira os dados das formas de pagamento.' }
  }
  return request(`/pedidos/${pedidoId}/finalizar?clienteId=${encodeURIComponent(clienteId)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ carrinhoId, pagamentos }) })
}
export function listarMeusPedidos(clienteId) { return request(`/pedidos/cliente/${clienteId}`) }
export function buscarMeuPedido(clienteId, pedidoId) { return request(`/pedidos/${pedidoId}?clienteId=${encodeURIComponent(clienteId)}`) }
export function cancelarMeuPedido(clienteId, pedidoId) { return request(`/pedidos/${pedidoId}/cancelar?clienteId=${encodeURIComponent(clienteId)}`, { method: 'PATCH' }) }

export function obterPedidoCheckoutId() {
  const salvo = localStorage.getItem('pedidoCheckout')
  if (!salvo) return null
  try { return JSON.parse(salvo)?.id || salvo } catch { return salvo }
}

export function salvarPedidoCheckout(pedido) { if (pedido?.id) localStorage.setItem('pedidoCheckout', String(pedido.id)) }
export function salvarEnderecoCheckout(pedidoId, endereco) {
  if (pedidoId && endereco) localStorage.setItem('enderecoCheckout', JSON.stringify({ pedidoId, endereco }))
}
export function obterEnderecoCheckout(pedidoId) {
  try {
    const salvo = JSON.parse(localStorage.getItem('enderecoCheckout') || 'null')
    return String(salvo?.pedidoId) === String(pedidoId) ? salvo.endereco : null
  } catch { return null }
}
export function limparCheckoutLocal() { localStorage.removeItem('pedidoCheckout'); localStorage.removeItem('enderecoCheckout'); localStorage.removeItem('checkoutCupom') }
export function listarPedidosAdmin() { return request('/pedidos/admin') }
export function buscarPedidoAdmin(id) { return request(`/pedidos/admin/${id}`) }
export function atualizarStatusPedido(pedidoId, status) { return request(`/pedidos/admin/${pedidoId}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }) }
export function cancelarPedidoAdmin(pedidoId) { return request(`/pedidos/admin/${pedidoId}/cancelar`, { method: 'PATCH' }) }
