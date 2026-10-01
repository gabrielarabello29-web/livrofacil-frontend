// cypress/e2e/cliente.cy.js
//
// LIVROFÁCIL — TESTES DE CLIENTES
//
// Escopo:
// - Cadastro de clientes
// - Validação de dados cadastrais
// - Autenticação
// - Controle de acesso
// - Pesquisa administrativa de clientes
//
// RASTREABILIDADE — CÓDIGOS A CONFIRMAR:
// RF0021 — Cadastro de clientes (descrição oficial pendente).
// RF0024 — Pesquisa de clientes (descrição oficial pendente).
// RN0023 — Regra associada ao cadastro (descrição oficial pendente).
// RN0026 — Regra associada às validações (descrição oficial pendente).
// RNF0031 — Descrição oficial pendente.
// RNF0032 — Descrição oficial pendente.
//
// Observação:
// Os testes utilizam respostas simuladas com cy.intercept().
// Não comprovam persistência real no banco de dados.

// =====================================================
// DADOS DE TESTE
// =====================================================

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

const clienteCadastrado = {
  id: 10,
  nome: 'Ana Silva',
  email: 'ana.silva@example.com',
  perfil: 'CLIENTE',
  ativo: true,
}

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

function prepararCarrinho() {
  cy.intercept(
    'POST',
    '**/api/carrinhos',
    {
      body: {
        id: 1,
        token: 'cypress-token',
      },
    }
  ).as('criacaoCarrinho')

  cy.intercept(
    'GET',
    '**/api/carrinhos/1*',
    {
      body: {
        id: 1,
        itens: [],
        total: 0,
      },
    }
  ).as('consultaCarrinho')
}

function preencherCampo(seletor, valor) {
  const campo = cy.get(seletor)

  campo.clear()

  if (valor !== undefined && valor !== null && valor !== '') {
    campo.type(String(valor))
  }
}

function preencherCadastro(overrides = {}) {
  const dados = {
    ...cadastroValido,
    ...overrides,
  }

  preencherCampo(
    'input[placeholder="Seu nome completo"]',
    dados.nome
  )

  preencherCampo(
    'input[placeholder="seu@email.com"]',
    dados.email
  )

  preencherCampo(
    'input[type="date"]',
    dados.dataNascimento
  )

  preencherCampo(
    'input[placeholder="(11) 99999-9999"]',
    dados.telefone
  )

  preencherCampo(
    'input[placeholder="000.000.000-00"]',
    dados.cpf
  )

  cy.get('select')
    .select(dados.genero)

  preencherCampo(
    'input[placeholder="Mínimo 6 caracteres"]',
    dados.senha
  )

  preencherCampo(
    'input[placeholder="Repita a senha"]',
    dados.confirmarSenha
  )

  preencherCampo(
    'input[placeholder="Ex.: Casa"]',
    dados.tipoEndereco
  )

  preencherCampo(
    'input[placeholder="Rua das Flores"]',
    dados.logradouro
  )

  preencherCampo(
    'input[placeholder="100, 100A ou S/N"]',
    dados.numero
  )

  preencherCampo(
    'input[placeholder="Centro"]',
    dados.bairro
  )

  preencherCampo(
    'input[placeholder="São Paulo"]',
    dados.cidade
  )

  preencherCampo(
    'input[placeholder="SP"]',
    dados.estado
  )

  preencherCampo(
    'input[placeholder="00000-000"]',
    dados.cep
  )
}

function abrirCadastro() {
  cy.visit('/cadastro', {
    onBeforeLoad(win) {
      win.localStorage.clear()
    },
  })
}

function abrirLogin() {
  cy.visit('/login', {
    onBeforeLoad(win) {
      win.localStorage.clear()
    },
  })
}

function preencherLogin({
  email = 'cliente@example.com',
  senha = 'Senha@123',
} = {}) {
  preencherCampo(
    'input[placeholder="seu@email.com"]',
    email
  )

  preencherCampo(
    'input[placeholder="••••••"]',
    senha
  )
}

// =====================================================
// SUÍTE PRINCIPAL
// =====================================================

describe('Gerenciamento de clientes', () => {
  beforeEach(() => {
    cy.clearLocalStorage()

    prepararCarrinho()
  })

  // ===================================================
  // 1. CADASTRO DE CLIENTES
  // ===================================================

  describe('Cadastro de clientes', () => {
    /**
     * RF0021 — Cadastro de clientes.
     * RN0026 — Validação dos campos cadastrais.
     * RNF — A CONFIRMAR.
     *
     * Descrições oficiais pendentes de confirmação.
     *
     * Cenário:
     * Um visitante tenta criar uma conta sem
     * preencher os campos obrigatórios.
     *
     * Resultado esperado:
     * O sistema impede o cadastro e identifica
     * os campos que precisam ser preenchidos.
     */
    it('impede a criação de uma conta com campos obrigatórios vazios', () => {
      cy.intercept(
        'POST',
        '**/api/clientes'
      ).as('cadastroCliente')

      abrirCadastro()

      cy.get('form')
        .submit()

      cy.get('input:invalid')
        .should('exist')

      cy.get('@cadastroCliente.all')
        .should('have.length', 0)
    })

    /**
     * RF0021 — Cadastro de clientes.
     * RN0026 — Validação dos dados cadastrais.
     * RNF0031 — A CONFIRMAR.
     * RNF0032 — A CONFIRMAR.
     *
     * Descrições oficiais pendentes de confirmação.
     *
     * Cenário:
     * Um visitante informa e-mail, CPF, telefone
     * e senha com valores inválidos.
     *
     * Resultado esperado:
     * O sistema apresenta as mensagens de
     * validação e impede o cadastro.
     */
    it('identifica informações pessoais e senha com valores inválidos', () => {
      cy.intercept(
        'POST',
        '**/api/clientes'
      ).as('cadastroCliente')

      abrirCadastro()

      preencherCadastro({
        email: 'email-invalido',
        cpf: '123',
        telefone: '1199',
        senha: 'fraca',
        confirmarSenha: 'diferente',
      })

      cy.get('form')
        .submit()

      cy.contains(
        'Informe um e-mail válido.'
      ).should('be.visible')

      cy.contains(
        'O CPF deve possuir exatamente 11 números.'
      ).should('be.visible')

      cy.contains(
        'Informe o telefone no formato'
      ).should('be.visible')

      cy.contains(
        'A senha deve ter no mínimo 8 caracteres'
      ).should('be.visible')

      cy.contains(
        'As senhas não coincidem.'
      ).should('be.visible')

      cy.get('@cadastroCliente.all')
        .should('have.length', 0)
    })

    /**
     * RF0021 — Cadastro de clientes.
     * RN0023 — Regra de idade associada ao cadastro.
     * RN0026 — Validação dos dados informados.
     * RNF — A CONFIRMAR.
     *
     * Descrições oficiais pendentes de confirmação.
     *
     * Cenário:
     * Um visitante informa idade inferior à
     * permitida e dados de endereço inválidos.
     *
     * Resultado esperado:
     * O sistema identifica os erros e
     * impede a criação da conta.
     */
    it('impede o cadastro com idade não permitida ou endereço inválido', () => {
      cy.intercept(
        'POST',
        '**/api/clientes'
      ).as('cadastroCliente')

      abrirCadastro()

      preencherCadastro({
        dataNascimento: '2015-01-01',
        numero: 'sem numero',
        estado: 's',
        cep: '123',
      })

      cy.get(
        'input[placeholder="100, 100A ou S/N"]'
      )
        .invoke('val', 'sem numero')
        .trigger('input')

      cy.get('form')
        .submit()

      cy.contains(
        'Você precisa ter pelo menos 18 anos.'
      ).should('be.visible')

      cy.contains(
        'O número deve ser como 100, 100A ou S/N.'
      ).should('be.visible')

      cy.contains(
        'O estado deve possuir duas letras maiúsculas.'
      ).should('be.visible')

      cy.contains(
        'O CEP deve seguir o formato 00000-000.'
      ).should('be.visible')

      cy.get('@cadastroCliente.all')
        .should('have.length', 0)
    })

    /**
     * RF0021 — Cadastro de clientes.
     * RN0023 — A CONFIRMAR.
     * RN0026 — Validação dos dados cadastrais.
     * RNF — A CONFIRMAR.
     *
     * Descrições oficiais pendentes de confirmação.
     *
     * Cenário:
     * Um visitante preenche corretamente todos
     * os dados necessários para criar uma conta.
     *
     * Resultado esperado:
     * O sistema solicita o cadastro com os
     * dados normalizados e autentica o cliente,
     * conforme o comportamento esperado da tela.
     */
    it('permite criar uma conta quando os dados são válidos', () => {
      cy.intercept(
        'POST',
        '**/api/clientes',
        {
          statusCode: 201,
          body: clienteCadastrado,
        }
      ).as('cadastroCliente')

      abrirCadastro()

      preencherCadastro()

      cy.get('form')
        .submit()

      cy.wait('@cadastroCliente')
        .its('request.body')
        .should('deep.include', {
          nome: 'Ana Silva',
          email: cadastroValido.email,
          cpf: '52998224725',
          telefone: '(11) 99999-9999',
          genero: 'FEMININO',
          senha: 'Senha@123',
          confirmarSenha: 'Senha@123',
        })

      cy.location('pathname')
        .should('eq', '/')

      cy.window()
        .its('localStorage.usuario')
        .should('contain', 'Ana Silva')
    })
  })

  // ===================================================
  // 2. AUTENTICAÇÃO
  // ===================================================

  describe('Autenticação do cliente', () => {
    /**
     * RF — A CONFIRMAR — Autenticação do cliente.
     * RN — A CONFIRMAR — Campos obrigatórios.
     * RNF — A CONFIRMAR — Segurança de acesso.
     *
     * Cenário:
     * Um visitante tenta entrar sem informar
     * e-mail ou senha.
     *
     * Resultado esperado:
     * O sistema apresenta as mensagens de
     * validação e impede a autenticação.
     */
    it('impede o acesso quando e-mail ou senha não são informados', () => {
      cy.intercept(
        'POST',
        '**/api/clientes/login'
      ).as('autenticacao')

      abrirLogin()

      cy.get('form button[type="submit"]')
        .click()

      cy.contains(
        'E-mail é obrigatório.'
      ).should('be.visible')

      preencherCampo(
        'input[placeholder="seu@email.com"]',
        'cliente@example.com'
      )

      cy.get('form button[type="submit"]')
        .click()

      cy.contains(
        'Senha é obrigatória.'
      ).should('be.visible')

      cy.get('@autenticacao.all')
        .should('have.length', 0)
    })

    /**
     * RF — A CONFIRMAR — Autenticação do cliente.
     * RN — A CONFIRMAR — Validação das credenciais.
     * RNF — A CONFIRMAR — Segurança de acesso.
     *
     * Cenário:
     * Um visitante informa credenciais que
     * não são reconhecidas pelo sistema.
     *
     * Resultado esperado:
     * O sistema apresenta uma mensagem de erro
     * e mantém o visitante na tela de login.
     */
    it('informa quando as credenciais de acesso são inválidas', () => {
      cy.intercept(
        'POST',
        '**/api/clientes/login',
        {
          statusCode: 401,
          body: {
            mensagem: 'Credenciais inválidas.',
          },
        }
      ).as('autenticacao')

      abrirLogin()

      preencherLogin()

      cy.get('form button[type="submit"]')
        .click()

      cy.wait('@autenticacao')

      cy.contains(
        'Credenciais inválidas.'
      ).should('be.visible')

      cy.location('pathname')
        .should('eq', '/login')
    })

    /**
     * RF — A CONFIRMAR — Autenticação do cliente.
     * RN — A CONFIRMAR — Validação das credenciais.
     * RNF — A CONFIRMAR — Segurança de acesso.
     *
     * Cenário:
     * Um cliente informa credenciais válidas.
     *
     * Resultado esperado:
     * O sistema autentica o cliente e
     * permite o acesso à página inicial.
     */
    it('permite o acesso à conta com credenciais válidas', () => {
      cy.intercept(
        'POST',
        '**/api/clientes/login',
        {
          statusCode: 200,
          body: {
            id: 10,
            nome: 'Ana Silva',
            email: 'cliente@example.com',
            perfil: 'CLIENTE',
            ativo: true,
          },
        }
      ).as('autenticacao')

      abrirLogin()

      preencherLogin()

      cy.get('form button[type="submit"]')
        .click()

      cy.wait('@autenticacao')

      cy.location('pathname')
        .should('eq', '/')

      cy.window()
        .its('localStorage.usuario')
        .should('contain', 'Ana Silva')
    })
  })

  // ===================================================
  // 3. CONTROLE DE ACESSO
  // ===================================================

  describe('Controle de acesso às funcionalidades do cliente', () => {
    /**
     * RF — A CONFIRMAR — Controle de acesso.
     * RN — A CONFIRMAR — Necessidade de autenticação.
     * RNF — A CONFIRMAR — Segurança de acesso.
     *
     * Cenário:
     * Um visitante tenta acessar o carrinho
     * sem possuir uma sessão autenticada.
     *
     * Resultado esperado:
     * O sistema redireciona o visitante
     * para a tela de login.
     */
    it('direciona visitantes não autenticados para a tela de login', () => {
      cy.visit('/carrinho', {
        onBeforeLoad(win) {
          win.localStorage.clear()
        },
      })

      cy.location('pathname')
        .should('eq', '/login')
    })

    /**
     * RF — A CONFIRMAR — Controle de acesso.
     * RN — A CONFIRMAR — Acesso do cliente autenticado.
     * RNF — A CONFIRMAR — Segurança de acesso.
     *
     * Cenário:
     * Um cliente autenticado acessa o carrinho.
     *
     * Resultado esperado:
     * O sistema permite o acesso à funcionalidade.
     */
    it('permite que clientes autenticados acessem o carrinho', () => {
      cy.visit('/carrinho', {
        onBeforeLoad(win) {
          win.localStorage.setItem(
            'usuario',
            JSON.stringify({
              id: 10,
              nome: 'Ana Silva',
              perfil: 'CLIENTE',
              ativo: true,
            })
          )
        },
      })

      cy.location('pathname')
        .should('eq', '/carrinho')
    })
  })

  // ===================================================
  // 4. PESQUISA ADMINISTRATIVA DE CLIENTES
  // ===================================================

  describe('Pesquisa de clientes na área administrativa', () => {
    const clienteMock = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      numeroRegistro: 10,
      nome: 'Ana Silva',
      email: 'ana.silva@example.com',
      cpf: '52998224725',
      telefone: '(11) 99999-9999',
      dataNascimento: '1990-05-20',
      genero: 'FEMININO',
      tipoEndereco: 'Casa',
      endereco: 'Rua das Flores, 100',
      complemento: 'Apto 10',
      bairro: 'Centro',
      cidade: 'Sao Paulo',
      estado: 'SP',
      cep: '01001-000',
      ativo: true,
    }

    const filtros = {
      registro: {
        label: 'Nº de registro',
        entrada: '10',
        esperado: '10',
      },

      nome: {
        label: 'Nome',
        entrada: 'Ana',
        esperado: 'Ana',
      },

      email: {
        label: 'E-mail',
        entrada: 'ana.silva@example.com',
        esperado: 'ana.silva@example.com',
      },

      cpf: {
        label: 'CPF',
        entrada: '52998224725',
        esperado: '529.982.247-25',
      },

      telefone: {
        label: 'Telefone',
        entrada: '11999999999',
        esperado: '(11) 99999-9999',
      },

      dataNascimento: {
        label: 'Data de nascimento',
        entrada: '1990-05-20',
        esperado: '1990-05-20',
      },

      genero: {
        label: 'Gênero',
        entrada: 'FEMININO',
        esperado: 'FEMININO',
      },

      tipoEndereco: {
        label: 'Tipo de endereço',
        entrada: 'Casa',
        esperado: 'Casa',
      },

      endereco: {
        label: 'Endereço (logradouro e número)',
        entrada: 'Rua das Flores',
        esperado: 'Rua das Flores',
      },

      complemento: {
        label: 'Complemento',
        entrada: 'Apto 10',
        esperado: 'Apto 10',
      },

      bairro: {
        label: 'Bairro',
        entrada: 'Centro',
        esperado: 'Centro',
      },

      cidade: {
        label: 'Cidade',
        entrada: 'Sao Paulo',
        esperado: 'Sao Paulo',
      },

      estado: {
        label: 'Estado',
        entrada: 'sp',
        esperado: 'SP',
      },

      cep: {
        label: 'CEP',
        entrada: '01001000',
        esperado: '01001-000',
      },
    }

    function localizarFiltro(campo) {
      return cy
        .contains(
          'form.admin-client-filters label',
          filtros[campo].label
        )
        .find('input')
    }

    function preencherFiltro(campo) {
      const {
        entrada,
        esperado,
      } = filtros[campo]

      localizarFiltro(campo)
        .clear()
        .type(entrada)
        .should('have.value', esperado)
    }

    function pesquisar() {
      cy.get('form.admin-client-filters')
        .contains('button', 'Buscar')
        .click()
    }

    function validarFiltrosEnviados(parametros) {
      cy.wait('@pesquisaClientes')
        .its('request.query')
        .then((query) => {
          expect(query)
            .to.deep.equal(parametros)
        })
    }

    function validarClienteEncontrado() {
      cy.get('table.data-table tbody')
        .within(() => {
          cy.contains('Ana Silva')
            .should('be.visible')

          cy.contains(
            'ana.silva@example.com'
          ).should('be.visible')
        })
    }

    beforeEach(() => {
      cy.intercept(
        'GET',
        '**/api/clientes',
        {
          statusCode: 200,
          body: [clienteMock],
        }
      ).as('listagemClientes')

      cy.intercept(
        'GET',
        '**/api/clientes/buscar*',
        {
          statusCode: 200,
          body: [clienteMock],
        }
      ).as('pesquisaClientes')

      cy.visit('/admin/clientes', {
        onBeforeLoad(win) {
          win.localStorage.setItem(
            'usuario',
            JSON.stringify({
              id: '550e8400-e29b-41d4-a716-446655440001',
              nome: 'Administrador',
              perfil: 'ADMIN',
              ativo: true,
            })
          )
        },
      })

      cy.wait('@listagemClientes')
    })

    /**
     * RF0024 — Pesquisa de clientes.
     * RN — A CONFIRMAR — Aplicação de filtros.
     * RNF — A CONFIRMAR.
     *
     * Descrição oficial de RF0024 pendente.
     *
     * Cenário:
     * Administrador pesquisa um cliente
     * utilizando somente o CPF.
     *
     * Resultado esperado:
     * O sistema aplica o filtro informado
     * e apresenta o cliente correspondente.
     */
    it('permite localizar um cliente utilizando um único filtro', () => {
      preencherFiltro('cpf')

      pesquisar()

      validarFiltrosEnviados({
        cpf: filtros.cpf.esperado,
      })

      validarClienteEncontrado()
    })

    /**
     * RF0024 — Pesquisa de clientes.
     * RN — A CONFIRMAR — Combinação de filtros.
     * RNF — A CONFIRMAR.
     *
     * Descrição oficial de RF0024 pendente.
     *
     * Cenário:
     * Administrador combina nome, e-mail e cidade
     * para pesquisar um cliente.
     *
     * Resultado esperado:
     * O sistema considera os três filtros
     * e apresenta os resultados correspondentes.
     */
    it('permite localizar clientes combinando diferentes filtros', () => {
      const campos = [
        'nome',
        'email',
        'cidade',
      ]

      campos.forEach(preencherFiltro)

      pesquisar()

      validarFiltrosEnviados({
        nome: filtros.nome.esperado,
        email: filtros.email.esperado,
        cidade: filtros.cidade.esperado,
      })

      validarClienteEncontrado()
    })

    /**
     * RF0024 — Pesquisa de clientes.
     * RN — A CONFIRMAR — Aplicação dos filtros disponíveis.
     * RNF — A CONFIRMAR.
     *
     * Descrição oficial de RF0024 pendente.
     *
     * Cenário:
     * Administrador preenche todos os filtros
     * disponíveis na pesquisa.
     *
     * Resultado esperado:
     * O sistema considera os valores informados
     * e apresenta os resultados correspondentes.
     */
    it('permite pesquisar utilizando todos os filtros disponíveis', () => {
      Object.keys(filtros)
        .forEach(preencherFiltro)

      pesquisar()

      const parametrosEsperados = Object.fromEntries(
        Object.entries(filtros).map(
          ([campo, dados]) => [
            campo,
            dados.esperado,
          ]
        )
      )

      validarFiltrosEnviados(parametrosEsperados)

      validarClienteEncontrado()
    })

    /**
     * RF0024 — Pesquisa de clientes.
     * RN — A CONFIRMAR — Pesquisa individual por campo.
     * RNF — A CONFIRMAR.
     *
     * Descrição oficial de RF0024 pendente.
     *
     * Cenário:
     * Administrador pesquisa separadamente
     * utilizando cada campo disponível.
     *
     * Resultado esperado:
     * Cada filtro funciona individualmente,
     * sem manter valores da pesquisa anterior.
     */
    it('permite pesquisar individualmente por cada campo disponível', () => {
      Object.keys(filtros).forEach((campo) => {
        cy.get('form.admin-client-filters')
          .contains('button', 'Limpar filtros')
          .click()

        cy.wait('@listagemClientes')

        preencherFiltro(campo)

        pesquisar()

        validarFiltrosEnviados({
          [campo]: filtros[campo].esperado,
        })

        validarClienteEncontrado()
      })
    })

    /**
     * RF0024 — Pesquisa de clientes.
     * RN — A CONFIRMAR — Consulta sem filtros.
     * RNF — A CONFIRMAR.
     *
     * Descrição oficial de RF0024 pendente.
     *
     * Cenário:
     * Administrador realiza uma pesquisa
     * sem preencher nenhum filtro.
     *
     * Resultado esperado:
     * O sistema apresenta a listagem geral
     * de clientes.
     */
    it('apresenta todos os clientes quando nenhum filtro é informado', () => {
      pesquisar()

      cy.wait('@listagemClientes')
        .its('request.url')
        .should('not.include', '/buscar')

      validarClienteEncontrado()
    })

    /**
     * RF0024 — Pesquisa de clientes.
     * RN — A CONFIRMAR — Limpeza dos filtros.
     * RNF — A CONFIRMAR.
     *
     * Descrição oficial de RF0024 pendente.
     *
     * Cenário:
     * Administrador realiza uma pesquisa
     * e depois limpa os filtros.
     *
     * Resultado esperado:
     * Os campos são esvaziados e a
     * listagem geral é apresentada novamente.
     */
    it('restaura a listagem geral ao limpar os filtros de pesquisa', () => {
      preencherFiltro('nome')

      pesquisar()

      validarFiltrosEnviados({
        nome: filtros.nome.esperado,
      })

      cy.get('form.admin-client-filters')
        .contains('button', 'Limpar filtros')
        .click()

      cy.wait('@listagemClientes')

      localizarFiltro('nome')
        .should('have.value', '')

      validarClienteEncontrado()
    })

    /**
     * RF0024 — Pesquisa de clientes.
     * RN — A CONFIRMAR — Tratamento de resultados vazios.
     * RNF — A CONFIRMAR.
     *
     * Descrição oficial de RF0024 pendente.
     *
     * Cenário:
     * Administrador pesquisa um nome
     * que não corresponde a nenhum cliente.
     *
     * Resultado esperado:
     * O sistema informa que nenhum cliente
     * foi encontrado e não apresenta
     * resultados da pesquisa anterior.
     */
    it('informa quando nenhum cliente corresponde aos filtros', () => {
      cy.intercept(
        'GET',
        '**/api/clientes/buscar*',
        {
          statusCode: 200,
          body: [],
        }
      ).as('pesquisaVazia')

      localizarFiltro('nome')
        .type('Cliente Inexistente')

      pesquisar()

      cy.wait('@pesquisaVazia')

      cy.contains(
        'Nenhum cliente encontrado.'
      ).should('be.visible')

      cy.get('table.data-table tbody')
        .contains('Ana Silva')
        .should('not.exist')
    })
  })
})