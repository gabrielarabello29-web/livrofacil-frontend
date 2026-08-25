import { useState } from 'react'
import { vendaService } from '../services/vendaService'

const TRANSITIONS = {
  'Em aberto': ['Em processamento'],
  'Em processamento': ['Pagamento realizado'],
  'Pagamento realizado': ['Em trânsito'],
  'Em trânsito': ['Entregue'],
  'Troca solicitada': ['Troca aceita', 'Troca negada'],
  'Item enviado': ['Item recebido'],
  'Item recebido': ['Troca processada'],
}

export default function StatusActions({ statusAtual, vendaId, onAtualizado }) {
  const [loading, setLoading] = useState(false)
  const opcoes = TRANSITIONS[statusAtual] || []

  async function mudarStatus(novo) {
    if (!confirm(`Alterar status para "${novo}"?`)) return
    setLoading(true)
    try {
      const safeId = String(vendaId).replace(/^#/, '')
      await vendaService.atualizarStatusVenda(encodeURIComponent(safeId), novo)
      onAtualizado && onAtualizado(novo)
    } catch (err) {
      console.error(err)
      alert('Erro ao atualizar status')
    } finally {
      setLoading(false)
    }
  }

  if (opcoes.length === 0) return null

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {opcoes.map(o => <button key={o} className="btn-ghost" disabled={loading} onClick={() => mudarStatus(o)}>{o}</button>)}
    </div>
  )
}
