import { useState } from 'react'
import { pedidoService } from '@/features/pedidos/api/pedidoService'
import { mapearStatusPedido } from '@/features/pedidos/utils/statusPedidoUtils'

const ACOES_POR_STATUS = {
  EM_PROCESSAMENTO: [
    { status: 'APROVADA', rotulo: 'Aprovar pagamento', confirmacao: 'Aprovar o pagamento deste pedido?' },
    { status: 'REPROVADA', rotulo: 'Reprovar pagamento', confirmacao: 'Reprovar o pagamento deste pedido? O estoque vendido será reposto.' },
  ],
  APROVADA: [
    { status: 'EM_TRANSPORTE', rotulo: 'Despachar pedido', confirmacao: 'Confirmar o despacho deste pedido?' },
  ],
  EM_TRANSPORTE: [
    { status: 'ENTREGUE', rotulo: 'Confirmar entrega', confirmacao: 'Confirmar que o pedido foi entregue?' },
  ],
}

export default function AcoesStatusPedido({ pedido, onAtualizado, onErro, onSucesso }) {
  const [processando, setProcessando] = useState(false)
  const statusAtual = mapearStatusPedido(pedido?.status)
  const acoes = ACOES_POR_STATUS[statusAtual] || []

  async function executar(acao) {
    if (!window.confirm(acao.confirmacao)) return
    setProcessando(true)
    try {
      const resposta = await pedidoService.atualizarStatusAdmin(pedido.id, acao.status)
      const atualizado = resposta?.data || resposta
      const status = mapearStatusPedido(atualizado?.status || acao.status)
      onAtualizado?.(atualizado?.status ? { ...pedido, ...atualizado, status } : { ...pedido, status })
      onSucesso?.(`${acao.rotulo} realizado com sucesso.`)
    } catch (error) {
      onErro?.(error?.message || error?.mensagem || 'Não foi possível atualizar o pedido.')
    } finally {
      setProcessando(false)
    }
  }

  if (!acoes.length) return null

  return (
    <div className="admin-order-actions">
      {acoes.map((acao) => (
        <button
          key={acao.status}
          type="button"
          className={acao.status === 'REPROVADA' ? 'btn-danger' : 'btn-primary'}
          disabled={processando}
          onClick={() => executar(acao)}
        >
          {acao.rotulo}
        </button>
      ))}
    </div>
  )
}
