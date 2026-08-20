import { api } from './api'

export const trocaService = {
  solicitarTroca: async (data) => api.post('/trocas', data),
  listarTrocas: async () => api.get('/trocas'),
  listarTrocasCliente: async (clienteId) => api.get(`/trocas/cliente/${clienteId}`),
  autorizarTroca: async (id) => api.patch(`/trocas/${id}/autorizar`),
  recusarTroca: async (id, motivo) => api.patch(`/trocas/${id}/recusar`, { motivo }),
  receberTroca: async (id, retornarEstoque) => api.patch(`/trocas/${id}/receber`, { retornarEstoque }),
}
