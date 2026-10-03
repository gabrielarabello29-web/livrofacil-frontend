import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from '@/shared/components/Header'
import Footer from '@/shared/components/Footer'
import ClienteSidebar from '@/shared/layouts/cliente/ClienteSidebar'
import { obterClienteId, useAuth } from '@/features/auth/context/AuthContext'
import { listarMeusPedidos } from '@/features/checkout/api/checkoutApi'
import { trocaService } from '@/features/troca/api/trocaService'

export default function SolicitarTroca() {
  const { usuario } = useAuth()
  const clienteId = obterClienteId(usuario)
  const navigate = useNavigate()
  const [pedidos, setPedidos] = useState([])
  const [pedidoId, setPedidoId] = useState('')
  const [produto, setProduto] = useState('')
  const [motivo, setMotivo] = useState('')
  const [detalhes, setDetalhes] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!clienteId) {
      setErro('Não foi possível identificar o cliente pelo UUID.')
      setCarregando(false)
      return
    }
    let ativo = true
    listarMeusPedidos(clienteId)
      .then((resposta) => {
        const lista = Array.isArray(resposta) ? resposta : resposta?.data || []
        if (ativo) setPedidos(lista.filter((item) => String(item.status).toUpperCase() === 'ENTREGUE'))
      })
      .catch((error) => {
        if (ativo) setErro(error?.mensagem || 'Não foi possível carregar os pedidos entregues.')
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })
    return () => { ativo = false }
  }, [clienteId])

  const pedidoSelecionado = pedidos.find((item) => String(item.id) === String(pedidoId))
  const itens = Array.isArray(pedidoSelecionado?.itens) ? pedidoSelecionado.itens : []

  function referenciaProduto(item) {
    const itemPedidoId = item.itemPedidoId
    if (itemPedidoId !== null && itemPedidoId !== undefined) return `itemPedidoId:${itemPedidoId}`
    const livroId = item.livroId ?? item.livro?.id
    return livroId !== null && livroId !== undefined ? `livroId:${livroId}` : ''
  }

  async function enviarSolicitacao(event) {
    event.preventDefault()
    if (!clienteId || !pedidoSelecionado || !produto || !motivo) {
      setErro('Selecione um pedido entregue, um livro e o motivo da troca.')
      return
    }
    const [campoProduto, idProduto] = produto.split(':')
    if (!['itemPedidoId', 'livroId'].includes(campoProduto) || !Number(idProduto)) {
      setErro('Não foi possível identificar o item do pedido.')
      return
    }
    setEnviando(true)
    setErro('')
    try {
      await trocaService.solicitarTroca({
        clienteId,
        pedidoId: Number(pedidoSelecionado.id),
        [campoProduto]: Number(idProduto),
        motivo,
        ...(detalhes.trim() ? { detalhes: detalhes.trim() } : {}),
      })
      navigate('/trocas')
    } catch (error) {
      setErro(error?.mensagem || 'Não foi possível enviar a solicitação de troca.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div>
      <Header />
      <main className="page-container" style={{ paddingTop: 40, paddingBottom: 80 }}>
        <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
          <ClienteSidebar />
          <div style={{ flex: 1, maxWidth: 720 }}>
            <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800 }}>Solicitar troca ou devolução</h1>
            <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--text-muted)' }}>Selecione um pedido entregue e informe o motivo da solicitação.</p>

            <form className="card" onSubmit={enviarSolicitacao} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 600 }}>
                Pedido
                <select required value={pedidoId} onChange={(event) => { setPedidoId(event.target.value); setProduto('') }} disabled={carregando || pedidos.length === 0}>
                  <option value="">{carregando ? 'Carregando pedidos...' : 'Selecione um pedido entregue'}</option>
                  {pedidos.map((item) => <option key={item.id} value={item.id}>Pedido #{item.id}</option>)}
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 600 }}>
                Produto
                <select required value={produto} onChange={(event) => setProduto(event.target.value)} disabled={!pedidoSelecionado || itens.length === 0}>
                  <option value="">Selecione um item do pedido</option>
                  {itens.map((item, index) => {
                    const referencia = referenciaProduto(item)
                    return <option key={referencia || index} value={referencia}>{item.titulo || item.livro?.titulo || `Livro ${item.livroId || ''}`} · qtd. {item.quantidade || 1}</option>
                  })}
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 600 }}>
                Motivo
                <select required value={motivo} onChange={event => setMotivo(event.target.value)}>
                  <option value="">Selecione um motivo</option>
                  <option>Produto danificado</option>
                  <option>Produto incorreto</option>
                  <option>Arrependimento</option>
                  <option>Outro</option>
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 600 }}>
                Detalhes adicionais
                <textarea value={detalhes} onChange={event => setDetalhes(event.target.value)} rows="4" placeholder="Descreva o que aconteceu" />
              </label>
              {erro && <div role="alert" className="checkout-error">{erro}</div>}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                <Link to="/trocas" className="btn-secondary">Cancelar</Link>
                <button type="submit" className="btn-primary" disabled={enviando || carregando || pedidos.length === 0}>{enviando ? 'Enviando...' : 'Enviar solicitação'}</button>
              </div>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
