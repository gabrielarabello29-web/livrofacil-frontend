import React from 'react'
import LivroEstoque from '../../src/features/livros/components/LivroEstoque'

describe('LivroEstoque', () => {
  it('carrega e exibe o estoque', () => {
    cy.intercept('GET', '**/api/livros/10/estoque', { body: { quantidadeDisponivel: 4, quantidadeBloqueada: 1, quantidadeVendida: 2 } }).as('getStock')
    cy.mount(<LivroEstoque livroId={10} />)
    cy.wait('@getStock')
    cy.contains('Disponível: 4').should('be.visible')
    cy.contains('Bloqueada: 1').should('be.visible')
  })

  it('não salva quantidade negativa', () => {
    cy.intercept('GET', '**/api/livros/10/estoque', { body: { quantidadeDisponivel: 4, quantidadeBloqueada: 1, quantidadeVendida: 2 } })
    cy.intercept('PUT', '**/api/livros/10/estoque').as('updateStock')
    cy.mount(<LivroEstoque livroId={10} editavel />)
    cy.findByLabelText('Disponível').clear().type('-1')
    cy.findByRole('button', { name: 'Salvar estoque' }).click()
    cy.get('@updateStock.all').should('have.length', 0)
  })
})
