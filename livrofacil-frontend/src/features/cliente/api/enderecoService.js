import { api } from './api'

export const enderecoService = {
  listarEnderecos: async (clienteId) => api.get(`/clientes/${clienteId}/enderecos`),
  buscarEnderecoPorId: async (clienteId, enderecoId) => api.get(`/clientes/${clienteId}/enderecos/${enderecoId}`),
  criarEndereco: async (clienteId, dados) => api.post(`/clientes/${clienteId}/enderecos`, dados),
  atualizarEndereco: async (clienteId, enderecoId, dados) => api.put(`/clientes/${clienteId}/enderecos/${enderecoId}`, dados),
  excluirEndereco: async (clienteId, enderecoId) => api.delete(`/clientes/${clienteId}/enderecos/${enderecoId}`),
}
