import { api } from '@/shared/api/api'

export const trocaService = {
  solicitarTroca: async (data) => api.post('/trocas', data),
  listarTrocas: async (filtros = {}) => api.get('/trocas', filtros),
  listarTrocasCliente: async (clienteId) => api.get(`/trocas/cliente/${clienteId}`),
  buscarTrocaCliente: async (clienteId, trocaId) => api.get(`/trocas/cliente/${clienteId}/${trocaId}`),
  listarHistoricoCliente: async (clienteId, trocaId) => api.get(`/trocas/cliente/${clienteId}/${trocaId}/historico`),
  listarVouchersCliente: async (clienteId) => api.get(`/trocas/cliente/${clienteId}/vouchers`),
  buscarVoucherCliente: async (clienteId, voucherId) => api.get(`/trocas/cliente/${clienteId}/vouchers/${voucherId}`),
  buscarTroca: async (id) => api.get(`/trocas/${id}`),
  listarHistorico: async (id) => api.get(`/trocas/${id}/historico`),
  autorizarTroca: async (id) => api.patch(`/trocas/${id}/autorizar`),
  recusarTroca: async (id, motivo) => api.patch(`/trocas/${id}/recusar`, { motivo }),
  receberTroca: async (id, retornarEstoque, quantidadeRecebida) =>
    api.patch(`/trocas/${id}/receber`, { retornarEstoque, quantidadeRecebida }),
}
