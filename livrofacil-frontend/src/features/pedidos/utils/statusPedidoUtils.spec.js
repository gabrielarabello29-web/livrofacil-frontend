import { describe, expect, it } from 'vitest'

import { mapearStatusPedido, rotuloStatusPedido, statusPedidoCancelavelPorAdmin, statusPedidoCancelavelPorCliente } from './statusPedidoUtils'

describe('statusPedidoUtils', () => {
  it('mapa status legados para o contrato canônico', () => {
    expect(mapearStatusPedido('PAGAMENTO_APROVADO')).toBe('APROVADA')
    expect(mapearStatusPedido('EM_SEPARACAO')).toBe('EM_PROCESSAMENTO')
    expect(mapearStatusPedido('NA_TRANSPORTADORA')).toBe('EM_TRANSPORTE')
    expect(mapearStatusPedido('EM_ROTA_DE_ENTREGA')).toBe('EM_TRANSPORTE')
  })

  it('rotula corretamente os nomes canônicos e compatíveis', () => {
    expect(rotuloStatusPedido('PAGAMENTO_APROVADO')).toBe('Pagamento aprovado')
    expect(rotuloStatusPedido('EM_ROTA_DE_ENTREGA')).toBe('Em transporte')
    expect(rotuloStatusPedido('REPROVADA')).toBe('Pagamento reprovado')
  })

  it('apenas permite cancelamento nos estágios atuais', () => {
    expect(statusPedidoCancelavelPorCliente('PENDENTE')).toBe(true)
    expect(statusPedidoCancelavelPorCliente('APROVADA')).toBe(false)
    expect(statusPedidoCancelavelPorAdmin('EM_SEPARACAO')).toBe(true)
    expect(statusPedidoCancelavelPorAdmin('ENTREGUE')).toBe(false)
  })
})
