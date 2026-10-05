import React, { useEffect, useState } from "react"

import { useNavigate } from "react-router-dom"

import Header from "@/shared/components/Header"

import Modal from "@/shared/components/Modal"

import { obterClienteId, useAuth } from "@/features/auth/context/AuthContext"
import { useCarrinho } from "@/features/carrinho/context/CarrinhoContext"

import { enderecoService } from "@/features/cliente/api/enderecoService"
import { cupomService } from "@/features/cupom/api/cupomService"

import {
  atualizarPedidoCheckoutParaEndereco,
  buscarMeuPedido,
  iniciarCompra,
  normalizarEnderecoCheckout,  obterEnderecoCheckout,
  obterIndiceEnderecoSelecionado,  obterMensagemErro,
  obterPedidoCheckoutId,
  salvarEnderecoCheckout,
  salvarPedidoCheckout,
} from "@/features/checkout/api/checkoutApi"

import {
  CheckoutStepper,
  CheckoutSummary,
} from "@/features/checkout/components/CheckoutChrome"

function formatarEndereco(endereco) {
  return `${endereco.logradouro}, ${endereco.numero}${
    endereco.complemento ? ` - ${endereco.complemento}` : ""
  } - ${endereco.bairro}, ${endereco.cidade}/${endereco.estado} - CEP ${endereco.cep}`
}

function quantidadesPorLivro(itens) {
  if (!Array.isArray(itens)) return null

  const quantidades = new Map()
  for (const item of itens) {
    const livroId = item?.livroId ?? item?.produtoId ?? item?.livro?.id
    const quantidade = Number(item?.quantidade)
    if (livroId == null || !Number.isFinite(quantidade) || quantidade < 1) {
      return null
    }
    const chave = String(livroId)
    quantidades.set(chave, (quantidades.get(chave) || 0) + quantidade)
  }
  return quantidades
}

function pedidoCorrespondeAoCarrinho(pedido, itensCarrinho) {
  const quantidadesPedido = quantidadesPorLivro(pedido?.itens)
  const quantidadesCarrinho = quantidadesPorLivro(itensCarrinho)
  if (!quantidadesPedido || !quantidadesCarrinho) return false
  if (quantidadesPedido.size !== quantidadesCarrinho.size) return false

  return [...quantidadesCarrinho].every(
    ([livroId, quantidade]) => quantidadesPedido.get(livroId) === quantidade,
  )
}

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

export default function CheckoutEnderecoPage() {
  const { usuario, atualizarUsuario } = useAuth()
  const { itens: itensCarrinho, carregando: carregandoCarrinho } = useCarrinho()
  const clienteId = obterClienteId(usuario)
  const navigate = useNavigate()

  const [enderecos, setEnderecos] = useState([])
  const [selecionado, setSelecionado] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [atualizandoFrete, setAtualizandoFrete] = useState(false)
  const [pedidoCheckout, setPedidoCheckout] = useState(null)
  const [carregandoPedido, setCarregandoPedido] = useState(() => Boolean(obterPedidoCheckoutId()))
  const [codigoCupom, setCodigoCupom] = useState("")
  const [cupomInicial, setCupomInicial] = useState(null)
  const [validandoCupom, setValidandoCupom] = useState(false)
  const [erro, setErro] = useState("")

  const [modalAberto, setModalAberto] = useState(false)
  const [formEndereco, setFormEndereco] = useState(enderecoVazio)
  const [salvandoEndereco, setSalvandoEndereco] = useState(false)
  const [erroEndereco, setErroEndereco] = useState("")

  function enderecosIguais(primeiro, segundo) {
    if (!primeiro || !segundo) return false

    const idPrimeiro = primeiro.id ?? primeiro.idEndereco
    const idSegundo = segundo.id ?? segundo.idEndereco
    if (idPrimeiro != null && idSegundo != null) {
      return String(idPrimeiro) === String(idSegundo)
    }

    const campos = ["logradouro", "numero", "bairro", "cidade", "estado", "cep"]
    return campos.every(
      (campo) =>
        String(primeiro[campo] || "").trim().toLowerCase() ===
        String(segundo[campo] || "").trim().toLowerCase(),
    )
  }

  useEffect(() => {
    if (!clienteId) {
      setErro("Não foi possível identificar o cliente pelo UUID.")
      setCarregando(false)
      return
    }
    enderecoService
      .listarEnderecos(clienteId)
      .then((resposta) => {
        const lista = Array.isArray(resposta) ? resposta : []
        const pedidoId = obterPedidoCheckoutId()
        const enderecoPersistido = pedidoId ? obterEnderecoCheckout(String(pedidoId)) : null
        const indiceSelecionado = obterIndiceEnderecoSelecionado(lista, enderecoPersistido)
        setEnderecos(lista)
        setSelecionado(indiceSelecionado)
      })
      .catch((error) =>
        setErro(error?.mensagem || "Não foi possível carregar os endereços."),
      )
      .finally(() => setCarregando(false))
  }, [clienteId])

  useEffect(() => {
    const pedidoId = obterPedidoCheckoutId()
    if (!pedidoId || !clienteId) {
      setCarregandoPedido(false)
      return
    }

    let ativo = true
    setCarregandoPedido(true)
    buscarMeuPedido(clienteId, pedidoId)
      .then(async (pedido) => {
        if (!ativo) return
        setPedidoCheckout(pedido)
        const codigo = typeof pedido?.cupom === "string" ? pedido.cupom : pedido?.cupom?.codigo
        if (codigo) {
          setCodigoCupom(codigo)
          setValidandoCupom(true)
          try {
            const resposta = await cupomService.validarCupom(codigo)
            const validacao = resposta?.data || resposta
            if (ativo && validacao?.valido && String(validacao.tipo).toUpperCase() === "PERCENTUAL") {
              setCupomInicial({ codigo: validacao.codigo || codigo, tipo: "PERCENTUAL" })
            }
          } catch {
            // Mantém os valores do pedido retornados pelo backend mesmo se o cupom não puder mais ser validado.
          } finally {
            if (ativo) setValidandoCupom(false)
          }
        }
      })
      .catch((error) => {
        if (ativo) setErro(obterMensagemErro(error))
      })
      .finally(() => {
        if (ativo) setCarregandoPedido(false)
      })

    return () => {
      ativo = false
    }
  }, [clienteId])

  function atualizarCampo(campo) {
    return (event) =>
      setFormEndereco((atual) => ({
        ...atual,
        [campo]:
          campo === "cep"
            ? mascararCep(event.target.value)
            : event.target.value,
      }))
  }

  function abrirCadastro() {
    setFormEndereco(enderecoVazio)
    setErroEndereco("")
    setModalAberto(true)
  }

  async function validarCupomInicial() {
    const codigo = codigoCupom.trim().toUpperCase()
    if (!codigo) {
      setErro("Informe um código de cupom.")
      return
    }

    setValidandoCupom(true)
    setErro("")
    try {
      const resposta = await cupomService.validarCupom(codigo)
      const validacao = resposta?.data || resposta
      if (!validacao?.valido) {
        throw new Error(validacao?.mensagem || "Cupom inválido.")
      }
      if (String(validacao.tipo || "").toUpperCase() !== "PERCENTUAL") {
        throw new Error("Voucher de troca deve ser aplicado após iniciar o pedido.")
      }

      const cupom = {
        codigo: validacao.codigo || codigo,
        tipo: "PERCENTUAL",
      }
      setCupomInicial(cupom)
      setCodigoCupom(cupom.codigo)
    } catch (error) {
      setCupomInicial(null)
      setErro(error?.message || error?.mensagem || "Não foi possível validar o cupom.")
    } finally {
      setValidandoCupom(false)
    }
  }

  async function salvarEndereco(event) {
    event.preventDefault()
    const obrigatorios = [
      "tipoEndereco",
      "logradouro",
      "numero",
      "bairro",
      "cidade",
      "estado",
      "cep",
    ]
    if (
      obrigatorios.some((campo) => !String(formEndereco[campo] || "").trim())
    ) {
      setErroEndereco("Preencha todos os campos obrigatórios.")
      return
    }
    setSalvandoEndereco(true)
    setErroEndereco("")
    try {
      const payload = {
        ...formEndereco,
        tipoEndereco: String(formEndereco.tipoEndereco || formEndereco.tipoResidencia || "").trim(),
        tipoResidencia: String(formEndereco.tipoResidencia || formEndereco.tipoEndereco || "").trim(),
        logradouro: String(formEndereco.logradouro || formEndereco.tipoLogradouro || "").trim(),
        tipoLogradouro: String(formEndereco.tipoLogradouro || formEndereco.logradouro || "").trim(),
        estado: String(formEndereco.estado || "").trim().toUpperCase(),
        cep: String(formEndereco.cep || "").trim(),
        pais: String(formEndereco.pais || "").trim(),
        observacoes: String(formEndereco.observacoes || "").trim(),
        principal: Boolean(formEndereco.principal),
      }
      const criado = await enderecoService.criarEndereco(clienteId, payload)
      const novoEndereco = criado || payload
      const novosEnderecos = [...enderecos, novoEndereco]
      setEnderecos(novosEnderecos)
      setSelecionado(novosEnderecos.length - 1)
      atualizarUsuario({
        enderecos: [...(usuario.enderecos || []), novoEndereco],
      })
      setModalAberto(false)
      setFormEndereco(enderecoVazio)
    } catch (error) {
      setErroEndereco(error?.message || "Não foi possível salvar o endereço.")
    } finally {
      setSalvandoEndereco(false)
    }
  }

  async function salvarEnderecoSelecionadoAtual(index) {
    const enderecoAtual = enderecos[index]
    if (!enderecoAtual) return

    const pedidoExistente = obterPedidoCheckoutId()
    if (!pedidoExistente) return null

    const enderecoDoPedido = obterEnderecoCheckout(String(pedidoExistente))
    const codigoCupomPedido = typeof pedidoCheckout?.cupom === "string"
      ? pedidoCheckout.cupom.trim().toUpperCase()
      : pedidoCheckout?.cupom?.codigo?.trim().toUpperCase() || ""
    const codigoCupomDesejado = cupomInicial?.codigo?.trim().toUpperCase() || ""
    if (
      enderecosIguais(enderecoDoPedido, enderecoAtual) &&
      pedidoCorrespondeAoCarrinho(pedidoCheckout, itensCarrinho) &&
      codigoCupomPedido === codigoCupomDesejado
    ) return null

    const carrinhoId = Number(localStorage.getItem("carrinhoId"))

    if (!clienteId || !Number.isInteger(carrinhoId)) {
      throw new Error("Não foi possível identificar o cliente ou o carrinho para atualizar o frete.")
    }

    const pedidoAtualizado = await atualizarPedidoCheckoutParaEndereco({
      clienteId,
      carrinhoId,
      endereco: enderecoAtual,
      pedidoAtualId: pedidoExistente,
      cupom: cupomInicial?.codigo,
    })

    if (!pedidoAtualizado?.id) {
      throw new Error("O backend não retornou o pedido atualizado para calcular o frete.")
    }

    salvarEnderecoCheckout(
      pedidoAtualizado.id,
      normalizarEnderecoCheckout(enderecoAtual),
    )
    setPedidoCheckout(pedidoAtualizado)
    return pedidoAtualizado
  }

  async function atualizarEnderecoSelecionado(index) {
    const enderecoAtual = enderecos[index]
    if (!enderecoAtual || atualizandoFrete || salvando) return

    const selecaoAnterior = selecionado
    setSelecionado(index)
    setErro("")

    const pedidoExistente = obterPedidoCheckoutId()
    const enderecoDoPedido = pedidoExistente
      ? obterEnderecoCheckout(String(pedidoExistente))
      : null
    if (
      !pedidoExistente ||
      (enderecosIguais(enderecoDoPedido, enderecoAtual) &&
        pedidoCorrespondeAoCarrinho(pedidoCheckout, itensCarrinho) &&
        (typeof pedidoCheckout?.cupom === "string" ? pedidoCheckout.cupom.trim().toUpperCase() : pedidoCheckout?.cupom?.codigo?.trim().toUpperCase() || "") ===
          (cupomInicial?.codigo?.trim().toUpperCase() || ""))
    ) return

    setAtualizandoFrete(true)
    try {
      await salvarEnderecoSelecionadoAtual(index)
    } catch (error) {
      setSelecionado(selecaoAnterior)
      setErro(obterMensagemErro(error))
    } finally {
      setAtualizandoFrete(false)
    }
  }

  function selecionarEndereco(index) {
    if (index === selecionado) return
    atualizarEnderecoSelecionado(index)
  }

  async function continuar() {
    if (selecionado === null || !enderecos[selecionado]) {
      setErro("Selecione um endereço de entrega válido.")
      return
    }
    if (codigoCupom.trim() && !cupomInicial) {
      setErro("Valide o cupom antes de continuar.")
      return
    }

    setSalvando(true)
    setErro("")
    try {
      const pedidoExistente = obterPedidoCheckoutId()
      const enderecoAtual = enderecos[selecionado]
      const enderecoDoPedido = pedidoExistente
        ? obterEnderecoCheckout(String(pedidoExistente))
        : null

      if (
        pedidoExistente &&
        enderecosIguais(enderecoDoPedido, enderecoAtual) &&
        pedidoCorrespondeAoCarrinho(pedidoCheckout, itensCarrinho) &&
        (typeof pedidoCheckout?.cupom === "string" ? pedidoCheckout.cupom.trim().toUpperCase() : pedidoCheckout?.cupom?.codigo?.trim().toUpperCase() || "") ===
          (cupomInicial?.codigo?.trim().toUpperCase() || "")
      ) {
        navigate("/checkout/pagamento")
        return
      }

      let pedido
      if (pedidoExistente) {
        pedido = await salvarEnderecoSelecionadoAtual(selecionado)
      } else {
        const carrinhoId = Number(localStorage.getItem("carrinhoId"))
        if (!Number.isInteger(carrinhoId)) {
          throw new Error("Seu carrinho não foi encontrado.")
        }

        pedido = await iniciarCompra({
          clienteId,
          carrinhoId,
          enderecoEntregaId: enderecoAtual.id ?? enderecoAtual.idEndereco,
          enderecoCobranca: formatarEndereco(enderecoAtual),
          ...(cupomInicial?.codigo ? { cupom: cupomInicial.codigo } : {}),
        })
        salvarPedidoCheckout(pedido)
        salvarEnderecoCheckout(
          pedido.id,
          normalizarEnderecoCheckout(enderecoAtual),
        )
        setPedidoCheckout(pedido)
      }

      if (!pedido?.id) throw new Error("O backend não retornou um pedido válido.")
      navigate("/checkout/pagamento")
    } catch (error) {
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
        <CheckoutStepper etapa={0} />
        <div className="checkout-route-layout">
          <section className="card checkout-route-panel">
            <h2>Endereço de entrega</h2>
            {carregando && <p>Carregando endereços...</p>}
            {erro && (
              <div role="alert" className="checkout-error">
                {erro}
              </div>
            )}
            <form
              onSubmit={(event) => { event.preventDefault(); validarCupomInicial() }}
              className="checkout-initial-coupon"
            >
              <label className="label" htmlFor="checkout-cupom-inicial">
                Cupom promocional (opcional)
                <input
                  id="checkout-cupom-inicial"
                  className="input-field"
                  value={codigoCupom}
                  data-testid="codigo-cupom-inicial"
                  onChange={(event) => {
                    setCodigoCupom(event.target.value.toUpperCase())
                    setCupomInicial(null)
                    setErro("")
                  }}
                  placeholder="Digite o código promocional"
                  autoComplete="off"
                  disabled={validandoCupom || salvando}
                />
              </label>
              <button
                className="btn-secondary"
                type="submit"
                data-testid="validar-cupom-inicial"
                disabled={validandoCupom || salvando || !codigoCupom.trim()}
              >
                {validandoCupom ? "Validando..." : cupomInicial ? "Cupom validado" : "Validar cupom"}
              </button>
            </form>
            {!carregando && enderecos.length === 0 && (
              <div className="checkout-empty-address">
                <p>Nenhum endereço cadastrado.</p>
                <span>Cadastre um endereço para continuar sua compra.</span>
                <button className="btn-primary" onClick={abrirCadastro}>
                  + Cadastrar endereço
                </button>
              </div>
            )}
            {enderecos.length > 0 && (
              <>
                {enderecos.map((endereco, index) => (
                  <label
                    key={endereco.id}
                    className={`checkout-option ${
                      index === selecionado ? "is-selected" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      checked={index === selecionado}
                      disabled={atualizandoFrete || salvando}
                      onChange={() => selecionarEndereco(index)}
                    />
                    <span>
                      <strong>{endereco.tipoEndereco || "Endereço"}</strong>
                      <small>{formatarEndereco(endereco)}</small>
                    </span>
                  </label>
                ))}
                <button
                  className="btn-ghost checkout-add-address"
                  onClick={abrirCadastro}
                >
                  + Adicionar novo endereço
                </button>
              </>
            )}
            <div className="checkout-actions">
              <button
                className="btn-primary"
                onClick={continuar}
                disabled={salvando || validandoCupom || atualizandoFrete || carregandoPedido || carregandoCarrinho || carregando || enderecos.length === 0}
              >
                {salvando ? "Iniciando..." : "Continuar"}
              </button>
            </div>
          </section>
          <CheckoutSummary
            pedido={pedidoCorrespondeAoCarrinho(pedidoCheckout, itensCarrinho) ? pedidoCheckout : null}
          />
          {atualizandoFrete && (
            <p role="status" className="checkout-status">
              Atualizando o frete para o endereço selecionado...
            </p>
          )}
        </div>
      </main>
      <Modal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        title="Cadastrar endereço"
        width={520}
      >
        <form className="cart-address-form" onSubmit={salvarEndereco}>
          <div>
            <label className="label">Identificação *</label>
            <input
              className="input-field"
              value={formEndereco.tipoEndereco}
              onChange={atualizarCampo("tipoEndereco")}
              placeholder="Casa, trabalho..."
            />
          </div>
          <div>
            <label className="label">CEP *</label>
            <input
              className="input-field"
              value={formEndereco.cep}
              onChange={atualizarCampo("cep")}
              placeholder="00000-000"
            />
          </div>
          <div>
            <label className="label">Logradouro *</label>
            <input
              className="input-field"
              value={formEndereco.logradouro}
              onChange={atualizarCampo("logradouro")}
            />
          </div>
          <div className="cart-address-grid">
            <div>
              <label className="label">Número *</label>
              <input
                className="input-field"
                value={formEndereco.numero}
                onChange={atualizarCampo("numero")}
              />
            </div>
            <div>
              <label className="label">Complemento</label>
              <input
                className="input-field"
                value={formEndereco.complemento}
                onChange={atualizarCampo("complemento")}
              />
            </div>
          </div>
          <div>
            <label className="label">Bairro *</label>
            <input
              className="input-field"
              value={formEndereco.bairro}
              onChange={atualizarCampo("bairro")}
            />
          </div>
          <div className="cart-address-grid">
            <div>
              <label className="label">Cidade *</label>
              <input
                className="input-field"
                value={formEndereco.cidade}
                onChange={atualizarCampo("cidade")}
              />
            </div>
            <div>
              <label className="label">Estado *</label>
              <select
                className="input-field"
                value={formEndereco.estado}
                onChange={atualizarCampo("estado")}
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
                value={formEndereco.pais}
                onChange={atualizarCampo("pais")}
                placeholder="Brasil"
              />
            </div>
            <div>
              <label className="label">Observações</label>
              <input
                className="input-field"
                value={formEndereco.observacoes}
                onChange={atualizarCampo("observacoes")}
                placeholder="Ponto de referência"
              />
            </div>
          </div>
          <label className="cart-address-principal">
            <input
              type="checkbox"
              checked={formEndereco.principal}
              onChange={(event) =>
                setFormEndereco((atual) => ({
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
              onClick={() => setModalAberto(false)}
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
