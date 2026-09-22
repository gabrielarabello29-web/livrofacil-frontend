import { useState } from 'react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import ClienteSidebar from '../../components/ClienteSidebar'
import Modal from '../../components/Modal'
import { useAuth } from '../../context/AuthContext'

function BandeiraIcon({ bandeira }) {
  const cores = { Mastercard: '#EB001B', Visa: '#1A1F71', Elo: '#00A4E0' }
  return <span style={{ fontSize: 20, fontWeight: 900, color: cores[bandeira] || '#374151' }}>{bandeira?.charAt(0) || '💳'}</span>
}

export default function Cartoes() {
  const { usuario, atualizarUsuario } = useAuth()
  const [cartoes, setCartoes] = useState(usuario?.cartoes || [])
  const [modalAberto, setModalAberto] = useState(false)
  const [form, setForm] = useState({ bandeira: 'Visa', numero: '', nome: '', validade: '', cvv: '' })

  function set(field) { return e => setForm(p => ({ ...p, [field]: e.target.value })) }

  function salvar() {
    const novo = { id: Date.now(), bandeira: form.bandeira, ultimos4: form.numero.slice(-4), nome: form.nome.toUpperCase(), validade: form.validade, preferencial: cartoes.length === 0 }
    const novos = [...cartoes, novo]
    setCartoes(novos)
    atualizarUsuario({ cartoes: novos })
    setModalAberto(false)
    setForm({ bandeira: 'Visa', numero: '', nome: '', validade: '', cvv: '' })
  }

  function remover(id) {
    const novos = cartoes.filter(c => c.id !== id)
    setCartoes(novos)
    atualizarUsuario({ cartoes: novos })
  }

  function tornarPreferencial(id) {
    const novos = cartoes.map(c => ({ ...c, preferencial: c.id === id }))
    setCartoes(novos)
    atualizarUsuario({ cartoes: novos })
  }

  return (
    <div>
      <Header />
      <main className="page-container" style={{ paddingTop: 40, paddingBottom: 80 }}>
        <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
          <ClienteSidebar />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Meus Cartões</h1>
              <button onClick={() => setModalAberto(true)} className="btn-primary" style={{ padding: '9px 18px' }}>+ Adicionar cartão</button>
            </div>

            {cartoes.length === 0 ? (
              <div className="card" style={{ padding: 60, textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>💳</div>
                <p style={{ margin: '0 0 20px', fontSize: 16, color: 'var(--text-muted)' }}>Nenhum cartão cadastrado ainda.</p>
                <button onClick={() => setModalAberto(true)} className="btn-primary">Adicionar cartão</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {cartoes.map(cartao => (
                  <div key={cartao.id} className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16, borderColor: cartao.preferencial ? 'var(--primary)' : undefined, borderWidth: cartao.preferencial ? 2 : 1 }}>
                    <div style={{ width: 56, height: 36, background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <BandeiraIcon bandeira={cartao.bandeira} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 15, fontWeight: 700 }}>{cartao.bandeira} **** **** **** {cartao.ultimos4}</span>
                        {cartao.preferencial && <span className="badge badge-purple">Preferencial</span>}
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>{cartao.nome} · Validade {cartao.validade}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {!cartao.preferencial && (
                        <button onClick={() => tornarPreferencial(cartao.id)} className="btn-ghost" style={{ padding: '7px 14px', fontSize: 13, border: '1px solid #E5E7EB' }}>Preferencial</button>
                      )}
                      <button onClick={() => remover(cartao.id)} className="btn-danger" style={{ padding: '7px 14px', fontSize: 13 }}>Remover</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 24, padding: 16, background: '#FFFBEB', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span>🔒</span>
              <p style={{ margin: 0, fontSize: 13, color: '#92400E' }}>Seus dados de cartão são armazenados de forma segura e criptografada. Nunca armazenamos o número completo do cartão.</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      <Modal isOpen={modalAberto} onClose={() => setModalAberto(false)} title="Adicionar cartão">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="label">Bandeira</label>
            <select className="input-field" value={form.bandeira} onChange={set('bandeira')}>
              <option>Visa</option><option>Mastercard</option><option>Elo</option><option>Hipercard</option>
            </select>
          </div>
          <div>
            <label className="label">Número do cartão</label>
            <input className="input-field" value={form.numero} onChange={set('numero')} placeholder="0000 0000 0000 0000" maxLength={19} />
          </div>
          <div><label className="label">Nome no cartão</label><input className="input-field" value={form.nome} onChange={set('nome')} placeholder="Como aparece no cartão" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label className="label">Validade</label><input className="input-field" value={form.validade} onChange={set('validade')} placeholder="MM/AA" maxLength={5} /></div>
            <div><label className="label">CVV</label><input className="input-field" value={form.cvv} onChange={set('cvv')} placeholder="000" maxLength={4} /></div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button onClick={() => setModalAberto(false)} className="btn-secondary" style={{ flex: 1 }}>Cancelar</button>
            <button onClick={salvar} className="btn-primary" style={{ flex: 1 }} disabled={!form.numero || !form.nome || !form.validade}>Adicionar cartão</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
