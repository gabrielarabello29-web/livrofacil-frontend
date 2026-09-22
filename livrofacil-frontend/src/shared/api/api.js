const BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(message, status, details = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
    this.erro = details?.erro || 'Erro'
    this.erros = details?.erros || {}
    this.caminho = details?.caminho || ''
    this.timestamp = details?.timestamp || null
  }
}

function montarUrl(path, params = null) {
  if (!params || Object.keys(params).length === 0) return `${BASE_URL}${path}`

  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.append(key, String(value))
  })

  const queryString = query.toString()
  return queryString ? `${BASE_URL}${path}?${queryString}` : `${BASE_URL}${path}`
}

async function request(method, path, body, params = null) {
  let res

  try {
    res = await fetch(montarUrl(path, params), {
      method,
      headers: body !== undefined && body !== null ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined && body !== null ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('Não foi possível conectar ao servidor.', 0)
  }

  if (res.status === 204) return null

  const payload = await res.json().catch(() => ({}))

  if (!res.ok) {
    const detalhes = payload && typeof payload === 'object' ? payload : {}
    throw new ApiError(detalhes.mensagem || 'Não foi possível realizar esta operação.', res.status, detalhes)
  }

  return payload
}

export const api = {
  get: (path, params = null) => request('GET', path, undefined, params),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  patch: (path, body) => request('PATCH', path, body),
  delete: (path) => request('DELETE', path),
}
