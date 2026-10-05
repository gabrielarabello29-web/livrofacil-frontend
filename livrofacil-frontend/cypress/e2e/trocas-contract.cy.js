const clienteId = '11111111-1111-4111-8111-111111111111'
const admin = {
  id: '22222222-2222-4222-8222-222222222222',
  nome: 'Administrador E2E',
  perfil: 'ADMIN',
  ativo: true,
}
const cliente = {
  uuid: clienteId,
  id: clienteId,
  nome: 'Cliente E2E',
  perfil: 'CLIENTE',
  ativo: true,
}

const pedidoEntregue = {
  id: 86,
  status: 'FINALIZADO',
  itens: [{ id: 701, livroId: 44, pedidoId: 86, quantidade: 1 }],
}

describe('Trocas — contrato das operações suportadas', () => {
  it('permite ao cliente solicitar troca usando itensPedido e lista voucher emitido', () => {
    cy.intercept('GET', `**/api/pedidos/cliente/${clienteId}`, {
      statusCode: 200,
      body: [pedidoEntregue],
    }).as('listarPedidosEntregues')
    cy.intercept('GET', '**/api/livros/44', {
      statusCode: 200,
      body: { id: 44, titulo: 'Livro da troca', imagemUrl: '/capa-livro-da-troca.png' },
    }).as('buscarLivroTroca')
    cy.intercept('POST', '**/api/trocas', (req) => {
      expect(req.body).to.deep.equal({
        clienteId,
        pedidoId: 86,
        itemPedidoId: 701,
        motivo: 'Produto danificado',
      })
      req.reply({ statusCode: 201, body: { id: 501, ...req.body, status: 'SOLICITADA' } })
    }).as('solicitarTroca')
    cy.intercept('GET', `**/api/trocas/cliente/${clienteId}`, {
      statusCode: 200,
      body: [{
        id: 501,
        pedidoId: 86,
        livroTitulo: 'Livro da troca',
        status: 'TROCADA',
        voucherCodigo: 'TROCA501',
        voucherValor: 32.5,
      }],
    }).as('listarTrocasCliente')

    cy.visit('/trocas/nova', {
      onBeforeLoad(win) {
        win.localStorage.setItem('usuario', JSON.stringify(cliente))
      },
    })
    cy.wait('@listarPedidosEntregues')
    cy.get('[data-testid="troca-pedido"]').select('86')
    cy.wait('@buscarLivroTroca')
    cy.get('[data-testid="troca-item"]').should('contain', 'Livro da troca')
    cy.get('[data-testid="troca-item"]').select('itemPedidoId:701')
    cy.get('[data-testid="troca-motivo"]').select('Produto danificado')
    cy.get('[data-testid="enviar-solicitacao-troca"]').click()
    cy.wait('@solicitarTroca')
    cy.location('pathname').should('eq', '/trocas')
    cy.wait('@listarTrocasCliente')
    cy.get('[data-testid="voucher-troca"]')
      .should('contain', 'TROCA501')
      .and('contain', 'R$ 32,50')
  })

  it('permite ao administrador autorizar, recusar e registrar recebimento', () => {
    const trocas = [
      { id: 601, pedidoId: 86, clienteId, livroTitulo: 'Livro A', status: 'SOLICITADA' },
      { id: 602, pedidoId: 86, clienteId, livroTitulo: 'Livro B', status: 'SOLICITADA' },
      { id: 603, pedidoId: 86, clienteId, livroTitulo: 'Livro C', status: 'AUTORIZADA' },
    ]
    cy.intercept('GET', '**/api/trocas', (req) => req.reply({ statusCode: 200, body: trocas })).as('listarTrocasAdmin')
    cy.intercept('PATCH', '**/api/trocas/601/autorizar', { statusCode: 200, body: { id: 601, status: 'AUTORIZADA' } }).as('autorizarTroca')
    cy.intercept('PATCH', '**/api/trocas/602/recusar', (req) => {
      expect(req.body).to.deep.equal({ motivo: 'Produto incorreto' })
      req.reply({ statusCode: 200, body: { id: 602, status: 'RECUSADA' } })
    }).as('recusarTroca')
    cy.intercept('PATCH', '**/api/trocas/603/receber', (req) => {
      expect(req.body).to.deep.equal({ retornarEstoque: false })
      req.reply({ statusCode: 200, body: { id: 603, status: 'TROCADA', voucherCodigo: 'TROCA603', voucherValor: 22 } })
    }).as('receberTroca')

    cy.visit('/admin/trocas', {
      onBeforeLoad(win) {
        win.localStorage.setItem('usuario', JSON.stringify(admin))
      },
    })
    cy.wait('@listarTrocasAdmin')
    cy.get('[data-testid="autorizar-troca-601"]').click()
    cy.wait('@autorizarTroca')
    cy.wait('@listarTrocasAdmin')

    cy.window().then((win) => cy.stub(win, 'prompt').returns('Produto incorreto'))
    cy.get('[data-testid="recusar-troca-602"]').click()
    cy.wait('@recusarTroca')
    cy.wait('@listarTrocasAdmin')

    cy.get('[data-testid="recebida-troca-603"]').click()
    cy.get('input[name="estoque"]').eq(1).check()
    cy.get('[data-testid="confirmar-recebimento-troca"]').click()
    cy.wait('@receberTroca')
    cy.wait('@listarTrocasAdmin')
  })
})
