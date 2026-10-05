const admin = {
  id: '22222222-2222-4222-8222-222222222222',
  nome: 'Administrador E2E',
  perfil: 'ADMIN',
  ativo: true,
}

describe('Cupons administrativos — contrato do backend', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.visit('/admin/cupons', {
      onBeforeLoad(win) {
        win.localStorage.setItem('usuario', JSON.stringify(admin))
      },
    })
  })

  it('1. cria cupom percentual com o payload do contrato do backend', () => {
    cy.intercept('POST', '**/api/cupons/admin', (req) => {
      expect(req.body).to.deep.equal({
        codigo: 'PROMO10',
        tipoDesconto: 'PERCENTUAL',
        percentualDesconto: 10,
        valorDesconto: null,
      })
      req.reply({
        statusCode: 201,
        body: {
          id: 101,
          codigo: 'PROMO10',
          tipoDesconto: 'PERCENTUAL',
          percentualDesconto: 10,
          valorDesconto: null,
          ativo: true,
        },
      })
    }).as('criarCupom')

    cy.contains('button', '+ Novo cupom').click()
    cy.get('[data-testid="cupom-codigo"]').type('promo10')
    cy.get('[data-testid="cupom-tipo-desconto"]').select('PERCENTUAL')
    cy.get('[data-testid="cupom-percentual"]').type('10')
    cy.get('[data-testid="criar-cupom"]').click()

    cy.wait('@criarCupom')
    cy.contains('PROMO10').should('be.visible')
    cy.contains('10,00%').should('be.visible')
    cy.contains('Ativo').should('be.visible')
  })

  it('2. exibe a mensagem do backend e não inclui o cupom duplicado na lista local', () => {
    cy.intercept('POST', '**/api/cupons/admin', {
      statusCode: 409,
      body: { mensagem: 'Ja existe um cupom com este codigo' },
    }).as('cupomDuplicado')

    cy.contains('button', '+ Novo cupom').click()
    cy.get('[data-testid="cupom-codigo"]').type('PROMO10')
    cy.get('[data-testid="cupom-percentual"]').type('10')
    cy.get('[data-testid="criar-cupom"]').click()

    cy.wait('@cupomDuplicado')
    cy.get('[role="alert"]').should('contain', 'Ja existe um cupom com este codigo')
    cy.get('tbody').should('not.contain', 'PROMO10')
  })

  it('3. cria cupom fixo com o payload do contrato do backend', () => {
    cy.intercept('GET', '**/api/cupons/admin', {
      statusCode: 200,
      body: [],
    }).as('listarCupons')

    cy.intercept('POST', '**/api/cupons/admin', (req) => {
      expect(req.body).to.deep.equal({
        codigo: 'PIX20',
        tipoDesconto: 'FIXO',
        valorDesconto: 20,
        percentualDesconto: null,
        dataFimVigencia: '2026-12-31',
        numeroUsoMaximo: 10,
      })
      req.reply({
        statusCode: 201,
        body: {
          id: 77,
          codigo: 'PIX20',
          tipoDesconto: 'FIXO',
          valorDesconto: 20,
          percentualDesconto: null,
          dataFimVigencia: '2026-12-31',
          numeroUsoMaximo: 10,
          numeroUsoAtual: 0,
          ativo: true,
        },
      })
    }).as('criarCupomFixo')

    cy.contains('button', '+ Novo cupom').click()
    cy.get('[data-testid="cupom-codigo"]').type('pix20')
    cy.get('[data-testid="cupom-tipo-desconto"]').select('FIXO')
    cy.get('[data-testid="cupom-valor-fixo"]').type('20')
    cy.get('[data-testid="cupom-data-fim-vigencia"]').type('2026-12-31')
    cy.get('[data-testid="cupom-numero-uso-maximo"]').type('10')
    cy.get('[data-testid="criar-cupom"]').click()

    cy.wait('@criarCupomFixo')
    cy.contains('PIX20').should('be.visible')
    cy.contains('R$ 20,00').should('be.visible')
  })
})
