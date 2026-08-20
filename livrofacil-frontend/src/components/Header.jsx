import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCarrinho } from '../context/CarrinhoContext'

export default function Header() {
  const { usuario, logout } = useAuth()
  const { totalItens } = useCarrinho()
  const navigate = useNavigate()
  const [busca, setBusca] = useState('')
  const [menuAberto, setMenuAberto] = useState(false)
  const [userMenuAberto, setUserMenuAberto] = useState(false)

  function handleBusca(e) {
    e.preventDefault()
    if (busca.trim()) navigate(`/livros?busca=${encodeURIComponent(busca.trim())}`)
  }

  function handleLogout() {
    logout()
    navigate('/')
    setUserMenuAberto(false)
  }

  return (
    <header style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', position: 'sticky', top: 0, zIndex: 50 }}>
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', gap: 24, height: 64 }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
          <div style={{ width: 34, height: 34, background: 'var(--primary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--primary)' }}>LivroFácil</span>
        </Link>

        {/* Nav */}
        <nav style={{ display: 'flex', gap: 4, flexShrink: 0 }} className="header-nav">
          <Link to="/categorias" style={{ padding: '6px 12px', borderRadius: 6, fontSize: 14, fontWeight: 500, color: 'var(--text)', textDecoration: 'none', transition: 'background 0.15s' }}
            onMouseEnter={e => e.target.style.background = '#F3F4F6'}
            onMouseLeave={e => e.target.style.background = 'transparent'}>Categorias</Link>
          <Link to="/livros?promo=true" style={{ padding: '6px 12px', borderRadius: 6, fontSize: 14, fontWeight: 500, color: 'var(--text)', textDecoration: 'none', transition: 'background 0.15s' }}
            onMouseEnter={e => e.target.style.background = '#F3F4F6'}
            onMouseLeave={e => e.target.style.background = 'transparent'}>Promoções</Link>
          <Link to="/livros?novidades=true" style={{ padding: '6px 12px', borderRadius: 6, fontSize: 14, fontWeight: 500, color: 'var(--text)', textDecoration: 'none', transition: 'background 0.15s' }}
            onMouseEnter={e => e.target.style.background = '#F3F4F6'}
            onMouseLeave={e => e.target.style.background = 'transparent'}>Novidades</Link>
        </nav>

        {/* Search */}
        <form onSubmit={handleBusca} style={{ flex: 1, display: 'flex', maxWidth: 420 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar livros, autores, ISBN..."
              style={{ width: '100%', padding: '9px 40px 9px 16px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 14, outline: 'none', transition: 'border-color 0.15s' }}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor = '#E5E7EB'}
            />
            <button type="submit" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </button>
          </div>
        </form>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <Link to="/livros" title="Favoritos" style={{ padding: 8, borderRadius: 8, color: 'var(--text-muted)', display: 'flex', transition: 'background 0.15s', textDecoration: 'none' }}
            onMouseEnter={e => e.currentTarget.style.background = '#F3F4F6'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </Link>

          <Link to="/carrinho" title="Carrinho" style={{ padding: 8, borderRadius: 8, color: 'var(--text-muted)', display: 'flex', position: 'relative', transition: 'background 0.15s', textDecoration: 'none' }}
            onMouseEnter={e => e.currentTarget.style.background = '#F3F4F6'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            {totalItens > 0 && (
              <span style={{ position: 'absolute', top: 2, right: 2, background: 'var(--primary)', color: '#fff', borderRadius: '50%', width: 16, height: 16, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {totalItens > 9 ? '9+' : totalItens}
              </span>
            )}
          </Link>

          {/* User menu */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setUserMenuAberto(v => !v)}
              style={{ padding: 8, borderRadius: 8, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#F3F4F6'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {usuario ? (
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                  {usuario.nome.charAt(0).toUpperCase()}
                </div>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              )}
            </button>
            {userMenuAberto && (
              <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 8, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 200, zIndex: 100 }} className="animate-fadein">
                {usuario ? (
                  <>
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid #F3F4F6' }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{usuario.nome}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>{usuario.email}</p>
                    </div>
                    {usuario.perfil === 'ADMIN' && (
                      <Link to="/admin" onClick={() => setUserMenuAberto(false)} style={{ display: 'block', padding: '10px 16px', fontSize: 14, color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                        Painel Admin
                      </Link>
                    )}
                    <Link to="/perfil" onClick={() => setUserMenuAberto(false)} style={{ display: 'block', padding: '10px 16px', fontSize: 14, color: 'var(--text)', textDecoration: 'none' }}>Meu Perfil</Link>
                    <Link to="/meus-pedidos" onClick={() => setUserMenuAberto(false)} style={{ display: 'block', padding: '10px 16px', fontSize: 14, color: 'var(--text)', textDecoration: 'none' }}>Meus Pedidos</Link>
                    <div style={{ borderTop: '1px solid #F3F4F6' }}>
                      <button onClick={handleLogout} style={{ width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: 14, color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}>Sair</button>
                    </div>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setUserMenuAberto(false)} style={{ display: 'block', padding: '10px 16px', fontSize: 14, color: 'var(--text)', fontWeight: 600, textDecoration: 'none' }}>Entrar</Link>
                    <Link to="/cadastro" onClick={() => setUserMenuAberto(false)} style={{ display: 'block', padding: '10px 16px', fontSize: 14, color: 'var(--primary)', textDecoration: 'none' }}>Criar conta</Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
