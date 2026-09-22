import React, { useState } from 'react'

export default function LivroCover({ src, alt, className = '', style = {} }) {
  const [carregando, setCarregando] = useState(Boolean(src))
  const [falhou, setFalhou] = useState(false)
  const imagemValida = !falhou && /^https?:\/\/.+$/i.test(String(src || '').trim())

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
        <div role="img" aria-label={`${alt} indisponível`} style={{ width: '100%', height: '100%', minHeight: 80, display: 'grid', placeItems: 'center', textAlign: 'center', padding: 12, color: 'var(--text-muted)', fontSize: 12 }}>Capa indisponível</div>
      )}
    </div>
  )
}
