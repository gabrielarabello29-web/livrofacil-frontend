import AppRoutes from './routes/AppRoutes'
import { AuthProvider } from './context/AuthContext'
import { CarrinhoProvider } from './context/CarrinhoContext'

export default function App() {
  return (
    <AuthProvider>
      <CarrinhoProvider>
        <AppRoutes />
      </CarrinhoProvider>
    </AuthProvider>
  )
}
