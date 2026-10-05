import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '@/shared/components/Header'
import Footer from '@/shared/components/Footer'
import ClienteSidebar from '@/shared/layouts/cliente/ClienteSidebar'
import { obterClienteId, useAuth } from '@/features/auth/context/AuthContext'
import { trocaService } from '@/features/troca/api/trocaService'

const statusCores = { SOLICITADA: 'badge-yellow', AUTORIZADA: 'badge-blue', TROCADA: 'badge-green', RECUSADA: 'badge-red' }
const statusNomes = { SOLICITADA: 'Solicitada', AUTORIZADA: 'Autorizada', TROCADA: 'Trocada', RECUSADA: 'Recusada' }

export default function MinhasTrocas() {
  const { usuario } = useAuth()
  const clienteId = obterClienteId(usuario)
  const [trocas, setTrocas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  async function carregar() {
    if (!clienteId) {
      setErro('Não foi possível identificar o cliente pelo UUID.')
      setCarregando(false)
      return
    }
    setCarregando(true)
    setErro('')
    try {
      const resposta = await trocaService.listarTrocasCliente(clienteId)
      const lista = Array.isArray(resposta) ? resposta : Array.isArray(resposta?.data) ? resposta.data : []
      setTrocas(lista)
    } catch (error) {
      setErro(error?.mensagem || 'Não foi possível carregar suas trocas.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregar() }, [clienteId])

  return (
    <div>
      <Header />
      <main className="page-container" style={{ paddingTop: 40, paddingBottom: 80 }}>
        <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
          <ClienteSidebar />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
              <div>
                <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800 }}>Trocas e Devoluções</h1>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>Acompanhe suas solicitações</p>
              </div>
              <Link to="/trocas/nova" className="btn-primary">Solicitar troca</Link>
            </div>

            {carregando && <div className="card" style={{ padding: 24 }}>Carregando solicitações...</div>}
            {erro && <div className="card account-feedback account-feedback-error" role="alert">{erro}<button className="btn-secondary" onClick={carregar}>Tentar novamente</button></div>}
            {!carregando && !erro && trocas.length === 0 ? (
              <div className="card" style={{ padding: 60, textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>↔</div>
                <p style={{ margin: '0 0 20px', fontSize: 16, color: 'var(--text-muted)' }}>Você ainda não possui solicitações de troca.</p>
                <Link to="/trocas/nova" className="btn-primary">Solicitar troca</Link>
              </div>
            ) : !carregando && !erro ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {trocas.map((troca) => {
                  const status = String(troca.status || '').toUpperCase()
                  const data = troca.criadaEm || troca.dataSolicitacao
                  const tituloLivro = troca.livro?.titulo || troca.livroTitulo || troca.produto || (troca.livroId ? `Livro ${troca.livroId}` : 'Item do pedido')
                  return (
                  <div key={troca.id} className="card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 14 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: 15 }}>{troca.id}</span>
                          <span className={`badge ${statusCores[status] || 'badge-gray'}`}>{statusNomes[status] || troca.status || 'Não informado'}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>Pedido #{troca.pedidoId || troca.pedido?.id || '—'}{data ? ` · Solicitada em ${new Date(data).toLocaleDateString('pt-BR')}` : ''}</p>
                      </div>
                    </div>
                    <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 12, fontSize: 13 }}>
                      <strong>{tituloLivro}</strong>
                      {troca.motivo && <span style={{ color: 'var(--text-muted)' }}> · {troca.motivo}</span>}
                    </div>
                    {troca.detalhes && <p>{troca.detalhes}</p>}
                    {troca.voucherCodigo && <div role="status" data-testid="voucher-troca" style={{ marginTop: 16, padding: 14, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8 }}><strong>Voucher de troca</strong><div>Código: <code>{troca.voucherCodigo}</code></div><div>Valor atual: R$ {Number(troca.voucherValor || 0).toFixed(2).replace('.', ',')}</div></div>}
                  </div>
                  )
                })}
              </div>
            ) : null}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
