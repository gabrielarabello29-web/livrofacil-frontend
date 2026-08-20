import { Link, useNavigate } from 'react-router-dom'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import CarrinhoItem from '../../components/CarrinhoItem'
import { useCarrinho } from '../../context/CarrinhoContext'
import { useAuth } from '../../context/AuthContext'

export default function Carrinho() {
  const { itens, subtotal, limparCarrinho } = useCarrinho()
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const frete = subtotal > 150 ? 0 : 19.90
  const total = subtotal + frete

  function handleFinalizar() {
    if (!usuario) navigate('/login')
    else navigate('/checkout')
  }

  return (
    <div>
      <Header />
      <main>
        <div className="page-container" style={{ paddingTop: 40, paddingBottom: 80 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: 'var(--text)' }}>Carrinho</h1>
            {itens.length > 0 && <span className="badge badge-purple">{itens.length} {itens.length === 1 ? 'item' : 'itens'}</span>}
          </div>

          {itens.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
              <div style={{ fontSize: 72, marginBottom: 20 }}>🛒</div>
              <h2 style={{ margin: '0 0 10px', fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>Seu carrinho está vazio</h2>
              <p style={{ margin: '0 0 32px', color: 'var(--text-muted)', fontSize: 16 }}>Adicione livros ao carrinho para continuar</p>
              <Link to="/livros" className="btn-primary" style={{ padding: '14px 32px', fontSize: 15 }}>Explorar livros</Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 40, alignItems: 'flex-start' }}>
              {/* Items */}
              <div className="card" style={{ padding: '8px 24px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0 12px', borderBottom: '1px solid #F3F4F6', marginBottom: 4 }}>
                  <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Seus itens</h2>
                  <button onClick={limparCarrinho} style={{ background: 'none', border: 'none', fontSize: 13, color: 'var(--danger)', cursor: 'pointer' }}>Limpar carrinho</button>
                </div>
                {itens.map(item => <CarrinhoItem key={item.id} item={item} />)}
              </div>

              {/* Summary */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="card" style={{ padding: 24 }}>
                  <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Resumo do pedido</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--text-muted)' }}>
                      <span>Subtotal ({itens.length} {itens.length === 1 ? 'item' : 'itens'})</span>
                      <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--text-muted)' }}>
                      <span>Frete</span>
                      <span style={{ color: frete === 0 ? '#10B981' : 'var(--text)' }}>{frete === 0 ? 'Grátis' : `R$ ${frete.toFixed(2).replace('.', ',')}`}</span>
                    </div>
                    {frete === 0 && (
                      <p style={{ margin: '0', fontSize: 12, color: '#10B981', fontWeight: 500 }}>✓ Você ganhou frete grátis!</p>
                    )}
                    {frete > 0 && (
                      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Frete grátis acima de R$ 150,00</p>
                    )}
                    <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 12, display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Total</span>
                      <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary)' }}>R$ {total.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}>
                      ou 12x de R$ {(total / 12).toFixed(2).replace('.', ',')} sem juros
                    </p>
                  </div>
                  <button onClick={handleFinalizar} className="btn-primary" style={{ width: '100%', padding: '14px', fontSize: 15, marginTop: 20 }}>
                    Finalizar compra
                  </button>
                  <Link to="/livros" style={{ display: 'block', textAlign: 'center', marginTop: 14, fontSize: 14, color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
                    ← Continuar comprando
                  </Link>
                </div>

                <div className="card" style={{ padding: 16 }}>
                  <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Cupom de desconto</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input placeholder="Insira o cupom" className="input-field" style={{ flex: 1, padding: '8px 12px' }} />
                    <button className="btn-secondary" style={{ padding: '8px 14px', fontSize: 13 }}>Aplicar</button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 4px' }}>
                  {['🔒 Pagamento 100% seguro', '📦 Frete rápido e rastreável', '🔄 Troca garantida em 7 dias'].map(t => (
                    <p key={t} style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>{t}</p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
