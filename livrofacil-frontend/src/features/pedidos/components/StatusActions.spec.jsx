import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import React from 'react'
import StatusActions from './StatusActions'

const { atualizarStatusVenda } = vi.hoisted(() => ({ atualizarStatusVenda: vi.fn().mockResolvedValue(undefined) }))
vi.mock('@/features/vendas/api/vendaService', () => ({ vendaService: { atualizarStatusVenda } }))

describe('StatusActions', () => {
  it('atualiza o status confirmado pelo usuário', async () => {
    vi.stubGlobal('confirm', vi.fn(() => true))
    const onAtualizado = vi.fn()
    render(<StatusActions statusAtual="Em aberto" vendaId="#42" onAtualizado={onAtualizado} />)
    fireEvent.click(screen.getByRole('button', { name: 'Em processamento' }))
    await waitFor(() => expect(atualizarStatusVenda).toHaveBeenCalledWith('42', 'Em processamento'))
    expect(onAtualizado).toHaveBeenCalledWith('Em processamento')
    vi.unstubAllGlobals()
  })

  it('não renderiza ações para status sem transição', () => {
    render(<StatusActions statusAtual="Entregue" vendaId="42" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
