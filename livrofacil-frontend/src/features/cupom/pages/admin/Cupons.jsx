import { useState } from 'react'
import AdminSidebar from '../../components/AdminSidebar'
import Modal from '../../components/Modal'

const cupons_inicial = [
  { id: 1, codigo: 'BEMVINDO10', tipo: 'Promocional', desconto: '10%', validade: '31/03/2025', utilizacao: '145/∞', status: 'Ativo' },
  { id: 2, codigo: 'TROCA001', tipo: 'Troca', desconto: 'R$ 50,00', validade: '15/02/2025', utilizacao: '1/1', status: 'Inativo' },
  { id: 3, codigo: 'VERAO25', tipo: 'Promocional', desconto: '25%', validade: '28/02/2025', utilizacao: '89/200', status: 'Ativo' },
  { id: 4, codigo: 'FRETEGRATIS', tipo: 'Promocional', desconto: 'Frete grátis', validade: '30/06/2025', utilizacao: '211/500', status: 'Ativo' },
]

export default function AdminCupons() {
  const [cupons, setCupons] = useState(cupons_inicial)
  const [modalAberto, setModalAberto] = useState(false)
  const [form, setForm] = useState({ codigo: '', tipo: 'Promocional', desconto: '', validade: '', limite: '' })

  function set(field) { return e => setForm(p => ({ ...p, [field]: e.target.value })) }

  function salvar() {
    const novo = { id: Date.now(), ...form, utilizacao: `0/${form.limite || '∞'}`, status: 'Ativo' }
    setCupons(prev => [...prev, novo])
    setModalAberto(false)
    setForm({ codigo: '', tipo: 'Promocional', desconto: '', validade: '', limite: '' })
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <div style={{ padding: '28px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800 }}>Cupons</h1>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>{cupons.length} cupons cadastrados</p>
            </div>
            <button onClick={() => setModalAberto(true)} className="btn-primary" style={{ padding: '10px 20px' }}>+ Novo cupom</button>
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Tipo</th>
                  <th>Desconto</th>
                  <th>Validade</th>
                  <th>Utilização</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {cupons.map(c => (
                  <tr key={c.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14, background: '#F3F4F6', padding: '3px 10px', borderRadius: 4 }}>{c.codigo}</span>
                    </td>
                    <td><span className={`badge ${c.tipo === 'Troca' ? 'badge-blue' : 'badge-purple'}`}>{c.tipo}</span></td>
                    <td style={{ fontWeight: 700, color: '#10B981' }}>{c.desconto}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{c.validade}</td>
                    <td style={{ fontSize: 13 }}>{c.utilizacao}</td>
                    <td><span className={`badge ${c.status === 'Ativo' ? 'badge-green' : 'badge-gray'}`}>{c.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-secondary" style={{ padding: '5px 10px', fontSize: 12 }}>Editar</button>
                        <button onClick={() => setCupons(prev => prev.map(cup => cup.id === c.id ? { ...cup, status: cup.status === 'Ativo' ? 'Inativo' : 'Ativo' } : cup))} className="btn-ghost" style={{ padding: '5px 10px', fontSize: 12, border: '1px solid #E5E7EB' }}>
                          {c.status === 'Ativo' ? 'Desativar' : 'Ativar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal isOpen={modalAberto} onClose={() => setModalAberto(false)} title="Novo cupom">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label className="label">Código</label><input className="input-field" value={form.codigo} onChange={set('codigo')} placeholder="EX: DESCONTO20" style={{ textTransform: 'uppercase' }} required /></div>
          <div>
            <label className="label">Tipo</label>
            <select className="input-field" value={form.tipo} onChange={set('tipo')}>
              <option>Promocional</option><option>Troca</option>
            </select>
          </div>
          <div><label className="label">Desconto (ex: 10% ou R$ 20,00)</label><input className="input-field" value={form.desconto} onChange={set('desconto')} placeholder="10%" required /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label className="label">Validade</label><input className="input-field" type="date" value={form.validade} onChange={set('validade')} /></div>
            <div><label className="label">Limite de uso</label><input className="input-field" type="number" value={form.limite} onChange={set('limite')} placeholder="Deixe vazio = ilimitado" /></div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button onClick={() => setModalAberto(false)} className="btn-secondary" style={{ flex: 1 }}>Cancelar</button>
            <button onClick={salvar} className="btn-primary" style={{ flex: 1 }} disabled={!form.codigo || !form.desconto}>Criar cupom</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
