import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Header from '@/shared/components/Header'
import Footer from '@/shared/components/Footer'
import ClienteSidebar from '@/shared/layouts/cliente/ClienteSidebar'
import LivroCover from '@/features/livros/components/LivroCover'
import { useAuth } from '@/features/auth/context/AuthContext'
import { buscarMeuPedido } from '@/features/checkout/api/checkoutApi'

function dinheiro(valor) { return `R$ ${Number(valor || 0).toFixed(2).replace('.', ',')}` }
function statusTexto(status) { return String(status || 'Não informado').replaceAll('_', ' ').toLocaleLowerCase('pt-BR').replace(/(^|\s)\S/g, (letra) => letra.toUpperCase()) }
function dataTexto(pedido) { const valor = pedido?.criadoEm || pedido?.dataCriacao || pedido?.dataPedido || pedido?.createdAt; if (!valor) return 'Data não informada'; const data = new Date(valor); return Number.isNaN(data.getTime()) ? String(valor) : data.toLocaleString('pt-BR') }
function obterEndereco(pedido, cobranca = false) { return cobranca ? pedido?.enderecoCobranca || pedido?.enderecoCobrancaObjeto : pedido?.enderecoEntrega || pedido?.enderecoEntregaObjeto || pedido?.endereco }
function enderecoTexto(endereco) { if (!endereco) return 'Endereço não informado no pedido.'; if (typeof endereco === 'string') return endereco; return `${endereco.logradouro || ''}${endereco.numero ? `, ${endereco.numero}` : ''}${endereco.complemento ? ` - ${endereco.complemento}` : ''}${endereco.bairro ? ` - ${endereco.bairro}` : ''}${endereco.cidade ? `, ${endereco.cidade}` : ''}${endereco.estado ? `/${endereco.estado}` : ''}${endereco.cep ? ` - CEP ${endereco.cep}` : ''}` }
function itemValor(item) { return Number(item.valorUnitario ?? item.precoUnitario ?? item.preco ?? item.valor ?? 0) }
function itemTotal(item) { return Number(item.subtotal ?? item.valorTotal ?? item.totalItem ?? item.precoTotal ?? itemValor(item) * Number(item.quantidade || 0)) }
function pagamentosDoPedido(pedido) { return Array.isArray(pedido?.pagamentos) ? pedido.pagamentos : Array.isArray(pedido?.formasPagamento) ? pedido.formasPagamento : pedido?.formaPagamento ? [pedido.formaPagamento] : [] }

export default function MeuPedidoDetalhesPage() {
  const { id } = useParams()
  const { usuario } = useAuth()
  const [pedido, setPedido] = useState(null)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let ativo = true
    setCarregando(true)
    setErro('')
    buscarMeuPedido(usuario.id, id).then((resposta) => { if (ativo) setPedido(resposta) }).catch((error) => { if (ativo) setErro(error?.mensagem || 'Pedido não encontrado.') }).finally(() => { if (ativo) setCarregando(false) })
    return () => { ativo = false }
  }, [id, usuario.id])

  const enderecoEntrega = obterEndereco(pedido)
  const enderecoCobranca = obterEndereco(pedido, true)
  const itens = Array.isArray(pedido?.itens) ? pedido.itens : []
  const pagamentos = pagamentosDoPedido(pedido)
  const cupons = Array.isArray(pedido?.cupons) ? pedido.cupons : []

  return <div><Header /><main className="page-container account-page"><div className="account-layout"><ClienteSidebar /><section className="account-content"><Link className="account-back-link" to="/meus-pedidos">← Meus pedidos</Link><div className="account-page-heading order-detail-heading"><div><h1>Pedido #{pedido?.id || id}</h1>{pedido && <p>{pedido.cliente?.nome || pedido.clienteNome || 'Cliente não informado'} · {dataTexto(pedido)}</p>}</div>{pedido && <span className="badge badge-purple">{statusTexto(pedido.status)}</span>}</div>{carregando && <div className="card account-feedback">Carregando detalhes do pedido...</div>}{erro && <div className="card account-feedback account-feedback-error" role="alert">{erro}</div>}{pedido && !carregando && <div className="order-detail-layout"><div className="order-detail-main"><section className="card order-detail-section"><h2>Itens do pedido</h2>{itens.length === 0 ? <p className="order-detail-muted">Nenhum item retornado pela API.</p> : <div className="order-detail-items">{itens.map((item, index) => <div className="order-detail-item" key={item.id || item.livroId || index}><LivroCover src={item.imagemUrl || item.capa || item.livro?.imagemUrl} alt={`Capa de ${item.titulo || item.livro?.titulo || 'livro'}`} style={{ width: 64, height: 84, borderRadius: 6, flexShrink: 0 }} /><div className="order-detail-item-info"><strong>{item.titulo || item.livro?.titulo || 'Livro não informado'}</strong><span>Livro ID: {item.livroId || item.livro?.id || '—'} · Quantidade: {item.quantidade || 0}</span><small>Valor unitário: {dinheiro(itemValor(item))}</small></div><strong className="order-detail-item-total">{dinheiro(itemTotal(item))}</strong></div>)}</div>}</section><section className="card order-detail-section"><h2>Entrega</h2><div className="order-detail-address"><strong>Endereço de entrega</strong><span>{enderecoTexto(enderecoEntrega)}</span></div>{enderecoCobranca && <div className="order-detail-address order-detail-address-secondary"><strong>Endereço de cobrança</strong><span>{enderecoTexto(enderecoCobranca)}</span></div>}</section><section className="card order-detail-section"><h2>Pagamento</h2>{pagamentos.length === 0 ? <p className="order-detail-muted">Informação de pagamento não retornada pela API.</p> : <div className="order-detail-payments">{pagamentos.map((pagamento, index) => <div key={pagamento.id || index}><span>{pagamento.formaPagamento?.bandeira || pagamento.bandeira || pagamento.tipoCartao || pagamento.tipo || pagamento.nome || 'Forma de pagamento'}{pagamento.parcelas ? ` · ${pagamento.parcelas}x` : ''}</span><strong>{dinheiro(pagamento.valor || pagamento.valorPago || pagamento.total)}</strong></div>)}</div>}</section></div><aside className="order-detail-aside"><section className="card order-detail-section"><h2>Resumo</h2><div className="order-detail-summary-row"><span>Status</span><strong>{statusTexto(pedido.status)}</strong></div><div className="order-detail-summary-row"><span>Subtotal</span><strong>{dinheiro(pedido.subtotal)}</strong></div>{pedido.desconto !== undefined && <div className="order-detail-summary-row"><span>Desconto</span><strong>- {dinheiro(pedido.desconto)}</strong></div>}{pedido.frete !== undefined && <div className="order-detail-summary-row"><span>Frete</span><strong>{dinheiro(pedido.frete)}</strong></div>}<div className="order-detail-summary-total"><span>Total</span><strong>{dinheiro(pedido.total)}</strong></div></section>{cupons.length > 0 && <section className="card order-detail-section"><h2>Cupom</h2>{cupons.map((cupom) => <span className="badge badge-purple" key={typeof cupom === 'string' ? cupom : cupom.codigo}>{typeof cupom === 'string' ? cupom : cupom.codigo}</span>)}</section>}</aside></div>}</section></div></main><Footer /></div>
}
