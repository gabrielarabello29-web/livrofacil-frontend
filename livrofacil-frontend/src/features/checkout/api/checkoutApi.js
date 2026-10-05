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

export async function finalizarCompra(pedidoId, clienteId, payload = {}) {
  const carrinhoId = Number(localStorage.getItem('carrinhoId'))
  const pagamentos = Array.isArray(payload.pagamentos) ? payload.pagamentos : []
  if (!idValido(pedidoId) || !clienteIdValido(clienteId)) throw { mensagem: 'Não foi possível identificar o pedido ou o cliente.' }
  if (!idValido(carrinhoId)) throw { mensagem: 'O carrinho não foi identificado.' }
  if (!pagamentos.length && Number(payload.total) !== 0) throw { mensagem: 'Selecione uma forma de pagamento.' }
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

function formatarEnderecoCheckout(endereco) {
  if (!endereco) return ''
  const logradouro = endereco.logradouro || endereco.tipoLogradouro || ''
  const numero = endereco.numero || ''
  const complemento = endereco.complemento ? ` - ${endereco.complemento}` : ''
  const bairro = endereco.bairro || ''
  const cidade = endereco.cidade || ''
  const estado = endereco.estado || ''
  const cep = endereco.cep || ''

  return `${logradouro}, ${numero}${complemento} - ${bairro}, ${cidade}/${estado} - CEP ${cep}`.replace(/\s+/g, ' ').trim()
}

export function normalizarEnderecoCheckout(endereco) {
  if (!endereco) return null
  if (typeof endereco === 'string') return endereco

  const tipoEndereco = endereco.tipoEndereco ?? endereco.tipoResidencia ?? ''
  const logradouro = endereco.logradouro ?? endereco.tipoLogradouro ?? ''

  return {
    ...endereco,
    tipoEndereco,
    tipoResidencia: endereco.tipoResidencia ?? endereco.tipoEndereco ?? tipoEndereco,
    logradouro,
    tipoLogradouro: endereco.tipoLogradouro ?? endereco.logradouro ?? logradouro,
  }
}

export function calcularIndiceNovoEndereco(enderecosAtuais = [], enderecoNovo) {
  if (!Array.isArray(enderecosAtuais)) return 0

  const lista = enderecosAtuais.filter(Boolean)
  if (!enderecoNovo) return lista.length ? lista.length - 1 : 0

  const idNovo = enderecoNovo?.id ?? enderecoNovo?.idEndereco
  if (idNovo != null) {
    const indice = lista.findIndex((endereco) => {
      const idAtual = endereco?.id ?? endereco?.idEndereco
      return idAtual != null && String(idAtual) === String(idNovo)
    })
    if (indice >= 0) return indice
  }

  return lista.length
}

export function obterIndiceEnderecoSelecionado(enderecos = [], enderecoSelecionado) {
  const lista = Array.isArray(enderecos) ? enderecos.filter(Boolean) : []
  if (!lista.length) return 0

  const endereco = normalizarEnderecoCheckout(enderecoSelecionado)
  if (!endereco) {
    const principal = lista.findIndex((item) => item?.principal === true)
    return principal >= 0 ? principal : 0
  }

  const idSelecionado = endereco?.id ?? endereco?.idEndereco
  if (idSelecionado != null) {
    const indice = lista.findIndex((item) => {
      const idAtual = item?.id ?? item?.idEndereco
      return idAtual != null && String(idAtual) === String(idSelecionado)
    })
    if (indice >= 0) return indice
  }

  const chaveSelecionado = [
    endereco?.logradouro,
    endereco?.numero,
    endereco?.bairro,
    endereco?.cidade,
    endereco?.estado,
    endereco?.cep,
  ]
    .map((valor) => String(valor || '').trim().toLowerCase())
    .join('|')

  const indice = lista.findIndex((item) => {
    const atual = normalizarEnderecoCheckout(item)
    const chaveAtual = [
      atual?.logradouro,
      atual?.numero,
      atual?.bairro,
      atual?.cidade,
      atual?.estado,
      atual?.cep,
    ]
      .map((valor) => String(valor || '').trim().toLowerCase())
      .join('|')
    return chaveAtual && chaveAtual === chaveSelecionado
  })

  if (indice >= 0) return indice

  const principal = lista.findIndex((item) => item?.principal === true)
  return principal >= 0 ? principal : 0
}

export function salvarPedidoCheckout(pedido) { if (pedido?.id) localStorage.setItem('pedidoCheckout', String(pedido.id)) }
export function salvarEnderecoCheckout(pedidoId, endereco) {
  const enderecoNormalizado = normalizarEnderecoCheckout(endereco)
  if (pedidoId && enderecoNormalizado) localStorage.setItem('enderecoCheckout', JSON.stringify({ pedidoId, endereco: enderecoNormalizado }))
}

export async function atualizarPedidoCheckoutParaEndereco({ clienteId, carrinhoId, endereco, pedidoAtualId, cupom } = {}) {
  const enderecoNormalizado = normalizarEnderecoCheckout(endereco)
  if (!clienteIdValido(clienteId)) throw { mensagem: 'Não foi possível identificar o cliente.' }
  if (!idValido(carrinhoId)) throw { mensagem: 'O carrinho não foi identificado.' }
  if (!enderecoNormalizado) throw { mensagem: 'Selecione um endereço válido para continuar.' }

  if (pedidoAtualId) {
    try {
      const pedidoAtual = await buscarMeuPedido(clienteId, pedidoAtualId)
      const status = String(pedidoAtual?.status || '').toUpperCase()
      if (['PENDENTE', 'AGUARDANDO_PAGAMENTO', 'EM_CHECKOUT', 'EM_PROCESSAMENTO'].includes(status)) {
        await cancelarMeuPedido(clienteId, pedidoAtualId)
      }
    } catch {
      // Se o pedido já tiver sido concluído ou não existir mais, a nova tentativa de compra
      // deve continuar com o endereço atual do checkout e criar um pedido novo em seguida.
    }
  }

  const payload = {
    clienteId,
    carrinhoId: Number(carrinhoId),
    enderecoEntregaId: enderecoNormalizado.id || enderecoNormalizado.idEndereco || null,
    enderecoCobranca: formatarEnderecoCheckout(enderecoNormalizado),
  }
  if (cupom) payload.cupom = String(cupom).trim().toUpperCase()

  const pedido = await iniciarCompra(payload)

  salvarPedidoCheckout(pedido)
  salvarEnderecoCheckout(pedido?.id, enderecoNormalizado)

  return pedido
}
export function obterEnderecoCheckout(pedidoId) {
  try {
    const salvo = JSON.parse(localStorage.getItem('enderecoCheckout') || 'null')
    if (String(salvo?.pedidoId) !== String(pedidoId)) return null
    return normalizarEnderecoCheckout(salvo?.endereco)
  } catch { return null }
}
export function resolverEnderecoCheckoutAtual({ pedidoId, pedido, fallback } = {}) {
  const pedidoAtualId = pedidoId ?? pedido?.id ?? obterPedidoCheckoutId()
  const enderecoPersistido = pedidoAtualId ? obterEnderecoCheckout(String(pedidoAtualId)) : null

  if (enderecoPersistido) return enderecoPersistido

  return normalizarEnderecoCheckout(
    pedido?.enderecoEntregaObjeto ||
    pedido?.enderecoEntrega ||
    pedido?.endereco ||
    fallback,
  )
}
export function limparCheckoutLocal() { localStorage.removeItem('pedidoCheckout'); localStorage.removeItem('enderecoCheckout'); localStorage.removeItem('checkoutCupom') }
export function listarPedidosAdmin() { return request('/pedidos/admin') }
export function buscarPedidoAdmin(id) { return request(`/pedidos/admin/${id}`) }
export function atualizarStatusPedido(pedidoId, status) { return request(`/pedidos/admin/${pedidoId}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }) }
export function cancelarPedidoAdmin(pedidoId) { return request(`/pedidos/admin/${pedidoId}/cancelar`, { method: 'PATCH' }) }
