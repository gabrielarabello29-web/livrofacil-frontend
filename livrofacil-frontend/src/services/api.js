const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

async function request(method, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    // try to extract any error body for debugging
    let text = ''
    try {
      text = await res.text()
    } catch (e) {
      // ignore
    }
    throw new Error(`Erro ${res.status}: ${res.statusText}${text ? ` - ${text}` : ''}`)
  }

  // No content
  if (res.status === 204) return null

  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) {
    try {
      return await res.json()
    } catch (e) {
      // fallback if JSON parse fails
      return null
    }
  }

  return await res.text()
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  patch: (path, body) => request('PATCH', path, body),
  delete: (path) => request('DELETE', path),
}
