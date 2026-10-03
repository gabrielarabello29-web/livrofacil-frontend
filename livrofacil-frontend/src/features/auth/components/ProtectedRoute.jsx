import React, { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/AuthContext'

export default function ProtectedRoute({ children, requiredProfile = null }) {
  const { usuario, logout } = useAuth()
  const location = useLocation()

  useEffect(() => {
    if (usuario?.ativo === false) logout()
  }, [usuario, logout])

  if (!usuario) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (usuario.ativo === false) return <Navigate to="/login" replace state={{ mensagem: 'Esta conta já foi excluída.' }} />

  if (requiredProfile) {
    const perfilAtual = String(usuario?.perfil || '').toUpperCase()
    const perfilNecessario = String(requiredProfile).toUpperCase()

    if (perfilAtual !== perfilNecessario) {
      return <Navigate to={perfilAtual === 'ADMIN' ? '/admin' : '/'} replace />
    }
  }

  return children
}