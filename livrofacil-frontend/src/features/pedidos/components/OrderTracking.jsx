import React from 'react'

function formatarAtualizacao(valor) {
  if (!valor) return 'Não informada'

  const data = new Date(valor)
  return Number.isNaN(data.getTime()) ? String(valor) : data.toLocaleString('pt-BR')
}

export default function OrderTracking({ rastreamento }) {
  if (!rastreamento) return null

  return (
    <>
      <p data-testid="rastreamento-etapa">
        <strong>Etapa atual:</strong> {rastreamento.etapa || 'Não informada'}
      </p>
      <p data-testid="rastreamento-atualizacao">
        <strong>Última atualização:</strong> {formatarAtualizacao(rastreamento.ultimaModificacao)}
      </p>
    </>
  )
}
