import { createContext, useContext, useState, useEffect } from 'react'
import { autenticar, cadastrar, excluirUsuario } from '../mock/authMock'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    try {
      const salvo = localStorage.getItem('livrofacil_usuario')
      return salvo ? JSON.parse(salvo) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (usuario) {
      localStorage.setItem('livrofacil_usuario', JSON.stringify(usuario))
    } else {
      localStorage.removeItem('livrofacil_usuario')
    }
  }, [usuario])

  function login(email, senha) {
    const resultado = autenticar(email, senha)
    if (resultado.sucesso) setUsuario(resultado.usuario)
    return resultado
  }

  function registrar(dados) {
    const resultado = cadastrar(dados)
    if (resultado.sucesso) setUsuario(resultado.usuario)
    return resultado
  }

  function logout() {
    setUsuario(null)
  }

  function atualizarUsuario(dados) {
    setUsuario((prev) => ({ ...prev, ...dados }))
  }

  function excluirConta() {
    if (!usuario) return { sucesso: false, mensagem: 'Nenhum usuário autenticado.' }
    const resultado = excluirUsuario(usuario.id)
    if (resultado.sucesso) {
      setUsuario(null)
      return { sucesso: true }
    }
    return resultado
  }

  const isAdmin = usuario?.perfil === 'ADMIN'
  const isCliente = usuario?.perfil === 'CLIENTE'

  return (
    <AuthContext.Provider value={{ usuario, login, registrar, logout, atualizarUsuario, excluirConta, isAdmin, isCliente }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
