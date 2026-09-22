import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { adicionarItem as adicionarItemApi, atualizarItem as atualizarItemApi, buscarCarrinho, criarOuAssociarCarrinho, removerItem as removerItemApi } from '@/features/carrinho/api/carrinhoApi'
import { buscarEstoque } from '@/features/livros/api/livrosApi'
import { useAuth } from '@/features/auth/context/AuthContext'

const CarrinhoContext = createContext(null)
const ORDEM_CARRINHO_KEY = 'livrofacil-ordem-carrinho'

function chaveLivro(item) {
  return String(item?.livroId ?? item?.produtoId ?? item?.livro?.id ?? item?.id ?? '')
}

export function obterEstoqueDisponivel(item) {
  const valor = item?.estoque?.quantidadeDisponivel ?? item?.livro?.estoque?.quantidadeDisponivel ?? item?.quantidadeDisponivel ?? item?.estoqueDisponivel
  const estoque = Number(valor)
  return Number.isFinite(estoque) && estoque >= 0 ? Math.floor(estoque) : null
}

function ordenarItensCarrinho(itens) {
  const ordemSalva = JSON.parse(localStorage.getItem(ORDEM_CARRINHO_KEY) || '[]')
  const ordem = Array.isArray(ordemSalva) ? ordemSalva.map(String) : []
  const conhecidos = new Set(ordem)
  const novos = itens.map(chaveLivro).filter((chave) => chave && !conhecidos.has(chave))
  const ordemAtualizada = [...ordem, ...novos]
  localStorage.setItem(ORDEM_CARRINHO_KEY, JSON.stringify(ordemAtualizada))
  return [...itens].sort((a, b) => ordemAtualizada.indexOf(chaveLivro(a)) - ordemAtualizada.indexOf(chaveLivro(b)))
}

async function anexarEstoques(itens) {
  return Promise.all(itens.map(async (item) => {
    const livroId = item?.livroId ?? item?.produtoId ?? item?.livro?.id
    if (!livroId || item?.estoque?.quantidadeDisponivel !== undefined || item?.quantidadeDisponivel !== undefined) return item
    try {
      const estoque = await buscarEstoque(livroId)
      return { ...item, estoque }
    } catch {
      return item
    }
  }))
}

function registrarLivroNaOrdem(livroId) {
  const ordem = JSON.parse(localStorage.getItem(ORDEM_CARRINHO_KEY) || '[]')
  const ordemAtualizada = Array.isArray(ordem) ? ordem.map(String) : []
  const chave = String(livroId)
  if (!ordemAtualizada.includes(chave)) ordemAtualizada.push(chave)
  localStorage.setItem(ORDEM_CARRINHO_KEY, JSON.stringify(ordemAtualizada))
}

function removerLivroDaOrdem(item) {
  const chave = chaveLivro(item)
  const ordem = JSON.parse(localStorage.getItem(ORDEM_CARRINHO_KEY) || '[]')
  localStorage.setItem(ORDEM_CARRINHO_KEY, JSON.stringify((Array.isArray(ordem) ? ordem : []).map(String).filter((id) => id !== chave)))
}

function identidadeCarrinho(usuario) {
  const token = localStorage.getItem('carrinhoToken')
  return usuario?.id ? { token, clienteId: usuario.id } : { token }
}

export function CarrinhoProvider({ children }) {
  const { usuario } = useAuth()
  const [carrinho, setCarrinho] = useState({ itens: [], total: 0 })
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [operando, setOperando] = useState(false)
  const garantirCarrinhoEmAndamento = useRef(null)

  async function garantirCarrinho() {
    const idSalvo = localStorage.getItem('carrinhoId')
    const tokenSalvo = localStorage.getItem('carrinhoToken')
    if (idSalvo) return { id: Number(idSalvo), token: tokenSalvo }
    if (!garantirCarrinhoEmAndamento.current) {
      garantirCarrinhoEmAndamento.current = criarOuAssociarCarrinho({ token: null, clienteId: usuario?.id || null }).then((resposta) => {
        localStorage.setItem('carrinhoId', String(resposta.id))
        if (resposta.token) localStorage.setItem('carrinhoToken', resposta.token)
        return resposta
      }).finally(() => { garantirCarrinhoEmAndamento.current = null })
    }
    return garantirCarrinhoEmAndamento.current
  }

  async function recarregar({ silencioso = false } = {}) {
    if (!silencioso) setCarregando(true)
    setErro('')
    try {
      const base = await garantirCarrinho()
      const resposta = await buscarCarrinho(base.id, identidadeCarrinho(usuario))
      const itens = resposta ? await anexarEstoques(Array.isArray(resposta.itens) ? resposta.itens : []) : []
      setCarrinho(resposta ? { ...resposta, itens: ordenarItensCarrinho(itens) } : { itens: [], total: 0 })
    } catch (error) { setErro(error?.mensagem || 'Não foi possível carregar o carrinho.') }
    finally { if (!silencioso) setCarregando(false) }
  }

  useEffect(() => { recarregar() }, [usuario?.id])

  async function adicionarItem(livro, quantidade = 1) {
    const estoqueDisponivel = obterEstoqueDisponivel(livro)
    quantidade = Math.max(1, Number(quantidade) || 1)
    if (estoqueDisponivel !== null && quantidade > estoqueDisponivel) {
      const error = { mensagem: `Quantidade máxima disponível: ${estoqueDisponivel}.` }
      setErro(error.mensagem)
      throw error
    }
    setOperando(true); setErro('')
    try {
      const base = await garantirCarrinho()
      const resposta = await adicionarItemApi(base.id, { livroId: livro.id, quantidade }, identidadeCarrinho(usuario))
      registrarLivroNaOrdem(livro.id)
      if (Array.isArray(resposta?.itens)) {
        const itens = await anexarEstoques(resposta.itens)
        setCarrinho({ ...resposta, itens: ordenarItensCarrinho(itens) })
      } else {
        await recarregar({ silencioso: true })
      }
      return resposta
    } catch (error) { setErro(error?.mensagem || 'Não foi possível adicionar o livro ao carrinho.'); throw error }
    finally { setOperando(false) }
  }

  async function atualizarQuantidade(itemId, quantidade) {
    const item = itens.find((atual) => String(atual.id) === String(itemId))
    const estoqueDisponivel = obterEstoqueDisponivel(item)
    quantidade = Math.max(1, Number(quantidade) || 1)
    if (estoqueDisponivel !== null) quantidade = Math.min(quantidade, estoqueDisponivel)
    if (estoqueDisponivel === 0) {
      const error = { mensagem: 'Este livro não possui estoque disponível.' }
      setErro(error.mensagem)
      throw error
    }
    setOperando(true); setErro('')
    try {
      await atualizarItemApi(Number(localStorage.getItem('carrinhoId')), itemId, quantidade, identidadeCarrinho(usuario))
      await recarregar({ silencioso: true })
    }
    catch (error) { setErro(error?.mensagem || 'Não foi possível atualizar o item.'); throw error }
    finally { setOperando(false) }
  }

  async function removerItem(itemId) {
    setOperando(true); setErro('')
    try {
      const itemRemovido = itens.find((item) => String(item.id) === String(itemId))
      const resposta = await removerItemApi(Number(localStorage.getItem('carrinhoId')), itemId, identidadeCarrinho(usuario))
      if (itemRemovido) removerLivroDaOrdem(itemRemovido)
      if (Array.isArray(resposta?.itens)) {
        setCarrinho({ ...resposta, itens: ordenarItensCarrinho(resposta.itens) })
      } else {
        setCarrinho((atual) => {
          const itensRestantes = atual.itens.filter((item) => String(item.id) !== String(itemId))
          return { ...atual, itens: itensRestantes, total: itensRestantes.reduce((total, item) => total + Number(item.subtotal ?? Number(item.valorUnitario || 0) * Number(item.quantidade || 0)), 0) }
        })
        await recarregar({ silencioso: true })
      }
    }
    catch (error) { setErro(error?.mensagem || 'Não foi possível remover o item.'); throw error }
    finally { setOperando(false) }
  }

  const itens = Array.isArray(carrinho.itens) ? carrinho.itens : []
  const subtotal = Number(carrinho.total || 0)
  const totalItens = itens.reduce((total, item) => total + Number(item.quantidade || 0), 0)

  return <CarrinhoContext.Provider value={{ itens, subtotal, total: subtotal, totalItens, carregando, operando, erro, adicionarItem, atualizarQuantidade, removerItem, recarregar, limparCarrinho: recarregar }}>{children}</CarrinhoContext.Provider>
}

export function useCarrinho() {
  const ctx = useContext(CarrinhoContext)
  if (!ctx) throw new Error('useCarrinho deve ser usado dentro de CarrinhoProvider')
  return ctx
}
