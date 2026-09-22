import React from 'react'
import { useFavoritos } from '../context/FavoritosContext'

export default function FavoriteButton({ livro }) {
  const { isFavorito, toggleFavorito } = useFavoritos()
  const favorito = isFavorito(livro)

  return (
    <button
      type="button"
      onClick={() => toggleFavorito(livro)}
      aria-label={favorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      title={favorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      style={{ position: 'absolute', top: 12, right: 12, zIndex: 1, border: 0, borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', background: '#fff', color: favorito ? '#DC2626' : '#6B7280', fontSize: 22, boxShadow: '0 4px 14px rgba(0,0,0,0.12)' }}
    >
      {favorito ? '♥' : '♡'}
    </button>
  )
}
