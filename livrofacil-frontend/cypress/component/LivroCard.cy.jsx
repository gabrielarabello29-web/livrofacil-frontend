import React from 'react'
import LivroCard from '../../src/features/livros/components/LivroCard'
import { CartProviders, FavoriteProviders, Router } from './providers'

function prepareCart() {
  cy.intercept('POST', '**/api/carrinhos', { body: { id: 1, token: 'cypress-token' } })
  cy.intercept('GET', '**/api/carrinhos/1*', { body: { id: 1, itens: [], total: 0 } })
}

describe('LivroCard', () => {
  it('renderiza as informações principais do livro', () => {
    prepareCart()
    cy.mount(<Router><FavoriteProviders><CartProviders><LivroCard livro={{ id: 1, titulo: 'Livro real', autorNome: 'Autora', valorVenda: 29.9, ativo: true }} /></CartProviders></FavoriteProviders></Router>)
    cy.findByRole('heading', { name: 'Livro real' }).should('be.visible')
    cy.contains('Autora').should('be.visible')
    cy.contains('R$ 29,90').should('be.visible')
  })
})
