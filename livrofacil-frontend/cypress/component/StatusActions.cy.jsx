import React from 'react'
import StatusActions from '../../src/features/pedidos/components/StatusActions'

describe('StatusActions', () => {
  it('atualiza o status após confirmação', () => {
    cy.intercept('PATCH', '**/api/vendas/42/status', { statusCode: 200, body: {} }).as('updateStatus')
    const onAtualizado = cy.stub().as('onAtualizado')
    cy.on('window:confirm', () => true)
    cy.mount(<StatusActions statusAtual="Em aberto" vendaId="#42" onAtualizado={onAtualizado} />)
    cy.findByRole('button', { name: 'Em processamento' }).click()
    cy.wait('@updateStatus').its('request.body').should('deep.equal', { status: 'Em processamento' })
    cy.get('@onAtualizado').should('have.been.calledWith', 'Em processamento')
  })

  it('não renderiza ações para status sem transição', () => {
    cy.mount(<StatusActions statusAtual="Entregue" vendaId="42" />)
    cy.get('button').should('not.exist')
  })
})
