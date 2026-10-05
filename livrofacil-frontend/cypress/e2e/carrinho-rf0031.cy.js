const livros = [
  { id: 1, titulo: 'Livro A', valorVenda: 39.9, imagemUrl: 'https://via.placeholder.com/180x240', ativo: true, estoque: { quantidadeDisponivel: 5 }, categoriaNomes: ['Ficção'] },
  { id: 2, titulo: 'Livro B', valorVenda: 59.9, imagemUrl: 'https://via.placeholder.com/180x240', ativo: true, estoque: { quantidadeDisponivel: 3 }, categoriaNomes: ['Tecnologia'] },
]

let simularFalhaEstoqueAdicao = false

function prepararEstadoCarrinho() {
  let cart = { id: 1, clienteId: '11111111-1111-4111-8111-111111111111', token: 'tok-1', itens: [], total: 0 }

  cy.intercept('GET', '**/api/livros/catalogo*', {
    statusCode: 200,
    body: livros,
  }).as('listarCatalogo')

  cy.intercept('POST', '**/api/carrinhos', {
    statusCode: 200,
    body: { id: 1, clienteId: cart.clienteId, token: cart.token },
  }).as('criarCarrinho')

  cy.intercept('GET', '**/api/carrinhos/1*', (req) => {
    req.reply({ statusCode: 200, body: cart })
  }).as('buscarCarrinho')

  cy.intercept('POST', '**/api/carrinhos/1/itens*', (req) => {
    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    if (simularFalhaEstoqueAdicao) {
      simularFalhaEstoqueAdicao = false
      req.reply({
        statusCode: 409,
        body: {
          status: 409,
          erro: 'Conflict',
          mensagem: 'Quantidade solicitada superior ao estoque disponível.',
          erros: {},
          caminho: '/api/carrinhos/1/itens',
          timestamp: '2026-10-04T00:00:00Z',
        },
      })
      return
    }
    const livro = livros.find((item) => String(item.id) === String(payload.livroId))
    const quantidadeSolicitada = Number(payload.quantidade || 0)
    const itemExistente = cart.itens.find((item) => String(item.livroId) === String(payload.livroId))
    const quantidadeFinal = (itemExistente ? Number(itemExistente.quantidade) : 0) + quantidadeSolicitada

    if (!livro) {
      req.reply({ statusCode: 404, body: { mensagem: 'Livro não encontrado.' } })
      return
    }

    const estoque = Number(livro.estoque?.quantidadeDisponivel ?? livro.quantidadeDisponivel ?? 0)
    if (quantidadeFinal > estoque) {
      req.reply({
        statusCode: 409,
        body: {
          status: 409,
          erro: 'Conflict',
          mensagem: 'Quantidade solicitada superior ao estoque disponível.',
          erros: {},
          caminho: '/api/carrinhos/1/itens',
          timestamp: '2026-10-04T00:00:00Z',
        },
      })
      return
    }

    if (itemExistente) {
      itemExistente.quantidade += quantidadeSolicitada
      itemExistente.subtotal = Number(itemExistente.valorUnitario || 0) * Number(itemExistente.quantidade || 0)
      itemExistente.titulo = livro.titulo
      itemExistente.imagemUrl = livro.imagemUrl
    } else {
      cart.itens.push({
        id: Date.now(),
        livroId: livro.id,
        titulo: livro.titulo,
        imagemUrl: livro.imagemUrl,
        quantidade: quantidadeSolicitada,
        valorUnitario: Number(livro.valorVenda || 0),
        subtotal: Number(livro.valorVenda || 0) * quantidadeSolicitada,
        quantidadeDisponivel: estoque,
      })
    }

    cart.total = cart.itens.reduce((soma, item) => soma + Number(item.subtotal || 0), 0)
    req.reply({ statusCode: 200, body: cart })
  }).as('adicionarItem')

  cy.intercept('PUT', '**/api/carrinhos/1/itens/*', (req) => {
    const itemId = Number(req.url.split('/itens/')[1].split('?')[0])
    const url = new URL(req.url)
    const quantidade = Number(url.searchParams.get('quantidade') || 0)
    const item = cart.itens.find((entry) => Number(entry.id) === itemId)
    const livro = livros.find((entry) => String(entry.id) === String(item?.livroId))

    if (!item || !livro) {
      req.reply({ statusCode: 404, body: { mensagem: 'Item não encontrado.' } })
      return
    }

    const estoque = Number(livro.estoque?.quantidadeDisponivel ?? livro.quantidadeDisponivel ?? 0)
    if (quantidade > estoque) {
      req.reply({
        statusCode: 409,
        body: {
          status: 409,
          erro: 'Conflict',
          mensagem: 'Quantidade solicitada superior ao estoque disponível.',
          erros: {},
          caminho: `/api/carrinhos/1/itens/${itemId}`,
          timestamp: '2026-10-04T00:00:00Z',
        },
      })
      return
    }

    item.quantidade = quantidade
    item.subtotal = Number(livro.valorVenda || 0) * quantidade
    cart.total = cart.itens.reduce((soma, entry) => soma + Number(entry.subtotal || 0), 0)
    req.reply({ statusCode: 200, body: cart })
  }).as('alterarQuantidade')

  cy.intercept('DELETE', '**/api/carrinhos/1/itens/*', (req) => {
    const itemId = Number(req.url.split('/itens/')[1].split('?')[0])
    cart.itens = cart.itens.filter((item) => Number(item.id) !== itemId)
    cart.total = cart.itens.reduce((soma, item) => soma + Number(item.subtotal || 0), 0)
    req.reply({ statusCode: 204, body: '' })
  }).as('removerItem')

  return { getCart: () => cart }
}

describe('RF0031 / RF0032 / RN0031 — carrinho', () => {
  beforeEach(() => {
    simularFalhaEstoqueAdicao = false
    cy.clearLocalStorage()
    cy.viewport(1280, 1200)
    prepararEstadoCarrinho()
    cy.visit('/livros', {
      onBeforeLoad(win) {
        win.localStorage.setItem('usuario', JSON.stringify({
          uuid: '11111111-1111-4111-8111-111111111111',
          id: '11111111-1111-4111-8111-111111111111',
          perfil: 'CLIENTE',
          ativo: true,
          nome: 'Cliente Teste',
        }))
      },
    })
  })

  it('CENÁRIO 1 — adiciona mais de um livro e exibe ambos no carrinho', () => {
    cy.get('input#quantidade-1').clear().type('2')
    cy.contains('button', 'Adicionar ao carrinho').first().click()
    cy.get('.book-card').eq(1).contains('button', 'Adicionar ao carrinho').click()

    cy.visit('/carrinho')
    cy.contains('Livro A').should('be.visible')
    cy.contains('Livro B').should('be.visible')
  })

  it('CENÁRIO 2 — permite escolher quantidade na adição', () => {
    cy.get('input#quantidade-1').clear().type('3')
    cy.contains('button', 'Adicionar ao carrinho').first().click()
    cy.visit('/carrinho')
    cy.get('[data-testid="cart-item-quantity"]').should('have.text', '3')
  })

  it('CENÁRIO 3 — altera a quantidade no carrinho', () => {
    cy.get('input#quantidade-1').clear().type('1')
    cy.get('.book-card').first().contains('button', 'Adicionar ao carrinho').click()
    cy.visit('/carrinho')
    cy.contains('button', '+').click()
    cy.contains('2').should('be.visible')
  })

  it('CENÁRIO 4 — remove um item e mantém o restante', () => {
    cy.get('input#quantidade-1').clear().type('1')
    cy.contains('button', 'Adicionar ao carrinho').first().click()
    cy.get('.book-card').eq(1).contains('button', 'Adicionar ao carrinho').click()
    cy.visit('/carrinho')

    cy.get('.cart-item').first().contains('button', 'Remover').click()
    cy.contains('Livro A').should('not.exist')
    cy.contains('Livro B').should('be.visible')
  })

  it('CENÁRIO 5 — bloqueia adição acima do estoque', () => {
    cy.get('input#quantidade-1').clear().type('999')
    cy.get('input#quantidade-1').should('have.value', '5')
    cy.contains('button', 'Adicionar ao carrinho').first().click()
    cy.visit('/carrinho')
    cy.get('[data-testid="cart-item-quantity"]').should('have.text', '5')
  })

  it('CENÁRIO 6 — bloqueia alteração no carrinho acima do estoque', () => {
    cy.get('input#quantidade-1').clear().type('1')
    cy.contains('button', 'Adicionar ao carrinho').first().click()
    cy.visit('/carrinho')
    const increaseQuantity = () => {
      cy.get('.cart-item').first().find('button[aria-label="Aumentar quantidade de Livro A"]').click()
      cy.wait('@alterarQuantidade')
    }
    increaseQuantity()
    increaseQuantity()
    increaseQuantity()
    increaseQuantity()
    cy.get('[data-testid="cart-item-quantity"]').should('have.text', '5')
    cy.get('.cart-item').first().find('button[aria-label="Aumentar quantidade de Livro A"]').should('be.disabled')
  })

  it('CENÁRIO 7 — mantém o carrinho consistente quando o backend responde 409 por estoque insuficiente', () => {
    simularFalhaEstoqueAdicao = true
    cy.get('input#quantidade-1').clear().type('1')
    cy.contains('button', 'Adicionar ao carrinho').first().click()
    cy.get('[role="status"]').should('contain', 'Quantidade solicitada superior ao estoque disponível.')
    cy.visit('/carrinho')
    cy.contains('Livro A').should('not.exist')
  })

  it('CENÁRIO 8 — soma quantidades ao re-adicionar o mesmo livro e respeita o estoque', () => {
    cy.get('input#quantidade-1').clear().type('2')
    cy.contains('button', 'Adicionar ao carrinho').first().click()
    cy.get('input#quantidade-1').clear().type('3')
    cy.contains('button', 'Adicionar ao carrinho').first().click()

    cy.visit('/carrinho')
    cy.contains('Livro A').should('be.visible')
    cy.get('[data-testid="cart-item-quantity"]').should('have.text', '5')
    cy.contains('R$ 199,50').should('be.visible')
  })
})
