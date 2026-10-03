describe('Aplicacao', () => {
  it('abre a pagina inicial', () => {
    cy.visit('/')
    cy.get('#root').should('be.visible')
    cy.get('body').should('not.be.empty')
  })
})
