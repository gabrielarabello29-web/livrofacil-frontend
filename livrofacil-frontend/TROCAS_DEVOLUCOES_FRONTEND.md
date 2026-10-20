# Trocas, devoluções e vouchers no frontend

## Fluxos e comportamento

- Cliente: `/trocas/nova` lista pedidos `ENTREGUE` com `entregueEm` persistido e dentro dos sete dias corridos locais em `America/Sao_Paulo`; envio inclui `clienteId`, `pedidoId`, `itemPedidoId` (ou `livroId`), `tipo`, `quantidade`, `motivo` e `detalhes` opcional. Pedido legado sem data não é elegível e orienta procurar suporte.
- Disponibilidade de unidades é estimada a partir das solicitações do cliente e dos status que comprometem unidade. O servidor continua sendo autoridade para prazo e concorrência.
- Cliente acompanha lista/filtros, detalhe, histórico, justificativa, quantidades e crédito em voucher após conclusão. Vouchers têm lista/detalhe, saldo e valor original, estado, origens, datas, resgate e ação de copiar. Nenhum prazo de expiração é inferido.
- Administração tem filtros server-side, detalhe/histórico, autorização/rejeição apenas em `SOLICITADA`, motivo obrigatório e recebimento parcial com decisão de reposição. A interface só apresenta voucher após resposta concluída.
- Checkout aplica/troca somente um benefício. Uma promoção ou voucher de troca nunca é combinado. Exibe valores retornados pelo backend, com subtotal, desconto e frete separados, preserva o pagamento com vários cartões e mostra saldo residual somente quando recebido na resposta de finalização.

## Identidade e segurança

O `clienteId` continua vindo do usuário restaurado do `localStorage` por `obterClienteId()` e é enviado explicitamente conforme as rotas do contrato. Isso não representa sessão ou autenticação server-side. As proteções de perfil do React são apenas apresentação: as rotas administrativas do backend não aplicam autorização atualmente.

## Limitações do domínio

- Crédito de voucher é baseado em preço histórico bruto unitário vezes quantidade recebida, exclui frete e não desconta rateio de desconto global do pedido. Não é estorno financeiro nem “valor líquido pago”.
- Pedidos `ENTREGUE` antigos sem `entregueEm` persistido são inelegíveis; a interface não inventa data retroativa.
- O backend atual não modela expiração/cancelamento de voucher.
- A UI estima unidades restantes; o backend valida conflitos, prazo, titularidade, consumo, valor, estoque e transação.

## Testes

- Os cenários em `cypress/e2e/trocas-contract.cy.js` (8 testes) e `cypress/e2e/checkout-pagamento-contract.cy.js` (17 testes) usam `cy.intercept` com respostas simuladas. Validam apresentação, interações e formato de requisições no frontend, mas **não** validam o banco, concorrência, titularidade/segurança, autorização real, reposição física de estoque ou transação de reversão do backend. Não há, neste momento, um teste e2e contra backend real declarado por estes specs.
