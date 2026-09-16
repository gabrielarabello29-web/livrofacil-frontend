import React, { useEffect, useMemo, useState } from 'react'
import AdminSidebar from '../../components/AdminSidebar'
import { listarCategorias, listarLivros } from '../../features/livros/api/livrosApi'
import { normalizarLivroDaApi } from '../../features/livros/utils/livroFormatters'

export default function AdminCategorias() {
  const [categorias, setCategorias] = useState([])
  const [livros, setLivros] = useState([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  async function carregar() {
    setCarregando(true)
    setErro('')
    try {
      const [categoriasResposta, livrosResposta] = await Promise.all([listarCategorias(), listarLivros()])
      setCategorias(Array.isArray(categoriasResposta) ? categoriasResposta : [])
      setLivros(Array.isArray(livrosResposta) ? livrosResposta.map(normalizarLivroDaApi) : [])
    } catch (err) {
      setCategorias([])
      setLivros([])
      setErro(err?.mensagem || 'Não foi possível carregar as categorias do backend.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregar() }, [])

  const categoriasExibidas = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR')
    return categorias
      .map((categoria) => ({
        ...categoria,
        livros: livros.filter((livro) => livro.categoriaIds.includes(Number(categoria.id))).length,
      }))
      .filter((categoria) => !termo || String(categoria.nome || '').toLocaleLowerCase('pt-BR').includes(termo))
  }, [busca, categorias, livros])

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <div style={{ padding: '28px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800 }}>Categorias</h1>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>{categorias.length} categorias retornadas pela API</p>
            </div>
            <input className="input-field" value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Buscar categoria..." style={{ maxWidth: 300 }} />
          </div>

          {carregando && <div className="card" style={{ padding: 28, textAlign: 'center' }}>Carregando categorias reais...</div>}
          {!carregando && erro && (
            <div className="card" style={{ padding: 20, color: '#991B1B', background: '#FEF2F2' }}>
              <p>{erro}</p>
              <button type="button" className="btn-primary" onClick={carregar}>Tentar novamente</button>
            </div>
          )}
          {!carregando && !erro && categoriasExibidas.length === 0 && <div className="card" style={{ padding: 28, textAlign: 'center', color: 'var(--text-muted)' }}>Nenhuma categoria cadastrada ou encontrada.</div>}
          {!carregando && !erro && categoriasExibidas.length > 0 && (
            <div className="card" style={{ overflow: 'auto' }}>
              <table className="data-table">
                <thead><tr><th>Categoria</th><th>Livros associados</th><th>Status</th></tr></thead>
                <tbody>{categoriasExibidas.map((categoria) => (
                  <tr key={categoria.id}>
                    <td style={{ fontWeight: 700 }}>{categoria.nome}</td>
                    <td style={{ fontWeight: 600 }}>{categoria.livros}</td>
                    <td><span className="badge badge-blue">Status não informado pela API</span></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
