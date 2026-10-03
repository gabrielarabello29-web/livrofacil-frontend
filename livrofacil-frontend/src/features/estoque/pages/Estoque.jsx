import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminSidebar from '@/shared/layouts/admin/AdminSidebar'
import LivroCover from '@/features/livros/components/LivroCover'
import { buscarEstoque, listarLivros } from '@/features/livros/api/livrosApi'
import { normalizarLivroDaApi } from '@/features/livros/utils/livroFormatters'

export default function AdminEstoque() {
  const [livros, setLivros] = useState([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  async function carregar() {
    setCarregando(true)
    setErro('')
    try {
      const resposta = await listarLivros()
      const livrosBase = Array.isArray(resposta) ? resposta.map(normalizarLivroDaApi) : []
      const comEstoque = await Promise.all(livrosBase.map(async (livro) => {
        if (livro.estoque !== null) return livro
        try { return { ...livro, estoque: await buscarEstoque(livro.id) } } catch { return livro }
      }))
      setLivros(comEstoque)
    } catch (err) {
      setErro(err?.mensagem || 'Não foi possível carregar o estoque real.')
      setLivros([])
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregar() }, [])

  const filtrados = livros.filter((livro) => !busca.trim() || `${livro.titulo} ${livro.codigo}`.toLowerCase().includes(busca.trim().toLowerCase()))

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <div style={{ padding: '28px 32px' }}>
          <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800 }}>Estoque</h1>
          <p style={{ margin: '0 0 24px', color: 'var(--text-muted)' }}>Quantidades carregadas do banco de dados.</p>
          <div className="card" style={{ padding: '14px 20px', marginBottom: 16 }}>
            <input value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Buscar livro ou código..." className="input-field" style={{ maxWidth: 360 }} />
          </div>
          {carregando && <div className="card" style={{ padding: 24 }}>Carregando estoque...</div>}
          {!carregando && erro && <div className="card" style={{ padding: 20, color: '#991B1B' }}>{erro} <button className="btn-primary" onClick={carregar}>Tentar novamente</button></div>}
          {!carregando && !erro && filtrados.length === 0 && <div className="card" style={{ padding: 24, color: 'var(--text-muted)' }}>Nenhum livro encontrado.</div>}
          {!carregando && !erro && filtrados.length > 0 && (
            <div className="card" style={{ overflow: 'auto' }}>
              <table className="data-table">
                <thead><tr><th>Livro</th><th>Disponível</th><th>Bloqueada</th><th>Vendida</th><th>Ação</th></tr></thead>
                <tbody>{filtrados.map((livro) => <tr key={livro.id}>
                  <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><LivroCover src={livro.imagemUrl} alt={`Capa de ${livro.titulo}`} style={{ width: 32, height: 42, borderRadius: 4 }} /><span>{livro.titulo}</span></div></td>
                  <td>{livro.estoque?.quantidadeDisponivel ?? 'Não cadastrado'}</td>
                  <td>{livro.estoque?.quantidadeBloqueada ?? 'Não cadastrado'}</td>
                  <td>{livro.estoque?.quantidadeVendida ?? 'Não cadastrado'}</td>
                  <td><Link className="btn-secondary" to={`/admin/livros/${livro.id}/editar`}>Editar estoque</Link></td>
                </tr>)}</tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
