import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { atualizarPedidoCheckoutParaEndereco, calcularIndiceNovoEndereco, finalizarCompra, obterIndiceEnderecoSelecionado, resolverEnderecoCheckoutAtual } from './checkoutApi'

beforeEach(() => {
  localStorage.setItem('carrinhoId', '7')
})

afterEach(() => {
  localStorage.clear()
  vi.unstubAllGlobals()
})

it('returns the newest address as the selected index after a new address is created', () => {
  const atuais = [
    { id: 1, logradouro: 'Rua A', numero: '10' },
    { id: 2, logradouro: 'Rua B', numero: '20' },
  ]

  const novo = { id: 3, logradouro: 'Rua C', numero: '30' }

  expect(calcularIndiceNovoEndereco([...atuais, novo], novo)).toBe(2)
  expect(calcularIndiceNovoEndereco(atuais, novo)).toBe(atuais.length)
})

it('restores the selected address from the persisted checkout address instead of defaulting to the first one', () => {
  const enderecos = [
    { id: 1, principal: false, logradouro: 'Rua A', numero: '10', bairro: 'Centro', cidade: 'São Paulo', estado: 'SP', cep: '01000-000' },
    { id: 2, principal: true, logradouro: 'Rua B', numero: '20', bairro: 'Jardim', cidade: 'Campinas', estado: 'SP', cep: '13000-000' },
    { id: 3, principal: false, logradouro: 'Rua C', numero: '30', bairro: 'Bela Vista', cidade: 'Rio', estado: 'RJ', cep: '20000-000' },
  ]

  const enderecoPersistido = { id: 3, logradouro: 'Rua C', numero: '30', bairro: 'Bela Vista', cidade: 'Rio', estado: 'RJ', cep: '20000-000' }

  expect(obterIndiceEnderecoSelecionado(enderecos, enderecoPersistido)).toBe(2)
  expect(obterIndiceEnderecoSelecionado(enderecos, null)).toBe(1)
})

it('prefers the persisted checkout address over the address returned by the backend when the user changed it during checkout', () => {
  localStorage.setItem('pedidoCheckout', '42')
  localStorage.setItem(
    'enderecoCheckout',
    JSON.stringify({
      pedidoId: 42,
      endereco: {
        id: 99,
        logradouro: 'Rua Nova',
        numero: '777',
        bairro: 'Centro',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '01000-000',
      },
    }),
  )

  const pedido = {
    id: 42,
    enderecoEntregaObjeto: {
      id: 1,
      logradouro: 'Rua Antiga',
      numero: '123',
      bairro: 'Matriz',
      cidade: 'Campinas',
      estado: 'SP',
      cep: '13000-000',
    },
  }

  expect(resolverEnderecoCheckoutAtual({ pedidoId: 42, pedido })).toMatchObject({
    logradouro: 'Rua Nova',
    numero: '777',
    bairro: 'Centro',
  })
})

it('recreates the checkout order for the new address so the freight is refreshed after changing the delivery address', async () => {
  localStorage.setItem('pedidoCheckout', '10')

  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ id: 99, status: 'PENDENTE', frete: 19.9, total: 109.8 }),
  })
  vi.stubGlobal('fetch', fetchMock)

  const endereco = {
    id: 2,
    logradouro: 'Av. Paulista',
    numero: '1000',
    bairro: 'Bela Vista',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01310-100',
  }

  const pedido = await atualizarPedidoCheckoutParaEndereco({
    clienteId: 'cliente-uuid',
    carrinhoId: 7,
    endereco,
    pedidoAtualId: 10,
  })

  expect(pedido.id).toBe(99)
  expect(localStorage.getItem('pedidoCheckout')).toBe('99')
  expect(JSON.parse(localStorage.getItem('enderecoCheckout')).pedidoId).toBe(99)
  expect(JSON.parse(localStorage.getItem('enderecoCheckout')).endereco.logradouro).toBe('Av. Paulista')
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