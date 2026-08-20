import { createContext, useContext, useState, useEffect } from 'react'
import { autenticar, cadastrar } from '../mock/authMock'

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

  const isAdmin = usuario?.perfil === 'ADMIN'
  const isCliente = usuario?.perfil === 'CLIENTE'

  return (
    <AuthContext.Provider value={{ usuario, login, registrar, logout, atualizarUsuario, isAdmin, isCliente }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
