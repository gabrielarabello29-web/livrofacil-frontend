import { useEffect, useMemo, useState } from "react"

import { Link } from "react-router-dom"

import Header from "@/shared/components/Header"

import Footer from "@/shared/components/Footer"

import ClienteSidebar from "@/shared/layouts/cliente/ClienteSidebar"

import { obterClienteId, useAuth } from "@/features/auth/context/AuthContext"

import { trocaService } from "@/features/troca/api/trocaService"

import { formatarDinheiroTroca } from "@/features/troca/utils/trocaUtils"

const statusCores = {
  SOLICITADA: "badge-yellow",
  AGUARDANDO_RECEBIMENTO: "badge-blue",
  RECEBIDA: "badge-blue",
  CONCLUIDA: "badge-green",
  RECUSADA: "badge-red",
  AUTORIZADA: "badge-blue",
  TROCADA: "badge-green",
  TROCADO: "badge-green",
}

const statusNomes = {
  SOLICITADA: "Solicitada",
  AGUARDANDO_RECEBIMENTO: "Aguardando recebimento",
  RECEBIDA: "Recebida",
  CONCLUIDA: "Concluída",
  RECUSADA: "Recusada",
  AUTORIZADA: "Autorizada (legado)",
  TROCADA: "Trocada (legado)",
  TROCADO: "Trocado",
}

function lista(resposta) {
  return Array.isArray(resposta)
    ? resposta
    : Array.isArray(resposta?.data)
      ? resposta.data
      : []
}

export default function MinhasTrocas() {
  const { usuario } = useAuth()

  const clienteId = obterClienteId(usuario)

  const [trocas, setTrocas] = useState([])

  const [vouchers, setVouchers] = useState([])

  const [statusFiltro, setStatusFiltro] = useState("")

  const [tipoFiltro, setTipoFiltro] = useState("")

  const [carregando, setCarregando] = useState(true)

  const [erro, setErro] = useState("")

  const [copiado, setCopiado] = useState("")

  async function carregar() {
    if (!clienteId) {
      setErro("Não foi possível identificar o cliente pelo UUID.")
      setCarregando(false)
      return
    }

    setCarregando(true)
    setErro("")

    try {
      const [respostaTrocas, respostaVouchers] = await Promise.all([
        trocaService.listarTrocasCliente(clienteId),
        trocaService.listarVouchersCliente(clienteId),
      ])

      setTrocas(lista(respostaTrocas))
      setVouchers(lista(respostaVouchers))
    } catch (error) {
      setErro(
        error?.message ||
          "Não foi possível carregar suas solicitações e vouchers.",
      )
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [clienteId])

  const trocasFiltradas = useMemo(
    () =>
      trocas.filter(
        (troca) =>
          (!statusFiltro ||
            String(troca.status || "").toUpperCase() === statusFiltro) &&
          (!tipoFiltro ||
            String(troca.tipo || "").toUpperCase() === tipoFiltro),
      ),
    [trocas, statusFiltro, tipoFiltro],
  )

  async function copiar(codigo) {
    try {
      await navigator.clipboard.writeText(codigo)
      setCopiado(codigo)
    } catch {
      setErro(
        "Não foi possível copiar automaticamente. Selecione e copie o código manualmente.",
      )
    }
  }

  return (
    <div>
      <Header />
      <main
        className="page-container"
        style={{ paddingTop: 40, paddingBottom: 80 }}
      >
        <div style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>
          <ClienteSidebar />
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                marginBottom: 24,
              }}
            >
              <div>
                <h1
                  style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800 }}
                >
                  Trocas e Devoluções
                </h1>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    color: "var(--text-muted)",
                  }}
                >
                  Acompanhe solicitações, decisões e recebimentos.
                </p>
              </div>
              <Link to="/trocas/nova" className="btn-primary">
                Solicitar troca/devolução
              </Link>
            </div>
            {erro && (
              <div
                className="card account-feedback account-feedback-error"
                role="alert"
              >
                {erro}
                <button className="btn-secondary" onClick={carregar}>
                  Tentar novamente
                </button>
              </div>
            )}
            {!carregando && !erro && (
              <section
                className="card"
                style={{ padding: 20, marginBottom: 24 }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <h2 style={{ margin: 0, fontSize: 18 }}>
                    Meus vouchers de troca
                  </h2>
                  <Link to="/meus-cupons">Ver todos</Link>
                </div>
                {vouchers.length === 0 ? (
                  <p style={{ margin: "12px 0 0", color: "var(--text-muted)" }}>
                    Você ainda não possui vouchers de troca.
                  </p>
                ) : (
                  <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                    {vouchers.map((voucher) => (
                      <div
                        key={voucher.id || voucher.codigo}
                        data-testid="voucher-perfil"
                        style={{
                          padding: 12,
                          borderRadius: 8,
                          border: "1px solid #F3F4F6",
                        }}
                      >
                        <strong>{voucher.codigo}</strong>
                        <span
                          className={`badge ${
                            voucher.status === "DISPONIVEL"
                              ? "badge-green"
                              : "badge-gray"
                          }`}
                          style={{ marginLeft: 8 }}
                        >
                          {voucher.status}
                        </span>
                        <span style={{ marginLeft: 12 }}>
                          Saldo:{" "}
                          {formatarDinheiroTroca(
                            voucher.valor ?? voucher.saldo,
                          )}{" "}
                          · Original:{" "}
                          {formatarDinheiroTroca(voucher.valorOriginal)}
                        </span>
                        <button
                          className="btn-ghost"
                          onClick={() => copiar(voucher.codigo)}
                        >
                          Copiar
                        </button>
                        {copiado === voucher.codigo && (
                          <span role="status">Copiado</span>
                        )}
                        <div>
                          <small>
                            Troca #{voucher.trocaId ?? "—"} · Origem #
                            {voucher.voucherOrigemId ?? "—"} · Pedido de resgate
                            #{voucher.pedidoResgateId ?? "—"}
                          </small>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
            <div
              className="card"
              style={{
                padding: 14,
                marginBottom: 14,
                display: "flex",
                gap: 12,
              }}
            >
              <label>
                Status{" "}
                <select
                  data-testid="filtro-troca-status"
                  value={statusFiltro}
                  onChange={(event) => setStatusFiltro(event.target.value)}
                >
                  <option value="">Todos</option>
                  {[
                    "SOLICITADA",
                    "AGUARDANDO_RECEBIMENTO",
                    "RECEBIDA",
                    "CONCLUIDA",
                    "RECUSADA",
                    "AUTORIZADA",
                    "TROCADA",
                    "TROCADO",
                  ].map((s) => (
                    <option key={s} value={s}>
                      {statusNomes[s]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Tipo{" "}
                <select
                  data-testid="filtro-troca-tipo"
                  value={tipoFiltro}
                  onChange={(event) => setTipoFiltro(event.target.value)}
                >
                  <option value="">Todos</option>
                  <option value="TROCA">Troca</option>
                  <option value="DEVOLUCAO">Devolução</option>
                </select>
              </label>
            </div>
            {carregando && (
              <div className="card" style={{ padding: 24 }}>
                Carregando solicitações...
              </div>
            )}
            {!carregando && !erro && trocasFiltradas.length === 0 && (
              <div
                className="card"
                style={{ padding: 36, textAlign: "center" }}
              >
                Nenhuma solicitação encontrada para os filtros selecionados.
              </div>
            )}
            {!carregando && !erro && trocasFiltradas.length > 0 && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                {trocasFiltradas.map((troca) => {
                  const status = String(troca.status || "").toUpperCase()
                  return (
                    <article
                      key={troca.id}
                      className="card"
                      style={{ padding: 20 }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 16,
                          marginBottom: 14,
                        }}
                      >
                        <div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              marginBottom: 4,
                            }}
                          >
                            <strong>Solicitação #{troca.id}</strong>
                            <span
                              className={`badge ${statusCores[status] || "badge-gray"}`}
                            >
                              {statusNomes[status] ||
                                troca.status ||
                                "Não informado"}
                            </span>
                          </div>
                          <p
                            style={{
                              margin: 0,
                              fontSize: 13,
                              color: "var(--text-muted)",
                            }}
                          >
                            Pedido #{troca.pedidoId || "—"} ·{" "}
                            {troca.tipo === "DEVOLUCAO" ? "Devolução" : "Troca"}{" "}
                            ·{" "}
                            {troca.criadoEm
                              ? new Date(troca.criadoEm).toLocaleDateString(
                                  "pt-BR",
                                )
                              : "Data não informada"}
                          </p>
                        </div>
                        <Link
                          className="btn-secondary"
                          to={`/trocas/${troca.id}`}
                        >
                          Detalhes e histórico
                        </Link>
                      </div>
                      <div
                        style={{
                          borderTop: "1px solid #F3F4F6",
                          paddingTop: 12,
                          fontSize: 13,
                        }}
                      >
                        <strong>{troca.titulo || "Item do pedido"}</strong> ·
                        Solicitada: {troca.quantidadeSolicitada ?? "—"} ·
                        Recebida: {troca.quantidadeRecebida ?? 0}
                        <p>{troca.motivo}</p>
                      </div>
                      {troca.motivoRecusa && (
                        <p>
                          <strong>Justificativa:</strong> {troca.motivoRecusa}
                        </p>
                      )}
                      {(status === "CONCLUIDA" ||
                        status === "TROCADA" ||
                        status === "TROCADO") && (
                        <p data-testid="credito-troca">
                          Crédito em voucher:{" "}
                          {formatarDinheiroTroca(troca.voucherValor)}{" "}
                          {troca.voucherCodigo && (
                            <>
                              ·{" "}
                              <Link to="/meus-cupons">
                                {troca.voucherCodigo}
                              </Link>
                            </>
                          )}
                        </p>
                      )}
                    </article>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
