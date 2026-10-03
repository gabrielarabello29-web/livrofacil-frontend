import React from 'react'
import ComprarButton from '../../src/features/catalogo/components/ComprarButton'
import { CartProviders } from './providers'

function prepareCart() {
  cy.intercept('POST', '**/api/carrinhos', { body: { id: 1, token: 'cypress-token' } })
  cy.intercept('GET', '**/api/carrinhos/1*', { body: { id: 1, itens: [], total: 0 } })
}

describe('ComprarButton', () => {
  it('adiciona o livro ao carrinho', () => {
    prepareCart()
    cy.intercept('POST', '**/api/carrinhos/1/itens*', { body: { id: 1, itens: [], total: 0 } }).as('addItem')
    cy.mount(<CartProviders><ComprarButton livro={{ id: 4, titulo: 'Livro', quantidadeDisponivel: 3 }} /></CartProviders>)
    cy.findByLabelText('Quantidade').click().type('{selectall}2')
    cy.findByRole('button', { name: 'Adicionar ao carrinho' }).click()
    cy.wait('@addItem').its('request.body').should('deep.equal', { livroId: 4, quantidade: 2 })
    cy.findByRole('status').should('contain', 'Livro adicionado ao carrinho.')
  })

  it('desabilita a compra quando não há estoque', () => {
    prepareCart()
    cy.mount(<CartProviders><ComprarButton livro={{ id: 5, quantidadeDisponivel: 0 }} /></CartProviders>)
    cy.findByRole('button', { name: 'Sem estoque' }).should('be.disabled')
  })
})
