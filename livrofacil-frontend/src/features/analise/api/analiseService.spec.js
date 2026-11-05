import { afterEach, describe, expect, it, vi } from 'vitest'
import { analiseService } from './analiseService'

describe('analiseService.buscarVendasPorCategoria', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('solicita total geral sem enviar categorias vazias', async () => {
    const resposta = {
      dataInicio: '2026-01-01',
      dataFim: '2026-03-31',
      meses: ['2026-01', '2026-02', '2026-03'],
      series: [{ categoriaId: null, categoriaNome: 'Total geral', valores: [250, 0, 420] }],
    }
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => resposta })
    vi.stubGlobal('fetch', fetchMock)

    const resultado = await analiseService.buscarVendasPorCategoria({
      dataInicio: '2026-01-01',
      dataFim: '2026-03-31',
      adminId: '44f0cf51-2cbe-4f66-9a9d-cd6f7a822c11',
      categorias: [],
    })

    const requisicao = new URL(fetchMock.mock.calls[0][0], 'http://localhost')
    expect(requisicao.pathname).toBe('/api/pedidos/admin/relatorios/vendas-por-categoria')
    expect(requisicao.searchParams.get('dataInicio')).toBe('2026-01-01')
    expect(requisicao.searchParams.get('dataFim')).toBe('2026-03-31')
    expect(requisicao.searchParams.get('adminId')).toBe('44f0cf51-2cbe-4f66-9a9d-cd6f7a822c11')
    expect(requisicao.searchParams.has('categorias')).toBe(false)
    expect(resultado).toEqual(resposta)
  })

  it('repete o parâmetro categorias para cada ID selecionado', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ meses: [], series: [] }) })
    vi.stubGlobal('fetch', fetchMock)

    await analiseService.buscarVendasPorCategoria({
      dataInicio: '2026-01-01',
      dataFim: '2026-03-31',
      adminId: '44f0cf51-2cbe-4f66-9a9d-cd6f7a822c11',
      categorias: [1, 2],
    })

    const requisicao = new URL(fetchMock.mock.calls[0][0], 'http://localhost')
    expect(requisicao.searchParams.getAll('categorias')).toEqual(['1', '2'])
  })
})