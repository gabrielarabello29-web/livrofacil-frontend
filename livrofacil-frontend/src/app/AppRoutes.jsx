import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/AuthContext'
import ProtectedRoute from '@/features/auth/components/ProtectedRoute'

import Login from '@/features/auth/pages/Login'
import Cadastro from '@/features/auth/pages/Cadastro'

import Home from '@/features/home/pages/Home'
import LivrosPage from '@/features/livros/pages/LivrosPage'
import LivroDetalhesPage from '@/features/livros/pages/LivroDetalhesPage'
import Categorias from '@/features/catalogo/pages/Categorias'
import Favoritos from '@/features/favoritos/pages/Favoritos'

import Carrinho from '@/features/carrinho/pages/Carrinho'
import Checkout from '@/features/checkout/pages/Checkout'
import CompraFinalizada from '@/features/checkout/pages/CompraFinalizada'
import CheckoutEnderecoPage from '@/features/checkout/pages/CheckoutEnderecoPage'
import CheckoutPagamentoPage from '@/features/checkout/pages/CheckoutPagamentoPage'
import CheckoutRevisaoPage from '@/features/checkout/pages/CheckoutRevisaoPage'
import CheckoutSucessoPage from '@/features/checkout/pages/CheckoutSucessoPage'

import Perfil from '@/features/cliente/pages/Perfil'
import ClienteDetalhes from '@/features/cliente/pages/ClienteDetalhes'
import Historico from '@/features/cliente/pages/Historico'
import MinhasTrocas from '@/features/troca/pages/cliente/MinhasTrocas'
import SolicitarTroca from '@/features/troca/pages/cliente/SolicitarTroca'

import AdminDashboard from '@/features/analise/pages/Dashboard'
import GerenciarLivrosPage from '@/features/livros/pages/GerenciarLivrosPage'
import LivroFormPage from '@/features/livros/pages/LivroFormPage'
import LivroEstoquePage from '@/features/livros/pages/LivroEstoquePage'
import AdminCategorias from '@/features/catalogo/pages/AdminCategorias'
import AdminClientes from '@/features/cliente/pages/Clientes'
import AdminVendas from '@/features/vendas/pages/Vendas'
import AdminEstoque from '@/features/estoque/pages/Estoque'
import AdminTrocas from '@/features/troca/pages/admin/Trocas'
import AdminCupons from '@/features/cupom/pages/admin/Cupons'
import AdminAnalise from '@/features/analise/pages/AnaliseVendas'
import AdminUsuarios from '@/features/configuracoes/pages/Usuarios'
import AdminConfiguracoes from '@/features/configuracoes/pages/Configuracoes'

// Detalhe do pedido (cliente)
import DetalhePedido from '@/features/pedidos/pages/cliente/DetalhePedido'
import MeusPedidosPage from '@/features/pedidos/pages/cliente/MeusPedidosPage'
import MeuPedidoDetalhesPage from '@/features/pedidos/pages/cliente/MeuPedidoDetalhesPage'
import AdminPedidosPage from '@/features/pedidos/pages/admin/AdminPedidosPage'
import AdminPedidoDetalhesPage from '@/features/pedidos/pages/admin/AdminPedidoDetalhesPage'

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
        <Route path="/favoritos" element={<Favoritos />} />
        <Route path="/clientes" element={<ProtectedRoute requiredProfile="ADMIN"><AdminClientes /></ProtectedRoute>} />
        <Route path="/clientes/:id" element={<ProtectedRoute><ClienteDetalhes /></ProtectedRoute>} />

        <Route path="/carrinho" element={<ProtectedRoute requiredProfile="CLIENTE"><Carrinho /></ProtectedRoute>} />
        <Route path="/checkout" element={<Navigate to="/checkout/endereco" replace />} />
        <Route path="/checkout/endereco" element={<ProtectedRoute requiredProfile="CLIENTE"><CheckoutEnderecoPage /></ProtectedRoute>} />
        <Route path="/checkout/pagamento" element={<ProtectedRoute requiredProfile="CLIENTE"><CheckoutPagamentoPage /></ProtectedRoute>} />
        <Route path="/checkout/revisao" element={<ProtectedRoute requiredProfile="CLIENTE"><CheckoutRevisaoPage /></ProtectedRoute>} />
        <Route path="/checkout/sucesso" element={<ProtectedRoute requiredProfile="CLIENTE"><CheckoutSucessoPage /></ProtectedRoute>} />
        <Route path="/compra-finalizada" element={<ProtectedRoute><CompraFinalizada /></ProtectedRoute>} />

        <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
        <Route path="/enderecos" element={<ProtectedRoute><RotaClienteDetalhes secao="enderecos" /></ProtectedRoute>} />
        <Route path="/cartoes" element={<ProtectedRoute><RotaClienteDetalhes secao="cartoes" /></ProtectedRoute>} />
        <Route path="/meus-pedidos" element={<ProtectedRoute requiredProfile="CLIENTE"><MeusPedidosPage /></ProtectedRoute>} />
        <Route path="/meus-pedidos/:id" element={<ProtectedRoute requiredProfile="CLIENTE"><MeuPedidoDetalhesPage /></ProtectedRoute>} />
        <Route path="/trocas" element={<ProtectedRoute><MinhasTrocas /></ProtectedRoute>} />
        <Route path="/trocas/nova" element={<ProtectedRoute><SolicitarTroca /></ProtectedRoute>} />

        <Route path="/admin" element={<ProtectedRoute requiredProfile="ADMIN"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/livros" element={<ProtectedRoute requiredProfile="ADMIN"><GerenciarLivrosPage /></ProtectedRoute>} />
        <Route path="/admin/livros/novo" element={<ProtectedRoute requiredProfile="ADMIN"><LivroFormPage /></ProtectedRoute>} />
        <Route path="/admin/livros/:id" element={<ProtectedRoute requiredProfile="ADMIN"><LivroDetalhesPage administrativo /></ProtectedRoute>} />
        <Route path="/admin/livros/:id/editar" element={<ProtectedRoute requiredProfile="ADMIN"><LivroFormPage /></ProtectedRoute>} />
        <Route path="/admin/livros/:id/estoque" element={<ProtectedRoute requiredProfile="ADMIN"><LivroEstoquePage /></ProtectedRoute>} />
        <Route path="/admin/categorias" element={<ProtectedRoute requiredProfile="ADMIN"><AdminCategorias /></ProtectedRoute>} />
        <Route path="/admin/clientes" element={<ProtectedRoute requiredProfile="ADMIN"><AdminClientes /></ProtectedRoute>} />
        <Route path="/admin/pedidos" element={<ProtectedRoute requiredProfile="ADMIN"><AdminPedidosPage /></ProtectedRoute>} />
        <Route path="/admin/pedidos/:id" element={<ProtectedRoute requiredProfile="ADMIN"><AdminPedidoDetalhesPage /></ProtectedRoute>} />
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
