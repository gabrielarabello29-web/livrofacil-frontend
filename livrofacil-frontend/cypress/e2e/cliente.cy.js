const cadastroValido = {
  nome: 'Ana Silva',
  email: 'ana.silva@example.com',
  dataNascimento: '1990-05-20',
  telefone: '11999999999',
  cpf: '52998224725',
  genero: 'FEMININO',
  senha: 'Senha@123',
  confirmarSenha: 'Senha@123',
  tipoEndereco: 'Casa',
  logradouro: 'Rua das Flores',
  numero: '100',
  bairro: 'Centro',
  cidade: 'Sao Paulo',
  estado: 'sp',
  cep: '01001000',
}

function prepararCarrinho() {
  cy.intercept('POST', '**/api/carrinhos', { body: { id: 1, token: 'cypress-token' } })
  cy.intercept('GET', '**/api/carrinhos/1*', { body: { id: 1, itens: [], total: 0 } })
}

function preencherCadastro(overrides = {}) {
  const dados = { ...cadastroValido, ...overrides }
  cy.get('input[placeholder="Seu nome completo"]').type(dados.nome)
  cy.get('input[placeholder="seu@email.com"]').type(dados.email)
  cy.get('input[type="date"]').type(dados.dataNascimento)
  cy.get('input[placeholder="(11) 99999-9999"]').type(dados.telefone)
  cy.get('input[placeholder="000.000.000-00"]').type(dados.cpf)
  cy.get('select').select(dados.genero)
  cy.get('input[placeholder="Mínimo 6 caracteres"]').type(dados.senha)
  cy.get('input[placeholder="Repita a senha"]').type(dados.confirmarSenha)
  cy.get('input[placeholder="Ex.: Casa"]').type(dados.tipoEndereco)
  cy.get('input[placeholder="Rua das Flores"]').type(dados.logradouro)
  cy.get('input[placeholder="100, 100A ou S/N"]').type(dados.numero)
  cy.get('input[placeholder="Centro"]').type(dados.bairro)
  cy.get('input[placeholder="São Paulo"]').type(dados.cidade)
  cy.get('input[placeholder="SP"]').type(dados.estado)
  cy.get('input[placeholder="00000-000"]').type(dados.cep)
}

describe('Fluxos do cliente', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    prepararCarrinho()
  })

  describe('cadastro', () => {
    it('impede o envio com campos obrigatórios vazios', () => {
      cy.intercept('POST', '**/api/clientes').as('register')
      cy.visit('/cadastro', { onBeforeLoad: (window) => window.localStorage.clear() })
        cy.get('form').submit()
      cy.get('input:invalid').should('exist')
      cy.get('@register.all').should('have.length', 0)
    })

    it('exibe erros para dados inválidos', () => {
      cy.visit('/cadastro', { onBeforeLoad: (window) => window.localStorage.clear() })
      preencherCadastro({ email: 'email-invalido', cpf: '123', telefone: '1199', senha: 'fraca', confirmarSenha: 'diferente' })
        cy.get('form').submit()
      cy.contains('Informe um e-mail válido.').should('be.visible')
      cy.contains('O CPF deve possuir exatamente 11 números.').should('be.visible')
      cy.contains('Informe o telefone no formato').should('be.visible')
      cy.contains('A senha deve ter no mínimo 8 caracteres').should('be.visible')
      cy.contains('As senhas não coincidem.').should('be.visible')
    })

    it('valida idade e endereço antes de chamar a API', () => {
      cy.intercept('POST', '**/api/clientes').as('register')
      cy.visit('/cadastro', { onBeforeLoad: (window) => window.localStorage.clear() })
      preencherCadastro({ dataNascimento: '2015-01-01', numero: 'sem numero', estado: 's', cep: '123' })
        cy.get('input[placeholder="100, 100A ou S/N"]').invoke('val', 'sem numero').trigger('input')
        cy.get('form').submit()
      cy.contains('Você precisa ter pelo menos 18 anos.').should('be.visible')
      cy.contains('O número deve ser como 100, 100A ou S/N.').should('be.visible')
      cy.contains('O estado deve possuir duas letras maiúsculas.').should('be.visible')
      cy.contains('O CEP deve seguir o formato 00000-000.').should('be.visible')
      cy.get('@register.all').should('have.length', 0)
    })

    it('cadastra um cliente válido e envia os dados normalizados', () => {
      cy.intercept('POST', '**/api/clientes', { statusCode: 201, body: { id: 10, nome: 'Ana Silva', email: cadastroValido.email } }).as('register')
      cy.visit('/cadastro', { onBeforeLoad: (window) => window.localStorage.clear() })
      preencherCadastro()
        cy.get('form').submit()
      cy.wait('@register').its('request.body').should('deep.include', {
        nome: 'Ana Silva',
        email: cadastroValido.email,
        cpf: '52998224725',
        telefone: '(11) 99999-9999',
        genero: 'FEMININO',
        senha: 'Senha@123',
        confirmarSenha: 'Senha@123',
      })
        cy.url().should('eq', `${Cypress.config('baseUrl')}/`)
        cy.window().its('localStorage.usuario').should('contain', 'Ana Silva')
    })
  })

  describe('login', () => {
    it('valida e-mail e senha obrigatórios', () => {
      cy.visit('/login', { onBeforeLoad: (window) => window.localStorage.clear() })
        cy.get('form button[type="submit"]').click()
      cy.contains('E-mail é obrigatório.').should('be.visible')
      cy.get('input[placeholder="seu@email.com"]').type('cliente@example.com')
        cy.get('form button[type="submit"]').click()
      cy.contains('Senha é obrigatória.').should('be.visible')
    })

    it('exibe erro quando as credenciais são rejeitadas', () => {
      cy.intercept('POST', '**/api/clientes/login', { statusCode: 401, body: { mensagem: 'Credenciais inválidas.' } }).as('login')
      cy.visit('/login', { onBeforeLoad: (window) => window.localStorage.clear() })
      cy.get('input[placeholder="seu@email.com"]').type('cliente@example.com')
      cy.get('input[placeholder="••••••"]').type('Senha@123')
        cy.get('form button[type="submit"]').click()
      cy.wait('@login')
      cy.contains('Credenciais inválidas.').should('be.visible')
      cy.url().should('include', '/login')
    })

    it('autentica cliente e redireciona para a página inicial', () => {
      cy.intercept('POST', '**/api/clientes/login', { body: { id: 10, nome: 'Ana Silva', email: 'cliente@example.com', perfil: 'CLIENTE', ativo: true } }).as('login')
      cy.visit('/login', { onBeforeLoad: (window) => window.localStorage.clear() })
      cy.get('input[placeholder="seu@email.com"]').type('cliente@example.com')
      cy.get('input[placeholder="••••••"]').type('Senha@123')
        cy.get('form button[type="submit"]').click()
      cy.wait('@login')
      cy.url().should('eq', `${Cypress.config('baseUrl')}/`)
      cy.window().its('localStorage.usuario').should('contain', 'Ana Silva')
    })
  })

  describe('rotas protegidas', () => {
    it('manda visitante não autenticado para o login', () => {
      cy.visit('/carrinho', { onBeforeLoad: (window) => window.localStorage.clear() })
      cy.url().should('include', '/login')
    })

    it('permite ao cliente autenticado acessar o carrinho', () => {
      cy.window().then((window) => window.localStorage.setItem('usuario', JSON.stringify({ id: 10, nome: 'Ana Silva', perfil: 'CLIENTE', ativo: true })))
      cy.visit('/carrinho')
      cy.url().should('include', '/carrinho')
    })
  })
})
