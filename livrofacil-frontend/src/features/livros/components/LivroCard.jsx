import React from 'react'
import { Link } from 'react-router-dom'
import { useCarrinho } from '@/features/carrinho/context/CarrinhoContext'
import { useState } from 'react'
import LivroCover from '@/features/livros/components/LivroCover'
import FavoriteButton from '@/features/favoritos/components/FavoriteButton'

export default function LivroCard({ livro }) {
  const { itens, adicionarItem, operando } = useCarrinho()
  const [adicionado, setAdicionado] = useState(false)
  const [erro, setErro] = useState('')
  const jaNoCarrinho = itens.some((item) => {
    const itemLivroId = item.livroId ?? item.produtoId ?? item.livro?.id
    return itemLivroId !== undefined && String(itemLivroId) === String(livro.id)
  })

  async function handleAdicionar(e) {
    e.preventDefault()
    e.stopPropagation()
    if (jaNoCarrinho || operando) return
    setErro('')
    try {
      await adicionarItem(livro)
      setAdicionado(true)
      setTimeout(() => setAdicionado(false), 1500)
    } catch (error) {
      setErro(error?.mensagem || 'Não foi possível adicionar o livro.')
    }
  }

  return (
    <div className="book-card" style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'box-shadow 0.2s, transform 0.2s', cursor: 'pointer', position: 'relative' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(124,58,237,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}>

      {/* Favorite */}
      <FavoriteButton livro={livro} />

      <Link to={`/livros/${livro.id}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ background: '#F5F3FF', height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <LivroCover src={livro.imagemUrl} alt={`Capa de ${livro.titulo}`} style={{ width: '100%', height: '100%' }} />
        </div>
        <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{livro.categoriaNomes?.join(', ') || 'Categorias não informadas'}</p>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text)', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{livro.titulo}</h3>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>{livro.autorNome || 'Autor não informado'}</p>

          <div style={{ marginTop: 4 }}>
            <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--primary)' }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(livro.valorVenda || 0))}</span>
          </div>
        </div>
      </Link>

      <div style={{ padding: '0 14px 14px' }}>
        <button type="button" onClick={handleAdicionar} disabled={jaNoCarrinho || operando} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '8px 16px', fontSize: 13, background: jaNoCarrinho ? '#10B981' : adicionado ? '#10B981' : 'var(--primary)' }}>
          {jaNoCarrinho ? 'No carrinho' : operando ? 'Adicionando...' : adicionado ? (
            <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Adicionado!</>
          ) : (
            <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg> Adicionar</>
          )}
        </button>
        {erro && <small role="alert" style={{ display: 'block', marginTop: 6, color: 'var(--danger)', fontSize: 11 }}>{erro}</small>}
      </div>
    </div>
  )
}
