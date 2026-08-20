import { useState } from 'react'
import AdminSidebar from '../../components/AdminSidebar'
import Modal from '../../components/Modal'

const cats_inicial = [
  { id: 1, nome: 'Ficção', descricao: 'Romances, contos e narrativas imaginativas', livros: 247, status: 'Ativo' },
  { id: 2, nome: 'Não Ficção', descricao: 'Obras baseadas em fatos e realidade', livros: 183, status: 'Ativo' },
  { id: 3, nome: 'Desenvolvimento Pessoal', descricao: 'Crescimento, hábitos e produtividade', livros: 312, status: 'Ativo' },
  { id: 4, nome: 'Negócios', descricao: 'Empreendedorismo, finanças e liderança', livros: 198, status: 'Ativo' },
  { id: 5, nome: 'Tecnologia', descricao: 'Programação, IA e inovação digital', livros: 156, status: 'Ativo' },
  { id: 6, nome: 'Romance', descricao: 'Histórias de amor e relacionamentos', livros: 289, status: 'Ativo' },
  { id: 7, nome: 'Infantil', descricao: 'Para os pequenos leitores em formação', livros: 421, status: 'Ativo' },
  { id: 8, nome: 'Suspense', descricao: 'Mistérios, thrillers e policiais', livros: 174, status: 'Inativo' },
  { id: 9, nome: 'Biografias', descricao: 'Vidas inspiradoras e histórias reais', livros: 132, status: 'Ativo' },
]

export default function AdminCategorias() {
  const [categorias, setCategorias] = useState(cats_inicial)
  const [modalAberto, setModalAberto] = useState(false)
  const [form, setForm] = useState({ nome: '', descricao: '' })
  const [editandoId, setEditandoId] = useState(null)

  function set(field) { return e => setForm(p => ({ ...p, [field]: e.target.value })) }

  function abrirNovo() { setForm({ nome: '', descricao: '' }); setEditandoId(null); setModalAberto(true) }
  function abrirEditar(cat) { setForm({ nome: cat.nome, descricao: cat.descricao }); setEditandoId(cat.id); setModalAberto(true) }

  function salvar() {
    if (editandoId) {
      setCategorias(prev => prev.map(c => c.id === editandoId ? { ...c, ...form } : c))
    } else {
      setCategorias(prev => [...prev, { id: Date.now(), ...form, livros: 0, status: 'Ativo' }])
    }
    setModalAberto(false)
  }

  function toggleStatus(id) {
    setCategorias(prev => prev.map(c => c.id === id ? { ...c, status: c.status === 'Ativo' ? 'Inativo' : 'Ativo' } : c))
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <div style={{ padding: '28px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800 }}>Categorias</h1>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>{categorias.length} categorias cadastradas</p>
            </div>
            <button onClick={abrirNovo} className="btn-primary" style={{ padding: '10px 20px' }}>+ Nova categoria</button>
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Categoria</th>
                  <th>Descrição</th>
                  <th>Livros</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {categorias.map(cat => (
                  <tr key={cat.id}>
                    <td style={{ fontWeight: 700 }}>{cat.nome}</td>
                    <td style={{ color: 'var(--text-muted)', maxWidth: 280 }}>{cat.descricao}</td>
                    <td style={{ fontWeight: 600 }}>{cat.livros}</td>
                    <td><span className={`badge ${cat.status === 'Ativo' ? 'badge-green' : 'badge-gray'}`}>{cat.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => abrirEditar(cat)} className="btn-secondary" style={{ padding: '5px 10px', fontSize: 12 }}>Editar</button>
                        <button onClick={() => toggleStatus(cat.id)} className="btn-ghost" style={{ padding: '5px 10px', fontSize: 12, border: '1px solid #E5E7EB' }}>
                          {cat.status === 'Ativo' ? 'Inativar' : 'Ativar'}
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

      <Modal isOpen={modalAberto} onClose={() => setModalAberto(false)} title={editandoId ? 'Editar categoria' : 'Nova categoria'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label className="label">Nome</label><input className="input-field" value={form.nome} onChange={set('nome')} required /></div>
          <div><label className="label">Descrição</label><textarea className="input-field" value={form.descricao} onChange={set('descricao')} rows={3} style={{ resize: 'vertical' }} /></div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button onClick={() => setModalAberto(false)} className="btn-secondary" style={{ flex: 1 }}>Cancelar</button>
            <button onClick={salvar} className="btn-primary" style={{ flex: 1 }} disabled={!form.nome}>Salvar</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
