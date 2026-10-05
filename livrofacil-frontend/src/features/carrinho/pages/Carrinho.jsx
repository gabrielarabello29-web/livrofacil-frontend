import React, { useEffect, useState } from "react"

import { Link, useNavigate } from "react-router-dom"

import Header from "@/shared/components/Header"

import Footer from "@/shared/components/Footer"

import CarrinhoItem from "@/features/carrinho/components/CarrinhoItem"

import Modal from "@/shared/components/Modal"

import { useCarrinho } from "@/features/carrinho/context/CarrinhoContext"

import { obterClienteId, useAuth } from "@/features/auth/context/AuthContext"

import { enderecoService } from "@/features/cliente/api/enderecoService"

import {
  buscarMeuPedido,
  cancelarMeuPedido,
  limparCheckoutLocal,
  obterPedidoCheckoutId,
} from "@/features/checkout/api/checkoutApi"

const estadosBR = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
]

function mascararCep(valor) {
  const digitos = String(valor || "")
    .replace(/\D/g, "")
    .slice(0, 8)

  return digitos.length > 5
    ? `${digitos.slice(0, 5)}-${digitos.slice(5)}`
    : digitos
}

const enderecoVazio = {
  tipoEndereco: "",
  tipoResidencia: "",
  logradouro: "",
  tipoLogradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  cep: "",
  pais: "",
  observacoes: "",
  principal: false,
}

export default function Carrinho() {
  const { itens, subtotal, carregando, erro, recarregar } = useCarrinho()

  const { usuario } = useAuth()
  const clienteId = obterClienteId(usuario)

  const navigate = useNavigate()

  const [mensagem, setMensagem] = useState("")

  const [modalEnderecoAberto, setModalEnderecoAberto] = useState(false)

  const [enderecoForm, setEnderecoForm] = useState(enderecoVazio)

  const [salvandoEndereco, setSalvandoEndereco] = useState(false)

  const [erroEndereco, setErroEndereco] = useState("")

  const [enderecoSalvo, setEnderecoSalvo] = useState("")

  const [limpandoCheckout, setLimpandoCheckout] = useState(false)

  // O frete é calculado pelo backend quando o pedido é iniciado e pode variar
  // conforme o subtotal e o endereço de entrega. Não calcular localmente.
  const frete = null

  useEffect(() => {
    if (!clienteId) return

    const pedidoId = obterPedidoCheckoutId()

    if (!pedidoId) return

    let ativo = true

    async function abandonarCheckoutAnterior() {
      setLimpandoCheckout(true)

      try {
        const pedido = await buscarMeuPedido(clienteId, pedidoId)

        const status = String(pedido?.status || "").toUpperCase()

        if (
          [
            "PENDENTE",
            "AGUARDANDO_PAGAMENTO",
            "EM_CHECKOUT",
            "EM_PROCESSAMENTO",
          ].includes(status)
        ) {
          await cancelarMeuPedido(clienteId, pedidoId)
        }
      } catch (error) {
        console.warn("Checkout anterior não encontrado ou já encerrado.", error)
      } finally {
        limparCheckoutLocal()

        if (ativo) {
          setLimpandoCheckout(false)

          await recarregar({ silencioso: true })
        }
      }
    }

    abandonarCheckoutAnterior()

    return () => {
      ativo = false
    }
  }, [clienteId])

  function atualizarCampoEndereco(campo) {
    return (event) =>
      setEnderecoForm((atual) => ({
        ...atual,
        [campo]:
          campo === "cep"
            ? mascararCep(event.target.value)
            : event.target.value,
      }))
  }

  function abrirCadastroEndereco() {
    if (!usuario) {
      setMensagem(
        "Entre na sua conta para cadastrar um endereço que ficará salvo no seu perfil.",
      )

      return
    }

    setEnderecoForm(enderecoVazio)

    setErroEndereco("")

    setModalEnderecoAberto(true)
  }

  async function salvarEndereco(event) {
    event.preventDefault()

    const camposObrigatorios = [
      "tipoEndereco",
      "logradouro",
      "numero",
      "bairro",
      "cidade",
      "estado",
      "cep",
    ]

    if (
      camposObrigatorios.some(
        (campo) => !String(enderecoForm[campo] || "").trim(),
      )
    ) {
      setErroEndereco("Preencha todos os campos obrigatórios para continuar.")

      return
    }

    setSalvandoEndereco(true)

    setErroEndereco("")

    try {
      const payload = {
        ...enderecoForm,
        tipoEndereco: String(enderecoForm.tipoEndereco || enderecoForm.tipoResidencia || "").trim(),
        tipoResidencia: String(enderecoForm.tipoResidencia || enderecoForm.tipoEndereco || "").trim(),
        logradouro: String(enderecoForm.logradouro || enderecoForm.tipoLogradouro || "").trim(),
        tipoLogradouro: String(enderecoForm.tipoLogradouro || enderecoForm.logradouro || "").trim(),
        estado: String(enderecoForm.estado || "").trim().toUpperCase(),
        cep: String(enderecoForm.cep || "").trim(),
        pais: String(enderecoForm.pais || "").trim(),
        observacoes: String(enderecoForm.observacoes || "").trim(),
        principal: Boolean(enderecoForm.principal),
      }

      const enderecoCriado = await enderecoService.criarEndereco(
        clienteId,
        payload,
      )

      atualizarUsuario({
        enderecos: [...(usuario.enderecos || []), enderecoCriado],
      })

      setModalEnderecoAberto(false)

      setEnderecoForm(enderecoVazio)

      setEnderecoSalvo("Endereço salvo no seu perfil.")
    } catch (error) {
      setErroEndereco(error?.message || "Não foi possível salvar o endereço.")
    } finally {
      setSalvandoEndereco(false)
    }
  }

  function continuarCompra() {
    if (!usuario) {
      sessionStorage.setItem("rotaAposCadastro", "/checkout/endereco")

      setMensagem(
        "Para continuar a compra, entre na sua conta ou cadastre-se. Seus produtos continuarão salvos no carrinho.",
      )

      return
    }

    navigate("/checkout/endereco")
  }

  return (
    <div className="checkout-flow">
      <Header />
      <main>
        <div
          className="page-container checkout-page"
          style={{ paddingTop: 40, paddingBottom: 80 }}
        >
          <div className="cart-heading">
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>
              Carrinho
            </h1>
            <span className="cart-count">
              {itens.length} {itens.length === 1 ? "item" : "itens"}
            </span>
          </div>
          {carregando && (
            <div className="card" style={{ padding: 32, textAlign: "center" }}>
              Carregando carrinho...
            </div>
          )}
          {!carregando && erro && (
            <div className="card" style={{ padding: 24, color: "#991B1B" }}>
              {erro}
              <button
                className="btn-primary"
                onClick={recarregar}
                style={{ marginLeft: 12 }}
              >
                Tentar novamente
              </button>
            </div>
          )}
          {!carregando && !erro && itens.length === 0 && (
            <div style={{ textAlign: "center", padding: "100px 0" }}>
              <h2>Seu carrinho está vazio</h2>
              <p style={{ color: "var(--text-muted)" }}>
                Adicione livros ao carrinho para continuar.
              </p>
              <Link to="/livros" className="btn-primary">
                Explorar livros
              </Link>
            </div>
          )}
          {!carregando && !erro && itens.length > 0 && (
            <div
              className="cart-layout"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 340px",
                gap: 32,
                alignItems: "start",
              }}
            >
              <div
                className="card cart-items-card"
                style={{ padding: "8px 24px 24px" }}
              >
                <h2 style={{ fontSize: 16 }}>Seus itens</h2>
                {itens.map((item) => (
                  <CarrinhoItem key={item.id} item={item} />
                ))}
              </div>
              <aside
                className="card order-summary cart-summary"
                style={{ padding: 24 }}
              >
                <h2 style={{ fontSize: 16 }}>Resumo do pedido</h2>
                <div className="summary-lines">
                  <div>
                    <span>Subtotal ({itens.length} item)</span>
                    <strong>R$ {subtotal.toFixed(2).replace(".", ",")}</strong>
                  </div>
                  <div>
                    <span>Frete</span>
                    <strong>
                      {frete == null ? "A calcular" : `R$ ${Number(frete).toFixed(2).replace(".", ",")}`}
                    </strong>
                  </div>
                </div>
                <div className="summary-total">
                  <span>Total</span>
                  <strong>
                    R$ {Number(subtotal).toFixed(2).replace(".", ",")}
                  </strong>
                </div>
                <button
                  className="btn-primary"
                  onClick={continuarCompra}
                  disabled={limpandoCheckout}
                  style={{ width: "100%" }}
                >
                  {limpandoCheckout
                    ? "Limpando checkout..."
                    : "Finalizar compra"}
                </button>
                {mensagem && (
                  <div
                    role="alert"
                    style={{
                      marginTop: 12,
                      padding: 12,
                      background: "#FEF3C7",
                      color: "#92400E",
                    }}
                  >
                    {mensagem}
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <Link className="btn-secondary" to="/login">
                        Entrar
                      </Link>
                      <Link className="btn-primary" to="/cadastro">
                        Criar cadastro
                      </Link>
                    </div>
                  </div>
                )}
                <Link
                  to="/livros"
                  style={{
                    display: "block",
                    textAlign: "center",
                    marginTop: 16,
                  }}
                >
                  ← Continuar comprando
                </Link>
              </aside>
            </div>
          )}
        </div>
      </main>
      <Footer />
      <Modal
        isOpen={modalEnderecoAberto}
        onClose={() => setModalEnderecoAberto(false)}
        title="Cadastrar endereço"
        width={520}
      >
        <form className="cart-address-form" onSubmit={salvarEndereco}>
          <div>
            <label className="label">Identificação *</label>
            <input
              className="input-field"
              value={enderecoForm.tipoEndereco}
              onChange={atualizarCampoEndereco("tipoEndereco")}
              placeholder="Casa, trabalho..."
            />
          </div>
          <div>
            <label className="label">CEP *</label>
            <input
              className="input-field"
              value={enderecoForm.cep}
              onChange={atualizarCampoEndereco("cep")}
              placeholder="00000-000"
            />
          </div>
          <div>
            <label className="label">Logradouro *</label>
            <input
              className="input-field"
              value={enderecoForm.logradouro}
              onChange={atualizarCampoEndereco("logradouro")}
            />
          </div>
          <div className="cart-address-grid">
            <div>
              <label className="label">Número *</label>
              <input
                className="input-field"
                value={enderecoForm.numero}
                onChange={atualizarCampoEndereco("numero")}
              />
            </div>
            <div>
              <label className="label">Complemento</label>
              <input
                className="input-field"
                value={enderecoForm.complemento}
                onChange={atualizarCampoEndereco("complemento")}
              />
            </div>
          </div>
          <div>
            <label className="label">Bairro *</label>
            <input
              className="input-field"
              value={enderecoForm.bairro}
              onChange={atualizarCampoEndereco("bairro")}
            />
          </div>
          <div className="cart-address-grid">
            <div>
              <label className="label">Cidade *</label>
              <input
                className="input-field"
                value={enderecoForm.cidade}
                onChange={atualizarCampoEndereco("cidade")}
              />
            </div>
            <div>
              <label className="label">Estado *</label>
              <select
                className="input-field"
                value={enderecoForm.estado}
                onChange={atualizarCampoEndereco("estado")}
              >
                <option value="">UF</option>
                {estadosBR.map((estado) => (
                  <option key={estado} value={estado}>
                    {estado}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="cart-address-grid">
            <div>
              <label className="label">País</label>
              <input
                className="input-field"
                value={enderecoForm.pais}
                onChange={atualizarCampoEndereco("pais")}
                placeholder="Brasil"
              />
            </div>
            <div>
              <label className="label">Observações</label>
              <input
                className="input-field"
                value={enderecoForm.observacoes}
                onChange={atualizarCampoEndereco("observacoes")}
                placeholder="Ponto de referência"
              />
            </div>
          </div>
          <label className="cart-address-principal">
            <input
              type="checkbox"
              checked={enderecoForm.principal}
              onChange={(event) =>
                setEnderecoForm((atual) => ({
                  ...atual,
                  principal: event.target.checked,
                }))
              }
            />{" "}
            Definir como endereço principal
          </label>
          {erroEndereco && (
            <div className="checkout-error" role="alert">
              {erroEndereco}
            </div>
          )}
          <div className="cart-address-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setModalEnderecoAberto(false)}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={salvandoEndereco}
            >
              {salvandoEndereco ? "Salvando..." : "Salvar endereço"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
