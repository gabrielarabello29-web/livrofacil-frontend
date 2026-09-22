import React, { useEffect, useState } from 'react'
import { atualizarEstoque, buscarEstoque } from '../api/livrosApi'
import { buildEstoquePayload, validarEstoque } from '../utils/livroFormatters'
import { erroDoCampo, mensagemDeApi, normalizarErrosDeCampo } from '@/shared/api/errorUtils'

const vazio = { quantidadeDisponivel: '', quantidadeBloqueada: '', quantidadeVendida: '' }

export default function LivroEstoque({ livroId, editavel = false }) {
  const [estoque, setEstoque] = useState(null)
  const [form, setForm] = useState(vazio)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [erros, setErros] = useState({})
  const [mensagem, setMensagem] = useState('')

  async function carregar() {
    setCarregando(true)
    setErro('')
    try {
      const resposta = await buscarEstoque(livroId)
      setEstoque(resposta || null)
      setForm(resposta ? {
        quantidadeDisponivel: resposta.quantidadeDisponivel,
        quantidadeBloqueada: resposta.quantidadeBloqueada,
        quantidadeVendida: resposta.quantidadeVendida,
      } : vazio)
    } catch (err) {
      setErro(err?.status === 404 ? 'Estoque não cadastrado para este livro.' : mensagemDeApi(err, 'Não foi possível carregar o estoque.'))
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregar() }, [livroId])

  async function salvar(event) {
    event.preventDefault()
    const validacao = validarEstoque(form)
    setErros(validacao)
    if (Object.keys(validacao).length > 0) return
    setSalvando(true)
    setErro('')
    setMensagem('')
    try {
      const resposta = await atualizarEstoque(livroId, buildEstoquePayload(form))
      setEstoque(resposta)
      setMensagem('Estoque atualizado com sucesso.')
    } catch (err) {
      setErros(normalizarErrosDeCampo(err?.erros || {}))
      setErro(mensagemDeApi(err, 'Não foi possível atualizar o estoque.'))
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) return <div className="card" style={{ padding: 20 }}>Carregando estoque...</div>

  return (
    <section className="card" style={{ padding: 24 }}>
      <h2 style={{ margin: '0 0 16px', fontSize: 16 }}>Estoque real</h2>
      {erro && <div style={{ color: '#991B1B', background: '#FEF2F2', padding: 10, marginBottom: 12 }}>{erro}</div>}
      {mensagem && <div style={{ color: '#065F46', background: '#D1FAE5', padding: 10, marginBottom: 12 }}>{mensagem}</div>}
      {!editavel && !estoque && <p style={{ color: 'var(--text-muted)' }}>Estoque não cadastrado.</p>}
      {editavel ? (
        <form onSubmit={salvar} style={{ display: 'grid', gap: 12 }}>
          {['quantidadeDisponivel', 'quantidadeBloqueada', 'quantidadeVendida'].map((campo) => (
            <label key={campo} className="label">
              {campo === 'quantidadeDisponivel' ? 'Disponível' : campo === 'quantidadeBloqueada' ? 'Bloqueada' : 'Vendida'}
              <input className="input-field" type="number" min="0" step="1" value={form[campo]} onChange={(event) => setForm((prev) => ({ ...prev, [campo]: event.target.value }))} />
              {erroDoCampo(erros, campo) && <small style={{ color: 'var(--danger)' }}>{erroDoCampo(erros, campo)}</small>}
            </label>
          ))}
          <button className="btn-primary" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar estoque'}</button>
        </form>
      ) : estoque ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <strong>Disponível: {estoque.quantidadeDisponivel}</strong>
          <strong>Bloqueada: {estoque.quantidadeBloqueada}</strong>
          <strong>Vendida: {estoque.quantidadeVendida}</strong>
        </div>
      ) : null}
    </section>
  )
}
