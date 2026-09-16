import React, { useEffect, useMemo, useState } from 'react'
import { buildLivroPayload, getInitialLivroForm, validarLivroForm } from '../utils/livroFormatters'

export default function LivroForm({ initialValues, onSubmit, onCancel, isEditing = false, isSubmitting = false, apiErrors = {}, opcoes = {}, opcoesCarregando = false }) {
  const [form, setForm] = useState(getInitialLivroForm(initialValues))
  const [erros, setErros] = useState({})
  const [imagemComErro, setImagemComErro] = useState(false)

  const autores = Array.isArray(opcoes.autores) ? opcoes.autores : []
  const editoras = Array.isArray(opcoes.editoras) ? opcoes.editoras : []
  const grupos = Array.isArray(opcoes.grupos) ? opcoes.grupos : []
  const categorias = Array.isArray(opcoes.categorias) ? opcoes.categorias : []

  useEffect(() => {
    setForm(getInitialLivroForm(initialValues))
    setImagemComErro(false)
  }, [initialValues])

  useEffect(() => {
    setErros(apiErrors || {})
  }, [apiErrors])

  const categoriasSelecionadas = useMemo(
    () => categorias.filter((categoria) => form.categoriaIds.includes(Number(categoria.id))),
    [categorias, form.categoriaIds],
  )

  function atualizarCampo(chave, valor) {
    setForm((prev) => ({ ...prev, [chave]: valor }))
    setErros((prev) => ({ ...prev, [chave]: undefined }))
  }

  function atualizarDimensao(chave, valor) {
    setForm((prev) => ({
      ...prev,
      dimensao: {
        ...prev.dimensao,
        [chave]: valor,
      },
    }))
    setErros((prev) => ({ ...prev, [`dimensao.${chave}`]: undefined }))
  }

  function alternarCategoria(categoriaId) {
    const id = Number(categoriaId)
    setForm((prev) => {
      const atual = Array.isArray(prev.categoriaIds) ? prev.categoriaIds : []
      const jaSelecionada = atual.includes(id)
      const proximo = jaSelecionada ? atual.filter((item) => item !== id) : [...atual, id]
      return { ...prev, categoriaIds: proximo }
    })
    setErros((prev) => ({ ...prev, categoriaIds: undefined }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const validacao = validarLivroForm(form)
    const idsDisponiveis = new Set(categorias.map((categoria) => Number(categoria.id)))
    if (form.autorId && !autores.some((opcao) => Number(opcao.id) === Number(form.autorId))) validacao.autorId = 'O autor selecionado não está mais disponível. Atualize as opções.'
    if (form.editoraId && !editoras.some((opcao) => Number(opcao.id) === Number(form.editoraId))) validacao.editoraId = 'A editora selecionada não está mais disponível. Atualize as opções.'
    if (form.grupoPrecificacaoId && !grupos.some((opcao) => Number(opcao.id) === Number(form.grupoPrecificacaoId))) validacao.grupoPrecificacaoId = 'O grupo selecionado não está mais disponível. Atualize as opções.'
    if (form.categoriaIds.some((id) => !idsDisponiveis.has(Number(id)))) validacao.categoriaIds = 'Uma categoria selecionada não está mais disponível. Atualize as opções.'
    if (opcoesCarregando) validacao.opcoes = 'Aguarde o carregamento das opções.'
    if (Object.keys(validacao).length > 0) {
      setErros(validacao)
      return
    }

    const payload = buildLivroPayload(form)
    await onSubmit(payload)
  }

  const inputClassName = (fieldName) => `input-field ${erros[fieldName] ? 'field-error' : ''}`

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <section className="card" style={{ padding: 24 }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Informações principais</h2>

          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <label className="label">Código *</label>
              <input
                className={inputClassName('codigo')}
                value={form.codigo}
                onChange={(event) => atualizarCampo('codigo', event.target.value)}
                placeholder="LIV-001"
                maxLength={50}
              />
              {erros.codigo && <small style={{ color: 'var(--danger)', display: 'block', marginTop: 6 }}>{erros.codigo}</small>}
            </div>

            <div>
              <label className="label">Título *</label>
              <input
                className={inputClassName('titulo')}
                value={form.titulo}
                onChange={(event) => atualizarCampo('titulo', event.target.value)}
                placeholder="Título completo do livro"
                maxLength={200}
              />
              {erros.titulo && <small style={{ color: 'var(--danger)', display: 'block', marginTop: 6 }}>{erros.titulo}</small>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
              <div>
                <label className="label">Ano *</label>
                <input
                  className={inputClassName('ano')}
                  type="number"
                  value={form.ano}
                  onChange={(event) => atualizarCampo('ano', event.target.value)}
                />
                {erros.ano && <small style={{ color: 'var(--danger)', display: 'block', marginTop: 6 }}>{erros.ano}</small>}
              </div>

              <div>
                <label className="label">Edição *</label>
                <input
                  className={inputClassName('edicao')}
                  type="number"
                  min="1"
                  value={form.edicao}
                  onChange={(event) => atualizarCampo('edicao', event.target.value)}
                />
                {erros.edicao && <small style={{ color: 'var(--danger)', display: 'block', marginTop: 6 }}>{erros.edicao}</small>}
              </div>

              <div>
                <label className="label">ISBN *</label>
                <input
                  className={inputClassName('isbn')}
                  value={form.isbn}
                  onChange={(event) => atualizarCampo('isbn', event.target.value)}
                  placeholder="9780000000000"
                  maxLength={20}
                />
                {erros.isbn && <small style={{ color: 'var(--danger)', display: 'block', marginTop: 6 }}>{erros.isbn}</small>}
              </div>

              <div>
                <label className="label">Número de páginas *</label>
                <input
                  className={inputClassName('numeroPaginas')}
                  type="number"
                  min="1"
                  value={form.numeroPaginas}
                  onChange={(event) => atualizarCampo('numeroPaginas', event.target.value)}
                />
                {erros.numeroPaginas && <small style={{ color: 'var(--danger)', display: 'block', marginTop: 6 }}>{erros.numeroPaginas}</small>}
              </div>
            </div>

            <div>
              <label className="label">Sinopse *</label>
              <textarea
                className={inputClassName('sinopse')}
                value={form.sinopse}
                onChange={(event) => atualizarCampo('sinopse', event.target.value)}
                rows={5}
                style={{ resize: 'vertical' }}
                maxLength={5000}
              />
              {erros.sinopse && <small style={{ color: 'var(--danger)', display: 'block', marginTop: 6 }}>{erros.sinopse}</small>}
            </div>

            <div>
              <label className="label" htmlFor="imagemUrl">URL da capa *</label>
              <input
                id="imagemUrl"
                className={inputClassName('imagemUrl')}
                type="url"
                value={form.imagemUrl}
                onChange={(event) => {
                  atualizarCampo('imagemUrl', event.target.value)
                  setImagemComErro(false)
                }}
                placeholder="https://exemplo.com/capas/livro.jpg"
                maxLength={500}
              />
              <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: 6 }}>Exemplo: https://exemplo.com/capas/clean-code.jpg</small>
              {erros.imagemUrl && <small style={{ color: 'var(--danger)', display: 'block', marginTop: 6 }}>{erros.imagemUrl}</small>}
              {/^https?:\/\/.+$/i.test(form.imagemUrl.trim()) && (
                <div style={{ marginTop: 12, width: 120, aspectRatio: '3 / 4', background: '#F3F4F6', overflow: 'hidden', borderRadius: 8 }}>
                  <img
                    src={form.imagemUrl.trim()}
                    alt="Prévia da capa"
                    onError={() => setImagemComErro(true)}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: imagemComErro ? 'none' : 'block' }}
                  />
                  {imagemComErro && <span style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', textAlign: 'center', padding: 8, color: 'var(--text-muted)', fontSize: 12 }}>Capa indisponível</span>}
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
              <div>
                <label className="label">Código de barras *</label>
                <input
                  className={inputClassName('codigoBarras')}
                  value={form.codigoBarras}
                  onChange={(event) => atualizarCampo('codigoBarras', event.target.value)}
                  placeholder="9780000000000"
                  maxLength={50}
                />
                {erros.codigoBarras && <small style={{ color: 'var(--danger)', display: 'block', marginTop: 6 }}>{erros.codigoBarras}</small>}
              </div>

              <div>
                <label className="label">Valor de venda *</label>
                <input
                  className={inputClassName('valorVenda')}
                  type="text"
                  value={form.valorVenda}
                  onChange={(event) => atualizarCampo('valorVenda', event.target.value)}
                  placeholder="89,90"
                />
                {erros.valorVenda && <small style={{ color: 'var(--danger)', display: 'block', marginTop: 6 }}>{erros.valorVenda}</small>}
              </div>

              <div>
                <label className="label">Status *</label>
                <select
                  className={inputClassName('ativo')}
                  value={String(form.ativo)}
                  onChange={(event) => atualizarCampo('ativo', event.target.value === 'true')}
                >
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        <section className="card" style={{ padding: 24 }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Autor</h2>

          <div>
            <label className="label">Autor *</label>
            <select
              className={inputClassName('autorId')}
              value={form.autorId}
              onChange={(event) => atualizarCampo('autorId', event.target.value)}
              disabled={opcoesCarregando || autores.length === 0}
            >
              <option value="">Selecione um autor</option>
              {autores.map((autor) => (
                <option key={autor.id} value={autor.id}>{autor.nome}</option>
              ))}
            </select>
            {!opcoesCarregando && autores.length === 0 && <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: 6 }}>Nenhum autor cadastrado.</small>}
            {erros.autorId && <small style={{ color: 'var(--danger)', display: 'block', marginTop: 6 }}>{erros.autorId}</small>}
          </div>
        </section>

        <section className="card" style={{ padding: 24 }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Editora</h2>
          <div>
            <label className="label">Editora *</label>
            <select
              className={inputClassName('editoraId')}
              value={form.editoraId}
              onChange={(event) => atualizarCampo('editoraId', event.target.value)}
              disabled={opcoesCarregando || editoras.length === 0}
            >
              <option value="">Selecione uma editora</option>
              {editoras.map((editora) => (
                <option key={editora.id} value={editora.id}>{editora.nome}</option>
              ))}
            </select>
            {!opcoesCarregando && editoras.length === 0 && <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: 6 }}>Nenhuma editora cadastrada.</small>}
            {erros.editoraId && <small style={{ color: 'var(--danger)', display: 'block', marginTop: 6 }}>{erros.editoraId}</small>}
          </div>
        </section>

        <section className="card" style={{ padding: 24 }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Grupo de precificação</h2>
          <div>
            <label className="label">Grupo *</label>
            <select
              className={inputClassName('grupoPrecificacaoId')}
              value={form.grupoPrecificacaoId}
              onChange={(event) => atualizarCampo('grupoPrecificacaoId', event.target.value)}
              disabled={opcoesCarregando || grupos.length === 0}
            >
              <option value="">Selecione o grupo</option>
              {grupos.map((grupo) => (
                <option key={grupo.id} value={grupo.id}>{grupo.nome}</option>
              ))}
            </select>
            {!opcoesCarregando && grupos.length === 0 && <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: 6 }}>Nenhum grupo de precificação cadastrado.</small>}
            {erros.grupoPrecificacaoId && <small style={{ color: 'var(--danger)', display: 'block', marginTop: 6 }}>{erros.grupoPrecificacaoId}</small>}
          </div>
        </section>

        <section className="card" style={{ padding: 24 }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Categorias</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {categorias.map((categoria) => {
              const selecionada = Array.isArray(form.categoriaIds) && form.categoriaIds.includes(categoria.id)

              return (
                <button
                  key={categoria.id}
                  type="button"
                  onClick={() => alternarCategoria(categoria.id)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 999,
                    border: `1.5px solid ${selecionada ? 'var(--primary)' : '#D1D5DB'}`,
                    background: selecionada ? 'var(--primary-light)' : '#fff',
                    color: selecionada ? 'var(--primary)' : 'var(--text)',
                    fontWeight: selecionada ? 700 : 500,
                    cursor: 'pointer',
                  }}
                >
                  {categoria.nome}
                </button>
              )
            })}
          </div>
          {!opcoesCarregando && categorias.length === 0 && <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: 10 }}>Nenhuma categoria cadastrada.</small>}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
            {categoriasSelecionadas.length === 0 ? (
              <small style={{ color: 'var(--text-muted)' }}>Nenhuma categoria selecionada.</small>
            ) : (
              categoriasSelecionadas.map((categoria) => (
                <span key={categoria.id} className="badge badge-purple">{categoria.nome}</span>
              ))
            )}
          </div>

          {erros.categoriaIds && <small style={{ color: 'var(--danger)', display: 'block', marginTop: 6 }}>{erros.categoriaIds}</small>}
        </section>

        <section className="card" style={{ padding: 24 }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Dimensões</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
            <div>
              <label className="label">Altura (cm) *</label>
              <input
                className={inputClassName('dimensao.altura')}
                type="text"
                value={form.dimensao.altura}
                onChange={(event) => atualizarDimensao('altura', event.target.value)}
                placeholder="2,00"
              />
              {erros['dimensao.altura'] && <small style={{ color: 'var(--danger)', display: 'block', marginTop: 6 }}>{erros['dimensao.altura']}</small>}
            </div>

            <div>
              <label className="label">Largura (cm) *</label>
              <input
                className={inputClassName('dimensao.largura')}
                type="text"
                value={form.dimensao.largura}
                onChange={(event) => atualizarDimensao('largura', event.target.value)}
                placeholder="16,00"
              />
              {erros['dimensao.largura'] && <small style={{ color: 'var(--danger)', display: 'block', marginTop: 6 }}>{erros['dimensao.largura']}</small>}
            </div>

            <div>
              <label className="label">Profundidade (cm) *</label>
              <input
                className={inputClassName('dimensao.profundidade')}
                type="text"
                value={form.dimensao.profundidade}
                onChange={(event) => atualizarDimensao('profundidade', event.target.value)}
                placeholder="23,00"
              />
              {erros['dimensao.profundidade'] && <small style={{ color: 'var(--danger)', display: 'block', marginTop: 6 }}>{erros['dimensao.profundidade']}</small>}
            </div>

            <div>
              <label className="label">Peso (kg) *</label>
              <input
                className={inputClassName('dimensao.peso')}
                type="text"
                value={form.dimensao.peso}
                onChange={(event) => atualizarDimensao('peso', event.target.value)}
                placeholder="0,60"
              />
              {erros['dimensao.peso'] && <small style={{ color: 'var(--danger)', display: 'block', marginTop: 6 }}>{erros['dimensao.peso']}</small>}
            </div>
          </div>
        </section>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </button>
          {erros.opcoes && <small style={{ color: 'var(--danger)' }}>{erros.opcoes}</small>}
          <button type="submit" className="btn-primary" disabled={isSubmitting || opcoesCarregando}>
            {isSubmitting ? (isEditing ? 'Salvando...' : 'Cadastrando...') : isEditing ? 'Salvar alterações' : 'Cadastrar livro'}
          </button>
        </div>
      </div>
    </form>
  )
}
