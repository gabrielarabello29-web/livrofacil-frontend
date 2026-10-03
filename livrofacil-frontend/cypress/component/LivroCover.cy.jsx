import React from 'react'
import LivroCover from '../../src/features/livros/components/LivroCover'

describe('LivroCover', () => {
  it('exibe fallback para uma URL inválida', () => {
    cy.mount(<LivroCover src="arquivo-local.jpg" alt="Capa do livro" />)
    cy.findByRole('img', { name: 'Capa do livro indisponível' }).should('be.visible')
  })

  it('remove o carregamento quando a imagem carrega', () => {
    cy.intercept('GET', 'https://example.com/capa.jpg', {
      statusCode: 200,
      headers: { 'content-type': 'image/svg+xml' },
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1" />',
    })
    cy.mount(<LivroCover src="https://example.com/capa.jpg" alt="Capa do livro" />)
    cy.findByAltText('Capa do livro').should('be.visible').and('have.css', 'opacity', '1')
    cy.findByLabelText('Carregando capa').should('not.exist')
  })
})
