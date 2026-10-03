import React from 'react'
import { Link, useParams } from 'react-router-dom'
import AdminSidebar from '@/shared/layouts/admin/AdminSidebar'
import LivroEstoque from '../components/LivroEstoque'

export default function LivroEstoquePage() {
  const { id } = useParams()

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <div style={{ padding: '28px 32px', maxWidth: 760 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Estoque do livro</h1>
              <p style={{ margin: '4px 0 0', color: 'var(--text-muted)' }}>Consulta e atualização administrativa.</p>
            </div>
            <Link to={`/admin/livros/${id}/editar`} className="btn-secondary">Voltar para edição</Link>
          </div>
          <LivroEstoque livroId={id} editavel />
        </div>
      </div>
    </div>
  )
}
