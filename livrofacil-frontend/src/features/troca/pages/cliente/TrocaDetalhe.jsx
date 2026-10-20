import { useEffect, useState } from "react"

import { Link, useParams } from "react-router-dom"

import Header from "@/shared/components/Header"

import Footer from "@/shared/components/Footer"

import ClienteSidebar from "@/shared/layouts/cliente/ClienteSidebar"

import { obterClienteId, useAuth } from "@/features/auth/context/AuthContext"

import { trocaService } from "@/features/troca/api/trocaService"

import {
  formatarDataTroca,
  formatarDinheiroTroca,
} from "@/features/troca/utils/trocaUtils"

const statusLabel = {
  SOLICITADA: "Solicitada",

  AGUARDANDO_RECEBIMENTO: "Aguardando recebimento",

  RECEBIDA: "Recebida",

  CONCLUIDA: "Concluída",

  RECUSADA: "Recusada",

  AUTORIZADA: "Autorizada (legado)",

  TROCADA: "Trocada (legado)",

  TROCADO: "Trocado",
}

function normalizarLista(resposta) {
  return Array.isArray(resposta)
    ? resposta
    : Array.isArray(resposta?.data)
      ? resposta.data
      : []
}

export default function TrocaDetalhe() {
  const { trocaId } = useParams()

  const { usuario } = useAuth()

  const clienteId = obterClienteId(usuario)

  const [troca, setTroca] = useState(null)

  const [historico, setHistorico] = useState([])

  const [carregando, setCarregando] = useState(true)

  const [erro, setErro] = useState("")

  async function carregar() {
    if (!clienteId) {
      setErro("Não foi possível identificar o cliente pelo UUID.")

      setCarregando(false)

      return
    }

    setCarregando(true)

    setErro("")

    try {
      const [detalhe, eventos] = await Promise.all([
        trocaService.buscarTrocaCliente(clienteId, trocaId),

        trocaService.listarHistoricoCliente(clienteId, trocaId),
      ])

      setTroca(detalhe?.data || detalhe)

      setHistorico(normalizarLista(eventos))
    } catch (error) {
      setErro(
        error?.message ||
          "Não foi possível carregar os detalhes da solicitação.",
      )
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [clienteId, trocaId])

  const status = String(troca?.status || "").toUpperCase()

  const concluida =
    status === "CONCLUIDA" || status === "TROCADA" || status === "TROCADO"

  return (
    <div>
      <Header />
      <main
        className="page-container"
        style={{ paddingTop: 40, paddingBottom: 80 }}
      >
        <div style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>
          <ClienteSidebar />
          <section style={{ flex: 1, maxWidth: 820 }}>
            <Link to="/trocas" className="account-back-link">
              ← Minhas solicitações
            </Link>
            <h1 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 800 }}>
              Solicitação #{trocaId}
            </h1>
            {carregando && (
              <div className="card" style={{ padding: 24 }}>
                Carregando detalhes e histórico...
              </div>
            )}
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
            {troca && !carregando && (
              <>
                <section
                  className="card"
                  style={{ padding: 22, marginBottom: 18 }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <h2 style={{ margin: 0 }}>Pedido #{troca.pedidoId}</h2>
                    <span className="badge badge-purple">
                      {statusLabel[status] || troca.status}
                    </span>
                  </div>
                  <dl
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(190px, 1fr))",
                      gap: 16,
                    }}
                  >
                    <div>
                      <dt>Tipo</dt>
                      <dd>
                        {troca.tipo === "DEVOLUCAO" ? "Devolução" : "Troca"}
                      </dd>
                    </div>
                    <div>
                      <dt>Item</dt>
                      <dd>{troca.titulo || `Livro ${troca.livroId || "—"}`}</dd>
                    </div>
                    <div>
                      <dt>Quantidade solicitada</dt>
                      <dd>{troca.quantidadeSolicitada ?? "—"}</dd>
                    </div>
                    <div>
                      <dt>Quantidade recebida</dt>
                      <dd>{troca.quantidadeRecebida ?? "—"}</dd>
                    </div>
                    <div>
                      <dt>Entrega do pedido</dt>
                      <dd>{formatarDataTroca(troca.entregueEm)}</dd>
                    </div>
                    <div>
                      <dt>Solicitada em</dt>
                      <dd>{formatarDataTroca(troca.criadoEm)}</dd>
                    </div>
                    <div>
                      <dt>Decidida em</dt>
                      <dd>{formatarDataTroca(troca.decididoEm)}</dd>
                    </div>
                    <div>
                      <dt>Recebida em</dt>
                      <dd>{formatarDataTroca(troca.recebidoEm)}</dd>
                    </div>
                    <div>
                      <dt>Motivo</dt>
                      <dd>{troca.motivo || "—"}</dd>
                    </div>
                  </dl>
                  {troca.detalhes && (
                    <p>
                      <strong>Detalhes:</strong> {troca.detalhes}
                    </p>
                  )}
                  {troca.motivoRecusa && (
                    <p role="status">
                      <strong>Justificativa da recusa:</strong>{" "}
                      {troca.motivoRecusa}
                    </p>
                  )}
                  {concluida && (
                    <div
                      role="status"
                      data-testid="credito-concluido"
                      style={{
                        padding: 16,
                        background: "#F0FDF4",
                        border: "1px solid #BBF7D0",
                        borderRadius: 8,
                      }}
                    >
                      <strong>Crédito em voucher de troca</strong>
                      <p>
                        Valor emitido pelo backend:{" "}
                        {formatarDinheiroTroca(troca.voucherValor)}
                      </p>
                      {troca.creditoEm && (
                        <p>
                          Crédito emitido em:{" "}
                          {formatarDataTroca(troca.creditoEm)}
                        </p>
                      )}
                      {troca.voucherCodigo && (
                        <p>
                          Código:{" "}
                          <Link to="/meus-cupons">{troca.voucherCodigo}</Link>
                        </p>
                      )}
                      <small>
                        Este crédito não é estorno financeiro. O valor considera
                        preço histórico bruto e não rateia o desconto global do
                        pedido.
                      </small>
                    </div>
                  )}
                </section>
                <section className="card" style={{ padding: 22 }}>
                  <h2 style={{ marginTop: 0 }}>Histórico</h2>
                  {historico.length === 0 ? (
                    <p>Nenhum evento de histórico retornado.</p>
                  ) : (
                    <ol style={{ display: "grid", gap: 12, paddingLeft: 22 }}>
                      {historico.map((evento) => (
                        <li key={evento.id}>
                          <strong>
                            {statusLabel[
                              String(evento.status || "").toUpperCase()
                            ] || evento.status}
                          </strong>
                          <div>{formatarDataTroca(evento.criadoEm)}</div>
                          {evento.observacao && <p>{evento.observacao}</p>}
                        </li>
                      ))}
                    </ol>
                  )}
                </section>
              </>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
