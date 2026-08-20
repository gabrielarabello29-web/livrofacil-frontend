import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import AdminSidebar from '../../components/AdminSidebar'
import { livros_mock } from '../../services/livroService'

const categorias = ['Ficção', 'Não Ficção', 'Desenvolvimento Pessoal', 'Negócios', 'Tecnologia', 'Romance', 'Infantil', 'Suspense', 'Biografias']

export default function CadastroLivro() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdicao = !!id
  const [form, setForm] = useState({
    titulo: '', isbn: '', edicao: '1', ano: new Date().getFullYear(), paginas: '', sinopse: '',
    autor: '', editora: '', categoria: '', grupo: '', codigoBarras: '',
    largura: '', altura: '', profundidade: '', peso: '', capa: '', status: 'ATIVO', preco: '', precoOriginal: ''
  })

  useEffect(() => {
    if (isEdicao) {
      const l = livros_mock.find(l => l.id === Number(id))
      if (l) setForm({ titulo: l.titulo, isbn: l.isbn || '', edicao: '1', ano: l.ano, paginas: l.paginas, sinopse: l.descricao, autor: l.autor, editora: l.editora, categoria: l.categoria, grupo: l.grupo || '', codigoBarras: '', largura: '', altura: '', profundidade: '', peso: '', capa: l.capa, status: l.status, preco: l.preco, precoOriginal: l.precoOriginal || '' })
    }
  }, [id])

  function set(field) { return e => setForm(p => ({ ...p, [field]: e.target.value })) }

  function handleSubmit(e) {
    e.preventDefault()
    navigate('/admin/livros')
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <div style={{ padding: '28px 32px', maxWidth: 900 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <Link to="/admin/livros" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 13 }}>← Voltar para Livros</Link>
          </div>
          <h1 style={{ margin: '0 0 28px', fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>
            {isEdicao ? 'Editar Livro' : 'Novo Livro'}
          </h1>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Dados principais */}
              <div className="card" style={{ padding: 24 }}>
                <h2 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Dados do livro</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label className="label">Título *</label>
                    <input className="input-field" value={form.titulo} onChange={set('titulo')} placeholder="Título completo do livro" required />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                    <div><label className="label">ISBN</label><input className="input-field" value={form.isbn} onChange={set('isbn')} placeholder="978-0000000000" /></div>
                    <div><label className="label">Edição</label><input className="input-field" value={form.edicao} onChange={set('edicao')} placeholder="1ª" /></div>
                    <div><label className="label">Ano</label><input className="input-field" type="number" value={form.ano} onChange={set('ano')} /></div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div><label className="label">Autor *</label><input className="input-field" value={form.autor} onChange={set('autor')} required /></div>
                    <div><label className="label">Editora</label><input className="input-field" value={form.editora} onChange={set('editora')} /></div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label className="label">Categoria</label>
                      <select className="input-field" value={form.categoria} onChange={set('categoria')}>
                        <option value="">Selecione</option>
                        {categorias.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div><label className="label">Páginas</label><input className="input-field" type="number" value={form.paginas} onChange={set('paginas')} /></div>
                  </div>
                  <div>
                    <label className="label">Sinopse</label>
                    <textarea className="input-field" value={form.sinopse} onChange={set('sinopse')} rows={4} style={{ resize: 'vertical' }} placeholder="Descrição do livro..." />
                  </div>
                </div>
              </div>

              {/* Preços */}
              <div className="card" style={{ padding: 24 }}>
                <h2 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Preço</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                  <div><label className="label">Preço de venda *</label><input className="input-field" type="number" step="0.01" value={form.preco} onChange={set('preco')} placeholder="0,00" required /></div>
                  <div><label className="label">Preço original (riscado)</label><input className="input-field" type="number" step="0.01" value={form.precoOriginal} onChange={set('precoOriginal')} placeholder="0,00" /></div>
                  <div><label className="label">Grupo de precificação</label><input className="input-field" value={form.grupo} onChange={set('grupo')} placeholder="Autoajuda" /></div>
                </div>
              </div>

              {/* Imagem e status */}
              <div className="card" style={{ padding: 24 }}>
                <h2 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Imagem e status</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'flex-start' }}>
                  <div>
                    <label className="label">URL da capa</label>
                    <input className="input-field" value={form.capa} onChange={set('capa')} placeholder="https://..." />
                  </div>
                  <div>
                    <label className="label">Status</label>
                    <select className="input-field" value={form.status} onChange={set('status')}>
                      <option value="ATIVO">Ativo</option>
                      <option value="INATIVO">Inativo</option>
                    </select>
                  </div>
                </div>
                {form.capa && (
                  <div style={{ marginTop: 16 }}>
                    <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--text-muted)' }}>Pré-visualização:</p>
                    <img src={form.capa} alt="Preview" style={{ height: 120, borderRadius: 6, objectFit: 'cover' }} />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => navigate('/admin/livros')} className="btn-secondary" style={{ padding: '11px 24px' }}>Cancelar</button>
                <button type="submit" className="btn-primary" style={{ padding: '11px 24px' }}>
                  {isEdicao ? 'Salvar alterações' : 'Cadastrar livro'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
