import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminSidebar from '@/shared/layouts/admin/AdminSidebar'
import { useAuth } from '@/features/auth/context/AuthContext'
import { pedidoService } from '@/features/pedidos/api/pedidoService'
import { clienteService } from '@/features/cliente/api/clienteService'
import { analiseService } from '@/features/analise/api/analiseService'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const CORES = ['#7C3AED', '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#14B8A6', '#F97316']
const UUID_VALIDO = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const STATUS_NOMES = {
  PENDENTE: 'Pendente', AGUARDANDO_PAGAMENTO: 'Aguardando pagamento', EM_CHECKOUT: 'Em checkout',
  EM_PROCESSAMENTO: 'Em processamento', PAGAMENTO_APROVADO: 'Pagamento aprovado', EM_SEPARACAO: 'Em separação',
  NA_TRANSPORTADORA: 'Na transportadora', EM_ROTA_DE_ENTREGA: 'Em rota de entrega', ENTREGUE: 'Entregue',
  FINALIZADO: 'Finalizado', CANCELADO: 'Cancelado',
}
const STATUS_CORES = {
  PENDENTE: '#F59E0B', AGUARDANDO_PAGAMENTO: '#F59E0B', EM_CHECKOUT: '#9CA3AF', EM_PROCESSAMENTO: '#F59E0B',
  PAGAMENTO_APROVADO: '#10B981', EM_SEPARACAO: '#3B82F6', NA_TRANSPORTADORA: '#3B82F6',
  EM_ROTA_DE_ENTREGA: '#6366F1', ENTREGUE: '#059669', FINALIZADO: '#047857', CANCELADO: '#EF4444',
}

const estadoInicial = { pedidos: null, clientes: null, relatorio: null, erros: {}, carregando: true }

function extrairLista(resposta) {
  if (Array.isArray(resposta)) return resposta
  if (Array.isArray(resposta?.data)) return resposta.data
  if (Array.isArray(resposta?.content)) return resposta.content
  if (Array.isArray(resposta?.data?.content)) return resposta.data.content
  return []
}

function obterDataPedido(pedido) {
  const valor = pedido?.criadoEm || pedido?.dataCriacao || pedido?.dataPedido || pedido?.createdAt
  if (!valor) return null
  if (typeof valor === 'string') {
    const dataIso = valor.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (dataIso) return new Date(Number(dataIso[1]), Number(dataIso[2]) - 1, Number(dataIso[3]))
  }
  const data = new Date(valor)
  return Number.isNaN(data.getTime()) ? null : data
}

function obterStatus(pedido) { return String(pedido?.status || '').trim().toUpperCase() }
function valorPedido(pedido) { return Number(pedido?.total ?? pedido?.valorTotal ?? 0) || 0 }
function formatarMoeda(valor) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(valor) || 0) }
function nomeStatus(status) { return STATUS_NOMES[status] || status.replaceAll('_', ' ') || 'Não informado' }
function valorMaisRecente(pedido) { return obterDataPedido(pedido)?.getTime() ?? 0 }

function formatarDataPedido(pedido) {
  const data = obterDataPedido(pedido)
  return data ? data.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Data não informada'
}

function obterPeriodoRelatorio() {
  const fim = new Date()
  const inicio = new Date(fim.getFullYear(), fim.getMonth() - 2, 1)
  const formatar = (data) => `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`
  return { dataInicio: formatar(inicio), dataFim: formatar(fim) }
}

function formatarMesRelatorio(mes) {
  const correspondencia = /^(\d{4})-(\d{2})$/.exec(String(mes || ''))
  if (!correspondencia) return String(mes || '')
  return new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(Number(correspondencia[1]), Number(correspondencia[2]) - 1, 1)))
    .replace('.', '')
}

function criarVendasMensaisTotalGeral(relatorio) {
  const meses = Array.isArray(relatorio?.meses) ? relatorio.meses : []
  const serie = Array.isArray(relatorio?.series) ? relatorio.series.find((item) => item?.categoriaNome === 'Total geral') : null
  if (!serie) return []
  return meses.map((mes, indice) => ({
    mes: formatarMesRelatorio(mes),
    total: Number.isFinite(Number(serie.valores?.[indice])) ? Number(serie.valores[indice]) : 0,
  }))
}

function somarTotalGeral(relatorio) {
  const serie = Array.isArray(relatorio?.series) ? relatorio.series.find((item) => item?.categoriaNome === 'Total geral') : null
  if (!serie || !Array.isArray(serie.valores)) return null
  return serie.valores.reduce((total, valor) => total + (Number.isFinite(Number(valor)) ? Number(valor) : 0), 0)
}

function criarStatusPedidos(pedidos) {
  const contagem = pedidos.reduce((resultado, pedido) => {
    const status = obterStatus(pedido)
    if (status) resultado[status] = (resultado[status] || 0) + 1
    return resultado
  }, {})
  return Object.entries(contagem).map(([status, value]) => ({ name: nomeStatus(status), status, value }))
}

function obterMensagemErro(erro, padrao) { return erro?.mensagem || erro?.message || padrao }
function obterAdminId(usuario) {
  const candidato = usuario?.uuid || (typeof usuario?.id === 'string' ? usuario.id : '')
  return UUID_VALIDO.test(candidato) ? candidato : null
}

export default function Dashboard() {
  const { usuario } = useAuth()
  const adminId = obterAdminId(usuario)
  const [dados, setDados] = useState(estadoInicial)
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    let ativo = true
    setDados({ ...estadoInicial })

    const periodo = obterPeriodoRelatorio()
    const pedidosPromise = pedidoService.listarPedidosAdmin()
      .then(extrairLista)
      .then((pedidos) => ({ pedidos }))
      .catch((erro) => ({ erroPedidos: obterMensagemErro(erro, 'Não foi possível carregar os pedidos.') }))
    const clientesPromise = clienteService.listarClientes()
      .then(extrairLista)
      .then((clientes) => ({ clientes }))
      .catch((erro) => ({ erroClientes: obterMensagemErro(erro, 'Não foi possível carregar os clientes.') }))
    const relatorioPromise = adminId
      ? analiseService.buscarVendasPorCategoria({ ...periodo, adminId })
          .then((relatorio) => ({ relatorio }))
          .catch((erro) => ({ erroRelatorio: obterMensagemErro(erro, 'Não foi possível carregar as vendas por categoria.') }))
      : Promise.resolve({ erroRelatorio: 'UUID do administrador não identificado para consultar o relatório.' })

    Promise.all([pedidosPromise, clientesPromise, relatorioPromise]).then((resultados) => {
      if (!ativo) return
      const resultado = Object.assign({}, ...resultados)
      setDados({
        pedidos: resultado.pedidos ?? null,
        clientes: resultado.clientes ?? null,
        relatorio: resultado.relatorio ?? null,
        erros: {
          pedidos: resultado.erroPedidos || '',
          clientes: resultado.erroClientes || '',
          relatorio: resultado.erroRelatorio || '',
        },
        carregando: false,
      })
    })

    return () => { ativo = false }
  }, [adminId, tentativa])

  const pedidos = dados.pedidos || []
  const clientes = dados.clientes || []
  const pedidosConsiderados = pedidos.filter((pedido) => obterStatus(pedido) !== 'EM_CHECKOUT')
  const vendasMensais = useMemo(() => criarVendasMensaisTotalGeral(dados.relatorio), [dados.relatorio])
  const totalVendas = somarTotalGeral(dados.relatorio)
  const statusPedidos = useMemo(() => criarStatusPedidos(pedidos), [pedidos])
  const pedidosRecentes = useMemo(() => [...pedidos].sort((a, b) => valorMaisRecente(b) - valorMaisRecente(a)).slice(0, 4), [pedidos])
  const temErro = Object.values(dados.erros).some(Boolean)

  const kpis = [
    { label: 'Vendas', valor: dados.carregando ? 'Carregando…' : dados.erros.relatorio || totalVendas === null ? '—' : formatarMoeda(totalVendas), icon: '💰' },
    { label: 'Pedidos', valor: dados.carregando ? 'Carregando…' : dados.erros.pedidos ? '—' : pedidosConsiderados.length.toLocaleString('pt-BR'), icon: '📦' },
    { label: 'Clientes', valor: dados.carregando ? 'Carregando…' : dados.erros.clientes ? '—' : clientes.length.toLocaleString('pt-BR'), icon: '👥' },
    { label: 'Ticket Médio', valor: 'Indisponível', icon: '🎯' },
  ]

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <div style={{ padding: '28px 32px' }}>
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>Dashboard</h1>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>Visão geral do desempenho da loja</p>
          </div>

          {temErro && (
            <div className="card admin-feedback-error" role="alert" style={{ justifyContent: 'space-between', padding: 14, marginBottom: 16 }}>
              <span>Alguns dados não puderam ser carregados. Indicadores indisponíveis aparecem sem valor.</span>
              <button type="button" className="btn-secondary" onClick={() => setTentativa((valor) => valor + 1)}>Tentar novamente</button>
            </div>
          )}

          <div className="admin-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            {kpis.map((kpi) => (
              <div key={kpi.label} className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span style={{ fontSize: 22 }}>{kpi.icon}</span>
                </div>
                <p style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 900, color: 'var(--text)' }}>{kpi.valor}</p>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>{kpi.label}</p>
              </div>
            ))}
          </div>

          <div className="admin-dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700 }}>Vendas mensais · Total geral</h3>
              <p style={{ margin: '0 0 16px', color: 'var(--text-muted)', fontSize: 12 }}>Total fornecido pela API para pedidos ENTREGUE ou FINALIZADO; cada pedido é considerado uma única vez pelo status atual.</p>
              {dados.carregando ? <div className="admin-feedback">Carregando vendas...</div> : dados.erros.relatorio ? <div className="admin-feedback">{dados.erros.relatorio}</div> : vendasMensais.length === 0 ? <div className="admin-feedback">Sem vendas no período retornado pela API.</div> : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={vendasMensais}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={formatarMoeda} />
                    <Tooltip formatter={(valor) => [formatarMoeda(valor), 'Vendas']} />
                    <Line type="monotone" dataKey="total" name="Total geral" stroke="#7C3AED" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700 }}>Vendas por categoria</h3>
              <div className="admin-feedback">Selecione categorias em Relatórios para consultar o detalhamento por categoria. Este dashboard apresenta o Total geral retornado pelo backend.</div>
              <Link to="/admin/relatorios" style={{ display: 'inline-block', marginTop: 8, color: 'var(--primary)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Abrir relatórios</Link>
            </div>
          </div>

          <div className="admin-dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Pedidos recentes</h3>
                <Link to="/admin/pedidos" style={{ fontSize: 13, color: 'var(--primary)', textDecoration: 'none' }}>Ver todos</Link>
              </div>
              {dados.carregando ? <div className="admin-feedback">Carregando pedidos...</div> : dados.erros.pedidos ? <div className="admin-feedback">{dados.erros.pedidos}</div> : pedidosRecentes.length === 0 ? <div className="admin-feedback">Nenhum pedido encontrado.</div> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {pedidosRecentes.map((pedido) => {
                    const status = obterStatus(pedido)
                    const cliente = pedido.cliente?.nome || pedido.clienteNome || 'Cliente não informado'
                    const badge = status === 'CANCELADO' ? 'badge-red' : ['ENTREGUE', 'FINALIZADO', 'PAGAMENTO_APROVADO'].includes(status) ? 'badge-green' : ['NA_TRANSPORTADORA', 'EM_ROTA_DE_ENTREGA', 'EM_SEPARACAO'].includes(status) ? 'badge-blue' : 'badge-yellow'
                    return (
                      <div key={pedido.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 13, fontWeight: 700 }}>#{pedido.id}</span>
                            <span className={`badge ${badge}`}>{nomeStatus(status)}</span>
                          </div>
                          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>{cliente} · {formatarDataPedido(pedido)}</p>
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap' }}>{formatarMoeda(valorPedido(pedido))}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700 }}>Pedidos por status</h3>
              {dados.carregando ? <div className="admin-feedback">Carregando status...</div> : dados.erros.pedidos ? <div className="admin-feedback">{dados.erros.pedidos}</div> : statusPedidos.length === 0 ? <div className="admin-feedback">Nenhum pedido encontrado.</div> : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={statusPedidos} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name} (${value})`} labelLine={false}>
                      {statusPedidos.map((item) => <Cell key={item.status} fill={STATUS_CORES[item.status] || CORES[0]} />)}
                    </Pie>
                    <Tooltip formatter={(valor) => [valor, 'Pedidos']} />
                    <Legend iconType="circle" iconSize={8} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}