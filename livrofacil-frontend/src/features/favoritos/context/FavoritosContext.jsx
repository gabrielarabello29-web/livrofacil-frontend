import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const FavoritosContext = createContext(null)
const STORAGE_KEY = 'favoritos'

function readFavorites() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

export function FavoritosProvider({ children }) {
  const [favoritos, setFavoritos] = useState(readFavorites)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favoritos))
  }, [favoritos])

  function isFavorito(livro) {
    const id = livro?.id ?? livro
    return favoritos.some((item) => String(item.id ?? item) === String(id))
  }

  function toggleFavorito(livro) {
    if (!livro) return
    setFavoritos((atual) => (isFavorito(livro) ? atual.filter((item) => String(item.id ?? item) !== String(livro.id)) : [...atual, livro]))
  }

  const value = useMemo(() => ({ favoritos, isFavorito, toggleFavorito }), [favoritos])
  return <FavoritosContext.Provider value={value}>{children}</FavoritosContext.Provider>
}

export function useFavoritos() {
  const context = useContext(FavoritosContext)
  if (!context) throw new Error('useFavoritos deve ser usado dentro de FavoritosProvider')
  return context
}
