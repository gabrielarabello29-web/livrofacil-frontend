import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '@/shared/components/Header'
import Footer from '@/shared/components/Footer'
import LivroCard from '@/features/livros/components/LivroCard'
import ChatBot from '@/features/ia/components/ChatBot'
import { listarCatalogo } from '@/features/catalogo/api/catalogoApi'
import { normalizarLivroDaApi } from '@/features/livros/utils/livroFormatters'
import LivroCover from '@/features/livros/components/LivroCover'

const beneficios = [
  { icon: 'truck', titulo: 'Entrega rápida', desc: 'Para todo o Brasil' },
  { icon: 'tag', titulo: 'Preços especiais', desc: 'Ofertas imperdíveis' },
  { icon: 'shield', titulo: 'Compra segura', desc: 'Seus dados protegidos' },
  { icon: 'headset', titulo: 'Atendimento dedicado', desc: 'Sempre que precisar' },
]

function BeneficioIcon({ tipo }) {
  const paths = {
    truck: <><path d="M3 6h11v9H3z" /><path d="M14 9h4l3 3v3h-7z" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /></>,
    tag: <><path d="M20 13 13 20 4 11V4h7z" /><circle cx="8" cy="8" r="1" /></>,
    shield: <><path d="M12 3 20 6v5c0 5-3.4 8.2-8 10-4.6-1.8-8-5-8-10V6z" /><path d="m8.5 12 2.2 2.2 4.8-5" /></>,
    headset: <><path d="M4 13a8 8 0 0 1 16 0" /><path d="M4 13v4h3v-4zM17 13v4h3v-4z" /><path d="M20 17c0 2-2 3-4 3h-1" /></>,
  }
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[tipo]}</svg>
}

export default function Home() {
  const [livros, setLivros] = useState([])
  const [categorias, setCategorias] = useState([])

  useEffect(() => {
    listarCatalogo().then((livrosResposta) => {
      setLivros(Array.isArray(livrosResposta) ? livrosResposta.map(normalizarLivroDaApi) : [])
      const nomes = [...new Set((Array.isArray(livrosResposta) ? livrosResposta : []).flatMap((livro) => livro.categoriaNomes || []))]
      setCategorias(nomes.map((nome) => ({ id: nome, nome })))
    }).catch(() => {
      setLivros([])
      setCategorias([])
    })
  }, [])

  const maisVendidos = livros.slice(0, 5)
  const novidades = livros.slice(5, 9)
  const livrosHero = [
    livros.find((livro) => livro.titulo?.toLocaleLowerCase('pt-BR').includes('1984')),
    livros.find((livro) => livro.titulo?.toLocaleLowerCase('pt-BR').includes('hobbit')),
    livros.find((livro) => livro.titulo?.toLocaleLowerCase('pt-BR').includes('harry potter')),
  ].filter(Boolean)

  return (
    <div>
      <Header />
      <main>
        {/* Hero */}
        <section className="home-hero">
          <div className="page-container">
            <div className="home-hero-layout">
              <div className="home-hero-copy">
                <span className="home-hero-kicker">📖 Mais que livros</span>
                <h1>
                  Livros que
                  <br />
                  <span>te acompanham</span>
                  <br />
                  em cada fase.
                </h1>
                <p>
                  Encontre best-sellers, clássicos e novidades em um só lugar. Com entrega rápida, preços justos e uma experiência feita para quem ama ler.
                </p>
                <div className="home-hero-actions">
                  <Link to="/livros" className="btn-primary">
                    Explorar livros
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                  </Link>
                  <Link to="/categorias" className="btn-secondary">Ver categorias</Link>
                </div>
                <div className="home-hero-stats">
                  <div><strong>12k+</strong><span>Livros</span></div>
                  <div><strong>50k+</strong><span>Clientes</span></div>
                  <div><strong>4.9</strong><span>Avaliação média</span></div>
                </div>
              </div>

              <div className="home-hero-art" aria-label="Livros em destaque">
                <div className="home-hero-glow" />
                <div className="home-hero-foliage" aria-hidden="true">
                  <i className="home-hero-leaf home-hero-leaf-1" />
                  <i className="home-hero-leaf home-hero-leaf-2" />
                  <i className="home-hero-leaf home-hero-leaf-3" />
                  <i className="home-hero-leaf home-hero-leaf-4" />
                  <i className="home-hero-leaf home-hero-leaf-5" />
                </div>
                <div className="home-hero-vase" aria-hidden="true" />
                <div className="home-hero-books">
                  {livrosHero.map((l, i) => (
                    <Link key={l.id} to={`/livros/${l.id}`} className={`home-hero-book home-hero-book-${i + 1}`}>
                      <LivroCover src={l.imagemUrl} alt={`Capa de ${l.titulo}`} />
                    </Link>
                  ))}
                </div>
                <div className="home-hero-pedestal" />
              </div>
            </div>
          </div>
        </section>

        {/* Benefícios */}
        <section className="home-benefits">
          <div className="page-container">
            <div className="home-benefits-grid">
              {beneficios.map(b => (
                <div key={b.titulo} className="home-benefit">
                  <span><BeneficioIcon tipo={b.icon} /></span>
                  <div>
                    <p>{b.titulo}</p>
                    <small>{b.desc}</small>
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
            <div className="home-books-grid">
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
            <div className="home-books-grid">
              {categorias.map(c => (
                <Link key={c.nome} to={`/livros?categoria=${encodeURIComponent(c.nome)}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 22px', background: c.cor, borderRadius: 12, textDecoration: 'none', transition: 'transform 0.15s, box-shadow 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.1)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}>
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
