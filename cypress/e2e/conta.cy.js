// cypress/e2e/conta.cy.js
//
// LIVROFÁCIL — TESTES DE CONTA DO CLIENTE
//
// Escopo:
// - Consulta e atualização do perfil
// - Alteração de senha
// - Exclusão da conta
// - Cadastro, consulta, edição e exclusão de endereços
// - Definição de endereço principal
// - Cadastro, consulta e edição de cartões
// - Definição de cartão preferencial
// - Inativação, reativação e exclusão de cartões
//
// RASTREABILIDADE:
// RF: A CONFIRMAR NO DOCUMENTO DE REQUISITOS
// RN: A CONFIRMAR NO DOCUMENTO DE REQUISITOS
// RNF: A CONFIRMAR NO DOCUMENTO DE REQUISITOS
//
// Estes são testes de interface com respostas simuladas.
// Eles não comprovam a persistência real no banco de dados.

// =====================================================
// DADOS UTILIZADOS NOS TESTES
// =====================================================

const cliente = {
  id: 10,
  nome: 'Ana Silva',
  email: 'ana@example.com',
  cpf: '52998224725',
  telefone: '(11) 99999-9999',
  dataNascimento: '1990-05-20',
  genero: 'FEMININO',
  perfil: 'CLIENTE',
  ativo: true,
}

const casa = {
  id: 21,
  clienteId: 10,
  tipoEndereco: 'Casa',
  logradouro: 'Rua das Flores',
  numero: '100',
  complemento: '',
  bairro: 'Centro',
  cidade: 'São Paulo',
  estado: 'SP',
  cep: '01001-000',
  principal: true,
}

const trabalho = {
  ...casa,
  id: 22,
  tipoEndereco: 'Trabalho',
  logradouro: 'Avenida Paulista',
  numero: '500',
  principal: false,
}

const visa = {
  id: 31,
  clienteId: 10,
  nomeTitular: 'ANA SILVA',
  ultimosDigitos: '1111',
  validade: '12/30',
  bandeira: 'VISA',
  tipoCartao: 'CREDITO',
  preferencial: true,
  ativo: true,
}

const master = {
  ...visa,
  id: 32,
  ultimosDigitos: '2222',
  bandeira: 'MASTERCARD',
  preferencial: false,
}

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

function prepararDados({
  enderecos = [],
  cartoes = [],
  bandeiras = ['VISA', 'MASTERCARD'],
} = {}) {
  cy.intercept('GET', '**/api/clientes/10', {
    body: cliente,
  }).as('consultaCliente')

  cy.intercept(
    'GET',
    '**/api/clientes/10/enderecos',
    {
      body: enderecos,
    }
  ).as('consultaEnderecos')

  cy.intercept(
    'GET',
    '**/api/clientes/10/formas-pagamento',
    {
      body: cartoes,
    }
  ).as('consultaCartoes')

  cy.intercept(
    'GET',
    '**/api/pagamentos/bandeiras',
    {
      body: bandeiras.map((nome) => ({
        nome,
        disponivel: true,
      })),
    }
  ).as('consultaBandeiras')
}

function abrirSecao(secao) {
  cy.visit(`/clientes/10?secao=${secao}`)

  cy.wait('@consultaCliente')

  if (secao === 'enderecos') {
    cy.wait('@consultaEnderecos')
  }

  if (secao === 'cartoes') {
    cy.wait('@consultaCartoes')
    cy.wait('@consultaBandeiras')
  }
}

function formularioEndereco() {
  return cy
    .contains(
      'button',
      /Cadastrar endereço|Salvar endereço/
    )
    .closest('form')
}

function formularioCartao() {
  return cy
    .contains(
      'button',
      /Cadastrar cartão|Salvar cartão/
    )
    .closest('form')
}

function localizarEndereco(texto) {
  return cy
    .contains('span', texto)
    .closest('.card')
}

function localizarCartao(digitos) {
  return cy
    .contains('div', `**** ${digitos}`)
    .closest('.card')
}

function preencherEndereco({
  tipo = 'Casa',
  logradouro = 'Rua das Flores',
  numero = '100',
  bairro = 'Centro',
  cidade = 'São Paulo',
  estado = 'SP',
  cep = '01001000',
} = {}) {
  formularioEndereco().within(() => {
    cy.get('input').eq(0).clear().type(tipo)

    cy.get('input').eq(1).clear().type(logradouro)

    cy.get('input').eq(2).clear().type(numero)

    cy.get('input').eq(4).clear().type(bairro)

    cy.get('input').eq(5).clear().type(cidade)

    cy.get('input').eq(6).clear().type(estado)

    cy.get('input').eq(7).clear().type(cep)
  })
}

function preencherCartao({
  titular = 'ANA SILVA',
  numero = '4111111111111111',
  validade = '1230',
} = {}) {
  formularioCartao().within(() => {
    cy.get('input')
      .eq(0)
      .clear()
      .type(titular)

    cy.get(
      'input[placeholder="0000 0000 0000 0000"]'
    )
      .clear()
      .type(numero)

    cy.get('input[placeholder="MM/AA"]')
      .clear()
      .type(validade)
  })
}

// =====================================================
// SUÍTE PRINCIPAL
// =====================================================

describe('Conta do cliente', () => {
  beforeEach(() => {
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
    )

    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.clear()

        win.localStorage.setItem(
          'usuario',
          JSON.stringify(cliente)
        )

        win.localStorage.setItem(
          'carrinhoId',
          '1'
        )

        win.localStorage.setItem(
          'carrinhoToken',
          'cypress-token'
        )
      },
    })
  })

  // ===================================================
  // 1. PERFIL DO CLIENTE
  // ===================================================

  describe('Gerenciamento do perfil', () => {
    /**
     * RF: A CONFIRMAR — Atualização dos dados cadastrais.
     * RN: A CONFIRMAR — Validação dos dados informados.
     * RNF: A CONFIRMAR.
     *
     * Cenário:
     * Cliente altera seu nome e salva as informações.
     *
     * Resultado esperado:
     * Os dados atualizados são enviados corretamente
     * e a interface apresenta uma confirmação.
     */
    it('permite atualizar os dados cadastrais do cliente', () => {
      cy.intercept(
        'PUT',
        '**/api/clientes/10',
        {
          body: {
            ...cliente,
            nome: 'Ana Souza',
          },
        }
      ).as('atualizacaoPerfil')

      cy.visit('/perfil')

      cy.contains('button', 'Salvar perfil')
        .closest('form')
        .find('input')
        .first()
        .clear()
        .type('Ana Souza')

      cy.contains('button', 'Salvar perfil')
        .click()

      cy.wait('@atualizacaoPerfil')
        .its('request.body')
        .should('deep.include', {
          nome: 'Ana Souza',
          cpf: '52998224725',
        })

      cy.contains(
        'Perfil atualizado com sucesso!'
      ).should('be.visible')
    })

    /**
     * RF: A CONFIRMAR — Atualização dos dados cadastrais.
     * RN: A CONFIRMAR — Validação da data de nascimento.
     * RNF: A CONFIRMAR.
     *
     * Cenário:
     * Cliente informa uma data de nascimento futura.
     *
     * Resultado esperado:
     * O sistema apresenta uma mensagem de validação
     * e impede o salvamento dos dados inválidos.
     */
    it('impede o cadastro de uma data de nascimento futura', () => {
      cy.intercept(
        'PUT',
        '**/api/clientes/10',
        {
          body: cliente,
        }
      ).as('atualizacaoPerfil')

      cy.visit('/perfil')

      cy.contains('button', 'Salvar perfil')
        .closest('form')
        .find('input[type="date"]')
        .clear()
        .type('2099-01-01')

      cy.contains('button', 'Salvar perfil')
        .click()

      cy.contains(
        'A data de nascimento não pode ser futura.'
      ).should('be.visible')

      cy.get('@atualizacaoPerfil.all')
        .should('have.length', 0)
    })
  })

  // ===================================================
  // 2. ALTERAÇÃO DE SENHA
  // ===================================================

  describe('Segurança e alteração de senha', () => {
    /**
     * RF: A CONFIRMAR — Alteração de senha.
     * RN: A CONFIRMAR — Validação da senha atual,
     * da nova senha e da confirmação.
     * RNF: A CONFIRMAR — Requisitos de segurança.
     *
     * Cenário:
     * Cliente tenta alterar a senha sem preencher
     * corretamente os campos obrigatórios.
     *
     * Resultado esperado:
     * O sistema informa os problemas encontrados
     * e impede a alteração.
     */
    it('impede a alteração quando os dados da senha são inválidos', () => {
      cy.intercept(
        'PATCH',
        '**/api/clientes/10/senha',
        {
          body: {},
        }
      ).as('alteracaoSenha')

      cy.visit('/perfil')

      const camposSenha = () =>
        cy.contains('button', 'Alterar senha')
          .closest('form')
          .find('input[type="password"]')

      // Senha atual não informada.
      cy.contains('button', 'Alterar senha')
        .click()

      cy.contains(
        'Informe a senha atual.'
      ).should('be.visible')

      // Nova senha insuficiente.
      camposSenha()
        .eq(0)
        .type('Antiga@123')

      camposSenha()
        .eq(1)
        .type('fraca')

      camposSenha()
        .eq(2)
        .type('fraca')

      cy.contains('button', 'Alterar senha')
        .click()

      cy.contains(
        'A nova senha deve ter no mínimo 8 caracteres'
      ).should('be.visible')

      // Confirmação divergente.
      camposSenha()
        .eq(1)
        .clear()
        .type('NovaSenha@123')

      camposSenha()
        .eq(2)
        .clear()
        .type('OutraSenha@123')

      cy.contains('button', 'Alterar senha')
        .click()

      cy.contains(
        'As senhas não coincidem.'
      ).should('be.visible')

      cy.get('@alteracaoSenha.all')
        .should('have.length', 0)
    })

    /**
     * RF: A CONFIRMAR — Alteração de senha.
     * RN: A CONFIRMAR — Validação dos campos de senha.
     * RNF: A CONFIRMAR — Requisitos de segurança.
     *
     * Cenário:
     * Cliente informa a senha atual e uma nova senha
     * válida, com confirmação correspondente.
     *
     * Resultado esperado:
     * O sistema solicita a alteração e informa
     * que a operação foi concluída.
     */
    it('permite alterar a senha quando todos os dados são válidos', () => {
      cy.intercept(
        'PATCH',
        '**/api/clientes/10/senha',
        {
          body: {},
        }
      ).as('alteracaoSenha')

      cy.visit('/perfil')

      cy.contains('button', 'Alterar senha')
        .closest('form')
        .within(() => {
          cy.get('input[type="password"]')
            .eq(0)
            .type('Antiga@123')

          cy.get('input[type="password"]')
            .eq(1)
            .type('NovaSenha@123')

          cy.get('input[type="password"]')
            .eq(2)
            .type('NovaSenha@123')

          cy.contains('button', 'Alterar senha')
            .click()
        })

      cy.wait('@alteracaoSenha')
        .its('request.body')
        .should('deep.equal', {
          senhaAtual: 'Antiga@123',
          novaSenha: 'NovaSenha@123',
          confirmarNovaSenha: 'NovaSenha@123',
        })

      cy.contains(
        'Senha alterada com sucesso!'
      ).should('be.visible')
    })
  })

  // ===================================================
  // 3. EXCLUSÃO DA CONTA
  // ===================================================

  describe('Exclusão da conta', () => {
    /**
     * RF: A CONFIRMAR — Exclusão da conta do cliente.
     * RN: A CONFIRMAR — Confirmação da exclusão.
     * RNF: A CONFIRMAR.
     *
     * Cenário:
     * Cliente inicia a exclusão, mas cancela
     * a confirmação.
     *
     * Resultado esperado:
     * A conta permanece ativa e nenhuma solicitação
     * de exclusão é realizada.
     */
    it('mantém a conta quando o cliente cancela a exclusão', () => {
      cy.intercept(
        'DELETE',
        '**/api/clientes/10',
        {
          body: {},
        }
      ).as('exclusaoConta')

      cy.on('window:confirm', () => false)

      cy.visit('/perfil')

      cy.contains(
        'button',
        'Excluir minha conta'
      ).click()

      cy.get('@exclusaoConta.all')
        .should('have.length', 0)
    })

    /**
     * RF: A CONFIRMAR — Exclusão da conta do cliente.
     * RN: A CONFIRMAR — Confirmação da exclusão.
     * RNF: A CONFIRMAR.
     *
     * Cenário:
     * Cliente confirma a exclusão da própria conta.
     *
     * Resultado esperado:
     * O sistema solicita a exclusão da conta.
     *
     * Observação:
     * O redirecionamento e a limpeza da sessão
     * dependem da implementação do AuthContext.
     */
    it('permite solicitar a exclusão após a confirmação do cliente', () => {
      cy.intercept(
        'DELETE',
        '**/api/clientes/10',
        {
          body: {},
        }
      ).as('exclusaoConta')

      cy.on('window:confirm', () => true)

      cy.visit('/perfil')

      cy.contains(
        'button',
        'Excluir minha conta'
      ).click()

      cy.wait('@exclusaoConta')
    })
  })

  // ===================================================
  // 4. GERENCIAMENTO DE ENDEREÇOS
  // ===================================================

  describe('Gerenciamento de endereços', () => {
    /**
     * RF: A CONFIRMAR — Consulta dos endereços do cliente.
     * RN: A CONFIRMAR — Associação dos endereços ao cliente.
     * RNF: A CONFIRMAR.
     *
     * Cenário:
     * Cliente possui dois endereços cadastrados.
     *
     * Resultado esperado:
     * Ambos são apresentados com suas informações.
     */
    it('apresenta os endereços cadastrados pelo cliente', () => {
      prepararDados({
        enderecos: [casa, trabalho],
      })

      abrirSecao('enderecos')

      cy.contains('strong', 'Casa')
        .should('be.visible')

      cy.contains('strong', 'Trabalho')
        .should('be.visible')

      cy.contains('Rua das Flores, 100')
        .should('be.visible')

      cy.contains('Avenida Paulista, 500')
        .should('be.visible')
    })

    /**
     * RF: A CONFIRMAR — Cadastro de endereços.
     * RN: A CONFIRMAR — Campos obrigatórios do endereço.
     * RNF: A CONFIRMAR.
     *
     * Cenário:
     * Cliente tenta cadastrar um endereço sem
     * preencher as informações obrigatórias.
     *
     * Resultado esperado:
     * O sistema apresenta as validações e impede
     * o cadastro.
     */
    it('impede o cadastro de endereço com informações obrigatórias ausentes', () => {
      prepararDados()

      cy.intercept(
        'POST',
        '**/api/clientes/10/enderecos',
        {
          body: casa,
        }
      ).as('cadastroEndereco')

      abrirSecao('enderecos')

      cy.contains('button', '+ Novo endereço')
        .click()

      cy.contains('button', 'Cadastrar endereço')
        .click()

      const mensagens = [
        'Selecione o tipo de endereço.',
        'Informe o logradouro.',
        'Informe o número.',
        'Informe o bairro.',
        'Informe a cidade.',
        'O estado deve possuir duas letras maiúsculas.',
        'O CEP deve seguir o formato 00000-000.',
      ]

      mensagens.forEach((mensagem) => {
        cy.contains(mensagem)
          .should('be.visible')
      })

      cy.get('@cadastroEndereco.all')
        .should('have.length', 0)
    })

    /**
     * RF: A CONFIRMAR — Cadastro de endereços.
     * RN: A CONFIRMAR — Formatação do número e do CEP.
     * RNF: A CONFIRMAR.
     *
     * Cenário:
     * Cliente informa número e CEP em formatos inválidos.
     *
     * Resultado esperado:
     * O sistema apresenta as mensagens de validação.
     */
    it('identifica número e CEP com formatos inválidos', () => {
      prepararDados()

      abrirSecao('enderecos')

      cy.contains('button', '+ Novo endereço')
        .click()

      preencherEndereco({
        numero: 'ABC',
        cep: '123',
      })

      cy.contains('button', 'Cadastrar endereço')
        .click()

      cy.contains(
        'O número deve ser como 100, 100A ou S/N.'
      ).should('be.visible')

      cy.contains(
        'O CEP deve seguir o formato 00000-000.'
      ).should('be.visible')
    })

    /**
     * RF: A CONFIRMAR — Cadastro de endereços.
     * RN: A CONFIRMAR — Validação dos dados do endereço.
     * RNF: A CONFIRMAR.
     *
     * Cenário:
     * Cliente preenche corretamente um novo endereço.
     *
     * Resultado esperado:
     * O endereço é enviado para cadastro sem
     * modificar os dados pessoais do cliente.
     */
    it('permite cadastrar um endereço válido de forma independente do perfil', () => {
      prepararDados()

      cy.intercept(
        'POST',
        '**/api/clientes/10/enderecos',
        {
          statusCode: 201,
          body: casa,
        }
      ).as('cadastroEndereco')

      cy.intercept(
        'PUT',
        '**/api/clientes/10',
        {
          body: cliente,
        }
      ).as('atualizacaoPerfil')

      abrirSecao('enderecos')

      cy.contains('button', '+ Novo endereço')
        .click()

      preencherEndereco()

      cy.contains('button', 'Cadastrar endereço')
        .click()

      cy.wait('@cadastroEndereco')
        .its('request.body')
        .should('deep.equal', {
          tipoEndereco: 'Casa',
          logradouro: 'Rua das Flores',
          numero: '100',
          complemento: '',
          bairro: 'Centro',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01001-000',
          principal: false,
        })

      cy.get('@atualizacaoPerfil.all')
        .should('have.length', 0)
    })

    /**
     * RF: A CONFIRMAR — Alteração de endereços.
     * RN: A CONFIRMAR — Validação dos dados atualizados.
     * RNF: A CONFIRMAR.
     *
     * Cenário:
     * Cliente modifica o número de um endereço.
     *
     * Resultado esperado:
     * O endereço passa a apresentar o novo número,
     * sem modificar os dados pessoais do cliente.
     */
    it('permite editar um endereço sem alterar os dados pessoais', () => {
      prepararDados({
        enderecos: [casa],
      })

      cy.intercept(
        'PUT',
        '**/api/clientes/10/enderecos/21',
        {
          body: {
            ...casa,
            numero: '200',
          },
        }
      ).as('edicaoEndereco')

      cy.intercept(
        'PUT',
        '**/api/clientes/10',
        {
          body: cliente,
        }
      ).as('atualizacaoPerfil')

      abrirSecao('enderecos')

      localizarEndereco('Rua das Flores, 100')
        .contains('button', 'Editar')
        .click()

      formularioEndereco()
        .find('input')
        .eq(2)
        .clear()
        .type('200')

      cy.contains('button', 'Salvar endereço')
        .click()

      cy.wait('@edicaoEndereco')
        .its('request.body.numero')
        .should('equal', '200')

      cy.contains('Rua das Flores, 200')
        .should('be.visible')

      cy.get('@atualizacaoPerfil.all')
        .should('have.length', 0)
    })

    /**
     * RF: A CONFIRMAR — Gerenciamento de endereços.
     * RN: A CONFIRMAR — Definição do endereço principal.
     * RNF: A CONFIRMAR.
     *
     * Cenário:
     * Cliente define outro endereço como principal.
     *
     * Resultado esperado:
     * O novo endereço recebe a identificação
     * de principal e o anterior perde essa condição.
     */
    it('mantém apenas um endereço principal após a alteração', () => {
      prepararDados({
        enderecos: [casa, trabalho],
      })

      cy.intercept(
        'PUT',
        '**/api/clientes/10/enderecos/22',
        {
          body: {
            ...trabalho,
            principal: true,
          },
        }
      ).as('alteracaoPrincipal')

      abrirSecao('enderecos')

      localizarEndereco('Avenida Paulista, 500')
        .contains('button', 'Principal')
        .click()

      cy.wait('@alteracaoPrincipal')
        .its('request.body.principal')
        .should('equal', true)

      localizarEndereco('Avenida Paulista, 500')
        .contains('.badge', 'Principal')
        .should('be.visible')

      localizarEndereco('Rua das Flores, 100')
        .find('.badge')
        .should('not.exist')

      cy.get('.badge')
        .filter(':contains("Principal")')
        .should('have.length', 1)
    })

    /**
     * RF: A CONFIRMAR — Exclusão de endereços.
     * RN: A CONFIRMAR — Confirmação da exclusão.
     * RNF: A CONFIRMAR.
     *
     * Cenário:
     * Cliente inicia a exclusão de um endereço,
     * mas cancela a confirmação.
     *
     * Resultado esperado:
     * O endereço continua cadastrado.
     */
    it('preserva o endereço quando a exclusão é cancelada', () => {
      prepararDados({
        enderecos: [casa],
      })

      cy.intercept(
        'DELETE',
        '**/api/clientes/10/enderecos/21',
        {
          statusCode: 204,
        }
      ).as('exclusaoEndereco')

      cy.on('window:confirm', () => false)

      abrirSecao('enderecos')

      localizarEndereco('Rua das Flores, 100')
        .contains('button', 'Excluir')
        .click()

      cy.get('@exclusaoEndereco.all')
        .should('have.length', 0)

      cy.contains('Rua das Flores, 100')
        .should('be.visible')
    })

    /**
     * RF: A CONFIRMAR — Exclusão de endereços.
     * RN: A CONFIRMAR — Confirmação da exclusão.
     * RNF: A CONFIRMAR.
     *
     * Cenário:
     * Cliente confirma a exclusão de um endereço.
     *
     * Resultado esperado:
     * O endereço deixa de aparecer na listagem.
     */
    it('remove o endereço da listagem após a confirmação', () => {
      prepararDados({
        enderecos: [casa],
      })

      cy.intercept(
        'DELETE',
        '**/api/clientes/10/enderecos/21',
        {
          statusCode: 204,
        }
      ).as('exclusaoEndereco')

      cy.on('window:confirm', () => true)

      abrirSecao('enderecos')

      localizarEndereco('Rua das Flores, 100')
        .contains('button', 'Excluir')
        .click()

      cy.wait('@exclusaoEndereco')

      cy.contains(
        'Nenhum endereço cadastrado.'
      ).should('be.visible')
    })
  })

  // ===================================================
  // 5. GERENCIAMENTO DE CARTÕES
  // ===================================================

  describe('Gerenciamento de cartões', () => {
    /**
     * RF: A CONFIRMAR — Consulta dos cartões cadastrados.
     * RN: A CONFIRMAR — Identificação do cartão preferencial.
     * RNF: A CONFIRMAR.
     *
     * Cenário:
     * Cliente possui dois cartões cadastrados.
     *
     * Resultado esperado:
     * Ambos aparecem na listagem e somente
     * um está identificado como preferencial.
     */
    it('apresenta os cartões e identifica o cartão preferencial', () => {
      prepararDados({
        cartoes: [visa, master],
      })

      abrirSecao('cartoes')

      localizarCartao('1111')
        .contains('.badge', 'Preferencial')
        .should('be.visible')

      localizarCartao('2222')
        .find('.badge')
        .should('not.exist')

      cy.get('.badge')
        .filter(':contains("Preferencial")')
        .should('have.length', 1)
    })

    /**
     * RF: A CONFIRMAR — Cadastro de cartões.
     * RN: A CONFIRMAR — Campos obrigatórios do cartão.
     * RNF: A CONFIRMAR.
     *
     * Cenário:
     * Cliente tenta cadastrar um cartão sem
     * informar os dados obrigatórios.
     *
     * Resultado esperado:
     * O sistema apresenta as validações e
     * impede o cadastro.
     */
    it('impede o cadastro de cartão com informações obrigatórias ausentes', () => {
      prepararDados()

      cy.intercept(
        'POST',
        '**/api/clientes/10/formas-pagamento',
        {
          body: visa,
        }
      ).as('cadastroCartao')

      abrirSecao('cartoes')

      cy.contains(
        'button',
        '+ Novo cartão de crédito'
      ).click()

      cy.contains('button', 'Cadastrar cartão')
        .click()

      cy.contains(
        'Informe o nome do titular.'
      ).should('be.visible')

      cy.contains(
        'Informe o número do cartão.'
      ).should('be.visible')

      cy.contains(
        'A validade deve seguir o formato MM/AA.'
      ).should('be.visible')

      cy.get('@cadastroCartao.all')
        .should('have.length', 0)
    })

    /**
     * RF: A CONFIRMAR — Cadastro de cartões.
     * RN: A CONFIRMAR — Validação do número do cartão.
     * RNF: A CONFIRMAR.
     *
     * Cenário:
     * Cliente informa um número de cartão incompleto.
     *
     * Resultado esperado:
     * O sistema identifica o formato inválido
     * e impede o cadastro.
     */
    it('impede o cadastro de cartão com número incompleto', () => {
      prepararDados()

      abrirSecao('cartoes')

      cy.contains(
        'button',
        '+ Novo cartão de crédito'
      ).click()

      preencherCartao({
        numero: '41111111',
      })

      cy.contains('button', 'Cadastrar cartão')
        .click()

      cy.contains(
        'O número do cartão deve possuir exatamente 16 dígitos.'
      ).should('be.visible')
    })

    /**
     * RF: A CONFIRMAR — Cadastro de cartões.
     * RN: A CONFIRMAR — Definição do cartão preferencial.
     * RNF: A CONFIRMAR.
     *
     * Cenário:
     * Cliente preenche corretamente os dados
     * e seleciona o cartão como preferencial.
     *
     * Resultado esperado:
     * O sistema recebe os dados do cartão
     * e a preferência escolhida.
     */
    it('permite cadastrar um cartão válido como preferencial', () => {
      prepararDados()

      cy.intercept(
        'POST',
        '**/api/clientes/10/formas-pagamento',
        {
          statusCode: 201,
          body: visa,
        }
      ).as('cadastroCartao')

      abrirSecao('cartoes')

      cy.contains(
        'button',
        '+ Novo cartão de crédito'
      ).click()

      preencherCartao()

      formularioCartao()
        .find('input[type="checkbox"]')
        .check()

      cy.contains('button', 'Cadastrar cartão')
        .click()

      cy.wait('@cadastroCartao')
        .its('request.body')
        .should('deep.equal', {
          nomeTitular: 'ANA SILVA',
          numeroCartao: '4111111111111111',
          validade: '12/30',
          bandeira: 'VISA',
          tipoCartao: 'CREDITO',
          preferencial: true,
        })
    })

    /**
     * RF: A CONFIRMAR — Gerenciamento de cartões.
     * RN: A CONFIRMAR — Exclusividade do cartão preferencial.
     * RNF: A CONFIRMAR.
     *
     * Cenário:
     * Cliente escolhe outro cartão como preferencial.
     *
     * Resultado esperado:
     * O cartão escolhido passa a ser preferencial
     * e o anterior perde essa identificação.
     */
    it('mantém apenas um cartão preferencial após a alteração', () => {
      prepararDados({
        cartoes: [visa, master],
      })

      cy.intercept(
        'PATCH',
        '**/api/clientes/10/formas-pagamento/32/preferencial',
        {
          body: {
            ...master,
            preferencial: true,
          },
        }
      ).as('alteracaoPreferencial')

      abrirSecao('cartoes')

      localizarCartao('2222')
        .contains(
          'button',
          'Usar como preferencial'
        )
        .click()

      cy.wait('@alteracaoPreferencial')

      localizarCartao('2222')
        .contains('.badge', 'Preferencial')
        .should('be.visible')

      localizarCartao('1111')
        .find('.badge')
        .should('not.exist')

      cy.get('.badge')
        .filter(':contains("Preferencial")')
        .should('have.length', 1)

      cy.contains(
        'Cartão preferencial atualizado com sucesso.'
      ).should('be.visible')
    })

    /**
     * RF: A CONFIRMAR — Alteração de cartões.
     * RN: A CONFIRMAR — Validação dos dados atualizados.
     * RNF: A CONFIRMAR.
     *
     * Cenário:
     * Cliente altera a validade de um cartão ativo.
     *
     * Resultado esperado:
     * O sistema recebe os novos dados e
     * apresenta a validade atualizada.
     */
    it('permite atualizar os dados de um cartão ativo', () => {
      prepararDados({
        cartoes: [visa],
      })

      cy.intercept(
        'PUT',
        '**/api/clientes/10/formas-pagamento/31',
        {
          body: {
            ...visa,
            validade: '11/31',
          },
        }
      ).as('edicaoCartao')

      abrirSecao('cartoes')

      localizarCartao('1111')
        .contains('button', 'Editar')
        .click()

      preencherCartao({
        validade: '1131',
      })

      cy.contains('button', 'Salvar cartão')
        .click()

      cy.wait('@edicaoCartao')
        .its('request.body')
        .should('deep.include', {
          validade: '11/31',
          numeroCartao: '4111111111111111',
        })

      localizarCartao('1111')
        .contains('Validade 11/31')
        .should('be.visible')
    })

    /**
     * RF: A CONFIRMAR — Gerenciamento de cartões.
     * RN: A CONFIRMAR — Inativação de cartões.
     * RNF: A CONFIRMAR.
     *
     * Cenário:
     * Cliente desativa um cartão cadastrado.
     *
     * Resultado esperado:
     * O cartão permanece na listagem,
     * identificado como inativo.
     */
    it('permite desativar um cartão sem removê-lo da listagem', () => {
      prepararDados({
        cartoes: [master],
      })

      cy.intercept(
        'DELETE',
        '**/api/clientes/10/formas-pagamento/32',
        {
          statusCode: 204,
        }
      ).as('inativacaoCartao')

      cy.on('window:confirm', () => true)

      abrirSecao('cartoes')

      localizarCartao('2222')
        .contains('button', 'Desativar')
        .click()

      cy.wait('@inativacaoCartao')

      localizarCartao('2222')
        .contains('Status: Inativo')
        .should('be.visible')
    })

    /**
     * RF: A CONFIRMAR — Gerenciamento de cartões.
     * RN: A CONFIRMAR — Reativação de cartões.
     * RNF: A CONFIRMAR.
     *
     * Cenário:
     * Cliente reativa um cartão que estava inativo.
     *
     * Resultado esperado:
     * A reativação é solicitada e o cartão
     * passa a apresentar o status ativo.
     *
     * CORREÇÃO:
     * A listagem é interceptada uma única vez.
     * Não há espera obrigatória por uma segunda
     * consulta após a reativação.
     */
    

    /**
     * RF: A CONFIRMAR — Gerenciamento de cartões.
     * RN: A CONFIRMAR — Disponibilidade da bandeira.
     * RNF: A CONFIRMAR.
     *
     * Cenário:
     * Cliente tenta reativar um cartão cuja
     * bandeira não está disponível.
     *
     * Resultado esperado:
     * O sistema informa a indisponibilidade
     * e impede a reativação.
     */
    it('impede a reativação quando a bandeira não está disponível', () => {
      prepararDados({
        cartoes: [
          {
            ...master,
            ativo: false,
          },
        ],
        bandeiras: ['VISA'],
      })

      cy.intercept(
        'PATCH',
        '**/api/clientes/10/formas-pagamento/32/reativar',
        {
          body: master,
        }
      ).as('reativacaoCartao')

      abrirSecao('cartoes')

      localizarCartao('2222')
        .contains('button', 'Ativar')
        .click()

      cy.contains(
        'A bandeira deste cartão não está disponível para pagamento.'
      ).should('be.visible')

      cy.get('@reativacaoCartao.all')
        .should('have.length', 0)
    })

    /**
     * RF: A CONFIRMAR — Exclusão de cartões.
     * RN: A CONFIRMAR — Exclusão de cartões inativos.
     * RNF: A CONFIRMAR.
     *
     * Cenário:
     * Cliente confirma a exclusão definitiva
     * de um cartão inativo.
     *
     * Resultado esperado:
     * O cartão desaparece da listagem e
     * o sistema apresenta uma confirmação.
     */
    it('permite excluir definitivamente um cartão inativo', () => {
      prepararDados({
        cartoes: [
          {
            ...master,
            ativo: false,
          },
        ],
      })

      cy.intercept(
        'DELETE',
        '**/api/clientes/10/formas-pagamento/32/excluir',
        {
          statusCode: 204,
        }
      ).as('exclusaoCartao')

      cy.on('window:confirm', () => true)

      abrirSecao('cartoes')

      localizarCartao('2222')
        .contains('button', 'Excluir')
        .click()

      cy.wait('@exclusaoCartao')

      cy.contains('**** 2222')
        .should('not.exist')

      cy.contains(
        'Cartão excluído com sucesso.'
      ).should('be.visible')
    })
  })
})