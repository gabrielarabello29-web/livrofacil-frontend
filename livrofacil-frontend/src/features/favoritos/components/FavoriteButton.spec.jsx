import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import React from 'react'
import FavoriteButton from './FavoriteButton'

const toggleFavorito = vi.fn()
let favorito = false

vi.mock('../context/FavoritosContext', () => ({
  useFavoritos: () => ({ isFavorito: () => favorito, toggleFavorito }),
}))

describe('FavoriteButton', () => {
  it('adiciona um livro aos favoritos', () => {
    favorito = false
    render(<FavoriteButton livro={{ id: 1, titulo: 'Livro' }} />)
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar aos favoritos' }))
    expect(toggleFavorito).toHaveBeenCalledWith({ id: 1, titulo: 'Livro' })
  })

  it('exibe a ação de remoção quando o livro já é favorito', () => {
    favorito = true
    render(<FavoriteButton livro={{ id: 1 }} />)
    expect(screen.getByRole('button', { name: 'Remover dos favoritos' })).toBeInTheDocument()
  })
})
