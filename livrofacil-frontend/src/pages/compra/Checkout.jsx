import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import Header from '../../components/Header'
import { useCarrinho } from '../../context/CarrinhoContext'
import { useAuth } from '../../context/AuthContext'
import PaymentSplit from '../../components/PaymentSplit'
import { pedidoService } from '../../services/pedidoService'
import { clienteService } from '../../services/clienteService'
import { cupomService } from '../../services/cupomService'

const etapas = ['Endereço', 'Pagamento', 'Resumo']

export default function Checkout() {
  const { itens, subtotal, limparCarrinho } = useCarrinho()
  const { usuario, atualizarUsuario } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [etapa, setEtapa] = useState(0)
  const [enderecoSelecionado, setEnderecoSelecionado] = useState(0)
  const [cartaoSelecionado, setCartaoSelecionado] = useState(0)
  const [formaPagamento, setFormaPagamento] = useState('cartao')
  const [processando, setProcessando] = useState(false)
  const [splits, setSplits] = useState([])
  const [appliedCupons, setAppliedCupons] = useState([]) // array de códigos
  const [showNewAddressForm, setShowNewAddressForm] = useState(false)
  const [novoEndereco, setNovoEndereco] = useState({ identificacao: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: '' })

  const enderecos = usuario?.enderecos || []
  const cartoes = usuario?.cartoes || []
  const frete = subtotal > 150 ? 0 : 19.90
  const total = subtotal + frete

  useEffect(() => {
    if (location?.state?.cupons) setAppliedCupons(location.state.cupons)
  }, [location])

  useEffect(() => {
    if (splits.length === 0) {
      setSplits([{ id: Date.now(), tipo: 'cartao', cartaoId: cartoes?.[0]?.id || null, valor: Number(total.toFixed(2)) }])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartoes, total])

  async function adicionarEnderecoInline() {
    // validações simples
    if (!novoEndereco.identificacao || !novoEndereco.logradouro || !novoEndereco.cep) {
      alert('Preencha pelo menos identificação, logradouro e CEP.')
      return
    }
    try {
      const res = await clienteService.adicionarEndereco(usuario.id, novoEndereco)
      // res.data expected to include created address; atualizar usuário em contexto
      const enderecoCriado = res.data || res
      atualizarUsuario({ enderecos: [...(usuario.enderecos || []), enderecoCriado] })
      setShowNewAddressForm(false)
      setNovoEndereco({ identificacao: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: '' })
      setEnderecoSelecionado((usuario.enderecos || []).length) // selecionar o novo endereço
      alert('Endereço adicionado')
    } catch (err) {
      console.error(err)
      alert('Erro ao adicionar endereço')
    }
  }

  async function aplicarCupom(codigo) {
    if (!codigo) return
    try {
      const res = await cupomService.validarCupom(codigo)
      const data = res.data || res
      if (!data?.valido) {
        alert(data?.mensagem || 'Cupom inválido')
        return
      }
      if (appliedCupons.includes(codigo)) {
        alert('Cupom já aplicado')
        return
      }
      setAppliedCupons(prev => [...prev, codigo])
      alert(`Cupom ${codigo} aplicado`)
    } catch (err) {
      console.error(err)
      alert('Erro ao validar cupom')
    }
  }

  async function finalizar() {
    setProcessando(true)

    const somaPagamentos = splits.reduce((s, p) => s + Number(p.valor || 0), 0)
    if (Number(somaPagamentos.toFixed(2)) < Number(total.toFixed(2))) {
      alert('A soma dos pagamentos é menor que o total. Ajuste os valores das formas de pagamento.')
      setProcessando(false)
      return
    }

    const payload = {
      itens: itens.map(i => ({ produtoId: i.id, quantidade: i.quantidade, precoUnitario: i.preco })),
      enderecoId: enderecos[enderecoSelecionado]?.id || null,
      pagamentos: splits.map(s => {
        const base = { tipo: s.tipo, valor: Number(s.valor || 0) }
        if (s.tipo === 'cartao') base.cartaoId = s.cartaoId
        if (s.tipo === 'cupom') base.codigo = s.codigo || null
        return base
      }),
      cupons: appliedCupons,
      frete,
      total: Number(total.toFixed(2)),
    }

    try {
      await pedidoService.criarPedido(payload)
      await new Promise(r => setTimeout(r, 800))
      limparCarrinho()
      navigate('/compra-finalizada', { state: { total, formaPagamento: splits.map(s => s.tipo).join(','), endereco: enderecos[enderecoSelecionado] } })
    } catch (err) {
      console.error(err)
      alert('Erro ao criar pedido. Tente novamente.')
    } finally {
      setProcessando(false)
    }
  }

  const bandeiras = { Mastercard: '💳', Visa: '💳', Elo: '💳' }

  return (
    <div>
      <Header />
      <main>
        <div className="page-container" style={{ paddingTop: 40, paddingBottom: 80 }}>
          <h1 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 800, color: 'var(--text)' }}>Checkout</h1>

          {/* Stepper */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 40, maxWidth: 420 }}>
            {etapas.map((label, i) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < etapas.length - 1 ? 1 : 'none' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, background: i <= etapa ? '#7C3AED' : '#E5E7EB', color: i <= etapa ? '#fff' : '#6B7280' }}>
                    {i < etapa ? '✓' : i + 1}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: i <= etapa ? 'var(--primary)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>{label}</span>
                </div>
                {i < etapas.length - 1 && <div style={{ flex: 1, height: 2, background: i < etapa ? 'var(--primary)' : '#E5E7EB', margin: '0 8px', marginBottom: 20 }} />}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32, alignItems: 'flex-start' }}>
            <div>
              {/* Etapa 0: Endereço */}
              {etapa === 0 && (
                <div className="card" style={{ padding: 24 }}>
                  <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>Endereço de entrega</h2>

                  {enderecos.length === 0 && !showNewAddressForm && (
                    <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                      <p style={{ margin: '0 0 16px' }}>Você não tem endereços cadastrados.</p>
                      <button onClick={() => setShowNewAddressForm(true)} className="btn-secondary">Adicionar endereço</button>
                    </div>
                  )}

                  {enderecos.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {enderecos.map((end, i) => (
                        <label key={end.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 16, border: `2px solid ${enderecoSelecionado === i ? 'var(--primary)' : '#E5E7EB'}`, borderRadius: 10 }}>
                          <input type="radio" checked={enderecoSelecionado === i} onChange={() => setEnderecoSelecionado(i)} style={{ accentColor: 'var(--primary)', marginTop: 2 }} />
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <span style={{ fontWeight: 700, fontSize: 14 }}>{end.identificacao}</span>
                              {end.principal && <span className="badge badge-purple">Principal</span>}
                            </div>
                            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                              {end.logradouro}, {end.numero}{end.complemento ? ` - ${end.complemento}` : ''}<br />
                              {end.bairro} - {end.cidade}/{end.estado} - CEP {end.cep}
                            </p>
                          </div>
                        </label>
                      ))}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setShowNewAddressForm(v => !v)} className="btn-ghost">+ Adicionar novo endereço</button>
                      </div>
                    </div>
                  )}

                  {showNewAddressForm && (
                    <div style={{ marginTop: 12 }}>
                      <h3 style={{ margin: '0 0 12px' }}>Novo endereço</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <input placeholder="Identificação (Ex: Casa)" value={novoEndereco.identificacao} onChange={e => setNovoEndereco(p => ({ ...p, identificacao: e.target.value }))} className="input-field" />
                        <input placeholder="CEP" value={novoEndereco.cep} onChange={e => setNovoEndereco(p => ({ ...p, cep: e.target.value }))} className="input-field" />
                        <input placeholder="Logradouro" value={novoEndereco.logradouro} onChange={e => setNovoEndereco(p => ({ ...p, logradouro: e.target.value }))} className="input-field" />
                        <input placeholder="Número" value={novoEndereco.numero} onChange={e => setNovoEndereco(p => ({ ...p, numero: e.target.value }))} className="input-field" />
                        <input placeholder="Bairro" value={novoEndereco.bairro} onChange={e => setNovoEndereco(p => ({ ...p, bairro: e.target.value }))} className="input-field" />
                        <input placeholder="Cidade" value={novoEndereco.cidade} onChange={e => setNovoEndereco(p => ({ ...p, cidade: e.target.value }))} className="input-field" />
                        <input placeholder="Estado" value={novoEndereco.estado} onChange={e => setNovoEndereco(p => ({ ...p, estado: e.target.value }))} className="input-field" />
                        <input placeholder="Complemento" value={novoEndereco.complemento} onChange={e => setNovoEndereco(p => ({ ...p, complemento: e.target.value }))} className="input-field" />
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <button onClick={adicionarEnderecoInline} className="btn-primary">Salvar endereço</button>
                        <button onClick={() => setShowNewAddressForm(false)} className="btn-ghost">Cancelar</button>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
                    <button onClick={() => setEtapa(1)} className="btn-primary" style={{ padding: '11px 28px' }} disabled={(enderecos.length === 0 && !showNewAddressForm)}>Continuar</button>
                  </div>
                </div>
              )}

              {/* Etapa 1: Pagamento */}
              {etapa === 1 && (
                <div className="card" style={{ padding: 24 }}>
                  <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>Forma de pagamento</h2>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
                    {[['cartao', '💳 Cartão'], ['pix', '📲 Pix'], ['boleto', '📄 Boleto']].map(([val, label]) => (
                      <button key={val} onClick={() => setFormaPagamento(val)}
                        style={{ padding: '10px 18px', borderRadius: 8, border: `2px solid ${formaPagamento === val ? 'var(--primary)' : '#E5E7EB'}`, background: formaPagamento === val ? 'rgba(124,58,237,0.06)' : '#fff' }}>
                        {label}
                      </button>
                    ))}
                  </div>

                  {formaPagamento === 'cartao' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ marginBottom: 6 }}>
                        <p style={{ margin: '0 0 8px', fontWeight: 600 }}>Cartões salvos</p>
                        {cartoes.map((c, i) => (
                          <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, border: `2px solid ${cartaoSelecionado === i ? 'var(--primary)' : '#E5E7EB'}`, borderRadius: 8 }}>
                            <input type="radio" checked={cartaoSelecionado === i} onChange={() => setCartaoSelecionado(i)} style={{ accentColor: 'var(--primary)' }} />
                            <span style={{ fontSize: 20 }}>{bandeiras[c.bandeira] || '💳'}</span>
                            <div>
                              <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{c.bandeira} **** **** **** {c.ultimos4}</p>
                              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>{c.nome} · Validade {c.validade}</p>
                            </div>
                            {c.preferencial && <span className="badge badge-purple" style={{ marginLeft: 'auto' }}>Preferencial</span>}
                          </label>
                        ))}
                      </div>

                      <PaymentSplit splits={splits} setSplits={setSplits} cartoes={cartoes} />

                      <button className="btn-ghost" style={{ border: '1.5px dashed #DDD6FE', color: 'var(--primary)', padding: '12px', justifyContent: 'center', width: '100%' }}>
                        + Adicionar novo cartão
                      </button>
                    </div>
                  )}

                  {formaPagamento === 'pix' && (
                    <div style={{ padding: 24, background: '#F0FDF4', borderRadius: 10, textAlign: 'center' }}>
                      <p style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 600, color: '#065F46' }}>💚 5% de desconto no Pix!</p>
                      <p style={{ margin: 0, fontSize: 14, color: '#065F46' }}>O QR Code será gerado após confirmar o pedido.</p>
                    </div>
                  )}
                  {formaPagamento === 'boleto' && (
                    <div style={{ padding: 24, background: '#FEF3C7', borderRadius: 10 }}>
                      <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: '#92400E' }}>📄 Boleto bancário</p>
                      <p style={{ margin: 0, fontSize: 13, color: '#92400E' }}>Vencimento em 3 dias úteis. O boleto será enviado ao seu e-mail após confirmar o pedido.</p>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', marginTop: 24 }}>
                    <button onClick={() => setEtapa(0)} className="btn-ghost">← Voltar</button>
                    <button onClick={() => setEtapa(2)} className="btn-primary" style={{ padding: '11px 28px' }}>Revisar pedido</button>
                  </div>
                </div>
              )}

              {/* Etapa 2: Resumo */}
              {etapa === 2 && (
                <div className="card" style={{ padding: 24 }}>
                  <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>Confirmar pedido</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                    {itens.map(item => (
                      <div key={item.id} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <img src={item.capa} alt={item.titulo} style={{ width: 48, height: 64, objectFit: 'cover', borderRadius: 6 }} />
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{item.titulo}</p>
                          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>Qtd: {item.quantidade}</p>
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>R$ {(item.preco * item.quantidade).toFixed(2).replace('.', ',')}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', marginTop: 24 }}>
                    <button onClick={() => setEtapa(1)} className="btn-ghost">← Voltar</button>
                    <button onClick={finalizar} disabled={processando} className="btn-primary" style={{ padding: '11px 28px' }}>
                      {processando ? 'Processando...' : '✓ Confirmar e pagar'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Resumo</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {itens.map(i => (
                  <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-muted)' }}>{i.titulo.slice(0, 24)}... × {i.quantidade}</span>
                    <span style={{ fontWeight: 600 }}>R$ {(i.preco * i.quantidade).toFixed(2).replace('.', ',')}</span>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Frete</span>
                  <span style={{ color: frete === 0 ? '#10B981' : 'inherit', fontWeight: 600 }}>{frete === 0 ? 'Grátis' : `R$ ${frete.toFixed(2).replace('.', ',')}`}</span>
                </div>
                <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>Total</span>
                  <span style={{ fontWeight: 900, fontSize: 18, color: 'var(--primary)' }}>R$ {total.toFixed(2).replace('.', ',')}</span>
                </div>

                {appliedCupons.length > 0 && (
                  <div style={{ marginTop: 8, padding: 8, borderRadius: 8, background: '#F0F9FF' }}>
                    <strong style={{ color: 'var(--primary)' }}>Cupons aplicados:</strong> {appliedCupons.join(', ')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}