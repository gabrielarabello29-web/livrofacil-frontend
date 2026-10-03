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
  const subtotalPedido = Number(pedido?.subtotal ?? subtotal ?? 0)
  const desconto = Number(pedido?.desconto ?? 0)
  const cupomCodigo = typeof pedido?.cupom === 'string'
    ? pedido.cupom
    : pedido?.cupom?.codigo || pedido?.cupomCodigo
  const freteInformado = pedido?.frete ?? pedido?.valorFrete
  const freteCalculado = subtotalPedido > 150 ? 0 : 19.90
  const frete = Number(
    freteInformado ??
      (totalPedido != null
        ? Math.max(0, Number(totalPedido) - subtotalPedido + desconto)
        : freteCalculado),
  )
  const total = Number(totalPedido ?? (subtotalPedido + frete - desconto))
  return (
    <aside className="card checkout-summary">
      <h2>Resumo da compra</h2>
      <div className="summary-lines">
        <div><span>Itens</span><strong>{itens.length}</strong></div>
        <div><span>Subtotal</span><strong>R$ {subtotalPedido.toFixed(2).replace('.', ',')}</strong></div>
        <div><span>Frete</span><strong>{frete === 0 ? 'Grátis' : `R$ ${frete.toFixed(2).replace('.', ',')}`}</strong></div>
        {desconto > 0 && <div><span>Desconto{cupomCodigo ? ` (${cupomCodigo})` : ''}</span><strong>- R$ {desconto.toFixed(2).replace('.', ',')}</strong></div>}
      </div>
      <div className="summary-total"><span>Total</span><strong>R$ {total.toFixed(2).replace('.', ',')}</strong></div>
      <Link to="/carrinho" className="checkout-back-link">Voltar ao carrinho</Link>
    </aside>
  )
}
