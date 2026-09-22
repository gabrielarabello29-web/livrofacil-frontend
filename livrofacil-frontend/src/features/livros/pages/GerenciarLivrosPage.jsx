import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminSidebar from '@/shared/layouts/admin/AdminSidebar'
import { listarLivros, ativarLivro, inativarLivro, buscarEstoque } from '../api/livrosApi'
import { formatarDinheiro, normalizarLivroDaApi } from '../utils/livroFormatters'
import LivroCover from '../components/LivroCover'

export default function GerenciarLivrosPage() {
  const [livros, setLivros] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busca, setBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('Todos')
  const [processandoId, setProcessandoId] = useState(null)
  const [statusError, setStatusError] = useState('')
  const [pagina, setPagina] = useState(1)
  const LIVROS_POR_PAGINA = 12

  async function carregarLivros() {
    setLoading(true)
    setError('')

    try {
      const resposta = await listarLivros()
      const livrosNormalizados = Array.isArray(resposta) ? resposta.map(normalizarLivroDaApi) : []
      const livrosComEstoque = await Promise.all(livrosNormalizados.map(async (livro) => {
        if (livro.estoque !== null || !livro.id) return livro
        try { return { ...livro, estoque: await buscarEstoque(livro.id) } } catch { return livro }
      }))
      setLivros(livrosComEstoque)
    } catch (err) {
      setError(err?.mensagem || 'Não foi possível carregar os livros.')
      setLivros([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarLivros()
  }, [])

  const livrosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()

    return livros.filter((livro) => {
      const statusSelecionado = statusFiltro === 'Todos' || (statusFiltro === 'Ativo' ? livro.ativo : !livro.ativo)
      const textoPesquisavel = [livro.titulo, livro.codigo, livro.autorNome, livro.editoraNome, ...(livro.categoriaNomes || [])].join(' ').toLowerCase()
      const matchBusca = !termo || textoPesquisavel.includes(termo)
      return statusSelecionado && matchBusca
    })
  }, [busca, livros, statusFiltro])

  const totalPaginas = Math.max(1, Math.ceil(livrosFiltrados.length / LIVROS_POR_PAGINA))
  const paginaAtual = Math.min(pagina, totalPaginas)
  const livrosDaPagina = livrosFiltrados.slice((paginaAtual - 1) * LIVROS_POR_PAGINA, paginaAtual * LIVROS_POR_PAGINA)

  async function handleStatusToggle(livro) {
    if (!window.confirm(`Deseja ${livro.ativo ? 'inativar' : 'ativar'} o livro "${livro.titulo}"?`)) {
      return
    }

    setProcessandoId(livro.id)
    setStatusError('')

    try {
      if (livro.ativo) {
        await inativarLivro(livro.id)
      } else {
        await ativarLivro(livro.id)
      }

      await carregarLivros()
    } catch (err) {
      setStatusError(err?.mensagem || 'Não foi possível alterar o status do livro.')
    } finally {
      setProcessandoId(null)
    }
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <div style={{ padding: '28px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>Livros</h1>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>{livros.length} livros cadastrados</p>
            </div>
            <Link to="/admin/livros/novo" className="btn-primary" style={{ padding: '10px 20px' }}>+ Novo livro</Link>
          </div>

          <div className="card" style={{ padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              value={busca}
              onChange={(event) => { setBusca(event.target.value); setPagina(1) }}
              placeholder="Buscar título, código, autor, editora ou categoria..."
              className="input-field"
              style={{ flex: '1 1 240px', minWidth: 0 }}
            />
            {['Todos', 'Ativo', 'Inativo'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => { setStatusFiltro(status); setPagina(1) }}
                style={{ padding: '7px 16px', borderRadius: 24, border: `1.5px solid ${statusFiltro === status ? 'var(--primary)' : '#E5E7EB'}`, background: statusFiltro === status ? 'var(--primary)' : '#fff', color: statusFiltro === status ? '#fff' : 'var(--text)', fontSize: 13, cursor: 'pointer' }}
              >
                {status}
              </button>
            ))}
          </div>

          {loading && (
            <div className="card" style={{ padding: '28px 20px', textAlign: 'center' }}>
              <div className="spinner" style={{ width: 28, height: 28, border: '3px solid #E5E7EB', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 12px' }} />
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>Carregando livros...</p>
            </div>
          )}

          {!loading && error && (
            <div className="card" style={{ padding: '18px 20px', borderColor: '#FECACA', background: '#FEF2F2' }}>
              <strong style={{ color: '#991B1B' }}>{error}</strong>
              <button type="button" className="btn-primary" onClick={carregarLivros} style={{ marginLeft: 12 }}>Tentar novamente</button>
            </div>
          )}

          {!loading && statusError && (
            <div className="card" style={{ padding: '14px 18px', marginBottom: 16, borderColor: '#FECACA', background: '#FEF2F2', color: '#991B1B' }}>
              {statusError}
            </div>
          )}

          {!loading && !error && (
            <div className="card" style={{ overflow: 'hidden' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Livro</th>
                    <th>Código</th>
                    <th>Editora</th>
                    <th>Categorias</th>
                    <th>Preço</th>
                    <th>Disponível</th>
                    <th>Bloqueada</th>
                    <th>Vendida</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {livrosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ textAlign: 'center', padding: 28, color: 'var(--text-muted)' }}>
                        Nenhum livro encontrado para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    livrosDaPagina.map((livro) => (
                      <tr key={livro.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <LivroCover src={livro.imagemUrl} alt={`Capa de ${livro.titulo}`} style={{ width: 36, height: 48, borderRadius: 6, flexShrink: 0 }} />
                            <div>
                              <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>{livro.titulo}</p>
                              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>{livro.autorNome || 'Autor não informado'}</p>
                            </div>
                          </div>
                        </td>
                        <td>{livro.codigo || '—'}</td>
                        <td>{livro.editoraNome || 'Editora não informada'}</td>
                        <td><div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{livro.categoriaNomes?.length ? livro.categoriaNomes.map((nome) => <span key={nome} className="badge badge-gray">{nome}</span>) : '—'}</div></td>
                        <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{formatarDinheiro(livro.valorVenda)}</td>
                        <td>{livro.estoque?.quantidadeDisponivel ?? 'Não cadastrado'}</td>
                        <td>{livro.estoque?.quantidadeBloqueada ?? 'Não cadastrado'}</td>
                        <td>{livro.estoque?.quantidadeVendida ?? 'Não cadastrado'}</td>
                        <td>
                          <span className={`badge ${livro.ativo ? 'badge-green' : 'badge-gray'}`}>{livro.ativo ? 'Ativo' : 'Inativo'}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            <Link to={`/admin/livros/${livro.id}`} className="btn-ghost" style={{ padding: '5px 10px', fontSize: 12, border: '1px solid #E5E7EB' }}>Visualizar</Link>
                            <Link to={`/admin/livros/${livro.id}/editar`} className="btn-secondary" style={{ padding: '5px 10px', fontSize: 12 }}>Editar</Link>
                            <button
                              type="button"
                              className={livro.ativo ? 'btn-danger' : 'btn-primary'}
                              style={{ padding: '5px 10px', fontSize: 12 }}
                              disabled={processandoId === livro.id}
                              onClick={() => handleStatusToggle(livro)}
                            >
                              {processandoId === livro.id ? 'Aguarde...' : (livro.ativo ? 'Inativar' : 'Ativar')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {livrosFiltrados.length > 0 && totalPaginas > 1 && (
                <nav aria-label="Paginação administrativa de livros" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: 16, flexWrap: 'wrap', borderTop: '1px solid var(--border-light)' }}>
                  <button type="button" className="btn-secondary" onClick={() => setPagina((atual) => Math.max(1, atual - 1))} disabled={paginaAtual === 1}>Anterior</button>
                  {Array.from({ length: totalPaginas }, (_, indice) => indice + 1).map((numero) => <button key={numero} type="button" className={numero === paginaAtual ? 'btn-primary' : 'btn-secondary'} onClick={() => setPagina(numero)} style={{ minWidth: 40, paddingLeft: 10, paddingRight: 10 }}>{numero}</button>)}
                  <button type="button" className="btn-secondary" onClick={() => setPagina((atual) => Math.min(totalPaginas, atual + 1))} disabled={paginaAtual === totalPaginas}>Próxima</button>
                  <span style={{ width: '100%', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Página {paginaAtual} de {totalPaginas}</span>
                </nav>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
