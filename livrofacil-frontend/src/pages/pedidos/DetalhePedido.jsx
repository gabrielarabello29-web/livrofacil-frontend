import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { pedidoService } from '../../services/pedidoService'
import { useAuth } from '../../context/AuthContext'

export default function DetalhePedido() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const [pedido, setPedido] = useState(null)
  const [loading, setLoading] = useState(true)
  const [motivoCancelamento, setMotivoCancelamento] = useState('')
  const [motivoTroca, setMotivoTroca] = useState('')
  const [rastreamento, setRastreamento] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const res = await pedidoService.buscarPedido(id)
        setPedido(res.data || res)
      } catch (err) {
        console.error(err)
        alert('Erro ao carregar pedido')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) return <div><Header /><main className="page-container" style={{ paddingTop: 40 }}>Carregando...</main></div>
  if (!pedido) return <div><Header /><main className="page-container" style={{ paddingTop: 40 }}>Pedido não encontrado</main></div>

  async function handleConfirmarRecebimento() {
    if (!confirm('Confirmar recebimento do pedido?')) return
    try {
      await pedidoService.confirmarRecebimento(pedido.id)
      alert('Recebimento confirmado')
      setPedido(p => ({ ...p, status: 'Entregue' }))
    } catch (err) {
      console.error(err)
      alert('Erro ao confirmar recebimento')
    }
  }

  async function handleCancelarPedido() {
    if (!motivoCancelamento.trim()) {
      alert('Informe o motivo do cancelamento')
      return
    }
    if (!confirm('Deseja realmente cancelar o pedido?')) return
    try {
      await pedidoService.cancelarPedido(pedido.id, motivoCancelamento)
      alert('Pedido cancelado')
      setPedido(p => ({ ...p, status: 'Cancelado' }))
    } catch (err) {
      console.error(err)
      alert('Erro ao cancelar pedido')
    }
  }

  async function handleSolicitarTroca(itemId) {
    if (!motivoTroca.trim()) {
      alert('Informe o motivo da troca')
      return
    }
    try {
      await pedidoService.solicitarTrocaItem(pedido.id, itemId, { motivo: motivoTroca })
      alert('Solicitação de troca enviada')
      // atualizar UI localmente (marcar item como solicitação)
      setPedido(p => ({
        ...p,
        itens: p.itens.map(i => i.id === itemId ? { ...i, statusItem: 'Troca solicitada' } : i)
      }))
      setMotivoTroca('')
    } catch (err) {
      console.error(err)
      alert('Erro ao solicitar troca')
    }
  }

  async function handleInformarDespacho(itemId) {
    if (!confirm('Informar despacho deste item?')) return
    try {
      await pedidoService.informarDespachoItem(pedido.id, itemId, { rastreamento })
      alert('Despacho informado')
      setPedido(p => ({
        ...p,
        itens: p.itens.map(i => i.id === itemId ? { ...i, statusItem: 'Item enviado' } : i)
      }))
      setRastreamento('')
    } catch (err) {
      console.error(err)
      alert('Erro ao informar despacho')
    }
  }

  return (
    <div>
      <Header />
      <main className="page-container" style={{ paddingTop: 40, paddingBottom: 80 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22 }}>{`Pedido ${pedido.id}`}</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)' }}>Status: <strong>{pedido.status}</strong></p>
          </div>
          <div>
            <button className="btn-ghost" onClick={() => navigate(-1)}>← Voltar</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
          <div>
            <div className="card" style={{ padding: 20, marginBottom: 16 }}>
              <h3 style={{ marginTop: 0 }}>Itens</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {pedido.itens.map(i => (
                  <div key={i.id} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <img src={i.capa} alt={i.titulo} style={{ width: 56, height: 76, objectFit: 'cover', borderRadius: 6 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: 700 }}>{i.titulo}</p>
                      <p style={{ margin: 4, color: 'var(--text-muted)' }}>Qtd: {i.quantidade}</p>
                      <p style={{ margin: 0, color: 'var(--text-muted)' }}>Status do item: {i.statusItem || '—'}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {/* Client actions */}
                      <button className="btn-ghost" onClick={() => {
                        const confirmed = confirm(`Deseja solicitar troca do item "${i.titulo}"?`)
                        if (confirmed) {
                          const motivo = prompt('Motivo da troca:')
                          if (motivo) handleSolicitarTroca(i.id)
                        }
                      }}>Solicitar troca</button>

                      {/* Admin / fulfillment action: informar despacho */}
                      {usuario?.role === 'admin' && (
                        <>
                          <input placeholder="Rastreamento" value={rastreamento} onChange={e => setRastreamento(e.target.value)} style={{ padding: 8, width: 180 }} />
                          <button className="btn-secondary" onClick={() => handleInformarDespacho(i.id)}>Informar despacho</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{ padding: 20 }}>
              <h3>Pagamento e entrega</h3>
              <p style={{ margin: 8 }}>{pedido.endereco?.identificacao} — {pedido.endereco?.logradouro}, {pedido.endereco?.numero}</p>
              <p style={{ margin: 8 }}>Forma pagamento: {pedido.pagamento || '—'}</p>
            </div>

          </div>

          <aside>
            <div className="card" style={{ padding: 20, marginBottom: 12 }}>
              <h3 style={{ marginTop: 0 }}>Resumo</h3>
              <p style={{ margin: '8px 0' }}>Total: <strong>R$ {pedido.total?.toFixed(2)?.replace('.', ',') || '0,00'}</strong></p>

              {/* Cliente actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pedido.status !== 'Entregue' && pedido.status !== 'Cancelado' && (
                  <button className="btn-primary" onClick={handleConfirmarRecebimento}>Confirmar recebimento</button>
                )}

                {pedido.status !== 'Cancelado' && (
                  <>
                    <input placeholder="Motivo do cancelamento" value={motivoCancelamento} onChange={e => setMotivoCancelamento(e.target.value)} className="input-field" />
                    <button className="btn-ghost" onClick={handleCancelarPedido}>Cancelar pedido</button>
                  </>
                )}
              </div>
            </div>

            <div className="card" style={{ padding: 20 }}>
              <h3>Cupons</h3>
              <p style={{ margin: 8, color: 'var(--text-muted)' }}>Cupons aplicados no pedido:</p>
              <ul>
                {(pedido.cupons || []).map(c => <li key={c}>{c}</li>)}
              </ul>

              <h4 style={{ marginTop: 12 }}>Consultar cupons disponíveis</h4>
              <button className="btn-secondary" onClick={() => navigate('/admin/cupons')}>Ir para cupons</button>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  )
}