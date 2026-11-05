const categoriasBase = [
  { id: 1, nome: 'Romance' },
  { id: 2, nome: 'Fantasia' },
  { id: 3, nome: 'Tecnologia' },
]

const ADMIN_UUID = '44f0cf51-2cbe-4f66-9a9d-cd6f7a822c11'

function autenticarUsuario(perfil = 'ADMIN') {
  cy.visit('/admin/relatorios', {
    onBeforeLoad(win) {
      win.localStorage.setItem(
        'usuario',
        JSON.stringify({
          id: perfil === 'ADMIN' ? 'admin-e2e' : 'cliente-e2e',
          uuid: perfil === 'ADMIN' ? ADMIN_UUID : '11111111-1111-4111-8111-111111111111',
          nome: perfil === 'ADMIN' ? 'Admin E2E' : 'Cliente E2E',
          perfil,
          ativo: true,
        }),
      )
    },
  })
}

function prepararRelatorio({
  categorias = categoriasBase,
  meses = ['2026-01', '2026-02', '2026-03'],
  series = [
    { categoriaId: 1, categoriaNome: 'Romance', valores: [150, 200, 250] },
    { categoriaId: 2, categoriaNome: 'Fantasia', valores: [80, 110, 90] },
  ],
  respostaPadrao,
} = {}) {
  const retorno = respostaPadrao || { dataInicio: '2026-01-01', dataFim: '2026-03-31', meses, series }

  cy.intercept('GET', '**/api/livros/opcoes/categorias', {
    statusCode: 200,
    body: categorias,
  }).as('listarCategorias')

  cy.intercept('GET', '**/api/pedidos/admin/relatorios/vendas-por-categoria*', (req) => {
    if (new URL(req.url).searchParams.has('categorias')) req.alias = 'relatorioFiltrado'
    req.reply({
      statusCode: 200,
      body: {
        ...retorno,
        dataInicio: req.query.dataInicio || retorno.dataInicio,
        dataFim: req.query.dataFim || retorno.dataFim,
      },
    })
  }).as('relatorioVendasCategoria')
}

describe('Histórico de vendas por categoria', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.viewport(1280, 1000)
  })

  it('CT001 — consulta uma categoria e valida valores mensais', () => {
    prepararRelatorio({
      meses: ['2026-01', '2026-02', '2026-03'],
      series: [{ categoriaId: 1, categoriaNome: 'Romance', valores: [150.5, 200, 250.75] }],
    })

    autenticarUsuario('ADMIN')
    cy.wait('@listarCategorias')
    cy.wait('@relatorioVendasCategoria')

    cy.contains('button', 'Romance').click()
    cy.contains('button', 'Aplicar filtros').click()

    cy.wait('@relatorioFiltrado').then(({ request, response }) => {
      expect(request.url).to.include('/api/pedidos/admin/relatorios/vendas-por-categoria')
      expect(request.url).to.include(`adminId=${ADMIN_UUID}`)
      expect(request.url).to.match(/dataInicio=\d{4}-\d{2}-\d{2}/)
      expect(request.url).to.match(/dataFim=\d{4}-\d{2}-\d{2}/)
      expect(request.url).to.include('categorias=1')
      expect(response.body.series[0].categoriaNome).to.equal('Romance')
    })

    cy.get('[role="img"]').should('contain.text', 'Romance')
    cy.get('[role="img"]').should('contain.text', 'jan de 2026')
    cy.get('[role="img"]').should('have.attr', 'aria-label').and('contain', 'Romance: jan de 2026: R$ 150,50')
    cy.contains('summary', 'Ver dados do gráfico em tabela').click()
    cy.get('table[aria-label="Valores mensais do relatório de vendas"]').should('contain', 'Romance')
  })

  it('CT002 — compara duas categorias em um mesmo período', () => {
    prepararRelatorio({
      meses: ['2026-01', '2026-02', '2026-03'],
      series: [
        { categoriaId: 1, categoriaNome: 'Romance', valores: [150, 210, 320] },
        { categoriaId: 2, categoriaNome: 'Fantasia', valores: [80, 140, 190] },
      ],
    })

    autenticarUsuario('ADMIN')
    cy.wait('@listarCategorias')
    cy.wait('@relatorioVendasCategoria')

    cy.contains('button', 'Romance').click()
    cy.contains('button', 'Fantasia').click()
    cy.contains('button', 'Aplicar filtros').click()

    cy.wait('@relatorioFiltrado').then(({ request }) => {
      expect(request.url).to.include('categorias=1')
      expect(request.url).to.include('categorias=2')
    })

    cy.contains('summary', 'Ver dados do gráfico em tabela').click()
    cy.get('table[aria-label="Valores mensais do relatório de vendas"]').should('contain', 'Romance')
    cy.get('table[aria-label="Valores mensais do relatório de vendas"]').should('contain', 'Fantasia')
    cy.get('[role="img"]').should('contain.text', 'Romance')
    cy.get('[role="img"]').should('contain.text', 'Fantasia')
  })

  it('CT003 — renderiza o gráfico de linhas com meses, valores e legenda', () => {
    prepararRelatorio({
      meses: ['2026-01', '2026-02', '2026-03'],
      series: [
        { categoriaId: 1, categoriaNome: 'Romance', valores: [100, 0, 350] },
        { categoriaId: 2, categoriaNome: 'Fantasia', valores: [60, 70, 0] },
      ],
    })

    autenticarUsuario('ADMIN')
    cy.wait('@listarCategorias')
    cy.wait('@relatorioVendasCategoria')
    cy.contains('button', 'Romance').click()
    cy.contains('button', 'Fantasia').click()
    cy.contains('button', 'Aplicar filtros').click()
    cy.wait('@relatorioVendasCategoria')

    cy.contains('Vendas por mês').should('be.visible')
    cy.get('[role="img"]').should('have.attr', 'aria-label').and('match', /Romance|Fantasia/)
    cy.get('svg').should('have.length.at.least', 1)
    cy.contains('summary', 'Ver dados do gráfico em tabela').click()
    cy.get('table[aria-label="Valores mensais do relatório de vendas"]').should('be.visible').within(() => {
      cy.contains('th', 'jan de 2026').should('be.visible')
      cy.get('td').then(($cells) => {
        const valores = [...$cells].map((cell) => cell.textContent.replace(/\u00a0/g, ' '))
        expect(valores).to.include('R$ 0,00')
        expect(valores).to.include('R$ 350,00')
      })
    })
  })

  it('CT004 — atualiza os resultados quando o período muda', () => {
    let respostaAtual = {
      dataInicio: '2026-01-01',
      dataFim: '2026-01-31',
      meses: ['2026-01'],
      series: [{ categoriaId: 1, categoriaNome: 'Romance', valores: [100] }],
    }

    cy.intercept('GET', '**/api/livros/opcoes/categorias', {
      statusCode: 200,
      body: categoriasBase,
    }).as('listarCategorias')

    cy.intercept('GET', '**/api/pedidos/admin/relatorios/vendas-por-categoria*', (req) => {
      const parametros = new URL(req.url).searchParams
      const dataInicio = parametros.get('dataInicio') || ''
      const dataFim = parametros.get('dataFim') || ''
      if (dataInicio === '2026-02-01' && dataFim === '2026-02-28') req.alias = 'relatorioFevereiro'

      if (dataInicio === '2026-02-01' && dataFim === '2026-02-28') {
        respostaAtual = {
          dataInicio: '2026-02-01',
          dataFim: '2026-02-28',
          meses: ['2026-02'],
          series: [{ categoriaId: 1, categoriaNome: 'Romance', valores: [430] }],
        }
      }

      req.reply({ statusCode: 200, body: respostaAtual })
    }).as('relatorioVendasCategoria')

    autenticarUsuario('ADMIN')
    cy.wait('@listarCategorias')
    cy.wait('@relatorioVendasCategoria')

    cy.contains('button', 'Romance').click()
    cy.contains('button', 'Aplicar filtros').click()
    cy.wait('@relatorioVendasCategoria')
    cy.get('[role="img"]').should('have.attr', 'aria-label').and('contain', 'Romance: jan de 2026: R$ 100,00')

    cy.get('#relatorio-data-inicio').clear().type('2026-02-01')
    cy.get('#relatorio-data-fim').clear().type('2026-02-28')
    cy.get('#relatorio-data-inicio').should('have.value', '2026-02-01')
    cy.get('#relatorio-data-fim').should('have.value', '2026-02-28')
    cy.contains('button', 'Aplicar filtros').click()

    cy.wait('@relatorioFevereiro').then(({ request, response }) => {
      expect(request.url).to.include('dataInicio=2026-02-01')
      expect(request.url).to.include('dataFim=2026-02-28')
      expect(response.body.series[0].valores).to.deep.equal([430])
    })

    cy.get('[role="img"]').should('have.attr', 'aria-label').and('contain', 'Romance: fev de 2026: R$ 430,00')
  })

  it('CT005 — não contabiliza pedidos fora do status ENTREGUE', () => {
    prepararRelatorio({
      meses: ['2026-03'],
      series: [
        { categoriaId: 1, categoriaNome: 'Romance', valores: [1800] },
        { categoriaId: 2, categoriaNome: 'Fantasia', valores: [0] },
      ],
    })

    autenticarUsuario('ADMIN')
    cy.wait('@listarCategorias')
    cy.contains('button', 'Romance').click()
    cy.contains('button', 'Fantasia').click()
    cy.contains('button', 'Aplicar filtros').click()
    cy.wait('@relatorioVendasCategoria')

    cy.get('[role="img"]').should('contain.text', 'R$ 1.800,00')
    cy.get('[role="img"]').should('not.contain.text', 'R$ 2.500,00')
  })

  it('CT006 — atualiza o relatório quando um pedido passa para ENTREGUE', () => {
    // Fixture state proves the frontend transition/readback contract, not backend/database persistence.
    const pedido = { id: 87, clienteNome: 'Cliente E2E', status: 'PAGAMENTO_APROVADO', total: 119.9 }
    const statusLidos = []

    cy.intercept('GET', '**/api/livros/opcoes/categorias', {
      statusCode: 200,
      body: categoriasBase,
    }).as('listarCategorias')

    cy.intercept('GET', '**/api/pedidos/admin', (req) => {
      statusLidos.push(pedido.status)
      req.reply({ statusCode: 200, body: [{ ...pedido }] })
    }).as('listarPedidosAdmin')

    cy.intercept('PATCH', '**/api/pedidos/admin/87/status', (req) => {
      pedido.status = req.body.status
      req.reply({
        statusCode: 200,
        body: { ...pedido },
      })
    }).as('atualizarStatusPedido')

    cy.intercept('GET', '**/api/pedidos/admin/relatorios/vendas-por-categoria*', (req) => {
      if (new URL(req.url).searchParams.has('categorias')) req.alias = 'relatorioFiltrado'
      const valor = pedido.status === 'ENTREGUE' ? 210 : 0
      req.reply({
        statusCode: 200,
        body: {
          dataInicio: '2026-01-01',
          dataFim: '2026-03-31',
          meses: ['2026-03'],
          series: [{ categoriaId: 1, categoriaNome: 'Romance', valores: [valor] }],
        },
      })
    }).as('relatorioVendasCategoria')

    autenticarUsuario('ADMIN')
    cy.wait('@listarCategorias')
    cy.wait('@relatorioVendasCategoria')
    cy.contains('button', 'Romance').click()
    cy.contains('button', 'Aplicar filtros').click()
    cy.wait('@relatorioFiltrado')
    cy.get('[role="img"]').should('contain.text', 'R$ 0,00')

    cy.visit('/admin/pedidos', {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          'usuario',
          JSON.stringify({ id: 'admin-e2e', uuid: ADMIN_UUID, nome: 'Admin E2E', perfil: 'ADMIN', ativo: true }),
        )
      },
    })
    cy.wait('@listarPedidosAdmin')
    const transicoes = [
      ['EM_SEPARACAO', 'Em separação'],
      ['NA_TRANSPORTADORA', 'Na transportadora'],
      ['EM_ROTA_DE_ENTREGA', 'Em rota de entrega'],
      ['ENTREGUE', 'Entregue'],
    ]
    transicoes.forEach(([status, textoStatus]) => {
      cy.contains('tr', 'Cliente E2E').contains('button', 'Avançar').click()
      cy.wait('@atualizarStatusPedido').then(({ request, response }) => {
        expect(request.body.status).to.equal(status)
        expect(response.body.status).to.equal(status)
      })
      cy.contains('tr', 'Cliente E2E').should('contain', textoStatus)
    })

      cy.wrap(pedido).its('status').should('equal', 'ENTREGUE')
      cy.visit('/admin/pedidos', {
        onBeforeLoad(win) {
          win.localStorage.setItem(
            'usuario',
            JSON.stringify({ id: 'admin-e2e', uuid: ADMIN_UUID, nome: 'Admin E2E', perfil: 'ADMIN', ativo: true }),
          )
        },
      })
      cy.contains('tr', 'Cliente E2E').should('contain', 'Entregue')
      cy.wrap(statusLidos).should('include', 'ENTREGUE')

    cy.visit('/admin/relatorios', {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          'usuario',
          JSON.stringify({ id: 'admin-e2e', uuid: ADMIN_UUID, nome: 'Admin E2E', perfil: 'ADMIN', ativo: true }),
        )
      },
    })
    cy.wait('@listarCategorias')
    cy.wait('@relatorioVendasCategoria')
    cy.contains('button', 'Romance').click()
    cy.contains('button', 'Aplicar filtros').click()
    cy.wait('@relatorioFiltrado')
    cy.get('[role="img"]').should('have.attr', 'aria-label').and('contain', 'Romance: mar de 2026: R$ 210,00')
  })

  it('CT007 — restringe acesso administrativo para ADMIN, CLIENTE e visitante', () => {
    autenticarUsuario('ADMIN')
    cy.get('h1').should('contain.text', 'Relatórios')

    cy.clearLocalStorage()
    cy.visit('/admin/relatorios', {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          'usuario',
          JSON.stringify({ id: 'cliente-e2e', nome: 'Cliente E2E', perfil: 'CLIENTE', ativo: true }),
        )
      },
    })
    cy.location('pathname').should('eq', '/')

    cy.clearLocalStorage()
    cy.visit('/admin/relatorios')
    cy.location('pathname').should('eq', '/login')
  })

  it('CT008 — mede o tempo de resposta da consulta do relatório', () => {
    prepararRelatorio({
      meses: ['2026-01', '2026-02', '2026-03'],
      series: [{ categoriaId: 1, categoriaNome: 'Romance', valores: [100, 200, 300] }],
    })

    const inicio = performance.now()

    autenticarUsuario('ADMIN')
    cy.wait('@listarCategorias')
    cy.contains('button', 'Romance').click()
    cy.contains('button', 'Aplicar filtros').click()

    cy.wait('@relatorioVendasCategoria').then(() => {
      const tempoDecorrido = performance.now() - inicio
      expect(tempoDecorrido).to.be.lessThan(5000)
    })

    cy.get('[role="img"]').should('contain.text', 'Romance')
  })
})
