 Arquitetura — E-commerce de Livros

## 1. Visão geral

Projeto de um e-commerce de livros baseado nos requisitos fornecidos pelo professor.

### Tecnologias autorizadas

- **Web**
- **Back-end:** Java / Node.js / .NET
- **Front-end:** tecnologias que executam no navegador
- **Banco:** relacional
- **Arquitetura:** MVC
- **IA**

### Stack proposta

| Camada | Tecnologia |
|---|---|
| Front-end | React + Vite |
| Back-end | Java + Spring Boot |
| Banco de dados | PostgreSQL |
| Arquitetura | MVC |
| Comunicação | API REST / JSON |
| IA | API de IA generativa, como OpenAI |
| Autenticação | Spring Security + JWT |

A escolha de Java + Spring Boot é adequada para concentrar as regras de negócio, disponibilizar a API REST e integrar o banco e a IA.

---

# 2. Arquitetura geral

```text
                    ┌─────────────────────────┐
                    │       FRONT-END         │
                    │      React + Vite       │
                    │                         │
                    │  Páginas / Componentes  │
                    │  Chatbot / Gráficos     │
                    └────────────┬────────────┘
                                 │
                            HTTP / REST
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │        BACK-END         │
                    │      Java + Spring      │
                    │                         │
                    │          MVC            │
                    │                         │
                    │ Controller              │
                    │      ↓                  │
                    │ Service                │
                    │      ↓                  │
                    │ Repository             │
                    └───────┬─────────┬───────┘
                            │         │
                            ▼         ▼
                   ┌────────────┐ ┌──────────────┐
                   │ PostgreSQL │ │   IA         │
                   │            │ │ Generativa   │
                   │ Banco      │ │ Chatbot      │
                   │ relacional │ │ Recomendações│
                   └────────────┘ └──────────────┘
```

---

# 3. Arquitetura MVC

O projeto utilizará MVC no back-end.

```text
Controller
    ↓
Service
    ↓
Repository
    ↓
Database
```

### Controller

Responsável por:

- receber requisições HTTP;
- validar os dados de entrada;
- chamar os Services;
- devolver respostas HTTP.

Exemplo:

```text
POST /api/livros
GET /api/livros
PUT /api/livros/{id}
DELETE /api/livros/{id}
```

### Service

Responsável pelas regras de negócio.

Exemplos:

- validar estoque;
- calcular preço;
- validar cupons;
- alterar status da venda;
- processar trocas;
- gerar recomendações;
- conversar com a IA.

### Repository

Responsável pelo acesso ao banco de dados utilizando JPA/Spring Data.

---

# 4. Estrutura do Back-end

```text
backend/
└── src/
    └── main/
        ├── java/
        │   └── com/
        │       └── ecommerce/
        │           └── livros/
        │
        │               ├── livro/
        │               │   ├── controller/
        │               │   ├── service/
        │               │   ├── repository/
        │               │   ├── entity/
        │               │   └── dto/
        │               │
        │               ├── cliente/
        │               │   ├── controller/
        │               │   ├── service/
        │               │   ├── repository/
        │               │   ├── entity/
        │               │   └── dto/
        │               │
        │               ├── carrinho/
        │               │   ├── controller/
        │               │   ├── service/
        │               │   ├── repository/
        │               │   ├── entity/
        │               │   └── dto/
        │               │
        │               ├── venda/
        │               │   ├── controller/
        │               │   ├── service/
        │               │   ├── repository/
        │               │   ├── entity/
        │               │   └── dto/
        │               │
        │               ├── estoque/
        │               │   ├── controller/
        │               │   ├── service/
        │               │   ├── repository/
        │               │   ├── entity/
        │               │   └── dto/
        │               │
        │               ├── troca/
        │               │   ├── controller/
        │               │   ├── service/
        │               │   ├── repository/
        │               │   ├── entity/
        │               │   └── dto/
        │               │
        │               ├── analise/
        │               │   ├── controller/
        │               │   ├── service/
        │               │   └── dto/
        │               │
        │               ├── ai/
        │               │   ├── controller/
        │               │   ├── service/
        │               │   └── dto/
        │               │
        │               ├── security/
        │               ├── exception/
        │               └── config/
        │
        └── resources/
            ├── application.properties
            └── db/
                └── migration/
```

---

# 5. Módulos do sistema

## 5.1 Livros

Responsável por:

- cadastrar livros;
- alterar livros;
- ativar/inativar livros;
- consultar livros;
- categorias;
- autores;
- editoras;
- grupo de precificação;
- código único;
- código de barras;
- cálculo do valor de venda.

O requisito determina dados obrigatórios como autor, categoria, ano, título, editora, edição, ISBN, páginas, sinopse, dimensões, grupo de precificação e código de barras.

---

## 5.2 Clientes

Responsável por:

- cadastro;
- alteração;
- inativação;
- consulta;
- alteração de senha;
- endereços;
- cartões;
- histórico de transações;
- ranking do cliente.

Um cliente pode possuir vários endereços e cartões, sendo um cartão definido como preferencial.

---

## 5.3 Carrinho

Responsável por:

- adicionar livro;
- remover livro;
- alterar quantidade;
- visualizar itens;
- validar estoque;
- bloquear temporariamente itens;
- controlar prazo de bloqueio;
- liberar estoque quando o prazo expirar.

Fluxo:

```text
Cliente
   ↓
Adicionar livro
   ↓
Validar estoque
   ↓
Bloquear estoque
   ↓
Adicionar ao carrinho
   ↓
Finalizar compra
```

---

## 5.4 Venda

Responsável por:

- finalizar compra;
- calcular total;
- calcular frete;
- selecionar endereço;
- selecionar pagamento;
- validar pagamento;
- alterar status;
- despachar pedido;
- confirmar entrega.

### Status sugeridos

```text
EM_PROCESSAMENTO
APROVADA
REPROVADA
EM_TRANSPORTE
ENTREGUE
EM_TROCA
TROCA_AUTORIZADA
TROCADO
```

Fluxo:

```text
CARRINHO
    ↓
FINALIZAÇÃO
    ↓
EM_PROCESSAMENTO
    ↓
Validação do pagamento
    ├───────────────┐
    ↓               ↓
APROVADA        REPROVADA
    ↓
EM_TRANSPORTE
    ↓
ENTREGUE
    ↓
Possível troca
```

---

# 6. Estoque

O estoque deve controlar as entradas de produtos.

Uma entrada deve possuir:

- livro;
- quantidade;
- valor de custo;
- fornecedor;
- data de entrada.

Estrutura conceitual:

```text
LIVRO
  │
  └── ESTOQUE
        │
        └── ENTRADA_ESTOQUE
              ├── quantidade
              ├── valorCusto
              ├── fornecedor
              └── dataEntrada
```

O sistema também deve controlar:

```text
quantidade disponível
quantidade bloqueada
quantidade vendida
```

---

# 7. Trocas

Fluxo:

```text
ENTREGUE
   ↓
Cliente solicita troca
   ↓
EM_TROCA
   ↓
Administrador analisa
   ↓
TROCA_AUTORIZADA
   ↓
Recebimento do produto
   ↓
TROCADO
   ↓
Geração de cupom de troca
```

O item somente poderá entrar no fluxo de troca depois de uma compra entregue.

---

# 8. Análise gerencial

O administrador poderá analisar vendas por período e categoria.

Endpoint sugerido:

```text
GET /api/analises/vendas
```

Parâmetros:

```text
dataInicio
dataFim
categorias
```

Resposta:

```json
[
  {
    "mes": "2026-01",
    "categoria": "Romance",
    "valor": 12500.00
  },
  {
    "mes": "2026-01",
    "categoria": "Tecnologia",
    "valor": 8900.00
  }
]
```

O agrupamento deve ser mensal.

O front-end será responsável por apresentar o gráfico.

---

# 9. IA Generativa

A IA será integrada através de uma API de um modelo já existente.

Não será necessário desenvolver ou treinar um modelo de IA do zero.

## Arquitetura

```text
                    ┌──────────────┐
                    │    React     │
                    │              │
                    │   Chatbot    │
                    └──────┬───────┘
                           │
                      POST /api/chat
                           │
                           ▼
                  ┌─────────────────┐
                  │ ChatController  │
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │   ChatService   │
                  └──────┬─────┬────┘
                         │     │
                ┌────────┘     └─────────┐
                ▼                        ▼
        ┌──────────────┐          ┌─────────────┐
        │ PostgreSQL   │          │  OpenAI API │
        │              │          │             │
        │ Livros       │          │ IA          │
        │ Categorias   │          │ Generativa  │
        │ Compras      │          └─────────────┘
        │ Preferências │
        └──────────────┘
```

## Fluxo do chatbot

```text
Usuário
   ↓
React
   ↓
POST /api/chat
   ↓
ChatController
   ↓
ChatService
   ├── consulta dados do sistema
   └── envia contexto para IA
              ↓
          IA Generativa
              ↓
          resposta
              ↓
          React
```

## Comportamento da IA

A IA poderá receber instruções como:

```text
Você é a assistente virtual de uma loja online de livros.

Seu objetivo é:
- ajudar o cliente a encontrar livros;
- responder dúvidas;
- recomendar livros;
- auxiliar na busca;
- utilizar os dados fornecidos pelo sistema.

Regras:
- seja objetiva e amigável;
- não invente livros;
- não invente preços;
- não invente disponibilidade;
- utilize prioritariamente os dados do catálogo;
- quando não souber uma informação, informe que não encontrou essa informação.
```

Essas instruções são o comportamento do chatbot e podem ser ajustadas pelo sistema.

---

# 10. IA + Banco de Dados

A IA não deve ser responsável por armazenar os dados verdadeiros da loja.

O banco continua sendo a fonte dos dados.

Exemplo:

```text
Usuário:
"Quero um livro de ficção científica até R$50"

              ↓

Spring Boot

              ↓

PostgreSQL
"Quais livros atendem aos critérios?"

              ↓

Livros encontrados

              ↓

OpenAI
"Com base nesses livros, responda ao cliente..."

              ↓

Resposta
```

Dessa forma a IA não precisa inventar produtos.

---

# 11. Recomendação personalizada

Para clientes autenticados, o sistema pode enviar contexto adicional:

```text
Cliente:
123

Histórico:
- Ficção científica
- Fantasia
- Tecnologia

Compras anteriores:
- Livro A
- Livro B
- Livro C

Preferências:
- Ficção científica
- Livros de até R$80

Catálogo disponível :
- Livro X
- Livro Y
- Livro Z
```

A IA  utiliza  essas  informações para produzir recomendações.
---
---

# 12. Front-end

Estrutura :

```text
frontend/
└── src/
    ├── pages/
    │   ├── login/
    │   ├── livros/
    │   ├── cliente/
    │   ├── carrinho/
    │   ├── compras/
    │   ├── trocas/
    │   ├── estoque/
    │   ├── admin/
    │   ├── analise/
    │   └── chatbot/
    │
    ├── components/
    │   ├── Header/
    │   ├── Footer/
    │   ├── LivroCard/
    │   ├── CarrinhoItem/
    │   ├── Chatbot/
    │   └── Modal/
    │
    ├── services/
    │   ├── api.js
    │   ├── livroService.js
    │   ├── clienteService.js
    │   ├── carrinhoService.js
    │   ├── vendaService.js
    │   ├── estoqueService.js
    │   ├── trocaService.js
    │   ├── analiseService.js
    │   └── chatService.js
    │
    ├── context/
    │   ├── AuthContext.jsx
    │   └── CartContext.jsx
    │
    └── routes/
        └── AppRoutes.jsx
```

---

# 13. Comunicação Front-end → Back-end

O React não acessará o banco diretamente.

```text
ERRADO:

React → PostgreSQL


CORRETO:

React
  ↓
REST API
  ↓
Spring Boot
  ↓
Service
  ↓
Repository
  ↓
PostgreSQL
```

---

# 14. Segurança

A autenticação ficará no back-end.

```text
Login
  ↓
Spring Security
  ↓
Validação
  ↓
JWT
  ↓
React armazena token
  ↓
Requisições autenticadas
```

Perfis sugeridos:

```text
ROLE_CLIENTE
ROLE_ADMIN
ROLE_GERENTE
```

O back-end deverá validar se o usuário possui permissão antes de executar operações administrativas.

---

# 15. Banco de dados — modelo inicial

```text
CLIENTE
   │
   ├── ENDERECO
   │
   └── CARTAO

LIVRO
   │
   ├── LIVRO_CATEGORIA ── CATEGORIA
   ├── AUTOR
   ├── EDITORA
   └── GRUPO_PRECIFICACAO

LIVRO
   │
   └── ENTRADA_ESTOQUE
          │
          └── FORNECEDOR

CLIENTE
   │
   └── CARRINHO
          │
          └── ITEM_CARRINHO
                   │
                   └── LIVRO

CLIENTE
   │
   └── VENDA
          │
          ├── ITEM_VENDA ─── LIVRO
          ├── ENDERECO
          ├── PAGAMENTO
          └── CUPOM

VENDA
   │
   └── TROCA
          │
          └── ITEM_TROCA
```

Tabelas auxiliares:

```text
USUARIO
PERFIL
LOG_TRANSACAO
CUPOM
NOTIFICACAO
```

---

# 16. API REST inicial

## Livros

```text
GET    /api/livros
GET    /api/livros/{id}
POST   /api/livros
PUT    /api/livros/{id}
PATCH  /api/livros/{id}/ativar
PATCH  /api/livros/{id}/inativar
```

## Clientes

```text
GET    /api/clientes
GET    /api/clientes/{id}
POST   /api/clientes
PUT    /api/clientes/{id}
PATCH  /api/clientes/{id}/inativar
PATCH  /api/clientes/{id}/senha
```

## Carrinho

```text
GET    /api/carrinho
POST   /api/carrinho/itens
PUT    /api/carrinho/itens/{id}
DELETE /api/carrinho/itens/{id}
```

## Vendas

```text
POST   /api/vendas
GET    /api/vendas
GET    /api/vendas/{id}
PATCH  /api/vendas/{id}/transporte
PATCH  /api/vendas/{id}/entregue
```

## Estoque

```text
POST   /api/estoque/entradas
GET    /api/estoque
```

## Trocas

```text
POST   /api/trocas
GET    /api/trocas
PATCH  /api/trocas/{id}/autorizar
PATCH  /api/trocas/{id}/receber
```

## Análise

```text
GET /api/analises/vendas
```

## IA

```text
POST /api/chat
```

---

# 17. Comunicação com a OpenAI

A chave da API deve ficar somente no back-end.

```text
React
  ↓
Spring Boot
  ↓
AIService
  ↓
OpenAI API
```

Nunca:

```text
React
  ↓
OpenAI
```

A chave pode ser configurada através de variável de ambiente:

```text
OPENAI_API_KEY=sua-chave
```

Durante o desenvolvimento, o projeto pode funcionar completamente localmente:

```text
React      → localhost:5173
Spring     → localhost:8080
PostgreSQL → localhost:5432
OpenAI     → API externa pela internet
```

O computador precisa apenas ter acesso à internet para realizar a chamada à API da OpenAI.

---

# 18. Requisitos não funcionais considerados

A arquitetura deverá considerar:

### Tempo de resposta

As consultas devem buscar atender ao limite de até 1 segundo definido pelo requisito.

### Log

Operações de escrita deverão registrar:

```text
data
hora
usuário responsável
dados alterados
```

Uma tabela possível:

```text
LOG_TRANSACAO
├── id
├── usuario_id
├── operacao
├── entidade
├── entidade_id
├── dados_anteriores
├── dados_novos
└── data_hora
```

### Senha

- mínimo de 8 caracteres;
- letras maiúsculas;
- letras minúsculas;
- caracteres especiais;
- armazenamento seguro da senha.

---

# 19. Fluxo completo do sistema

```text
                         USUÁRIO
                            │
                            ▼
                     ┌────────────┐
                     │   REACT    │
                     └─────┬──────┘
                           │
                         REST
                           │
                           ▼
                  ┌─────────────────┐
                  │   SPRING BOOT   │
                  │                 │
                  │   CONTROLLER    │
                  │       ↓         │
                  │     SERVICE     │
                  │       ↓         │
                  │   REPOSITORY    │
                  └──────┬─────┬────┘
                         │     │
                         ▼     ▼
                  ┌─────────┐ ┌──────────┐
                  │PostgreSQL│ │ OpenAI  │
                  └─────────┘ └──────────┘
```

---

# 20. Princípios do projeto

1. O React é responsável pela interface.
2. O Spring Boot é responsável pelas regras de negócio.
3. O PostgreSQL é responsável pela persistência.
4. A comunicação entre front e back será feita por API REST.
5. O front-end nunca acessará diretamente o banco.
6. A API Key da IA ficará somente no back-end.
7. A IA será utilizada como serviço externo.
8. Os dados reais de livros, estoque, preços e vendas virão do banco.
9. A IA será responsável pela interpretação da linguagem e geração das respostas.
10. O projeto seguirá arquitetura MVC.
11. A autenticação e autorização serão controladas pelo back-end.
12. Os módulos serão separados por domínio de negócio.

---

# 21. Ordem recomendada de desenvolvimento

```text
1. Modelagem do banco
        ↓
2. Criar projeto Spring Boot
        ↓
3. Criar entidades
        ↓
4. Criar repositories
        ↓
5. Criar services
        ↓
6. Criar controllers
        ↓
7. Implementar autenticação
        ↓
8. Implementar livros
        ↓
9. Implementar clientes
        ↓
10. Implementar estoque
        ↓
11. Implementar carrinho
        ↓
12. Implementar vendas
        ↓
13. Implementar trocas
        ↓
14. Implementar análise
        ↓
15. Implementar front-end
        ↓
16. Integrar IA
        ↓
17. Testes
        ↓
18. Deploy/apresentação
```

---

# 22. Resumo da solução

```text
                    E-COMMERCE DE LIVROS
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
       FRONT-END         BACK-END          BANCO
        React          Java/Spring       PostgreSQL
          │                 │
          │                 ├── Livros
          │                 ├── Clientes
          │                 ├── Carrinho
          │                 ├── Vendas
          │                 ├── Estoque
          │                 ├── Trocas
          │                 ├── Análise
          │                 └── IA
          │                       │
          │                       ▼
          │                 OpenAI API
          │
          └──────────── REST/JSON ─────────────┘
```

## Objetivo da arquitetura

Construir um e-commerce web monolítico em arquitetura MVC, com front-end separado do back-end, banco relacional para persistência e integração com IA generativa através de uma API externa. O chatbot deverá utilizar os dados fornecidos pelo sistema para auxiliar na busca e recomendação de livros, sem expor a chave da API no navegador.
