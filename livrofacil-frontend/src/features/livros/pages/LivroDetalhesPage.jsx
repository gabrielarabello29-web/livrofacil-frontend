import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'
import ChatBot from '../../../components/ChatBot'
import { buscarLivroPorId } from '../api/livrosApi'
import { formatarDinheiro, normalizarLivroDaApi } from '../utils/livroFormatters'
import LivroCover from '../components/LivroCover'
import LivroEstoque from '../components/LivroEstoque'

export default function LivroDetalhesPage() {
  const { id } = useParams()
  const [livro, setLivro] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let ativo = true

    async function carregarLivro() {
      setLoading(true)
      setError('')

      try {
        const resposta = await buscarLivroPorId(id)
        if (!ativo) return
        setLivro(normalizarLivroDaApi(resposta))
      } catch (err) {
        if (!ativo) return
        setLivro(null)
        setError(err?.mensagem || 'Livro não encontrado.')
      } finally {
        if (ativo) setLoading(false)
      }
    }

    carregarLivro()
    return () => {
      ativo = false
    }
  }, [id])

  if (loading) {
    return (
      <div>
        <Header />
        <div style={{ padding: '80px 24px', textAlign: 'center' }}>
          <div className="spinner" style={{ width: 34, height: 34, border: '3px solid #E5E7EB', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 12px' }} />
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>Carregando detalhes do livro...</p>
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !livro) {
    return (
      <div>
        <Header />
        <div style={{ padding: '100px 24px', textAlign: 'center' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: 24, fontWeight: 800 }}>Livro não encontrado</h2>
          <p style={{ margin: '0 0 22px', color: 'var(--text-muted)' }}>{error || 'Este livro não foi localizado.'}</p>
          <Link to="/livros" className="btn-primary">Voltar ao catálogo</Link>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div>
      <Header />
      <main>
        <div className="page-container" style={{ paddingTop: 32, paddingBottom: 80 }}>
          <nav style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28 }}>
            <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Início</Link> ›{' '}
            <Link to="/livros" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Livros</Link> ›{' '}
            <span style={{ color: 'var(--text)' }}>{livro.titulo}</span>
          </nav>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 340px) 1fr', gap: 48, alignItems: 'flex-start' }}>
            <div>
              <div style={{ background: '#F5F3FF', borderRadius: 18, overflow: 'hidden', boxShadow: '0 12px 40px rgba(124,58,237,0.12)' }}>
                <LivroCover src={livro.imagemUrl} alt={`Capa de ${livro.titulo}`} style={{ width: '100%', aspectRatio: '3 / 4' }} />
              </div>
            </div>

            <div>
              <span className="badge badge-purple" style={{ marginBottom: 14 }}>{livro.grupoPrecificacaoNome || 'Livro'}</span>
              <h1 style={{ margin: '0 0 8px', fontSize: 30, fontWeight: 900, lineHeight: 1.2, color: 'var(--text)' }}>{livro.titulo}</h1>
              <p style={{ margin: '0 0 16px', fontSize: 16, color: 'var(--text-muted)' }}>por <strong style={{ color: 'var(--text)' }}>{livro.autorNome || 'Autor não informado'}</strong></p>

              <div style={{ marginBottom: 24 }}>
                <p style={{ margin: 0, fontSize: 36, fontWeight: 900, color: 'var(--primary)' }}>{formatarDinheiro(livro.valorVenda)}</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: livro.ativo ? '#10B981' : '#EF4444', display: 'inline-block' }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: livro.ativo ? '#065F46' : '#991B1B' }}>
                  {livro.ativo ? 'Disponível no catálogo' : 'Indisponível no catálogo'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 30 }}>
                <div className="card" style={{ padding: 16 }}>
                  <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Autor</p>
                  <p style={{ margin: 0, fontWeight: 600 }}>{livro.autorNome || '—'}</p>
                </div>
                <div className="card" style={{ padding: 16 }}>
                  <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Editora</p>
                  <p style={{ margin: 0, fontWeight: 600 }}>{livro.editoraNome || '—'}</p>
                </div>
                <div className="card" style={{ padding: 16 }}>
                  <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Edição</p>
                  <p style={{ margin: 0, fontWeight: 600 }}>{livro.edicao || '—'}</p>
                </div>
                <div className="card" style={{ padding: 16 }}>
                  <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Páginas</p>
                  <p style={{ margin: 0, fontWeight: 600 }}>{livro.numeroPaginas || '—'}</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
                <Link to="/livros" className="btn-secondary">Voltar ao catálogo</Link>
                <Link to="/admin/livros" className="btn-primary">Área administrativa</Link>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 56 }}>
            <div className="card" style={{ padding: 24 }}>
              <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 800 }}>Detalhes do livro</h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                <div><p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Código</p><p style={{ margin: 0 }}>{livro.codigo || '—'}</p></div>
                <div><p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>ISBN</p><p style={{ margin: 0 }}>{livro.isbn || '—'}</p></div>
                <div><p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Código de barras</p><p style={{ margin: 0 }}>{livro.codigoBarras || '—'}</p></div>
                <div><p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ano</p><p style={{ margin: 0 }}>{livro.ano || '—'}</p></div>
                <div><p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Grupo</p><p style={{ margin: 0 }}>{livro.grupoPrecificacaoNome || '—'}</p></div>
                <div><p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</p><p style={{ margin: 0 }}>{livro.ativo ? 'Ativo' : 'Inativo'}</p></div>
              </div>

              <div style={{ marginTop: 24 }}>
                <h3 style={{ margin: '0 0 10px', fontSize: 16, fontWeight: 700 }}>Sinopse</h3>
                <p style={{ margin: 0, lineHeight: 1.8, color: 'var(--text)' }}>{livro.sinopse || 'Sinopse não informada.'}</p>
              </div>

              <div style={{ marginTop: 24 }}>
                <h3 style={{ margin: '0 0 10px', fontSize: 16, fontWeight: 700 }}>Categorias</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {(livro.categoriaNomes || []).length > 0
                    ? livro.categoriaNomes.map((categoria) => <span key={categoria} className="badge badge-gray">{categoria}</span>)
                    : <span style={{ color: 'var(--text-muted)' }}>Nenhuma categoria informada.</span>}
                </div>
              </div>

              <div style={{ marginTop: 24 }}>
                <h3 style={{ margin: '0 0 10px', fontSize: 16, fontWeight: 700 }}>Dimensões</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
                  <div><p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Altura</p><p style={{ margin: 0 }}>{livro.dimensao?.altura ? `${livro.dimensao.altura} cm` : '—'}</p></div>
                  <div><p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Largura</p><p style={{ margin: 0 }}>{livro.dimensao?.largura ? `${livro.dimensao.largura} cm` : '—'}</p></div>
                  <div><p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Profundidade</p><p style={{ margin: 0 }}>{livro.dimensao?.profundidade ? `${livro.dimensao.profundidade} cm` : '—'}</p></div>
                  <div><p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Peso</p><p style={{ margin: 0 }}>{livro.dimensao?.peso ? `${livro.dimensao.peso} kg` : '—'}</p></div>
                </div>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 20 }}>
            <LivroEstoque livroId={livro.id} />
          </div>
        </div>
      </main>
      <Footer />
      <ChatBot />
    </div>
  )
}
