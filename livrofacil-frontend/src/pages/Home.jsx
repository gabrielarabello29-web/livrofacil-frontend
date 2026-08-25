import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import LivroCard from '../components/LivroCard'
import ChatBot from '../components/ChatBot'
import { livros_mock } from '../services/livroService'

const beneficios = [
  { icon: '🚚', titulo: 'Frete rápido', desc: 'Para todo o Brasil' },
  { icon: '💳', titulo: 'Parcela em até 12x', desc: 'Sem juros no cartão' },
  { icon: '💸', titulo: '5% no Pix', desc: 'Desconto garantido' },
  { icon: '🔄', titulo: 'Troca garantida', desc: 'Em até 7 dias' },
]

const categorias_destaque = [
  { nome: 'Ficção', emoji: '📖', cor: '#EDE9FE' },
  { nome: 'Negócios', emoji: '💼', cor: '#DBEAFE' },
  { nome: 'Desenvolvimento Pessoal', emoji: '🎯', cor: '#D1FAE5' },
  { nome: 'Tecnologia', emoji: '💻', cor: '#FEF3C7' },
]

export default function Home() {
  const maisVendidos = livros_mock.slice(0, 5)
  const novidades = livros_mock.slice(5, 9)

  return (
    <div>
      <Header />
      <main>
        {/* Hero */}
        <section style={{ background: 'linear-gradient(135deg, #FAF8FF 0%, #F0EBFF 100%)', paddingTop: 64, paddingBottom: 80, overflow: 'hidden' }}>
          <div className="page-container">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
              <div style={{ animation: 'fadeIn 0.5s ease' }}>
                <span style={{ display: 'inline-block', background: 'var(--primary-light)', color: 'var(--primary)', fontSize: 13, fontWeight: 600, padding: '4px 14px', borderRadius: 20, marginBottom: 20 }}>
                  📚 Sua livraria digital favorita
                </span>
                <h1 style={{ fontSize: 46, fontWeight: 900, lineHeight: 1.15, margin: '0 0 20px', color: 'var(--text)' }}>
                  Encontre sua
                  <br />
                  <span style={{ color: 'var(--primary)' }}>próxima grande</span>
                  <br />
                  história
                </h1>
                <p style={{ fontSize: 17, color: 'var(--text-muted)', margin: '0 0 36px', lineHeight: 1.7, maxWidth: 440 }}>
                  Explore milhares de títulos, dos best-sellers aos clássicos atemporais. Entrega rápida, preços especiais e troca garantida.
                </p>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <Link to="/livros" className="btn-primary" style={{ padding: '14px 28px', fontSize: 15 }}>
                    Explorar livros
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                  </Link>
                  <Link to="/categorias" className="btn-secondary" style={{ padding: '14px 28px', fontSize: 15 }}>Ver categorias</Link>
                </div>
                <div style={{ display: 'flex', gap: 32, marginTop: 40 }}>
                  {[['12k+', 'Livros'], ['50k+', 'Clientes'], ['4.9', 'Avaliação']].map(([n, l]) => (
                    <div key={l}>
                      <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--primary)' }}>{n}</p>
                      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>{l}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Book composition */}
              <div style={{ position: 'relative', height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ position: 'absolute', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, transform: 'rotate(-5deg)' }}>
                  {livros_mock.slice(0, 4).map((l, i) => (
                    <Link key={l.id} to={`/livros/${l.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{ width: 110, height: 155, borderRadius: 8, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', transform: i % 2 === 0 ? 'rotate(3deg)' : 'rotate(-2deg)', transition: 'transform 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05) rotate(0)'}
                        onMouseLeave={e => e.currentTarget.style.transform = i % 2 === 0 ? 'rotate(3deg)' : 'rotate(-2deg)'}>
                        <img src={l.capa} alt={l.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefícios */}
        <section style={{ padding: '32px 0', borderBottom: '1px solid #F3F4F6', background: '#fff' }}>
          <div className="page-container">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
              {beneficios.map(b => (
                <div key={b.titulo} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 28 }}>{b.icon}</span>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{b.titulo}</p>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mais vendidos */}
        <section style={{ padding: '64px 0' }}>
          <div className="page-container">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
              <div>
                <h2 style={{ margin: '0 0 6px', fontSize: 26, fontWeight: 800, color: 'var(--text)' }}>🏆 Mais vendidos</h2>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 15 }}>Os títulos preferidos dos nossos leitores</p>
              </div>
              <Link to="/livros" className="btn-secondary" style={{ padding: '8px 18px' }}>Ver todos</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
              {maisVendidos.map(l => <LivroCard key={l.id} livro={l} />)}
            </div>
          </div>
        </section>

        {/* Categories */}
        <section style={{ padding: '0 0 64px', background: 'var(--bg-subtle)' }}>
          <div className="page-container" style={{ paddingTop: 64 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
              <h2 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: 'var(--text)' }}>📂 Explore por categoria</h2>
              <Link to="/categorias" className="btn-secondary" style={{ padding: '8px 18px' }}>Ver todas</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {categorias_destaque.map(c => (
                <Link key={c.nome} to={`/livros?categoria=${encodeURIComponent(c.nome)}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 22px', background: c.cor, borderRadius: 12, textDecoration: 'none', transition: 'transform 0.15s, box-shadow 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.1)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}>
                  <span style={{ fontSize: 32 }}>{c.emoji}</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{c.nome}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Novidades */}
        <section style={{ padding: '64px 0' }}>
          <div className="page-container">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
              <div>
                <h2 style={{ margin: '0 0 6px', fontSize: 26, fontWeight: 800, color: 'var(--text)' }}>✨ Novidades</h2>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 15 }}>Acabaram de chegar ao acervo</p>
              </div>
              <Link to="/livros?novidades=true" className="btn-secondary" style={{ padding: '8px 18px' }}>Ver todos</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {novidades.map(l => <LivroCard key={l.id} livro={l} />)}
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section style={{ margin: '0 0 80px' }}>
          <div className="page-container">
            <div style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)', borderRadius: 20, padding: '48px 56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 800, margin: '0 0 10px' }}>Não sabe o que ler?</h2>
                <p style={{ color: '#DDD6FE', fontSize: 15, margin: 0 }}>Nosso assistente virtual te ajuda a encontrar o livro perfeito para você.</p>
              </div>
              <button onClick={() => {}} className="btn-primary" style={{ background: '#fff', color: 'var(--primary)', padding: '14px 28px', fontSize: 15 }}>
                💬 Falar com assistente
              </button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <ChatBot />
    </div>
  )
}
