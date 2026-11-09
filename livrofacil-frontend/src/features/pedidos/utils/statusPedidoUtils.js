const STATUS_PEDIDO_LEGADO = {
  PAGAMENTO_APROVADO: 'APROVADA',
  EM_SEPARACAO: 'EM_PROCESSAMENTO',
  NA_TRANSPORTADORA: 'EM_TRANSPORTE',
  EM_ROTA_DE_ENTREGA: 'EM_TRANSPORTE',
}

export const STATUS_PEDIDO_ROTULOS = {
  PENDENTE: 'Pendente',
  AGUARDANDO_PAGAMENTO: 'Aguardando pagamento',
  EM_CHECKOUT: 'Em checkout',
  EM_PROCESSAMENTO: 'Em processamento',
  APROVADA: 'Pagamento aprovado',
  REPROVADA: 'Pagamento reprovado',
  EM_TRANSPORTE: 'Em transporte',
  ENTREGUE: 'Entregue',
  FINALIZADO: 'Finalizado',
  CANCELADO: 'Cancelado',
}

export function mapearStatusPedido(status) {
  const normalizado = String(status || '').trim().toUpperCase()
  return STATUS_PEDIDO_LEGADO[normalizado] || normalizado
}

export function rotuloStatusPedido(status) {
  const normalizado = mapearStatusPedido(status)
  return STATUS_PEDIDO_ROTULOS[normalizado] || 'Status desconhecido'
}

export function statusPedidoCancelavelPorCliente(status) {
  return [
    'PENDENTE',
    'AGUARDANDO_PAGAMENTO',
    'EM_CHECKOUT',
    'EM_PROCESSAMENTO',
  ].includes(mapearStatusPedido(status))
}

export function statusPedidoCancelavelPorAdmin(status) {
  return [
    'PENDENTE',
    'AGUARDANDO_PAGAMENTO',
    'EM_CHECKOUT',
    'EM_PROCESSAMENTO',
    'APROVADA',
  ].includes(mapearStatusPedido(status))
}
