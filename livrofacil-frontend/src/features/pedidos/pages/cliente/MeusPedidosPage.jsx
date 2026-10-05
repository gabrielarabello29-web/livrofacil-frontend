import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '@/shared/components/Header'
import Footer from '@/shared/components/Footer'
import ClienteSidebar from '@/shared/layouts/cliente/ClienteSidebar'
import { obterClienteId, useAuth } from '@/features/auth/context/AuthContext'
import { listarMeusPedidos, cancelarMeuPedido } from '@/features/checkout/api/checkoutApi'
import { obterItensPedido, obterNomeLivro, pedidoDeveSerExibido } from '@/features/pedidos/utils/pedidoUtils'

const cancelaveis = ['EM_PROCESSAMENTO', 'EM_SEPARACAO', 'NA_TRANSPORTADORA']
function textoStatus(status) { return String(status || 'Não informado').replaceAll('_', ' ').toLocaleLowerCase('pt-BR').replace(/(^|\s)\S/g, (letra) => letra.toUpperCase()) }
function dataPedido(pedido) { const valor = pedido?.criadoEm || pedido?.dataCriacao || pedido?.dataPedido || pedido?.createdAt; if (!valor) return '' ; const data = new Date(valor); return Number.isNaN(data.getTime()) ? String(valor) : `Realizado em ${data.toLocaleDateString('pt-BR')}` }
function quantidadeItens(pedido) { return obterItensPedido(pedido).reduce((total, item) => total + Number(item.quantidade || 0), 0) }
export default function MeusPedidosPage() {
	const { usuario } = useAuth()
	const clienteId = obterClienteId(usuario)
	const [pedidos, setPedidos] = useState([])
	const [erro, setErro] = useState('')
	const [carregando, setCarregando] = useState(true)

	async function carregar() {
		setCarregando(true)
		setErro('')
		try {
			if (!clienteId) throw new Error('Não foi possível identificar o cliente pelo UUID.')
			const resposta = await listarMeusPedidos(clienteId)
			const lista = Array.isArray(resposta) ? resposta : resposta?.data
			setPedidos((Array.isArray(lista) ? lista : []).filter(pedidoDeveSerExibido))
		} catch (error) {
			setErro(error?.mensagem || 'Não foi possível carregar seus pedidos.')
		} finally {
			setCarregando(false)
		}
	}

	useEffect(() => { carregar() }, [clienteId])

	async function cancelar(id) {
		if (!window.confirm('Deseja cancelar este pedido?')) return
		try {
			await cancelarMeuPedido(clienteId, id)
			carregar()
		} catch (error) {
			setErro(error?.mensagem || 'Esse pedido não pode mais ser cancelado automaticamente.')
		}
	}

	return (
		<div>
			<Header />
			<main className="page-container account-page">
				<div className="account-layout">
					<ClienteSidebar />
					<section className="account-content">
						<div className="account-page-heading">
							<div><h1>Meus pedidos</h1><p>Acompanhe seus pedidos e consulte os detalhes de cada compra.</p></div>
							<span className="cart-count">{pedidos.length} {pedidos.length === 1 ? 'pedido' : 'pedidos'}</span>
						</div>
						{carregando && <div className="card account-feedback">Carregando pedidos...</div>}
						{erro && <div className="card account-feedback account-feedback-error" role="alert">{erro}<button className="btn-secondary" onClick={carregar}>Tentar novamente</button></div>}
						{!carregando && !erro && pedidos.length === 0 && <div className="card account-feedback"><div className="account-empty-icon">▣</div><h2>Nenhum pedido encontrado</h2><p>Quando você fizer uma compra, ela aparecerá aqui.</p><Link to="/livros" className="btn-primary">Explorar livros</Link></div>}
						{!carregando && !erro && pedidos.length > 0 && <div className="orders-list">
							{pedidos.map((pedido) => {
								const itens = obterItensPedido(pedido)
								const status = String(pedido.status || '').toUpperCase()
								return <article key={pedido.id} className="card order-card">
									<div className="order-card-main">
										<div>
											<div className="order-card-title"><strong>Pedido #{pedido.id}</strong><span className="badge badge-purple">{textoStatus(pedido.status)}</span></div>
											<p>{pedido.cliente?.nome || pedido.clienteNome || 'Cliente não informado'}{dataPedido(pedido) ? ` · ${dataPedido(pedido)}` : ''} · {quantidadeItens(pedido)} {quantidadeItens(pedido) === 1 ? 'item' : 'itens'}</p>
											{itens.length > 0 && <ul className="order-card-items" aria-label="Livros do pedido">{itens.map((item, index) => <li key={item.id || item.livroId || index}>{obterNomeLivro(item)}{Number(item.quantidade || 0) > 1 ? ` × ${item.quantidade}` : ''}</li>)}</ul>}
										</div>
										<strong className="order-card-total">R$ {Number(pedido.total ?? pedido.valorTotal ?? 0).toFixed(2).replace('.', ',')}</strong>
									</div>
									<div className="order-card-actions"><Link className="btn-secondary" to={`/meus-pedidos/${pedido.id}`}>Ver detalhes</Link>{cancelaveis.includes(status) && <button className="btn-danger" onClick={() => cancelar(pedido.id)}>Cancelar</button>}</div>
								</article>
							})}
						</div>}
					</section>
				</div>
			</main>
			<Footer />
		</div>
	)
}
