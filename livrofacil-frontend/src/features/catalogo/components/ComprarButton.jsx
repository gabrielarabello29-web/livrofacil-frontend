import React, { useEffect, useState } from 'react'
import { useCarrinho } from '@/features/carrinho/context/CarrinhoContext'
import { buscarEstoque } from '../../livros/api/livrosApi'

export default function ComprarButton({ livro, className = 'btn-primary' }) {
  const [mensagem, setMensagem] = useState('')
  const [quantidade, setQuantidade] = useState(1)
  const [estoqueDisponivel, setEstoqueDisponivel] = useState(null)
  const [carregandoEstoque, setCarregandoEstoque] = useState(true)
  const { itens, adicionarItem, operando } = useCarrinho()
  const jaNoCarrinho = itens.some((item) => String(item.id) === String(livro.id) || String(item.livroId) === String(livro.id))
  useEffect(() => {
    let ativo = true
    setCarregandoEstoque(true)
    const estoqueInformado = livro?.estoque?.quantidadeDisponivel ?? livro?.quantidadeDisponivel
    const carregar = estoqueInformado !== undefined && estoqueInformado !== null
      ? Promise.resolve({ quantidadeDisponivel: estoqueInformado })
      : buscarEstoque(livro.id)
    carregar.then((estoque) => {
      if (ativo) setEstoqueDisponivel(Math.max(0, Math.floor(Number(estoque?.quantidadeDisponivel) || 0)))
    }).catch(() => {
      if (ativo) setEstoqueDisponivel(0)
    }).finally(() => { if (ativo) setCarregandoEstoque(false) })
    return () => { ativo = false }
  }, [livro?.id, livro?.estoque?.quantidadeDisponivel, livro?.quantidadeDisponivel])
  const temEstoque = estoqueDisponivel !== null && estoqueDisponivel > 0
  const limiteQuantidade = Math.max(1, estoqueDisponivel || 1)

  async function prepararCompra() {
    try {
      await adicionarItem(livro, quantidade)
      setMensagem('Livro adicionado ao carrinho.')
    } catch (error) {
      setMensagem(error?.mensagem || 'Não foi possível adicionar o livro ao carrinho.')
    }
  }

  return (
    <div>
      {!jaNoCarrinho && <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <label htmlFor={`quantidade-${livro.id}`} style={{ fontSize: 13, fontWeight: 600 }}>Quantidade</label>
        <input id={`quantidade-${livro.id}`} className="input-field" type="number" min="1" max={limiteQuantidade} step="1" value={quantidade} disabled={operando || carregandoEstoque || !temEstoque} onChange={(event) => setQuantidade(Math.min(limiteQuantidade, Math.max(1, Number(event.target.value) || 1)))} style={{ width: 80 }} />
        {!carregandoEstoque && <small style={{ color: 'var(--text-muted)' }}>Disponível: {estoqueDisponivel}</small>}
      </div>}
      <button type="button" className={className} disabled={operando || carregandoEstoque || jaNoCarrinho || !temEstoque} onClick={(event) => { event.preventDefault(); event.stopPropagation(); prepararCompra() }}>{jaNoCarrinho ? 'No carrinho' : carregandoEstoque ? 'Verificando estoque...' : !temEstoque ? 'Sem estoque' : operando ? 'Adicionando...' : 'Adicionar ao carrinho'}</button>
      {mensagem && <small role="status" style={{ display: 'block', marginTop: 8, color: 'var(--text-muted)' }}>{mensagem}</small>}
    </div>
  )
}
