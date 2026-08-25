import { Link, useNavigate } from 'react-router-dom'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import CarrinhoItem from '../../components/CarrinhoItem'
import { useCarrinho } from '../../context/CarrinhoContext'
import { useAuth } from '../../context/AuthContext'
import { cupomService } from '../../services/cupomService'
import { useState } from 'react'

export default function Carrinho() {
  const { itens, subtotal, limparCarrinho } = useCarrinho()
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const frete = subtotal > 150 ? 0 : 19.90
  const total = subtotal + frete

  const [codigoCupom, setCodigoCupom] = useState('')
  const [appliedCupons, setAppliedCupons] = useState([]) // suporta múltiplos cupons
  const [descontoTotal, setDescontoTotal] = useState(0)

  function handleFinalizar() {
    if (!usuario) navigate('/login')
    else navigate('/checkout', { state: { cupons: appliedCupons.map(c => c.codigo) } })
  }

  async function aplicarCupom() {
    if (!codigoCupom.trim()) return
    try {
      const res = await cupomService.validarCupom(codigoCupom.trim())
      const data = res.data || res
      if (data?.valido) {
        // evitar duplicados
        if (appliedCupons.find(c => c.codigo === codigoCupom.trim())) {
          alert('Cupom já aplicado')
          return
        }

        let valorDesconto = 0
        if (data.tipo === 'valor') valorDesconto = Number(data.valor)
        else if (data.tipo === 'percentual') valorDesconto = subtotal * (Number(data.valor) / 100)

        const novoCupom = { codigo: codigoCupom.trim(), tipo: data.tipo, valor: Number(data.valor), descontoCalculado: valorDesconto }
        const proximo = [...appliedCupons, novoCupom]
        setAppliedCupons(proximo)
        setDescontoTotal(prev => Number((prev + valorDesconto).toFixed(2)))
        setCodigoCupom('')
      } else {
        alert(data?.mensagem || 'Cupom inválido')
      }
    } catch (err) {
      console.error(err)
      alert('Erro ao validar cupom')
    }
  }

  function removerCupom(codigo) {
    const proximo = appliedCupons.filter(c => c.codigo !== codigo)
    const desconto = appliedCupons.find(c => c.codigo === codigo)?.descontoCalculado || 0
    setAppliedCupons(proximo)
    setDescontoTotal(prev => Number((prev - desconto).toFixed(2)))
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

                    {appliedCupons.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 600 }}>Cupons aplicados</span>
                          <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{appliedCupons.length}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {appliedCupons.map(c => (
                            <div key={c.codigo} style={{ padding: '6px 10px', borderRadius: 8, background: '#F3F4F6', display: 'flex', gap: 8, alignItems: 'center' }}>
                              <span style={{ fontWeight: 700 }}>{c.codigo}</span>
                              <span style={{ color: 'var(--text-muted)' }}>- R$ {c.descontoCalculado.toFixed(2).replace('.', ',')}</span>
                              <button onClick={() => removerCupom(c.codigo)} className="btn-ghost" style={{ padding: '4px 8px' }}>Remover</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 12, display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Total</span>
                      <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary)' }}>R$ {(total - descontoTotal).toFixed(2).replace('.', ',')}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}>
                      ou 12x de R$ {((total - descontoTotal) / 12).toFixed(2).replace('.', ',')} sem juros
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
                  <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Aplicar cupom</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input value={codigoCupom} onChange={e => setCodigoCupom(e.target.value)} placeholder="Insira o cupom" className="input-field" style={{ flex: 1, padding: '8px 12px' }} />
                    <button onClick={aplicarCupom} className="btn-secondary" style={{ padding: '8px 14px', fontSize: 13 }}>Aplicar</button>
                  </div>
                  {descontoTotal > 0 && (
                    <p style={{ marginTop: 8, color: '#065F46', fontWeight: 600 }}>Desconto total: R$ {descontoTotal.toFixed(2).replace('.', ',')}</p>
                  )}
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