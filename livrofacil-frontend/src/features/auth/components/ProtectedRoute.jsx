import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'

export default function ProtectedRoute({ children, requiredProfile = null }) {
  const { usuario } = useAuth()
  const location = useLocation()

  if (!usuario) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (requiredProfile) {
    const perfilAtual = String(usuario?.perfil || '').toUpperCase()
    const perfilNecessario = String(requiredProfile).toUpperCase()

    if (perfilAtual !== perfilNecessario) {
      return <Navigate to={perfilAtual === 'ADMIN' ? '/admin' : '/'} replace />
    }
  }

  return children
}