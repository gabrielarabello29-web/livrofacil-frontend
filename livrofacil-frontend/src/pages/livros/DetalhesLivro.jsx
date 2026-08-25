import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import LivroCard from '../../components/LivroCard'
import ChatBot from '../../components/ChatBot'
import { useCarrinho } from '../../context/CarrinhoContext'
import { livros_mock } from '../../services/livroService'

export default function DetalhesLivro() {
  const { id } = useParams()
  const { adicionarItem } = useCarrinho()
  const [livro, setLivro] = useState(null)
  const [quantidade, setQuantidade] = useState(1)
  const [adicionado, setAdicionado] = useState(false)
  const [abaSelecionada, setAbaSelecionada] = useState('descricao')

  useEffect(() => {
    const l = livros_mock.find(l => l.id === Number(id))
    setLivro(l || null)
    window.scrollTo(0, 0)
  }, [id])

  if (!livro) return (
    <div><Header />
      <div style={{ textAlign: 'center', padding: '120px 0' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>📚</div>
        <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 700 }}>Livro não encontrado</h2>
        <Link to="/livros" className="btn-primary" style={{ marginTop: 24 }}>Ver todos os livros</Link>
      </div>
      <Footer />
    </div>
  )

  const relacionados = livros_mock.filter(l => l.categoria === livro.categoria && l.id !== livro.id).slice(0, 4)
  const desconto = livro.precoOriginal ? Math.round((1 - livro.preco / livro.precoOriginal) * 100) : 0

  function handleAdicionar() {
    adicionarItem(livro, quantidade)
    setAdicionado(true)
    setTimeout(() => setAdicionado(false), 2000)
  }

  return (
    <div>
      <Header />
      <main>
        <div className="page-container" style={{ paddingTop: 32, paddingBottom: 80 }}>
          <nav style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28 }}>
            <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Início</Link> ›{' '}
            <Link to="/livros" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Livros</Link> ›{' '}
            <Link to={`/livros?categoria=${encodeURIComponent(livro.categoria)}`} style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>{livro.categoria}</Link> ›{' '}
            <span style={{ color: 'var(--text)' }}>{livro.titulo}</span>
          </nav>

          <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 64, alignItems: 'flex-start' }}>
            {/* Left: image */}
            <div>
              <div style={{ background: '#F5F3FF', borderRadius: 16, overflow: 'hidden', boxShadow: '0 12px 40px rgba(124,58,237,0.15)' }}>
                <img src={livro.capa} alt={livro.titulo} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block' }} />
              </div>
              {desconto > 0 && (
                <div style={{ marginTop: 16, padding: '10px 16px', background: '#D1FAE5', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>🏷️</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#065F46' }}>Você economiza {desconto}% neste livro!</span>
                </div>
              )}
            </div>

            {/* Right: details */}
            <div>
              <span style={{ display: 'inline-block', background: 'var(--primary-light)', color: 'var(--primary)', fontSize: 12, fontWeight: 600, padding: '3px 12px', borderRadius: 20, marginBottom: 14 }}>
                {livro.categoria}
              </span>
              <h1 style={{ margin: '0 0 8px', fontSize: 30, fontWeight: 900, lineHeight: 1.2, color: 'var(--text)' }}>{livro.titulo}</h1>
              <p style={{ margin: '0 0 16px', fontSize: 16, color: 'var(--text-muted)' }}>por <strong style={{ color: 'var(--text)' }}>{livro.autor}</strong></p>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
                <span style={{ color: '#F59E0B', fontSize: 18 }}>{'★'.repeat(Math.floor(livro.avaliacao))}</span>
                <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{livro.avaliacao}</span>
                <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>({livro.avaliacoes?.toLocaleString('pt-BR')} avaliações)</span>
              </div>

              <div style={{ marginBottom: 24 }}>
                {livro.precoOriginal && (
                  <p style={{ margin: '0 0 4px', fontSize: 14, color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                    R$ {livro.precoOriginal.toFixed(2).replace('.', ',')}
                  </p>
                )}
                <p style={{ margin: 0, fontSize: 36, fontWeight: 900, color: 'var(--primary)' }}>
                  R$ {livro.preco.toFixed(2).replace('.', ',')}
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#10B981', fontWeight: 500 }}>
                  ou até 12x de R$ {(livro.preco / 12).toFixed(2).replace('.', ',')} sem juros
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: livro.estoque > 0 ? '#10B981' : '#EF4444', display: 'inline-block' }} />
                <span style={{ fontSize: 14, fontWeight: 500, color: livro.estoque > 0 ? '#065F46' : '#991B1B' }}>
                  {livro.estoque > 10 ? 'Em estoque' : livro.estoque > 0 ? `Apenas ${livro.estoque} unidades` : 'Fora de estoque'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Quantidade:</label>
                <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #E5E7EB', borderRadius: 8, overflow: 'hidden' }}>
                  <button onClick={() => setQuantidade(q => Math.max(1, q - 1))} style={{ padding: '8px 14px', background: '#F9FAFB', border: 'none', cursor: 'pointer', fontSize: 16, fontWeight: 600 }}>−</button>
                  <span style={{ padding: '8px 16px', fontSize: 15, fontWeight: 700, borderLeft: '1px solid #E5E7EB', borderRight: '1px solid #E5E7EB' }}>{quantidade}</span>
                  <button onClick={() => setQuantidade(q => q + 1)} style={{ padding: '8px 14px', background: '#F9FAFB', border: 'none', cursor: 'pointer', fontSize: 16, fontWeight: 600 }}>+</button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
                <button onClick={handleAdicionar} className="btn-primary" style={{ flex: 1, padding: '14px', fontSize: 15, background: adicionado ? '#10B981' : 'var(--primary)' }}>
                  {adicionado ? '✓ Adicionado ao carrinho!' : '🛒 Adicionar ao carrinho'}
                </button>
                <Link to="/checkout" className="btn-secondary" style={{ flex: 1, padding: '14px', fontSize: 15, textAlign: 'center' }}>
                  Comprar agora
                </Link>
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', paddingTop: 24, borderTop: '1px solid #F3F4F6' }}>
                {[['📦', 'Frete grátis acima de R$ 150'], ['🔄', 'Troca em até 7 dias'], ['🔒', 'Compra segura']].map(([icon, txt]) => (
                  <div key={txt} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                    <span>{icon}</span>{txt}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Abas */}
          <div style={{ marginTop: 56 }}>
            <div style={{ display: 'flex', borderBottom: '2px solid #F3F4F6', marginBottom: 28, gap: 4 }}>
              {[['descricao', 'Sobre o livro'], ['detalhes', 'Detalhes técnicos']].map(([key, label]) => (
                <button key={key} onClick={() => setAbaSelecionada(key)}
                  style={{ padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 600, borderBottom: abaSelecionada === key ? '2px solid var(--primary)' : '2px solid transparent', color: abaSelecionada === key ? 'var(--primary)' : 'var(--text-muted)', marginBottom: -2 }}>
                  {label}
                </button>
              ))}
            </div>

            {abaSelecionada === 'descricao' ? (
              <div style={{ maxWidth: 720 }}>
                <p style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--text)', margin: 0 }}>{livro.descricao}</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, maxWidth: 720 }}>
                {[['Páginas', livro.paginas], ['Editora', livro.editora], ['Idioma', livro.idioma], ['Ano', livro.ano], ['ISBN', livro.isbn], ['Categoria', livro.categoria]].map(([label, value]) => (
                  <div key={label} style={{ padding: '16px', background: '#F9F8FF', borderRadius: 10 }}>
                    <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Relacionados */}
          {relacionados.length > 0 && (
            <div style={{ marginTop: 72 }}>
              <h2 style={{ margin: '0 0 28px', fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>Você também pode gostar</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                {relacionados.map(l => <LivroCard key={l.id} livro={l} />)}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
      <ChatBot />
    </div>
  )
}
