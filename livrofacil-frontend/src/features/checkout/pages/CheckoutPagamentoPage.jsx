import React, { useEffect, useState } from "react"

import { useNavigate } from "react-router-dom"

import Header from "@/shared/components/Header"

import Modal from "@/shared/components/Modal"

import { obterClienteId, useAuth } from "@/features/auth/context/AuthContext"

import { formaPagamentoService } from "@/features/cliente/api/formaPagamentoService"
import { cupomService } from "@/features/cupom/api/cupomService"

import {
  buscarMeuPedido,
  finalizarCompra,
  limparCheckoutLocal,
  obterMensagemErro,
  obterPedidoCheckoutId,
} from "@/features/checkout/api/checkoutApi"

import {
  CheckoutStepper,
  CheckoutSummary,
} from "@/features/checkout/components/CheckoutChrome"

const bandeirasValidas = ["VISA", "MASTERCARD", "ELO", "AMEX", "HIPERCARD"]

const tiposCartaoValidos = ["CREDITO"]

function mascararNumeroCartao(valor) {
  const digitos = String(valor || "")
    .replace(/\D/g, "")
    .slice(0, 16)

  return digitos.replace(/(\d{4})(?=\d)/g, "$1 ").trim()
}

function mascararValidade(valor) {
  const digitos = String(valor || "")
    .replace(/\D/g, "")
    .slice(0, 4)

  return digitos.length > 2
    ? `${digitos.slice(0, 2)}/${digitos.slice(2)}`
    : digitos
}

function validarCartao(form) {
  const numero = form.numeroCartao.replace(/\D/g, "")

  if (!form.nomeTitular.trim()) return "Informe o nome do titular."

  if (form.nomeTitular.trim().length > 100)
    return "O nome do titular deve ter no máximo 100 caracteres."

  if (numero.length !== 16)
    return "O número do cartão deve possuir exatamente 16 dígitos."

  if (!/^\d{2}\/\d{2}$/.test(form.validade))
    return "A validade deve seguir o formato MM/AA."

  const mes = Number(form.validade.slice(0, 2))

  if (mes < 1 || mes > 12) return "A validade deve conter um mês entre 01 e 12."

  if (!bandeirasValidas.includes(form.bandeira))
    return "Selecione a bandeira do cartão."

  if (!tiposCartaoValidos.includes(form.tipoCartao))
    return "Selecione o tipo do cartão."

  return ""
}

export default function CheckoutPagamentoPage() {
  const { usuario, atualizarUsuario } = useAuth()
  const clienteId = obterClienteId(usuario)
  const navigate = useNavigate()
  const [cartoes, setCartoes] = useState([])
  const [bandeirasDisponiveis, setBandeirasDisponiveis] = useState([])
  const [selecionado, setSelecionado] = useState("")
  const [valor, setValor] = useState("")
  const [parcelas, setParcelas] = useState(1)
  const [pagamentos, setPagamentos] = useState([])
  const [erro, setErro] = useState("")
  const [codigoCupom, setCodigoCupom] = useState("")
  const [cupomAplicado, setCupomAplicado] = useState("")
  const [aplicandoCupom, setAplicandoCupom] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)
  const [formCartao, setFormCartao] = useState({
    nomeTitular: "",
    numeroCartao: "",
    validade: "",
    bandeira: "VISA",
    tipoCartao: "CREDITO",
    preferencial: false,
  })
  const [erroCartao, setErroCartao] = useState("")
  const [salvandoCartao, setSalvandoCartao] = useState(false)

  const pedidoId = obterPedidoCheckoutId()

  const [pedido, setPedido] = useState(null)

  useEffect(() => {
    if (!pedidoId) {
      navigate("/carrinho", { replace: true })
      return
    }
    let ativo = true
    async function carregar() {
      try {
        if (!clienteId) throw new Error("Não foi possível identificar o cliente pelo UUID.")
        const pedidoAtual = await buscarMeuPedido(clienteId, pedidoId)
        const status = String(pedidoAtual?.status || "").toUpperCase()
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
        const [respostaCartoes, respostaBandeiras] = await Promise.all([
          formaPagamentoService.listarFormasPagamento(clienteId),
          formaPagamentoService.listarBandeiras(),
        ])
        const bandeiras = (
          Array.isArray(respostaBandeiras) ? respostaBandeiras : []
        )
          .filter((bandeira) => bandeira.disponivel)
          .map((bandeira) => bandeira.nome)
        const lista = (
          Array.isArray(respostaCartoes) ? respostaCartoes : []
        ).filter(
          (cartao) =>
            cartao.ativo === true &&
            cartao.tipoCartao === "CREDITO" &&
            bandeiras.includes(cartao.bandeira),
        )
        if (!ativo) return
        setPedido(pedidoAtual)
        setCupomAplicado(
          pedidoAtual?.cupom?.codigo ||
            pedidoAtual?.cupomCodigo ||
            (typeof pedidoAtual?.cupom === "string" ? pedidoAtual.cupom : ""),
        )
        setBandeirasDisponiveis(bandeiras)
        setCartoes(lista)
        const preferencial =
          lista.find(
            (cartao) =>
              cartao.ativo === true &&
              cartao.tipoCartao === "CREDITO" &&
              cartao.preferencial &&
              bandeiras.includes(cartao.bandeira),
          ) || lista[0]
        if (preferencial) {
          setSelecionado(String(preferencial.id))
          setPagamentos([
            {
              id: Date.now(),
              formaPagamentoId: String(preferencial.id),
              valor: Number(pedidoAtual.total || 0),
              parcelas: 1,
            },
          ])
        }
        setValor(Number(pedidoAtual.total || 0).toFixed(2))
      } catch (error) {
        console.error(
          "Erro ao retomar checkout:",
          error?.response?.data || error,
        )
        limparCheckoutLocal()
        if (ativo) {
          setErro(obterMensagemErro(error))
          navigate("/carrinho", { replace: true })
        }
      }
    }
    carregar()
    return () => {
      ativo = false
    }
  }, [clienteId, navigate, pedidoId])

  useEffect(() => {
    if (bandeirasDisponiveis.length)
      setCartoes((atuais) =>
        atuais.filter(
          (cartao) =>
            cartao.ativo === true &&
            cartao.tipoCartao === "CREDITO" &&
            bandeirasDisponiveis.includes(cartao.bandeira),
        ),
      )
  }, [bandeirasDisponiveis])

  if (!pedido) return null

  const totalAPagar = Number(pedido.total ?? pedido.valorTotal ?? 0)

  function atualizarCartao(campo) {
    return (event) => {
      const valor = event.target.value
      setFormCartao((atual) => ({
        ...atual,
        [campo]:
          campo === "numeroCartao"
            ? mascararNumeroCartao(valor)
            : campo === "validade"
              ? mascararValidade(valor)
              : valor,
      }))
    }
  }

  function abrirCadastroCartao() {
    setFormCartao({
      nomeTitular: "",
      numeroCartao: "",
      validade: "",
      bandeira: bandeirasDisponiveis[0] || "",
      tipoCartao: "CREDITO",
      preferencial: cartoes.length === 0,
    })
    setErroCartao("")
    setModalAberto(true)
  }

  async function salvarCartao(event) {
    event.preventDefault()
    const erroValidacao = validarCartao(formCartao)
    if (erroValidacao) {
      setErroCartao(erroValidacao)
      return
    }
    const numero = formCartao.numeroCartao.replace(/\D/g, "")
    setSalvandoCartao(true)
    setErroCartao("")
    try {
      await formaPagamentoService.criarFormaPagamento(clienteId, {
        ...formCartao,
        tipoCartao: "CREDITO",
        nomeTitular: formCartao.nomeTitular.trim(),
        numeroCartao: numero,
        validade: formCartao.validade.trim(),
      })
      const lista = await formaPagamentoService.listarFormasPagamento(
        clienteId,
      )
      const novosCartoes = (Array.isArray(lista) ? lista : []).filter(
        (cartao) =>
          cartao.ativo === true &&
          cartao.tipoCartao === "CREDITO" &&
          bandeirasDisponiveis.includes(cartao.bandeira),
      )
      setCartoes(novosCartoes)
      const novo =
        novosCartoes.find(
          (cartao) => cartao.bandeira === formCartao.bandeira,
        ) || novosCartoes[novosCartoes.length - 1]
      if (novo) {
        setSelecionado(String(novo.id))
        setPagamentos((atuais) =>
          atuais.length
            ? atuais
            : [
                {
                  id: Date.now(),
                  formaPagamentoId: String(novo.id),
                  valor: Number(pedido.total || 0),
                  parcelas: 1,
                },
              ],
        )
      }
      atualizarUsuario({ cartoes: novosCartoes })
      setModalAberto(false)
      setFormCartao({
        nomeTitular: "",
        numeroCartao: "",
        validade: "",
        bandeira: bandeirasDisponiveis[0] || "",
        tipoCartao: "CREDITO",
        preferencial: false,
      })
    } catch (error) {
      const mensagem =
        error?.message || error?.mensagem || "Não foi possível salvar o cartão."
      setErroCartao(
        /bandeira/i.test(mensagem)
          ? "A bandeira deste cartão não está disponível para pagamento."
          : /tipo/i.test(mensagem)
            ? "Somente cartões de crédito podem ser usados no pagamento."
            : mensagem,
      )
    } finally {
      setSalvandoCartao(false)
    }
  }

  function adicionarPagamento() {
    setPagamentos((atuais) => [
      ...atuais,
      {
        id: Date.now(),
        formaPagamentoId: cartoes[0] ? String(cartoes[0].id) : "",
        valor: 0,
        parcelas: 1,
      },
    ])
  }

  function atualizarPagamento(id, campo, novoValor) {
    setPagamentos((atuais) => {
      if (campo !== "valor")
        return atuais.map((pagamento) =>
          pagamento.id === id
            ? {
                ...pagamento,
                [campo]:
                  campo === "formaPagamentoId"
                    ? String(novoValor)
                    : Number(novoValor),
              }
            : pagamento,
        )
      const totalCompra = Number(Number(pedido?.total || 0).toFixed(2))
      const outrosPagamentos = atuais
        .filter((pagamento) => pagamento.id !== id)
        .reduce((soma, pagamento) => soma + Number(pagamento.valor || 0), 0)
      const limite = Math.max(
        0,
        Number((totalCompra - outrosPagamentos).toFixed(2)),
      )
      const valorInformado = Math.max(0, Number(novoValor) || 0)
      const valorLimitado = Number(Math.min(valorInformado, limite).toFixed(2))
      return atuais.map((pagamento) =>
        pagamento.id === id
          ? { ...pagamento, valor: valorLimitado }
          : pagamento,
      )
    })
  }

  function removerPagamento(id) {
    setPagamentos((atuais) =>
      atuais.length > 1
        ? atuais.filter((pagamento) => pagamento.id !== id)
        : atuais,
    )
  }

  async function aplicarCupom(event) {
    event.preventDefault()
    const codigo = codigoCupom.trim().toUpperCase()
    if (!codigo) {
      setErro("Informe um código de cupom ou voucher.")
      return
    }
    if (!clienteId) {
      setErro("Não foi possível identificar o cliente pelo UUID.")
      return
    }

    setAplicandoCupom(true)
    setErro("")
    try {
      const validacao = await cupomService.validarCupom(codigo)
      const dadosValidacao = validacao?.data || validacao
      if (!dadosValidacao?.valido) {
        setErro(dadosValidacao?.mensagem || "Cupom ou voucher inválido ou já utilizado.")
        return
      }

      const resposta = await cupomService.aplicarCupomNoPedido(
        pedido.id,
        codigo,
        clienteId,
      )
      const pedidoAtualizado = resposta?.pedido || resposta?.data || resposta
      const novoTotal = Number(
        pedidoAtualizado?.total ?? pedidoAtualizado?.valorTotal,
      )
      if (!Number.isFinite(novoTotal) || novoTotal < 0) {
        throw new Error("O backend não retornou o total atualizado do pedido.")
      }

      setPedido(pedidoAtualizado)
      setCupomAplicado(codigo)
      setPagamentos((atuais) =>
        novoTotal === 0
          ? []
          : [
              {
                id: atuais[0]?.id || Date.now(),
                formaPagamentoId:
                  atuais[0]?.formaPagamentoId ||
                  selecionado ||
                  String(cartoes[0]?.id || ""),
                valor: novoTotal,
                parcelas: atuais[0]?.parcelas || 1,
              },
            ],
      )
      setCodigoCupom("")
    } catch (error) {
      setErro(
        error?.mensagem ||
          error?.message ||
          "Não foi possível aplicar o cupom ou voucher ao pedido.",
      )
    } finally {
      setAplicandoCupom(false)
    }
  }

  function continuar() {
    const pagamentosValidos = pagamentos.filter(
      (pagamento) => pagamento.formaPagamentoId,
    )
    const totalPagamentos = pagamentosValidos.reduce(
      (soma, pagamento) => soma + Number(pagamento.valor || 0),
      0,
    )
    const totalCompra = totalAPagar
    if (totalCompra === 0 && pagamentosValidos.length === 0) {
      navigate("/checkout/revisao", {
        state: { pagamentos: [], cartoes: [] },
      })
      return
    }
    if (!pagamentosValidos.length)
      return setErro("Selecione pelo menos um cartão.")
    if (pagamentosValidos.some((pagamento) => Number(pagamento.valor) < 1))
      return setErro("Cada cartão deve pagar pelo menos R$ 1,00.")
    if (Number(totalPagamentos.toFixed(2)) !== Number(totalCompra.toFixed(2)))
      return setErro("A soma dos cartões precisa completar o valor da compra.")
    const pagamentosParaRevisao = pagamentosValidos.map(
      ({ id, ...pagamento }) => ({
        ...pagamento,
        formaPagamentoId: Number(pagamento.formaPagamentoId),
        valor: Number(Number(pagamento.valor).toFixed(2)),
        parcelas: Number(pagamento.parcelas),
      }),
    )
    const cartoesParaRevisao = pagamentosValidos
      .map((pagamento) =>
        cartoes.find(
          (cartao) => String(cartao.id) === String(pagamento.formaPagamentoId),
        ),
      )
      .filter(Boolean)
    navigate("/checkout/revisao", {
      state: {
        pagamentos: pagamentosParaRevisao,
        cartoes: cartoesParaRevisao,
        formaPagamentoId: Number(pagamentosValidos[0].formaPagamentoId),
        valor: Number(pagamentosValidos[0].valor),
        parcelas: Number(pagamentosValidos[0].parcelas),
      },
    })
  }

  return (
    <div className="checkout-flow">
      <Header />
      <main className="page-container checkout-page checkout-route-page">
        <h1>Checkout</h1>
        <CheckoutStepper etapa={1} />
        <div className="checkout-route-layout">
          <section className="card checkout-route-panel">
            <h2>Forma de pagamento</h2>
            {erro && (
              <div role="alert" className="checkout-error">
                {erro}
              </div>
            )}
            {totalAPagar === 0 && (
              <div className="checkout-empty-address" role="status">
                <p>O cupom ou voucher cobriu o valor total do pedido.</p>
                <span>Você pode continuar sem adicionar um cartão.</span>
              </div>
            )}
            {totalAPagar > 0 && cartoes.length === 0 && (
              <div className="checkout-empty-address">
                <p>Nenhum cartão cadastrado.</p>
                <span>Cadastre um cartão para continuar sua compra.</span>
                <button className="btn-primary" onClick={abrirCadastroCartao}>
                  + Cadastrar cartão
                </button>
              </div>
            )}
            {totalAPagar > 0 && cartoes.length > 0 && (
              <>
                <div className="checkout-payment-list">
                  {cartoes.map((cartao) => (
                    <label key={cartao.id} className="checkout-option">
                      <input
                        type="radio"
                        checked={
                          pagamentos[0]?.formaPagamentoId === String(cartao.id)
                        }
                        onChange={() => {
                          setSelecionado(String(cartao.id))
                          setPagamentos((atuais) =>
                            atuais.map((pagamento, index) =>
                              index === 0
                                ? {
                                    ...pagamento,
                                    formaPagamentoId: String(cartao.id),
                                  }
                                : pagamento,
                            ),
                          )
                        }}
                      />
                      <span>
                        <strong>
                          {cartao.bandeira || "Cartão"} ****{" "}
                          {cartao.ultimos4 || cartao.ultimosDigitos || ""}
                        </strong>
                        <small>
                          {cartao.nomeTitular ||
                            cartao.nome ||
                            "Forma de pagamento salva"}
                          {cartao.validade
                            ? ` · Validade ${cartao.validade}`
                            : ""}
                        </small>
                      </span>
                    </label>
                  ))}
                </div>
                <div className="checkout-split-list">
                  {pagamentos.map((pagamento, index) => (
                    <div className="checkout-split-row" key={pagamento.id}>
                      <label className="label">
                        Cartão
                        <select
                          className="input-field"
                          value={pagamento.formaPagamentoId}
                          onChange={(event) =>
                            atualizarPagamento(
                              pagamento.id,
                              "formaPagamentoId",
                              event.target.value,
                            )
                          }
                        >
                          {cartoes.map((cartao) => (
                            <option key={cartao.id} value={cartao.id}>
                              {cartao.bandeira || "Cartão"} ****{" "}
                              {cartao.ultimos4 || cartao.ultimosDigitos || ""}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="label">
                        Valor
                        <input
                          className="input-field"
                          type="number"
                          min="0"
                          step="0.01"
                          value={pagamento.valor}
                          onChange={(event) =>
                            atualizarPagamento(
                              pagamento.id,
                              "valor",
                              event.target.value,
                            )
                          }
                        />
                      </label>
                      <label className="label">
                        Parcelas
                        <select
                          className="input-field"
                          value={pagamento.parcelas}
                          onChange={(event) =>
                            atualizarPagamento(
                              pagamento.id,
                              "parcelas",
                              event.target.value,
                            )
                          }
                        >
                          {Array.from({ length: 12 }, (_, item) => (
                            <option key={item + 1} value={item + 1}>
                              {item + 1}x
                            </option>
                          ))}
                        </select>
                      </label>
                      {pagamentos.length > 1 && (
                        <button
                          type="button"
                          className="btn-ghost checkout-split-remove"
                          onClick={() => removerPagamento(pagamento.id)}
                        >
                          Remover
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  className="btn-ghost checkout-add-address"
                  onClick={adicionarPagamento}
                >
                  + Dividir pagamento
                </button>
                <button
                  className="btn-ghost checkout-add-address"
                  onClick={abrirCadastroCartao}
                >
                  + Adicionar novo cartão
                </button>
              </>
            )}
            {totalAPagar > 0 && cartoes.length === 0 && (
              <div className="checkout-payment-fields">
                <label className="label">
                  Valor
                  <input
                    className="input-field"
                    type="number"
                    min="1"
                    step="0.01"
                    value={valor}
                    onChange={(event) => setValor(event.target.value)}
                  />
                </label>
                <label className="label">
                  Parcelas
                  <select
                    className="input-field"
                    value={parcelas}
                    onChange={(event) => setParcelas(event.target.value)}
                  >
                    {Array.from({ length: 12 }, (_, index) => (
                      <option key={index + 1} value={index + 1}>
                        {index + 1}x
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}
            <form
              onSubmit={aplicarCupom}
              style={{ display: "flex", gap: 8, alignItems: "end", marginTop: 20 }}
            >
              <label className="label" style={{ flex: 1, margin: 0 }}>
                Cupom ou voucher
                <input
                  className="input-field"
                  value={codigoCupom}
                  onChange={(event) => setCodigoCupom(event.target.value)}
                  placeholder="Digite o código"
                  autoComplete="off"
                  disabled={aplicandoCupom}
                />
              </label>
              <button
                className="btn-secondary"
                type="submit"
                disabled={aplicandoCupom || !codigoCupom.trim()}
              >
                {aplicandoCupom ? "Aplicando..." : "Aplicar"}
              </button>
            </form>
            {cupomAplicado && (
              <p role="status" style={{ color: "var(--success)" }}>
                Código aplicado: {cupomAplicado}
              </p>
            )}
            <div className="checkout-actions">
              <button
                className="btn-ghost"
                onClick={() => navigate("/checkout/endereco")}
              >
                ← Voltar
              </button>
              <button
                className="btn-primary"
                onClick={continuar}
                disabled={salvando || (totalAPagar > 0 && cartoes.length === 0)}
              >
                Revisar pedido
              </button>
            </div>
          </section>
          <CheckoutSummary pedido={pedido} />
        </div>
      </main>
      <Modal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        title="Cadastrar cartão"
        width={520}
      >
        <form className="cart-address-form" onSubmit={salvarCartao}>
          <div>
            <label className="label">Bandeira *</label>
            <select
              className="input-field"
              value={formCartao.bandeira}
              onChange={atualizarCartao("bandeira")}
            >
              <option value="VISA">Visa</option>
              <option value="MASTERCARD">Mastercard</option>
              <option value="ELO">Elo</option>
              <option value="AMEX">American Express</option>
              <option value="HIPERCARD">Hipercard</option>
            </select>
          </div>
          <div>
            <label className="label">Número do cartão *</label>
            <input
              className="input-field"
              value={formCartao.numeroCartao}
              onChange={atualizarCartao("numeroCartao")}
              placeholder="0000 0000 0000 0000"
              maxLength={19}
              inputMode="numeric"
            />
          </div>
          <div>
            <label className="label">Nome do titular *</label>
            <input
              className="input-field"
              value={formCartao.nomeTitular}
              onChange={atualizarCartao("nomeTitular")}
              placeholder="Como aparece no cartão"
            />
          </div>
          <div className="cart-address-grid">
            <div>
              <label className="label">Validade *</label>
              <input
                className="input-field"
                value={formCartao.validade}
                onChange={atualizarCartao("validade")}
                placeholder="MM/AA"
                maxLength={5}
              />
            </div>
            <div>
              <label className="label">Tipo *</label>
              <select
                className="input-field"
                value={formCartao.tipoCartao}
                onChange={atualizarCartao("tipoCartao")}
              >
                <option value="CREDITO">Crédito</option>
                <option value="DEBITO">Débito</option>
              </select>
            </div>
          </div>
          {erroCartao && (
            <div className="checkout-error" role="alert">
              {erroCartao}
            </div>
          )}
          <div className="cart-address-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setModalAberto(false)}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={salvandoCartao}
            >
              {salvandoCartao ? "Salvando..." : "Salvar cartão"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
