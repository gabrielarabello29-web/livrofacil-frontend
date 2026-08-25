import { api } from './api'

export const cupomService = {
  // lista cupons (admin or user)
  listarCupons: async (filtros) => api.get('/cupons', { params: filtros }),

  // valida um cupom e retorna { valido, tipo: 'valor'|'percentual', valor, codigo, mensagem }
  validarCupom: async (codigo) => api.post('/cupons/validar', { codigo }),

  // opcional: aplicar cupom a um pedido no backend
  aplicarCupomNoPedido: async (pedidoId, codigo) => api.post(`/pedidos/${pedidoId}/cupons`, { codigo }),
}