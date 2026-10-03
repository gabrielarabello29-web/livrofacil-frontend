import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AdminSidebar from '@/shared/layouts/admin/AdminSidebar'
import LivroForm from '../components/LivroForm'
import {
  buscarLivroPorId,
  criarLivro,
  atualizarLivro,
  listarAutores,
  listarEditoras,
  listarCategorias,
  listarGruposPrecificacao,
} from '../api/livrosApi'
import { getInitialLivroForm, normalizarLivroDaApi } from '../utils/livroFormatters'
import LivroEstoque from '../components/LivroEstoque'
import { mensagemDeApi, normalizarErrosDeCampo } from '@/shared/api/errorUtils'

export default function LivroFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = Boolean(id)
  const [initialValues, setInitialValues] = useState(getInitialLivroForm())
  const [loading, setLoading] = useState(isEditing)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiErrors, setApiErrors] = useState({})
  const [opcoes, setOpcoes] = useState({ autores: [], editoras: [], categorias: [], grupos: [] })
  const [opcoesLoading, setOpcoesLoading] = useState(true)
  const [opcoesError, setOpcoesError] = useState('')

  const tituloPagina = useMemo(() => (isEditing ? 'Editar livro' : 'Novo livro'), [isEditing])

  useEffect(() => {
    let ativo = true

    async function carregarOpcoes() {
      setOpcoesLoading(true)
      setOpcoesError('')

      try {
        const [autores, editoras, categorias, grupos] = await Promise.all([
          listarAutores(),
          listarEditoras(),
          listarCategorias(),
          listarGruposPrecificacao(),
        ])
        if (!ativo) return
        setOpcoes({
          autores: Array.isArray(autores) ? autores : [],
          editoras: Array.isArray(editoras) ? editoras : [],
          categorias: Array.isArray(categorias) ? categorias : [],
          grupos: Array.isArray(grupos) ? grupos : [],
        })
      } catch (err) {
        if (ativo) setOpcoesError(err?.mensagem || 'Não foi possível carregar as opções do formulário.')
      } finally {
        if (ativo) setOpcoesLoading(false)
      }
    }

    async function carregarLivro() {
      if (!isEditing) {
        setInitialValues(getInitialLivroForm())
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')

      try {
        const response = await buscarLivroPorId(id)
        setInitialValues(getInitialLivroForm(normalizarLivroDaApi(response)))
      } catch (err) {
        setError(mensagemDeApi(err, 'Não foi possível carregar o livro para edição.'))
      } finally {
        setLoading(false)
      }
    }

    carregarOpcoes()
    carregarLivro()
    return () => {
      ativo = false
    }
  }, [id, isEditing])

  async function handleSubmit(payload) {
    setApiErrors({})
    setIsSubmitting(true)
    setError('')

    try {
      if (isEditing) {
        await atualizarLivro(id, payload)
      } else {
        await criarLivro(payload)
      }

      navigate('/admin/livros')
    } catch (err) {
      const fieldErrors = normalizarErrosDeCampo(err?.erros || err?.details?.erros || {})
      setApiErrors(fieldErrors)
      setError(mensagemDeApi(err, 'Não foi possível salvar o livro.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <div style={{ padding: '28px 32px', maxWidth: 1000 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: 12, flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>{tituloPagina}</h1>
            </div>
            <button type="button" className="btn-secondary" onClick={() => navigate('/admin/livros')}>
              Voltar para livros
            </button>
          </div>

          {loading && (
            <div className="card" style={{ padding: '30px 20px', textAlign: 'center' }}>
              <div className="spinner" style={{ width: 28, height: 28, border: '3px solid #E5E7EB', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 12px' }} />
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>Carregando dados do livro...</p>
            </div>
          )}

          {!loading && error && (
            <div className="card" style={{ padding: '18px 20px', marginBottom: 16, borderColor: '#FECACA', background: '#FEF2F2' }}>
              <strong style={{ color: '#991B1B' }}>{error}</strong>
            </div>
          )}

          {!loading && opcoesError && (
            <div className="card" style={{ padding: '18px 20px', marginBottom: 16, borderColor: '#FECACA', background: '#FEF2F2' }}>
              <strong style={{ color: '#991B1B' }}>{opcoesError}</strong>
              <button type="button" className="btn-secondary" onClick={() => window.location.reload()} style={{ marginLeft: 12 }}>Atualizar opções</button>
            </div>
          )}

          {!loading && !opcoesError && (
            <>
              <LivroForm
                initialValues={initialValues}
                onSubmit={handleSubmit}
                onCancel={() => navigate('/admin/livros')}
                isEditing={isEditing}
                isSubmitting={isSubmitting}
                apiErrors={apiErrors}
                opcoes={opcoes}
                opcoesCarregando={opcoesLoading}
              />
              {isEditing && <LivroEstoque livroId={id} editavel />}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
