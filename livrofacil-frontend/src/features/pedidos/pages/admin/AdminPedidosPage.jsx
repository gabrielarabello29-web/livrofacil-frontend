import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminSidebar from '@/shared/layouts/admin/AdminSidebar'
import { pedidoService } from '@/features/pedidos/api/pedidoService'

const statusOrdem = ['EM_PROCESSAMENTO', 'PAGAMENTO_APROVADO', 'EM_SEPARACAO', 'NA_TRANSPORTADORA', 'EM_ROTA_DE_ENTREGA', 'ENTREGUE', 'FINALIZADO']
const proximo = Object.fromEntries(statusOrdem.slice(0, -1).map((status, index) => [status, statusOrdem[index + 1]]))
const statusNomes = { EM_PROCESSAMENTO: 'Em processamento', PAGAMENTO_APROVADO: 'Pagamento aprovado', EM_SEPARACAO: 'Em separação', NA_TRANSPORTADORA: 'Na transportadora', EM_ROTA_DE_ENTREGA: 'Em rota de entrega', ENTREGUE: 'Entregue', FINALIZADO: 'Finalizado', CANCELADO: 'Cancelado' }
const cancelaveis = ['EM_PROCESSAMENTO', 'PAGAMENTO_APROVADO', 'EM_SEPARACAO', 'NA_TRANSPORTADORA']
const statusCores = { EM_PROCESSAMENTO: 'badge-yellow', PAGAMENTO_APROVADO: 'badge-green', EM_SEPARACAO: 'badge-blue', NA_TRANSPORTADORA: 'badge-blue', EM_ROTA_DE_ENTREGA: 'badge-blue', ENTREGUE: 'badge-green', FINALIZADO: 'badge-green', CANCELADO: 'badge-red' }

function textoStatus(status) { return statusNomes[status] || 'Não informado' }
function dataPedido(pedido) { const valor = pedido?.criadoEm || pedido?.dataCriacao || pedido?.dataPedido || pedido?.createdAt; if (!valor) return '—'; const data = new Date(valor); return Number.isNaN(data.getTime()) ? String(valor) : data.toLocaleDateString('pt-BR') }

export default function AdminPedidosPage() {
  const [pedidos, setPedidos] = useState([])
  const [busca, setBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('TODOS')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)

  async function carregar() {
    setCarregando(true)
    setErro('')
    try {
      const resposta = await pedidoService.listarPedidosAdmin()
      setPedidos(Array.isArray(resposta?.data || resposta) ? (resposta?.data || resposta) : [])
    } catch (error) {
      setErro(error?.mensagem || 'Não foi possível carregar os pedidos administrativos.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregar() }, [])

  async function mudarStatus(pedido, status) {
    const atual = statusOrdem.indexOf(pedido.status)
    const novo = statusOrdem.indexOf(status)
    if (pedido.status === 'CANCELADO') return setErro('Pedidos cancelados não podem ter o status alterado.')
    if (novo <= atual) return setErro('Não é permitido voltar para um status anterior.')
    try { await pedidoService.atualizarStatusAdmin(pedido.id, status); setPedidos((atuais) => atuais.map((item) => item.id === pedido.id ? { ...item, status } : item)); setErro(`Pedido #${pedido.id} atualizado para ${textoStatus(status)}.`) } catch (error) { setErro(error?.message || error?.mensagem || 'Não foi possível alterar o status.') }
  }

  async function cancelar(pedido) {
    if (!window.confirm(`Cancelar o pedido #${pedido.id}?`)) return
    if (pedido.status === 'CANCELADO') return setErro('Este pedido já está cancelado.')
    try { await pedidoService.cancelarPedidoAdmin(pedido.id); setPedidos((atuais) => atuais.map((item) => item.id === pedido.id ? { ...item, status: 'CANCELADO' } : item)); setErro(`Pedido #${pedido.id} cancelado.`) } catch (error) { setErro(error?.message || error?.mensagem || 'Não foi possível cancelar o pedido.') }
  }

  const pedidosFiltrados = useMemo(() => pedidos.filter((pedido) => {
    const cliente = pedido.cliente?.nome || pedido.clienteNome || ''
    const termo = busca.trim().toLocaleLowerCase('pt-BR')
    const combinaBusca = !termo || String(pedido.id).toLocaleLowerCase('pt-BR').includes(termo) || cliente.toLocaleLowerCase('pt-BR').includes(termo)
    return combinaBusca && (statusFiltro === 'TODOS' || pedido.status === statusFiltro)
  }), [busca, pedidos, statusFiltro])

  const statusDisponiveis = [...new Set(pedidos.map((pedido) => pedido.status).filter(Boolean))]

  return <div className="admin-layout"><AdminSidebar /><div className="admin-content"><main className="admin-page"><div className="admin-page-heading"><div><h1>Pedidos</h1><p>{pedidos.length} pedidos retornados pela API</p></div></div><div className="admin-filter-bar"><input className="input-field" value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Buscar por pedido ou cliente..." /><select className="input-field" value={statusFiltro} onChange={(event) => setStatusFiltro(event.target.value)}><option value="TODOS">Todos os status</option>{statusDisponiveis.map((status) => <option key={status} value={status}>{textoStatus(status)}</option>)}</select></div>{erro && <div className="admin-feedback admin-feedback-error" role="alert">{erro}<button className="btn-secondary" onClick={carregar}>Tentar novamente</button></div>}{carregando ? <div className="card admin-feedback">Carregando pedidos...</div> : !erro && pedidosFiltrados.length === 0 ? <div className="card admin-feedback">Nenhum pedido encontrado.</div> : <div className="card admin-table-wrapper"><table className="data-table"><thead><tr><th>Pedido</th><th>Cliente</th><th>Data</th><th>Total</th><th>Status</th><th>Ações</th></tr></thead><tbody>{pedidosFiltrados.map((pedido) => { const cliente = pedido.cliente?.nome || pedido.clienteNome || 'Não informado'; return <tr key={pedido.id}><td><strong>#{pedido.id}</strong></td><td>{cliente}</td><td className="admin-muted-cell">{dataPedido(pedido)}</td><td><strong>R$ {Number(pedido.total || 0).toFixed(2).replace('.', ',')}</strong></td><td><span className={`badge ${statusCores[pedido.status] || 'badge-gray'}`}>{textoStatus(pedido.status)}</span></td><td><div className="admin-order-actions"><Link className="btn-secondary" to={`/admin/pedidos/${pedido.id}`}>Ver detalhes</Link>{proximo[pedido.status] && <button className="btn-primary" onClick={() => mudarStatus(pedido, proximo[pedido.status])}>Avançar</button>}{cancelaveis.includes(pedido.status) && <button className="btn-danger" onClick={() => cancelar(pedido)}>Cancelar</button>}</div></td></tr>})}</tbody></table></div>}</main></div></div>
}
