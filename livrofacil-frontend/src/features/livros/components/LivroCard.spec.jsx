import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import React from 'react'
import LivroCard from './LivroCard'

vi.mock('@/features/carrinho/context/CarrinhoContext', () => ({
  useCarrinho: () => ({ itens: [], adicionarItem: vi.fn(), operando: false }),
}))
vi.mock('@/features/favoritos/components/FavoriteButton', () => ({ default: () => <button aria-label="Favoritar livro">Favorito</button> }))

describe('LivroCard', () => {
  it('renderiza informações principais do livro', () => {
    render(<MemoryRouter><LivroCard livro={{ id: 1, titulo: 'Livro real', autorNome: 'Autora', valorVenda: 29.9, ativo: true }} /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'Livro real' })).toBeInTheDocument()
    expect(screen.getByText('Autora')).toBeInTheDocument()
    expect(screen.getByText('R$ 29,90')).toBeInTheDocument()
  })
})
