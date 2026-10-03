import { useCallback, useMemo, useState } from 'react'
import {
  ativarLivro,
  atualizarLivro,
  buscarLivroPorId,
  buscarLivrosPorTitulo,
  criarLivro,
  inativarLivro,
  listarLivros,
  listarLivrosAtivos,
} from '../api/livrosApi'
import { normalizarLivroDaApi } from '../utils/livroFormatters'

export function useLivros() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const normalizeList = useCallback((items = []) => (Array.isArray(items) ? items.map(normalizarLivroDaApi) : []), [])

  const listar = useCallback(async ({ ativos = false, titulo = '' } = {}) => {
    setLoading(true)
    setError(null)

    try {
      const resposta = titulo
        ? await buscarLivrosPorTitulo(titulo)
        : ativos
          ? await listarLivrosAtivos()
          : await listarLivros()

      return normalizeList(resposta)
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [normalizeList])

  const buscarPorId = useCallback(async (id) => {
    setLoading(true)
    setError(null)

    try {
      const resposta = await buscarLivroPorId(id)
      return normalizarLivroDaApi(resposta)
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const salvar = useCallback(async (payload, id) => {
    setLoading(true)
    setError(null)

    try {
      if (id) {
        return await atualizarLivro(id, payload)
      }

      return await criarLivro(payload)
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const alternarStatus = useCallback(async (id, ativo) => {
    setLoading(true)
    setError(null)

    try {
      if (ativo) {
        return await inativarLivro(id)
      }

      return await ativarLivro(id)
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return useMemo(() => ({
    loading,
    error,
    listar,
    buscarPorId,
    salvar,
    alternarStatus,
  }), [loading, error, listar, buscarPorId, salvar, alternarStatus])
}
