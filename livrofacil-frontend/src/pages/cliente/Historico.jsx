import { useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import ClienteSidebar from '../../components/ClienteSidebar'

const pedidos = [
  { id: 1001, data: '15/12/2024', valor: 97.80, status: 'Entregue', pagamento: 'Cartão Mastercard', itens: ['Hábitos Atômicos', 'Pai Rico Pai Pobre'] },
  { id: 1002, data: '08/01/2025', valor: 149.70, status: 'Em transporte', pagamento: 'PIX', itens: ['Duna', 'O Hobbit'] },
  { id: 1003, data: '10/01/2025', valor: 44.90, status: 'Em processamento', pagamento: 'Cartão Visa', itens: ['A Sutil Arte de Ligar o F*da-se'] },
]

const statusCores = {
  'Entregue': 'badge-green',
  'Em transporte': 'badge-blue',
  'Em processamento': 'badge-yellow',
  'Cancelado': 'badge-red',
  'Aprovada': 'badge-green',
}

const filtros = ['Todos', 'Em processamento', 'Enviados', 'Entregues', 'Cancelados']

export default function Historico() {
  const [filtro, setFiltro] = useState('Todos')

  const filtrados = filtro === 'Todos' ? pedidos : pedidos.filter(p => {
    if (filtro === 'Entregues') return p.status === 'Entregue'
    if (filtro === 'Em processamento') return p.status === 'Em processamento'
    if (filtro === 'Enviados') return p.status === 'Em transporte'
    if (filtro === 'Cancelados') return p.status === 'Cancelado'
    return true
  })

  return (
    <div>
      <Header />
      <main className="page-container" style={{ paddingTop: 40, paddingBottom: 80 }}>
        <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
          <ClienteSidebar />
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: '0 0 24px', fontSize: 22, fontWeight: 800 }}>Meus Pedidos</h1>

            {/* Filtros */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
              {filtros.map(f => (
                <button key={f} onClick={() => setFiltro(f)}
                  style={{ padding: '7px 16px', borderRadius: 24, border: `1.5px solid ${filtro === f ? 'var(--primary)' : '#E5E7EB'}`, background: filtro === f ? 'var(--primary)' : '#fff', color: filtro === f ? '#fff' : 'var(--text)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                  {f}
                </button>
              ))}
            </div>

            {filtrados.length === 0 ? (
              <div className="card" style={{ padding: 60, textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
                <p style={{ margin: '0 0 20px', fontSize: 16, color: 'var(--text-muted)' }}>Você ainda não possui pedidos.</p>
                <Link to="/livros" className="btn-primary">Explorar livros</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {filtrados.map(pedido => (
                  <div key={pedido.id} className="card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: 15 }}>Pedido #{pedido.id}</span>
                          <span className={`badge ${statusCores[pedido.status] || 'badge-gray'}`}>{pedido.status}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>Realizado em {pedido.data} · {pedido.pagamento}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: 'var(--primary)' }}>R$ {pedido.valor.toFixed(2).replace('.', ',')}</p>
                        <button className="btn-secondary" style={{ padding: '6px 14px', fontSize: 13 }}>Ver detalhes</button>
                      </div>
                    </div>
                    <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 12, fontSize: 13, color: 'var(--text-muted)' }}>
                      {pedido.itens.join(' · ')}
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
