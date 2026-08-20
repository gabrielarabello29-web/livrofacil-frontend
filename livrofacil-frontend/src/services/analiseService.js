import { api } from './api'

export const analiseService = {
  buscarAnaliseVendas: async (params) => api.get('/analises/vendas?' + new URLSearchParams(params).toString()),
  buscarKPIs: async (periodo) => api.get(`/analises/kpis?periodo=${periodo}`),
  buscarVendasPorCategoria: async (params) => api.get('/analises/por-categoria'),
  exportarRelatorio: async (params) => api.post('/analises/exportar', params),
}
