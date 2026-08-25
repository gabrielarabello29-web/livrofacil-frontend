import { api } from './api'

export const pedidoService = {
  criarPedido: async (data) => api.post('/pedidos', data), // data: { itens, enderecoId, pagamentos: [], cupons: [], frete, total }
  buscarPedido: async (id) => api.get(`/pedidos/${id}`),
  listarPedidos: async (filtros) => api.get('/pedidos', { params: filtros }),

  // alterar status geral do pedido (admin)
  alterarStatus: async (id, novoStatus) => api.patch(`/pedidos/${id}/status`, { status: novoStatus }),

  // ações comuns (cliente/admin)
  confirmarRecebimento: async (id) => api.patch(`/pedidos/${id}/confirmar-recebimento`),
  cancelarPedido: async (id, motivo) => api.patch(`/pedidos/${id}/cancelar`, { motivo }),

  // informar despacho de um item (tracking opcional)
  informarDespachoItem: async (pedidoId, itemId, dadosDespacho) => api.post(`/pedidos/${pedidoId}/itens/${itemId}/despacho`, dadosDespacho),

  // solicitar troca de item (cliente)
  solicitarTrocaItem: async (pedidoId, itemId, dadosTroca) => api.post(`/pedidos/${pedidoId}/itens/${itemId}/troca`, dadosTroca),
}