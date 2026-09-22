import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ProtectedRoute from '../features/auth/components/ProtectedRoute'

import Login from '../pages/login/Login'
import Cadastro from '../pages/cadastro/Cadastro'

import Home from '../pages/Home'
import LivrosPage from '../features/livros/pages/LivrosPage'
import LivroDetalhesPage from '../features/livros/pages/LivroDetalhesPage'
import Categorias from '../pages/Categorias'

import Carrinho from '../pages/carrinho/Carrinho'
import Checkout from '../pages/compra/Checkout'
import CompraFinalizada from '../pages/compra/CompraFinalizada'

import Perfil from '../pages/cliente/Perfil'
import ClienteDetalhes from '../pages/cliente/ClienteDetalhes'
import Historico from '../pages/cliente/Historico'
import MinhasTrocas from '../pages/trocas/MinhasTrocas'
import SolicitarTroca from '../pages/trocas/SolicitarTroca'

import AdminDashboard from '../pages/admin/Dashboard'
import GerenciarLivrosPage from '../features/livros/pages/GerenciarLivrosPage'
import LivroFormPage from '../features/livros/pages/LivroFormPage'
import AdminCategorias from '../pages/admin/Categorias'
import AdminClientes from '../pages/admin/Clientes'
import AdminVendas from '../pages/admin/Vendas'
import AdminEstoque from '../pages/admin/Estoque'
import AdminTrocas from '../pages/admin/Trocas'
import AdminCupons from '../pages/admin/Cupons'
import AdminAnalise from '../pages/admin/AnaliseVendas'
import AdminUsuarios from '../pages/admin/Usuarios'
import AdminConfiguracoes from '../pages/admin/Configuracoes'

// Detalhe do pedido (cliente)
import DetalhePedido from '../pages/pedidos/DetalhePedido'

function RotaClienteDetalhes({ secao }) {
  const { usuario } = useAuth()
  if (!usuario?.id) return <Navigate to="/perfil" replace />
  return <Navigate to={`/clientes/${usuario.id}?secao=${secao}`} replace />
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Login initialMode="cadastro" />} />

        <Route path="/" element={<Home />} />
        <Route path="/livros" element={<LivrosPage />} />
        <Route path="/livros/:id" element={<LivroDetalhesPage />} />
        <Route path="/categorias" element={<Categorias />} />
        <Route path="/clientes" element={<AdminClientes />} />
        <Route path="/clientes/:id" element={<ClienteDetalhes />} />

        <Route path="/carrinho" element={<Carrinho />} />
        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/compra-finalizada" element={<ProtectedRoute><CompraFinalizada /></ProtectedRoute>} />

        <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
        <Route path="/enderecos" element={<ProtectedRoute><RotaClienteDetalhes secao="enderecos" /></ProtectedRoute>} />
        <Route path="/cartoes" element={<ProtectedRoute><RotaClienteDetalhes secao="cartoes" /></ProtectedRoute>} />
        <Route path="/meus-pedidos" element={<ProtectedRoute><Historico /></ProtectedRoute>} />
        <Route path="/meus-pedidos/:id" element={<ProtectedRoute><DetalhePedido /></ProtectedRoute>} />
        <Route path="/trocas" element={<ProtectedRoute><MinhasTrocas /></ProtectedRoute>} />
        <Route path="/trocas/nova" element={<ProtectedRoute><SolicitarTroca /></ProtectedRoute>} />

        <Route path="/admin" element={<ProtectedRoute requiredProfile="ADMIN"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/livros" element={<ProtectedRoute requiredProfile="ADMIN"><GerenciarLivrosPage /></ProtectedRoute>} />
        <Route path="/admin/livros/novo" element={<ProtectedRoute requiredProfile="ADMIN"><LivroFormPage /></ProtectedRoute>} />
        <Route path="/admin/livros/:id" element={<ProtectedRoute requiredProfile="ADMIN"><LivroDetalhesPage /></ProtectedRoute>} />
        <Route path="/admin/livros/:id/editar" element={<ProtectedRoute requiredProfile="ADMIN"><LivroFormPage /></ProtectedRoute>} />
        <Route path="/admin/categorias" element={<ProtectedRoute requiredProfile="ADMIN"><AdminCategorias /></ProtectedRoute>} />
        <Route path="/admin/clientes" element={<ProtectedRoute requiredProfile="ADMIN"><AdminClientes /></ProtectedRoute>} />
        <Route path="/admin/pedidos" element={<ProtectedRoute requiredProfile="ADMIN"><AdminVendas /></ProtectedRoute>} />
        <Route path="/admin/estoque" element={<ProtectedRoute requiredProfile="ADMIN"><AdminEstoque /></ProtectedRoute>} />
        <Route path="/admin/trocas" element={<ProtectedRoute requiredProfile="ADMIN"><AdminTrocas /></ProtectedRoute>} />
        <Route path="/admin/cupons" element={<ProtectedRoute requiredProfile="ADMIN"><AdminCupons /></ProtectedRoute>} />
        <Route path="/admin/relatorios" element={<ProtectedRoute requiredProfile="ADMIN"><AdminAnalise /></ProtectedRoute>} />
        <Route path="/admin/usuarios" element={<ProtectedRoute requiredProfile="ADMIN"><AdminUsuarios /></ProtectedRoute>} />
        <Route path="/admin/configuracoes" element={<ProtectedRoute requiredProfile="ADMIN"><AdminConfiguracoes /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
