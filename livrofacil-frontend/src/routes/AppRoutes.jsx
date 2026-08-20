import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

import Login from '../pages/login/Login'
import Cadastro from '../pages/cadastro/Cadastro'

import Home from '../pages/Home'
import ListaLivros from '../pages/livros/ListaLivros'
import DetalhesLivro from '../pages/livros/DetalhesLivro'
import Categorias from '../pages/Categorias'

import Carrinho from '../pages/carrinho/Carrinho'
import Checkout from '../pages/compra/Checkout'
import CompraFinalizada from '../pages\compra\CompraFinalizada'

import Perfil from '../pages/cliente/Perfil'
import Enderecos from '../pages/cliente/Enderecos'
import Cartoes from '../pages/cliente/Cartoes'
import Historico from '../pages/cliente/Historico'
import MinhasTrocas from '../pages/trocas/MinhasTrocas'
import SolicitarTroca from '../pages/trocas/SolicitarTroca'

import AdminDashboard from '../pages/admin/Dashboard'
import AdminLivros from '../pages/admin/Livros'
import CadastroLivro from '../pages/livros/CadastroLivro'
import AdminCategorias from '../pages/admin/Categorias'
import AdminClientes from '../pages/admin/Clientes'
import AdminVendas from '../pages/admin/Vendas'
import AdminEstoque from '../pages/admin/Estoque'
import AdminTrocas from '../pages/admin/Trocas'
import AdminCupons from '../pages/admin/Cupons'
import AdminAnalise from '../pages/admin/AnaliseVendas'
import AdminUsuarios from '../pages/admin/Usuarios'
import AdminConfiguracoes from '../pages/admin/Configuracoes'

function RotaProtegida({ children, perfil }) {
  const { usuario } = useAuth()
  if (!usuario) return <Navigate to="/login" replace />
  if (perfil && usuario.perfil !== perfil) return <Navigate to="/" replace />
  return children
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />

        <Route path="/" element={<Home />} />
        <Route path="/livros" element={<ListaLivros />} />
        <Route path="/livros/:id" element={<DetalhesLivro />} />
        <Route path="/categorias" element={<Categorias />} />

        <Route path="/carrinho" element={<Carrinho />} />
        <Route path="/checkout" element={<RotaProtegida><Checkout /></RotaProtegida>} />
        <Route path="/compra-finalizada" element={<RotaProtegida><CompraFinalizada /></RotaProtegida>} />

        <Route path="/perfil" element={<RotaProtegida><Perfil /></RotaProtegida>} />
        <Route path="/enderecos" element={<RotaProtegida><Enderecos /></RotaProtegida>} />
        <Route path="/cartoes" element={<RotaProtegida><Cartoes /></RotaProtegida>} />
        <Route path="/meus-pedidos" element={<RotaProtegida><Historico /></RotaProtegida>} />
        <Route path="/trocas" element={<RotaProtegida><MinhasTrocas /></RotaProtegida>} />
        <Route path="/trocas/nova" element={<RotaProtegida><SolicitarTroca /></RotaProtegida>} />

        <Route path="/admin" element={<RotaProtegida perfil="ADMIN"><AdminDashboard /></RotaProtegida>} />
        <Route path="/admin/livros" element={<RotaProtegida perfil="ADMIN"><AdminLivros /></RotaProtegida>} />
        <Route path="/admin/livros/novo" element={<RotaProtegida perfil="ADMIN"><CadastroLivro /></RotaProtegida>} />
        <Route path="/admin/livros/:id/editar" element={<RotaProtegida perfil="ADMIN"><CadastroLivro /></RotaProtegida>} />
        <Route path="/admin/categorias" element={<RotaProtegida perfil="ADMIN"><AdminCategorias /></RotaProtegida>} />
        <Route path="/admin/clientes" element={<RotaProtegida perfil="ADMIN"><AdminClientes /></RotaProtegida>} />
        <Route path="/admin/pedidos" element={<RotaProtegida perfil="ADMIN"><AdminVendas /></RotaProtegida>} />
        <Route path="/admin/estoque" element={<RotaProtegida perfil="ADMIN"><AdminEstoque /></RotaProtegida>} />
        <Route path="/admin/trocas" element={<RotaProtegida perfil="ADMIN"><AdminTrocas /></RotaProtegida>} />
        <Route path="/admin/cupons" element={<RotaProtegida perfil="ADMIN"><AdminCupons /></RotaProtegida>} />
        <Route path="/admin/relatorios" element={<RotaProtegida perfil="ADMIN"><AdminAnalise /></RotaProtegida>} />
        <Route path="/admin/usuarios" element={<RotaProtegida perfil="ADMIN"><AdminUsuarios /></RotaProtegida>} />
        <Route path="/admin/configuracoes" element={<RotaProtegida perfil="ADMIN"><AdminConfiguracoes /></RotaProtegida>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
