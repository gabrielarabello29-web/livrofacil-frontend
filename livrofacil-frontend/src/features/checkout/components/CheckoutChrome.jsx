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
  const itensResumo = Array.isArray(pedido?.itens) && pedido.itens.length > 0 ? pedido.itens : itens
  const totalItens = itensResumo.reduce((soma, item) => soma + Number(item?.quantidade || 0), 0)
  const totalRetornado = pedido?.valorTotal ?? pedido?.total
  const totalPedido = totalRetornado == null ? null : Number(totalRetornado)
  const subtotalPedido = Number(pedido?.subtotal ?? pedido?.valorSubtotal ?? subtotal ?? 0)
  const desconto = Number(pedido?.desconto ?? 0)
  const cupomCodigo = typeof pedido?.cupom === 'string'
    ? pedido.cupom
    : pedido?.cupom?.codigo || pedido?.cupomCodigo
  const frete = Number(pedido?.frete ?? pedido?.valorFrete ?? 0)
  const freteExibido = pedido?.frete == null && pedido?.valorFrete == null ? 'A calcular' : `R$ ${frete.toFixed(2).replace('.', ',')}`
  const total = Number.isFinite(totalPedido) ? totalPedido : null
  return (
    <aside className="card checkout-summary">
      <h2>Resumo da compra</h2>
      <div className="summary-lines">
        <div><span>Itens</span><strong>{totalItens}</strong></div>
        <div><span>Subtotal</span><strong>R$ {subtotalPedido.toFixed(2).replace('.', ',')}</strong></div>
        <div><span>Frete</span><strong>{freteExibido}</strong></div>
        {desconto > 0 && <div><span>Desconto{cupomCodigo ? ` (${cupomCodigo})` : ''}</span><strong>- R$ {desconto.toFixed(2).replace('.', ',')}</strong></div>}
      </div>
      <div className="summary-total"><span>Total</span><strong>{total == null ? 'A calcular' : `R$ ${total.toFixed(2).replace('.', ',')}`}</strong></div>
      <Link to="/carrinho" className="checkout-back-link">Voltar ao carrinho</Link>
    </aside>
  )
}
