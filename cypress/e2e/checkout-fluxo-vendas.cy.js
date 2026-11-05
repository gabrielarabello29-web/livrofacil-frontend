const clienteId = '11111111-1111-4111-8111-111111111111'
const carrinhoId = 7
const pedidoId = 42

const enderecoExistente = {
  id: 1,
  tipoEndereco: 'Casa',
  logradouro: 'Rua Um',
  numero: '10',
  bairro: 'Centro',
  cidade: 'São Paulo',
  estado: 'SP',
  cep: '01000-001',
  principal: true,
}

const cartaoExistente = {
  id: 4,
  clienteId,
  nomeTitular: 'Cliente E2E',
  tipoCartao: 'CREDITO',
  ultimosDigitos: '1111',
  validade: '12/28',
  bandeira: 'VISA',
  preferencial: true,
  ativo: true,
}

const bandeiras = ['VISA', 'MASTERCARD', 'ELO', 'AMEX', 'HIPERCARD'].map((nome) => ({
  id: nome,
  nome,
  disponivel: true,
}))

function criarPedido(overrides = {}) {
  return {
    id: pedidoId,
    clienteId,
    carrinhoId,
    status: 'PENDENTE',
    subtotal: 100,
    desconto: 0,
    frete: 19.9,
    total: 119.9,
    cupom: null,
    enderecoEntregaId: enderecoExistente.id,
    itens: [{
      id: 1,
      livroId: 10,
      titulo: 'Livro de teste',
      quantidade: 1,
      valorUnitario: 100,
      subtotal: 100,
    }],
    ...overrides,
  }
}

function prepararAPIs({ enderecos = [enderecoExistente], cartoes = [cartaoExistente] } = {}) {
  let listaEnderecos = [...enderecos]
  let listaCartoes = [...cartoes]
  let pedidoAtual = criarPedido()
  let vouchersCliente = []

  cy.intercept('GET', `**/api/clientes/${clienteId}/enderecos`, (req) => {
    req.reply({ statusCode: 200, body: listaEnderecos })
  }).as('listarEnderecos')

  cy.intercept('POST', `**/api/clientes/${clienteId}/enderecos`, (req) => {
    const endereco = { ...req.body, id: 2 }
    listaEnderecos = [...listaEnderecos, endereco]
    req.reply({ statusCode: 201, body: endereco })
  }).as('criarEndereco')

  cy.intercept('GET', `**/api/clientes/${clienteId}/formas-pagamento`, (req) => {
    req.reply({ statusCode: 200, body: listaCartoes })
  }).as('listarCartoes')

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

  cy.intercept('GET', '**/api/pagamentos/bandeiras', {
    statusCode: 200,
    body: bandeiras,
  }).as('listarBandeiras')

  cy.intercept('GET', `**/api/carrinhos/${carrinhoId}*`, {
    statusCode: 200,
    body: {
      id: carrinhoId,
      itens: [{
        id: 1,
        livroId: 10,
        titulo: 'Livro de teste',
        quantidade: 1,
        valorUnitario: 100,
        subtotal: 100,
        quantidadeDisponivel: 10,
      }],
      total: 100,
    },
  }).as('buscarCarrinho')

  cy.intercept('POST', '**/api/pedidos/iniciar', (req) => {
    pedidoAtual = criarPedido({ enderecoEntregaId: Number(req.body.enderecoEntregaId) })
    req.reply({ statusCode: 201, body: pedidoAtual })
  }).as('iniciarPedido')

  cy.intercept('GET', `**/api/pedidos/${pedidoId}?clienteId=*`, (req) => {
    req.reply({ statusCode: 200, body: pedidoAtual })
  }).as('buscarPedido')

  cy.intercept('POST', '**/api/cupons/validar', (req) => {
    expect(req.body.codigo).to.equal('VALE150')
    req.reply({
      statusCode: 200,
      body: {
        valido: true,
        tipo: 'FIXO',
        valor: 150,
        voucherValor: 150,
        voucherResgatadoEm: null,
        codigo: 'VALE150',
        mensagem: 'Voucher válido',
      },
    })
  }).as('validarVoucher')

  cy.intercept('POST', `**/api/pedidos/${pedidoId}/cupons?clienteId=*`, (req) => {
    expect(req.body.codigo).to.equal('VALE150')
    pedidoAtual = {
      ...pedidoAtual,
      cupom: 'VALE150',
      desconto: 119.9,
      total: 0,
    }
    req.reply({ statusCode: 200, body: pedidoAtual })
  }).as('aplicarVoucher')

  cy.intercept('POST', `**/api/pedidos/${pedidoId}/finalizar?clienteId=*`, (req) => {
    const voucherSaldoGerado = pedidoAtual.cupom === 'VALE150'
      ? {
          id: 812,
          codigo: 'TR-NOVO-CODIGO',
          valor: 30.1,
          criadoEm: '2026-10-06T13:00:00',
          resgatadoEm: null,
          pedidoResgateId: null,
        }
      : null
    if (voucherSaldoGerado) {
      vouchersCliente = [
        {
          id: 811,
          codigo: 'VALE150',
          valor: 0,
          criadoEm: '2026-10-01T12:00:00',
          resgatadoEm: '2026-10-06T13:00:00',
          pedidoResgateId: pedidoId,
        },
        voucherSaldoGerado,
      ]
    }
    req.reply({
      statusCode: 200,
      body: {
        ...pedidoAtual,
        status: 'EM_PROCESSAMENTO',
        pagamentos: req.body.pagamentos,
        voucherSaldoGerado,
      },
    })
  }).as('finalizarPedido')

  cy.intercept('GET', `**/api/trocas/cliente/${clienteId}`, {
    statusCode: 200,
    body: [],
  }).as('listarTrocasCliente')

  cy.intercept('GET', `**/api/trocas/cliente/${clienteId}/vouchers`, (req) => {
    req.reply({ statusCode: 200, body: vouchersCliente })
  }).as('listarVouchersCliente')

  cy.visit('/checkout/endereco', {
    onBeforeLoad(win) {
      win.localStorage.setItem('usuario', JSON.stringify({
        uuid: clienteId,
        id: clienteId,
        perfil: 'CLIENTE',
        ativo: true,
        nome: 'Cliente E2E',
      }))
      win.localStorage.setItem('carrinhoId', String(carrinhoId))
    },
  })

  cy.wait(['@listarEnderecos', '@buscarCarrinho'])
}

function concluirCompra() {
  cy.get('[data-testid="revisar-pedido"]').should('be.enabled').click()
  cy.location('pathname').should('eq', '/checkout/revisao')
  cy.contains('button', '✓ Confirmar e pagar').click()
  cy.wait('@finalizarPedido').its('response.body.status').should('eq', 'EM_PROCESSAMENTO')
  cy.location('pathname').should('eq', '/checkout/sucesso')
  cy.contains('Status: Em processamento').should('be.visible')
}

describe('Demonstração funcional do fluxo de vendas', () => {
  it('finaliza compra usando endereço e cartão previamente cadastrados', () => {
    prepararAPIs()

    cy.contains('button', 'Continuar').click()
    cy.wait('@iniciarPedido').then(({ request }) => {
      expect(request.body.enderecoEntregaId).to.equal(enderecoExistente.id)
    })
    cy.location('pathname').should('eq', '/checkout/pagamento')
    cy.get('.checkout-payment-list input[type="radio"]').should('have.length', 1).and('be.checked')
    cy.get('.checkout-split-row select').first().should('have.value', String(cartaoExistente.id))

    cy.get('[data-testid="revisar-pedido"]').click()
    cy.location('pathname').should('eq', '/checkout/revisao')
    cy.contains('Rua Um, 10').should('be.visible')
    cy.contains('VISA **** 1111').should('be.visible')
    cy.contains('button', '✓ Confirmar e pagar').click()

    cy.wait('@finalizarPedido').then(({ request, response }) => {
      expect(request.body).to.deep.equal({
        carrinhoId,
        pagamentos: [{ formaPagamentoId: cartaoExistente.id, valor: 119.9, parcelas: 1 }],
      })
      expect(response.body.status).to.equal('EM_PROCESSAMENTO')
    })
    cy.location('pathname').should('eq', '/checkout/sucesso')
    cy.contains('Status: Em processamento').should('be.visible')
  })

  it('cadastra endereço e cartão novos durante o checkout e os incorpora ao perfil', () => {
    prepararAPIs({ enderecos: [], cartoes: [] })

    cy.contains('button', '+ Cadastrar endereço').click()
    cy.get('.cart-address-form input').eq(0).type('Casa Nova')
    cy.get('.cart-address-form input').eq(1).type('02000-002')
    cy.get('.cart-address-form input').eq(2).type('Rua Nova')
    cy.get('.cart-address-form input').eq(3).type('20')
    cy.get('.cart-address-form input').eq(5).type('Bairro Novo')
    cy.get('.cart-address-form input').eq(6).type('São Paulo')
    cy.get('.cart-address-form select').select('SP')
    cy.contains('button', 'Salvar endereço').click()

    cy.wait('@criarEndereco').then(({ request, response }) => {
      expect(request.body).to.include({
        tipoEndereco: 'Casa Nova',
        logradouro: 'Rua Nova',
        numero: '20',
        bairro: 'Bairro Novo',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '02000-002',
      })
      expect(response.body.id).to.equal(2)
    })
    cy.contains('strong', 'Casa Nova').should('be.visible')
    cy.contains('button', 'Continuar').click()
    cy.wait('@iniciarPedido').its('request.body.enderecoEntregaId').should('eq', 2)
    cy.location('pathname').should('eq', '/checkout/pagamento')

    cy.contains('button', '+ Cadastrar cartão').click()
    cy.get('[data-testid="nome-titular"]').type('Ana Teste')
    cy.get('[data-testid="numero-cartao"]').type('4111111111111111')
    cy.get('[data-testid="validade-cartao"]').type('12/28')
    cy.get('[data-testid="codigo-seguranca"]').type('123')
    cy.contains('button', 'Salvar cartão').click()

    cy.wait('@criarCartao').then(({ request }) => {
      expect(request.body).to.include({
        nomeTitular: 'Ana Teste',
        tipoCartao: 'CREDITO',
        numeroCartao: '4111 1111 1111 1111',
        codigoSeguranca: '123',
        validade: '12/28',
        bandeira: 'VISA',
      })
    })
    cy.wait('@listarCartoes')
    cy.contains('VISA **** 1111').should('be.visible')
    cy.get('[data-testid="codigo-seguranca"]').should('not.exist')
    cy.window().should((win) => {
      const usuario = JSON.parse(win.localStorage.getItem('usuario'))
      expect(usuario.enderecos).to.have.length(1)
      expect(usuario.enderecos[0].id).to.equal(2)
      expect(usuario.cartoes).to.have.length(1)
      expect(usuario.cartoes[0].ultimosDigitos).to.equal('1111')
      expect(win.localStorage.getItem('usuario')).not.to.contain('123')
    })

    concluirCompra()
  })

  it('emite voucher com a diferença e o disponibiliza no perfil quando o voucher supera a compra', () => {
    prepararAPIs()

    cy.contains('button', 'Continuar').click()
    cy.wait('@iniciarPedido')
    cy.location('pathname').should('eq', '/checkout/pagamento')
    cy.get('[data-testid="codigo-cupom"]').type('VALE150')
    cy.get('[data-testid="aplicar-cupom"]').click()
    cy.wait('@validarVoucher')
    cy.wait('@aplicarVoucher').then(({ response }) => {
      expect(response.body).to.include({ desconto: 119.9, frete: 19.9, total: 0 })
    })
    cy.contains('O cupom ou voucher cobriu o valor total do pedido.').should('be.visible')

    cy.get('[data-testid="revisar-pedido"]').click()
    cy.location('pathname').should('eq', '/checkout/revisao')
    cy.contains('button', '✓ Confirmar e pagar').click()
    cy.wait('@finalizarPedido').then(({ request, response }) => {
      expect(request.body).to.deep.equal({ carrinhoId, pagamentos: [] })
      expect(response.body).to.include({ status: 'EM_PROCESSAMENTO', total: 0 })
      expect(response.body.voucherSaldoGerado).to.include({
        codigo: 'TR-NOVO-CODIGO',
        valor: 30.1,
        resgatadoEm: null,
      })
    })
    cy.location('pathname').should('eq', '/checkout/sucesso')
    cy.contains('Status: Em processamento').should('be.visible')

    cy.visit('/trocas')
    cy.wait(['@listarTrocasCliente', '@listarVouchersCliente'])
    cy.get('[data-testid="voucher-perfil"]').should('have.length', 2)
    cy.contains('[data-testid="voucher-perfil"]', 'VALE150')
      .should('contain', 'Resgatado')
      .and('contain', 'R$ 0,00')
    cy.contains('[data-testid="voucher-perfil"]', 'TR-NOVO-CODIGO')
      .should('contain', 'Disponível')
      .and('contain', 'R$ 30,10')
  })
})
