import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import React from 'react'
import ComprarButton from './ComprarButton'

const adicionarItem = vi.fn().mockResolvedValue(undefined)

vi.mock('@/features/carrinho/context/CarrinhoContext', () => ({
  useCarrinho: () => ({ itens: [], adicionarItem, operando: false }),
}))
vi.mock('../../livros/api/livrosApi', () => ({
  buscarEstoque: vi.fn().mockResolvedValue({ quantidadeDisponivel: 3 }),
}))

describe('ComprarButton', () => {
  it('carrega o estoque e adiciona o livro com a quantidade escolhida', async () => {
    render(<ComprarButton livro={{ id: 4, titulo: 'Livro' }} />)
    const quantidade = await screen.findByLabelText('Quantidade')
    fireEvent.change(quantidade, { target: { value: '2' } })
    fireEvent.click(await screen.findByRole('button', { name: 'Adicionar ao carrinho' }))
    await waitFor(() => expect(adicionarItem).toHaveBeenCalledWith({ id: 4, titulo: 'Livro' }, 2))
    expect(screen.getByRole('status')).toHaveTextContent('Livro adicionado ao carrinho.')
  })

  it('desabilita a compra quando não há estoque', async () => {
    const { buscarEstoque } = await import('../../livros/api/livrosApi')
    buscarEstoque.mockResolvedValueOnce({ quantidadeDisponivel: 0 })
    render(<ComprarButton livro={{ id: 5 }} />)
    expect(await screen.findByRole('button', { name: 'Sem estoque' })).toBeDisabled()
  })
})
