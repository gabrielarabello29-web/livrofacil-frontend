import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../src/features/auth/context/AuthContext'
import { CarrinhoProvider } from '../../src/features/carrinho/context/CarrinhoContext'
import { FavoritosProvider } from '../../src/features/favoritos/context/FavoritosContext'

export function CartProviders({ children }) {
  return <AuthProvider><CarrinhoProvider>{children}</CarrinhoProvider></AuthProvider>
}

export function Router({ children }) {
  return <MemoryRouter>{children}</MemoryRouter>
}

export function FavoriteProviders({ children }) {
  return <FavoritosProvider>{children}</FavoritosProvider>
}
