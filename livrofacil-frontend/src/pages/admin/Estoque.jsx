import { useState } from 'react'
import AdminSidebar from '../../components/AdminSidebar'
import Modal from '../../components/Modal'
import { livros_mock } from '../../services/livroService'

function getStatusEstoque(qtd) {
  if (qtd === 0) return { label: 'Sem estoque', cls: 'badge-red' }
  if (qtd < 15) return { label: 'Estoque baixo', cls: 'badge-yellow' }
  return { label: 'Em estoque', cls: 'badge-green' }
}

export default function AdminEstoque() {
  const [busca, setBusca] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [form, setForm] = useState({ livroId: '', quantidade: '', custo: '', fornecedor: '', data: '' })

  const filtrados = livros_mock.filter(l => !busca || l.titulo.toLowerCase().includes(busca.toLowerCase()))
  const reservado = () => Math.floor(Math.random() * 5 + 1)

  function set(field) { return e => setForm(p => ({ ...p, [field]: e.target.value })) }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <div style={{ padding: '28px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800 }}>Estoque</h1>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>Controle de inventário</p>
            </div>
            <button onClick={() => setModalAberto(true)} className="btn-primary" style={{ padding: '10px 20px' }}>+ Entrada de estoque</button>
          </div>

          {/* Resumo */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
            {[
              { label: 'Em estoque', valor: livros_mock.filter(l => l.estoque >= 15).length, cor: '#D1FAE5', textCor: '#065F46' },
              { label: 'Estoque baixo', valor: livros_mock.filter(l => l.estoque > 0 && l.estoque < 15).length, cor: '#FEF3C7', textCor: '#92400E' },
              { label: 'Sem estoque', valor: livros_mock.filter(l => l.estoque === 0).length, cor: '#FEE2E2', textCor: '#991B1B' },
            ].map(r => (
              <div key={r.label} style={{ background: r.cor, borderRadius: 10, padding: '16px 20px' }}>
                <p style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 900, color: r.textCor }}>{r.valor}</p>
                <p style={{ margin: 0, fontSize: 13, color: r.textCor }}>{r.label}</p>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: '14px 20px', marginBottom: 16 }}>
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar livro..." className="input-field" style={{ maxWidth: 360 }} />
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Livro</th>
                  <th>Estoque total</th>
                  <th>Reservado</th>
                  <th>Disponível</th>
                  <th>Custo</th>
                  <th>Preço</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map(l => {
                  const res = reservado()
                  const disp = Math.max(0, l.estoque - res)
                  const s = getStatusEstoque(l.estoque)
                  return (
                    <tr key={l.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <img src={l.capa} alt={l.titulo} style={{ width: 32, height: 42, objectFit: 'cover', borderRadius: 4 }} />
                          <div>
                            <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>{l.titulo}</p>
                            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>{l.autor}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontWeight: 700 }}>{l.estoque}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{res}</td>
                      <td style={{ fontWeight: 700, color: disp < 5 ? '#D97706' : 'var(--text)' }}>{disp}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>R$ {(l.preco * 0.6).toFixed(2).replace('.', ',')}</td>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>R$ {l.preco.toFixed(2).replace('.', ',')}</td>
                      <td><span className={`badge ${s.cls}`}>{s.label}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal isOpen={modalAberto} onClose={() => setModalAberto(false)} title="Entrada de estoque">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="label">Livro</label>
            <select className="input-field" value={form.livroId} onChange={set('livroId')} required>
              <option value="">Selecione um livro...</option>
              {livros_mock.map(l => <option key={l.id} value={l.id}>{l.titulo}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label className="label">Quantidade</label><input className="input-field" type="number" min={1} value={form.quantidade} onChange={set('quantidade')} placeholder="0" required /></div>
            <div><label className="label">Custo unitário</label><input className="input-field" type="number" step="0.01" value={form.custo} onChange={set('custo')} placeholder="R$ 0,00" /></div>
          </div>
          <div><label className="label">Fornecedor</label><input className="input-field" value={form.fornecedor} onChange={set('fornecedor')} placeholder="Nome do fornecedor" /></div>
          <div><label className="label">Data de entrada</label><input className="input-field" type="date" value={form.data} onChange={set('data')} /></div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button onClick={() => setModalAberto(false)} className="btn-secondary" style={{ flex: 1 }}>Cancelar</button>
            <button onClick={() => setModalAberto(false)} className="btn-primary" style={{ flex: 1 }} disabled={!form.livroId || !form.quantidade}>Registrar entrada</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
