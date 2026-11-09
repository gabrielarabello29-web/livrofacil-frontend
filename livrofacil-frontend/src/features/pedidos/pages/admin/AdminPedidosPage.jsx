import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminSidebar from '@/shared/layouts/admin/AdminSidebar'
import { pedidoService } from '@/features/pedidos/api/pedidoService'
import AcoesStatusPedido from '@/features/pedidos/components/AcoesStatusPedido'
import { mapearStatusPedido, rotuloStatusPedido, statusPedidoCancelavelPorAdmin } from '@/features/pedidos/utils/statusPedidoUtils'

const statusCores = { PENDENTE: 'badge-yellow', AGUARDANDO_PAGAMENTO: 'badge-yellow', EM_CHECKOUT: 'badge-yellow', EM_PROCESSAMENTO: 'badge-yellow', APROVADA: 'badge-green', REPROVADA: 'badge-red', EM_TRANSPORTE: 'badge-blue', ENTREGUE: 'badge-green', FINALIZADO: 'badge-green', CANCELADO: 'badge-red' }

function textoStatus(status) { return rotuloStatusPedido(status) }
function dataPedido(pedido) { const valor = pedido?.criadoEm || pedido?.dataCriacao || pedido?.dataPedido || pedido?.createdAt; if (!valor) return '—'; const data = new Date(valor); return Number.isNaN(data.getTime()) ? String(valor) : data.toLocaleDateString('pt-BR') }

export default function AdminPedidosPage() {
  const [pedidos, setPedidos] = useState([])
  const [busca, setBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('TODOS')
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')
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

  async function cancelar(pedido) {
    if (!window.confirm(`Cancelar o pedido #${pedido.id}?`)) return
    if (pedido.status === 'CANCELADO') return setErro('Este pedido já está cancelado.')
    try { await pedidoService.cancelarPedidoAdmin(pedido.id); setPedidos((atuais) => atuais.map((item) => item.id === pedido.id ? { ...item, status: 'CANCELADO' } : item)); setErro(`Pedido #${pedido.id} cancelado.`) } catch (error) { setErro(error?.message || error?.mensagem || 'Não foi possível cancelar o pedido.') }
  }

  const pedidosFiltrados = useMemo(() => pedidos.filter((pedido) => {
    const cliente = pedido.cliente?.nome || pedido.clienteNome || ''
    const termo = busca.trim().toLocaleLowerCase('pt-BR')
    const statusAtual = mapearStatusPedido(pedido.status)
    const combinaBusca = !termo || String(pedido.id).toLocaleLowerCase('pt-BR').includes(termo) || cliente.toLocaleLowerCase('pt-BR').includes(termo)
    return combinaBusca && (statusFiltro === 'TODOS' || statusAtual === statusFiltro)
  }), [busca, pedidos, statusFiltro])

  const statusDisponiveis = [...new Set(pedidos.map((pedido) => mapearStatusPedido(pedido.status)).filter(Boolean))]

  return <div className="admin-layout"><AdminSidebar /><div className="admin-content"><main className="admin-page"><div className="admin-page-heading"><div><h1>Pedidos</h1><p>{pedidos.length} pedidos </p></div></div><div className="admin-filter-bar"><input className="input-field" value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Buscar por pedido ou cliente..." /><select className="input-field" value={statusFiltro} onChange={(event) => setStatusFiltro(event.target.value)}><option value="TODOS">Todos os status</option>{statusDisponiveis.map((status) => <option key={status} value={status}>{textoStatus(status)}</option>)}</select></div>{erro && <div className="admin-feedback admin-feedback-error" role="alert">{erro}<button className="btn-secondary" onClick={carregar}>Tentar novamente</button></div>}{mensagem && <div className="admin-feedback" role="status">{mensagem}</div>}{carregando ? <div className="card admin-feedback">Carregando pedidos...</div> : !erro && pedidosFiltrados.length === 0 ? <div className="card admin-feedback">Nenhum pedido encontrado.</div> : <div className="card admin-table-wrapper"><table className="data-table"><thead><tr><th>Pedido</th><th>Cliente</th><th>Data</th><th>Total</th><th>Status</th><th>Ações</th></tr></thead><tbody>{pedidosFiltrados.map((pedido) => { const cliente = pedido.cliente?.nome || pedido.clienteNome || 'Não informado'; return <tr key={pedido.id}><td><strong>#{pedido.id}</strong></td><td>{cliente}</td><td className="admin-muted-cell">{dataPedido(pedido)}</td><td><strong>R$ {Number(pedido.total || 0).toFixed(2).replace('.', ',')}</strong></td><td><span className={`badge ${statusCores[pedido.status] || 'badge-gray'}`}>{textoStatus(pedido.status)}</span></td><td><div className="admin-order-actions"><Link className="btn-secondary" to={`/admin/pedidos/${pedido.id}`}>Ver detalhes</Link><AcoesStatusPedido pedido={pedido} onAtualizado={(atualizado) => setPedidos((atuais) => atuais.map((item) => item.id === pedido.id ? { ...item, ...atualizado } : item))} onErro={setErro} onSucesso={setMensagem} />{statusPedidoCancelavelPorAdmin(pedido.status) && <button className="btn-danger" onClick={() => cancelar(pedido)}>Cancelar</button>}</div></td></tr>})}</tbody></table></div>}</main></div></div>
}
