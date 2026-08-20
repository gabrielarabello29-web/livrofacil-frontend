import { useState } from 'react'
import AdminSidebar from '../../components/AdminSidebar'

const clientes = [
  { id: 1, nome: 'Ana Silva', email: 'ana@email.com', telefone: '(11) 98765-4321', pedidos: 8, gasto: 654.30, status: 'Ativo' },
  { id: 2, nome: 'Carlos Mendes', email: 'carlos@email.com', telefone: '(21) 97654-3210', pedidos: 3, gasto: 234.70, status: 'Ativo' },
  { id: 3, nome: 'Mariana Costa', email: 'mariana@email.com', telefone: '(31) 96543-2109', pedidos: 12, gasto: 1089.40, status: 'Ativo' },
  { id: 4, nome: 'Pedro Souza', email: 'pedro@email.com', telefone: '(11) 95432-1098', pedidos: 1, gasto: 85.80, status: 'Inativo' },
  { id: 5, nome: 'Lucia Ferreira', email: 'lucia@email.com', telefone: '(41) 94321-0987', pedidos: 5, gasto: 412.50, status: 'Ativo' },
  { id: 6, nome: 'Roberto Lima', email: 'roberto@email.com', telefone: '(51) 93210-9876', pedidos: 0, gasto: 0, status: 'Inativo' },
]

export default function AdminClientes() {
  const [busca, setBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('Todos')

  const filtrados = clientes.filter(c => {
    if (statusFiltro !== 'Todos' && c.status !== statusFiltro) return false
    if (busca && !c.nome.toLowerCase().includes(busca.toLowerCase()) && !c.email.toLowerCase().includes(busca.toLowerCase())) return false
    return true
  })

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <div style={{ padding: '28px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800 }}>Clientes</h1>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>{clientes.length} clientes cadastrados</p>
            </div>
          </div>

          <div className="card" style={{ padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome ou e-mail..." className="input-field" style={{ flex: '1 1 240px', minWidth: 0 }} />
            {['Todos', 'Ativo', 'Inativo'].map(s => (
              <button key={s} onClick={() => setStatusFiltro(s)}
                style={{ padding: '7px 16px', borderRadius: 24, border: `1.5px solid ${statusFiltro === s ? 'var(--primary)' : '#E5E7EB'}`, background: statusFiltro === s ? 'var(--primary)' : '#fff', color: statusFiltro === s ? '#fff' : 'var(--text)', fontSize: 13, cursor: 'pointer' }}>
                {s}
              </button>
            ))}
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Telefone</th>
                  <th>Pedidos</th>
                  <th>Total gasto</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
                          {c.nome.charAt(0)}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>{c.nome}</p>
                          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{c.telefone}</td>
                    <td style={{ fontWeight: 600 }}>{c.pedidos}</td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>R$ {c.gasto.toFixed(2).replace('.', ',')}</td>
                    <td><span className={`badge ${c.status === 'Ativo' ? 'badge-green' : 'badge-gray'}`}>{c.status}</span></td>
                    <td>
                      <button className="btn-secondary" style={{ padding: '5px 10px', fontSize: 12 }}>Ver perfil</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
