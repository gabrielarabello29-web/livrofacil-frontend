import { useEffect, useState } from 'react'
import AdminSidebar from '@/shared/layouts/admin/AdminSidebar'
import Modal from '@/shared/components/Modal'
import { trocaService } from '@/features/troca/api/trocaService'

const statusCores = { SOLICITADA: 'badge-yellow', AUTORIZADA: 'badge-blue', TROCADA: 'badge-green', RECUSADA: 'badge-red' }
const statusNomes = { SOLICITADA: 'Solicitada', AUTORIZADA: 'Autorizada', TROCADA: 'Trocada', RECUSADA: 'Recusada' }

export default function AdminTrocas() {
  const [trocas, setTrocas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [processandoId, setProcessandoId] = useState(null)
  const [confirmModal, setConfirmModal] = useState(null)
  const [retornarEstoque, setRetornarEstoque] = useState(true)

  async function carregar() {
    setCarregando(true)
    setErro('')
    try {
      const resposta = await trocaService.listarTrocas()
      setTrocas(Array.isArray(resposta) ? resposta : Array.isArray(resposta?.data) ? resposta.data : [])
    } catch (error) {
      setErro(error?.mensagem || 'Não foi possível carregar as trocas.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregar() }, [])

  async function autorizar(troca) {
    setProcessandoId(troca.id)
    setErro('')
    try {
      await trocaService.autorizarTroca(troca.id)
      await carregar()
    } catch (error) {
      setErro(error?.mensagem || 'Não foi possível autorizar a troca.')
    } finally {
      setProcessandoId(null)
    }
  }

  async function recusar(troca) {
    const motivo = window.prompt('Informe o motivo da recusa:')
    if (!motivo?.trim()) return
    setProcessandoId(troca.id)
    setErro('')
    try {
      await trocaService.recusarTroca(troca.id, motivo.trim())
      await carregar()
    } catch (error) {
      setErro(error?.mensagem || 'Não foi possível recusar a troca.')
    } finally {
      setProcessandoId(null)
    }
  }

  async function confirmarRecebimento() {
    const troca = confirmModal
    if (!troca) return
    setProcessandoId(troca.id)
    setErro('')
    try {
      await trocaService.receberTroca(troca.id, retornarEstoque)
      setConfirmModal(null)
      await carregar()
    } catch (error) {
      setErro(error?.mensagem || 'Não foi possível confirmar o recebimento.')
    } finally {
      setProcessandoId(null)
    }
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <div style={{ padding: '28px 32px' }}>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800 }}>Trocas e Devoluções</h1>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>{trocas.length} solicitações</p>
          </div>

          {erro && <div className="card" role="alert" style={{ padding: 14, marginBottom: 16, color: 'var(--danger)' }}>{erro}<button className="btn-secondary" onClick={carregar} style={{ marginLeft: 12 }}>Tentar novamente</button></div>}
          {carregando && <div className="card" style={{ padding: 24 }}>Carregando trocas...</div>}
          {!carregando && !erro && trocas.length === 0 && <div className="card" style={{ padding: 24 }}>Nenhuma solicitação de troca.</div>}

          {!carregando && trocas.length > 0 && (
          <div className="card" style={{ overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Produto</th>
                  <th>Data</th>
                  <th>Motivo</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {trocas.map((troca) => {
                  const status = String(troca.status || '').toUpperCase()
                  const cliente = troca.cliente?.nome || troca.clienteNome || troca.clienteId || '—'
                  const produto = troca.livro?.titulo || troca.livroTitulo || troca.produto || (troca.livroId ? `Livro ${troca.livroId}` : 'Item do pedido')
                  return (
                  <tr key={troca.id}>
                    <td style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 13 }}>{troca.id}</td>
                    <td style={{ fontWeight: 600 }}>#{troca.pedidoId || troca.pedido?.id || '—'}</td>
                    <td>{cliente}</td>
                    <td style={{ fontSize: 13 }}>{produto}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{troca.criadaEm || troca.dataSolicitacao ? new Date(troca.criadaEm || troca.dataSolicitacao).toLocaleDateString('pt-BR') : '—'}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 180 }}>{troca.motivo || '—'}</td>
                    <td>
                      <span className={`badge ${statusCores[status] || 'badge-gray'}`}>{statusNomes[status] || troca.status || 'Não informado'}</span>
                      {troca.voucherCodigo && <small data-testid={`voucher-troca-${troca.id}`} style={{ display: 'block', marginTop: 6 }}>Voucher {troca.voucherCodigo} · Saldo atual R$ {Number(troca.voucherValor || 0).toFixed(2).replace('.', ',')}</small>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {status === 'SOLICITADA' && (
                          <>
                            <button data-testid={`autorizar-troca-${troca.id}`} disabled={processandoId === troca.id} onClick={() => autorizar(troca)} className="btn-primary" style={{ padding: '4px 10px', fontSize: 12 }}>Autorizar</button>
                            <button data-testid={`recusar-troca-${troca.id}`} disabled={processandoId === troca.id} onClick={() => recusar(troca)} className="btn-danger" style={{ padding: '4px 10px', fontSize: 12 }}>Recusar</button>
                          </>
                        )}
                        {status === 'AUTORIZADA' && (
                          <button data-testid={`recebida-troca-${troca.id}`} disabled={processandoId === troca.id} onClick={() => setConfirmModal(troca)} className="btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }}>Recebido</button>
                        )}
                      </div>
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          )}
        </div>
      </div>

      <Modal isOpen={!!confirmModal} onClose={() => setConfirmModal(null)} title="Confirmar recebimento">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ margin: 0, fontSize: 15, color: 'var(--text)' }}>Confirme o recebimento do produto devolvido.</p>
          <div style={{ padding: 16, background: '#F9F8FF', borderRadius: 10 }}>
            <p style={{ margin: '0 0 10px', fontWeight: 600, fontSize: 14 }}>Retornar produto ao estoque?</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14 }}>
                <input type="radio" name="estoque" checked={retornarEstoque} onChange={() => setRetornarEstoque(true)} style={{ accentColor: 'var(--primary)' }} /> Sim
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14 }}>
                <input type="radio" name="estoque" checked={!retornarEstoque} onChange={() => setRetornarEstoque(false)} style={{ accentColor: 'var(--primary)' }} /> Não (produto com defeito)
              </label>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setConfirmModal(null)} className="btn-secondary" style={{ flex: 1 }}>Cancelar</button>
            <button data-testid="confirmar-recebimento-troca" disabled={processandoId === confirmModal?.id} onClick={confirmarRecebimento} className="btn-primary" style={{ flex: 1 }}>{processandoId === confirmModal?.id ? 'Confirmando...' : 'Confirmar recebimento'}</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
