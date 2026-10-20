const TIME_ZONE = 'America/Sao_Paulo'
const STATUS_COMPROMETIDOS = new Set([
  'SOLICITADA',
  'AGUARDANDO_RECEBIMENTO',
  'RECEBIDA',
  'CONCLUIDA',
  'AUTORIZADA',
  'TROCADA',
])

function dataLocalSaoPaulo(valor) {
  if (!valor) return null
  const texto = String(valor)
  const semFuso = /^\d{4}-\d{2}-\d{2}(?:T| )/.test(texto) && !/(Z|[+-]\d{2}:?\d{2})$/i.test(texto)
  if (semFuso) return texto.slice(0, 10)

  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) return null
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(data)
  const valores = Object.fromEntries(partes.map(({ type, value }) => [type, value]))
  return `${valores.year}-${valores.month}-${valores.day}`
}

function adicionarDias(data, dias) {
  const [ano, mes, dia] = data.split('-').map(Number)
  const resultado = new Date(Date.UTC(ano, mes - 1, dia + dias))
  return `${resultado.getUTCFullYear()}-${String(resultado.getUTCMonth() + 1).padStart(2, '0')}-${String(resultado.getUTCDate()).padStart(2, '0')}`
}

export function prazoTroca(pedido, agora = new Date()) {
  const entregueEm = pedido?.entregueEm
  const status = String(pedido?.status || '').trim().toUpperCase()
  if (status !== 'ENTREGUE') return { elegivel: false, motivo: 'A solicitação só pode ser feita para pedidos entregues.' }
  if (!entregueEm) return { elegivel: false, motivo: 'Este pedido não possui data de entrega registrada. Procure o suporte para verificar.' }

  const dataEntrega = dataLocalSaoPaulo(entregueEm)
  const dataAtual = dataLocalSaoPaulo(agora)
  if (!dataEntrega || !dataAtual) return { elegivel: false, motivo: 'Não foi possível confirmar o prazo de entrega.' }
  const ultimoDia = adicionarDias(dataEntrega, 7)
  return dataAtual <= ultimoDia
    ? { elegivel: true, ultimoDia }
    : { elegivel: false, motivo: `O prazo de solicitação terminou em ${new Date(`${ultimoDia}T12:00:00`).toLocaleDateString('pt-BR', { timeZone: TIME_ZONE })}.` }
}

export function quantidadeDisponivelTroca(itemPedido, solicitacoes = []) {
  const comprada = Math.max(0, Number(itemPedido?.quantidade || 0))
  const itemId = itemPedido?.itemPedidoId ?? itemPedido?.id
  if (itemId == null) return comprada

  const comprometida = solicitacoes.reduce((total, troca) => {
    if (String(troca?.itemPedidoId ?? '') !== String(itemId)) return total
    const status = String(troca?.status || '').trim().toUpperCase()
    if (!STATUS_COMPROMETIDOS.has(status)) return total
    const quantidade = status === 'CONCLUIDA' || status === 'TROCADA'
      ? Number(troca?.quantidadeRecebida ?? troca?.quantidadeSolicitada ?? troca?.quantidade ?? 0)
      : Number(troca?.quantidadeSolicitada ?? troca?.quantidade ?? 0)
    return total + Math.max(0, quantidade)
  }, 0)

  return Math.max(0, comprada - comprometida)
}

export function formatarDinheiroTroca(valor) {
  const numero = Number(valor)
  return Number.isFinite(numero) ? `R$ ${numero.toFixed(2).replace('.', ',')}` : '—'
}

export function formatarDataTroca(valor) {
  if (!valor) return '—'
  const texto = String(valor)
  const valorComFuso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(texto) && !/(Z|[+-]\d{2}:?\d{2})$/i.test(texto)
    ? `${texto}-03:00`
    : valor
  const data = new Date(valorComFuso)
  return Number.isNaN(data.getTime()) ? String(valor) : data.toLocaleString('pt-BR', { timeZone: TIME_ZONE })
}
