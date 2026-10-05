# Cobertura automatizada do checkout

**Atualizado em:** 05/10/2026

## Resultado

Os cinco cenários E2E focados no checkout foram executados com **32 testes aprovados e nenhum falho**. O build de produção também foi concluído com sucesso.

| Spec | Resultado |
|---|---:|
| `carrinho-rf0031.cy.js` | 8/8 |
| `checkout-compra.cy.js` | 2/2 |
| `checkout-iniciar-cupom.cy.js` | 1/1 |
| `checkout-pagamento-contract.cy.js` | 19/19 |
| `checkout-endereco-frete.cy.js` | 2/2 |
| **Total E2E** | **32/32** |

## Requisitos demonstrados

- Inclusão de mais de um livro no carrinho, alteração de quantidade, remoção e validação de estoque.
- Compra usando endereço e cartão previamente cadastrados.
- Cadastro de novo endereço e cartão durante a compra, com associação ao perfil.
- Pagamento dividido entre cartões, incluindo três cartões.
- Pagamento com cartão e cupom, aceitando saldo residual inferior a R$ 10 quando decorrente do cupom (exemplo: compra de R$ 35, cupom de R$ 30 e cartão de R$ 5).
- Aplicação apenas dos cupons necessários e simulação da emissão de cupom de troca quando o valor dos cupons excede a compra.
- Verificação do status `EM_PROCESSAMENTO` no pedido finalizado.
- Cupom disponível na etapa de pagamento, não na etapa de endereço.

## Alterações relacionadas

- Removido o campo de cupom da etapa de endereço e da inicialização do pedido.
- Acrescentados cenários E2E para carrinho, compras com dados salvos ou recém-cadastrados e regras de pagamento/cupons.
- Ajustada a seleção de quantidade no catálogo e estabilizados os testes de estoque e quantidade no carrinho.

## Limitações e observações

- Os testes E2E usam interceptações do Cypress; validam fluxos de interface e contratos simulados, mas **não comprovam integração, persistência ou regras executadas pelo backend real**.
- A emissão do cupom de troca foi testada com resposta simulada. O formato retornado precisa ser confirmado com o backend.
- A suíte de testes unitários não teve resultado confirmado nesta execução.
- O build passou, com avisos de CSS e de tamanho do bundle; eles não impediram a geração dos artefatos.
