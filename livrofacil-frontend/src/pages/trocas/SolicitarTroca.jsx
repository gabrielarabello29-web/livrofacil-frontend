import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import ClienteSidebar from '../../components/ClienteSidebar'

export default function SolicitarTroca() {
  const navigate = useNavigate()
  const [pedido, setPedido] = useState('')
  const [produto, setProduto] = useState('')
  const [motivo, setMotivo] = useState('')
  const [detalhes, setDetalhes] = useState('')

  function enviarSolicitacao(event) {
    event.preventDefault()
    navigate('/trocas')
  }

  return (
    <div>
      <Header />
      <main className="page-container" style={{ paddingTop: 40, paddingBottom: 80 }}>
        <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
          <ClienteSidebar />
          <div style={{ flex: 1, maxWidth: 720 }}>
            <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800 }}>Solicitar troca ou devolução</h1>
            <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--text-muted)' }}>Informe os dados do pedido e o motivo da solicitação.</p>

            <form className="card" onSubmit={enviarSolicitacao} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 600 }}>
                Pedido
                <input required value={pedido} onChange={event => setPedido(event.target.value)} placeholder="Ex.: 1001" />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 600 }}>
                Produto
                <input required value={produto} onChange={event => setProduto(event.target.value)} placeholder="Nome do livro" />
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
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                <Link to="/trocas" className="btn-secondary">Cancelar</Link>
                <button type="submit" className="btn-primary">Enviar solicitação</button>
              </div>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
