import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Header from '@/shared/components/Header'
import Footer from '@/shared/components/Footer'
import ClienteSidebar from '@/shared/layouts/cliente/ClienteSidebar'
import { obterClienteId, useAuth } from '@/features/auth/context/AuthContext'
import { trocaService } from '@/features/troca/api/trocaService'
import { formatarDataTroca, formatarDinheiroTroca } from '@/features/troca/utils/trocaUtils'

function normalizarLista(resposta) {
  return Array.isArray(resposta) ? resposta : Array.isArray(resposta?.data) ? resposta.data : []
}

export default function MeusCupons() {
  const { voucherId } = useParams()
  const { usuario } = useAuth()
  const clienteId = obterClienteId(usuario)
  const [vouchers, setVouchers] = useState([])
  const [voucher, setVoucher] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [copiado, setCopiado] = useState('')

  async function carregar() {
    if (!clienteId) {
      setErro('Não foi possível identificar o cliente pelo UUID.')
      setCarregando(false)
      return
    }
    setCarregando(true)
    setErro('')
    try {
      if (voucherId) {
        const resposta = await trocaService.buscarVoucherCliente(clienteId, voucherId)
        setVoucher(resposta?.data || resposta)
      } else {
        const resposta = await trocaService.listarVouchersCliente(clienteId)
        setVouchers(normalizarLista(resposta))
      }
    } catch (error) {
      setErro(error?.message || 'Não foi possível carregar os vouchers de troca.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregar() }, [clienteId, voucherId])

  async function copiar(codigo) {
    try {
      await navigator.clipboard.writeText(codigo)
      setCopiado(codigo)
    } catch {
      setErro('Não foi possível copiar automaticamente. Selecione e copie o código manualmente.')
    }
  }

  function detalhes(dado) {
    return (
      <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        <div><dt>Saldo atual</dt><dd>{formatarDinheiroTroca(dado.valor ?? dado.saldo)}</dd></div>
        <div><dt>Valor original</dt><dd>{formatarDinheiroTroca(dado.valorOriginal)}</dd></div>
        <div><dt>Status</dt><dd>{dado.status || '—'}</dd></div>
        <div><dt>Origem da troca</dt><dd>{dado.trocaId ?? '—'}</dd></div>
        <div><dt>Voucher de origem</dt><dd>{dado.voucherOrigemId ?? '—'}</dd></div>
        <div><dt>Emitido em</dt><dd>{formatarDataTroca(dado.criadoEm)}</dd></div>
        <div><dt>Resgatado em</dt><dd>{formatarDataTroca(dado.resgatadoEm)}</dd></div>
        <div><dt>Pedido de resgate</dt><dd>{dado.pedidoResgateId ?? '—'}</dd></div>
      </dl>
    )
  }

  return (
    <div>
      <Header />
      <main className="page-container" style={{ paddingTop: 40, paddingBottom: 80 }}>
        <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
          <ClienteSidebar />
          <section style={{ flex: 1 }}>
            {voucherId && <Link to="/meus-cupons" className="account-back-link">← Meus cupons</Link>}
            <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800 }}>{voucherId ? `Voucher ${voucher?.codigo || voucherId}` : 'Meus cupons de troca'}</h1>
            <p style={{ margin: '0 0 22px', color: 'var(--text-muted)' }}>Vouchers emitidos após a conclusão do recebimento.</p>
            {carregando && <div className="card" style={{ padding: 24 }}>Carregando vouchers...</div>}
            {erro && <div className="card account-feedback account-feedback-error" role="alert">{erro}<button className="btn-secondary" onClick={carregar}>Tentar novamente</button></div>}
            {!carregando && !erro && voucher && (
              <article className="card" style={{ padding: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <strong data-testid="voucher-codigo">{voucher.codigo}</strong>
                  <button className="btn-secondary" onClick={() => copiar(voucher.codigo)}>Copiar código</button>
                  {copiado === voucher.codigo && <span role="status">Código copiado</span>}
                </div>
                {detalhes(voucher)}
              </article>
            )}
            {!carregando && !erro && !voucherId && vouchers.length === 0 && <div className="card" style={{ padding: 24 }}>Você ainda não possui vouchers de troca.</div>}
            {!carregando && !erro && !voucherId && vouchers.length > 0 && (
              <div style={{ display: 'grid', gap: 14 }}>
                {vouchers.map((item) => (
                  <article className="card" key={item.id || item.codigo} data-testid="voucher-cliente" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div><strong>{item.codigo}</strong><span className={`badge ${item.status === 'DISPONIVEL' ? 'badge-green' : 'badge-gray'}`} style={{ marginLeft: 10 }}>{item.status}</span></div>
                      <button className="btn-secondary" onClick={() => copiar(item.codigo)}>Copiar código</button>
                    </div>
                    {copiado === item.codigo && <p role="status">Código copiado</p>}
                    {detalhes(item)}
                    <Link to={`/meus-cupons/${item.id}`} className="btn-ghost">Ver detalhes</Link>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
