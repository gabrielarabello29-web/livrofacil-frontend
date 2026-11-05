import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const { listarPedidosAdmin, listarClientes, buscarVendasPorCategoria } = vi.hoisted(() => ({
  listarPedidosAdmin: vi.fn(),
  listarClientes: vi.fn(),
  buscarVendasPorCategoria: vi.fn(),
}))

vi.mock('@/shared/layouts/admin/AdminSidebar', () => ({ default: () => <nav>Menu admin</nav> }))
vi.mock('@/features/auth/context/AuthContext', () => ({ useAuth: () => ({ usuario: { uuid: '44f0cf51-2cbe-4f66-9a9d-cd6f7a822c11' } }) }))
vi.mock('@/features/pedidos/api/pedidoService', () => ({ pedidoService: { listarPedidosAdmin } }))
vi.mock('@/features/cliente/api/clienteService', () => ({ clienteService: { listarClientes } }))
vi.mock('@/features/analise/api/analiseService', () => ({ analiseService: { buscarVendasPorCategoria } }))
vi.mock('recharts', () => ({
  LineChart: ({ data }) => <output data-testid="sales-chart">{JSON.stringify(data)}</output>,
  PieChart: ({ children }) => <div>{children}</div>,
  Pie: ({ data }) => <output data-testid="pie-chart">{JSON.stringify(data)}</output>,
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Cell: () => null,
  Legend: () => null,
}))

import Dashboard from './Dashboard'

function renderDashboard() {
  return render(<MemoryRouter><Dashboard /></MemoryRouter>)
}

describe('Dashboard administrativo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const pedidos = [
      { id: 31, status: 'PAGAMENTO_APROVADO', total: 125.5, criadoEm: new Date().toISOString(), cliente: { nome: 'Cliente real' } },
      { id: 30, status: 'CANCELADO', total: 500, criadoEm: new Date(Date.now() - 86400000).toISOString(), clienteNome: 'Outro cliente' },
      { id: 29, status: 'EM_CHECKOUT', total: 800, criadoEm: new Date(Date.now() - 172800000).toISOString() },
      { id: 27, status: 'ENTREGUE', total: 63.75, criadoEm: new Date(Date.now() - 345600000).toISOString(), clienteNome: 'Cliente entregue' },
      { id: 28, status: 'FINALIZADO', total: 32.5, criadoEm: new Date(Date.now() - 259200000).toISOString(), clienteNome: 'Cliente finalizado' },
    ]
    const totalPedidosConcluidos = pedidos
      .filter(({ status }) => ['ENTREGUE', 'FINALIZADO'].includes(status))
      .reduce((total, pedido) => total + pedido.total, 0)
    listarPedidosAdmin.mockResolvedValue(pedidos)
    listarClientes.mockResolvedValue([{ id: 1 }, { id: 2 }])
    buscarVendasPorCategoria.mockResolvedValue({ meses: ['2026-09'], series: [{ categoriaId: null, categoriaNome: 'Total geral', valores: [totalPedidosConcluidos] }] })
  })

  it('contabiliza no total geral pedidos ENTREGUE e FINALIZADO e apresenta ambos por status', async () => {
    renderDashboard()

    expect(await screen.findByText('Ticket Médio')).toBeInTheDocument()
    expect(await screen.findByText(/Cliente real/)).toBeInTheDocument()
    expect(screen.getByText('Clientes')).toBeInTheDocument()
    expect(screen.getByText('Pedidos').parentElement).toHaveTextContent('4')
    expect(screen.getByTestId('sales-chart')).toHaveTextContent('"total":96.25')
    expect(screen.getByText((texto) => texto.replace(/\u00a0/g, ' ') === 'R$ 96,25')).toBeInTheDocument()
    expect(screen.getByText('Pedidos por status')).toBeInTheDocument()
    const dadosPorStatus = screen.getByTestId('pie-chart').textContent
    expect(dadosPorStatus).toContain('"name":"Entregue","status":"ENTREGUE","value":1')
    expect(dadosPorStatus).toContain('"name":"Finalizado","status":"FINALIZADO","value":1')

    await waitFor(() => expect(buscarVendasPorCategoria).toHaveBeenCalledWith(expect.objectContaining({ adminId: '44f0cf51-2cbe-4f66-9a9d-cd6f7a822c11' })))
    expect(buscarVendasPorCategoria.mock.calls[0][0]).not.toHaveProperty('categorias')
    expect(listarPedidosAdmin).toHaveBeenCalledTimes(1)
    expect(listarClientes).toHaveBeenCalledTimes(1)
  }, 15000)

  it('não mostra valores demonstrativos quando o backend falha', async () => {
    listarPedidosAdmin.mockRejectedValue(new Error('Pedidos indisponíveis'))
    listarClientes.mockRejectedValue(new Error('Clientes indisponíveis'))
    buscarVendasPorCategoria.mockRejectedValue(new Error('Relatório indisponível'))

    renderDashboard()

    expect(await screen.findByRole('alert')).toHaveTextContent('Alguns dados não puderam ser carregados')
    expect(screen.getAllByText('—')).toHaveLength(3)
    expect(screen.queryByText('R$ 48.920')).not.toBeInTheDocument()
    expect(screen.getAllByText('Pedidos indisponíveis')).toHaveLength(2)
  }, 15000)
})