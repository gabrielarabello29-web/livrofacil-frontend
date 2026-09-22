import { useState } from 'react'
import AdminSidebar from '../../components/AdminSidebar'
import Modal from '../../components/Modal'

const trocas_inicial = [
  { id: 'TRK-001', pedido: '#1001', cliente: 'Ana Silva', produto: 'Hábitos Atômicos', data: '20/12/2024', status: 'Em troca', motivo: 'Produto danificado' },
  { id: 'TRK-002', pedido: '#1003', cliente: 'Mariana Costa', produto: 'A Sutil Arte de Ligar o F*da-se', data: '12/01/2025', status: 'Em troca', motivo: 'Produto incorreto' },
  { id: 'TRK-003', pedido: '#0988', cliente: 'Carlos Mendes', produto: 'Duna', data: '05/01/2025', status: 'Trocado', motivo: 'Arrependimento' },
  { id: 'TRK-004', pedido: '#0977', cliente: 'Pedro Souza', produto: 'O Hobbit', data: '02/01/2025', status: 'Reprovado', motivo: 'Produto com defeito' },
]

const statusCores = { 'Em troca': 'badge-yellow', 'Troca autorizada': 'badge-blue', 'Trocado': 'badge-green', 'Reprovado': 'badge-red' }

export default function AdminTrocas() {
  const [trocas, setTrocas] = useState(trocas_inicial)
  const [confirmModal, setConfirmModal] = useState(null)
  const [retornarEstoque, setRetornarEstoque] = useState(true)

  function autorizar(id) {
    setTrocas(prev => prev.map(t => t.id === id ? { ...t, status: 'Troca autorizada' } : t))
  }

  function recusar(id) {
    setTrocas(prev => prev.map(t => t.id === id ? { ...t, status: 'Reprovado' } : t))
  }

  function confirmarRecebimento() {
    setTrocas(prev => prev.map(t => t.id === confirmModal ? { ...t, status: 'Trocado' } : t))
    setConfirmModal(null)
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <div style={{ padding: '28px 32px' }}>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800 }}>Trocas e Devoluções</h1>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>{trocas.length} solicitações</p>
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Produto</th>
                  <th>Data</th>
                  <th>Motivo</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {trocas.map(t => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 13 }}>{t.id}</td>
                    <td style={{ fontWeight: 600 }}>{t.pedido}</td>
                    <td>{t.cliente}</td>
                    <td style={{ fontSize: 13 }}>{t.produto}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{t.data}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 180 }}>{t.motivo}</td>
                    <td><span className={`badge ${statusCores[t.status] || 'badge-gray'}`}>{t.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {t.status === 'Em troca' && (
                          <>
                            <button onClick={() => autorizar(t.id)} className="btn-primary" style={{ padding: '4px 10px', fontSize: 12 }}>Autorizar</button>
                            <button onClick={() => recusar(t.id)} className="btn-danger" style={{ padding: '4px 10px', fontSize: 12 }}>Recusar</button>
                          </>
                        )}
                        {t.status === 'Troca autorizada' && (
                          <button onClick={() => setConfirmModal(t.id)} className="btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }}>Recebido</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal isOpen={!!confirmModal} onClose={() => setConfirmModal(null)} title="Confirmar recebimento">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ margin: 0, fontSize: 15, color: 'var(--text)' }}>Confirme o recebimento do produto devolvido.</p>
          <div style={{ padding: 16, background: '#F9F8FF', borderRadius: 10 }}>
            <p style={{ margin: '0 0 10px', fontWeight: 600, fontSize: 14 }}>Retornar produto ao estoque?</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14 }}>
                <input type="radio" name="estoque" checked={retornarEstoque} onChange={() => setRetornarEstoque(true)} style={{ accentColor: 'var(--primary)' }} /> Sim
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14 }}>
                <input type="radio" name="estoque" checked={!retornarEstoque} onChange={() => setRetornarEstoque(false)} style={{ accentColor: 'var(--primary)' }} /> Não (produto com defeito)
              </label>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setConfirmModal(null)} className="btn-secondary" style={{ flex: 1 }}>Cancelar</button>
            <button onClick={confirmarRecebimento} className="btn-primary" style={{ flex: 1 }}>Confirmar recebimento</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
