import { api } from '@/shared/api/api'

export const formaPagamentoService = {
  listarBandeiras: async () => api.get('/pagamentos/bandeiras'),
  atualizarBandeira: async (id, disponivel) => api.patch(`/pagamentos/bandeiras/${id}`, { disponivel }),
  listarFormasPagamento: async (clienteId) => api.get(`/clientes/${clienteId}/formas-pagamento`),
  buscarFormaPagamentoPorId: async (clienteId, formaPagamentoId) => api.get(`/clientes/${clienteId}/formas-pagamento/${formaPagamentoId}`),
  criarFormaPagamento: async (clienteId, dados) => api.post(`/clientes/${clienteId}/formas-pagamento`, dados),
  atualizarFormaPagamento: async (clienteId, formaPagamentoId, dados) => api.put(`/clientes/${clienteId}/formas-pagamento/${formaPagamentoId}`, dados),
  marcarPreferencial: async (clienteId, formaPagamentoId) => api.patch(`/clientes/${clienteId}/formas-pagamento/${formaPagamentoId}/preferencial`),
  inativarFormaPagamento: async (clienteId, formaPagamentoId) => api.delete(`/clientes/${clienteId}/formas-pagamento/${formaPagamentoId}`),
  excluirFormaPagamento: async (clienteId, formaPagamentoId) => api.delete(`/clientes/${clienteId}/formas-pagamento/${formaPagamentoId}/excluir`),
  reativarFormaPagamento: async (clienteId, formaPagamentoId) => api.patch(`/clientes/${clienteId}/formas-pagamento/${formaPagamentoId}/reativar`),
}
