import { api } from './api'

/**
 * Mock fallback para pedidos — usado quando não há backend disponível.
 * Em ambiente real, a API será chamada. Quando a chamada falhar, usamos o mock local.
 */

export const pedidos_mock = [
  {
    id: 1001,
    cliente: 'Ana Silva',
    data: '2024-12-15',
    total: 97.8,
    status: 'Entregue',
    pagamento: 'Cartão de crédito',
    endereco: { identificacao: 'Casa', logradouro: 'Rua A', numero: '123' },
    cupons: [],
    itens: [
      { id: 1, titulo: 'Hábitos Atômicos', quantidade: 1, preco: 49.9, capa: '/capa1.jpg', statusItem: '' },
      { id: 2, titulo: 'Pai Rico Pai Pobre', quantidade: 1, preco: 47.9, capa: '/capa2.jpg', statusItem: '' },
    ],
  },
  {
    id: 1002,
    cliente: 'Carlos Mendes',
    data: '2025-01-08',
    total: 149.7,
    status: 'Em transporte',
    pagamento: 'PIX',
    endereco: { identificacao: 'Trabalho', logradouro: 'Av. B', numero: '456' },
    cupons: [],
    itens: [
      { id: 3, titulo: 'Duna', quantidade: 1, preco: 79.85, capa: '/capa3.jpg', statusItem: '' },
      { id: 4, titulo: 'O Hobbit', quantidade: 1, preco: 69.85, capa: '/capa4.jpg', statusItem: '' },
    ],
  },
]

function findMockPedido(id) {
  const numeric = Number(String(id).replace(/^#/, ''))
  return pedidos_mock.find(p => Number(p.id) === numeric) || null
}

export const pedidoService = {
  criarPedido: async (data) => {
    try {
      return await api.post('/pedidos', data)
    } catch (err) {
      // fallback: criar pedido no mock (gera id simples)
      const novo = {
        id: (Math.max(0, ...pedidos_mock.map(p => Number(p.id))) || 1000) + 1,
        cliente: data.cliente || 'Cliente (mock)',
        data: new Date().toISOString().slice(0, 10),
        total: data.total || 0,
        status: 'Em aberto',
        endereco: data.enderecoId ? { id: data.enderecoId } : null,
        cupons: data.cupons || [],
        itens: (data.itens || []).map((it, idx) => ({ id: Date.now() + idx, titulo: it.produtoId || 'Item', quantidade: it.quantidade, preco: it.precoUnitario || 0, capa: '' })),
      }
      pedidos_mock.push(novo)
      return { data: novo }
    }
  },

  buscarPedido: async (id) => {
    try {
      return await api.get(`/pedidos/${id}`)
    } catch (err) {
      // fallback para mock
      const p = findMockPedido(id)
      if (p) return { data: p }
      throw err
    }
  },

  listarPedidos: async (filtros) => {
    try {
      return await api.get('/pedidos', { params: filtros })
    } catch (err) {
      return { data: pedidos_mock.slice() }
    }
  },

  alterarStatus: async (id, novoStatus) => {
    try {
      return await api.patch(`/pedidos/${id}/status`, { status: novoStatus })
    } catch (err) {
      // fallback: atualizar mock
      const p = findMockPedido(id)
      if (p) {
        p.status = novoStatus
        return { data: p }
      }
      throw err
    }
  },

  confirmarRecebimento: async (id) => {
    try {
      return await api.patch(`/pedidos/${id}/confirmar-recebimento`)
    } catch (err) {
      const p = findMockPedido(id)
      if (p) {
        p.status = 'Entregue'
        return { data: p }
      }
      throw err
    }
  },

  cancelarPedido: async (id, motivo) => {
    try {
      return await api.patch(`/pedidos/${id}/cancelar`, { motivo })
    } catch (err) {
      const p = findMockPedido(id)
      if (p) {
        p.status = 'Cancelado'
        p.cancelamento = { motivo, data: new Date().toISOString() }
        return { data: p }
      }
      throw err
    }
  },

  informarDespachoItem: async (pedidoId, itemId, dadosDespacho) => {
    try {
      return await api.post(`/pedidos/${pedidoId}/itens/${itemId}/despacho`, dadosDespacho)
    } catch (err) {
      const p = findMockPedido(pedidoId)
      if (p) {
        const it = p.itens.find(i => Number(i.id) === Number(itemId))
        if (it) it.statusItem = 'Item enviado'
        return { data: it || null }
      }
      throw err
    }
  },

  solicitarTrocaItem: async (pedidoId, itemId, dadosTroca) => {
    try {
      return await api.post(`/pedidos/${pedidoId}/itens/${itemId}/troca`, dadosTroca)
    } catch (err) {
      const p = findMockPedido(pedidoId)
      if (p) {
        const it = p.itens.find(i => Number(i.id) === Number(itemId))
        if (it) it.statusItem = 'Troca solicitada'
        return { data: it || null }
      }
      throw err
    }
  },
}
