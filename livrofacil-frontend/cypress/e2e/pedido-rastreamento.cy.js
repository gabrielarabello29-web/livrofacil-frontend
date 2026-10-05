const clienteId = '11111111-1111-4111-8111-111111111111'
const pedidoId = 320

const pedido = {
  id: pedidoId,
  clienteId,
  status: 'EM_SEPARACAO',
  total: 42.5,
  rastreamento: {
    etapa: 'Preparando para envio',
    ultimaModificacao: '2026-10-03T15:30:00Z',
  },
  itens: [{ id: 8, livroId: 9, titulo: 'Livro rastreável', quantidade: 1, valorUnitario: 42.5 }],
}

describe('Detalhes do pedido — rastreamento do backend', () => {
  beforeEach(() => {
    cy.intercept('GET', `**/api/pedidos/${pedidoId}?clienteId=*`, {
      statusCode: 200,
      body: pedido,
    }).as('buscarPedido')
    cy.intercept('GET', '**/api/livros/9', {
      statusCode: 200,
      body: { id: 9, titulo: 'Livro com título resolvido' },
    }).as('buscarLivro')

    cy.visit(`/meus-pedidos/${pedidoId}`, {
      onBeforeLoad(win) {
        win.localStorage.setItem('usuario', JSON.stringify({
          uuid: clienteId,
          id: clienteId,
          nome: 'Cliente E2E',
          perfil: 'CLIENTE',
          ativo: true,
        }))
      },
    })

    cy.wait('@buscarPedido')
  })

  it('exibe apenas etapa atual e última modificação retornadas pela API', () => {
    cy.wait('@buscarLivro')
    cy.contains('Livro com título resolvido').should('be.visible')
    cy.get('[data-testid="rastreamento-etapa"]')
      .should('contain', 'Preparando para envio')
    cy.get('[data-testid="rastreamento-atualizacao"]')
      .should('contain', 'Última atualização:')
      .and('not.contain', 'Não informada')
    cy.contains('Histórico de eventos').should('not.exist')
    cy.contains('Etapa anterior').should('not.exist')
  })

  it('não inventa etapas quando a API não fornece rastreamento', () => {
    cy.intercept('GET', `**/api/pedidos/${pedidoId}?clienteId=*`, {
      statusCode: 200,
      body: { ...pedido, rastreamento: undefined },
    }).as('buscarPedidoSemRastreamento')
    cy.reload()
    cy.wait('@buscarPedidoSemRastreamento')
    cy.get('[aria-label="Rastreamento do pedido"]').should('not.exist')
  })
})
