import React from 'react'
import PaymentSplit from '../../src/features/checkout/components/PaymentSplit'

describe('PaymentSplit', () => {
  it('adiciona uma forma de pagamento', () => {
    const setSplits = cy.stub().as('setSplits')
    cy.mount(<PaymentSplit splits={[]} setSplits={setSplits} cartoes={[]} />)
    cy.findByRole('button', { name: '+ Adicionar forma de pagamento' }).click()
    cy.get('@setSplits').should('have.been.calledOnce')
  })

  it('permite informar o código e o valor do cupom', () => {
    const setSplits = cy.stub().as('setSplits')
    cy.mount(<PaymentSplit splits={[{ id: 1, tipo: 'cupom', valor: 0 }]} setSplits={setSplits} cartoes={[]} />)
    cy.findByPlaceholderText('Código do cupom').type('PROMO25')
    cy.findByRole('spinbutton').clear().type('25')
    cy.get('@setSplits').should('have.been.called')
  })
})
