import React from 'react'
import { CheckoutStepper, CheckoutSummary } from '../../src/features/checkout/components/CheckoutChrome'
import { CartProviders, Router } from './providers'

function prepareCart() {
  cy.intercept('POST', '**/api/carrinhos', { body: { id: 1, token: 'cypress-token' } })
  cy.intercept('GET', '**/api/carrinhos/1*', { body: { id: 1, itens: [{ id: 7, quantidade: 1 }], total: 35 } })
}

describe('CheckoutChrome', () => {
  it('marca as etapas concluídas', () => {
    cy.mount(<CheckoutStepper etapa={1} />)
    cy.findByText('1. Endereço').should('have.class', 'active')
    cy.findByText('2. Pagamento').should('have.class', 'active')
    cy.findByText('3. Revisão').should('not.have.class', 'active')
  })

  it('exibe o resumo do carrinho e do pedido', () => {
    prepareCart()
    cy.mount(<Router><CartProviders><CheckoutSummary pedido={{ valorTotal: 40 }} /></CartProviders></Router>)
    cy.contains('R$ 35,00').should('be.visible')
    cy.contains('R$ 40,00').should('be.visible')
    cy.findByRole('link', { name: 'Voltar ao carrinho' }).should('have.attr', 'href', '/carrinho')
  })
})
