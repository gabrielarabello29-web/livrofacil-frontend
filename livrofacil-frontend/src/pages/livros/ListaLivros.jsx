import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import LivroCard from '../../components/LivroCard'
import ChatBot from '../../components/ChatBot'
import { livros_mock } from '../../services/livroService'

const categorias = ['Todas', 'Ficção', 'Não Ficção', 'Desenvolvimento Pessoal', 'Negócios', 'Tecnologia', 'Romance', 'Infantil', 'Suspense', 'Biografias']
const ordenacoes = [
  { value: 'relevante', label: 'Mais relevantes' },
  { value: 'menor', label: 'Menor preço' },
  { value: 'maior', label: 'Maior preço' },
  { value: 'vendidos', label: 'Mais vendidos' },
  { value: 'recentes', label: 'Mais recentes' },
]

export default function ListaLivros() {
  const [params] = useSearchParams()
  const [busca, setBusca] = useState(params.get('busca') || '')
  const [categoria, setCategoria] = useState(params.get('categoria') || 'Todas')
  const [ordenacao, setOrdenacao] = useState('relevante')
  const [precoMax, setPrecoMax] = useState(200)

  const filtrados = livros_mock
    .filter(l => {
      if (categoria !== 'Todas' && l.categoria !== categoria) return false
      if (busca && !l.titulo.toLowerCase().includes(busca.toLowerCase()) && !l.autor.toLowerCase().includes(busca.toLowerCase())) return false
      if (l.preco > precoMax) return false
      return true
    })
    .sort((a, b) => {
      if (ordenacao === 'menor') return a.preco - b.preco
      if (ordenacao === 'maior') return b.preco - a.preco
      if (ordenacao === 'vendidos') return b.avaliacoes - a.avaliacoes
      return 0
    })

  return (
    <div>
      <Header />
      <main>
        <div style={{ background: 'linear-gradient(135deg, #FAF8FF 0%, #F0EBFF 100%)', padding: '40px 0 36px' }}>
          <div className="page-container">
            <nav style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
              <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Início</Link> › Livros
            </nav>
            <h1 style={{ margin: '0 0 16px', fontSize: 28, fontWeight: 800, color: 'var(--text)' }}>Livros</h1>
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por título, autor ou ISBN..."
              style={{ width: '100%', maxWidth: 480, padding: '10px 16px', border: '1.5px solid #DDD6FE', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff' }}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor = '#DDD6FE'}
            />
          </div>
        </div>

        <div className="page-container" style={{ paddingTop: 32, paddingBottom: 80 }}>
          <div style={{ display: 'flex', gap: 32 }}>
            {/* Filters */}
            <aside style={{ width: 220, flexShrink: 0 }}>
              <div style={{ position: 'sticky', top: 80, display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div>
                  <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Categoria</h3>
                  {categorias.map(c => (
                    <button key={c} onClick={() => setCategoria(c)}
                      style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 10px', borderRadius: 7, border: 'none', background: categoria === c ? 'var(--primary-light)' : 'transparent', color: categoria === c ? 'var(--primary)' : 'var(--text)', fontSize: 14, fontWeight: categoria === c ? 600 : 400, cursor: 'pointer', marginBottom: 2 }}>
                      {c}
                    </button>
                  ))}
                </div>
                <div>
                  <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Preço máximo</h3>
                  <input type="range" min={20} max={200} value={precoMax} onChange={e => setPrecoMax(+e.target.value)}
                    style={{ width: '100%', accentColor: 'var(--primary)' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                    <span>R$ 20</span><span style={{ fontWeight: 700, color: 'var(--primary)' }}>R$ {precoMax}</span>
                  </div>
                </div>
              </div>
            </aside>

            {/* Results */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>
                  <strong style={{ color: 'var(--text)' }}>{filtrados.length}</strong> livros encontrados
                </p>
                <select value={ordenacao} onChange={e => setOrdenacao(e.target.value)}
                  style={{ padding: '8px 14px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff', cursor: 'pointer' }}>
                  {ordenacoes.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              {filtrados.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0' }}>
                  <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
                  <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>Nenhum livro encontrado</h3>
                  <p style={{ margin: '0 0 24px', color: 'var(--text-muted)' }}>Tente ajustar os filtros ou a busca</p>
                  <button onClick={() => { setBusca(''); setCategoria('Todas'); setPrecoMax(200) }} className="btn-primary">Limpar filtros</button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                  {filtrados.map(l => <LivroCard key={l.id} livro={l} />)}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <ChatBot />
    </div>
  )
}
