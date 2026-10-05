import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import Header from '@/shared/components/Header'
import { CheckoutStepper } from '@/features/checkout/components/CheckoutChrome'
import { resolverEnderecoCheckoutAtual } from '@/features/checkout/api/checkoutApi'

const statusTexto = { EM_PROCESSAMENTO: 'Em processamento' }

function formatarEndereco(endereco) {
  if (!endereco) return ''
  if (typeof endereco === 'string') return endereco

  const rua = endereco.logradouro || endereco.tipoLogradouro || ''
  const numero = endereco.numero || ''
  const complemento = endereco.complemento ? ` - ${endereco.complemento}` : ''
  const bairro = endereco.bairro || ''
  const cidade = endereco.cidade || ''
  const estado = endereco.estado || ''
  const cep = endereco.cep || ''

  return `${rua}, ${numero}${complemento} - ${bairro}, ${cidade}/${estado} - CEP ${cep}`.replace(/\s+/g, ' ').trim()
}

export default function CheckoutSucessoPage() {
  const { state } = useLocation()
  const pedido = state?.pedido
  const endereco =
    state?.endereco ||
    resolverEnderecoCheckoutAtual({ pedidoId: pedido?.id, pedido })

  return (
    <div className="checkout-flow">
      <Header />
      <main className="page-container checkout-page checkout-success-page">
        <CheckoutStepper etapa={2} />
        <section className="card checkout-success-card">
          <div className="checkout-success-icon">✓</div>
          <h1>Pedido recebido!</h1>
          <p>Seu pedido foi recebido e está em processamento.</p>
          {pedido && (
            <div className="checkout-success-detail">
              <strong>Pedido #{pedido.id}</strong>
              <span>Total: R$ {Number(pedido.total || 0).toFixed(2).replace('.', ',')}</span>
              <span>Status: {statusTexto[pedido.status] || pedido.status}</span>
              {endereco && (
                <span>Entrega: {formatarEndereco(endereco)}</span>
              )}
            </div>
          )}
          <div className="checkout-success-actions">
            <Link className="btn-primary" to="/meus-pedidos">Acompanhar meus pedidos</Link>
            <Link className="btn-secondary" to="/livros">Voltar ao catálogo</Link>
          </div>
        </section>
      </main>
    </div>
  )
}
