const clienteId = '11111111-1111-4111-8111-111111111111'
const endereco = {
  id: 2,
  tipoEndereco: 'Casa',
  logradouro: 'Rua A',
  numero: '123',
  bairro: 'Centro',
  cidade: 'São Paulo',
  estado: 'SP',
  cep: '01000-000',
}

describe('Checkout — iniciar pedido com cupom promocional validado', () => {
  it('valida o código antes de incluir o cupom no pedido iniciado e exibe os valores do backend', () => {
    cy.intercept('GET', `**/api/clientes/${clienteId}/enderecos`, {
      statusCode: 200,
      body: [endereco],
    }).as('listarEnderecos')
    cy.intercept('GET', '**/api/carrinhos/7*', {
      statusCode: 200,
      body: {
        id: 7,
        itens: [{ id: 1, livroId: 10, titulo: 'Livro', quantidade: 1, valorUnitario: 100, subtotal: 100 }],
        total: 100,
      },
    }).as('buscarCarrinho')
    cy.intercept('POST', '**/api/cupons/validar', (req) => {
      expect(req.body).to.deep.equal({ codigo: 'PROMO10' })
      req.reply({
        statusCode: 200,
        body: { valido: true, tipo: 'PERCENTUAL', valor: 10, codigo: 'PROMO10', mensagem: 'Cupom valido' },
      })
    }).as('validarCupom')
    cy.intercept('POST', '**/api/pedidos/iniciar', (req) => {
      expect(req.body).to.deep.equal({
        clienteId,
        carrinhoId: 7,
        enderecoEntregaId: 2,
        enderecoCobranca: 'Rua A, 123 - Centro, São Paulo/SP - CEP 01000-000',
        cupom: 'PROMO10',
      })
      req.reply({
        statusCode: 201,
        body: {
          id: 70,
          clienteId,
          carrinhoId: 7,
          status: 'PENDENTE',
          itens: [{ id: 1, livroId: 10, quantidade: 1, valorUnitario: 100 }],
          subtotal: 100,
          desconto: 10,
          frete: 19.9,
          total: 109.9,
          cupom: 'PROMO10',
        },
      })
    }).as('iniciarPedido')

    cy.visit('/checkout/endereco', {
      onBeforeLoad(win) {
        win.localStorage.setItem('usuario', JSON.stringify({
          uuid: clienteId,
          id: clienteId,
          perfil: 'CLIENTE',
          ativo: true,
          nome: 'Cliente E2E',
        }))
        win.localStorage.setItem('carrinhoId', '7')
      },
    })

    cy.wait(['@listarEnderecos', '@buscarCarrinho'])
    cy.get('[data-testid="codigo-cupom-inicial"]').type('promo10')
    cy.get('[data-testid="validar-cupom-inicial"]').click()
    cy.wait('@validarCupom')
    cy.contains('button', 'Cupom validado').should('be.visible')
    cy.contains('button', 'Continuar').click()
    cy.wait('@iniciarPedido')
    cy.location('pathname').should('eq', '/checkout/pagamento')
  })
})
