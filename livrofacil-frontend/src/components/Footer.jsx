import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer style={{ background: '#111827', color: '#9CA3AF', marginTop: 80 }}>
      <div className="page-container" style={{ paddingTop: 48, paddingBottom: 48 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40, marginBottom: 48 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, background: 'var(--primary)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
              </div>
              <span style={{ fontWeight: 800, fontSize: 18, color: '#fff' }}>LivroFácil</span>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.6, margin: 0 }}>Sua livraria digital com os melhores títulos para cada momento da sua vida.</p>
          </div>
          <div>
            <h4 style={{ color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 16, margin: '0 0 16px' }}>Loja</h4>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[['/', 'Início'], ['/livros', 'Livros'], ['/categorias', 'Categorias'], ['/livros?promo=true', 'Promoções']].map(([href, label]) => (
                <Link key={href} to={href} style={{ color: '#9CA3AF', fontSize: 14, textDecoration: 'none' }}
                  onMouseEnter={e => e.target.style.color = '#fff'}
                  onMouseLeave={e => e.target.style.color = '#9CA3AF'}>{label}</Link>
              ))}
            </nav>
          </div>
          <div>
            <h4 style={{ color: '#fff', fontSize: 14, fontWeight: 600, margin: '0 0 16px' }}>Conta</h4>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[['/perfil', 'Meu Perfil'], ['/meus-pedidos', 'Meus Pedidos'], ['/trocas', 'Trocas'], ['/carrinho', 'Carrinho']].map(([href, label]) => (
                <Link key={href} to={href} style={{ color: '#9CA3AF', fontSize: 14, textDecoration: 'none' }}
                  onMouseEnter={e => e.target.style.color = '#fff'}
                  onMouseLeave={e => e.target.style.color = '#9CA3AF'}>{label}</Link>
              ))}
            </nav>
          </div>
          <div>
            <h4 style={{ color: '#fff', fontSize: 14, fontWeight: 600, margin: '0 0 16px' }}>Atendimento</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
              <span>Segunda a Sexta, 8h–18h</span>
              <span>contato@livrofacil.com.br</span>
              <span>(11) 3000-0000</span>
            </div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid #1F2937', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, fontSize: 13 }}>
          <span>© {new Date().getFullYear()} LivroFácil. Todos os direitos reservados.</span>
          <span>CNPJ 00.000.000/0001-00</span>
        </div>
      </div>
    </footer>
  )
}
