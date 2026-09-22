import { describe, it, expect } from 'vitest'
import { tratarResposta } from '../api/livrosApi'
import { validarEstoque } from '../utils/livroFormatters'
import { erroDoCampo, normalizarErrosDeCampo } from '@/shared/api/errorUtils'

describe('contrato de erros da API de livros', () => {
  it('preserva os metadados e erros por campo do backend', async () => {
    const resposta = new Response(JSON.stringify({
      status: 400,
      erro: 'Bad Request',
      mensagem: 'Existem dados invalidos na requisicao',
      erros: { titulo: 'O titulo e obrigatorio', dimensao: { altura: 'A altura deve ser maior que zero' } },
      caminho: '/api/livros',
      timestamp: '2026-09-16T16:30:00',
    }), { status: 400, headers: { 'Content-Type': 'application/json' } })

    await expect(tratarResposta(resposta)).rejects.toMatchObject({
      status: 400,
      erro: 'Bad Request',
      mensagem: 'Existem dados invalidos na requisicao',
      caminho: '/api/livros',
      timestamp: '2026-09-16T16:30:00',
    })
  })

  it('resolve erros aninhados e valida estoque bloqueado', () => {
    const erros = normalizarErrosDeCampo({ dimensao: { altura: 'A altura é obrigatória' } })
    expect(erroDoCampo(erros, 'dimensao.altura')).toBe('A altura é obrigatória')
    expect(validarEstoque({ quantidadeDisponivel: '2', quantidadeBloqueada: '3', quantidadeVendida: '0' }).quantidadeBloqueada).toContain('não pode ser maior')
  })
})
