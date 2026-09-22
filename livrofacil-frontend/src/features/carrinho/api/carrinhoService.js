import { api } from './api'

export const carrinhoService = {
  buscarCarrinho: async () => api.get('/carrinho'),
  adicionarItem: async (data) => api.post('/carrinho/itens', data),
  atualizarItem: async (id, data) => api.put(`/carrinho/itens/${id}`, data),
  removerItem: async (id) => api.delete(`/carrinho/itens/${id}`),
}
