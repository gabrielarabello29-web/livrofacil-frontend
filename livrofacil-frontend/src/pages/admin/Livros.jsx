import { useState } from 'react'
import { Link } from 'react-router-dom'
import AdminSidebar from '../../components/AdminSidebar'
import { livros_mock } from '../../services/livroService'

export default function AdminLivros() {
  const [busca, setBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('Todos')
  const [pagina, setPagina] = useState(1)
  const POR_PAGINA = 8

  const filtrados = livros_mock.filter(l => {
    if (statusFiltro !== 'Todos' && l.status !== statusFiltro.toUpperCase()) return false
    if (busca && !l.titulo.toLowerCase().includes(busca.toLowerCase()) && !l.autor.toLowerCase().includes(busca.toLowerCase())) return false
    return true
  })

  const total_paginas = Math.ceil(filtrados.length / POR_PAGINA)
  const paginados = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <div style={{ padding: '28px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>Livros</h1>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>{livros_mock.length} livros no acervo</p>
            </div>
            <Link to="/admin/livros/novo" className="btn-primary" style={{ padding: '10px 20px' }}>+ Novo livro</Link>
          </div>

          {/* Filters */}
          <div className="card" style={{ padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <input value={busca} onChange={e => { setBusca(e.target.value); setPagina(1) }} placeholder="Buscar livro ou autor..." className="input-field" style={{ flex: '1 1 240px', minWidth: 0 }} />
            {['Todos', 'Ativo', 'Inativo'].map(s => (
              <button key={s} onClick={() => { setStatusFiltro(s); setPagina(1) }}
                style={{ padding: '7px 16px', borderRadius: 24, border: `1.5px solid ${statusFiltro === s ? 'var(--primary)' : '#E5E7EB'}`, background: statusFiltro === s ? 'var(--primary)' : '#fff', color: statusFiltro === s ? '#fff' : 'var(--text)', fontSize: 13, cursor: 'pointer' }}>
                {s}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Livro</th>
                  <th>Categoria</th>
                  <th>Preço</th>
                  <th>Estoque</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginados.map(livro => (
                  <tr key={livro.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <img src={livro.capa} alt={livro.titulo} style={{ width: 36, height: 48, objectFit: 'cover', borderRadius: 4 }} />
                        <div>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>{livro.titulo}</p>
                          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>{livro.autor}</p>
                        </div>
                      </div>
                    </td>
                    <td><span className="badge badge-purple">{livro.categoria}</span></td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>R$ {livro.preco.toFixed(2).replace('.', ',')}</td>
                    <td>
                      <span style={{ fontWeight: 600, color: livro.estoque < 10 ? '#D97706' : livro.estoque === 0 ? '#EF4444' : 'var(--text)' }}>
                        {livro.estoque}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${livro.status === 'ATIVO' ? 'badge-green' : 'badge-gray'}`}>
                        {livro.status === 'ATIVO' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Link to={`/livros/${livro.id}`} target="_blank" className="btn-ghost" style={{ padding: '5px 10px', fontSize: 12, border: '1px solid #E5E7EB' }}>Ver</Link>
                        <Link to={`/admin/livros/${livro.id}/editar`} className="btn-secondary" style={{ padding: '5px 10px', fontSize: 12 }}>Editar</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {total_paginas > 1 && (
              <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F3F4F6' }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Página {pagina} de {total_paginas}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {Array.from({ length: total_paginas }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => setPagina(p)}
                      style={{ width: 32, height: 32, borderRadius: 6, border: `1px solid ${p === pagina ? 'var(--primary)' : '#E5E7EB'}`, background: p === pagina ? 'var(--primary)' : '#fff', color: p === pagina ? '#fff' : 'var(--text)', fontSize: 13, cursor: 'pointer', fontWeight: p === pagina ? 700 : 400 }}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
