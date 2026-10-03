import React from 'react'
import Modal from '../../src/shared/components/Modal'

describe('Modal', () => {
  it('exibe o conteúdo e fecha pelo botão', () => {
    const onClose = cy.stub().as('onClose')
    cy.mount(<Modal isOpen title="Confirmação" onClose={onClose}>Conteúdo</Modal>)
    cy.findByRole('heading', { name: 'Confirmação' }).should('be.visible')
    cy.findByText('Conteúdo').should('be.visible')
    cy.findByRole('button').click()
    cy.get('@onClose').should('have.been.calledOnce')
  })

  it('não renderiza quando está fechado', () => {
    cy.mount(<Modal isOpen={false} title="Oculto" onClose={cy.stub()} />)
    cy.findByText('Oculto').should('not.exist')
  })
})
