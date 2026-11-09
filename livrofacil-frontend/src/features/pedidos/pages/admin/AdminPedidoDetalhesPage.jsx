import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AdminSidebar from '@/shared/layouts/admin/AdminSidebar'
import LivroCover from '@/features/livros/components/LivroCover'
import { pedidoService } from '@/features/pedidos/api/pedidoService'
import AcoesStatusPedido from '@/features/pedidos/components/AcoesStatusPedido'
import { rotuloStatusPedido, statusPedidoCancelavelPorAdmin } from '@/features/pedidos/utils/statusPedidoUtils'

function dinheiro(valor) { return `R$ ${Number(valor || 0).toFixed(2).replace('.', ',')}` }
function statusTexto(status) { return rotuloStatusPedido(status) }
function dataTexto(pedido) { const valor = pedido?.criadoEm || pedido?.dataCriacao || pedido?.createdAt; if (!valor) return 'Data não informada'; const data = new Date(valor); return Number.isNaN(data.getTime()) ? String(valor) : data.toLocaleString('pt-BR') }
function enderecoTexto(endereco) { if (!endereco) return 'Endereço não informado.'; if (typeof endereco === 'string') return endereco; return `${endereco.logradouro || ''}${endereco.numero ? `, ${endereco.numero}` : ''}${endereco.complemento ? ` - ${endereco.complemento}` : ''}${endereco.bairro ? ` - ${endereco.bairro}` : ''}${endereco.cidade ? `, ${endereco.cidade}` : ''}${endereco.estado ? `/${endereco.estado}` : ''}${endereco.cep ? ` - CEP ${endereco.cep}` : ''}` }
function obterEndereco(pedido, cobranca = false) { return cobranca ? pedido?.enderecoCobranca || pedido?.enderecoCobrancaObjeto : pedido?.enderecoEntrega || pedido?.enderecoEntregaObjeto || pedido?.endereco }

export default function AdminPedidoDetalhesPage() {
  const { id } = useParams()
  const [pedido, setPedido] = useState(null)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let ativo = true
    setCarregando(true)
    setErro('')
    pedidoService.buscarPedidoAdmin(id).then((resposta) => { if (ativo) setPedido(resposta?.data || resposta) }).catch((error) => { if (ativo) setErro(error?.message || error?.mensagem || 'Não foi possível carregar o pedido.') }).finally(() => { if (ativo) setCarregando(false) })
    return () => { ativo = false }
  }, [id])

  const itens = Array.isArray(pedido?.itens) ? pedido.itens : []
  const pagamentos = Array.isArray(pedido?.pagamentos) ? pedido.pagamentos : Array.isArray(pedido?.formasPagamento) ? pedido.formasPagamento : pedido?.formaPagamento ? [pedido.formaPagamento] : []
  const enderecoEntrega = obterEndereco(pedido)
  const enderecoCobranca = obterEndereco(pedido, true)

  return <div className="admin-layout"><AdminSidebar /><div className="admin-content"><main className="admin-page"><Link className="admin-back-link" to="/admin/pedidos">← Pedidos</Link><div className="admin-page-heading admin-detail-heading"><div><h1>Pedido #{pedido?.id || id}</h1>{pedido && <p>{pedido.cliente?.nome || pedido.clienteNome || 'Cliente não informado'}</p>}</div>{pedido && <span className="badge badge-purple">{statusTexto(pedido.status)}</span>}</div>{carregando && <div className="card admin-feedback">Carregando pedido...</div>}{erro && <div className="admin-feedback admin-feedback-error" role="alert">{erro}<button className="btn-secondary" onClick={() => window.location.reload()}>Tentar novamente</button></div>}{mensagem && <div className="admin-feedback" role="status">{mensagem}</div>}{pedido && !carregando && <><section className="card admin-detail-section"><h2>Ações do pedido</h2><AcoesStatusPedido pedido={pedido} onAtualizado={setPedido} onErro={setErro} onSucesso={setMensagem} />{statusPedidoCancelavelPorAdmin(pedido.status) && <button className="btn-danger" onClick={async () => { if (!window.confirm(`Cancelar o pedido #${pedido.id}?`)) return; try { const resposta = await pedidoService.cancelarPedidoAdmin(pedido.id); setPedido(resposta?.data || resposta || { ...pedido, status: 'CANCELADO' }); setMensagem('Pedido cancelado.'); setErro(''); } catch (error) { setErro(error?.message || error?.mensagem || 'Não foi possível cancelar o pedido.'); } }}>Cancelar pedido</button>}</section><div className="admin-order-detail-layout"><div className="admin-order-detail-main"><section className="card admin-detail-section"><h2>Itens do pedido</h2>{itens.length === 0 ? <p className="admin-muted-cell">Nenhum item retornado pela API.</p> : <div className="admin-detail-items">{itens.map((item, index) => <div className="admin-detail-item" key={item.id || item.livroId || index}><LivroCover src={item.imagemUrl || item.capa || item.livro?.imagemUrl} alt={`Capa de ${item.titulo || item.livro?.titulo || 'livro'}`} style={{ width: 56, height: 74, borderRadius: 5, flexShrink: 0 }} /><div><strong>{item.titulo || item.livro?.titulo || 'Livro não informado'}</strong><span>Livro ID: {item.livroId || item.livro?.id || '—'} · Quantidade: {item.quantidade || 0}</span><small>Valor unitário: {dinheiro(item.valorUnitario ?? item.precoUnitario ?? item.preco ?? item.valor)}</small></div><strong>{dinheiro(item.subtotal ?? item.valorTotal ?? Number(item.valorUnitario || item.precoUnitario || item.preco || item.valor || 0) * Number(item.quantidade || 0))}</strong></div>)}</div>}</section><section className="card admin-detail-section"><h2>Entrega</h2><p>{enderecoTexto(enderecoEntrega)}</p>{enderecoCobranca && <><h3>Endereço de cobrança</h3><p>{enderecoTexto(enderecoCobranca)}</p></>}</section><section className="card admin-detail-section"><h2>Pagamentos</h2>{pagamentos.length ? pagamentos.map((pagamento, index) => <p key={pagamento.id || index}>{pagamento.bandeira || pagamento.tipo || 'Pagamento'} · {dinheiro(pagamento.valor)} · {pagamento.parcelas || 1}x</p>) : <p className="admin-muted-cell">Nenhum pagamento informado.</p>}</section></div><aside className="admin-order-detail-sidebar"><section className="card admin-detail-section"><h2>Resumo</h2><p>Subtotal: {dinheiro(pedido.subtotal)}</p><p>Desconto: − {dinheiro(pedido.desconto)}</p><p>Frete: {dinheiro(pedido.frete)}</p><strong>Total: {dinheiro(pedido.total)}</strong></section></aside></div></>}</main></div></div>
}
