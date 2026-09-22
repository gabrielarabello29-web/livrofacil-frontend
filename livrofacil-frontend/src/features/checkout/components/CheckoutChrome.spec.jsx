import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import React from 'react'
import { CheckoutStepper, CheckoutSummary } from './CheckoutChrome'

vi.mock('@/features/carrinho/context/CarrinhoContext', () => ({
  useCarrinho: () => ({ itens: [{ id: 1 }], subtotal: 35 }),
}))

describe('CheckoutChrome', () => {
  it('marca as etapas concluídas', () => {
    render(<CheckoutStepper etapa={1} />)
    expect(screen.getByText('1. Endereço')).toHaveClass('active')
    expect(screen.getByText('2. Pagamento')).toHaveClass('active')
    expect(screen.getByText('3. Revisão')).not.toHaveClass('active')
  })

  it('exibe o resumo do carrinho e do pedido', () => {
    render(<MemoryRouter><CheckoutSummary pedido={{ valorTotal: 40 }} /></MemoryRouter>)
    expect(screen.getByText('R$ 35,00')).toBeInTheDocument()
    expect(screen.getByText('R$ 40,00')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar ao carrinho' })).toHaveAttribute('href', '/carrinho')
  })
})
