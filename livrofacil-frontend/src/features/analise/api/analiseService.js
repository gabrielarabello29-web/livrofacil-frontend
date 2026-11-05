import { api, ApiError } from '@/shared/api/api'

const BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

function montarQueryString(params = {}) {
  const query = new URLSearchParams()

  Object.entries(params || {}).forEach(([chave, valor]) => {
    if (valor === undefined || valor === null || valor === '') return

    if (Array.isArray(valor)) {
      valor.forEach((item) => {
        if (item !== undefined && item !== null && item !== '') query.append(chave, String(item))
      })
      return
    }

    query.append(chave, String(valor))
  })

  return query.toString()
}

export const analiseService = {
  buscarAnaliseVendas: async (params) => api.get('/analises/vendas?' + new URLSearchParams(params).toString()),
  buscarKPIs: async (periodo) => api.get(`/analises/kpis?periodo=${periodo}`),
  buscarVendasPorCategoria: async (params = {}) => {
    const queryString = montarQueryString(params)
    const url = `${BASE_URL}/pedidos/admin/relatorios/vendas-por-categoria${queryString ? `?${queryString}` : ''}`

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new ApiError(payload?.mensagem || 'Não foi possível carregar o relatório de vendas por categoria.', response.status, payload)
    }

    return payload
  },
  exportarRelatorio: async (params) => api.post('/analises/exportar', params),
}
