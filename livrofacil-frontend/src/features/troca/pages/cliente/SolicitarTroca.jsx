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
      <main className="page-container troca-request-page">
        <div className="troca-request-layout">
          <ClienteSidebar />
          <section className="troca-request-content">
            <header className="troca-request-heading">
              <span className="troca-request-icon" aria-hidden="true">↺</span>
              <div>
                <p className="troca-request-eyebrow">ATENDIMENTO AO CLIENTE</p>
                <h1>Solicitar troca ou devolução</h1>
                <p>Preencha os dados abaixo para iniciar sua solicitação.</p>
              </div>
            </header>

            <div className="troca-request-notice">
              <span aria-hidden="true">ⓘ</span>
              <p>Você pode solicitar até 7 dias corridos após a entrega. A elegibilidade do pedido será confirmada no envio.</p>
            </div>

            <form className="card troca-request-form" onSubmit={enviarSolicitacao}>
              <div className="troca-form-section">
                <div className="troca-form-section-heading">
                  <span>1</span>
                  <div><h2>Identifique seu pedido</h2><p>Escolha o pedido e o produto que deseja solicitar.</p></div>
                </div>
                <div className="troca-form-grid">
                  <label className="troca-field">
                    <span>Pedido <i>*</i></span>
                    <select className="troca-control" required data-testid="troca-pedido" value={pedidoId} onChange={(event) => { setPedidoId(event.target.value); setProduto(''); setQuantidade('1') }} disabled={carregando || pedidos.length === 0}>
                      <option value="">{carregando ? 'Carregando pedidos...' : 'Selecione um pedido'}</option>
                      {pedidos.map((item) => <option key={item.id} value={item.id}>Pedido #{item.id} · Entregue em {String(item.entregueEm).slice(0, 10).split('-').reverse().join('/')}</option>)}
                    </select>
                    {!carregando && !erro && pedidos.length === 0 && <small role="status">Nenhum pedido com entrega registrada dentro do prazo. Pedidos antigos sem data de entrega são inelegíveis; procure o suporte.</small>}
                  </label>
                  <label className="troca-field">
                    <span>Produto <i>*</i></span>
                    <select className="troca-control" required data-testid="troca-item" value={produto} onChange={(event) => { setProduto(event.target.value); setQuantidade('1') }} disabled={!pedidoSelecionado || itens.length === 0}>
                      <option value="">Selecione um item do pedido</option>
                      {itens.map((item, index) => {
                        const referencia = referenciaProduto(item)
                        const disponivel = quantidadeDisponivelTroca(item, solicitacoes)
                        return <option key={referencia || index} value={referencia} disabled={!disponivel || !referencia}>{item.titulo || item.livro?.titulo || 'Título não informado'} · disponível {disponivel}</option>
                      })}
                    </select>
                  </label>
                </div>
              </div>

              <div className="troca-form-section">
                <div className="troca-form-section-heading">
                  <span>2</span>
                  <div><h2>Sobre a solicitação</h2><p>Conte para nós como podemos ajudar.</p></div>
                </div>
                <div className="troca-form-grid">
                  <label className="troca-field">
                    <span>Tipo de solicitação <i>*</i></span>
                    <select className="troca-control" data-testid="troca-tipo" required value={tipo} onChange={(event) => setTipo(event.target.value)}>
                      <option value="TROCA">Troca</option>
                      <option value="DEVOLUCAO">Devolução</option>
                    </select>
                  </label>
                  <label className="troca-field">
                    <span>Quantidade <i>*</i></span>
                    <input className="troca-control" data-testid="troca-quantidade" required type="number" min="1" max={quantidadeMaxima || undefined} step="1" value={quantidade} onChange={(event) => setQuantidade(event.target.value)} disabled={!itemSelecionado || quantidadeMaxima < 1} />
                    {itemSelecionado && <small>Disponível para solicitar: {quantidadeMaxima}</small>}
                  </label>
                  <label className="troca-field troca-field-full">
                    <span>Motivo <i>*</i></span>
                    <select className="troca-control" required data-testid="troca-motivo" value={motivo} onChange={event => setMotivo(event.target.value)}>
                      <option value="">Selecione um motivo</option>
                      <option>Produto danificado</option>
                      <option>Produto incorreto</option>
                      <option>Arrependimento</option>
                      <option>Outro</option>
                    </select>
                  </label>
                  <label className="troca-field troca-field-full">
                    <span>Detalhes adicionais <small>(opcional)</small></span>
                    <textarea className="troca-control troca-details" value={detalhes} onChange={event => setDetalhes(event.target.value)} rows="4" placeholder="Descreva o que aconteceu para nos ajudar a resolver mais rápido" />
                  </label>
                </div>
              </div>
              {erro && <div role="alert" className="checkout-error">{erro}</div>}
              <div className="troca-form-actions">
                <Link to="/trocas" className="btn-secondary">Cancelar</Link>
                <button type="submit" data-testid="enviar-solicitacao-troca" className="btn-primary" disabled={enviando || carregando || pedidos.length === 0 || !quantidadeValida}>{enviando ? 'Enviando...' : 'Enviar solicitação'}</button>
              </div>
            </form>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
