import React from 'react'
import { Link } from 'react-router-dom'
import { useCarrinho } from '@/features/carrinho/context/CarrinhoContext'

const etapas = ['Endereço', 'Pagamento', 'Revisão']

export function CheckoutStepper({ etapa = 0 }) {
  return (
    <nav className="checkout-stepper" aria-label="Etapas do checkout">
      {etapas.map((nome, index) => (
        <div className="checkout-stepper-item" key={nome}>
          <span className={index <= etapa ? 'active' : ''}>{index + 1}. {nome}</span>
          {index < etapas.length - 1 && <div className={`checkout-stepper-line ${index < etapa ? 'active' : ''}`} aria-hidden="true" />}
        </div>
      ))}
    </nav>
  )
}

export function CheckoutSummary({ pedido }) {
  const { itens, subtotal } = useCarrinho()
  const totalPedido = pedido?.valorTotal ?? pedido?.total
  const freteInformado = pedido?.frete ?? pedido?.valorFrete
  const freteCalculado = Number(subtotal || 0) > 150 ? 0 : 19.90
  const frete = Number(freteInformado ?? (totalPedido != null
    ? Math.max(0, Number(totalPedido) - Number(subtotal || 0))
    : freteCalculado))
  const total = Number(totalPedido ?? (Number(subtotal || 0) + frete))
  return (
    <aside className="card checkout-summary">
      <h2>Resumo da compra</h2>
      <div className="summary-lines">
        <div><span>Itens</span><strong>{itens.length}</strong></div>
        <div><span>Subtotal</span><strong>R$ {Number(subtotal || 0).toFixed(2).replace('.', ',')}</strong></div>
        <div><span>Frete</span><strong>{frete === 0 ? 'Grátis' : `R$ ${frete.toFixed(2).replace('.', ',')}`}</strong></div>
      </div>
      <div className="summary-total"><span>Total</span><strong>R$ {total.toFixed(2).replace('.', ',')}</strong></div>
      <Link to="/carrinho" className="checkout-back-link">Voltar ao carrinho</Link>
    </aside>
  )
}
