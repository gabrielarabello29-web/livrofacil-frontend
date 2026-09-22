const usuario = {
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

const endereco = {
  id: 21,
  clienteId: 10,
  tipoEndereco: 'Casa',
  logradouro: 'Rua das Flores',
  numero: '100',
  complemento: '',
  bairro: 'Centro',
  cidade: 'Sao Paulo',
  estado: 'SP',
  cep: '01001-000',
  principal: true,
}

const cartao = {
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

function prepararSessao() {
  cy.visit('/', {
    onBeforeLoad: (window) => {
      window.localStorage.clear()
      window.localStorage.setItem('usuario', JSON.stringify(usuario))
      window.localStorage.setItem('carrinhoId', '1')
      window.localStorage.setItem('carrinhoToken', 'cypress-token')
    },
  })
}

function interceptarCarrinho() {
  cy.intercept('GET', '**/api/carrinhos/1*', { body: { id: 1, itens: [], total: 0 } })
}

function interceptarClienteDetalhes({ enderecos = [], cartoes = [] } = {}) {
  cy.intercept('GET', '**/api/clientes/10', { body: usuario })
  cy.intercept('GET', '**/api/clientes/10/enderecos', { body: enderecos }).as('listAddresses')
  cy.intercept('GET', '**/api/clientes/10/formas-pagamento', { body: cartoes })
  cy.intercept('GET', '**/api/pagamentos/bandeiras', { body: [{ nome: 'VISA', disponivel: true }, { nome: 'MASTERCARD', disponivel: true }] })
}

describe('Conta do cliente', () => {
  beforeEach(() => {
    interceptarCarrinho()
    prepararSessao()
  })

  describe('perfil e senha', () => {
    it('atualiza os dados do perfil', () => {
      cy.intercept('PUT', '**/api/clientes/10', { body: { ...usuario, nome: 'Ana Souza' } }).as('updateProfile')
      cy.visit('/perfil')
      cy.contains('button', 'Salvar perfil').parents('form').find('input').first().clear().type('Ana Souza')
      cy.contains('button', 'Salvar perfil').click()
      cy.wait('@updateProfile').its('request.body').should('deep.include', { nome: 'Ana Souza', cpf: '52998224725' })
      cy.contains('Perfil atualizado com sucesso!').should('be.visible')
    })

    it('não envia senha sem senha atual, com senha fraca ou confirmação diferente', () => {
      cy.intercept('PATCH', '**/api/clientes/10/senha').as('changePassword')
      cy.visit('/perfil')
      cy.contains('button', 'Alterar senha').click()
      cy.contains('Informe a senha atual.').should('be.visible')

      cy.contains('button', 'Alterar senha').parents('form').find('input[type="password"]').eq(0).type('Senha@123')
      cy.contains('button', 'Alterar senha').parents('form').find('input[type="password"]').eq(1).type('fraca')
      cy.contains('button', 'Alterar senha').parents('form').find('input[type="password"]').eq(2).type('fraca')
      cy.contains('button', 'Alterar senha').click()
      cy.contains('A nova senha deve ter no mínimo 8 caracteres').should('be.visible')
      cy.get('@changePassword.all').should('have.length', 0)

      cy.contains('button', 'Alterar senha').parents('form').find('input[type="password"]').eq(1).clear().type('Senha@123')
      cy.contains('button', 'Alterar senha').parents('form').find('input[type="password"]').eq(2).clear().type('Outra@123')
      cy.contains('button', 'Alterar senha').click()
      cy.contains('As senhas não coincidem.').should('be.visible')
      cy.get('@changePassword.all').should('have.length', 0)
    })

    it('altera a senha com dados válidos', () => {
      cy.intercept('PATCH', '**/api/clientes/10/senha', { body: {} }).as('changePassword')
      cy.visit('/perfil')
      cy.contains('button', 'Alterar senha').parents('form').find('input[type="password"]').eq(0).type('SenhaAntiga@1')
      cy.contains('button', 'Alterar senha').parents('form').find('input[type="password"]').eq(1).type('SenhaNova@1')
      cy.contains('button', 'Alterar senha').parents('form').find('input[type="password"]').eq(2).type('SenhaNova@1')
      cy.contains('button', 'Alterar senha').click()
      cy.wait('@changePassword').its('request.body').should('deep.equal', {
        senhaAtual: 'SenhaAntiga@1',
        novaSenha: 'SenhaNova@1',
        confirmarNovaSenha: 'SenhaNova@1',
      })
      cy.contains('Senha alterada com sucesso!').should('be.visible')
    })

    it('confirma a exclusão da conta, chama a API e encerra a sessão', () => {
      cy.intercept('DELETE', '**/api/clientes/10', { body: {} }).as('deleteAccount')
      cy.on('window:confirm', () => true)
      cy.visit('/perfil')
      cy.contains('button', 'Excluir minha conta').click()
      cy.wait('@deleteAccount')
      cy.url().should('include', '/login')
      cy.window().its('localStorage.usuario').should('not.exist')
    })
  })

  describe('endereços', () => {
    it('impede cadastrar endereço com campos obrigatórios vazios', () => {
      interceptarClienteDetalhes()
      cy.visit('/clientes/10?secao=enderecos')
      cy.contains('button', '+ Novo endereço').click()
      cy.contains('button', 'Cadastrar endereço').click()
      cy.contains('Selecione o tipo de endereço.').should('be.visible')
      cy.contains('Informe o logradouro.').should('be.visible')
      cy.contains('Informe o número.').should('be.visible')
      cy.contains('O CEP deve seguir o formato 00000-000.').should('be.visible')
    })

    it('cadastra endereço válido e envia o payload normalizado', () => {
      interceptarClienteDetalhes()
      cy.intercept('POST', '**/api/clientes/10/enderecos', { statusCode: 201, body: endereco }).as('createAddress')
      cy.visit('/clientes/10?secao=enderecos')
      cy.contains('button', '+ Novo endereço').click()
      cy.contains('button', 'Cadastrar endereço').parents('form').within(() => {
        cy.get('input').eq(0).type('Casa')
        cy.get('input').eq(1).type('Rua das Flores')
        cy.get('input').eq(2).type('100')
        cy.get('input').eq(4).type('Centro')
        cy.get('input').eq(5).type('Sao Paulo')
        cy.get('input').eq(6).type('sp')
        cy.get('input').eq(7).type('01001000')
        cy.contains('button', 'Cadastrar endereço').click()
      })
      cy.wait('@createAddress').its('request.body').should('deep.equal', {
        tipoEndereco: 'Casa',
        logradouro: 'Rua das Flores',
        numero: '100',
        complemento: '',
        bairro: 'Centro',
        cidade: 'Sao Paulo',
        estado: 'SP',
        cep: '01001-000',
        principal: false,
      })
    })

    it('exclui endereço após confirmação', () => {
      interceptarClienteDetalhes({ enderecos: [endereco] })
      cy.intercept('DELETE', '**/api/clientes/10/enderecos/21', { body: {} }).as('deleteAddress')
      cy.on('window:confirm', () => true)
      cy.visit('/clientes/10?secao=enderecos')
      cy.wait('@listAddresses')
      cy.contains('Rua das Flores, 100').parents('.card').last().within(() => cy.get('button.btn-danger').click())
      cy.wait('@deleteAddress')
      cy.contains('Rua das Flores, 100').should('not.exist')
    })
  })

  describe('cartão de crédito', () => {
    it('não permite cadastrar cartão sem os campos necessários', () => {
      interceptarClienteDetalhes()
      cy.visit('/clientes/10?secao=cartoes')
      cy.contains('button', '+ Novo cartão de crédito').click()
      cy.contains('button', 'Cadastrar cartão').click()
      cy.contains('Informe o nome do titular.').should('be.visible')
      cy.contains('Informe o número do cartão.').should('be.visible')
    })

    it('cadastra cartão de crédito válido', () => {
      interceptarClienteDetalhes()
      cy.intercept('POST', '**/api/clientes/10/formas-pagamento', { statusCode: 201, body: cartao }).as('createCard')
      cy.visit('/clientes/10?secao=cartoes')
      cy.contains('button', '+ Novo cartão de crédito').click()
      cy.contains('button', 'Cadastrar cartão').parents('form').within(() => {
        cy.get('input').eq(0).type('ANA SILVA')
        cy.get('input[placeholder="0000 0000 0000 0000"]').type('4111111111111111')
        cy.get('input[placeholder="MM/AA"]').type('1230')
        cy.contains('button', 'Cadastrar cartão').click()
      })
      cy.wait('@createCard').its('request.body').should('deep.equal', {
        nomeTitular: 'ANA SILVA',
        numeroCartao: '4111111111111111',
        validade: '12/30',
        bandeira: 'VISA',
        tipoCartao: 'CREDITO',
        preferencial: false,
      })
    })

    it('inativa e exclui cartão inativo', () => {
      interceptarClienteDetalhes({ cartoes: [{ ...cartao, preferencial: false }] })
      cy.intercept('DELETE', '**/api/clientes/10/formas-pagamento/31', { body: {} }).as('disableCard')
      cy.intercept('DELETE', '**/api/clientes/10/formas-pagamento/31/excluir', { body: {} }).as('deleteCard')
      cy.on('window:confirm', () => true)
      cy.visit('/clientes/10?secao=cartoes')
      cy.contains('button', 'Desativar').click()
      cy.wait('@disableCard')
      cy.contains('button', 'Excluir').click()
      cy.wait('@deleteCard')
      cy.contains('ANA SILVA').should('not.exist')
    })
  })
})
