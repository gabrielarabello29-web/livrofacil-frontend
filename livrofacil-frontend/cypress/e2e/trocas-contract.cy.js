const clienteId = '11111111-1111-4111-8111-111111111111'
const admin = { id: '22222222-2222-4222-8222-222222222222', nome: 'Administrador E2E', perfil: 'ADMIN', ativo: true }
const cliente = { uuid: clienteId, id: clienteId, nome: 'Cliente E2E', perfil: 'CLIENTE', ativo: true }
const pedidoEntregue = { id: 86, status: 'ENTREGUE', entregueEm: '2026-10-15T12:00:00', itens: [{ itemPedidoId: 701, livroId: 44, pedidoId: 86, quantidade: 3, valorUnitario: 32.5 }] }

describe('Trocas e devoluções — contratos frontend com intercepts', () => {
  function prepararSolicitacao(pedido = pedidoEntregue, solicitacoes = []) {
    cy.intercept('GET', `**/api/pedidos/cliente/${clienteId}`, { statusCode: 200, body: [pedido] }).as('pedidos')
    cy.intercept('GET', `**/api/trocas/cliente/${clienteId}`, { statusCode: 200, body: solicitacoes }).as('trocasCliente')
    cy.intercept('GET', '**/api/livros/44', { statusCode: 200, body: { id: 44, titulo: 'Livro da troca' } })
    cy.visit('/trocas/nova', { onBeforeLoad(win) { win.localStorage.setItem('usuario', JSON.stringify(cliente)) } })
    cy.wait(['@pedidos', '@trocasCliente'])
  }

  it('habilita solicitação para pedido ENTREGUE com data no período de sete dias', () => {
    prepararSolicitacao()
    cy.get('[data-testid="troca-pedido"]').should('contain', 'Pedido #86')
    cy.get('[data-testid="troca-pedido"]').select('86')
    cy.get('[data-testid="troca-item"]').select('itemPedidoId:701')
    cy.get('[data-testid="enviar-solicitacao-troca"]').should('be.enabled')
  })

  it('não oferece pedido não entregue, sem entregueEm ou após o prazo', () => {
    const cenarios = [
      { ...pedidoEntregue, status: 'EM_ROTA_DE_ENTREGA' },
      { ...pedidoEntregue, entregueEm: null },
      { ...pedidoEntregue, entregueEm: '2026-10-01T12:00:00' },
    ]
    cenarios.forEach((pedido, index) => {
      cy.intercept('GET', `**/api/pedidos/cliente/${clienteId}`, { statusCode: 200, body: [pedido] }).as(`pedidoInelegivel${index}`)
      cy.intercept('GET', `**/api/trocas/cliente/${clienteId}`, { statusCode: 200, body: [] }).as(`trocasInelegiveis${index}`)
      cy.visit('/trocas/nova', { onBeforeLoad(win) { win.localStorage.setItem('usuario', JSON.stringify(cliente)) } })
      cy.wait([`@pedidoInelegivel${index}`, `@trocasInelegiveis${index}`])
      cy.get('[data-testid="troca-pedido"] option').should('have.length', 1)
      cy.get('[data-testid="enviar-solicitacao-troca"]').should('be.disabled')
    })
  })

  it('envia tipo, quantidade parcial e itemPedidoId contratuais', () => {
    prepararSolicitacao()
    cy.intercept('POST', '**/api/trocas', (req) => {
      expect(req.body).to.deep.equal({ clienteId, pedidoId: 86, itemPedidoId: 701, tipo: 'DEVOLUCAO', quantidade: 2, motivo: 'Produto danificado' })
      req.reply({ statusCode: 201, body: { id: 501, ...req.body, status: 'SOLICITADA' } })
    }).as('solicitar')
    cy.get('[data-testid="troca-pedido"]').select('86')
    cy.get('[data-testid="troca-item"]').select('itemPedidoId:701')
    cy.get('[data-testid="troca-tipo"]').select('DEVOLUCAO')
    cy.get('[data-testid="troca-quantidade"]').clear().type('2')
    cy.get('[data-testid="troca-motivo"]').select('Produto danificado')
    cy.get('[data-testid="enviar-solicitacao-troca"]').click()
    cy.wait('@solicitar')
  })

  it('bloqueia quantidade inválida e unidades já comprometidas', () => {
    prepararSolicitacao(pedidoEntregue, [{ id: 1, itemPedidoId: 701, quantidadeSolicitada: 2, status: 'AGUARDANDO_RECEBIMENTO' }])
    cy.get('[data-testid="troca-pedido"]').select('86')
    cy.get('[data-testid="troca-item"]').select('itemPedidoId:701')
    cy.get('[data-testid="troca-item"]').should('contain', 'disponível 1')
    cy.get('[data-testid="troca-quantidade"]').clear().type('2')
    cy.get('[data-testid="troca-motivo"]').select('Produto danificado')
    cy.get('[data-testid="enviar-solicitacao-troca"]').should('be.disabled')
    cy.get('[data-testid="troca-quantidade"]').clear().type('1')
    cy.get('[data-testid="enviar-solicitacao-troca"]').should('be.enabled')
    cy.get('[data-testid="troca-quantidade"]').clear().type('2')
    cy.get('[data-testid="enviar-solicitacao-troca"]').should('be.disabled')
  })

  it('preserva mensagem de conflito de prazo e evita duplicidade no envio', () => {
    prepararSolicitacao()
    cy.intercept('POST', '**/api/trocas', { delay: 800, statusCode: 409, body: { status: 409, erro: 'Conflict', mensagem: 'O prazo de 7 dias corridos expirou', erros: {}, caminho: '/api/trocas' } }).as('prazo')
    cy.get('[data-testid="troca-pedido"]').select('86')
    cy.get('[data-testid="troca-item"]').select('itemPedidoId:701')
    cy.get('[data-testid="troca-motivo"]').select('Produto danificado')
    cy.get('[data-testid="enviar-solicitacao-troca"]').click()
    cy.get('[data-testid="enviar-solicitacao-troca"]').should('be.disabled').click({ force: true })
    cy.wait('@prazo')
    cy.get('[role="alert"]').should('contain', 'O prazo de 7 dias corridos expirou')
    cy.get('@prazo.all').should('have.length', 1)
  })

  it('lista e consulta voucher com saldo, valor original, origem e resgate', () => {
    const voucher = { id: 77, codigo: 'TR-77', valor: 12.5, saldo: 12.5, valorOriginal: 32.5, tipo: 'TROCA', status: 'DISPONIVEL', trocaId: 501, voucherOrigemId: null, criadoEm: '2026-10-19T15:10:00', resgatadoEm: null, pedidoResgateId: null }
    cy.intercept('GET', `**/api/trocas/cliente/${clienteId}/vouchers`, { statusCode: 200, body: [voucher] }).as('vouchers')
    cy.visit('/meus-cupons', { onBeforeLoad(win) { win.localStorage.setItem('usuario', JSON.stringify(cliente)) } })
    cy.wait('@vouchers')
    cy.contains('TR-77').should('be.visible')
    cy.contains('Saldo atual').parent().should('contain', 'R$ 12,50')
    cy.intercept('GET', `**/api/trocas/cliente/${clienteId}/vouchers/77`, { statusCode: 200, body: voucher }).as('voucherDetalhe')
    cy.contains('Ver detalhes').click()
    cy.wait('@voucherDetalhe')
    cy.get('[data-testid="voucher-codigo"]').should('contain', 'TR-77')
    cy.contains('Origem da troca').parent().should('contain', '501')
  })

  it('exibe detalhe, justificativa, recebimento e histórico da solicitação', () => {
    cy.intercept('GET', `**/api/trocas/cliente/${clienteId}`, { statusCode: 200, body: [{ id: 501, pedidoId: 86, tipo: 'DEVOLUCAO', titulo: 'Livro da troca', quantidadeSolicitada: 2, quantidadeRecebida: 1, status: 'CONCLUIDA', voucherCodigo: 'TR-501', voucherValor: 32.5 }] })
    cy.intercept('GET', `**/api/trocas/cliente/${clienteId}/vouchers`, { statusCode: 200, body: [] })
    cy.visit('/trocas', { onBeforeLoad(win) { win.localStorage.setItem('usuario', JSON.stringify(cliente)) } })
    cy.intercept('GET', `**/api/trocas/cliente/${clienteId}/501`, { statusCode: 200, body: { id: 501, pedidoId: 86, tipo: 'DEVOLUCAO', titulo: 'Livro da troca', quantidadeSolicitada: 2, quantidadeRecebida: 1, status: 'RECUSADA', motivoRecusa: 'Dano não elegível' } }).as('detalhe')
    cy.intercept('GET', `**/api/trocas/cliente/${clienteId}/501/historico`, { statusCode: 200, body: [{ id: 8, trocaId: 501, status: 'RECUSADA', observacao: 'Dano não elegível', criadoEm: '2026-10-19T15:10:00' }] }).as('historico')
    cy.contains('Detalhes e histórico').click()
    cy.wait(['@detalhe', '@historico'])
    cy.contains('Dano não elegível').should('be.visible')
  })

  it('admin filtra, exige justificativa e recebe parcialmente com reposição escolhida', () => {
    let listaTrocas = [
      { id: 601, pedidoId: 86, clienteId, clienteNome: 'Cliente E2E', titulo: 'Livro A', tipo: 'TROCA', quantidadeSolicitada: 2, status: 'SOLICITADA' },
      { id: 602, pedidoId: 86, clienteId, clienteNome: 'Cliente E2E', titulo: 'Livro B', tipo: 'DEVOLUCAO', quantidadeSolicitada: 1, status: 'SOLICITADA' },
      { id: 603, pedidoId: 86, clienteId, titulo: 'Livro C', tipo: 'DEVOLUCAO', quantidadeSolicitada: 2, status: 'AGUARDANDO_RECEBIMENTO' },
    ]
    cy.intercept('GET', '**/api/trocas*', (req) => req.reply({ statusCode: 200, body: listaTrocas })).as('listaAdmin')
    cy.intercept('PATCH', '**/api/trocas/601/autorizar', (req) => { listaTrocas = listaTrocas.map((t) => t.id === 601 ? { ...t, status: 'AGUARDANDO_RECEBIMENTO' } : t); req.reply({ statusCode: 200, body: { id: 601, status: 'AGUARDANDO_RECEBIMENTO' } }) }).as('autorizar')
    cy.intercept('PATCH', '**/api/trocas/602/recusar', (req) => { expect(req.body).to.deep.equal({ motivo: 'Produto incorreto' }); req.reply({ statusCode: 200, body: { id: 602, status: 'RECUSADA' } }); listaTrocas = listaTrocas.filter((t) => t.id !== 602) }).as('recusar')
    cy.intercept('PATCH', '**/api/trocas/603/receber', (req) => { expect(req.body).to.deep.equal({ retornarEstoque: true, quantidadeRecebida: 1 }); const finalizada = { id: 603, pedidoId: 86, clienteId, titulo: 'Livro C', tipo: 'DEVOLUCAO', quantidadeSolicitada: 2, quantidadeRecebida: 1, status: 'CONCLUIDA', creditoEm: '2026-10-19T15:10:00', voucherCodigo: 'TR-603', voucherValor: 32.5 }; listaTrocas = listaTrocas.map((t) => t.id === 603 ? finalizada : t); req.reply({ statusCode: 200, body: finalizada }) }).as('receber')
    cy.visit('/admin/trocas', { onBeforeLoad(win) { win.localStorage.setItem('usuario', JSON.stringify(admin)) } })
    cy.wait('@listaAdmin')
    cy.get('[data-testid="autorizar-troca-601"]').click(); cy.wait('@autorizar'); cy.wait('@listaAdmin')
    cy.get('[data-testid="recusar-troca-602"]').click()
    cy.get('[data-testid="motivo-recusa-troca"]').type('Produto incorreto')
    cy.get('[data-testid="confirmar-recusa-troca"]').click(); cy.wait('@recusar')
    cy.get('[data-testid="recebida-troca-603"]').click()
    cy.get('[data-testid="quantidade-recebida-troca"]').clear().type('1')
    cy.get('[data-testid="retornar-estoque-troca"]').check()
    cy.get('[data-testid="confirmar-recebimento-troca"]').click(); cy.wait('@receber')
    cy.get('[data-testid="voucher-troca-603"]').should('contain', 'TR-603').and('contain', 'R$ 32,50')
  })
})
