import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import React from 'react'
import LivroEstoque from './LivroEstoque'

const { buscarEstoque, atualizarEstoque } = vi.hoisted(() => ({
  buscarEstoque: vi.fn().mockResolvedValue({ quantidadeDisponivel: 4, quantidadeBloqueada: 1, quantidadeVendida: 2 }),
  atualizarEstoque: vi.fn().mockResolvedValue({ quantidadeDisponivel: 5, quantidadeBloqueada: 1, quantidadeVendida: 2 }),
}))
vi.mock('../api/livrosApi', () => ({ buscarEstoque, atualizarEstoque }))

describe('LivroEstoque', () => {
  it('carrega e exibe o estoque', async () => {
    render(<LivroEstoque livroId={10} />)
    expect(await screen.findByText('Disponível: 4')).toBeInTheDocument()
    expect(buscarEstoque).toHaveBeenCalledWith(10)
  })

  it('valida o formulário antes de salvar', async () => {
    render(<LivroEstoque livroId={10} editavel />)
    await screen.findByRole('button', { name: 'Salvar estoque' })
    fireEvent.change(screen.getByLabelText('Disponível'), { target: { value: '-1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar estoque' }))
    await waitFor(() => expect(atualizarEstoque).not.toHaveBeenCalled())
  })
})
