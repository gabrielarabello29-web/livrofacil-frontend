const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api').replace(/\/$/, '')

export async function login(email, senha) {
  const response = await fetch(`${API_URL}/clientes/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: String(email || '').trim(),
      senha: String(senha || ''),
    }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw {
      status: response.status,
      mensagem: data?.mensagem || 'Não foi possível realizar o login.',
      erros: data?.erros || {},
    }
  }

  return data
}

export const authApi = { login }