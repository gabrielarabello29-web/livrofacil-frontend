import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import React from 'react'
import Modal from './Modal'

describe('Modal', () => {
  it('renderiza conteúdo e fecha pelo botão', () => {
    const onClose = vi.fn()
    render(<Modal isOpen title="Confirmação" onClose={onClose}>Conteúdo</Modal>)
    expect(screen.getByRole('heading', { name: 'Confirmação' })).toBeInTheDocument()
    expect(screen.getByText('Conteúdo')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('não renderiza quando está fechado', () => {
    render(<Modal isOpen={false} title="Oculto" onClose={vi.fn()}>Conteúdo</Modal>)
    expect(screen.queryByText('Oculto')).not.toBeInTheDocument()
  })
})
