import { api } from '@/shared/api/api'

export const clienteService = {
  login: async (dados) => api.post('/clientes/login', dados),
  listarClientes: async () => api.get('/clientes'),
  buscarClientePorId: async (id) => api.get(`/clientes/${id}`),
  buscarCliente: async (id) => api.get(`/clientes/${id}`),
  buscarClientesPorFiltro: async (filtros = {}) => {
    const params = Object.fromEntries(Object.entries(filtros).filter(([, valor]) => String(valor ?? '').trim()))

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
    const { nome, email, cpf, telefone, dataNascimento, genero, endereco } = dados
    return api.put(`/clientes/${id}`, { nome, email, cpf, telefone, dataNascimento, genero, endereco })
  },
  alterarSenha: async (clienteId, dados) => api.patch(`/clientes/${clienteId}/senha`, dados),
  excluirConta: async (id) => api.delete(`/clientes/${id}`),
  inativarCliente: async (id) => api.delete(`/clientes/${id}`),
}