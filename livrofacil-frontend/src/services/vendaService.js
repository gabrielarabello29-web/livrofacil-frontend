import { api } from './api'

export const pedidos_mock = [
  { id: 1001, cliente: 'Ana Silva', data: '2024-12-15', valor: 97.80, status: 'Entregue', pagamento: 'Cartão de crédito', itens: ['Hábitos Atômicos', 'Pai Rico Pai Pobre'] },
  { id: 1002, cliente: 'Carlos Mendes', data: '2025-01-08', valor: 149.70, status: 'Em transporte', pagamento: 'PIX', itens: ['Duna', 'O Hobbit'] },
  { id: 1003, cliente: 'Mariana Costa', data: '2025-01-10', valor: 44.90, status: 'Em processamento', pagamento: 'Cartão de débito', itens: ['A Sutil Arte de Ligar o F*da-se'] },
  { id: 1004, cliente: 'Pedro Souza', data: '2025-01-05', valor: 85.80, status: 'Aprovada', pagamento: 'Cartão de crédito', itens: ['1984', 'O Problema dos Três Corpos'] },
  { id: 1005, cliente: 'Lucia Ferreira', data: '2024-12-28', valor: 39.90, status: 'Cancelada', pagamento: 'PIX', itens: ['Os Segredos da Mente Milionária'] },
]

export const vendaService = {
  criarVenda: async (data) => api.post('/vendas', data),
  buscarVenda: async (id) => api.get(`/vendas/${id}`),
  listarVendas: async (filtros) => api.get('/vendas', { params: filtros }),

  atualizarStatusVenda: async (id, status) => api.patch(`/vendas/${id}/status`, { status }),

  confirmarRecebimento: async (id) => api.patch(`/vendas/${id}/confirmar-recebimento`),
  cancelarVenda: async (id, motivo) => api.patch(`/vendas/${id}/cancelar`, { motivo }),
  informarDespacho: async (id, itemId, rastreamento) => api.post(`/vendas/${id}/itens/${itemId}/despacho`, { rastreamento }),
}
