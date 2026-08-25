import { api } from './api'

export const clienteService = {
  buscarCliente: async (id) => api.get(`/clientes/${id}`),
  atualizarCliente: async (id, data) => api.put(`/clientes/${id}`, data),
  listarEnderecos: async (id) => api.get(`/clientes/${id}/enderecos`),
  adicionarEndereco: async (id, data) => api.post(`/clientes/${id}/enderecos`, data),
  atualizarEndereco: async (clienteId, endId, data) => api.put(`/clientes/${clienteId}/enderecos/${endId}`, data),
  removerEndereco: async (clienteId, endId) => api.delete(`/clientes/${clienteId}/enderecos/${endId}`),
  listarCartoes: async (id) => api.get(`/clientes/${id}/cartoes`),
  adicionarCartao: async (id, data) => api.post(`/clientes/${id}/cartoes`, data),
  removerCartao: async (clienteId, cartaoId) => api.delete(`/clientes/${clienteId}/cartoes/${cartaoId}`),
  alterarSenha: async (id, data) => api.patch(`/clientes/${id}/senha`, data),

  // Inativar cliente (soft-delete / desativação)
  inativarCliente: async (id) => api.patch(`/clientes/${id}/inativar`),
}