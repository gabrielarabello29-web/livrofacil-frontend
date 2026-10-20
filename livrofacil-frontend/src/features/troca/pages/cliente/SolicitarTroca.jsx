import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Header from '@/shared/components/Header'
import Footer from '@/shared/components/Footer'
import ClienteSidebar from '@/shared/layouts/cliente/ClienteSidebar'
import { obterClienteId, useAuth } from '@/features/auth/context/AuthContext'
import { listarMeusPedidos } from '@/features/checkout/api/checkoutApi'
import { trocaService } from '@/features/troca/api/trocaService'
import { enriquecerItensComLivros, obterItensPedido } from '@/features/pedidos/utils/pedidoUtils'
import { prazoTroca, quantidadeDisponivelTroca } from '@/features/troca/utils/trocaUtils'

function obterLista(resposta) {
  if (Array.isArray(resposta)) return resposta
  if (Array.isArray(resposta?.data)) return resposta.data
  if (Array.isArray(resposta?.pedidos)) return resposta.pedidos
  return []
}

export default function SolicitarTroca() {
  const { usuario } = useAuth()
  const clienteId = obterClienteId(usuario)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [pedidos, setPedidos] = useState([])
  const [solicitacoes, setSolicitacoes] = useState([])
  const [pedidoId, setPedidoId] = useState('')
  const [produto, setProduto] = useState('')
  const [tipo, setTipo] = useState('TROCA')
  const [quantidade, setQuantidade] = useState('1')
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
    Promise.all([
      listarMeusPedidos(clienteId),
      trocaService.listarTrocasCliente(clienteId),
    ])
      .then(async ([resposta, respostaTrocas]) => {
        const lista = obterLista(resposta)
        const elegiveis = lista.filter((item) => prazoTroca(item).elegivel)
        const pedidosComLivros = await Promise.all(elegiveis.map(async (pedido) => ({
          ...pedido,
          itens: await enriquecerItensComLivros(obterItensPedido(pedido)),
        })))
        if (ativo) {
          setPedidos(pedidosComLivros)
          setSolicitacoes(obterLista(respostaTrocas))
          const queryPedidoId = searchParams.get('pedidoId')
          if (queryPedidoId && pedidosComLivros.some((pedido) => String(pedido.id) === queryPedidoId)) {
            setPedidoId(queryPedidoId)
          }
        }
      })
      .catch((error) => {
        if (ativo) setErro(error?.mensagem || error?.message || 'Não foi possível carregar os pedidos concluídos.')
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })
    return () => { ativo = false }
  }, [clienteId, searchParams])

  const pedidoSelecionado = pedidos.find((item) => String(item.id) === String(pedidoId))
  const itens = obterItensPedido(pedidoSelecionado)
  const itemSelecionado = useMemo(() => itens.find((item, index) => {
    const referencia = referenciaProduto(item)
    return referencia === produto || (!referencia && String(index) === produto)
  }), [itens, produto])
  const quantidadeMaxima = itemSelecionado ? quantidadeDisponivelTroca(itemSelecionado, solicitacoes) : 0
  const quantidadeValida = Number.isInteger(Number(quantidade)) && Number(quantidade) >= 1 && Number(quantidade) <= quantidadeMaxima

  function referenciaProduto(item) {
    const itemPedidoId = item.itemPedidoId
    if (itemPedidoId !== null && itemPedidoId !== undefined) return `itemPedidoId:${itemPedidoId}`
    const livroId = item.livroId ?? item.livro?.id
    return livroId !== null && livroId !== undefined ? `livroId:${livroId}` : ''
  }

  async function enviarSolicitacao(event) {
    event.preventDefault()
    const quantidadeNumero = Number(quantidade)
    if (!clienteId || !pedidoSelecionado || !itemSelecionado || !motivo || !['TROCA', 'DEVOLUCAO'].includes(tipo)) {
      setErro('Selecione um pedido elegível, um item, o tipo da solicitação e o motivo.')
      return
    }
    if (!Number.isInteger(quantidadeNumero) || quantidadeNumero < 1 || quantidadeNumero > quantidadeMaxima) {
      setErro(`Informe uma quantidade inteira entre 1 e ${quantidadeMaxima}.`)
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
        tipo,
        quantidade: quantidadeNumero,
        motivo,
        ...(detalhes.trim() ? { detalhes: detalhes.trim() } : {}),
      })
      navigate('/trocas')
    } catch (error) {
      setErro(error?.mensagem || error?.message || 'Não foi possível enviar a solicitação de troca.')
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
            <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--text-muted)' }}>Solicitações podem ser feitas até o fim do sétimo dia corrido após a entrega, no fuso de São Paulo. A API confirma a elegibilidade.</p>

            <form className="card" onSubmit={enviarSolicitacao} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 600 }}>
                Pedido
                <select required data-testid="troca-pedido" value={pedidoId} onChange={(event) => { setPedidoId(event.target.value); setProduto(''); setQuantidade('1') }} disabled={carregando || pedidos.length === 0}>
                  <option value="">{carregando ? 'Carregando pedidos...' : 'Selecione um pedido entregue elegível'}</option>
                  {pedidos.map((item) => <option key={item.id} value={item.id}>Pedido #{item.id} · Entregue em {String(item.entregueEm).slice(0, 10).split('-').reverse().join('/')}</option>)}
                </select>
                {!carregando && !erro && pedidos.length === 0 && <small role="status">Nenhum pedido com entrega registrada dentro do prazo. Pedidos antigos sem data de entrega são inelegíveis; procure o suporte.</small>}
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 600 }}>
                Produto
                <select required data-testid="troca-item" value={produto} onChange={(event) => { setProduto(event.target.value); setQuantidade('1') }} disabled={!pedidoSelecionado || itens.length === 0}>
                  <option value="">Selecione um item do pedido</option>
                  {itens.map((item, index) => {
                    const referencia = referenciaProduto(item)
                    const disponivel = quantidadeDisponivelTroca(item, solicitacoes)
                    return <option key={referencia || index} value={referencia} disabled={!disponivel || !referencia}>{item.titulo || item.livro?.titulo || 'Título não informado'} · disponível {disponivel}</option>
                  })}
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 600 }}>
                Tipo
                <select data-testid="troca-tipo" required value={tipo} onChange={(event) => setTipo(event.target.value)}>
                  <option value="TROCA">Troca</option>
                  <option value="DEVOLUCAO">Devolução</option>
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 600 }}>
                Quantidade
                <input data-testid="troca-quantidade" required type="number" min="1" max={quantidadeMaxima || undefined} step="1" value={quantidade} onChange={(event) => setQuantidade(event.target.value)} disabled={!itemSelecionado || quantidadeMaxima < 1} />
                {itemSelecionado && <small>Disponível para solicitar: {quantidadeMaxima}</small>}
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 600 }}>
                Motivo
                <select required data-testid="troca-motivo" value={motivo} onChange={event => setMotivo(event.target.value)}>
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
                <button type="submit" data-testid="enviar-solicitacao-troca" className="btn-primary" disabled={enviando || carregando || pedidos.length === 0 || !quantidadeValida}>{enviando ? 'Enviando...' : 'Enviar solicitação'}</button>
              </div>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
