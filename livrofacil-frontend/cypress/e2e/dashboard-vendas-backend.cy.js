function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
}

describe('Dashboard administrativo integrado ao backend', () => {
  it('exibe o Total geral retornado pelo backend e reconhece pedidos finalizados', () => {
    cy.request('/api/clientes').then(({ status, body }) => {
      expect(status).to.equal(200)
      const admin = body.find((cliente) => cliente.perfil === 'ADMIN')
      expect(admin, 'administrador disponível no backend').to.exist

      cy.intercept('GET', '**/api/pedidos/admin').as('dashboardPedidos')
      cy.intercept('GET', '**/api/clientes').as('dashboardClientes')
      cy.intercept('GET', '**/api/pedidos/admin/relatorios/vendas-por-categoria*').as('dashboardRelatorio')

      cy.visit('/admin', {
        onBeforeLoad(win) {
          win.localStorage.setItem('usuario', JSON.stringify({
            id: admin.id,
            uuid: admin.id,
            nome: admin.nome,
            perfil: admin.perfil,
            ativo: admin.ativo,
          }))
        },
      })

      cy.wait(['@dashboardPedidos', '@dashboardClientes', '@dashboardRelatorio']).then(([pedidos, , relatorio]) => {
        expect(pedidos.response.statusCode).to.equal(200)
        expect(relatorio.response.statusCode).to.equal(200)
        const serieTotal = relatorio.response.body.series.find((serie) => serie.categoriaNome === 'Total geral')
        expect(serieTotal, 'série Total geral').to.exist
        const total = serieTotal.valores.reduce((soma, valor) => soma + Number(valor || 0), 0)
        const quantidadePedidosContabilizados = pedidos.response.body.filter((pedido) => pedido.status !== 'EM_CHECKOUT').length

        cy.get('.admin-kpi-grid')
          .contains('p', 'Vendas')
          .parent()
          .find('p')
          .first()
          .should('have.text', formatarMoeda(total))

        cy.get('.admin-kpi-grid')
          .contains('p', 'Pedidos')
          .parent()
          .find('p')
          .first()
          .should('have.text', String(quantidadePedidosContabilizados))
      })

      cy.wait('@dashboardPedidos').then(({ response }) => {
        expect(response.statusCode).to.equal(200)
        expect(response.body.some((pedido) => pedido.status === 'FINALIZADO')).to.equal(true)
        cy.contains('span', 'Finalizado').should('be.visible')

        if (response.body.some((pedido) => pedido.status === 'ENTREGUE')) {
          cy.contains('span', 'Entregue').should('be.visible')
        }
      })
    })
  })
})
