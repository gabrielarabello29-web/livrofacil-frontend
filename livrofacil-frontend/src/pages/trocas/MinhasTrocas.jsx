import { Link } from 'react-router-dom'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import ClienteSidebar from '../../components/ClienteSidebar'

const trocas = [
  { id: 'TRK-001', pedido: '#1001', produto: 'Hábitos Atômicos', data: '20/12/2024', status: 'Em troca', motivo: 'Produto danificado' },
]

const statusCores = {
  'Em troca': 'badge-yellow',
  'Troca autorizada': 'badge-blue',
  'Trocado': 'badge-green',
  'Reprovado': 'badge-red',
}

export default function MinhasTrocas() {
  return (
    <div>
      <Header />
      <main className="page-container" style={{ paddingTop: 40, paddingBottom: 80 }}>
        <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
          <ClienteSidebar />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
              <div>
                <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800 }}>Trocas e Devoluções</h1>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>Acompanhe suas solicitações</p>
              </div>
              <Link to="/trocas/nova" className="btn-primary">Solicitar troca</Link>
            </div>

            {trocas.length === 0 ? (
              <div className="card" style={{ padding: 60, textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>↔</div>
                <p style={{ margin: '0 0 20px', fontSize: 16, color: 'var(--text-muted)' }}>Você ainda não possui solicitações de troca.</p>
                <Link to="/trocas/nova" className="btn-primary">Solicitar troca</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {trocas.map(troca => (
                  <div key={troca.id} className="card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 14 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: 15 }}>{troca.id}</span>
                          <span className={`badge ${statusCores[troca.status] || 'badge-gray'}`}>{troca.status}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>Pedido {troca.pedido} · Solicitada em {troca.data}</p>
                      </div>
                    </div>
                    <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 12, fontSize: 13 }}>
                      <strong>{troca.produto}</strong>
                      <span style={{ color: 'var(--text-muted)' }}> · {troca.motivo}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
