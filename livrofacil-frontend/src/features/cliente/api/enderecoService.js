import { api } from '@/shared/api/api'

export function normalizarPayloadEndereco(dados = {}) {
  const texto = (valor) => {
    if (valor === null || valor === undefined) return ''
    return typeof valor === 'string' ? valor.trim() : String(valor).trim()
  }

  const tipoEndereco = texto(dados.tipoEndereco ?? dados.tipoResidencia)
  const logradouro = texto(dados.logradouro ?? dados.tipoLogradouro)

  return {
    tipoEndereco,
    tipoResidencia: texto(dados.tipoResidencia ?? dados.tipoEndereco),
    logradouro,
    tipoLogradouro: texto(dados.tipoLogradouro ?? dados.logradouro),
    numero: texto(dados.numero),
    complemento: texto(dados.complemento),
    bairro: texto(dados.bairro),
    cidade: texto(dados.cidade),
    estado: String(dados.estado || '').trim().toUpperCase(),
    cep: texto(dados.cep),
    pais: texto(dados.pais),
    observacoes: texto(dados.observacoes),
    principal: Boolean(dados.principal),
  }
}

export const enderecoService = {
  listarEnderecos: async (clienteId) => api.get(`/clientes/${clienteId}/enderecos`),
  buscarEnderecoPorId: async (clienteId, enderecoId) => api.get(`/clientes/${clienteId}/enderecos/${enderecoId}`),
  criarEndereco: async (clienteId, dados) => api.post(`/clientes/${clienteId}/enderecos`, normalizarPayloadEndereco(dados)),
  atualizarEndereco: async (clienteId, enderecoId, dados) => api.put(`/clientes/${clienteId}/enderecos/${enderecoId}`, normalizarPayloadEndereco(dados)),
  excluirEndereco: async (clienteId, enderecoId) => api.delete(`/clientes/${clienteId}/enderecos/${enderecoId}`),
}
