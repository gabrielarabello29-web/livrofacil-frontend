import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'
import ChatBot from '../../../components/ChatBot'
import LivroCover from '../components/LivroCover'
import { formatarDinheiro } from '../utils/livroFormatters'
import { listarLivrosAtivos, buscarLivrosPorTitulo, buscarEstoque } from '../api/livrosApi'
import { normalizarLivroDaApi } from '../utils/livroFormatters'

export default function LivrosPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const termoInicial = searchParams.get('busca') || ''
  const categoriaInicial = searchParams.get('categoria') || ''
  const paginaInicial = Number(searchParams.get('pagina') || 1)
  const [termoBusca, setTermoBusca] = useState(termoInicial)
  const [buscaAplicada, setBuscaAplicada] = useState(termoInicial)
  const [livros, setLivros] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pagina, setPagina] = useState(Number.isInteger(paginaInicial) && paginaInicial > 0 ? paginaInicial : 1)
  const requisicaoRef = useRef(0)
  const LIVROS_POR_PAGINA = 12

  const carregarLivros = async (busca) => {
    const requisicaoAtual = ++requisicaoRef.current
    setLoading(true)
    setError('')

    try {
      const resposta = busca
        ? await buscarLivrosPorTitulo(busca)
        : await listarLivrosAtivos()

      const itens = Array.isArray(resposta) ? resposta : []
      const ativos = itens.map(normalizarLivroDaApi).filter((livro) => livro.ativo)
      const comEstoque = await Promise.all(ativos.map(async (livro) => {
        if (livro.estoque !== null || !livro.id) return livro
        try { return { ...livro, estoque: await buscarEstoque(livro.id) } } catch { return livro }
      }))
      if (requisicaoAtual !== requisicaoRef.current) return
      setLivros(comEstoque)
    } catch (err) {
      if (requisicaoAtual !== requisicaoRef.current) return
      setLivros([])
      setError(err?.mensagem || 'Não foi possível carregar os livros no momento.')
    } finally {
      if (requisicaoAtual === requisicaoRef.current) setLoading(false)
    }
  }

  useEffect(() => {
    carregarLivros(buscaAplicada.trim())
  }, [buscaAplicada, categoriaInicial])

  useEffect(() => {
    if (termoInicial !== termoBusca) {
      setTermoBusca(termoInicial)
    }
    if (termoInicial !== buscaAplicada) {
      setBuscaAplicada(termoInicial)
    }
    setPagina(Number.isInteger(paginaInicial) && paginaInicial > 0 ? paginaInicial : 1)
  }, [paginaInicial, termoInicial])

  const livrosFiltrados = useMemo(() => {
    if (!categoriaInicial) return livros
    const normalizarTexto = (texto) => String(texto || '').trim().toLocaleLowerCase('pt-BR')
    const categoriaNormalizada = normalizarTexto(categoriaInicial)
    return livros.filter((livro) => (livro.categoriaNomes || []).some((nome) => normalizarTexto(nome) === categoriaNormalizada))
  }, [categoriaInicial, livros])

  const totalPaginas = Math.max(1, Math.ceil(livrosFiltrados.length / LIVROS_POR_PAGINA))
  const paginaAtual = Math.min(pagina, totalPaginas)
  const livrosDaPagina = livrosFiltrados.slice((paginaAtual - 1) * LIVROS_POR_PAGINA, paginaAtual * LIVROS_POR_PAGINA)

  function mudarPagina(novaPagina) {
    const paginaValida = Math.max(1, Math.min(novaPagina, totalPaginas))
    setPagina(paginaValida)
    const parametros = {}
    if (termoBusca.trim()) parametros.busca = termoBusca.trim()
    if (categoriaInicial) parametros.categoria = categoriaInicial
    if (paginaValida > 1) parametros.pagina = String(paginaValida)
    setSearchParams(parametros)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const onSubmitBusca = (event) => {
    event.preventDefault()
    const valor = termoBusca.trim()
    const parametros = {}
    if (valor) parametros.busca = valor
    if (categoriaInicial) parametros.categoria = categoriaInicial
    setSearchParams(parametros)
    setPagina(1)
    setBuscaAplicada(valor)
  }

  const limparBusca = () => {
    setTermoBusca('')
    setSearchParams({})
    setPagina(1)
    setBuscaAplicada('')
  }

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

            <form onSubmit={onSubmitBusca} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                value={termoBusca}
                onChange={(event) => setTermoBusca(event.target.value)}
                placeholder="Buscar por título..."
                style={{ width: '100%', maxWidth: 480, padding: '10px 16px', border: '1.5px solid #DDD6FE', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff' }}
              />
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Pesquisando...' : 'Pesquisar'}
              </button>
              <button type="button" className="btn-secondary" onClick={limparBusca} disabled={loading}>
                Limpar
              </button>
            </form>
          </div>
        </div>

        <div className="page-container" style={{ paddingTop: 32, paddingBottom: 80 }}>
          {loading && (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <div className="spinner" style={{ width: 32, height: 32, border: '3px solid #E5E7EB', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 12px' }} />
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>Carregando livros...</p>
            </div>
          )}

          {!loading && error && (
            <div className="card" style={{ padding: '28px 20px', textAlign: 'center', maxWidth: 620, margin: '0 auto' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 20, fontWeight: 800 }}>Não foi possível carregar o catálogo</h3>
              <p style={{ margin: '0 0 20px', color: 'var(--text-muted)' }}>{error}</p>
              <button className="btn-primary" onClick={() => carregarLivros(termoBusca.trim())}>Tentar novamente</button>
            </div>
          )}

          {!loading && !error && livrosFiltrados.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
              <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>Nenhum livro encontrado</h3>
              <p style={{ margin: '0 0 24px', color: 'var(--text-muted)' }}>Tente outra busca ou limpe os filtros.</p>
              <button onClick={limparBusca} className="btn-primary">Limpar busca</button>
            </div>
          )}

          {!loading && !error && livrosFiltrados.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
              {livrosDaPagina.map((livro) => (
                <div key={livro.id} className="card" style={{ overflow: 'hidden', padding: 0 }}>
                  <Link to={`/livros/${livro.id}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ aspectRatio: '3 / 4', background: '#F5F3FF', overflow: 'hidden' }}>
                      <LivroCover src={livro.imagemUrl} alt={`Capa de ${livro.titulo}`} style={{ width: '100%', height: '100%' }} />
                    </div>
                    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                      <span className="badge badge-purple">{livro.grupoPrecificacaoNome || 'Livro'}</span>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{livro.titulo}</h3>
                      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>{livro.autorNome || 'Autor não informado'}</p>
                      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>{livro.editoraNome || 'Editora não informada'}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                        <strong style={{ color: 'var(--primary)', fontSize: 18 }}>{formatarDinheiro(livro.valorVenda)}</strong>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Ed. {livro.edicao}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
                        <span>{livro.numeroPaginas || 0} páginas</span>
                        <span>{livro.estoque ? `${livro.estoque.quantidadeDisponivel} disponíveis` : 'Estoque não cadastrado'}</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                        {(livro.categoriaNomes || []).slice(0, 3).map((categoriaNome) => (
                          <span key={categoriaNome} className="badge badge-gray">{categoriaNome}</span>
                        ))}
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && livrosFiltrados.length > 0 && totalPaginas > 1 && (
            <nav aria-label="Paginação do catálogo" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 32, flexWrap: 'wrap' }}>
              <button type="button" className="btn-secondary" onClick={() => mudarPagina(paginaAtual - 1)} disabled={paginaAtual === 1}>Anterior</button>
              {Array.from({ length: totalPaginas }, (_, indice) => indice + 1).map((numeroPagina) => (
                <button
                  key={numeroPagina}
                  type="button"
                  aria-current={numeroPagina === paginaAtual ? 'page' : undefined}
                  onClick={() => mudarPagina(numeroPagina)}
                  className={numeroPagina === paginaAtual ? 'btn-primary' : 'btn-secondary'}
                  style={{ minWidth: 40, paddingLeft: 10, paddingRight: 10 }}
                >
                  {numeroPagina}
                </button>
              ))}
              <button type="button" className="btn-secondary" onClick={() => mudarPagina(paginaAtual + 1)} disabled={paginaAtual === totalPaginas}>Próxima</button>
              <span style={{ width: '100%', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Página {paginaAtual} de {totalPaginas}</span>
            </nav>
          )}
        </div>
      </main>
      <Footer />
      <ChatBot />
    </div>
  )
}
