const API_URL = 'http://localhost:8080/api'

export async function tratarResposta(response) {
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw {
      status: response.status,
      erro: data.erro || 'Erro',
      mensagem: data.mensagem || 'Não foi possível concluir a operação.',
      erros: data.erros || {},
      caminho: data.caminho || '',
      timestamp: data.timestamp || null,
    }
  }

  return data
}

async function request(method, path, body) {
  const url = `${API_URL}${path}`

  let response
  try {
    response = await fetch(url, {
      method,
      headers: body !== undefined && body !== null ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined && body !== null ? JSON.stringify(body) : undefined,
    })
  } catch (error) {
    throw {
      status: 0,
      mensagem: 'Não foi possível conectar ao backend. Verifique se a aplicação está rodando em http://localhost:8080.',
      erros: {},
      originalError: error,
    }
  }

  return tratarResposta(response)
}

export { API_URL }

export async function listarLivros() {
  return request('GET', '/livros')
}

export async function listarLivrosAtivos() {
  return request('GET', '/livros/ativos')
}

export async function buscarLivrosPorTitulo(titulo) {
  const termo = String(titulo || '').trim()
  if (!termo) {
    return listarLivrosAtivos()
  }

  const query = encodeURIComponent(termo)
  return request('GET', `/livros/buscar?titulo=${query}`)
}

export async function buscarLivroPorId(id) {
  return request('GET', `/livros/${id}`)
}

export async function criarLivro(payload) {
  return request('POST', '/livros', payload)
}

export async function atualizarLivro(id, payload) {
  return request('PUT', `/livros/${id}`, payload)
}

export async function ativarLivro(id) {
  return request('PATCH', `/livros/${id}/ativar`)
}

export async function inativarLivro(id) {
  return request('PATCH', `/livros/${id}/inativar`)
}

export async function listarAutores() {
  return request('GET', '/livros/opcoes/autores')
}

export async function listarEditoras() {
  return request('GET', '/livros/opcoes/editoras')
}

export async function listarCategorias() {
  return request('GET', '/livros/opcoes/categorias')
}

export async function listarGruposPrecificacao() {
  return request('GET', '/livros/opcoes/grupos-precificacao')
}

export async function buscarEstoque(id) {
  return request('GET', `/livros/${id}/estoque`)
}

export async function atualizarEstoque(id, payload) {
  return request('PUT', `/livros/${id}/estoque`, payload)
}
