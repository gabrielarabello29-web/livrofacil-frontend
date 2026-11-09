import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminSidebar from '@/shared/layouts/admin/AdminSidebar'
import { useAuth } from '@/features/auth/context/AuthContext'
import { pedidoService } from '@/features/pedidos/api/pedidoService'
import { clienteService } from '@/features/cliente/api/clienteService'
import { analiseService } from '@/features/analise/api/analiseService'
import { mapearStatusPedido, rotuloStatusPedido } from '@/features/pedidos/utils/statusPedidoUtils'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const CORES = ['#7C3AED', '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#14B8A6', '#F97316']
const UUID_VALIDO = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const STATUS_NOMES = {
  EM_PROCESSAMENTO: 'Em processamento', APROVADA: 'Pagamento aprovado', REPROVADA: 'Pagamento rejeitado',
  EM_TRANSPORTE: 'Em transporte', ENTREGUE: 'Entregue', CANCELADO: 'Cancelado',
}
const STATUS_RESUMO = [
  'EM_PROCESSAMENTO', 'APROVADA', 'REPROVADA', 'EM_TRANSPORTE', 'ENTREGUE', 'CANCELADO',
]
const STATUS_CORES = {
  EM_PROCESSAMENTO: '#8B5CF6', APROVADA: '#06B6D4', REPROVADA: '#EF4444',
  EM_TRANSPORTE: '#6366F1', ENTREGUE: '#14B8A6', CANCELADO: '#991B1B',
}
const ESCOPO_VENDAS = [
  { dias: 15, label: '15 dias' },
  { dias: 30, label: '30 dias' },
  { dias: 60, label: '60 dias' },
  { dias: 90, label: '90 dias' },
  { dias: 365, label: '1 ano' },
]

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
    const dataSemHorario = valor.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (dataSemHorario) return new Date(Number(dataSemHorario[1]), Number(dataSemHorario[2]) - 1, Number(dataSemHorario[3]))
  }
  const data = new Date(valor)
  return Number.isNaN(data.getTime()) ? null : data
}

function obterStatus(pedido) { return mapearStatusPedido(pedido?.status) }
function valorPedido(pedido) { return Number(pedido?.total ?? pedido?.valorTotal ?? 0) || 0 }
function formatarMoeda(valor) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(valor) || 0) }
function nomeStatus(status) { return STATUS_NOMES[status] || rotuloStatusPedido(status) || 'Não informado' }
function valorMaisRecente(pedido) { return obterDataPedido(pedido)?.getTime() ?? 0 }

function formatarDataPedido(pedido) {
  const data = obterDataPedido(pedido)
  return data ? data.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Data não informada'
}

function obterPeriodoRelatorio(escopoDias) {
  const fim = new Date()
  const inicio = new Date(fim)
  if (escopoDias === 365) inicio.setFullYear(inicio.getFullYear() - 1)
  else inicio.setDate(inicio.getDate() - escopoDias + 1)
  const formatar = (data) => `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`
  return { dataInicio: formatar(inicio), dataFim: formatar(fim) }
}

function formatarMesRelatorio(mes) {
  const correspondencia = /^(\d{4})-(\d{2})$/.exec(String(mes || ''))
  if (!correspondencia) return String(mes || '')
  return new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit', timeZone: 'UTC' })
    .format(new Date(Date.UTC(Number(correspondencia[1]), Number(correspondencia[2]) - 1, 1)))
    .replace('.', '')
    .replace(' de ', '/')
}

function formatarPercentual(valor, total) {
  const percentual = total ? valor / total : 0
  const numero = Number((percentual * 100).toFixed(1))
  return `${numero.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).replace('.', ',')}%`
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
  const contagem = STATUS_RESUMO.reduce((resultado, status) => {
    resultado[status] = 0
    return resultado
  }, {})

  pedidos.forEach((pedido) => {
    const status = obterStatus(pedido)
    const statusResumo = status === 'FINALIZADO' ? 'ENTREGUE' : status
    if (Object.hasOwn(contagem, statusResumo)) contagem[statusResumo] += 1
  })

  return STATUS_RESUMO.map((status) => ({ name: nomeStatus(status), status, value: contagem[status] }))
}

function filtrarPedidosPorPeriodo(pedidos, escopoDias) {
  const fim = new Date()
  fim.setHours(23, 59, 59, 999)
  const inicio = new Date(fim)
  if (escopoDias === 365) inicio.setFullYear(inicio.getFullYear() - 1)
  else inicio.setDate(inicio.getDate() - escopoDias + 1)
  inicio.setHours(0, 0, 0, 0)

  return pedidos.filter((pedido) => {
    const data = obterDataPedido(pedido)
    return data && data >= inicio && data <= fim
  })
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
  const [escopoVendas, setEscopoVendas] = useState(365)
  const [escopoStatus, setEscopoStatus] = useState(365)
  const [carregandoRelatorio, setCarregandoRelatorio] = useState(true)

  useEffect(() => {
    let ativo = true
    setDados({ ...estadoInicial })

    const pedidosPromise = pedidoService.listarPedidosAdmin()
      .then(extrairLista)
      .then((pedidos) => ({ pedidos }))
      .catch((erro) => ({ erroPedidos: obterMensagemErro(erro, 'Não foi possível carregar os pedidos.') }))
    const clientesPromise = clienteService.listarClientes()
      .then(extrairLista)
      .then((clientes) => ({ clientes }))
      .catch((erro) => ({ erroClientes: obterMensagemErro(erro, 'Não foi possível carregar os clientes.') }))

    Promise.all([pedidosPromise, clientesPromise]).then(([resultadoPedidos, resultadoClientes]) => {
      if (!ativo) return
      setDados((atual) => ({
        ...atual,
        pedidos: resultadoPedidos.pedidos ?? null,
        clientes: resultadoClientes.clientes ?? null,
        erros: {
          ...atual.erros,
          pedidos: resultadoPedidos.erroPedidos || '',
          clientes: resultadoClientes.erroClientes || '',
        },
        carregando: false,
      }))
    })

    return () => { ativo = false }
  }, [tentativa])

  useEffect(() => {
    let ativo = true
    setCarregandoRelatorio(true)
    setDados((atual) => ({ ...atual, relatorio: null, erros: { ...atual.erros, relatorio: '' } }))

    if (!adminId) {
      setDados((atual) => ({ ...atual, erros: { ...atual.erros, relatorio: 'UUID do administrador não identificado para consultar o relatório.' } }))
      setCarregandoRelatorio(false)
      return () => { ativo = false }
    }

    analiseService.buscarVendasPorCategoria({ ...obterPeriodoRelatorio(escopoVendas), adminId })
      .then((relatorio) => {
        if (!ativo) return
        setDados((atual) => ({ ...atual, relatorio, erros: { ...atual.erros, relatorio: '' } }))
      })
      .catch((erro) => {
        if (!ativo) return
        setDados((atual) => ({
          ...atual,
          erros: { ...atual.erros, relatorio: obterMensagemErro(erro, 'Não foi possível carregar as vendas totais.') },
        }))
      })
      .finally(() => {
        if (ativo) setCarregandoRelatorio(false)
      })

    return () => { ativo = false }
  }, [adminId, tentativa, escopoVendas])

  const pedidos = dados.pedidos || []
  const clientes = dados.clientes || []
  const pedidosConsiderados = pedidos.filter((pedido) => obterStatus(pedido) !== 'EM_CHECKOUT')
  const vendasMensais = useMemo(() => criarVendasMensaisTotalGeral(dados.relatorio), [dados.relatorio])
  const totalVendas = somarTotalGeral(dados.relatorio)
  const statusPedidos = useMemo(
    () => criarStatusPedidos(filtrarPedidosPorPeriodo(pedidos, escopoStatus)),
    [pedidos, escopoStatus],
  )
  const totalStatusPedidos = statusPedidos.reduce((total, item) => total + item.value, 0)
  const pedidosRecentes = useMemo(() => [...pedidos].sort((a, b) => valorMaisRecente(b) - valorMaisRecente(a)).slice(0, 4), [pedidos])
  const temErro = Object.values(dados.erros).some(Boolean)

  const kpis = [
    { label: 'Vendas', valor: dados.carregando || carregandoRelatorio ? 'Carregando…' : dados.erros.relatorio || totalVendas === null ? '—' : formatarMoeda(totalVendas), icon: '💰' },
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Vendas totais</h3>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 12 }}>
                  Período
                  <select
                    aria-label="Período das vendas"
                    className="input-field"
                    value={escopoVendas}
                    onChange={(event) => setEscopoVendas(Number(event.target.value))}
                    style={{ width: 130, minWidth: 130, padding: '7px 10px', fontSize: 13 }}
                  >
                    {ESCOPO_VENDAS.map((opcao) => <option key={opcao.dias} value={opcao.dias}>{opcao.label}</option>)}
                  </select>
                </label>
              </div>
              {dados.carregando || carregandoRelatorio ? <div className="admin-feedback">Carregando vendas...</div> : dados.erros.relatorio ? <div className="admin-feedback">{dados.erros.relatorio}</div> : vendasMensais.length === 0 ? <div className="admin-feedback">Sem vendas no período retornado pela API.</div> : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={vendasMensais}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="mes" interval="preserveStartEnd" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <YAxis width={105} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={formatarMoeda} />
                    <Tooltip formatter={(valor) => [formatarMoeda(valor), 'Vendas']} />
                    <Line type="monotone" dataKey="total" name="Total geral" stroke="#7C3AED" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

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
                    const badge = status === 'CANCELADO' ? 'badge-red' : ['ENTREGUE', 'FINALIZADO', 'APROVADA'].includes(status) ? 'badge-green' : status === 'EM_TRANSPORTE' ? 'badge-blue' : 'badge-yellow'
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
          </div>

          <div className="card admin-dashboard-status" style={{ padding: 20, marginTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Pedidos por status</h3>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 12 }}>
                  Período
                  <select
                    aria-label="Período dos pedidos por status"
                    className="input-field"
                    value={escopoStatus}
                    onChange={(event) => setEscopoStatus(Number(event.target.value))}
                    style={{ width: 130, minWidth: 130, padding: '7px 10px', fontSize: 13 }}
                  >
                    {ESCOPO_VENDAS.map((opcao) => <option key={opcao.dias} value={opcao.dias}>{opcao.label}</option>)}
                  </select>
                </label>
              </div>
              {dados.carregando ? <div className="admin-feedback">Carregando status...</div> : dados.erros.pedidos ? <div className="admin-feedback">{dados.erros.pedidos}</div> : statusPedidos.length === 0 ? <div className="admin-feedback">Nenhum pedido encontrado.</div> : (
                <div className="admin-status-content">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={statusPedidos} cx="50%" cy="50%" outerRadius={112} dataKey="value" label={false} labelLine={false}>
                        {statusPedidos.map((item) => <Cell key={item.status} fill={STATUS_CORES[item.status] || CORES[0]} />)}
                      </Pie>
                      <Tooltip formatter={(valor) => [valor, 'Pedidos']} />
                    </PieChart>
                  </ResponsiveContainer>
                  <ul className="admin-status-legend" aria-label="Legenda de pedidos por status">
                    {statusPedidos.map((item) => (
                      <li key={item.status}>
                        <span className="admin-status-legend-label">
                          <span aria-hidden="true" className="admin-status-legend-dot" style={{ backgroundColor: STATUS_CORES[item.status] || CORES[0] }} />
                          {item.name}
                        </span>
                        <strong>{item.value} ({formatarPercentual(item.value, totalStatusPedidos)})</strong>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  )
}