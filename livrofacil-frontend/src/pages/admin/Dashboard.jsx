import AdminSidebar from '../../components/AdminSidebar'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const kpis = [
  { label: 'Vendas', valor: 'R$ 48.920', delta: '+12%', cor: '#7C3AED', icon: '💰', positivo: true },
  { label: 'Pedidos', valor: '342', delta: '+8%', cor: '#10B981', icon: '📦', positivo: true },
  { label: 'Clientes', valor: '1.284', delta: '+5%', cor: '#3B82F6', icon: '👥', positivo: true },
  { label: 'Ticket Médio', valor: 'R$ 143', delta: '-2%', cor: '#F59E0B', icon: '🎯', positivo: false },
]

const vendasSemana = [
  { dia: 'Seg', valor: 4200 }, { dia: 'Ter', valor: 6800 }, { dia: 'Qua', valor: 5100 },
  { dia: 'Qui', valor: 8900 }, { dia: 'Sex', valor: 7600 }, { dia: 'Sáb', valor: 9200 }, { dia: 'Dom', valor: 6100 }
]

const vendasCategoria = [
  { name: 'Dev. Pessoal', value: 35 }, { name: 'Negócios', value: 25 },
  { name: 'Ficção', value: 20 }, { name: 'Não Ficção', value: 12 }, { name: 'Outros', value: 8 }
]

const statusPedidos = [
  { name: 'Entregues', value: 45 }, { name: 'Em transporte', value: 30 },
  { name: 'Processando', value: 18 }, { name: 'Cancelados', value: 7 }
]

const CORES = ['#7C3AED', '#10B981', '#3B82F6', '#F59E0B', '#EF4444']

const pedidosRecentes = [
  { id: '#1089', cliente: 'Ana Silva', valor: 'R$ 97,80', status: 'Entregue', data: 'Hoje, 09:41' },
  { id: '#1088', cliente: 'Carlos Mendes', valor: 'R$ 149,70', status: 'Em transporte', data: 'Hoje, 08:15' },
  { id: '#1087', cliente: 'Mariana Costa', valor: 'R$ 44,90', status: 'Em processamento', data: 'Ontem, 18:32' },
  { id: '#1086', cliente: 'Pedro Souza', valor: 'R$ 85,80', status: 'Entregue', data: 'Ontem, 14:07' },
]

const statusCores = { 'Entregue': 'badge-green', 'Em transporte': 'badge-blue', 'Em processamento': 'badge-yellow', 'Cancelado': 'badge-red' }

export default function Dashboard() {
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <div style={{ padding: '28px 32px' }}>
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>Dashboard</h1>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>Visão geral do desempenho da loja</p>
          </div>

          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            {kpis.map(kpi => (
              <div key={kpi.label} className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span style={{ fontSize: 22 }}>{kpi.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: kpi.positivo ? '#D1FAE5' : '#FEE2E2', color: kpi.positivo ? '#065F46' : '#991B1B' }}>
                    {kpi.delta}
                  </span>
                </div>
                <p style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 900, color: 'var(--text)' }}>{kpi.valor}</p>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>{kpi.label}</p>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            {/* Vendas semana */}
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700 }}>Vendas nos últimos 7 dias</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={vendasSemana} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="dia" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={v => [`R$ ${v.toLocaleString('pt-BR')}`, 'Vendas']} />
                  <Bar dataKey="valor" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Categoria */}
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700 }}>Vendas por categoria</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={vendasCategoria} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value">
                    {vendasCategoria.map((_, i) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => [`${v}%`, '']} />
                  <Legend iconType="circle" iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Pedidos recentes */}
            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Pedidos recentes</h3>
                <a href="/admin/pedidos" style={{ fontSize: 13, color: 'var(--primary)', textDecoration: 'none' }}>Ver todos</a>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {pedidosRecentes.map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>{p.id}</span>
                        <span className={`badge ${statusCores[p.status] || 'badge-gray'}`}>{p.status}</span>
                      </div>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>{p.cliente} · {p.data}</p>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{p.valor}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Status pedidos */}
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700 }}>Pedidos por status</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusPedidos} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name} (${value}%)`} labelLine={false}>
                    {statusPedidos.map((_, i) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => [`${v}%`, '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
