import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

const { buscarVendasPorCategoria, listarCategorias } = vi.hoisted(() => ({
  buscarVendasPorCategoria: vi.fn(),
  listarCategorias: vi.fn(),
}))

vi.mock('@/features/auth/context/AuthContext', () => ({ useAuth: () => ({ usuario: { uuid: '44f0cf51-2cbe-4f66-9a9d-cd6f7a822c11' } }) }))
vi.mock('@/shared/layouts/admin/AdminSidebar', () => ({ default: () => <nav>Menu admin</nav> }))
vi.mock('@/features/livros/api/livrosApi', () => ({ listarCategorias }))
vi.mock('../api/analiseService', () => ({ analiseService: { buscarVendasPorCategoria } }))
vi.mock('recharts', () => ({
  LineChart: ({ data }) => <output data-testid="sales-report-chart">{JSON.stringify(data)}</output>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  Legend: () => null,
}))

import AdminAnalise from './AnaliseVendas'

describe('Relatório administrativo de vendas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listarCategorias.mockResolvedValue([{ id: 1, nome: 'Romance' }, { id: 2, nome: 'Fantasia' }])
    buscarVendasPorCategoria.mockResolvedValue({
      dataInicio: '2026-01-01',
      dataFim: '2026-03-31',
      meses: ['2026-01', '2026-02', '2026-03'],
      series: [{ categoriaId: null, categoriaNome: 'Total geral', valores: [250, 0, 420] }],
    })
  })

  it('carrega o Total geral sem categorias e mantém meses com valor zero', async () => {
    render(<AdminAnalise />)

    await waitFor(() => expect(buscarVendasPorCategoria).toHaveBeenCalledTimes(1))
    expect(buscarVendasPorCategoria.mock.calls[0][0]).toEqual(expect.objectContaining({
      adminId: '44f0cf51-2cbe-4f66-9a9d-cd6f7a822c11',
      dataInicio: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      dataFim: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    }))
    expect(buscarVendasPorCategoria.mock.calls[0][0]).not.toHaveProperty('categorias')
    expect(await screen.findByRole('img', { name: /Total geral/ })).toBeInTheDocument()
    expect(screen.getByTestId('sales-report-chart')).toHaveTextContent('"Total geral":0')
    expect(await screen.findByRole('img', { name: /fev de 2026: R\$\s0,00/ })).toBeInTheDocument()
  }, 15000)

  it('aplica datas e categorias somente após confirmar os filtros', async () => {
    render(<AdminAnalise />)
    await waitFor(() => expect(buscarVendasPorCategoria).toHaveBeenCalledTimes(1))

    fireEvent.change(screen.getByLabelText('Data inicial'), { target: { value: '2026-01-01' } })
    fireEvent.change(screen.getByLabelText('Data final'), { target: { value: '2026-03-31' } })
    fireEvent.click(screen.getByRole('button', { name: 'Romance' }))

    expect(buscarVendasPorCategoria).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }))

    await waitFor(() => expect(buscarVendasPorCategoria).toHaveBeenCalledTimes(2))
    expect(buscarVendasPorCategoria.mock.calls[1][0]).toEqual({
      dataInicio: '2026-01-01',
      dataFim: '2026-03-31',
      adminId: '44f0cf51-2cbe-4f66-9a9d-cd6f7a822c11',
      categorias: [1],
    })
  }, 15000)

  it('envia todos os IDs selecionados e associa cada série aos meses retornados', async () => {
    render(<AdminAnalise />)
    await waitFor(() => expect(buscarVendasPorCategoria).toHaveBeenCalledTimes(1))
    buscarVendasPorCategoria.mockResolvedValueOnce({
      dataInicio: '2026-01-01',
      dataFim: '2026-03-31',
      meses: ['2026-01', '2026-02', '2026-03'],
      series: [
        { categoriaId: 1, categoriaNome: 'Romance', valores: [250, 0, 420] },
        { categoriaId: 2, categoriaNome: 'Fantasia', valores: [0, 80, 120] },
      ],
    })

    fireEvent.change(screen.getByLabelText('Data inicial'), { target: { value: '2026-01-01' } })
    fireEvent.change(screen.getByLabelText('Data final'), { target: { value: '2026-03-31' } })
    fireEvent.click(screen.getByRole('button', { name: 'Romance' }))
    fireEvent.click(screen.getByRole('button', { name: 'Fantasia' }))
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }))

    await waitFor(() => expect(buscarVendasPorCategoria).toHaveBeenCalledTimes(2))
    expect(buscarVendasPorCategoria.mock.calls[1][0]).toEqual({
      dataInicio: '2026-01-01',
      dataFim: '2026-03-31',
      adminId: '44f0cf51-2cbe-4f66-9a9d-cd6f7a822c11',
      categorias: [1, 2],
    })
    expect(await screen.findByTestId('sales-report-chart')).toHaveTextContent('"Romance":250')
    expect(screen.getByTestId('sales-report-chart')).toHaveTextContent('"Fantasia":80')
    expect(screen.getByTestId('sales-report-chart')).toHaveTextContent('"mes":"2026-02"')
  }, 15000)
})