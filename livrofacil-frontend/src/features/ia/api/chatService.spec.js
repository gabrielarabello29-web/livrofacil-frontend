import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "@/shared/api/api"

import { enviarMensagemChat, registrarFeedbackChat } from "./chatService"

vi.mock("@/shared/api/api", () => ({
  api: { post: vi.fn() },
}))

const cliente = {
  perfil: "CLIENTE",

  uuid: "b6f0f8ca-6e16-4e8e-b8a0-d74871ef2912",
}

describe("chatService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("envia a mensagem com clienteId e contexto de sessão e devolve a resposta persistida", async () => {
    const resposta = {
      sessaoId: "sessao-1",

      mensagemId: "mensagem-1",

      texto: "Sugestão de leitura",

      livros: [],
    }

    api.post.mockResolvedValue(resposta)

    await expect(
      enviarMensagemChat({
        usuario: cliente,
        sessaoId: null,
        mensagem: "  Quero ler  ",
      }),
    ).resolves.toEqual(resposta)

    expect(api.post).toHaveBeenCalledWith("/chat/mensagens", {
      clienteId: cliente.uuid,

      sessaoId: null,

      mensagem: "Quero ler",
    })
  })

  it("não envia mensagens quando o perfil não é CLIENTE", async () => {
    await expect(
      enviarMensagemChat({
        usuario: { ...cliente, perfil: "ADMIN" },

        sessaoId: null,

        mensagem: "Quero ler",
      }),
    ).rejects.toThrow(
      "O assistente está disponível apenas para clientes autenticados.",
    )

    expect(api.post).not.toHaveBeenCalled()
  })

  it("envia a avaliação idempotente com os campos acordados", async () => {
    api.post.mockResolvedValue({ feedbackId: "feedback-1" })

    await registrarFeedbackChat({
      usuario: cliente,

      mensagemId: "mensagem-1",

      avaliacao: "NAO_UTIL",
    })

    expect(api.post).toHaveBeenCalledWith("/chat/feedback", {
      clienteId: cliente.uuid,

      mensagemId: "mensagem-1",

      avaliacao: "NAO_UTIL",

      comentario: "",
    })
  })
})
