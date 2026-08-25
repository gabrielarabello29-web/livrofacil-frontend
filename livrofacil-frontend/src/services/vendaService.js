import { api } from './api'
import { pedidos_mock } from './pedidoService' // usa o mesmo mock para consistência

export const vendaService = {
  criarVenda: async (data) => {
    try {
      return await api.post('/vendas', data)
    } catch (err) {
      // fallback: criar venda no mock (reaproveita lógica de pedidoService se quiser)
      return { data: { ...data, id: Date.now(), status: 'Em aberto' } }
    }
  },

  buscarVenda: async (id) => {
    try {
      return await api.get(`/vendas/${id}`)
    } catch (err) {
      const numeric = Number(String(id).replace(/^#/, ''))
      const found = pedidos_mock.find(p => Number(p.id) === numeric)
      if (found) return { data: found }
      throw err
    }
  },

  listarVendas: async (filtros) => {
    try {
      return await api.get('/vendas', { params: filtros })
    } catch (err) {
      return { data: pedidos_mock.slice() }
    }
  },

  atualizarStatusVenda: async (id, status) => {
    try {
      return await api.patch(`/vendas/${id}/status`, { status })
    } catch (err) {
      // fallback: atualizar mock
      const numeric = Number(String(id).replace(/^#/, ''))
      const p = pedidos_mock.find(x => Number(x.id) === numeric)
      if (p) {
        p.status = status
        return { data: p }
      }
      throw err
    }
  },

  confirmarRecebimento: async (id) => {
    try {
      return await api.patch(`/vendas/${id}/confirmar-recebimento`)
    } catch (err) {
      const numeric = Number(String(id).replace(/^#/, ''))
      const p = pedidos_mock.find(x => Number(x.id) === numeric)
      if (p) {
        p.status = 'Entregue'
        return { data: p }
      }
      throw err
    }
  },

  cancelarVenda: async (id, motivo) => {
    try {
      return await api.patch(`/vendas/${id}/cancelar`, { motivo })
    } catch (err) {
      const numeric = Number(String(id).replace(/^#/, ''))
      const p = pedidos_mock.find(x => Number(x.id) === numeric)
      if (p) {
        p.status = 'Cancelado'
        p.cancelamento = { motivo, data: new Date().toISOString() }
        return { data: p }
      }
      throw err
    }
  },

  informarDespacho: async (id, itemId, rastreamento) => {
    try {
      return await api.post(`/vendas/${id}/itens/${itemId}/despacho`, { rastreamento })
    } catch (err) {
      const numeric = Number(String(id).replace(/^#/, ''))
      const p = pedidos_mock.find(x => Number(x.id) === numeric)
      if (p) {
        const it = p.itens.find(i => Number(i.id) === Number(itemId))
        if (it) it.statusItem = 'Item enviado'
        return { data: it || null }
      }
      throw err
    }
  },
}
