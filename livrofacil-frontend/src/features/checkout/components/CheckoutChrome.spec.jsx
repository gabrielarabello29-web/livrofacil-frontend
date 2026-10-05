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

  it('exibe o resumo do carrinho e do pedido com o frete retornado pelo backend', () => {
    render(<MemoryRouter><CheckoutSummary pedido={{ subtotal: 35, frete: 5, valorTotal: 40 }} /></MemoryRouter>)
    expect(screen.getByText('R$ 35,00')).toBeInTheDocument()
    expect(screen.getByText('Frete')).toBeInTheDocument()
    expect(screen.getByText('R$ 5,00')).toBeInTheDocument()
    expect(screen.getByText('R$ 40,00')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar ao carrinho' })).toHaveAttribute('href', '/carrinho')
  })

  it('não calcula frete localmente quando o backend ainda não respondeu', () => {
    render(<MemoryRouter><CheckoutSummary /></MemoryRouter>)
    expect(screen.getAllByText('A calcular')).toHaveLength(2)
    expect(screen.getByText('R$ 35,00')).toBeInTheDocument()
  })

  it('usa o frete enviado pelo backend como fonte de verdade', () => {
    render(
      <MemoryRouter>
        <CheckoutSummary pedido={{ subtotal: 35, frete: 19.9, total: 54.9 }} />
      </MemoryRouter>,
    )
    expect(screen.getByText('R$ 19,90')).toBeInTheDocument()
    expect(screen.getByText('R$ 54,90')).toBeInTheDocument()
  })

  it('prioriza os valores reais do pedido do backend em vez de assumir valores do carrinho', () => {
    render(
      <MemoryRouter>
        <CheckoutSummary pedido={{
          subtotal: 89.9,
          frete: 0,
          total: 89.9,
          itens: [{ id: 10, titulo: 'Livro X', quantidade: 1, subtotal: 89.9 }],
        }} />
      </MemoryRouter>,
    )

    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getAllByText('R$ 89,90')).toHaveLength(2)
    expect(screen.getAllByText('R$ 0,00')).toHaveLength(1)
  })

  it('exibe o frete em valor monetário mesmo quando o backend devolver 0', () => {
    render(
      <MemoryRouter>
        <CheckoutSummary pedido={{ subtotal: 35, frete: 0, total: 35 }} />
      </MemoryRouter>,
    )
    expect(screen.getAllByText('R$ 0,00')).toHaveLength(2)
    expect(screen.queryByText('Grátis')).not.toBeInTheDocument()
  })

  it('exibe total zero retornado pelo backend sem reconstruí-lo a partir do subtotal', () => {
    render(
      <MemoryRouter>
        <CheckoutSummary pedido={{ subtotal: 35, frete: 0, desconto: 35, total: 0 }} />
      </MemoryRouter>,
    )

    expect(screen.getByText('R$ 0,00')).toBeInTheDocument()
    expect(screen.queryByText('R$ 35,00')).toBeInTheDocument()
  })
})
