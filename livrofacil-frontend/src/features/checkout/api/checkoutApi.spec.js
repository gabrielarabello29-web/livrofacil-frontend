import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { finalizarCompra } from './checkoutApi'

beforeEach(() => {
  localStorage.setItem('carrinhoId', '7')
})

afterEach(() => {
  localStorage.clear()
  vi.unstubAllGlobals()
})

it('allows finalization without card payments only when the order total is zero', async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    status: 200,
    ok: true,
    json: async () => ({ status: 'EM_PROCESSAMENTO' }),
  })
  vi.stubGlobal('fetch', fetchMock)

  await expect(
    finalizarCompra(42, 'cliente-uuid', { pagamentos: [], total: 0 }),
  ).resolves.toEqual({ status: 'EM_PROCESSAMENTO' })

  expect(fetchMock).toHaveBeenCalledWith(
    'http://localhost:8080/api/pedidos/42/finalizar?clienteId=cliente-uuid',
    expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ carrinhoId: 7, pagamentos: [] }),
    }),
  )
  await expect(
    finalizarCompra(42, 'cliente-uuid', { pagamentos: [], total: 1 }),
  ).rejects.toMatchObject({ mensagem: 'Selecione uma forma de pagamento.' })
})