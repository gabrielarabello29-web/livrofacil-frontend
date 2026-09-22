import AppRoutes from '@/app/AppRoutes'
import { AuthProvider } from '@/features/auth/context/AuthContext'
import { CarrinhoProvider } from '@/features/carrinho/context/CarrinhoContext'
import { FavoritosProvider } from '@/features/favoritos/context/FavoritosContext'

export default function App() {
  return (
    <AuthProvider>
      <CarrinhoProvider>
        <FavoritosProvider>
          <AppRoutes />
        </FavoritosProvider>
      </CarrinhoProvider>
    </AuthProvider>
  )
}
