import React from 'react'
import { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from '@/features/auth/api/authApi'
import { clienteService } from '@/features/cliente/api/clienteService'
import { criarOuAssociarCarrinho } from '@/features/carrinho/api/carrinhoApi'

const STORAGE_KEY = 'usuario'

function normalizarPerfil(perfil) {
  return typeof perfil === 'string' ? perfil.trim().toUpperCase() : 'CLIENTE'
}

function normalizarUsuario(dados) {
  if (!dados) return null

  const perfil = normalizarPerfil(dados.perfil || dados.tipoUsuario || 'CLIENTE')

  return {
    ...dados,
    id: dados.id ?? null,
    uuid: dados.uuid || null,
    numeroRegistro: dados.numeroRegistro ?? null,
    nome: dados.nome || '',
    email: dados.email || '',
    ativo: dados.ativo ?? true,
    perfil,
  }
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEY)
      return salvo ? normalizarUsuario(JSON.parse(salvo)) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (usuario) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(usuario))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [usuario])

  function carregarUsuarioSalvo() {
    try {
      const salvo = localStorage.getItem(STORAGE_KEY)
      setUsuario(salvo ? normalizarUsuario(JSON.parse(salvo)) : null)
    } catch {
      setUsuario(null)
    }
  }

  async function login(email, senha) {
    const emailLimpo = String(email || '').trim()
    const senhaLimpa = String(senha || '')

    if (!emailLimpo || !senhaLimpa) {
      return {
        sucesso: false,
        mensagem: 'E-mail e senha são obrigatórios.',
        erros: {
          email: !emailLimpo ? 'E-mail é obrigatório.' : '',
          senha: !senhaLimpa ? 'Senha é obrigatória.' : '',
        },
      }
    }

    try {
      const resposta = await authApi.login(emailLimpo, senhaLimpa)
      const usuarioAtual = normalizarUsuario(resposta)
      if (usuarioAtual?.ativo === false) {
        return { sucesso: false, mensagem: 'Esta conta já foi excluída.', status: 403 }
      }
      setUsuario(usuarioAtual)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(usuarioAtual))
      const carrinhoId = localStorage.getItem('carrinhoId')
      const carrinhoToken = localStorage.getItem('carrinhoToken')
      if (carrinhoId && usuarioAtual.id) await criarOuAssociarCarrinho({ token: carrinhoToken, clienteId: usuarioAtual.id })
      return { sucesso: true, usuario: usuarioAtual }
    } catch (error) {
      return {
        sucesso: false,
        mensagem: error?.mensagem || error?.message || 'E-mail ou senha inválidos.',
        erros: error?.erros || {},
        status: error?.status || 0,
      }
    }
  }

  async function registrar(dados) {
    try {
      const cliente = await clienteService.criarCliente(dados)
      const usuario = {
        id: cliente?.id,
        uuid: cliente?.uuid || null,
        numeroRegistro: cliente?.numeroRegistro ?? null,
        nome: cliente?.nome,
        email: cliente?.email,
        cpf: cliente?.cpf,
        telefone: cliente?.telefone,
        dataNascimento: cliente?.dataNascimento,
        genero: cliente?.genero,
        perfil: 'CLIENTE',
      }
      setUsuario(usuario)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(usuario))
      const carrinhoId = localStorage.getItem('carrinhoId')
      const carrinhoToken = localStorage.getItem('carrinhoToken')
      if (carrinhoId && usuario.id) await criarOuAssociarCarrinho({ token: carrinhoToken, clienteId: usuario.id })
      return { sucesso: true, usuario }
    } catch (error) {
      return {
        sucesso: false,
        mensagem: error?.message || 'Não foi possível salvar o cliente. Verifique os dados informados.',
        erros: error?.erros || error?.details?.erros || {},
      }
    }
  }

  function logout() {
    setUsuario(null)
    ;['usuario', 'token', 'accessToken', 'refreshToken', 'carrinhoId', 'carrinhoToken', 'pedidoCheckout', 'enderecoCheckout', 'checkoutCupom', 'favoritos', 'livrofacil-ordem-carrinho'].forEach((chave) => localStorage.removeItem(chave))
    sessionStorage.clear()
  }

  function atualizarUsuario(dados) {
    setUsuario((prev) => normalizarUsuario({ ...(prev || {}), ...dados }))
  }

  async function excluirConta() {
    if (!usuario?.id) return { sucesso: false, mensagem: 'Nenhum usuário autenticado.' }
    try {
      const resposta = await clienteService.excluirConta(usuario.id)
      logout()
      window.history.replaceState(null, '', '/login')
      return { sucesso: true, usuario: resposta }
    } catch (error) {
      const mensagem = String(error?.message || error?.mensagem || '')
      if (error?.status === 409 || /pedido ativo/i.test(mensagem)) return { sucesso: false, mensagem: 'Não é possível excluir a conta enquanto houver pedidos ativos.' }
      if (error?.status === 400 || error?.status === 404 || /inativ|exclu/i.test(mensagem)) return { sucesso: false, mensagem: 'Esta conta já foi excluída.' }
      return { sucesso: false, mensagem: 'Não foi possível excluir a conta. Tente novamente.' }
    }
  }

  const isAdmin = normalizarPerfil(usuario?.perfil) === 'ADMIN'
  const isCliente = normalizarPerfil(usuario?.perfil) === 'CLIENTE'

  function hasProfile(perfil) {
    return normalizarPerfil(usuario?.perfil) === normalizarPerfil(perfil)
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        login,
        registrar,
        logout,
        atualizarUsuario,
        excluirConta,
        carregarUsuarioSalvo,
        isAdmin,
        isCliente,
        hasProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
