import { api } from './api'

export const pedidoService = {
  criarPedido: async (data) => api.post('/pedidos', data),
  buscarPedido: async (id) => api.get(`/pedidos/${id}`),
  listarPedidos: async (filtros) => api.get('/pedidos', { params: filtros }),

  alterarStatus: async (id, novoStatus) => api.patch(`/pedidos/${id}/status`, { status: novoStatus }),

  confirmarRecebimento: async (id) => api.patch(`/pedidos/${id}/confirmar-recebimento`),
  cancelarPedido: async (id, motivo) => api.patch(`/pedidos/${id}/cancelar`, { motivo }),

  informarDespachoItem: async (pedidoId, itemId, dadosDespacho) => api.post(`/pedidos/${pedidoId}/itens/${itemId}/despacho`, dadosDespacho),

  solicitarTrocaItem: async (pedidoId, itemId, dadosTroca) => api.post(`/pedidos/${pedidoId}/itens/${itemId}/troca`, dadosTroca),
}
