const clienteId = '11111111-1111-4111-8111-111111111111'
const pedidoId = 42
const carrinhoId = 7

const cartoesPadrao = [
  { id: 4, clienteId, nomeTitular: 'Joao da Silva', tipoCartao: 'CREDITO', ultimosDigitos: '1111', validade: '12/28', bandeira: 'VISA', preferencial: true, ativo: true },
  { id: 5, clienteId, nomeTitular: 'Maria da Silva', tipoCartao: 'CREDITO', ultimosDigitos: '2222', validade: '10/29', bandeira: 'MASTERCARD', preferencial: false, ativo: true },
]

const bandeirasDisponiveis = ['VISA', 'MASTERCARD', 'ELO', 'AMEX', 'HIPERCARD'].map((nome) => ({ id: nome, nome, disponivel: true }))

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
    itens: [{ id: 1, livroId: 10, titulo: 'Livro de teste', quantidade: 1, valorUnitario: 100 }],
    ...overrides,
  }
}

function prepararCheckout({ pedido = criarPedido(), cartoes = cartoesPadrao, aposCriarCartao } = {}) {
  let pedidoAtual = pedido
  let formasPagamento = [...cartoes]
  let requisicoesDeFinalizacao = 0

  cy.intercept('GET', `**/api/pedidos/${pedidoId}?clienteId=*`, (req) => {
    req.reply({ statusCode: 200, body: pedidoAtual })
  }).as('buscarPedidoCheckout')

  cy.intercept('GET', `**/api/clientes/${clienteId}/formas-pagamento`, (req) => {
    req.reply({ statusCode: 200, body: formasPagamento })
  }).as('listarCartoes')

  cy.intercept('GET', '**/api/pagamentos/bandeiras', {
    statusCode: 200,
    body: bandeirasDisponiveis,
  }).as('listarBandeiras')

  cy.intercept('GET', `**/api/carrinhos/${carrinhoId}*`, {
    statusCode: 200,
    body: {
      id: carrinhoId,
      itens: [{ id: 1, livroId: 10, titulo: 'Livro de teste', quantidade: 1, valorUnitario: 100, subtotal: 100, quantidadeDisponivel: 10 }],
      total: 100,
    },
  }).as('buscarCarrinho')

  cy.intercept('POST', `**/api/clientes/${clienteId}/formas-pagamento`, (req) => {
    const criado = {
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
    formasPagamento = [criado, ...formasPagamento]
    if (aposCriarCartao) {
      const novoPedido = aposCriarCartao(pedidoAtual, req.body)
      if (novoPedido) pedidoAtual = novoPedido
    }
    req.reply({ statusCode: 201, body: criado })
  }).as('criarCartao')

  cy.intercept('POST', '**/api/cupons/validar', (req) => {
    const codigo = String(req.body.codigo || '').toUpperCase()
    const cupons = {
      PROMO10: { valido: true, tipo: 'PERCENTUAL', valor: 10, codigo: 'PROMO10', mensagem: 'Cupom valido' },
      PROMO5: { valido: true, tipo: 'PERCENTUAL', valor: 5, codigo: 'PROMO5', mensagem: 'Cupom valido' },
      VALE150: { valido: true, tipo: 'FIXO', valor: 150, voucherValor: 150, voucherResgatadoEm: null, codigo: 'VALE150', mensagem: 'Voucher valido' },
      VALE4: { valido: true, tipo: 'FIXO', valor: 4, voucherValor: 4, voucherResgatadoEm: null, codigo: 'VALE4', mensagem: 'Voucher valido' },
      VALE_RESGATADO: { valido: true, tipo: 'FIXO', valor: 0, voucherValor: 0, voucherResgatadoEm: '2026-10-01T12:00:00Z', codigo: 'VALE_RESGATADO', mensagem: 'Voucher ja resgatado' },
    }
    req.reply({ statusCode: 200, body: cupons[codigo] || { valido: false, codigo, mensagem: 'Cupom invalido' } })
  }).as('validarCupom')

  cy.intercept('POST', `**/api/pedidos/${pedidoId}/cupons?clienteId=*`, (req) => {
    const codigo = String(req.body.codigo || '').toUpperCase()
    const aplicacoes = {
      PROMO10: { ...pedidoAtual, cupom: codigo, desconto: 10, total: 109.9 },
      PROMO5: { ...pedidoAtual, cupom: codigo, desconto: 5, total: 114.9 },
      PROMO_RESIDUAL: { ...pedidoAtual, cupom: codigo, desconto: 4, total: 8 },
      VALE150: { ...pedidoAtual, cupom: codigo, voucherValor: 50, voucherResgatadoEm: null, desconto: pedidoAtual.subtotal, total: pedidoAtual.frete },
      VALE4: { ...pedidoAtual, cupom: codigo, voucherValor: 4, voucherResgatadoEm: null, desconto: 4, total: 115.9 },
      PROMO_RESIDUAL: { ...pedidoAtual, cupom: codigo, desconto: 4, total: 8 },
    }
    pedidoAtual = aplicacoes[codigo] || pedidoAtual
    req.reply({ statusCode: 200, body: pedidoAtual })
  }).as('aplicarCupom')

  cy.intercept('POST', `**/api/pedidos/${pedidoId}/finalizar?clienteId=*`, (req) => {
    requisicoesDeFinalizacao += 1
    req.reply({
      statusCode: 200,
      body: { ...pedidoAtual, status: 'EM_PROCESSAMENTO', pagamentos: req.body.pagamentos },
    })
  }).as('finalizarPedido')

  cy.visit('/checkout/pagamento', {
    onBeforeLoad(win) {
      win.localStorage.setItem('usuario', JSON.stringify({
        uuid: clienteId,
        id: clienteId,
        nome: 'Cliente E2E',
        perfil: 'CLIENTE',
        ativo: true,
      }))
      win.localStorage.setItem('pedidoCheckout', String(pedidoId))
      win.localStorage.setItem('carrinhoId', String(carrinhoId))
    },
  })

  cy.wait(['@buscarPedidoCheckout', '@listarCartoes', '@listarBandeiras'])
  return {
    getPedido: () => pedidoAtual,
    getFinalizacoes: () => requisicoesDeFinalizacao,
  }
}

function aplicarCupom(codigo) {
  cy.get('[data-testid="codigo-cupom"]').clear().type(codigo)
  cy.get('[data-testid="aplicar-cupom"]').click()
  cy.wait('@validarCupom')
  cy.wait('@aplicarCupom')
}

function avancarARevisao() {
  cy.get('[data-testid="revisar-pedido"]').should('be.enabled').click()
  cy.location('pathname').should('eq', '/checkout/revisao')
  cy.contains('Confirmar pedido').should('be.visible')
}

describe('Checkout — contrato de pagamentos e cupons', () => {
  it('1. permite selecionar um cartão existente', () => {
    prepararCheckout()
    cy.get('.checkout-payment-list input[type="radio"]').eq(1).check()
    cy.get('.checkout-split-row select').first().should('have.value', '5')
  })

  it('2. cadastra novo cartão com CVV no formato esperado pelo backend', () => {
    prepararCheckout({ cartoes: [] })
    cy.contains('button', '+ Cadastrar cartão').click()
    cy.get('[data-testid="nome-titular"]').type('Ana Teste')
    cy.get('[data-testid="numero-cartao"]').type('4111111111111111')
    cy.get('[data-testid="validade-cartao"]').type('12/28')
    cy.get('[data-testid="codigo-seguranca"]').type('123')
    cy.get('button[type="submit"]').contains('Salvar cartão').click()
    cy.wait('@criarCartao').its('request.body').should('deep.equal', {
      nomeTitular: 'Ana Teste',
      tipoCartao: 'CREDITO',
      numeroCartao: '4111 1111 1111 1111',
      codigoSeguranca: '123',
      validade: '12/28',
      bandeira: 'VISA',
      preferencial: true,
    })
  })

  it('3. incorpora cartão cadastrado à lista do perfil e não persiste o CVV', () => {
    prepararCheckout({ cartoes: [] })
    cy.contains('button', '+ Cadastrar cartão').click()
    cy.get('[data-testid="nome-titular"]').type('Ana Teste')
    cy.get('[data-testid="numero-cartao"]').type('4111111111111111')
    cy.get('[data-testid="validade-cartao"]').type('12/28')
    cy.get('[data-testid="codigo-seguranca"]').type('987')
    cy.contains('button', 'Salvar cartão').click()
    cy.wait('@criarCartao')
    cy.contains('VISA **** 1111').should('be.visible')
    cy.get('[data-testid="codigo-seguranca"]').should('not.exist')
    cy.window().then((win) => {
      expect(win.localStorage.getItem('usuario')).not.to.contain('987')
    })
  })

  it('4. divide a compra entre dois cartões, respeita o mínimo e finaliza o pagamento', () => {
    prepararCheckout()
    cy.contains('button', '+ Dividir pagamento').click()
    cy.get('[data-testid="valor-pagamento-1"]').should('have.value', '59.95')
    cy.get('[data-testid="valor-pagamento-2"]').should('have.value', '59.95')
    cy.get('[data-testid="valor-pagamento-1"]').invoke('val').then(Number).should('be.gte', 10)
    cy.get('[data-testid="valor-pagamento-2"]').invoke('val').then(Number).should('be.gte', 10)
    avancarARevisao()
    cy.get('.checkout-review-payments > div').should('have.length', 2)
    cy.contains('button', '✓ Confirmar e pagar').click()
    cy.wait('@finalizarPedido').its('request.body.pagamentos').should('deep.equal', [
      { formaPagamentoId: 4, valor: 59.95, parcelas: 1 },
      { formaPagamentoId: 5, valor: 59.95, parcelas: 1 },
    ])
    cy.location('pathname').should('eq', '/checkout/sucesso')
  })

  it('5. rejeita cartão abaixo de R$ 10,00 sem cupom', () => {
    prepararCheckout()
    cy.get('[data-testid="valor-pagamento-1"]').clear().type('5').should('have.value', '5')
    cy.get('[data-testid="revisar-pedido"]').click()
    cy.get('[role="alert"]').should('contain', 'Cada cartão deve pagar pelo menos R$ 10,00')
    cy.location('pathname').should('eq', '/checkout/pagamento')
  })

  it('6. permite pagamento abaixo de R$ 10,00 quando cupom deixa saldo residual menor que R$ 10,00', () => {
    prepararCheckout({ pedido: criarPedido({ subtotal: 12, frete: 0, total: 12 }) })
    cy.intercept('POST', '**/api/cupons/validar', { statusCode: 200, body: { valido: true, tipo: 'PERCENTUAL', valor: 33.33, codigo: 'PROMO_RESIDUAL', mensagem: 'Cupom valido' } }).as('validarCupom')
    aplicarCupom('PROMO_RESIDUAL')
    cy.get('[data-testid="valor-pagamento-1"]').should('have.value', '8')
    avancarARevisao()
    cy.contains('button', '✓ Confirmar e pagar').click()
    cy.wait('@finalizarPedido').then(({ request }) => {
      expect(request.body.pagamentos).to.deep.equal([
        { formaPagamentoId: 4, valor: 8, parcelas: 1 },
      ])
    })
    cy.location('pathname').should('eq', '/checkout/sucesso')
  })

  it('7. valida e aplica um cupom promocional pelo contrato do backend', () => {
    prepararCheckout()
    aplicarCupom('PROMO10')
    cy.get('[role="status"]').should('contain', 'Código aplicado: PROMO10')
    cy.contains('Desconto (PROMO10)').parent().should('contain', '- R$ 10,00')
    cy.contains('Total').parent().should('contain', 'R$ 109,90')
  })

  it('8. impede aplicar um segundo cupom promocional ao mesmo pedido', () => {
    prepararCheckout()
    aplicarCupom('PROMO10')
    cy.get('[data-testid="codigo-cupom"]').type('PROMO5')
    cy.get('[data-testid="aplicar-cupom"]').click()
    cy.wait('@validarCupom')
    cy.get('[role="alert"]').should('contain', 'Só é permitido um cupom promocional por pedido')
    cy.get('@aplicarCupom.all').should('have.length', 1)
  })

  it('9. valida e aplica voucher de troca como cupom de valor fixo, sem classificá-lo como promocional', () => {
    prepararCheckout()
    aplicarCupom('VALE4')
    cy.get('[role="status"]').should('contain', 'Código aplicado: VALE4')
    cy.contains('Desconto (VALE4)').parent().should('contain', '- R$ 4,00')
  })

  it('10. limita ao desconto que o backend retornou quando o voucher excede o subtotal', () => {
    prepararCheckout()
    aplicarCupom('VALE150')
    cy.contains('Desconto (VALE150)').parent().should('contain', '- R$ 100,00')
    cy.contains('Total').parent().should('contain', 'R$ 19,90')
    cy.get('[data-testid="valor-pagamento-1"]').should('have.value', '19.9')
    cy.get('.checkout-summary').should('not.contain', '-R$')
  })

  it('11. exibe saldo atual positivo do voucher sem marcá-lo como resgatado', () => {
    prepararCheckout()
    aplicarCupom('VALE150')
    cy.get('[data-testid="saldo-voucher"]').should('contain', 'R$ 50,00')
    cy.get('[data-testid="voucher-resgatado"]').should('not.exist')
    cy.contains('Total').parent().should('contain', 'R$ 19,90')
  })

  it('11b. usa voucherValor retornado pela API como saldo atual e não calcula pelo desconto', () => {
    prepararCheckout()
    cy.intercept('POST', '**/api/cupons/validar', {
      statusCode: 200,
      body: { valido: true, tipo: 'FIXO', valor: 150, voucherValor: 25, voucherResgatadoEm: null, codigo: 'VALE150', mensagem: 'Voucher valido' },
    }).as('validarCupomSaldoAtual')
    cy.intercept('POST', `**/api/pedidos/${pedidoId}/cupons?clienteId=*`, (req) => {
      const codigo = String(req.body.codigo || '').toUpperCase()
      const pedidoAtualizado = {
        ...criarPedido(),
        cupom: { codigo },
        voucherValor: 25,
        voucherResgatadoEm: null,
        desconto: 100,
        total: 19.9,
      }
      req.reply({ statusCode: 200, body: pedidoAtualizado })
    }).as('aplicarCupomSaldoAtual')

    cy.get('[data-testid="codigo-cupom"]').clear().type('VALE150')
    cy.get('[data-testid="aplicar-cupom"]').click()
    cy.wait('@validarCupomSaldoAtual')
    cy.wait('@aplicarCupomSaldoAtual')

    cy.get('[data-testid="saldo-voucher"]').should('contain', 'R$ 25,00')
    cy.get('[data-testid="voucher-resgatado"]').should('not.exist')
    cy.contains('Total').parent().should('contain', 'R$ 19,90')
  })

  it('11c. não permite aplicar voucher com saldo zerado ou data de resgate', () => {
    prepararCheckout()
    cy.get('[data-testid="codigo-cupom"]').type('VALE_RESGATADO')
    cy.get('[data-testid="aplicar-cupom"]').click()
    cy.wait('@validarCupom')
    cy.get('[role="alert"]').should('contain', 'Voucher ja resgatado')
    cy.get('@aplicarCupom.all').should('have.length', 0)
  })

  it('12. envia o payload padrão e finaliza com pagamento válido', () => {
    prepararCheckout()
    avancarARevisao()
    cy.contains('button', '✓ Confirmar e pagar').click()
    cy.wait('@finalizarPedido').then(({ request }) => {
      expect(request.body).to.deep.equal({
        carrinhoId,
        pagamentos: [{ formaPagamentoId: 4, valor: 119.9, parcelas: 1 }],
      })
    })
    cy.location('pathname').should('eq', '/checkout/sucesso')
  })

  it('13. confirma o status EM_PROCESSAMENTO retornado na finalização', () => {
    prepararCheckout()
    avancarARevisao()
    cy.contains('button', '✓ Confirmar e pagar').click()
    cy.wait('@finalizarPedido').its('response.body.status').should('eq', 'EM_PROCESSAMENTO')
    cy.contains('Status: Em processamento').should('be.visible')
  })
})
