import React from 'react'
import { Link } from 'react-router-dom'
import { useCarrinho } from '@/features/carrinho/context/CarrinhoContext'

const etapas = ['Endereço', 'Pagamento', 'Revisão']

export function CheckoutStepper({ etapa = 0 }) {
  return (
    <nav className="checkout-stepper" aria-label="Etapas do checkout">
      {etapas.map((nome, index) => <span key={nome} className={index <= etapa ? 'active' : ''}>{index + 1}. {nome}</span>)}
    </nav>
  )
}

export function CheckoutSummary({ pedido }) {
  const { itens, subtotal } = useCarrinho()
  const total = Number(pedido?.valorTotal ?? pedido?.total ?? subtotal ?? 0)
  return (
    <aside className="card checkout-summary">
      <h2>Resumo da compra</h2>
      <div><span>Itens</span><strong>{itens.length}</strong></div>
      <div><span>Subtotal</span><strong>R$ {Number(subtotal || 0).toFixed(2).replace('.', ',')}</strong></div>
      <div className="checkout-summary-total"><span>Total</span><strong>R$ {total.toFixed(2).replace('.', ',')}</strong></div>
      <Link to="/carrinho" className="btn-ghost">Voltar ao carrinho</Link>
    </aside>
  )
}
