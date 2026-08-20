import { Link } from 'react-router-dom'
import { useCarrinho } from '../context/CarrinhoContext'
import { useState } from 'react'

export default function LivroCard({ livro }) {
  const { adicionarItem } = useCarrinho()
  const [adicionado, setAdicionado] = useState(false)
  const [favorito, setFavorito] = useState(false)

  function handleAdicionar(e) {
    e.preventDefault()
    adicionarItem(livro)
    setAdicionado(true)
    setTimeout(() => setAdicionado(false), 1500)
  }

  const desconto = livro.precoOriginal
    ? Math.round((1 - livro.preco / livro.precoOriginal) * 100)
    : 0

  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'box-shadow 0.2s, transform 0.2s', cursor: 'pointer', position: 'relative' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(124,58,237,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}>

      {/* Favorite */}
      <button onClick={() => setFavorito(v => !v)} style={{ position: 'absolute', top: 10, right: 10, zIndex: 2, background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill={favorito ? '#EF4444' : 'none'} stroke={favorito ? '#EF4444' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </button>

      {desconto > 0 && (
        <span style={{ position: 'absolute', top: 10, left: 10, zIndex: 2, background: '#10B981', color: '#fff', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>-{desconto}%</span>
      )}

      <Link to={`/livros/${livro.id}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ background: '#F5F3FF', height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <img src={livro.capa} alt={livro.titulo} style={{ height: '100%', width: '100%', objectFit: 'cover' }} loading="lazy" />
        </div>
        <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{livro.categoria}</p>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text)', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{livro.titulo}</h3>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>{livro.autor}</p>

          {livro.avaliacao && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <span style={{ color: '#F59E0B', fontSize: 12 }}>{'★'.repeat(Math.floor(livro.avaliacao))}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{livro.avaliacao} ({(livro.avaliacoes || 0).toLocaleString('pt-BR')})</span>
            </div>
          )}

          <div style={{ marginTop: 4 }}>
            {livro.precoOriginal && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'line-through', display: 'block' }}>R$ {livro.precoOriginal.toFixed(2).replace('.', ',')}</span>
            )}
            <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--primary)' }}>R$ {livro.preco.toFixed(2).replace('.', ',')}</span>
          </div>
        </div>
      </Link>

      <div style={{ padding: '0 14px 14px' }}>
        <button onClick={handleAdicionar} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '8px 16px', fontSize: 13, background: adicionado ? '#10B981' : 'var(--primary)' }}>
          {adicionado ? (
            <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Adicionado!</>
          ) : (
            <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg> Adicionar</>
          )}
        </button>
      </div>
    </div>
  )
}
