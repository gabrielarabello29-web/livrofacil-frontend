import { api } from './api'

export const formaPagamentoService = {
  listarFormasPagamento: async (clienteId) => api.get(`/clientes/${clienteId}/formas-pagamento`),
  buscarFormaPagamentoPorId: async (clienteId, formaPagamentoId) => api.get(`/clientes/${clienteId}/formas-pagamento/${formaPagamentoId}`),
  criarFormaPagamento: async (clienteId, dados) => api.post(`/clientes/${clienteId}/formas-pagamento`, dados),
  atualizarFormaPagamento: async (clienteId, formaPagamentoId, dados) => api.put(`/clientes/${clienteId}/formas-pagamento/${formaPagamentoId}`, dados),
  inativarFormaPagamento: async (clienteId, formaPagamentoId) => api.delete(`/clientes/${clienteId}/formas-pagamento/${formaPagamentoId}`),
  reativarFormaPagamento: async (clienteId, formaPagamentoId) => api.patch(`/clientes/${clienteId}/formas-pagamento/${formaPagamentoId}/reativar`),
  excluirFormaPagamento: async (clienteId, formaPagamentoId) => api.delete(`/clientes/${clienteId}/formas-pagamento/${formaPagamentoId}/excluir`),
}
