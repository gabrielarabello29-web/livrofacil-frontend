import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ChatBot from '../components/ChatBot'

const categorias = [
  { nome: 'Ficção', emoji: '📖', qtd: 247, cor: '#EDE9FE', desc: 'Romances, contos e narrativas imaginativas' },
  { nome: 'Não Ficção', emoji: '🌍', qtd: 183, cor: '#DBEAFE', desc: 'Obras baseadas em fatos e realidade' },
  { nome: 'Desenvolvimento Pessoal', emoji: '🎯', qtd: 312, cor: '#D1FAE5', desc: 'Crescimento, hábitos e produtividade' },
  { nome: 'Negócios', emoji: '💼', qtd: 198, cor: '#FEF3C7', desc: 'Empreendedorismo, finanças e liderança' },
  { nome: 'Tecnologia', emoji: '💻', qtd: 156, cor: '#FCE7F3', desc: 'Programação, IA e inovação digital' },
  { nome: 'Romance', emoji: '💕', qtd: 289, cor: '#FFE4E6', desc: 'Histórias de amor e relacionamentos' },
  { nome: 'Infantil', emoji: '🧸', qtd: 421, cor: '#ECFCCB', desc: 'Para os pequenos leitores em formação' },
  { nome: 'Suspense', emoji: '🔍', qtd: 174, cor: '#F3F4F6', desc: 'Mistérios, thrillers e policiais' },
  { nome: 'Biografias', emoji: '🏆', qtd: 132, cor: '#FFF7ED', desc: 'Vidas inspiradoras e histórias reais' },
]

export default function Categorias() {
  return (
    <div>
      <Header />
      <main>
        <div style={{ background: 'linear-gradient(135deg, #FAF8FF 0%, #F0EBFF 100%)', padding: '48px 0 40px' }}>
          <div className="page-container">
            <nav style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Início</Link> › Categorias
            </nav>
            <h1 style={{ margin: '0 0 8px', fontSize: 32, fontWeight: 800, color: 'var(--text)' }}>Categorias</h1>
            <p style={{ margin: 0, fontSize: 16, color: 'var(--text-muted)' }}>Explore nosso acervo por área de interesse</p>
          </div>
        </div>

        <div className="page-container" style={{ paddingTop: 48, paddingBottom: 80 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {categorias.map(cat => (
              <Link key={cat.nome} to={`/livros?categoria=${encodeURIComponent(cat.nome)}`}
                style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '24px 24px', background: cat.cor, borderRadius: 14, textDecoration: 'none', border: '1px solid transparent', transition: 'all 0.18s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; e.currentTarget.style.borderColor = '#DDD6FE' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'transparent' }}>
                <span style={{ fontSize: 44 }}>{cat.emoji}</span>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{cat.nome}</h3>
                  <p style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.4 }}>{cat.desc}</p>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)' }}>{cat.qtd} livros</span>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
      <ChatBot />
    </div>
  )
}
