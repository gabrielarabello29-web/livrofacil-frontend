import React from 'react'
import { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from '../features/auth/api/authApi'

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
      setUsuario(usuarioAtual)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(usuarioAtual))
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
        nome: cliente?.nome,
        email: cliente?.email,
        cpf: cliente?.cpf,
        telefone: cliente?.telefone,
        dataNascimento: cliente?.dataNascimento,
        genero: cliente?.genero,
        perfil: 'CLIENTE',
      }
      return { sucesso: true, usuario }
    } catch (error) {
      return {
        sucesso: false,
        mensagem: error?.message || 'Não foi possível salvar o cliente. Verifique os dados informados.',
      }
    }
  }

  function logout() {
    setUsuario(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  function atualizarUsuario(dados) {
    setUsuario((prev) => normalizarUsuario({ ...(prev || {}), ...dados }))
  }

  function excluirConta() {
    if (!usuario) return { sucesso: false, mensagem: 'Nenhum usuário autenticado.' }
    return { sucesso: false, mensagem: 'A exclusão de conta ainda depende do endpoint real do backend.' }
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
