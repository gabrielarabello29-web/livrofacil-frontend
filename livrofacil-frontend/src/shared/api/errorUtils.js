export function erroDoCampo(erros, campo) {
  if (!erros) return ''
  const valorDireto = erros[campo]
  if (typeof valorDireto === 'string') return valorDireto

  return campo.split('.').reduce((valor, chave) => valor?.[chave], erros) || ''
}

export function normalizarErrosDeCampo(erros = {}) {
  const normalizados = {}

  Object.entries(erros || {}).forEach(([campo, mensagem]) => {
    if (typeof mensagem === 'string') {
      normalizados[campo] = mensagem
    } else if (mensagem && typeof mensagem === 'object') {
      Object.entries(mensagem).forEach(([subcampo, texto]) => {
        if (typeof texto === 'string') normalizados[`${campo}.${subcampo}`] = texto
      })
    }
  })

  return normalizados
}

export function mensagemDeApi(error, fallback = 'Não foi possível concluir a operação.') {
  if (error?.status === 401) return 'Sua sessão expirou. Faça login novamente.'
  if (error?.status === 403) return 'Acesso negado.'
  if (error?.status === 405) return 'Método não permitido para esta operação.'
  if (error?.status === 500) return 'Ocorreu um erro interno no servidor. Tente novamente.'
  if (error?.status === 0) return 'Não foi possível conectar ao backend.'
  return error?.mensagem || error?.message || fallback
}
