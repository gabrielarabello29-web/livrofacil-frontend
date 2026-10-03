# Documento para IA da dupla: alinhamento frontend/backend

Este arquivo foi preparado para orientar uma IA de frontend e outra de backend a trabalhar no mesmo contrato, sem assumir endpoints não confirmados.

## Estado do projeto

O frontend tinha várias telas de fluxo antigo e mocks locais. O fluxo ativo do app está em rotas do checkout, pedidos e troca, com uso real de serviços e APIs.

O objetivo desta revisão foi alinhar o front ao contrato atual do backend, especialmente em:

- clienteId em UUID/string
- cupom/voucher aplicado ao pedido
- troca e voucher emitido no recebimento
- regras de finalização do pedido
- uso de IDs numéricos para entidades do domínio

## Contrato atual confirmado no backend

### 1) Identificadores

- `clienteId` = UUID em string
- `pedidoId`, `carrinhoId`, `enderecoEntregaId`, `livroId`, `itemPedidoId`, `formaPagamentoId` = números
- O frontend não deve usar `usuario.id` como se fosse UUID nem misturar os dois tipos

### 2) Troca

Solicitação:

- `POST /api/trocas`
- payload esperado:
  - `clienteId` (UUID string)
  - `pedidoId` (number)
  - `motivo` (string)
  - `detalhes` (opcional)
  - `itemPedidoId` ou `livroId`
  - `produtoId` também é aceito como alias de `livroId`

Regras:

- pedido precisa pertencer ao cliente informado
- pedido precisa estar `ENTREGUE`
- item não pode ter outra troca aberta/concluída
- troca recusada pode ser solicitada novamente

Estados:

- `SOLICITADA`
- `AUTORIZADA`
- `RECUSADA`
- `TROCADA`

Administração:

- `PATCH /api/trocas/{id}/autorizar`
- `PATCH /api/trocas/{id}/recusar` com `{ "motivo": "..." }`
- `PATCH /api/trocas/{id}/receber` com `{ "retornarEstoque": true|false }`

### 3) Voucher

- emitido ao receber uma troca autorizada
- resposta da troca contém `voucherCodigo` e `voucherValor`
- código tem formato `TR-` + 16 hexadecimais em maiúsculas
- o valor é preço unitário da compra x quantidade
- possui vínculo com cliente e troca
- não tem expiração implementada
- pode ser usado uma vez em um pedido do mesmo cliente
- é consumido na finalização

Consulta:

- `GET /api/trocas`
- `GET /api/trocas/cliente/{clienteId}`

Não existe endpoint separado de voucher.

### 4) Cupom e pagamento

Validação:

- `POST /api/cupons/validar`
- payload: `{ "codigo": "..." }`
- resposta esperada:
  {
    "valido": true,
    "tipo": "PERCENTUAL",
    "valor": 10,
    "codigo": "DESC10",
    "mensagem": "Cupom valido"
  }

Importante:

- cupom comum: `tipo = PERCENTUAL`
- voucher: `tipo = FIXO`
- código inválido ou já usado => `valido: false`
- não existe `GET /cupons`

Aplicação ao pedido:

- `POST /api/pedidos/{pedidoId}/cupons?clienteId={uuid}`
- body: `{ "codigo": "..." }`
- resposta: pedido atualizado com `subtotal`, `desconto` e `total`

Finalização:

- a soma dos pagamentos deve corresponder ao total atualizado
- se o voucher zerar o total, `pagamentos: []` é aceitável
- com saldo positivo, é necessário informar cartão

### 5) Livros

- `POST /api/livros`
- `PUT /api/livros/{id}`
- relações enviadas por ID, não por objeto aninhado
- capa = URL HTTP(S)
- payload mínimo:

{
  "codigo": "...",
  "titulo": "...",
  "ano": 2024,
  "edicao": 1,
  "isbn": "...",
  "numeroPaginas": 200,
  "sinopse": "...",
  "imagemUrl": "https://...",
  "codigoBarras": "...",
  "valorVenda": 49.90,
  "ativo": true,
  "autorId": 1,
  "editoraId": 1,
  "grupoPrecificacaoId": 1,
  "categoriaIds": [1],
  "dimensao": {
    "altura": 20,
    "largura": 14,
    "profundidade": 2,
    "peso": 0.4
  }
}

### 6) Pedidos

- `POST /api/pedidos/iniciar`
- payload esperado:
  - `clienteId` UUID string
  - `carrinhoId` number
  - `enderecoEntregaId` number
  - `enderecoCobranca` string
  - `cupom` opcional

Status aceitos:

- `PENDENTE`
- `AGUARDANDO_PAGAMENTO`
- `EM_CHECKOUT`
- `EM_PROCESSAMENTO`
- `PAGAMENTO_APROVADO`
- `EM_SEPARACAO`
- `NA_TRANSPORTADORA`
- `EM_ROTA_DE_ENTREGA`
- `ENTREGUE`
- `FINALIZADO`
- `CANCELADO`

### 7) Autenticação e CORS

- backend atual não exige token/cookie
- não aplica autorização por perfil
- `clienteId` é UUID/string
- CORS aceita `http://localhost:5173` para `/api/**`
- aceita métodos `GET`, `POST`, `PUT`, `PATCH`, `DELETE` e `OPTIONS`
- não aceita credenciais e não expõe header de Authorization

## O que foi ajustado no frontend

### A) UUID de cliente

Ajustei a extração de clienteId para considerar apenas UUID válido.

Arquivos impactados:

- [src/features/auth/context/AuthContext.jsx](src/features/auth/context/AuthContext.jsx)
- [src/features/carrinho/context/CarrinhoContext.jsx](src/features/carrinho/context/CarrinhoContext.jsx)
- [src/features/checkout/pages/CheckoutEnderecoPage.jsx](src/features/checkout/pages/CheckoutEnderecoPage.jsx)
- [src/features/checkout/pages/CheckoutPagamentoPage.jsx](src/features/checkout/pages/CheckoutPagamentoPage.jsx)
- [src/features/checkout/pages/CheckoutRevisaoPage.jsx](src/features/checkout/pages/CheckoutRevisaoPage.jsx)
- [src/features/pedidos/pages/cliente/MeusPedidosPage.jsx](src/features/pedidos/pages/cliente/MeusPedidosPage.jsx)
- [src/features/pedidos/pages/cliente/MeuPedidoDetalhesPage.jsx](src/features/pedidos/pages/cliente/MeuPedidoDetalhesPage.jsx)
- [src/features/cliente/pages/Perfil.jsx](src/features/cliente/pages/Perfil.jsx)
- [src/app/AppRoutes.jsx](src/app/AppRoutes.jsx)

### B) Cupom/voucher no checkout

Alterei a lógica para aplicar cupom/voucher antes de finalizar o pedido e considerar o total atualizado vindo do backend.

Arquivos:

- [src/features/cupom/api/cupomService.js](src/features/cupom/api/cupomService.js)
- [src/features/checkout/pages/CheckoutPagamentoPage.jsx](src/features/checkout/pages/CheckoutPagamentoPage.jsx)
- [src/features/checkout/pages/CheckoutRevisaoPage.jsx](src/features/checkout/pages/CheckoutRevisaoPage.jsx)
- [src/features/checkout/api/checkoutApi.js](src/features/checkout/api/checkoutApi.js)
- [src/features/checkout/components/CheckoutChrome.jsx](src/features/checkout/components/CheckoutChrome.jsx)

### C) Troca e voucher

A tela de troca do cliente foi ligada ao serviço real e a lista exibe `voucherCodigo` e `voucherValor` quando vierem do backend.

Arquivos:

- [src/features/troca/pages/cliente/SolicitarTroca.jsx](src/features/troca/pages/cliente/SolicitarTroca.jsx)
- [src/features/troca/pages/cliente/MinhasTrocas.jsx](src/features/troca/pages/cliente/MinhasTrocas.jsx)
- [src/features/troca/pages/admin/Trocas.jsx](src/features/troca/pages/admin/Trocas.jsx)
- [src/features/troca/api/trocaService.js](src/features/troca/api/trocaService.js)

### D) API helper genérico

Habilitei query params em `POST`, `PUT`, `PATCH` e `DELETE` no helper global, para permitir casos como aplicar cupom com `?clienteId=...` sem formar URL manualmente errada.

Arquivo:

- [src/shared/api/api.js](src/shared/api/api.js)

### E) Documentação do contrato

Arquivo adicionado:

- [INTEGRACAO_FRONT_BACK.md](INTEGRACAO_FRONT_BACK.md)

## O que ainda precisa ser confirmado com o backend

- `POST /api/pedidos/{pedidoId}/cupons?clienteId={uuid}` retorna `subtotal`, `desconto` e `total` reais
- `POST /api/pedidos/{pedidoId}/finalizar?clienteId={uuid}` aceita `pagamentos: []` somente quando total zero
- `GET /api/trocas/cliente/{clienteId}` retorna estrutura real com voucher
- `PATCH /api/trocas/{id}/receber` retorna `voucherCodigo` e `voucherValor`
- `POST /api/trocas` aceita `itemPedidoId` e `livroId` em payload real
- `GET /api/cupons` ainda não existe do backend; telas de cupons listando dados de cliente/admin devem permanecer sem integração ou funcionar via mock temporário até o contrato existir

## O que está pronto para teste local

- autenticação e UUID do cliente
- início e revisão de checkout
- cupom/voucher aplicado ao pedido
- trocas ligadas ao backend
- listagem de trocas com voucher
- build local do frontend sem falhas de compilação

## Verificações locais executadas

- testes do checkout passaram
- testes de auth/carrinho passaram
- build do Vite finalizou com sucesso

Se a dupla for usar IA, esta é a referência principal para dar contexto e evitar que a IA invente endpoints ou esqueça que `clienteId` é UUID, não número.
