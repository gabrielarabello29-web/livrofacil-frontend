const clienteId = '11111111-1111-4111-8111-111111111111'
const enderecos = [
  { id: 1, tipoEndereco: 'Casa SP', logradouro: 'Rua Um', numero: '1', bairro: 'Centro', cidade: 'São Paulo', estado: 'SP', cep: '01000-001' },
  { id: 2, tipoEndereco: 'Casa RJ', logradouro: 'Rua Dois', numero: '2', bairro: 'Centro', cidade: 'Rio de Janeiro', estado: 'RJ', cep: '20000-002' },
  { id: 3, tipoEndereco: 'Trabalho SP', logradouro: 'Rua Três', numero: '3', bairro: 'Centro', cidade: 'São Paulo', estado: 'SP', cep: '01000-003' },
  { id: 4, tipoEndereco: 'Trabalho RJ', logradouro: 'Rua Quatro', numero: '4', bairro: 'Centro', cidade: 'Rio de Janeiro', estado: 'RJ', cep: '20000-004' },
  { id: 5, tipoEndereco: 'Casa SP 2', logradouro: 'Rua Cinco', numero: '5', bairro: 'Centro', cidade: 'São Paulo', estado: 'SP', cep: '01000-005' },
]

const fretePorEndereco = {
  1: 19.9,
  2: 29.9,
  3: 19.9,
  4: 29.9,
  5: 19.9,
}

function pedido(id, enderecoId, status = 'PENDENTE') {
  const frete = fretePorEndereco[enderecoId]
  return {
    id,
    status,
    subtotal: 89.9,
    frete,
    total: Number((89.9 + frete).toFixed(2)),
    enderecoEntregaId: enderecoId,
    itens: [{ id: 1, livroId: 1, titulo: 'Livro teste', quantidade: 1, subtotal: 89.9 }],
  }
}

describe('Checkout — frete acompanha trocas repetidas de endereço', () => {
  it('recalcula e exibe o frete do backend em quatro trocas consecutivas', () => {
    let pedidoAtualId = 10
    let proximoPedidoId = 11
    const statusPedidos = { 10: 'PENDENTE' }
    const enderecoInicialId = 1

    cy.intercept('GET', `**/api/clientes/${clienteId}/enderecos`, {
      statusCode: 200,
      body: enderecos,
    }).as('listarEnderecos')

    cy.intercept('GET', '**/api/carrinhos/7*', {
      statusCode: 200,
      body: {
        id: 7,
        itens: [{ id: 1, livroId: 1, titulo: 'Livro teste', quantidade: 1, valorUnitario: 89.9, subtotal: 89.9, quantidadeDisponivel: 10 }],
        total: 89.9,
      },
    }).as('buscarCarrinho')

    cy.intercept('GET', '**/api/pedidos/*?clienteId=*', (req) => {
      const id = Number(req.url.match(/\/pedidos\/(\d+)/)?.[1])
      req.reply({ statusCode: 200, body: pedido(id, id === 10 ? enderecoInicialId : 5, statusPedidos[id] || 'PENDENTE') })
    }).as('buscarPedido')

    cy.intercept('PATCH', '**/api/pedidos/*/cancelar?clienteId=*', (req) => {
      const id = Number(req.url.match(/\/pedidos\/(\d+)\/cancelar/)?.[1])
      statusPedidos[id] = 'CANCELADO'
      req.reply({ statusCode: 200, body: { ...pedido(id, id === 10 ? enderecoInicialId : 5), status: 'CANCELADO' } })
    }).as('cancelarPedido')

    cy.intercept('POST', '**/api/pedidos/iniciar', (req) => {
      const enderecoId = Number(req.body.enderecoEntregaId)
      const novoPedido = pedido(proximoPedidoId++, enderecoId)
      pedidoAtualId = novoPedido.id
      statusPedidos[novoPedido.id] = 'PENDENTE'
      req.reply({ statusCode: 200, body: novoPedido })
    }).as('iniciarPedido')

    cy.visit('/checkout/endereco', {
      onBeforeLoad(win) {
        win.localStorage.setItem('usuario', JSON.stringify({
          uuid: clienteId,
          id: clienteId,
          perfil: 'CLIENTE',
          ativo: true,
          nome: 'Cliente Teste',
        }))
        win.localStorage.setItem('carrinhoId', '7')
        win.localStorage.setItem('pedidoCheckout', '10')
        win.localStorage.setItem('enderecoCheckout', JSON.stringify({ pedidoId: 10, endereco: enderecos[0] }))
      },
    })

    cy.wait('@listarEnderecos')
    cy.get('input[type="radio"]').should('have.length', 5)

    const trocas = [
      { indice: 1, frete: 'R$ 29,90', total: 'R$ 119,80' },
      { indice: 2, frete: 'R$ 19,90', total: 'R$ 109,80' },
      { indice: 3, frete: 'R$ 29,90', total: 'R$ 119,80' },
      { indice: 4, frete: 'R$ 19,90', total: 'R$ 109,80' },
    ]

    trocas.forEach(({ indice, frete, total }, trocaIndex) => {
      cy.get('input[type="radio"]').eq(indice).should('not.be.disabled').check()
      cy.wait('@iniciarPedido').then(({ request, response }) => {
        expect(Number(request.body.enderecoEntregaId)).to.equal(enderecos[indice].id)
        expect(response.body.frete).to.equal(fretePorEndereco[enderecos[indice].id])
      })
      cy.get('[role="status"]').should('not.exist')
      cy.window().then((win) => {
        expect(Number(win.localStorage.getItem('pedidoCheckout'))).to.equal(11 + trocaIndex)
      })
      cy.contains('Frete').parent().should('contain', frete)
      cy.contains('Total').parent().should('contain', total)
    })

    cy.then(() => {
      expect(pedidoAtualId).to.equal(14)
    })
  })

  it('recria pedido pendente com a quantidade atual do carrinho antes de abrir pagamento', () => {
    const pedidoAntigo = {
      id: 50,
      status: 'PENDENTE',
      subtotal: 45,
      frete: 19.9,
      total: 64.9,
      itens: [{ id: 1, livroId: 1, quantidade: 1, valorUnitario: 45 }],
    }
    const pedidoAtualizado = {
      id: 51,
      status: 'PENDENTE',
      subtotal: 90,
      frete: 19.9,
      total: 109.9,
      itens: [{ id: 2, livroId: 1, quantidade: 2, valorUnitario: 45 }],
    }

    cy.intercept('GET', `**/api/clientes/${clienteId}/enderecos`, {
      statusCode: 200,
      body: enderecos,
    }).as('listarEnderecos')
    cy.intercept('GET', '**/api/carrinhos/7*', {
      statusCode: 200,
      body: {
        id: 7,
        itens: [{ id: 1, livroId: 1, titulo: 'Livro teste', quantidade: 2, valorUnitario: 45, subtotal: 90, quantidadeDisponivel: 10 }],
        total: 90,
      },
    }).as('buscarCarrinho')
    cy.intercept('GET', '**/api/pedidos/*?clienteId=*', (req) => {
      req.reply({ statusCode: 200, body: req.url.includes('/pedidos/50?') ? pedidoAntigo : pedidoAtualizado })
    }).as('buscarPedido')
    cy.intercept('PATCH', '**/api/pedidos/50/cancelar?clienteId=*', {
      statusCode: 200,
      body: { ...pedidoAntigo, status: 'CANCELADO' },
    }).as('cancelarPedido')
    cy.intercept('POST', '**/api/pedidos/iniciar', (req) => {
      expect(Number(req.body.carrinhoId)).to.equal(7)
      expect(Number(req.body.enderecoEntregaId)).to.equal(1)
      req.reply({ statusCode: 201, body: pedidoAtualizado })
    }).as('iniciarPedidoAtualizado')
    cy.intercept('GET', `**/api/clientes/${clienteId}/formas-pagamento`, {
      statusCode: 200,
      body: [],
    })
    cy.intercept('GET', '**/api/pagamentos/bandeiras', {
      statusCode: 200,
      body: [],
    })

    cy.visit('/checkout/endereco', {
      onBeforeLoad(win) {
        win.localStorage.setItem('usuario', JSON.stringify({
          uuid: clienteId,
          id: clienteId,
          perfil: 'CLIENTE',
          ativo: true,
          nome: 'Cliente Teste',
        }))
        win.localStorage.setItem('carrinhoId', '7')
        win.localStorage.setItem('pedidoCheckout', '50')
        win.localStorage.setItem('enderecoCheckout', JSON.stringify({ pedidoId: 50, endereco: enderecos[0] }))
      },
    })

    cy.wait('@listarEnderecos')
    cy.contains('button', 'Continuar').should('not.be.disabled').click()
    cy.wait('@iniciarPedidoAtualizado')
    cy.location('pathname').should('eq', '/checkout/pagamento')
    cy.get('.checkout-summary .summary-lines > div').first().should('contain', '2')
    cy.get('.checkout-summary .summary-lines').should('contain', 'R$ 90,00')
  })
})
