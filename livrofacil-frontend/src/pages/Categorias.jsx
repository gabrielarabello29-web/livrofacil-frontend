import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ChatBot from '../components/ChatBot'
import { listarCategorias, listarLivrosAtivos } from '../features/livros/api/livrosApi'
import { normalizarLivroDaApi } from '../features/livros/utils/livroFormatters'

const CORES = ['#EDE9FE', '#DBEAFE', '#D1FAE5', '#FEF3C7', '#FCE7F3', '#FFE4E6', '#ECFCCB', '#F3F4F6', '#FFF7ED']

export default function Categorias() {
  const [categorias, setCategorias] = useState([])
  const [livros, setLivros] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  async function carregar() {
    setCarregando(true)
    setErro('')
    try {
      const [categoriasResposta, livrosResposta] = await Promise.all([listarCategorias(), listarLivrosAtivos()])
      setCategorias(Array.isArray(categoriasResposta) ? categoriasResposta : [])
      setLivros(Array.isArray(livrosResposta) ? livrosResposta.map(normalizarLivroDaApi).filter((livro) => livro.ativo) : [])
    } catch (err) {
      setCategorias([])
      setLivros([])
      setErro(err?.mensagem || 'Não foi possível carregar as categorias reais.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregar() }, [])

  const categoriasComContagem = useMemo(() => categorias.map((categoria, index) => ({
    ...categoria,
    quantidade: livros.filter((livro) => livro.categoriaIds.includes(Number(categoria.id))).length,
    cor: CORES[index % CORES.length],
  })), [categorias, livros])

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
            <p style={{ margin: 0, fontSize: 16, color: 'var(--text-muted)' }}>Categorias disponíveis no catálogo ativo.</p>
          </div>
        </div>

        <div className="page-container" style={{ paddingTop: 48, paddingBottom: 80 }}>
          {carregando && <div className="card" style={{ padding: 32, textAlign: 'center' }}>Carregando categorias...</div>}
          {!carregando && erro && (
            <div className="card" style={{ padding: 24, textAlign: 'center', color: '#991B1B' }}>
              <p>{erro}</p>
              <button type="button" className="btn-primary" onClick={carregar}>Tentar novamente</button>
            </div>
          )}
          {!carregando && !erro && categoriasComContagem.length === 0 && (
            <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Nenhuma categoria cadastrada.</div>
          )}
          {!carregando && !erro && categoriasComContagem.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              {categoriasComContagem.map((categoria) => (
                <Link key={categoria.id} to={`/livros?categoria=${encodeURIComponent(categoria.nome)}`} style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '24px', background: categoria.cor, borderRadius: 14, textDecoration: 'none', border: '1px solid transparent' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{categoria.nome}</h3>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)' }}>{categoria.quantidade} {categoria.quantidade === 1 ? 'livro ativo' : 'livros ativos'}</span>
                  </div>
                  <span aria-hidden="true" style={{ fontSize: 24, color: '#9CA3AF' }}>›</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
      <ChatBot />
    </div>
  )
}
