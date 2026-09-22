import { tratarResposta } from '../../livros/api/livrosApi'

const API_URL = 'http://localhost:8080/api'

async function requisitar(path) {
  let response
  try {
    response = await fetch(`${API_URL}${path}`)
  } catch {
    throw { status: 0, mensagem: 'Não foi possível carregar o catálogo.' }
  }

  return tratarResposta(response)
}

export function listarCatalogo() {
  return requisitar('/livros/catalogo')
}

export function buscarCatalogoPorTitulo(titulo) {
  const termo = encodeURIComponent(String(titulo || '').trim())
  return requisitar(`/livros/catalogo/buscar?titulo=${termo}`)
}

export function buscarLivroCatalogo(id) {
  return requisitar(`/livros/catalogo/${id}`)
}
