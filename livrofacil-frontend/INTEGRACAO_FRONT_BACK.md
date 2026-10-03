# Checklist de integração Frontend e Backend

Este documento registra o processo que devemos seguir em toda integração do LivroFácil. Os caminhos e contratos abaixo refletem o código atual do frontend e o contrato de backend fornecido para esta tarefa. Se o backend mudar, atualize este arquivo e os testes junto com a alteração.

## Antes de implementar

### O backend precisa informar

Para cada operação, forneça e confirme:

- Método HTTP e caminho completo relativo a `/api`, incluindo parâmetros de rota e query string.
- Exemplo de request JSON e response JSON de sucesso, com tipos de cada campo.
- Formato de erros, códigos HTTP e erros associados a campos.
- Tipo e origem dos identificadores: UUID/string ou número; não use apenas o nome genérico `id`.
- Regras de validação, autorização, transições de status, limites, expiração, uso único e idempotência.
- Efeitos persistidos e entidades atualizadas, como estoque, pagamento, pedido ou voucher.
- Requisitos de autenticação, CORS, headers e ambientes/URLs.
- Como listar, paginar, filtrar e consultar o registro depois da operação.

Quando algo não existir, declare explicitamente que não há endpoint ou que ainda não está implementado. Não deduzir contrato a partir do nome de uma tela ou de um método isolado do frontend.

### O frontend precisa fazer

- Encontrar a rota ativa em `src/app/AppRoutes.jsx`; arquivos não registrados podem ser telas legadas e não participam do fluxo atual.
- Centralizar chamadas na API/service da funcionalidade e enviar somente os campos e tipos acordados.
- Representar carregamento, sucesso, erro e estado vazio; não simular sucesso após falha da API.
- Tratar dados retornados pelo backend como fonte do total, status e identificadores persistidos.
- Manter mocks apenas em testes ou indicar claramente quando uma tela permanece demonstrativa.
- Testar o payload/URL do serviço e o comportamento da tela; validar também com o backend executando.

## Contrato confirmado

### Identificadores e acesso

- `clienteId` é UUID em string. Obter pelo campo `usuario.uuid`; só aceitar `usuario.id` como fallback quando ele próprio for string. IDs de pedido, livro, carrinho, endereço, item de pedido e forma de pagamento são números.
- O backend atual não exige token/cookie e não aplica autorização de perfil às rotas administrativas. A proteção `ProtectedRoute` do frontend é controle de navegação, não segurança de API.
- CORS permite a origem local `http://localhost:5173` para `/api/**`; também é possível usar o proxy `/api` configurado no Vite.

### Livros

- Cadastro e edição existentes: `POST /livros` e `PUT /livros/{id}`.
- Enviar relações por IDs (`autorId`, `editoraId`, `grupoPrecificacaoId`, `categoriaIds`); capa é `imagemUrl` HTTP(S), sem upload.
- Opções: `GET /livros/opcoes/autores`, `/editoras`, `/categorias` e `/grupos-precificacao`.
- Cadastro cria estoque inicial; atualização do estoque é operação separada em `PUT /livros/{id}/estoque`.
- Antes de mudar o formulário, comparar o payload de `src/features/livros/utils/livroFormatters.js` com `LivroRequest.java` no backend.

### Pedidos e pagamento

- Iniciar: `POST /pedidos/iniciar` com `clienteId` UUID, `carrinhoId` numérico, `enderecoEntregaId` numérico, `enderecoCobranca` string e `cupom` opcional. O pedido fica em `EM_CHECKOUT`, com reserva de 30 minutos.
- Aplicar código: `POST /pedidos/{pedidoId}/cupons?clienteId={uuid}` com `{ "codigo": "..." }`. A resposta contém o pedido atualizado (`subtotal`, `desconto`, `total`).
- Finalizar: `POST /pedidos/{pedidoId}/finalizar?clienteId={uuid}`. Pagamentos de cartão devem somar o `total` atualizado. `pagamentos: []` só é aceito quando o voucher zerou o total; com saldo positivo, deve haver cartão.
- A listagem administrativa é `GET /pedidos/admin`; a tela atual espera uma lista com cliente, status, totais, itens e pagamentos.
- Status possíveis incluem `PENDENTE`, `AGUARDANDO_PAGAMENTO`, `EM_CHECKOUT`, `EM_PROCESSAMENTO`, `PAGAMENTO_APROVADO`, `EM_SEPARACAO`, `NA_TRANSPORTADORA`, `EM_ROTA_DE_ENTREGA`, `ENTREGUE`, `FINALIZADO` e `CANCELADO`.

### Cupons e vouchers

- Validar: `POST /cupons/validar` com `{ "codigo": "..." }`; resposta inclui `valido`, `tipo`, `valor`, `codigo` e `mensagem`.
- Cupom comum usa `tipo: PERCENTUAL`; voucher usa `tipo: FIXO`. A validação não calcula o total: o desconto aparece ao aplicar o código ao pedido iniciado.
- Voucher é emitido ao receber troca autorizada. A resposta/listagem de troca traz `voucherCodigo` e `voucherValor`; consulta-se por `GET /trocas` ou `GET /trocas/cliente/{clienteId}`. Não existe endpoint de voucher separado.
- Não existe `GET /cupons` nem CRUD administrativo de cupons no backend confirmado. As telas de listagem/admin de cupons não devem ser apresentadas como integradas até existir contrato.

### Trocas

- Solicitar: `POST /trocas` com `clienteId` UUID, `pedidoId` numérico, `motivo`, `detalhes` opcional e `itemPedidoId` numérico ou `livroId` numérico (`produtoId` é alias de `livroId`).
- O pedido deve pertencer ao cliente e estar `ENTREGUE`. Um item não pode ter troca aberta/concluída; troca recusada pode ser solicitada novamente.
- Estados: `SOLICITADA` para `AUTORIZADA` ou `RECUSADA`; autorizada pode ser recebida e virar `TROCADA`.
- Administração: `PATCH /trocas/{id}/autorizar`; `PATCH /trocas/{id}/recusar` com `{ "motivo": "..." }`; `PATCH /trocas/{id}/receber` com `{ "retornarEstoque": true|false }`.
- Receber uma troca autorizada emite voucher de uso único, ligado ao cliente e à troca. Não tem expiração implementada. O valor é preço unitário registrado na compra multiplicado pela quantidade.

## Verificação conjunta antes de concluir

- Backend disponível e contrato/DTO alinhados; requests usam tipos de ID corretos.
- CORS ou proxy validado no navegador; conferir Network e console sem expor credenciais.
- Pedido criado aparece em `GET /pedidos/admin` e detalhes/totais/status persistem após recarregar.
- Cupom/voucher é aplicado no pedido, total atualizado é apresentado e a soma de pagamentos segue o contrato.
- Troca percorre estados reais; após recebimento, código/valor do voucher aparecem na consulta do cliente e o voucher pode ser consumido uma vez.
- Cadastro de livro persiste, aparece no catálogo e tem estoque inicial coerente.
- Testes do slice e build passam; cenários de erro e dados vazios também foram verificados.

## Arquivos principais no frontend

- Rotas e permissões de navegação: `src/app/AppRoutes.jsx`.
- Identidade de usuário: `src/features/auth/context/AuthContext.jsx`.
- API HTTP comum: `src/shared/api/api.js`.
- Livros: `src/features/livros/api/livrosApi.js`, `src/features/livros/pages/LivroFormPage.jsx`, `src/features/livros/utils/livroFormatters.js`.
- Pedido/checkout: `src/features/checkout/api/checkoutApi.js`, `src/features/checkout/pages/CheckoutEnderecoPage.jsx`, `CheckoutPagamentoPage.jsx`, `CheckoutRevisaoPage.jsx`.
- Pedidos administrativos: `src/features/pedidos/api/pedidoService.js`, `src/features/pedidos/pages/admin/AdminPedidosPage.jsx`.
- Cupom: `src/features/cupom/api/cupomService.js`.
- Troca: `src/features/troca/api/trocaService.js`, `src/features/troca/pages/cliente/` e `src/features/troca/pages/admin/Trocas.jsx`.
