import { useState } from 'react'
import AdminSidebar from '../../components/AdminSidebar'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const dados_mes = [
  { mes: 'Ago', valor: 32400, pedidos: 218 },
  { mes: 'Set', valor: 28900, pedidos: 195 },
  { mes: 'Out', valor: 41200, pedidos: 276 },
  { mes: 'Nov', valor: 56700, pedidos: 381 },
  { mes: 'Dez', valor: 78900, pedidos: 530 },
  { mes: 'Jan', valor: 48920, pedidos: 342 },
]

const dados_categoria = [
  { cat: 'Dev. Pessoal', vendas: 17120 },
  { cat: 'Negócios', vendas: 12230 },
  { cat: 'Ficção', vendas: 9784 },
  { cat: 'Não Ficção', vendas: 5872 },
  { cat: 'Outros', vendas: 3914 },
]

export default function AdminAnalise() {
  const [dataInicio, setDataInicio] = useState('2024-08-01')
  const [dataFim, setDataFim] = useState('2025-01-31')

  const kpis = [
    { label: 'Total de vendas', valor: 'R$ 286.920', icon: '💰' },
    { label: 'Pedidos', valor: '1.942', icon: '📦' },
    { label: 'Ticket médio', valor: 'R$ 147,75', icon: '🎯' },
    { label: 'Livros vendidos', valor: '4.218', icon: '📚' },
  ]

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <div style={{ padding: '28px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800 }}>Relatórios</h1>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>Análise de desempenho de vendas</p>
            </div>
            <button className="btn-secondary" style={{ padding: '9px 18px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', marginRight: 6 }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Exportar
            </button>
          </div>

          {/* Filtros */}
          <div className="card" style={{ padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label className="label" style={{ margin: 0, whiteSpace: 'nowrap' }}>De:</label>
              <input type="date" className="input-field" value={dataInicio} onChange={e => setDataInicio(e.target.value)} style={{ width: 'auto' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label className="label" style={{ margin: 0, whiteSpace: 'nowrap' }}>Até:</label>
              <input type="date" className="input-field" value={dataFim} onChange={e => setDataFim(e.target.value)} style={{ width: 'auto' }} />
            </div>
            <button className="btn-primary" style={{ padding: '9px 18px' }}>Aplicar filtros</button>
          </div>

          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            {kpis.map(k => (
              <div key={k.label} className="card" style={{ padding: 20 }}>
                <span style={{ fontSize: 24, display: 'block', marginBottom: 10 }}>{k.icon}</span>
                <p style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 900, color: 'var(--text)' }}>{k.valor}</p>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>{k.label}</p>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Linha temporal */}
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700 }}>Vendas por período</h3>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={dados_mes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={v => [`R$ ${v.toLocaleString('pt-BR')}`, 'Vendas']} />
                  <Line type="monotone" dataKey="valor" stroke="#7C3AED" strokeWidth={2.5} dot={{ fill: '#7C3AED', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Por categoria */}
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700 }}>Vendas por categoria</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={dados_categoria} layout="vertical" barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#9CA3AF' }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="cat" tick={{ fontSize: 12, fill: '#6B7280' }} width={100} axisLine={false} tickLine={false} />
                  <Tooltip formatter={v => [`R$ ${v.toLocaleString('pt-BR')}`, 'Vendas']} />
                  <Bar dataKey="vendas" fill="#7C3AED" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
