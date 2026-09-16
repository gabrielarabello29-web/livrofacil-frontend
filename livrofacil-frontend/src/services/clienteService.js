import { api } from './api'

export const clienteService = {
  login: async (dados) => api.post('/clientes/login', dados),
  listarClientes: async () => api.get('/clientes'),
  buscarClientePorId: async (id) => api.get(`/clientes/${id}`),
  buscarCliente: async (id) => api.get(`/clientes/${id}`),
  buscarClientesPorFiltro: async (filtros = {}) => {
    const params = {}

    if (filtros.nome) params.nome = filtros.nome
    if (filtros.email) params.email = filtros.email

    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => query.append(key, value))

    const queryString = query.toString()
    return queryString ? api.get(`/clientes/buscar?${queryString}`) : api.get('/clientes')
  },
  buscarClientes: async (filtros = {}) => {
    return clienteService.buscarClientesPorFiltro(filtros)
  },
  criarCliente: async (dados) => {
    const { nome, email, cpf, telefone, dataNascimento, genero, senha, confirmarSenha, endereco } = dados
    return api.post('/clientes', { nome, email, cpf, telefone, dataNascimento, genero, senha, confirmarSenha, endereco })
  },
  atualizarCliente: async (id, dados) => {
    const { nome, email, cpf, telefone, dataNascimento, genero } = dados
    return api.put(`/clientes/${id}`, { nome, email, cpf, telefone, dataNascimento, genero })
  },
  alterarSenha: async (clienteId, dados) => api.patch(`/clientes/${clienteId}/senha`, dados),
  inativarCliente: async (id) => api.delete(`/clientes/${id}`),
}