const clienteId = "11111111-1111-4111-8111-111111111111"

const pedidoId = 42

const carrinhoId = 7

const cartoes = [
  {
    id: 4,
    clienteId,
    nomeTitular: "Joao da Silva",
    tipoCartao: "CREDITO",
    ultimosDigitos: "1111",
    validade: "12/28",
    bandeira: "VISA",
    preferencial: true,
    ativo: true,
  },

  {
    id: 5,
    clienteId,
    nomeTitular: "Maria da Silva",
    tipoCartao: "CREDITO",
    ultimosDigitos: "2222",
    validade: "10/29",
    bandeira: "MASTERCARD",
    preferencial: false,
    ativo: true,
  },
]

const bandeiras = ["VISA", "MASTERCARD"].map((nome) => ({
  id: nome,
  nome,
  disponivel: true,
}))

function criarPedido(overrides = {}) {
  return {
    id: pedidoId,

    clienteId,

    carrinhoId,

    status: "PENDENTE",

    subtotal: 100,

    desconto: 0,

    frete: 19.9,

    total: 119.9,

    cupom: null,

    itens: [
      {
        id: 1,
        itemPedidoId: 701,
        livroId: 10,
        titulo: "Livro E2E",
        quantidade: 1,
        valorUnitario: 100,
        subtotal: 100,
      },
    ],

    ...overrides,
  }
}

function prepararCheckout({ pedido = criarPedido(), aoFinalizar } = {}) {
  let pedidoAtual = pedido

  const cupons = {
    PROMO10: {
      valido: true,
      tipo: "PERCENTUAL",
      valor: 10,
      codigo: "PROMO10",
      mensagem: "Cupom válido",
    },

    PROMO4: {
      valido: true,
      tipo: "PERCENTUAL",
      valor: 4,
      codigo: "PROMO4",
      mensagem: "Cupom válido",
    },

    RESIDUAL: {
      valido: true,
      tipo: "PERCENTUAL",
      valor: 33.33,
      codigo: "RESIDUAL",
      mensagem: "Cupom válido",
    },

    VALE_TROCA: {
      valido: true,
      tipo: "TROCA",
      valor: 150,
      voucherValor: 150,
      voucherResgatadoEm: null,
      codigo: "VALE_TROCA",
      mensagem: "Voucher válido",
    },
  }

  cy.intercept("GET", `**/api/pedidos/${pedidoId}?clienteId=*`, (req) =>
    req.reply({ statusCode: 200, body: pedidoAtual }),
  ).as("buscarPedido")

  cy.intercept("GET", `**/api/clientes/${clienteId}/formas-pagamento`, {
    statusCode: 200,
    body: cartoes,
  }).as("listarCartoes")

  cy.intercept("GET", "**/api/pagamentos/bandeiras", {
    statusCode: 200,
    body: bandeiras,
  }).as("listarBandeiras")

  cy.intercept("GET", `**/api/carrinhos/${carrinhoId}*`, {
    statusCode: 200,

    body: {
      id: carrinhoId,
      itens: [
        {
          id: 1,
          livroId: 10,
          titulo: "Livro E2E",
          quantidade: 1,
          valorUnitario: 100,
          subtotal: 100,
          quantidadeDisponivel: 10,
        },
      ],
      total: 100,
    },
  }).as("buscarCarrinho")

  cy.intercept("POST", "**/api/cupons/validar", (req) => {
    const codigo = String(req.body.codigo || "").toUpperCase()

    req.reply({
      statusCode: 200,
      body: cupons[codigo] || {
        valido: false,
        codigo,
        mensagem: "Cupom inválido",
      },
    })
  }).as("validarCupom")

  cy.intercept(
    "POST",
    `**/api/pedidos/${pedidoId}/cupons?clienteId=*`,
    (req) => {
      const codigo = String(req.body.codigo || "").toUpperCase()

      const descontos = {
        PROMO10:
          pedidoAtual.subtotal === 12
            ? { desconto: 1.2, total: 10.8 }
            : { desconto: 10, total: 109.9 },

        PROMO4: { desconto: 4, total: 115.9 },

        RESIDUAL: { desconto: 4, total: 8 },

        VALE_TROCA: { desconto: 119.9, total: 0, voucherValor: 150 },
      }

      pedidoAtual = { ...pedidoAtual, cupom: codigo, ...descontos[codigo] }

      req.reply({ statusCode: 200, body: pedidoAtual })
    },
  ).as("aplicarCupom")

  cy.intercept(
    "POST",
    `**/api/pedidos/${pedidoId}/finalizar?clienteId=*`,
    (req) => {
      const resposta = aoFinalizar
        ? aoFinalizar(req, pedidoAtual)
        : {
            ...pedidoAtual,
            status: "EM_PROCESSAMENTO",
            pagamentos: req.body.pagamentos,
          }

      pedidoAtual = resposta
      req.reply({ statusCode: 200, body: resposta })
    },
  ).as("finalizarPedido")

  cy.visit("/checkout/pagamento", {
    onBeforeLoad(win) {
      win.localStorage.setItem(
        "usuario",
        JSON.stringify({
          uuid: clienteId,
          id: clienteId,
          nome: "Cliente E2E",
          perfil: "CLIENTE",
          ativo: true,
        }),
      )

      win.localStorage.setItem("pedidoCheckout", String(pedidoId))

      win.localStorage.setItem("carrinhoId", String(carrinhoId))
    },
  })

  cy.wait(["@buscarPedido", "@listarCartoes", "@listarBandeiras"])
}

function aplicarCupom(codigo) {
  cy.get('[data-testid="codigo-cupom"]').clear().type(codigo)

  cy.get('[data-testid="aplicar-cupom"]').click()

  cy.wait("@validarCupom")

  cy.wait("@aplicarCupom")
}

function irParaRevisao() {
  cy.get('[data-testid="revisar-pedido"]').click()

  cy.location("pathname").should("eq", "/checkout/revisao")
}

function confirmarCompra() {
  cy.contains("button", "✓ Confirmar e pagar").click()
}

function prepararSolicitacaoTroca(pedido, solicitacoes = []) {
  cy.intercept("GET", `**/api/pedidos/cliente/${clienteId}`, {
    statusCode: 200,
    body: Array.isArray(pedido) ? pedido : [pedido],
  }).as("pedidosCliente")

  cy.intercept("GET", `**/api/trocas/cliente/${clienteId}`, {
    statusCode: 200,
    body: solicitacoes,
  }).as("trocasCliente")

  cy.intercept("GET", "**/api/livros/44", {
    statusCode: 200,
    body: { id: 44, titulo: "Livro da troca" },
  }).as("livroTroca")

  cy.visit("/trocas/nova", {
    onBeforeLoad(win) {
      win.localStorage.setItem(
        "usuario",
        JSON.stringify({
          uuid: clienteId,
          id: clienteId,
          nome: "Cliente E2E",
          perfil: "CLIENTE",
          ativo: true,
        }),
      )
    },
  })

  cy.wait(["@pedidosCliente", "@trocasCliente"])
}

describe("Fluxos mínimos de vendas, pagamentos, carrinho e trocas", () => {
  beforeEach(() => {
    cy.clearLocalStorage()

    cy.viewport(1280, 1000)
  })

  it("01 — finaliza com um cartão e o administrador aprova o pedido", () => {
    prepararCheckout()

    irParaRevisao()

    confirmarCompra()

    cy.wait("@finalizarPedido").then(({ request, response }) => {
      expect(request.body.pagamentos).to.deep.equal([
        { formaPagamentoId: 4, valor: 119.9, parcelas: 1 },
      ])

      expect(response.body.status).to.equal("EM_PROCESSAMENTO")
    })

    cy.contains("Status: Em processamento").should("be.visible")

    cy.location("pathname").should("eq", "/checkout/sucesso")

    let pedido = {
      id: pedidoId,
      clienteNome: "Cliente E2E",
      total: 119.9,
      status: "EM_PROCESSAMENTO",
    }
    cy.intercept("GET", "**/api/pedidos/admin", {
      statusCode: 200,
      body: [pedido],
    }).as("listarPedidosAdmin")
    cy.intercept("PATCH", `**/api/pedidos/admin/${pedidoId}/status`, (req) => {
      pedido = { ...pedido, status: req.body.status }
      req.reply({ statusCode: 200, body: pedido })
    }).as("aprovarPedido")

    cy.visit("/admin/pedidos", {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          "usuario",
          JSON.stringify({
            id: "admin-e2e",
            nome: "Admin E2E",
            perfil: "ADMIN",
            ativo: true,
          }),
        )
      },
    })
    cy.wait("@listarPedidosAdmin")
    cy.contains("tr", "Cliente E2E").contains("button", "Avançar").click()
    cy.wait("@aprovarPedido").then(({ request, response }) => {
      expect(request.body.status).to.equal("PAGAMENTO_APROVADO")
      expect(response.body.status).to.equal("PAGAMENTO_APROVADO")
    })
    cy.contains("tr", "Cliente E2E").should("contain", "Pagamento aprovado")
  })

  it("02 — bloqueia pagamento dividido quando qualquer cartão fica abaixo de R$ 10,00", () => {
    prepararCheckout()

    cy.contains("button", "+ Dividir pagamento").click()

    cy.get('[data-testid="valor-pagamento-1"]').clear().type("5")

    cy.get('[data-testid="revisar-pedido"]').click()

    cy.get('[role="alert"]').should(
      "contain",
      "Cada cartão deve pagar pelo menos R$ 10,00",
    )

    cy.location("pathname").should("eq", "/checkout/pagamento")

    cy.get("@finalizarPedido.all").should("have.length", 0)
  })

  it("03 — aplica um cupom promocional por pedido e aceita saldo residual abaixo de R$ 10,00", () => {
    prepararCheckout({
      pedido: criarPedido({ subtotal: 12, frete: 0, total: 12 }),
    })

    aplicarCupom("PROMO10")
    aplicarCupom("RESIDUAL")

    cy.get('[role="status"]').should("contain", "Código aplicado: RESIDUAL")

    cy.get("@validarCupom.all").should("have.length", 2)
    cy.get("@aplicarCupom.all").should("have.length", 2)
    cy.contains("Desconto (RESIDUAL)").parent().should("contain", "- R$ 4,00")
    cy.contains("Desconto (PROMO10)").should("not.exist")
    cy.contains("Total").parent().should("contain", "R$ 8,00")

    cy.get('[data-testid="valor-pagamento-1"]').should("have.value", "8")

    irParaRevisao()

    confirmarCompra()

    cy.wait("@finalizarPedido")
      .its("request.body.pagamentos")
      .should("deep.equal", [{ formaPagamentoId: 4, valor: 8, parcelas: 1 }])

    cy.location("pathname").should("eq", "/checkout/sucesso")
  })

  it("04 — quita com voucher acima do total e verifica o saldo residual emitido", () => {
    prepararCheckout({
      aoFinalizar: (req, pedidoAtual) => ({
        ...pedidoAtual,

        status: "EM_PROCESSAMENTO",

        pagamentos: req.body.pagamentos,

        voucherSaldoGerado: {
          codigo: "TR-NOVO",
          valor: 30.1,
          resgatadoEm: null,
        },
      }),
    })

    aplicarCupom("VALE_TROCA")

    cy.contains("O cupom ou voucher cobriu o valor total do pedido.").should(
      "be.visible",
    )

    irParaRevisao()

    confirmarCompra()

    cy.wait("@finalizarPedido").then(({ request, response }) => {
      expect(request.body.pagamentos).to.deep.equal([])

      expect(response.body.voucherSaldoGerado).to.deep.equal({
        codigo: "TR-NOVO",
        valor: 30.1,
        resgatadoEm: null,
      })
    })
  })

  it("05 — não conclui pedido REPROVADO e mantém os itens disponíveis no carrinho", () => {
    prepararCheckout({
      aoFinalizar: (req, pedidoAtual) => ({
        ...pedidoAtual,
        status: "REPROVADA",
        pagamentos: req.body.pagamentos,
      }),
    })

    irParaRevisao()

    confirmarCompra()

    cy.wait("@finalizarPedido")
      .its("response.body.status")
      .should("eq", "REPROVADA")

    cy.get('[role="alert"]').should(
      "contain",
      "O backend retornou o status REPROVADA",
    )

    cy.location("pathname").should("eq", "/checkout/revisao")

    cy.get("@finalizarPedido.all").should("have.length", 1)

    cy.intercept("GET", "**/api/carrinhos/7*", {
      statusCode: 200,
      body: {
        id: carrinhoId,
        itens: [
          {
            id: 1,
            livroId: 10,
            titulo: "Livro E2E",
            quantidade: 1,
            valorUnitario: 100,
            subtotal: 100,
          },
        ],
        total: 100,
      },
    }).as("buscarCarrinhoAposReprovacao")
    cy.intercept("GET", "**/api/livros/10/estoque", {
      statusCode: 200,
      body: { livroId: 10, quantidadeDisponivel: 10 },
    }).as("consultarEstoqueAposReprovacao")
    cy.visit("/carrinho")
    cy.wait("@buscarCarrinhoAposReprovacao")
    cy.wait("@consultarEstoqueAposReprovacao")
    cy.contains(".cart-item", "Livro E2E").should("be.visible")
    cy.contains("button", "Finalizar compra").should("be.enabled")
  })

  it("06 — exibe carrinho vazio e desativa compra após a expiração dos itens", () => {
    cy.intercept("GET", "**/api/carrinhos/7*", {
      statusCode: 200,
      body: {
        id: carrinhoId,
        itens: [],
        total: 0,
        itensExpirados: ["Livro E2E"],
      },
    }).as("buscarCarrinho")

    cy.visit("/carrinho", {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          "usuario",
          JSON.stringify({
            uuid: clienteId,
            id: clienteId,
            nome: "Cliente E2E",
            perfil: "CLIENTE",
            ativo: true,
          }),
        )

        win.localStorage.setItem("carrinhoId", String(carrinhoId))
      },
    })

    cy.wait("@buscarCarrinho")

    cy.contains("Seu carrinho está vazio").should("be.visible")

    cy.contains("Livro E2E").should("not.exist")

    cy.contains("button", "Finalizar compra").should("not.exist")
  })

  it("07 — administrador percorre os status de expedição até ENTREGUE", () => {
    let pedido = {
      id: 87,
      clienteNome: "Cliente E2E",
      total: 119.9,
      status: "PAGAMENTO_APROVADO",
    }

    cy.intercept("GET", "**/api/pedidos/admin", (req) =>
      req.reply({ statusCode: 200, body: [pedido] }),
    ).as("listarPedidosAdmin")

    cy.intercept("PATCH", "**/api/pedidos/admin/87/status", (req) => {
      pedido = { ...pedido, status: req.body.status }

      req.reply({ statusCode: 200, body: pedido })
    }).as("atualizarStatus")

    cy.visit("/admin/pedidos", {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          "usuario",
          JSON.stringify({
            id: "admin-e2e",
            nome: "Admin E2E",
            perfil: "ADMIN",
            ativo: true,
          }),
        )
      },
    })

    cy.wait("@listarPedidosAdmin")
    const transicoes = [
      ["EM_SEPARACAO", "Em separação"],
      ["NA_TRANSPORTADORA", "Na transportadora"],
      ["EM_ROTA_DE_ENTREGA", "Em rota de entrega"],
      ["ENTREGUE", "Entregue"],
    ]
    transicoes.forEach(([status, textoStatus]) => {
      cy.contains("tr", "Cliente E2E").contains("button", "Avançar").click()

      cy.wait("@atualizarStatus").then(({ request, response }) => {
        expect(request.body.status).to.equal(status)
        expect(response.body.status).to.equal(status)
      })
      cy.contains("tr", "Cliente E2E").should("contain", textoStatus)
    })
  })

  it("08 — bloqueia solicitação para pedidos não entregues mesmo com data de entrega recente", () => {
    const entregueEm = new Date().toISOString()
    const pedidos = [
      { id: 80, status: "EM_PROCESSAMENTO", entregueEm },
      { id: 81, status: "PAGAMENTO_APROVADO", entregueEm },
      { id: 82, status: "NA_TRANSPORTADORA", entregueEm },
      {
        id: 83,
        status: "ENTREGUE",
        entregueEm,
        itens: [{ itemPedidoId: 703, livroId: 44, quantidade: 1 }],
      },
    ].map((pedido, index) => ({
      ...pedido,
      itens: pedido.itens || [
        { itemPedidoId: 700 + index, livroId: 44, quantidade: 1 },
      ],
    }))

    prepararSolicitacaoTroca(pedidos)

    cy.get('[data-testid="troca-pedido"] option').should("have.length", 2)

    cy.get('[data-testid="troca-pedido"] option')
      .eq(1)
      .should("have.value", "83")
    cy.get('[data-testid="troca-pedido"]').select("83")
    cy.get('[data-testid="troca-item"] option').should("have.length", 2)
    cy.get('[data-testid="troca-item"]').select("itemPedidoId:703")
    cy.get('[data-testid="troca-motivo"]').select("Produto danificado")
    cy.get('[data-testid="enviar-solicitacao-troca"]').should("be.enabled")
  })

  it("09 — solicita troca parcial de um item e troca total de todos os itens do pedido", () => {
    const pedidoParcial = {
      id: 86,
      status: "ENTREGUE",
      entregueEm: new Date().toISOString(),
      itens: [
        {
          itemPedidoId: 701,
          livroId: 44,
          titulo: "Livro da troca",
          quantidade: 3,
        },
      ],
    }
    const pedidoTotal = {
      id: 87,
      status: "ENTREGUE",
      entregueEm: new Date().toISOString(),
      itens: [
        { itemPedidoId: 711, livroId: 44, titulo: "Livro A", quantidade: 1 },
        { itemPedidoId: 712, livroId: 45, titulo: "Livro B", quantidade: 2 },
      ],
    }
    let numeroSolicitacoes = 0

    cy.intercept("GET", `**/api/pedidos/cliente/${clienteId}`, (req) =>
      req.reply({
        statusCode: 200,
        body: [pedidoParcial, pedidoTotal],
      }),
    ).as("pedidosCliente")
    cy.intercept("GET", `**/api/trocas/cliente/${clienteId}`, {
      statusCode: 200,
      body: [],
    }).as("trocasCliente")
    cy.intercept("GET", "**/api/livros/44", {
      statusCode: 200,
      body: { id: 44, titulo: "Livro A" },
    }).as("livro44")
    cy.intercept("GET", "**/api/livros/45", {
      statusCode: 200,
      body: { id: 45, titulo: "Livro B" },
    }).as("livro45")
    cy.intercept("POST", "**/api/trocas", (req) => {
      numeroSolicitacoes += 1

      req.reply({
        statusCode: 201,
        body: { id: 500 + numeroSolicitacoes, ...req.body, status: "EM_TROCA" },
      })
    }).as("solicitarTroca")

    cy.visit("/trocas/nova", {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          "usuario",
          JSON.stringify({
            uuid: clienteId,
            id: clienteId,
            nome: "Cliente E2E",
            perfil: "CLIENTE",
            ativo: true,
          }),
        )
      },
    })
    cy.wait(["@pedidosCliente", "@trocasCliente"])
    cy.wait(["@livro44", "@livro45"])

    cy.get('[data-testid="troca-pedido"]').select("86")

    cy.get('[data-testid="troca-item"]').select("itemPedidoId:701")

    cy.get('[data-testid="troca-quantidade"]').clear().type("1")

    cy.get('[data-testid="troca-motivo"]').select("Produto danificado")

    cy.get('[data-testid="enviar-solicitacao-troca"]').click()

    cy.wait("@solicitarTroca").then(({ request, response }) => {
      expect(request.body).to.include({
        pedidoId: 86,
        itemPedidoId: 701,
        quantidade: 1,
      })
      expect(response.body.status).to.equal("EM_TROCA")
    })

    cy.visit("/trocas/nova", {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          "usuario",
          JSON.stringify({
            uuid: clienteId,
            id: clienteId,
            nome: "Cliente E2E",
            perfil: "CLIENTE",
            ativo: true,
          }),
        )
      },
    })

    cy.wait(["@pedidosCliente", "@trocasCliente"])
    cy.wait(["@livro44", "@livro45"])

    cy.get('[data-testid="troca-pedido"]').select("87")

    cy.get('[data-testid="troca-item"]').select("itemPedidoId:711")

    cy.get('[data-testid="troca-quantidade"]').clear().type("1")

    cy.get('[data-testid="troca-motivo"]').select("Produto danificado")

    cy.get('[data-testid="enviar-solicitacao-troca"]').click()

    cy.wait("@solicitarTroca").its("request.body").should("include", {
      pedidoId: 87,
      itemPedidoId: 711,
      quantidade: 1,
    })

    cy.visit("/trocas/nova", {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          "usuario",
          JSON.stringify({
            uuid: clienteId,
            id: clienteId,
            nome: "Cliente E2E",
            perfil: "CLIENTE",
            ativo: true,
          }),
        )
      },
    })
    cy.wait(["@pedidosCliente", "@trocasCliente"])
    cy.wait(["@livro44", "@livro45"])
    cy.get('[data-testid="troca-pedido"]').select("87")
    cy.get('[data-testid="troca-item"]').select("itemPedidoId:712")
    cy.get('[data-testid="troca-quantidade"]').clear().type("2")
    cy.get('[data-testid="troca-motivo"]').select("Produto danificado")
    cy.get('[data-testid="enviar-solicitacao-troca"]').click()
    cy.wait("@solicitarTroca").then(({ request, response }) => {
      expect(request.body).to.include({
        pedidoId: 87,
        itemPedidoId: 712,
        quantidade: 2,
      })
      expect(response.body.status).to.equal("EM_TROCA")
    })

    cy.get("@solicitarTroca.all").should("have.length", 3)
  })

  it("10 — cliente solicita, administrador autoriza e recebe, gerando voucher", () => {
    let troca = null
    let vouchers = []

    cy.intercept("GET", `**/api/pedidos/cliente/${clienteId}`, {
      statusCode: 200,
      body: [
        {
          id: 86,
          status: "ENTREGUE",
          entregueEm: new Date().toISOString(),
          itens: [
            {
              itemPedidoId: 701,
              livroId: 44,
              titulo: "Livro da troca",
              quantidade: 1,
            },
          ],
        },
      ],
    }).as("pedidoEntregueCliente")
    cy.intercept("GET", `**/api/trocas/cliente/${clienteId}`, (req) =>
      req.reply({ statusCode: 200, body: troca ? [troca] : [] }),
    ).as("listarTrocasCliente")
    cy.intercept("GET", `**/api/trocas/cliente/${clienteId}/vouchers`, (req) =>
      req.reply({ statusCode: 200, body: vouchers }),
    ).as("listarVouchersCliente")
    cy.intercept("GET", "**/api/livros/44", {
      statusCode: 200,
      body: { id: 44, titulo: "Livro da troca" },
    }).as("livroTroca")
    cy.intercept("POST", "**/api/trocas", (req) => {
      troca = {
        id: 603,
        ...req.body,
        clienteNome: "Cliente E2E",
        titulo: "Livro da troca",
        quantidadeSolicitada: req.body.quantidade,
        status: "SOLICITADA",
      }
      req.reply({ statusCode: 201, body: troca })
    }).as("solicitarTroca")

    cy.visit("/trocas/nova", {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          "usuario",
          JSON.stringify({
            uuid: clienteId,
            id: clienteId,
            nome: "Cliente E2E",
            perfil: "CLIENTE",
            ativo: true,
          }),
        )
      },
    })
    cy.wait(["@pedidoEntregueCliente", "@listarTrocasCliente"])
    cy.wait("@livroTroca")
    cy.get('[data-testid="troca-pedido"]').select("86")
    cy.get('[data-testid="troca-item"]').select("itemPedidoId:701")
    cy.get('[data-testid="troca-motivo"]').select("Produto danificado")
    cy.get('[data-testid="enviar-solicitacao-troca"]').click()
    cy.wait("@solicitarTroca")
      .its("response.body.status")
      .should("eq", "SOLICITADA")

    cy.visit("/trocas", {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          "usuario",
          JSON.stringify({
            uuid: clienteId,
            id: clienteId,
            nome: "Cliente E2E",
            perfil: "CLIENTE",
            ativo: true,
          }),
        )
      },
    })
    cy.wait(["@listarTrocasCliente", "@listarVouchersCliente"])
    cy.contains("Solicitação #603").should("be.visible")
    cy.contains("Solicitada").should("be.visible")

    cy.intercept({ method: "GET", pathname: "/api/trocas" }, (req) =>
      req.reply({ statusCode: 200, body: troca ? [troca] : [] }),
    ).as("listarTrocasAdmin")
    cy.intercept("PATCH", "**/api/trocas/603/autorizar", (req) => {
      troca = {
        ...troca,
        status: "AGUARDANDO_RECEBIMENTO",
      }
      req.reply({ statusCode: 200, body: troca })
    }).as("autorizarTroca")
    cy.intercept("PATCH", "**/api/trocas/603/receber", (req) => {
      expect(req.body).to.deep.equal({
        retornarEstoque: true,
        quantidadeRecebida: 1,
      })
      troca = {
        ...troca,
        status: "TROCADO",
        voucherCodigo: "TR-603",
        voucherValor: 32.5,
        quantidadeRecebida: 1,
      }
      req.reply({ statusCode: 200, body: troca })
    }).as("receberTroca")
    cy.visit("/admin/trocas", {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          "usuario",
          JSON.stringify({
            id: "admin-e2e",
            nome: "Admin E2E",
            perfil: "ADMIN",
            ativo: true,
          }),
        )
      },
    })

    cy.wait("@listarTrocasAdmin")

    cy.get('[data-testid="autorizar-troca-603"]').click()

    cy.wait("@autorizarTroca").then(({ request, response }) => {
      expect(request.method).to.equal("PATCH")
      expect(response.body.status).to.equal("AGUARDANDO_RECEBIMENTO")
    })

    cy.wait("@listarTrocasAdmin")
    cy.contains("Aguardando recebimento").should("be.visible")

    cy.visit("/trocas", {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          "usuario",
          JSON.stringify({
            uuid: clienteId,
            id: clienteId,
            nome: "Cliente E2E",
            perfil: "CLIENTE",
            ativo: true,
          }),
        )
      },
    })
    cy.wait(["@listarTrocasCliente", "@listarVouchersCliente"])
    cy.contains("Aguardando recebimento").should("be.visible")

    cy.visit("/admin/trocas", {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          "usuario",
          JSON.stringify({
            id: "admin-e2e",
            nome: "Admin E2E",
            perfil: "ADMIN",
            ativo: true,
          }),
        )
      },
    })
    cy.wait("@listarTrocasAdmin")
    cy.get('[data-testid="recebida-troca-603"]').click()

    cy.get('[data-testid="retornar-estoque-troca"]').check()

    cy.get('[data-testid="confirmar-recebimento-troca"]').click()

    cy.wait("@receberTroca").then(({ request, response }) => {
      expect(request.body.retornarEstoque).to.equal(true)

      expect(response.body).to.include({
        status: "TROCADO",
        voucherCodigo: "TR-603",
      })
      vouchers = [
        {
          id: 603,
          codigo: response.body.voucherCodigo,
          tipo: "TROCA",
          status: "DISPONIVEL",
          valor: response.body.voucherValor,
          saldo: response.body.voucherValor,
          trocaId: response.body.id,
        },
      ]
    })
    cy.contains('[data-testid="voucher-troca-603"]', "TR-603").should(
      "be.visible",
    )

    cy.visit("/trocas", {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          "usuario",
          JSON.stringify({
            uuid: clienteId,
            id: clienteId,
            nome: "Cliente E2E",
            perfil: "CLIENTE",
            ativo: true,
          }),
        )
      },
    })
    cy.wait(["@listarTrocasCliente", "@listarVouchersCliente"])
    cy.contains('[data-testid="voucher-perfil"]', "TR-603").should(
      "contain",
      "R$ 32,50",
    )
  })

  it("11 — aceita em nova compra o voucher de troca previamente emitido", () => {
    const voucherGerado = { codigo: "TR-603", valor: 32.5, resgatadoEm: null }

    prepararCheckout({
      aoFinalizar: (req, pedidoAtual) => ({
        ...pedidoAtual,
        status: "EM_PROCESSAMENTO",
        pagamentos: req.body.pagamentos,
      }),
    })

    cy.intercept("POST", "**/api/cupons/validar", {
      statusCode: 200,

      body: {
        valido: true,
        tipo: "TROCA",
        valor: voucherGerado.valor,
        voucherValor: voucherGerado.valor,
        voucherResgatadoEm: null,
        codigo: voucherGerado.codigo,
      },
    }).as("validarVoucherTroca")

    cy.intercept(
      "POST",
      `**/api/pedidos/${pedidoId}/cupons?clienteId=*`,
      (req) => {
        expect(req.body.codigo).to.equal(voucherGerado.codigo)

        req.reply({
          statusCode: 200,
          body: criarPedido({
            cupom: voucherGerado.codigo,
            desconto: voucherGerado.valor,
            total: 87.4,
          }),
        })
      },
    ).as("aplicarVoucherTroca")

    cy.get('[data-testid="codigo-cupom"]').clear().type(voucherGerado.codigo)

    cy.get('[data-testid="aplicar-cupom"]').click()

    cy.wait("@validarVoucherTroca")

    cy.wait("@aplicarVoucherTroca")

    cy.contains(`Código aplicado: ${voucherGerado.codigo}`).should("be.visible")

    cy.get('[data-testid="valor-pagamento-1"]').should("have.value", "87.4")
  })
})
