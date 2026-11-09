import React from 'react'
import { useState } from 'react'
import { pedidoService } from '@/features/pedidos/api/pedidoService'
import { mapearStatusPedido } from '@/features/pedidos/utils/statusPedidoUtils'

const TRANSITIONS = {
  EM_PROCESSAMENTO: ['APROVADA', 'REPROVADA'],
  APROVADA: ['EM_TRANSPORTE'],
  EM_TRANSPORTE: ['ENTREGUE'],
}

export default function StatusActions({ statusAtual, vendaId, onAtualizado }) {
  const [loading, setLoading] = useState(false)
  const statusCanonico = mapearStatusPedido(statusAtual)
  const opcoes = TRANSITIONS[statusCanonico] || []

  async function mudarStatus(novo) {
    if (!confirm(`Confirmar a ação: "${LABELS[novo] || novo}"?`)) return
    setLoading(true)
    try {
      await pedidoService.atualizarStatusAdmin(encodeURIComponent(String(vendaId).replace(/^#/, '')), novo)
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
      {opcoes.map((o) => <button key={o} className="btn-ghost" disabled={loading} onClick={() => mudarStatus(o)}>{LABELS[o] || o}</button>)}
    </div>
  )
}

const LABELS = {
  APROVADA: 'Aprovar pagamento',
  REPROVADA: 'Reprovar pagamento',
  EM_TRANSPORTE: 'Despachar pedido',
  ENTREGUE: 'Confirmar entrega',
}
