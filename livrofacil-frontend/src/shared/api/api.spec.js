import { afterEach, expect, it, vi } from 'vitest'
import { api } from './api'

afterEach(() => {
  vi.unstubAllGlobals()
})

it('serializes query parameters on POST requests', async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    status: 200,
    ok: true,
    json: async () => ({ id: 42 }),
  })
  vi.stubGlobal('fetch', fetchMock)

  await api.post(
    '/pedidos/42/cupons',
    { codigo: 'TR-ABCDEF0123456789' },
    { clienteId: 'cliente-uuid' },
  )

  expect(fetchMock).toHaveBeenCalledWith(
    '/api/pedidos/42/cupons?clienteId=cliente-uuid',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo: 'TR-ABCDEF0123456789' }),
    },
  )
})