import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import React from 'react'
import CarrinhoItem from './CarrinhoItem'

const atualizarQuantidade = vi.fn()
const removerItem = vi.fn()

vi.mock('@/features/carrinho/context/CarrinhoContext', () => ({
  useCarrinho: () => ({ atualizarQuantidade, removerItem }),
  obterEstoqueDisponivel: (item) => item.quantidadeDisponivel,
}))

describe('CarrinhoItem', () => {
  it('altera quantidade e remove o item', () => {
    const item = { id: 7, titulo: 'Livro', quantidade: 2, quantidadeDisponivel: 4, valorUnitario: 10, subtotal: 20 }
    render(<CarrinhoItem item={item} />)
    fireEvent.click(screen.getByRole('button', { name: '+' }))
    fireEvent.click(screen.getByRole('button', { name: 'Remover' }))
    expect(atualizarQuantidade).toHaveBeenCalledWith(7, 3)
    expect(removerItem).toHaveBeenCalledWith(7)
    expect(screen.getByText('R$ 20,00')).toBeInTheDocument()
  })
})
