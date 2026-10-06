# Contexto do fluxo de vendas — LivroFácil

Documento de passagem de contexto para estudar ou continuar o trabalho com outra IA. Leia este arquivo junto do código atual dos dois repositórios: ele resume o estado conhecido, mas não substitui a inspeção dos arquivos e dos contratos.

## Objetivo da entrega

Implementar e demonstrar o caminho feliz de criação de pedido conforme o DRS:

1. Adicionar mais de um livro ao carrinho, alterar quantidades e respeitar estoque disponível.
2. Iniciar a compra a partir do carrinho.
3. Selecionar endereço já cadastrado ou cadastrar um novo durante o checkout e incorporá-lo ao perfil.
4. Selecionar cartão cadastrado ou cadastrar um cartão durante o checkout e incorporá-lo ao perfil.
5. Calcular frete; a fórmula é decisão do projeto e deve ser explicada na apresentação.
6. Permitir pagamento por cartões e cupons, incluindo o mínimo por cartão, a exceção RN0035 e emissão de voucher para saldo excedente.
7. Finalizar com o pedido persistido como `EM_PROCESSAMENTO`.

O DRS deixa fora desta fase, entre outros itens, validação financeira do pagamento, estados posteriores do pedido, baixa de estoque e processo completo de troca. Evite apresentar esses pontos como requisitos desta entrega.

## Repositórios e estado conhecido

Os projetos são repositórios separados:

- Frontend: `C:\Users\DANIELEMIRANDADOPRAD\Documents\livrofacil-frontend`
  - A aplicação e o `package.json` ficam na subpasta `livrofacil-frontend`.
  - Branch `feature/fluxo-vendas`.
  - Último estado verificado: worktree limpo, dois commits locais à frente da origem.
  - Commits locais relevantes: `9c78856` (specs Cypress dos fluxos de vendas) e `277c09e` (teste/exibição do voucher excedente).
- Backend: `C:\Users\DANIELEMIRANDADOPRAD\livrofacil-backend\livrofacil-backend`
  - Branch `feature/fluxo-vendas`.
  - Último estado verificado: worktree limpo, um commit local à frente da origem.
  - Commit local relevante: `dcb198b` (retorno e consulta do voucher excedente).

Os commits são locais; não assumir que foram enviados ao remoto. Antes de editar, conferir `git status` e preservar alterações que possam ter surgido depois deste documento. Não resetar, descartar ou sobrescrever trabalho existente.

## Tecnologias e execução local

### Frontend

React 19, Vite 8, React Router 7 e Cypress 16. A configuração do Cypress usa `http://localhost:5173`; o proxy do Vite envia `/api` para `http://localhost:8080`.

No PowerShell:

```powershell
Set-Location 'C:\Users\DANIELEMIRANDADOPRAD\Documents\livrofacil-frontend\livrofacil-frontend'
npm run dev
```

Em outro terminal, para os testes:

```powershell
Set-Location 'C:\Users\DANIELEMIRANDADOPRAD\Documents\livrofacil-frontend\livrofacil-frontend'
npm run cy:run
```

Para abrir a interface do Cypress, usar `npm run cy:open`.

### Backend

Spring Boot, Java 18 e PostgreSQL/Supabase. A configuração local atual pode apontar para banco remoto. **Não executar testes de integração, migrações, gravações ou testes manuais contra banco remoto sem confirmar explicitamente que é um ambiente isolado de teste.** Não copiar valores de `.env.local`, `application.properties` ou outros arquivos de configuração para este documento, prompts ou logs.

Testes unitários focados de pedido e troca:

```powershell
Set-Location 'C:\Users\DANIELEMIRANDADOPRAD\livrofacil-backend\livrofacil-backend'
.\mvnw.cmd '-Dtest=PedidoServiceTest,TrocaServiceTest' test
```

## Implementação relevante

### Frontend

- Carrinho e quantidades: `livrofacil-frontend/src/features/carrinho/`.
- Inclusão de livros e validação visual de estoque: `livrofacil-frontend/src/features/catalogo/components/ComprarButton.jsx`.
- Checkout/endereço e pagamento: `livrofacil-frontend/src/features/checkout/`.
- Testes Cypress:
  - `livrofacil-frontend/cypress/e2e/carrinho-rf0031.cy.js`
  - `livrofacil-frontend/cypress/e2e/checkout-pagamento-contract.cy.js`
  - `livrofacil-frontend/cypress/e2e/checkout-fluxo-vendas.cy.js`
- Listagem de vouchers do cliente: `livrofacil-frontend/src/features/troca/`.

### Backend

- Contrato e orientações para integração do frontend: `FRONTEND_HANDOFF.md` na raiz do repositório backend.
- Endpoints de pedido: `src/main/java/com/livrofacil/modulos/compra/controller/PedidoController.java`.
- Regras de pedido, pagamentos, frete e voucher: `src/main/java/com/livrofacil/modulos/compra/service/PedidoService.java`.
- Consulta de vouchers: `src/main/java/com/livrofacil/modulos/troca/controller/TrocaController.java` e `TrocaService.java`.
- Os endpoints principais de pedido incluem `POST /api/pedidos/iniciar`, `POST /api/pedidos/{pedidoId}/cupons`, `POST /api/pedidos/{pedidoId}/finalizar` e `GET /api/pedidos/{pedidoId}?clienteId=...`.
- Vouchers do cliente: `GET /api/trocas/cliente/{clienteId}/vouchers`.

## Testes e o que eles provam

### Cypress

O estado registrado na última execução foi **26 testes aprovados, sem falhas e sem pendências**; o build do frontend também passou. Os specs de checkout usam `cy.intercept` para substituir respostas de API por fixtures. IDs como cliente `11111111-1111-4111-8111-111111111111`, carrinho `7` e pedido `42`, assim como valores de voucher nos testes, são dados artificiais.

Portanto, esses Cypress verificam interação da interface, regras client-side e formato/uso dos contratos sob respostas controladas. **Não demonstram chamadas reais ao backend, persistência no banco, existência de dados de demonstração nem pedido persistido.** Um valor como `R$ 25,00` em um teste é apenas fixture retornada pela API simulada.

Os cenários já cobrem, com mocks, seleção/cadastro de endereço e cartão, pagamento dividido, cupom/voucher, status retornado e emissão/exibição simulada de voucher excedente. Alguns testes do checkout visitam diretamente `/checkout/endereco`; não considerar isso prova de que a jornada iniciou no carrinho.

### Backend

Os testes unitários focados `PedidoServiceTest` e `TrocaServiceTest` foram executados após as mudanças atuais: **23 testes passaram, sem falha ou erro**. Isso valida lógica de serviço em testes unitários, não o ciclo HTTP completo nem integração com banco real.

## Pontos de atenção conhecidos

1. **RN0035:** em `PedidoService.finalizar`, a validação atual permite cartão abaixo de R$ 10,00 quando existe qualquer cupom aplicado com desconto positivo. É mais ampla do que a exceção descrita no DRS, que permite valor inferior somente no caso específico em que cupons cobrem o máximo possível e deixam saldo residual abaixo de R$ 10,00. Conferir e corrigir a regra server-side antes de considerar esse requisito plenamente atendido.
2. **Cupons:** a evidência disponível não demonstra integralmente combinação/seleção do valor máximo nem prevenção de cupons desnecessários. Conferir o texto exato do DRS e o modelo de dados antes de concluir a implementação.
3. **Fluxo ponta a ponta:** adicionar uma suíte Cypress separada, sem stubs de respostas de negócio, conectada a backend e banco exclusivos de teste. Manter os testes mockados existentes, pois são rápidos e isolam a UI.
4. **Dados de demonstração:** confirmar e preparar cliente de teste, livros, estoque, endereço, cartão e cupons/vouchers em ambiente isolado. Os IDs e fixtures do Cypress não representam seed real.
5. **Frete:** critério atual no backend: grátis com subtotal de pelo menos R$ 150,00; abaixo desse limite, R$ 19,90 para SP e R$ 29,90 para outras UFs, para subtotal positivo. Explicar o critério na apresentação.
6. **RNF0011/RNF0012:** não há evidência conhecida de teste mensurável de tempo de resposta ou de logging/auditoria por operação de escrita.
7. **Estoque fora do escopo:** o serviço de finalização altera contadores de estoque. Como a baixa de estoque está fora do escopo definido pelo DRS para a apresentação, não a tratar como requisito desta fase.

## Próximos passos recomendados

1. Ler o DRS e o `FRONTEND_HANDOFF.md` do backend; conferir os arquivos e os commits atuais.
2. Alinhar e testar a regra RN0035 no backend; decidir com base no DRS a semântica dos cupons combinados.
3. Preparar ambiente de integração dedicado, com banco de teste e dados seed repetíveis. Nunca apontar a nova suíte para produção ou banco remoto sem autorização.
4. Implementar poucos Cypress E2E sem interceptar respostas de negócio: começar no catálogo/carrinho, finalizar compra, confirmar status via API e verificar persistência esperada.
5. Separar claramente resultados de unit tests, testes de UI com mocks e E2E integrados nos relatórios.

## Instrução de segurança para a IA que receber este contexto

Inspecione os dois repositórios e confirme branches, commits, worktrees, contratos e comandos antes de alterar algo. Não invente requisitos além do DRS. Não afirme que mocks comprovam persistência. Não use nem modifique banco remoto/produção, não exponha credenciais e não inclua números de cartão reais; use apenas dados fictícios em ambiente de teste. Preserve alterações e commits existentes e reporte explicitamente o que foi validado, o que foi mockado e o que ainda depende de ambiente/dados.
