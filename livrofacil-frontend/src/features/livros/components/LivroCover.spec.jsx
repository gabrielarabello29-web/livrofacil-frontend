import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import React from 'react'
import LivroCover from './LivroCover'

describe('LivroCover', () => {
  it('exibe fallback para URL inválida', () => {
    render(<LivroCover src="arquivo-local.jpg" alt="Capa do livro" />)
    expect(screen.getByRole('img', { name: 'Capa do livro indisponível' })).toBeInTheDocument()
  })

  it('remove o estado de carregamento quando a imagem carrega', () => {
    render(<LivroCover src="https://example.com/capa.jpg" alt="Capa do livro" />)
    expect(screen.getByLabelText('Carregando capa')).toBeInTheDocument()
    fireEvent.load(screen.getByAltText('Capa do livro'))
    expect(screen.queryByLabelText('Carregando capa')).not.toBeInTheDocument()
  })
})
