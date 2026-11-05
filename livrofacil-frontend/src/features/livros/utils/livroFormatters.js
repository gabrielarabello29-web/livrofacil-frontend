export const formatarDinheiro = (valor) => {
  const numero = Number(valor ?? 0)
  if (Number.isNaN(numero)) return 'R$ 0,00'

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numero)
}

export function parseDecimal(valor) {
  if (valor === null || valor === undefined || valor === '') return null

  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : null

  const stringValue = String(valor).trim().replace(/\s+/g, '')
  const normalizedValue = stringValue.includes(',')
    ? stringValue.replace(/\./g, '').replace(',', '.')
    : stringValue
  const numero = Number(normalizedValue)
  return Number.isFinite(numero) ? numero : null
}

export function getInitialLivroForm(livro = null) {
  const dimensao = livro?.dimensao || {}

  return {
    codigo: livro?.codigo || '',
    titulo: livro?.titulo || '',
    ano: livro?.ano || new Date().getFullYear(),
    edicao: livro?.edicao || 1,
    isbn: livro?.isbn || '',
    numeroPaginas: livro?.numeroPaginas || '',
    sinopse: livro?.sinopse || '',
    imagemUrl: livro?.imagemUrl || '',
    codigoBarras: livro?.codigoBarras || '',
    valorVenda: livro?.valorVenda ?? livro?.preco ?? '',
    ativo: livro ? Boolean(livro.ativo) : true,
    autorId: livro?.autorId ?? '',
    autorNome: livro?.autorNome || livro?.autor || '',
    editoraId: livro?.editoraId ?? '',
    editoraNome: livro?.editoraNome || livro?.editora || '',
    grupoPrecificacaoId: livro?.grupoPrecificacaoId ?? '',
    grupoPrecificacaoNome: livro?.grupoPrecificacaoNome || '',
    grupoPrecificacaoPercentualMargem: livro?.grupoPrecificacaoPercentualMargem ?? livro?.percentualMargem ?? '',
    categoriaIds: Array.isArray(livro?.categoriaIds) ? livro.categoriaIds.map(Number).filter(Boolean) : [],
    categoriaNomes: Array.isArray(livro?.categoriaNomes) ? livro.categoriaNomes : [],
    dimensao: {
      altura: dimensao.altura ?? '',
      largura: dimensao.largura ?? '',
      profundidade: dimensao.profundidade ?? '',
      peso: dimensao.peso ?? '',
    },
  }
}

export function buildLivroPayload(form) {
  const autorId = Number(form.autorId)
  const editoraId = Number(form.editoraId)
  const grupoPrecificacaoId = Number(form.grupoPrecificacaoId)
  const autorNome = String(form.autorNome || '').trim()
  const editoraNome = String(form.editoraNome || '').trim()
  const grupoPrecificacaoNome = String(form.grupoPrecificacaoNome || '').trim()
  const grupoPrecificacaoPercentualMargem = Number(parseDecimal(form.grupoPrecificacaoPercentualMargem))
  const categoriaNomes = Array.isArray(form.categoriaNomes)
    ? form.categoriaNomes.map((nome) => String(nome || '').trim()).filter(Boolean)
    : typeof form.categoriaNomes === 'string'
      ? form.categoriaNomes.split(',').map((nome) => String(nome || '').trim()).filter(Boolean)
      : []

  const payload = {
    codigo: String(form.codigo || '').trim(),
    titulo: String(form.titulo || '').trim(),
    ano: Number(form.ano),
    edicao: Number(form.edicao),
    isbn: String(form.isbn || '').trim(),
    numeroPaginas: Number(form.numeroPaginas),
    sinopse: String(form.sinopse || '').trim(),
    imagemUrl: String(form.imagemUrl || '').trim(),
    codigoBarras: String(form.codigoBarras || '').trim(),
    valorVenda: Number(parseDecimal(form.valorVenda)),
    ativo: form.ativo === true || form.ativo === 'true',
    categoriaIds: Array.isArray(form.categoriaIds)
      ? [...new Set(form.categoriaIds.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0))]
      : [],
    categoriaNomes: [...new Set(categoriaNomes)],
    dimensao: {
      altura: Number(parseDecimal(form.dimensao?.altura)),
      largura: Number(parseDecimal(form.dimensao?.largura)),
      profundidade: Number(parseDecimal(form.dimensao?.profundidade)),
      peso: Number(parseDecimal(form.dimensao?.peso)),
    },
  }

  if (Number.isFinite(autorId) && autorId > 0) {
    payload.autorId = autorId
  } else {
    payload.autorId = null
    if (autorNome) payload.autorNome = autorNome
  }

  if (Number.isFinite(editoraId) && editoraId > 0) {
    payload.editoraId = editoraId
  } else {
    payload.editoraId = null
    if (editoraNome) payload.editoraNome = editoraNome
  }

  if (Number.isFinite(grupoPrecificacaoId) && grupoPrecificacaoId > 0) {
    payload.grupoPrecificacaoId = grupoPrecificacaoId
  } else {
    payload.grupoPrecificacaoId = null
    if (grupoPrecificacaoNome) payload.grupoPrecificacaoNome = grupoPrecificacaoNome
    if (Number.isFinite(grupoPrecificacaoPercentualMargem) && grupoPrecificacaoPercentualMargem >= 0) payload.grupoPrecificacaoPercentualMargem = grupoPrecificacaoPercentualMargem
  }

  return payload
}

export function validarLivroForm(form) {
  const erros = {}

  const codigo = String(form.codigo || '').trim()
  if (!codigo) erros.codigo = 'Código é obrigatório.'
  else if (codigo.length > 50) erros.codigo = 'Código deve ter no máximo 50 caracteres.'

  const titulo = String(form.titulo || '').trim()
  if (!titulo) erros.titulo = 'Título é obrigatório.'
  else if (titulo.length > 200) erros.titulo = 'Título deve ter no máximo 200 caracteres.'

  const ano = Number(form.ano)
  if (!form.ano && form.ano !== 0) erros.ano = 'Ano é obrigatório.'
  else if (!Number.isInteger(ano) || ano <= 0) erros.ano = 'Ano deve ser um número inteiro maior que zero.'

  const edicao = Number(form.edicao)
  if (!form.edicao && form.edicao !== 0) erros.edicao = 'Edição é obrigatória.'
  else if (!Number.isInteger(edicao) || edicao <= 0) erros.edicao = 'Edição deve ser um número inteiro maior que zero.'

  const isbn = String(form.isbn || '').trim()
  if (!isbn) erros.isbn = 'ISBN é obrigatório.'
  else if (isbn.length > 20) erros.isbn = 'ISBN deve ter no máximo 20 caracteres.'

  const numeroPaginas = Number(form.numeroPaginas)
  if (!form.numeroPaginas && form.numeroPaginas !== 0) erros.numeroPaginas = 'Número de páginas é obrigatório.'
  else if (!Number.isInteger(numeroPaginas) || numeroPaginas <= 0) erros.numeroPaginas = 'Número de páginas deve ser um número inteiro maior que zero.'

  const sinopse = String(form.sinopse || '').trim()
  if (!sinopse) erros.sinopse = 'Sinopse é obrigatória.'
  else if (sinopse.length > 5000) erros.sinopse = 'Sinopse deve ter no máximo 5000 caracteres.'

  const imagemUrl = String(form.imagemUrl || '').trim()
  if (!imagemUrl) erros.imagemUrl = 'URL da capa é obrigatória.'
  else if (imagemUrl.length > 500) erros.imagemUrl = 'A URL da capa deve ter no máximo 500 caracteres.'
  else if (!/^https?:\/\/.+$/i.test(imagemUrl)) erros.imagemUrl = 'A URL da imagem da capa deve iniciar com http:// ou https://.'

  const codigoBarras = String(form.codigoBarras || '').trim()
  if (!codigoBarras) erros.codigoBarras = 'Código de barras é obrigatório.'
  else if (codigoBarras.length > 50) erros.codigoBarras = 'Código de barras deve ter no máximo 50 caracteres.'

  const valorVenda = Number(parseDecimal(form.valorVenda))
  if (!form.valorVenda && form.valorVenda !== 0) erros.valorVenda = 'Valor de venda é obrigatório.'
  else if (!Number.isFinite(valorVenda) || valorVenda <= 0) erros.valorVenda = 'Valor de venda deve ser maior que zero.'

  const autorSelecionado = form.autorId !== '' && form.autorId !== null && Number(form.autorId) > 0
  const editoraSelecionada = form.editoraId !== '' && form.editoraId !== null && Number(form.editoraId) > 0
  const autorNome = String(form.autorNome || '').trim()
  const editoraNome = String(form.editoraNome || '').trim()
  const grupoSelecionado = form.grupoPrecificacaoId !== '' && form.grupoPrecificacaoId !== null && Number(form.grupoPrecificacaoId) > 0
  const grupoNome = String(form.grupoPrecificacaoNome || '').trim()
  const categoriasNomes = Array.isArray(form.categoriaNomes)
    ? form.categoriaNomes.map((nome) => String(nome || '').trim()).filter(Boolean)
    : typeof form.categoriaNomes === 'string'
      ? form.categoriaNomes.split(',').map((nome) => String(nome || '').trim()).filter(Boolean)
      : []

  if (!autorSelecionado && !autorNome) erros.autorId = 'Selecione um autor ou informe o nome do autor.'
  if (!editoraSelecionada && !editoraNome) erros.editoraId = 'Selecione uma editora ou informe o nome da editora.'
  if (!grupoSelecionado && !grupoNome) erros.grupoPrecificacaoId = 'Selecione um grupo de precificação ou informe o nome do grupo.'

  const categoriaIds = Array.isArray(form.categoriaIds) ? form.categoriaIds.map(Number) : []
  if (categoriaIds.length === 0 && categoriasNomes.length === 0) erros.categoriaIds = 'Selecione ao menos uma categoria ou informe uma categoria nova.'
  else if (categoriaIds.some((id) => !Number.isInteger(id) || id <= 0)) erros.categoriaIds = 'Selecione apenas categorias válidas.'
  else if (new Set(categoriaIds).size !== categoriaIds.length) erros.categoriaIds = 'Não repita categorias.'

  const dimensao = form.dimensao || {}
  const altura = Number(parseDecimal(dimensao.altura))
  const largura = Number(parseDecimal(dimensao.largura))
  const profundidade = Number(parseDecimal(dimensao.profundidade))
  const peso = Number(parseDecimal(dimensao.peso))

  if (!dimensao.altura || !Number.isFinite(altura) || altura <= 0) erros['dimensao.altura'] = 'Altura deve ser maior que zero.'
  if (!dimensao.largura || !Number.isFinite(largura) || largura <= 0) erros['dimensao.largura'] = 'Largura deve ser maior que zero.'
  if (!dimensao.profundidade || !Number.isFinite(profundidade) || profundidade <= 0) erros['dimensao.profundidade'] = 'Profundidade deve ser maior que zero.'
  if (!dimensao.peso || !Number.isFinite(peso) || peso <= 0) erros['dimensao.peso'] = 'Peso deve ser maior que zero.'

  return erros
}

export function normalizarLivroDaApi(livro) {
  return {
    id: livro?.id,
    titulo: livro?.titulo || '',
    codigo: livro?.codigo || '',
    isbn: livro?.isbn || '',
    codigoBarras: livro?.codigoBarras || '',
    ano: livro?.ano || '',
    edicao: livro?.edicao || 1,
    numeroPaginas: livro?.numeroPaginas || livro?.paginas || 0,
    sinopse: livro?.sinopse || livro?.descricao || '',
    imagemUrl: livro?.imagemUrl || '',
    valorVenda: livro?.valorVenda ?? livro?.preco ?? 0,
    ativo: Boolean(livro?.ativo ?? (livro?.status === 'ATIVO' || livro?.status === 'Ativo')),
    autorId: livro?.autorId ?? '',
    autorNome: livro?.autorNome || livro?.autor || '',
    editoraId: livro?.editoraId ?? '',
    editoraNome: livro?.editoraNome || livro?.editora || '',
    grupoPrecificacaoId: livro?.grupoPrecificacaoId ?? '',
    grupoPrecificacaoNome: livro?.grupoPrecificacaoNome || livro?.grupo || '',
    grupoPrecificacaoPercentualMargem: livro?.grupoPrecificacaoPercentualMargem ?? livro?.percentualMargem ?? '',
    categoriaIds: Array.isArray(livro?.categoriaIds) ? [...new Set(livro.categoriaIds.map(Number).filter(Boolean))] : [],
    categoriaNomes: Array.isArray(livro?.categoriaNomes) ? livro.categoriaNomes : [],
    categorias: Array.isArray(livro?.categorias) ? livro.categorias : [],
    dimensao: livro?.dimensao || {
      altura: '',
      largura: '',
      profundidade: '',
      peso: '',
    },
    estoque: livro?.estoque || null,
    status: livro?.ativo ? 'ATIVO' : 'INATIVO',
  }
}

export function validarEstoque(form) {
  const erros = {}
  for (const campo of ['quantidadeDisponivel', 'quantidadeBloqueada', 'quantidadeVendida']) {
    const valor = form?.[campo]
    if (valor === '' || valor === null || valor === undefined) erros[campo] = 'Informe uma quantidade.'
    else if (!Number.isInteger(Number(valor)) || Number(valor) < 0) erros[campo] = 'Informe um número inteiro não negativo.'
  }
  if (!erros.quantidadeDisponivel && !erros.quantidadeBloqueada && Number(form.quantidadeBloqueada) > Number(form.quantidadeDisponivel)) {
    erros.quantidadeBloqueada = 'A quantidade bloqueada não pode ser maior que a quantidade disponível.'
  }
  return erros
}

export function buildEstoquePayload(form) {
  return {
    quantidadeDisponivel: Number(form.quantidadeDisponivel),
    quantidadeBloqueada: Number(form.quantidadeBloqueada),
    quantidadeVendida: Number(form.quantidadeVendida),
  }
}
