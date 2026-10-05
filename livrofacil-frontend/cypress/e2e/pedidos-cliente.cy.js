const clienteId = '11111111-1111-4111-8111-111111111111'

const pedidos = [
  { id: 10, status: 'CANCELADO', total: 25, itens: [{ titulo: 'Pedido cancelado antes do processamento', quantidade: 1 }] },
  { id: 11, status: 'CANCELADO', statusAnterior: 'EM_PROCESSAMENTO', total: 35, itens: [{ tituloLivro: 'Pedido cancelado durante o processamento', quantidade: 1 }] },
  { id: 12, status: 'EM_PROCESSAMENTO', total: 50, itensPedido: [{ livro: { nome: 'O Livro Visível' }, quantidade: 2 }] },
  { id: 13, status: 'CANCELADO', statusAnterior: 'PENDENTE', total: 15, passouPorProcessamento: false },
  { id: 14, status: 'CANCELADO', statusAnterior: 'EM_CHECKOUT', total: 18, historicoStatus: [{ status: 'CANCELADO', statusAnterior: 'AGUARDANDO_PAGAMENTO' }] },
  { id: 15, status: 'CANCELADO', statusAnterior: 'PENDENTE', total: 20, passouPorProcessamento: 'false' },
  { id: 16, status: 'CANCELADO', total: 22, historicoStatus: [{ status: 'PENDENTE' }, { status: 'EM_PROCESSAMENTO' }, { status: 'CANCELADO' }] },
]

describe('Pedidos do cliente', () => {
  beforeEach(() => {
    cy.intercept('GET', `**/api/pedidos/cliente/${clienteId}`, { statusCode: 200, body: pedidos }).as('listarPedidos')
    cy.intercept('GET', '**/api/carrinhos/*', { statusCode: 200, body: { id: 1, itens: [], total: 0 } })
    cy.visit('/meus-pedidos', {
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
    cy.wait('@listarPedidos')
  })

  it('esconde cancelados anteriores ao processamento e mantém os cancelados depois dele', () => {
    cy.contains('Pedido #10').should('not.exist')
    cy.contains('Pedido #11').should('be.visible')
    cy.contains('Pedido #12').should('be.visible')
    cy.contains('Pedido #13').should('not.exist')
    cy.contains('Pedido #14').should('not.exist')
    cy.contains('Pedido #15').should('not.exist')
    cy.contains('Pedido #16').should('be.visible')
  })

  it('mostra os títulos dos livros retornados em diferentes formatos do DTO', () => {
    cy.contains('O Livro Visível').should('be.visible')
    cy.contains('Pedido cancelado durante o processamento').should('be.visible')
  })
})
