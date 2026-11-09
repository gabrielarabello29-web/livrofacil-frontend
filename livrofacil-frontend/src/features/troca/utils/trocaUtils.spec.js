import { describe, expect, it } from 'vitest'

import { mapearStatusTroca, rotuloStatusTroca } from './trocaUtils'

describe('trocaUtils', () => {
  it('mapeia estados legados para os nomes canônicos', () => {
    expect(mapearStatusTroca('SOLICITADA')).toBe('EM_TROCA')
    expect(mapearStatusTroca('AGUARDANDO_RECEBIMENTO')).toBe('TROCA_AUTORIZADA')
    expect(mapearStatusTroca('AUTORIZADA')).toBe('TROCA_AUTORIZADA')
    expect(mapearStatusTroca('CONCLUIDA')).toBe('TROCADO')
    expect(mapearStatusTroca('TROCADA')).toBe('TROCADO')
  })

  it('rotula status canônicos e compatíveis corretamente', () => {
    expect(rotuloStatusTroca('SOLICITADA')).toBe('Em troca')
    expect(rotuloStatusTroca('RECEBIDA')).toBe('Recebida')
    expect(rotuloStatusTroca('TROCADA')).toBe('Trocado')
  })
})
