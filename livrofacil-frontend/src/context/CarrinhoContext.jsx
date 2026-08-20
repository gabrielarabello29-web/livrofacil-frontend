import { createContext, useContext, useState, useEffect } from 'react'

const CarrinhoContext = createContext(null)

export function CarrinhoProvider({ children }) {
  const [itens, setItens] = useState(() => {
    try {
      const salvo = localStorage.getItem('livrofacil_carrinho')
      return salvo ? JSON.parse(salvo) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem('livrofacil_carrinho', JSON.stringify(itens))
  }, [itens])

  function adicionarItem(livro, quantidade = 1) {
    setItens((prev) => {
      const existente = prev.find((i) => i.id === livro.id)
      if (existente) {
        return prev.map((i) =>
          i.id === livro.id
            ? { ...i, quantidade: i.quantidade + quantidade }
            : i
        )
      }
      return [...prev, { ...livro, quantidade }]
    })
  }

  function removerItem(id) {
    setItens((prev) => prev.filter((i) => i.id !== id))
  }

  function atualizarQuantidade(id, quantidade) {
    if (quantidade <= 0) return removerItem(id)
    setItens((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantidade } : i))
    )
  }

  function limparCarrinho() {
    setItens([])
  }

  const totalItens = itens.reduce((acc, i) => acc + i.quantidade, 0)
  const subtotal = itens.reduce((acc, i) => acc + i.preco * i.quantidade, 0)

  return (
    <CarrinhoContext.Provider
      value={{ itens, adicionarItem, removerItem, atualizarQuantidade, limparCarrinho, totalItens, subtotal }}
    >
      {children}
    </CarrinhoContext.Provider>
  )
}

export function useCarrinho() {
  const ctx = useContext(CarrinhoContext)
  if (!ctx) throw new Error('useCarrinho deve ser usado dentro de CarrinhoProvider')
  return ctx
}
