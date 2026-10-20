import { useEffect, useState } from "react"

import AdminSidebar from "@/shared/layouts/admin/AdminSidebar"

import Modal from "@/shared/components/Modal"

import { trocaService } from "@/features/troca/api/trocaService"

import {
  formatarDataTroca,
  formatarDinheiroTroca,
} from "@/features/troca/utils/trocaUtils"

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

export default function AdminTrocas() {
  const [trocas, setTrocas] = useState([])

  const [carregando, setCarregando] = useState(true)

  const [erro, setErro] = useState("")

  const [processandoId, setProcessandoId] = useState(null)

  const [filtroStatus, setFiltroStatus] = useState("")

  const [filtroTipo, setFiltroTipo] = useState("")

  const [modalTroca, setModalTroca] = useState(null)

  const [modalModo, setModalModo] = useState("")

  const [motivoRecusa, setMotivoRecusa] = useState("")

  const [quantidadeRecebida, setQuantidadeRecebida] = useState("")

  const [retornarEstoque, setRetornarEstoque] = useState(false)

  const [detalheId, setDetalheId] = useState(null)

  const [historico, setHistorico] = useState([])

  const [carregandoHistorico, setCarregandoHistorico] = useState(false)

  async function carregar() {
    setCarregando(true)
    setErro("")

    try {
      setTrocas(
        lista(
          await trocaService.listarTrocas({
            status: filtroStatus,
            tipo: filtroTipo,
          }),
        ),
      )
    } catch (error) {
      setErro(error?.message || "Não foi possível carregar as solicitações.")
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [filtroStatus, filtroTipo])

  async function atualizarAcao(troca, acao) {
    setProcessandoId(troca.id)
    setErro("")

    try {
      await acao()
      await carregar()
    } catch (error) {
      setErro(error?.message || "Não foi possível atualizar a solicitação.")
    } finally {
      setProcessandoId(null)
    }
  }

  async function abrirHistorico(troca) {
    setDetalheId(troca.id)
    setCarregandoHistorico(true)
    setHistorico([])

    try {
      const [detalhe, eventos] = await Promise.all([
        trocaService.buscarTroca(troca.id),
        trocaService.listarHistorico(troca.id),
      ])

      setModalTroca(detalhe?.data || detalhe)

      setHistorico(lista(eventos))
    } catch (error) {
      setErro(
        error?.message || "Não foi possível carregar detalhe e histórico.",
      )
    } finally {
      setCarregandoHistorico(false)
    }
  }

  async function confirmarRecusa() {
    const motivo = motivoRecusa.trim()

    if (!motivo) {
      setErro("A justificativa de recusa é obrigatória.")
      return
    }

    const troca = modalTroca

    await atualizarAcao(troca, () =>
      trocaService.recusarTroca(troca.id, motivo),
    )

    setModalModo("")
    setModalTroca(null)
    setMotivoRecusa("")
  }

  async function confirmarRecebimento() {
    const troca = modalTroca

    const quantidade = Number(quantidadeRecebida)

    const maxima = Number(troca?.quantidadeSolicitada ?? troca?.quantidade ?? 0)

    if (
      !Number.isInteger(quantidade) ||
      quantidade < 1 ||
      quantidade > maxima
    ) {
      setErro(`Informe uma quantidade inteira entre 1 e ${maxima}.`)
      return
    }

    await atualizarAcao(troca, () =>
      trocaService.receberTroca(troca.id, retornarEstoque, quantidade),
    )

    setModalModo("")
    setModalTroca(null)
  }

  function abrirModal(modo, troca) {
    setErro("")
    setModalTroca(troca)
    setModalModo(modo)

    setMotivoRecusa("")
    setQuantidadeRecebida(
      String(troca.quantidadeSolicitada ?? troca.quantidade ?? 1),
    )
    setRetornarEstoque(false)
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <div style={{ padding: "28px 32px" }}>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800 }}>
              Trocas e Devoluções
            </h1>
            <p style={{ margin: 0, fontSize: 14, color: "var(--text-muted)" }}>
              {trocas.length} solicitações · controles visuais de perfil não
              representam autorização no servidor
            </p>
          </div>
          <div
            className="card"
            style={{ padding: 14, display: "flex", gap: 12, marginBottom: 16 }}
          >
            <label>
              Status{" "}
              <select
                data-testid="admin-filtro-status"
                value={filtroStatus}
                onChange={(event) => setFiltroStatus(event.target.value)}
              >
                <option value="">Todos</option>
                {[
                  "SOLICITADA",
                  "AGUARDANDO_RECEBIMENTO",
                  "RECEBIDA",
                  "CONCLUIDA",
                  "RECUSADA",
                ].map((status) => (
                  <option key={status} value={status}>
                    {statusNomes[status]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tipo{" "}
              <select
                data-testid="admin-filtro-tipo"
                value={filtroTipo}
                onChange={(event) => setFiltroTipo(event.target.value)}
              >
                <option value="">Todos</option>
                <option value="TROCA">Troca</option>
                <option value="DEVOLUCAO">Devolução</option>
              </select>
            </label>
          </div>
          {erro && (
            <div
              className="card"
              role="alert"
              style={{ padding: 14, marginBottom: 16, color: "var(--danger)" }}
            >
              {erro}
              <button
                className="btn-secondary"
                onClick={carregar}
                style={{ marginLeft: 12 }}
              >
                Tentar novamente
              </button>
            </div>
          )}
          {carregando && (
            <div className="card" style={{ padding: 24 }}>
              Carregando solicitações...
            </div>
          )}
          {!carregando && !erro && !trocas.length && (
            <div className="card" style={{ padding: 24 }}>
              Nenhuma solicitação encontrada.
            </div>
          )}
          {!carregando && trocas.length > 0 && (
            <div className="card" style={{ overflow: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Pedido / Cliente</th>
                    <th>Entrega</th>
                    <th>Tipo / Item</th>
                    <th>Qtd.</th>
                    <th>Motivo</th>
                    <th>Status / datas</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {trocas.map((troca) => {
                    const status = String(troca.status || "").toUpperCase()
                    const concluida =
                      status === "CONCLUIDA" ||
                      status === "TROCADA" ||
                      status === "TROCADO"
                    return (
                      <tr key={troca.id}>
                        <td>
                          <button
                            className="btn-ghost"
                            onClick={() => abrirHistorico(troca)}
                          >
                            #{troca.id}
                          </button>
                        </td>
                        <td>
                          Pedido #{troca.pedidoId || "—"}
                          <br />
                          {troca.clienteNome || troca.clienteId || "—"}
                        </td>
                        <td>{formatarDataTroca(troca.entregueEm)}</td>
                        <td>
                          {troca.tipo || "—"}
                          <br />
                          {troca.titulo || `Livro ${troca.livroId || "—"}`}
                        </td>
                        <td>
                          Solicitada{" "}
                          {troca.quantidadeSolicitada ??
                            troca.quantidade ??
                            "—"}
                          <br />
                          Recebida {troca.quantidadeRecebida ?? 0}
                        </td>
                        <td>
                          {troca.motivo || "—"}
                          {troca.detalhes && (
                            <small style={{ display: "block" }}>
                              {troca.detalhes}
                            </small>
                          )}
                          {troca.motivoRecusa && (
                            <small style={{ display: "block" }}>
                              Recusa: {troca.motivoRecusa}
                            </small>
                          )}
                        </td>
                        <td>
                          <span
                            className={`badge ${statusCores[status] || "badge-gray"}`}
                          >
                            {statusNomes[status] || status}
                          </span>
                          <small style={{ display: "block" }}>
                            Criada: {formatarDataTroca(troca.criadoEm)}
                          </small>
                          <small style={{ display: "block" }}>
                            Decisão: {formatarDataTroca(troca.decididoEm)}
                          </small>
                          <small style={{ display: "block" }}>
                            Recebida: {formatarDataTroca(troca.recebidoEm)}
                          </small>
                          {concluida && troca.voucherCodigo && (
                            <small
                              data-testid={`voucher-troca-${troca.id}`}
                              style={{ display: "block", marginTop: 6 }}
                            >
                              Voucher {troca.voucherCodigo} ·{" "}
                              {formatarDinheiroTroca(troca.voucherValor)}
                            </small>
                          )}
                        </td>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 4,
                            }}
                          >
                            {status === "SOLICITADA" && (
                              <>
                                <button
                                  data-testid={`autorizar-troca-${troca.id}`}
                                  disabled={processandoId === troca.id}
                                  onClick={() =>
                                    atualizarAcao(troca, () =>
                                      trocaService.autorizarTroca(troca.id),
                                    )
                                  }
                                  className="btn-primary"
                                >
                                  Autorizar
                                </button>
                                <button
                                  data-testid={`recusar-troca-${troca.id}`}
                                  disabled={processandoId === troca.id}
                                  onClick={() => abrirModal("recusar", troca)}
                                  className="btn-danger"
                                >
                                  Recusar
                                </button>
                              </>
                            )}
                            {status === "AGUARDANDO_RECEBIMENTO" && (
                              <button
                                data-testid={`recebida-troca-${troca.id}`}
                                disabled={processandoId === troca.id}
                                onClick={() => abrirModal("receber", troca)}
                                className="btn-secondary"
                              >
                                Registrar recebimento
                              </button>
                            )}
                            <button
                              className="btn-ghost"
                              onClick={() => abrirHistorico(troca)}
                            >
                              Detalhe / histórico
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <Modal
        isOpen={modalModo === "recusar"}
        onClose={() => setModalModo("")}
        title="Recusar solicitação"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault()
            confirmarRecusa()
          }}
          style={{ display: "grid", gap: 14 }}
        >
          <label>
            Justificativa obrigatória
            <textarea
              data-testid="motivo-recusa-troca"
              required
              value={motivoRecusa}
              onChange={(event) => setMotivoRecusa(event.target.value)}
              rows="4"
            />
          </label>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setModalModo("")}
            >
              Cancelar
            </button>
            <button
              type="submit"
              data-testid="confirmar-recusa-troca"
              className="btn-danger"
              disabled={processandoId === modalTroca?.id}
            >
              Confirmar recusa
            </button>
          </div>
        </form>
      </Modal>
      <Modal
        isOpen={modalModo === "receber"}
        onClose={() => setModalModo("")}
        title="Confirmar recebimento"
      >
        {modalTroca && (
          <form
            onSubmit={(event) => {
              event.preventDefault()
              confirmarRecebimento()
            }}
            style={{ display: "grid", gap: 16 }}
          >
            <p>
              Confirme o recebimento dos itens devolvidos pelo cliente. Após a
              confirmação, o sistema emitirá o voucher do valor devol.
            </p>
            <label>
              Quantidade efetivamente recebida:{" "}
              <input
                data-testid="quantidade-recebida-troca"
                type="number"
                min="1"
                max={modalTroca.quantidadeSolicitada ?? modalTroca.quantidade}
                step="1"
                required
                value={quantidadeRecebida}
                onChange={(event) => setQuantidadeRecebida(event.target.value)}
              />
            </label>
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                data-testid="retornar-estoque-troca"
                type="checkbox"
                checked={retornarEstoque}
                onChange={(event) => setRetornarEstoque(event.target.checked)}
              />{" "}
              Repor produto ao estoque
            </label>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setModalModo("")}
              >
                Cancelar
              </button>
              <button
                data-testid="confirmar-recebimento-troca"
                type="submit"
                disabled={processandoId === modalTroca.id}
                className="btn-primary"
              >
                {processandoId === modalTroca.id
                  ? "Confirmando..."
                  : "Confirmar recebimento"}
              </button>
            </div>
          </form>
        )}
      </Modal>
      <Modal
        isOpen={!modalModo && Boolean(detalheId)}
        onClose={() => {
          setDetalheId(null)
          setModalTroca(null)
        }}
        title={`Detalhe da solicitação #${detalheId}`}
      >
        {carregandoHistorico ? (
          <p>Carregando detalhe e histórico...</p>
        ) : (
          modalTroca && (
            <>
              <p>
                Cliente: {modalTroca.clienteNome || modalTroca.clienteId || "—"}{" "}
                · Pedido #{modalTroca.pedidoId}
              </p>
              <p>
                {modalTroca.tipo} · {modalTroca.titulo} · Solicitada{" "}
                {modalTroca.quantidadeSolicitada} · Recebida{" "}
                {modalTroca.quantidadeRecebida ?? 0}
              </p>
              <p>Motivo: {modalTroca.motivo}</p>
              {modalTroca.motivoRecusa && (
                <p>Justificativa: {modalTroca.motivoRecusa}</p>
              )}
              <h3>Histórico</h3>
              {historico.length ? (
                <ol>
                  {historico.map((evento) => (
                    <li key={evento.id}>
                      {statusNomes[evento.status] || evento.status} ·{" "}
                      {formatarDataTroca(evento.criadoEm)}
                      {evento.observacao && ` · ${evento.observacao}`}
                    </li>
                  ))}
                </ol>
              ) : (
                <p>Sem eventos retornados.</p>
              )}
              {(modalTroca.status === "CONCLUIDA" ||
                modalTroca.status === "TROCADA") &&
                modalTroca.voucherCodigo && (
                  <p data-testid="admin-voucher-concluido">
                    Voucher {modalTroca.voucherCodigo} ·{" "}
                    {formatarDinheiroTroca(modalTroca.voucherValor)}
                  </p>
                )}
            </>
          )
        )}
      </Modal>
    </div>
  )
}
