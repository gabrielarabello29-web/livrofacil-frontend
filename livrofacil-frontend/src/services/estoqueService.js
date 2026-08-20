import { api } from './api'

export const estoqueService = {
  listarEstoque: async () => api.get('/estoque'),
  buscarEstoqueLivro: async (livroId) => api.get(`/estoque/livro/${livroId}`),
  criarEntrada: async (data) => api.post('/estoque/entradas', data),
  listarEntradas: async () => api.get('/estoque/entradas'),
}
