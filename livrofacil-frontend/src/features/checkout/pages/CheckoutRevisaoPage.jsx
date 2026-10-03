import React, { useEffect, useState } from "react"

import { useLocation, useNavigate } from "react-router-dom"

import Header from "@/shared/components/Header"

import { useCarrinho } from "@/features/carrinho/context/CarrinhoContext"

import { obterClienteId, useAuth } from "@/features/auth/context/AuthContext"

import {
  buscarMeuPedido,
  finalizarCompra,
  limparCheckoutLocal,
  obterEnderecoCheckout,
  obterMensagemErro,
  obterPedidoCheckoutId,
} from "@/features/checkout/api/checkoutApi"


import {
  CheckoutStepper,
  CheckoutSummary,
} from "@/features/checkout/components/CheckoutChrome"

function formatarEndereco(endereco) {
  if (!endereco) return "Endereço selecionado no checkout"

  if (typeof endereco === "string") return endereco

  return `${endereco.logradouro}, ${endereco.numero}${
    endereco.complemento ? ` - ${endereco.complemento}` : ""
  } - ${endereco.bairro}, ${endereco.cidade}/${endereco.estado} - CEP ${endereco.cep}`
}

export default function CheckoutRevisaoPage() {
  const { itens, subtotal, recarregar } = useCarrinho()
  const { usuario } = useAuth()
  const clienteId = obterClienteId(usuario)
  const navigate = useNavigate()
  const location = useLocation()
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState("")
  const [pedido, setPedido] = useState(null)
  const pagamento = location.state || {}
  const pedidoId = obterPedidoCheckoutId()

  useEffect(() => {
    if (!pedidoId) {
      navigate("/carrinho", { replace: true })
      return
    }
    let ativo = true
    if (!clienteId) {
      setErro("Não foi possível identificar o cliente pelo UUID.")
      navigate("/carrinho", { replace: true })
      return
    }
    buscarMeuPedido(clienteId, pedidoId)
      .then((resposta) => {
        const status = String(resposta?.status || "").toUpperCase()
        if (
          ![
            "PENDENTE",
            "AGUARDANDO_PAGAMENTO",
            "EM_CHECKOUT",
            "EM_PROCESSAMENTO",
          ].includes(status)
        ) {
          limparCheckoutLocal()
          navigate("/carrinho", { replace: true })
          return
        }
        if (ativo) setPedido(resposta)
      })
      .catch((error) => {
        console.error(
          "Erro ao recuperar checkout:",
          error?.response?.data || error,
        )
        limparCheckoutLocal()
        if (ativo) {
          setErro(obterMensagemErro(error))
          navigate("/carrinho", { replace: true })
        }
      })
    return () => {
      ativo = false
    }
  }, [clienteId, navigate, pedidoId])

  if (!pedido) return null

  if (!pedido.enderecoEntregaObjeto)
    pedido.enderecoEntregaObjeto =
      pedido.enderecoEntrega ||
      pedido.endereco ||
      obterEnderecoCheckout(pedidoId)

  async function finalizar() {
    const pagamentos =
      pagamento.pagamentos ||
      (pagamento.formaPagamentoId
        ? [
            {
              formaPagamentoId: pagamento.formaPagamentoId,
              valor: Number(pagamento.valor),
              parcelas: Number(pagamento.parcelas),
            },
          ]
        : [])
    const totalPedido = Number(pedido.total ?? pedido.valorTotal ?? 0)
    const totalPagamentos = pagamentos.reduce(
      (soma, item) => soma + Number(item.valor || 0),
      0,
    )
    if (pagamentos.length === 0 && totalPedido !== 0) {
      setErro("Selecione uma forma de pagamento.")
      return
    }
    if (pagamentos.length > 0 && Number(totalPagamentos.toFixed(2)) !== Number(totalPedido.toFixed(2))) {
      setErro("Os pagamentos precisam corresponder ao total atualizado do pedido.")
      return
    }
    setSalvando(true)
    setErro("")
    try {
      const resposta = await finalizarCompra(pedido.id, clienteId, {
        pagamentos,
        total: totalPedido,
      })
      if (String(resposta?.status || "").toUpperCase() !== "EM_PROCESSAMENTO") {
        setErro(
          `O backend retornou o status ${resposta?.status || "não informado"}. O pedido não foi concluído.`,
        )
        return
      }
      limparCheckoutLocal()
      await recarregar()
      navigate("/checkout/sucesso", { state: { pedido: resposta } })
    } catch (error) {
      console.error(
        "Erro ao finalizar checkout:",
        error?.response?.data || error,
      )
      setErro(obterMensagemErro(error))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="checkout-flow">
      <Header />
      <main className="page-container checkout-page checkout-route-page">
        <h1>Checkout</h1>
        <CheckoutStepper etapa={2} />
        <div className="checkout-route-layout">
          <section className="card checkout-route-panel checkout-review-panel">
            <h2>Confirmar pedido</h2>
            {erro && (
              <div role="alert" className="checkout-error">
                {erro}
              </div>
            )}
            <div className="checkout-review-section">
              <div className="checkout-review-heading">
                <span className="checkout-review-icon">▣</span>
                <h3>Itens da compra</h3>
              </div>
              <div className="checkout-review-items">
                {itens.map((item) => (
                  <div className="checkout-review-product" key={item.id}>
                    <img
                      src={item.imagemUrl || item.capa}
                      alt={`Capa de ${item.titulo}`}
                    />
                    <span>
                      <strong>{item.titulo}</strong>
                      <small>Quantidade: {item.quantidade}</small>
                    </span>
                    <strong>
                      R${" "}
                      {Number(
                        item.subtotal ||
                          item.valorUnitario * item.quantidade ||
                          0,
                      )
                        .toFixed(2)
                        .replace(".", ",")}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
            <div className="checkout-review-section">
              <div className="checkout-review-heading">
                <span className="checkout-review-icon">⌖</span>
                <h3>Entrega</h3>
              </div>
              <div className="checkout-review-address">
                <strong>
                  {pedido.enderecoEntregaObjeto?.tipoEndereco ||
                    "Endereço de entrega"}
                </strong>
                <span>{formatarEndereco(pedido.enderecoEntregaObjeto)}</span>
              </div>
            </div>
            <div className="checkout-review-section">
              <div className="checkout-review-heading">
                <span className="checkout-review-icon">▤</span>
                <h3>Forma de pagamento</h3>
              </div>
              <div className="checkout-review-payments">
                {(pagamento.pagamentos || []).map((forma, index) => {
                  const cartao = pagamento.cartoes?.[index]
                  return (
                    <div key={`${forma.formaPagamentoId}-${index}`}>
                      <span>
                        <strong>
                          {cartao?.bandeira || "Cartão"} ****{" "}
                          {cartao?.ultimos4 || cartao?.ultimosDigitos || ""}
                        </strong>
                        <small>
                          {cartao?.nomeTitular || "Cartão salvo"} ·{" "}
                          {forma.parcelas || 1}x
                        </small>
                      </span>
                      <strong>
                        R${" "}
                        {Number(forma.valor || 0)
                          .toFixed(2)
                          .replace(".", ",")}
                      </strong>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="checkout-actions">
              <button
                className="btn-ghost"
                onClick={() => navigate("/checkout/pagamento")}
              >
                ← Voltar
              </button>
              <button
                className="btn-primary"
                onClick={finalizar}
                disabled={salvando}
              >
                {salvando ? "Finalizando..." : "✓ Confirmar e pagar"}
              </button>
            </div>
          </section>
          <CheckoutSummary pedido={pedido} />
        </div>
      </main>
    </div>
  )
}
