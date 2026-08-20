import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const menu = [
  { label: 'Meu Perfil', path: '/perfil', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { label: 'Endereços', path: '/enderecos', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' },
  { label: 'Cartões', path: '/cartoes', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  { label: 'Meus Pedidos', path: '/meus-pedidos', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { label: 'Trocas e Devoluções', path: '/trocas', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
]

export default function ClienteSidebar() {
  const { pathname } = useLocation()
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <aside style={{ width: 240, flexShrink: 0 }}>
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden', position: 'sticky', top: 80 }}>
        <div style={{ padding: '20px 16px', background: 'var(--primary-light)', borderBottom: '1px solid #DDD6FE' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, marginBottom: 10 }}>
            {usuario?.nome?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{usuario?.nome}</p>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>{usuario?.email}</p>
        </div>
        <nav style={{ padding: '8px 0' }}>
          {menu.map(item => (
            <Link key={item.path} to={item.path}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', textDecoration: 'none', fontSize: 14, fontWeight: 500,
                color: pathname === item.path ? 'var(--primary)' : 'var(--text)',
                background: pathname === item.path ? 'var(--primary-light)' : 'transparent',
                borderLeft: pathname === item.path ? '3px solid var(--primary)' : '3px solid transparent',
              }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.icon} />
              </svg>
              {item.label}
            </Link>
          ))}
          <div style={{ borderTop: '1px solid #F3F4F6', marginTop: 4 }}>
            <button onClick={() => { logout(); navigate('/') }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: 'var(--danger)', textAlign: 'left', borderLeft: '3px solid transparent' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sair
            </button>
          </div>
        </nav>
      </div>
    </aside>
  )
}
