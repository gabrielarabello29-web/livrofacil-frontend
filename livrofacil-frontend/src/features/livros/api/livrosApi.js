const API_URL = 'http://localhost:8080/api'

async function request(method, path, body) {
  const url = path.includes('?') ? `${API_URL}${path}` : `${API_URL}${path}`

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

  let payload = null
  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    try {
      payload = await response.json()
    } catch {
      payload = null
    }
  } else {
    try {
      payload = await response.text()
    } catch {
      payload = null
    }
  }

  if (!response.ok) {
    const detalhes = payload && typeof payload === 'object' ? payload : {}
    const mensagem = detalhes.mensagem || detalhes.message || 'Não foi possível concluir a operação.'
    const erro = {
      status: response.status,
      mensagem,
      erros: detalhes.erros || {},
      detalhes,
    }
    throw erro
  }

  return payload
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
