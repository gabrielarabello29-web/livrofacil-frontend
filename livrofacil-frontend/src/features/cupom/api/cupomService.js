import { api } from '@/shared/api/api'

function normalizarNumero(valor) {
  if (valor === '' || valor === null || valor === undefined) return null
  const numero = Number(valor)
  return Number.isFinite(numero) ? numero : null
}

export function normalizarCupomPayload(dados = {}) {
  const payload = {
    codigo: String(dados.codigo || '').trim().toUpperCase(),
    tipoDesconto: String(dados.tipoDesconto || '').trim().toUpperCase(),
  }

  if (payload.tipoDesconto === 'PERCENTUAL') {
    payload.percentualDesconto = normalizarNumero(dados.percentualDesconto)
    payload.valorDesconto = null
  } else if (payload.tipoDesconto === 'FIXO') {
    payload.valorDesconto = normalizarNumero(dados.valorDesconto)
    payload.percentualDesconto = null
  } else {
    payload.percentualDesconto = null
    payload.valorDesconto = null
  }

  const dataFimVigencia = dados.dataFimVigencia
  if (dataFimVigencia !== undefined && dataFimVigencia !== null && String(dataFimVigencia).trim() !== '') {
    payload.dataFimVigencia = String(dataFimVigencia).trim()
  }

  const numeroUsoMaximo = normalizarNumero(dados.numeroUsoMaximo)
  if (numeroUsoMaximo !== null) {
    payload.numeroUsoMaximo = numeroUsoMaximo
  }

  return payload
}

export const cupomService = {
  listarCuponsAdmin: async () => api.get('/cupons/admin'),
  buscarCupomAdmin: async (id) => api.get(`/cupons/admin/${id}`),
  criarCupom: async (dados) => api.post('/cupons/admin', normalizarCupomPayload(dados)),
  editarCupom: async (id, dados) => api.put(`/cupons/admin/${id}`, normalizarCupomPayload(dados)),
  inativarCupom: async (id) => api.patch(`/cupons/admin/${id}/inativar`),
  ativarCupom: async (id) => api.patch(`/cupons/admin/${id}/ativar`),

  listarCupons: async (filtros) => api.get('/cupons', filtros),

  validarCupom: async (codigo) => api.post('/cupons/validar', { codigo }),

  aplicarCupomNoPedido: async (pedidoId, codigo, clienteId) =>
    api.post(`/pedidos/${pedidoId}/cupons`, { codigo }, { clienteId }),
}