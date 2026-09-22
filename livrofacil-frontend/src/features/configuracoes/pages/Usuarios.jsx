import { useState } from 'react'
import AdminSidebar from '../../components/AdminSidebar'
import Modal from '../../components/Modal'

const usuarios_admin = [
  { id: 1, nome: 'Admin LivroFácil', email: 'admin@email.com', perfil: 'Administrador', status: 'Ativo', ultimoAcesso: 'Agora' },
  { id: 2, nome: 'Gerente Estoque', email: 'gerente@livrofacil.com', perfil: 'Gerente', status: 'Ativo', ultimoAcesso: 'Há 2 horas' },
  { id: 3, nome: 'Analista Vendas', email: 'analista@livrofacil.com', perfil: 'Gerente', status: 'Inativo', ultimoAcesso: 'Há 5 dias' },
]

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState(usuarios_admin)
  const [modalAberto, setModalAberto] = useState(false)
  const [form, setForm] = useState({ nome: '', email: '', perfil: 'Gerente' })

  function set(field) { return e => setForm(p => ({ ...p, [field]: e.target.value })) }

  function salvar() {
    setUsuarios(prev => [...prev, { id: Date.now(), ...form, status: 'Ativo', ultimoAcesso: 'Nunca' }])
    setModalAberto(false)
    setForm({ nome: '', email: '', perfil: 'Gerente' })
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <div style={{ padding: '28px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800 }}>Usuários administrativos</h1>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>Gerencie os usuários com acesso ao painel</p>
            </div>
            <button onClick={() => setModalAberto(true)} className="btn-primary" style={{ padding: '10px 20px' }}>+ Novo usuário</button>
          </div>

          <div style={{ marginBottom: 20, padding: '14px 16px', background: '#FFFBEB', border: '1px solid #FEF3C7', borderRadius: 10, fontSize: 13, color: '#92400E' }}>
            ⚠️ Este módulo é demonstrativo. A autenticação real será implementada via Spring Security no back-end.
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Perfil</th>
                  <th>Status</th>
                  <th>Último acesso</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
                          {u.nome.charAt(0)}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>{u.nome}</p>
                          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td><span className={`badge ${u.perfil === 'Administrador' ? 'badge-purple' : 'badge-blue'}`}>{u.perfil}</span></td>
                    <td><span className={`badge ${u.status === 'Ativo' ? 'badge-green' : 'badge-gray'}`}>{u.status}</span></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{u.ultimoAcesso}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-secondary" style={{ padding: '5px 10px', fontSize: 12 }}>Editar</button>
                        <button onClick={() => setUsuarios(prev => prev.map(usr => usr.id === u.id ? { ...usr, status: usr.status === 'Ativo' ? 'Inativo' : 'Ativo' } : usr))} className="btn-ghost" style={{ padding: '5px 10px', fontSize: 12, border: '1px solid #E5E7EB' }}>
                          {u.status === 'Ativo' ? 'Desativar' : 'Ativar'}
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

      <Modal isOpen={modalAberto} onClose={() => setModalAberto(false)} title="Novo usuário administrativo">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label className="label">Nome completo</label><input className="input-field" value={form.nome} onChange={set('nome')} required /></div>
          <div><label className="label">E-mail</label><input className="input-field" type="email" value={form.email} onChange={set('email')} required /></div>
          <div>
            <label className="label">Perfil</label>
            <select className="input-field" value={form.perfil} onChange={set('perfil')}>
              <option>Administrador</option><option>Gerente</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button onClick={() => setModalAberto(false)} className="btn-secondary" style={{ flex: 1 }}>Cancelar</button>
            <button onClick={salvar} className="btn-primary" style={{ flex: 1 }} disabled={!form.nome || !form.email}>Criar usuário</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
