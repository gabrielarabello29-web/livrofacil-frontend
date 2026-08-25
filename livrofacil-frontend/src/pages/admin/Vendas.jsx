import { useState } from 'react'
import AdminSidebar from '../../components/AdminSidebar'
import { pedidos_mock, vendaService } from '../../services/vendaService'
import StatusActions from '../../components/StatusActions'

const initial_pedidos = [
  { id: '#1089', cliente: 'Ana Silva', data: '20/01/2025', valor: 97.80, status: 'Entregue', pagamento: 'Cartão' },
  { id: '#1088', cliente: 'Carlos Mendes', data: '19/01/2025', valor: 149.70, status: 'Em transporte', pagamento: 'PIX' },
  { id: '#1087', cliente: 'Mariana Costa', data: '19/01/2025', valor: 44.90, status: 'Em processamento', pagamento: 'Cartão' },
  { id: '#1086', cliente: 'Pedro Souza', data: '18/01/2025', valor: 85.80, status: 'Aprovada', pagamento: 'Cartão' },
  { id: '#1085', cliente: 'Lucia Ferreira', data: '17/01/2025', valor: 39.90, status: 'Cancelada', pagamento: 'PIX' },
  { id: '#1084', cliente: 'Roberto Lima', data: '16/01/2025', valor: 64.90, status: 'Entregue', pagamento: 'Boleto' },
  { id: '#1083', cliente: 'Carla Dias', data: '15/01/2025', valor: 129.80, status: 'Em troca', pagamento: 'Cartão' },
]

const statusCores = {
  'Entregue': 'badge-green', 'Em transporte': 'badge-blue',
  'Em processamento': 'badge-yellow', 'Aprovada': 'badge-blue',
  'Cancelada': 'badge-red', 'Em troca': 'badge-purple',
  'Reprovada': 'badge-red',
}

const todos_status = ['Todos', 'Em processamento', 'Aprovada', 'Reprovada', 'Em transporte', 'Entregue', 'Cancelada', 'Em troca']

export default function AdminVendas() {
  const [busca, setBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('Todos')
  const [pedidos, setPedidos] = useState(initial_pedidos)

  const filtrados = pedidos.filter(p => {
    if (statusFiltro !== 'Todos' && p.status !== statusFiltro) return false
    if (busca && !p.id.includes(busca) && !p.cliente.toLowerCase().includes(busca.toLowerCase())) return false
    return true
  })

  async function handleStatusAtualizado(pedidoId, novoStatus) {
    // update local state optimistically
    setPedidos(prev => prev.map(p => p.id === pedidoId ? { ...p, status: novoStatus } : p))
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <div style={{ padding: '28px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800 }}>Pedidos</h1>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>{pedidos.length} pedidos no total</p>
            </div>
          </div>

          <div className="card" style={{ padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por pedido ou cliente..." className="input-field" style={{ flex: '1 1 200px', minWidth: 0 }} />
            <select value={statusFiltro} onChange={e => setStatusFiltro(e.target.value)} className="input-field" style={{ flex: '0 0 auto', width: 'auto', minWidth: 180 }}>
              {todos_status.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Data</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th>Pagamento</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{p.id}</td>
                    <td style={{ fontWeight: 500 }}>{p.cliente}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{p.data}</td>
                    <td style={{ fontWeight: 700 }}>R$ {p.valor.toFixed(2).replace('.', ',')}</td>
                    <td><span className={`badge ${statusCores[p.status] || 'badge-gray'}`}>{p.status}</span></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{p.pagamento}</td>
                    <td style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button className="btn-secondary" style={{ padding: '5px 10px', fontSize: 12 }}>Ver</button>
                      <StatusActions
                        statusAtual={p.status}
                        vendaId={p.id}
                        onAtualizado={(novo) => handleStatusAtualizado(p.id, novo)}
                      />
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
