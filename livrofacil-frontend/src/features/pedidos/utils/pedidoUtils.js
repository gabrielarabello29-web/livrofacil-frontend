import { api } from '@/shared/api/api'

const statusAposInicioProcessamento = new Set([
  'EM_PROCESSAMENTO',
  'PAGAMENTO_APROVADO',
  'EM_SEPARACAO',
  'NA_TRANSPORTADORA',
  'EM_ROTA_DE_ENTREGA',
  'ENTREGUE',
  'FINALIZADO',
])

const camposHistoricoStatus = [
  'historicoStatus',
  'historicoDeStatus',
  'statusHistorico',
  'historicoPedido',
  'eventosStatus',
  'historico',
  'timeline',
]

function normalizarStatus(status) {
  return String(status || '').trim().toUpperCase().replaceAll(' ', '_')
}

function statusDoRegistro(registro) {
  if (typeof registro === 'string') return [normalizarStatus(registro)]
  if (!registro || typeof registro !== 'object') return []

  return [
    registro.status,
    registro.statusPedido,
    registro.statusNovo,
    registro.statusAtual,
    registro.statusAnterior,
    registro.statusOrigem,
    registro.statusDe,
    registro.statusPara,
    registro.de,
    registro.para,
    registro.estado,
    registro.nome,
  ].map(normalizarStatus)
}

function indicadorPositivo(valor) {
  if (valor === true || valor === 1) return true
  if (typeof valor !== 'string') return false

  const normalizado = valor.trim().toLowerCase()
  if (!normalizado || ['false', '0', 'nao', 'não', 'no'].includes(normalizado)) {
    return false
  }

  return ['true', '1', 'sim', 'yes'].includes(normalizado)
}

function dataDeProcessamentoInformada(valor) {
  if (valor instanceof Date) return !Number.isNaN(valor.getTime())
  if (typeof valor !== 'string' || !valor.trim()) return false
  if (['false', '0', 'nao', 'não', 'no'].includes(valor.trim().toLowerCase())) {
    return false
  }

  return !Number.isNaN(Date.parse(valor))
}

export function pedidoCanceladoAposProcessamento(pedido) {
  const statusAtual = normalizarStatus(pedido?.status)
  if (statusAtual !== 'CANCELADO') return true

  const statusAnterior = [
    pedido?.statusAnterior,
    pedido?.statusAntesCancelamento,
    pedido?.statusAntesDeCancelar,
    pedido?.ultimoStatus,
    pedido?.ultimoStatusAntesCancelamento,
    pedido?.statusOrigem,
  ].map(normalizarStatus)

  if (statusAnterior.some((status) => statusAposInicioProcessamento.has(status))) {
    return true
  }

  const indicadoresDeProcessamento = [
    pedido?.passouPorProcessamento,
    pedido?.passouPorEmProcessamento,
    pedido?.foiProcessado,
    pedido?.processamentoIniciado,
  ]
  if (indicadoresDeProcessamento.some(indicadorPositivo)) return true

  const datasDeProcessamento = [
    pedido?.dataEmProcessamento,
    pedido?.emProcessamentoEm,
    pedido?.dataInicioProcessamento,
    pedido?.processadoEm,
  ]
  if (datasDeProcessamento.some(dataDeProcessamentoInformada)) return true

  return camposHistoricoStatus.some((campo) => {
    const historico = pedido?.[campo]
    const registros = Array.isArray(historico) ? historico : historico ? [historico] : []
    return registros.some((registro) =>
      statusDoRegistro(registro).some((status) => statusAposInicioProcessamento.has(status)),
    )
  })
}

export function pedidoDeveSerExibido(pedido) {
  return normalizarStatus(pedido?.status) !== 'CANCELADO' ||
    pedidoCanceladoAposProcessamento(pedido)
}

export function obterItensPedido(pedido) {
  for (const campo of ['itens', 'itensPedido', 'detalhes', 'produtos']) {
    if (Array.isArray(pedido?.[campo])) return pedido[campo]
  }
  return []
}

export function obterNomeLivro(item) {
  return (
    item?.titulo ||
    item?.tituloLivro ||
    item?.livroTitulo ||
    item?.nomeLivro ||
    item?.livroNome ||
    item?.nomeProduto ||
    item?.produtoNome ||
    item?.livro?.titulo ||
    item?.livro?.tituloLivro ||
    item?.livro?.nome ||
    item?.produto?.titulo ||
    item?.produto?.nome ||
    'Título não informado'
  )
}

export async function enriquecerItensComLivros(itens = []) {
  const lista = Array.isArray(itens) ? itens : []
  const ids = [...new Set(lista
    .map((item) => item?.livroId ?? item?.livro?.id ?? item?.produto?.id)
    .filter((id) => id !== undefined && id !== null && String(id).trim() !== '')
    .map(String))]

  const livros = await Promise.all(ids.map(async (id) => {
    try {
      const resposta = await api.get(`/livros/${encodeURIComponent(id)}`)
      const livro = resposta?.data || resposta
      return [id, livro]
    } catch {
      return [id, null]
    }
  }))
  const livrosPorId = new Map(livros)

  return lista.map((item) => {
    const livroId = item?.livroId ?? item?.livro?.id ?? item?.produto?.id
    const livro = livroId == null ? null : livrosPorId.get(String(livroId))

    return {
      ...item,
      livro: item?.livro || livro || item?.produto || null,
      titulo: obterNomeLivro({ ...item, livro: item?.livro || livro }),
      imagemUrl: obterImagemLivro({ ...item, livro: item?.livro || livro }),
    }
  })
}

export function obterImagemLivro(item) {
  return (
    item?.imagemUrl ||
    item?.capaUrl ||
    item?.imagem ||
    item?.capa ||
    item?.livro?.imagemUrl ||
    item?.livro?.capaUrl ||
    item?.livro?.imagem ||
    item?.livro?.capa ||
    item?.produto?.imagemUrl ||
    item?.produto?.capa
  )
}
