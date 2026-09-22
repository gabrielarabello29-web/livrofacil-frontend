import { Link, useLocation } from 'react-router-dom'
import Header from '../../components/Header'
import Footer from '../../components/Footer'

export default function CompraFinalizada() {
  const { state } = useLocation()
  const numeroPedido = Math.floor(Math.random() * 90000 + 10000)
  const data = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <div>
      <Header />
      <main>
        <div className="page-container" style={{ paddingTop: 80, paddingBottom: 120 }}>
          <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
            <div style={{ width: 88, height: 88, borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', animation: 'fadeIn 0.4s ease' }}>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>

            <h1 style={{ margin: '0 0 10px', fontSize: 30, fontWeight: 900, color: 'var(--text)' }}>Compra realizada com sucesso!</h1>
            <p style={{ margin: '0 0 40px', fontSize: 16, color: 'var(--text-muted)' }}>Seu pedido foi confirmado e está sendo processado.</p>

            <div className="card" style={{ padding: 28, textAlign: 'left', marginBottom: 32 }}>
              <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Detalhes do pedido</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  ['Número do pedido', `#${numeroPedido}`],
                  ['Data', data],
                  ['Valor total', state?.total ? `R$ ${state.total.toFixed(2).replace('.', ',')}` : 'R$ 97,80'],
                  ['Forma de pagamento', state?.formaPagamento === 'pix' ? 'Pix' : state?.formaPagamento === 'boleto' ? 'Boleto bancário' : 'Cartão de crédito'],
                  ['Status', 'Em processamento'],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{label}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: label === 'Status' ? '#D97706' : 'var(--text)', textAlign: 'right', maxWidth: '60%' }}>{value}</span>
                  </div>
                ))}
                {state?.endereco && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Endereço de entrega</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', textAlign: 'right', maxWidth: '60%' }}>
                      {state.endereco.logradouro}, {state.endereco.numero}<br />
                      {state.endereco.cidade}/{state.endereco.estado}
                    </span>
                  </div>
                )}
              </div>

              <div style={{ marginTop: 20, padding: '14px 16px', background: '#FFFBEB', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>📧</span>
                <p style={{ margin: 0, fontSize: 13, color: '#92400E' }}>Você receberá um e-mail de confirmação com os detalhes do pedido.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <Link to="/meus-pedidos" className="btn-secondary" style={{ padding: '12px 24px' }}>Ver meus pedidos</Link>
              <Link to="/" className="btn-primary" style={{ padding: '12px 24px' }}>Continuar comprando</Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
