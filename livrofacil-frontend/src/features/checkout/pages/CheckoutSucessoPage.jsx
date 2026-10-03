import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import Header from '@/shared/components/Header'
import { CheckoutStepper } from '@/features/checkout/components/CheckoutChrome'

const statusTexto = { EM_PROCESSAMENTO: 'Em processamento' }

export default function CheckoutSucessoPage() { const { state } = useLocation(); const pedido = state?.pedido; return <div className="checkout-flow"><Header /><main className="page-container checkout-page checkout-success-page"><CheckoutStepper etapa={2} /><section className="card checkout-success-card"><div className="checkout-success-icon">✓</div><h1>Pedido recebido!</h1><p>Seu pedido foi recebido e está em processamento.</p>{pedido && <div className="checkout-success-detail"><strong>Pedido #{pedido.id}</strong><span>Total: R$ {Number(pedido.total || 0).toFixed(2).replace('.', ',')}</span><span>Status: {statusTexto[pedido.status] || pedido.status}</span></div>}<div className="checkout-success-actions"><Link className="btn-primary" to="/meus-pedidos">Acompanhar meus pedidos</Link><Link className="btn-secondary" to="/livros">Voltar ao catálogo</Link></div></section></main></div> }
