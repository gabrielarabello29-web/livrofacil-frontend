import React, { useState } from 'react'

export default function LivroCover({ src, alt, className = '', style = {} }) {
  const [carregando, setCarregando] = useState(Boolean(src))
  const [falhou, setFalhou] = useState(false)
  const imagemValida = !falhou && /^https?:\/\/.+$/i.test(String(src || '').trim())
  const titulo = String(alt || 'Livro').replace(/^Capa de\s*/i, '').trim()

  return (
    <div className={className} style={{ position: 'relative', overflow: 'hidden', background: '#F3F4F6', ...style }}>
      {imagemValida ? (
        <>
          {carregando && <span aria-label="Carregando capa" style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: 'var(--text-muted)', fontSize: 12 }}>Carregando...</span>}
          <img
            src={String(src).trim()}
            alt={alt}
            onLoad={() => setCarregando(false)}
            onError={() => {
              setFalhou(true)
              setCarregando(false)
            }}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: carregando ? 0 : 1, transition: 'opacity .15s ease' }}
          />
        </>
      ) : (
        <div role="img" aria-label={`Capa de ${titulo} indisponível`} className="book-cover-placeholder">
          <span className="book-cover-placeholder-brand">LIVROFÁCIL</span>
          <svg className="book-cover-placeholder-icon" viewBox="0 0 48 48" fill="none" aria-hidden="true">
            <path d="M7 10.5c6.2-2.2 12.1-1 17 2.5v25c-4.9-3.5-10.8-4.7-17-2.5v-25Z" />
            <path d="M41 10.5c-6.2-2.2-12.1-1-17 2.5v25c4.9-3.5 10.8-4.7 17-2.5v-25Z" />
            <path d="M12 17c3.4-.7 6.4-.2 9 1.1M12 22c3.4-.7 6.4-.2 9 1.1M36 17c-3.4-.7-6.4-.2-9 1.1M36 22c-3.4-.7-6.4-.2-9 1.1" />
          </svg>
          <strong className="book-cover-placeholder-title">{titulo}</strong>
          <small className="book-cover-placeholder-caption">Capa indisponível</small>
        </div>
      )}
    </div>
  )
}
