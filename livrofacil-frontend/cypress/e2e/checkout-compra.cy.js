const clienteId = '11111111-1111-4111-8111-111111111111'
const carrinhoId = 7

const enderecoSalvo = {
  id: 2,
  tipoEndereco: 'Casa',
  tipoResidencia: 'RESIDENCIAL',
  logradouro: 'Rua A',
  numero: '123',
  bairro: 'Centro',
  cidade: 'Sao Paulo',
  estado: 'SP',
  cep: '01000-000',
  principal: true,
}

const cartaoSalvo = {
  id: 4,
  clienteId,
  nomeTitular: 'Joao da Silva',
  tipoCartao: 'CREDITO',
  ultimosDigitos: '1111',
  validade: '12/28',
  bandeira: 'VISA',
  preferencial: true,
  ativo: true,
}

function configurarCompra({ enderecos = [], cartoes = [] } = {}) {
  let listaEnderecos = [...enderecos]
  let listaCartoes = [...cartoes]
  let pedidoAtual = null

  cy.intercept('GET', `**/api/clientes/${clienteId}/enderecos`, (req) => {
    req.reply({ statusCode: 200, body: listaEnderecos })
  }).as('listarEnderecos')

  cy.intercept('POST', `**/api/clientes/${clienteId}/enderecos`, (req) => {
    const endereco = { ...req.body, id: 9 }
    listaEnderecos = [...listaEnderecos, endereco]
    req.reply({ statusCode: 201, body: endereco })
  }).as('criarEndereco')

  cy.intercept('GET', '**/api/carrinhos/7*', {
    statusCode: 200,
    body: {
      id: carrinhoId,
      itens: [
        {
          id: 1,
          livroId: 10,
          titulo: 'Livro de teste',
          quantidade: 1,
          valorUnitario: 35,
          subtotal: 35,
          quantidadeDisponivel: 10,
        },
      ],
      total: 35,
    },
  }).as('buscarCarrinho')

  cy.intercept('POST', '**/api/pedidos/iniciar', (req) => {
    pedidoAtual = {
      id: 70,
      clienteId,
      carrinhoId,
      status: 'EM_CHECKOUT',
      itens: [{ id: 1, livroId: 10, titulo: 'Livro de teste', quantidade: 1, valorUnitario: 35 }],
      subtotal: 35,
      desconto: 0,
      frete: 0,
      total: 35,
      enderecoEntregaId: Number(req.body.enderecoEntregaId),
    }
    req.reply({ statusCode: 201, body: pedidoAtual })
  }).as('iniciarPedido')

  cy.intercept('GET', '**/api/pedidos/70?clienteId=*', (req) => {
    req.reply({ statusCode: 200, body: pedidoAtual })
  }).as('buscarPedido')

  cy.intercept('GET', `**/api/clientes/${clienteId}/formas-pagamento`, (req) => {
    req.reply({ statusCode: 200, body: listaCartoes })
  }).as('listarCartoes')

  cy.intercept('GET', '**/api/pagamentos/bandeiras', {
    statusCode: 200,
    body: ['VISA', 'MASTERCARD', 'ELO', 'AMEX', 'HIPERCARD'].map((nome) => ({
      id: nome,
      nome,
      disponivel: true,
    })),
  }).as('listarBandeiras')

  cy.intercept('POST', `**/api/clientes/${clienteId}/formas-pagamento`, (req) => {
    const cartao = {
      id: 9,
      clienteId,
      nomeTitular: req.body.nomeTitular,
      tipoCartao: req.body.tipoCartao,
      ultimosDigitos: req.body.numeroCartao.replace(/\D/g, '').slice(-4),
      validade: req.body.validade,
      bandeira: req.body.bandeira,
      preferencial: req.body.preferencial,
      ativo: true,
    }
    listaCartoes = [...listaCartoes, cartao]
    req.reply({ statusCode: 201, body: cartao })
  }).as('criarCartao')

  cy.intercept('POST', '**/api/pedidos/70/finalizar?clienteId=*', (req) => {
    pedidoAtual = {
      ...pedidoAtual,
      status: 'EM_PROCESSAMENTO',
      pagamentos: req.body.pagamentos,
    }
    req.reply({ statusCode: 200, body: pedidoAtual })
  }).as('finalizarPedido')

  cy.visit('/checkout/endereco', {
    onBeforeLoad(win) {
      win.localStorage.setItem(
        'usuario',
        JSON.stringify({
          uuid: clienteId,
          id: clienteId,
          perfil: 'CLIENTE',
          ativo: true,
          nome: 'Cliente E2E',
          enderecos: [],
          cartoes: [],
        }),
      )
      win.localStorage.setItem('carrinhoId', String(carrinhoId))
    },
  })

  cy.wait(['@listarEnderecos', '@buscarCarrinho'])
}

function concluirCompra() {
  cy.contains('button', 'Continuar').click()
  cy.wait('@iniciarPedido')
  cy.location('pathname').should('eq', '/checkout/pagamento')
  cy.wait(['@buscarPedido', '@listarCartoes', '@listarBandeiras'])
  cy.get('[data-testid="revisar-pedido"]').click()
  cy.location('pathname').should('eq', '/checkout/revisao')
  cy.contains('button', '✓ Confirmar e pagar').click()
  cy.wait('@finalizarPedido').its('response.body.status').should('eq', 'EM_PROCESSAMENTO')
  cy.location('pathname').should('eq', '/checkout/sucesso')
}

describe('Checkout — compra com endereços e cartões salvos ou novos', () => {
  it('finaliza uma compra usando endereço e cartão previamente cadastrados', () => {
    configurarCompra({ enderecos: [enderecoSalvo], cartoes: [cartaoSalvo] })
    cy.contains('Casa').should('be.visible')
    concluirCompra()
  })

  it('cadastra endereço e cartão durante a compra e os incorpora ao perfil do cliente', () => {
    configurarCompra()

    cy.contains('button', '+ Cadastrar endereço').click()
    cy.get('.cart-address-form').within(() => {
      cy.get('input').eq(0).type('Casa nova')
      cy.get('input').eq(1).type('01000-001')
      cy.get('input').eq(2).type('Rua Nova')
      cy.get('input').eq(3).type('456')
      cy.get('input').eq(5).type('Centro')
      cy.get('input').eq(6).type('Sao Paulo')
      cy.get('select').select('SP')
      cy.contains('button', 'Salvar endereço').click()
    })
    cy.wait('@criarEndereco').then(({ request, response }) => {
      expect(request.url).to.contain(`/clientes/${clienteId}/enderecos`)
      expect(response.body).to.include({
        id: 9,
        tipoEndereco: 'Casa nova',
        logradouro: 'Rua Nova',
        numero: '456',
      })
    })
    cy.contains('Casa nova').should('be.visible')

    cy.contains('button', 'Continuar').click()
    cy.wait('@iniciarPedido')
    cy.location('pathname').should('eq', '/checkout/pagamento')
    cy.wait(['@buscarPedido', '@listarCartoes', '@listarBandeiras'])

    cy.contains('button', '+ Cadastrar cartão').click()
    cy.get('[data-testid="nome-titular"]').type('Ana Teste')
    cy.get('[data-testid="numero-cartao"]').type('4111111111111111')
    cy.get('[data-testid="validade-cartao"]').type('12/28')
    cy.get('[data-testid="codigo-seguranca"]').type('123')
    cy.contains('button', 'Salvar cartão').click()
    cy.wait('@criarCartao').then(({ request, response }) => {
      expect(request.url).to.contain(`/clientes/${clienteId}/formas-pagamento`)
      expect(request.body.clienteId).to.be.undefined
      expect(response.body).to.include({
        id: 9,
        clienteId,
        nomeTitular: 'Ana Teste',
        ultimosDigitos: '1111',
      })
    })
    cy.wait('@listarCartoes')
    cy.contains('VISA **** 1111').should('be.visible')

    cy.get('[data-testid="revisar-pedido"]').click()
    cy.location('pathname').should('eq', '/checkout/revisao')
    cy.contains('button', '✓ Confirmar e pagar').click()
    cy.wait('@finalizarPedido').then(({ request, response }) => {
      expect(request.body.pagamentos).to.deep.equal([
        { formaPagamentoId: 9, valor: 35, parcelas: 1 },
      ])
      expect(response.body.status).to.equal('EM_PROCESSAMENTO')
    })
    cy.location('pathname').should('eq', '/checkout/sucesso')
  })
})
