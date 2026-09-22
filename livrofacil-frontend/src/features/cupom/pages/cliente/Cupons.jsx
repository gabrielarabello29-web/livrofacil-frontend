import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import ClienteSidebar from '../../components/ClienteSidebar'
import { cupomService } from '../../services/cupomService'
import { useAuth } from '../../context/AuthContext'

export default function Cupons() {
  const [cupons, setCupons] = useState([])
  const [carregando, setCarregando] = useState(true)
  const navigate = useNavigate()
  const { usuario } = useAuth()

  useEffect(() => {
    async function load() {
      setCarregando(true)
      try {
        // caso a API suporte filtrar por usuario, envie usuario.id
        const res = await cupomService.listarCupons({ usuarioId: usuario?.id })
        setCupons(res.data || res || [])
      } catch (err) {
        console.error(err)
        setCupons([])
      } finally {
        setCarregando(false)
      }
    }
    load()
  }, [usuario])

  function aplicarNoCarrinho(codigo) {
    // navega para /carrinho com state para auto-aplicar
    navigate('/carrinho', { state: { cupom: codigo } })
  }

  return (
    <div>
      <Header />
      <main className="page-container" style={{ paddingTop: 40, paddingBottom: 80 }}>
        <div style={{ display: 'flex', gap: 32 }}>
          <ClienteSidebar />
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: '0 0 12px', fontSize: 22 }}>Meus cupons</h1>
            <p style={{ margin: '0 0 20px', color: 'var(--text-muted)' }}>Confira os cupons disponíveis e aplique no seu carrinho.</p>

            <div className="card" style={{ padding: 16 }}>
              {carregando ? (
                <p>Carregando...</p>
              ) : cupons.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>Nenhum cupom disponível.</p>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {cupons.map(c => (
                    <div key={c.codigo} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 8, border: '1px solid #F3F4F6' }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{c.codigo} {c.tipo === 'percentual' ? `- ${c.valor}%` : `- R$ ${Number(c.valor).toFixed(2)}`}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{c.descricao || `Válido até ${c.validade || '—'}`}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn-secondary" onClick={() => aplicarNoCarrinho(c.codigo)}>Aplicar no carrinho</button>
                        <button className="btn-ghost" onClick={() => navigator.clipboard?.writeText(c.codigo)}>Copiar</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}