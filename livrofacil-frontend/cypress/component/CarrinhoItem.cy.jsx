import React from 'react'
import CarrinhoItem from '../../src/features/carrinho/components/CarrinhoItem'
import { CartProviders } from './providers'

function prepareCart() {
  cy.intercept('POST', '**/api/carrinhos', { body: { id: 1, token: 'cypress-token' } })
  cy.intercept('GET', '**/api/carrinhos/1*', { body: { id: 1, itens: [{ id: 7, titulo: 'Livro', quantidade: 2, quantidadeDisponivel: 4, valorUnitario: 10, subtotal: 20 }], total: 20 } })
}

describe('CarrinhoItem', () => {
  it('exibe o item e seus controles de quantidade', () => {
    prepareCart()
    cy.mount(<CartProviders><CarrinhoItem item={{ id: 7, titulo: 'Livro', quantidade: 2, quantidadeDisponivel: 4, valorUnitario: 10, subtotal: 20 }} /></CartProviders>)
    cy.contains('Livro').should('be.visible')
    cy.contains('R$ 20,00').should('be.visible')
    cy.findByRole('button', { name: '+' }).should('be.enabled')
    cy.findByRole('button', { name: 'Remover' }).should('be.visible')
  })
})
