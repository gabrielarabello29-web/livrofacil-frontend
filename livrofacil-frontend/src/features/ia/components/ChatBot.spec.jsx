import React from "react"

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { render, screen, waitFor } from "@testing-library/react"

import userEvent from "@testing-library/user-event"

import { MemoryRouter } from "react-router-dom"

import { useAuth } from "@/features/auth/context/AuthContext"

import {
  enviarMensagemChat,
  registrarFeedbackChat,
} from "@/features/ia/api/chatService"

import ChatBot from "./ChatBot"

vi.mock("@/features/auth/context/AuthContext", () => ({
  useAuth: vi.fn(),

  obterClienteId: (usuario) => usuario?.uuid || null,
}))

vi.mock("@/features/ia/api/chatService", () => ({
  enviarMensagemChat: vi.fn(),

  registrarFeedbackChat: vi.fn(),
}))

const cliente = {
  perfil: "CLIENTE",

  uuid: "b6f0f8ca-6e16-4e8e-b8a0-d74871ef2912",
}

function renderChat() {
  return render(
    <MemoryRouter>
      <ChatBot />
    </MemoryRouter>,
  )
}

describe("ChatBot", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    useAuth.mockReturnValue({ usuario: cliente, isCliente: true })

    enviarMensagemChat.mockResolvedValue({
      sessaoId: "sessao-1",

      mensagemId: "mensagem-1",

      texto: "Uma sugestão para você.",

      livros: [
        {
          livroId: 123,

          titulo: "Duna",

          autor: "Frank Herbert",

          imagemUrl: "",

          preco: 39.9,

          url: "/livros/123",
        },
      ],
    })

    registrarFeedbackChat.mockResolvedValue({ feedbackId: "feedback-1" })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it.each([
    ["visitante", { usuario: null, isCliente: false }],

    [
      "administrador",
      { usuario: { ...cliente, perfil: "ADMIN" }, isCliente: false },
    ],
  ])("não renderiza o widget para %s", (_perfil, auth) => {
    useAuth.mockReturnValue(auth)

    renderChat()

    expect(
      screen.queryByRole("button", { name: "Abrir assistente" }),
    ).not.toBeInTheDocument()

    expect(enviarMensagemChat).not.toHaveBeenCalled()
  })

  it("envia mensagens na sessão e permite alterar a avaliação da resposta", async () => {
    const user = userEvent.setup()

    renderChat()

    await user.click(screen.getByRole("button", { name: "Abrir assistente" }))

    await user.type(
      screen.getByRole("textbox", { name: "Mensagem para o assistente" }),
      "Quero uma recomendação",
    )

    await user.click(screen.getByRole("button", { name: "Enviar mensagem" }))

    expect(
      await screen.findByText("Uma sugestão para você."),
    ).toBeInTheDocument()

    expect(enviarMensagemChat).toHaveBeenCalledWith({
      usuario: cliente,

      sessaoId: null,

      mensagem: "Quero uma recomendação",
    })

    expect(screen.getByRole("link", { name: /Duna/ })).toHaveAttribute(
      "href",
      "/livros/123",
    )

    await user.click(
      screen.getByRole("button", { name: "Avaliar resposta como útil" }),
    )

    await waitFor(() =>
      expect(registrarFeedbackChat).toHaveBeenCalledWith({
        usuario: cliente,

        mensagemId: "mensagem-1",

        avaliacao: "UTIL",
      }),
    )

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Feedback registrado",
    )

    await user.click(
      screen.getByRole("button", { name: "Avaliar resposta como não útil" }),
    )

    await waitFor(() =>
      expect(registrarFeedbackChat).toHaveBeenLastCalledWith({
        usuario: cliente,

        mensagemId: "mensagem-1",

        avaliacao: "NAO_UTIL",
      }),
    )

    expect(
      screen.getByRole("button", { name: "Avaliar resposta como não útil" }),
    ).toHaveAttribute("aria-pressed", "true")

    enviarMensagemChat.mockResolvedValueOnce({
      sessaoId: "sessao-1",
      mensagemId: "mensagem-2",
      texto: "Mais uma recomendação.",
      livros: [],
    })
    await user.type(
      screen.getByRole("textbox", { name: "Mensagem para o assistente" }),
      "Mais uma sugestão",
    )
    await user.click(screen.getByRole("button", { name: "Enviar mensagem" }))

    expect(
      await screen.findByText("Mais uma recomendação."),
    ).toBeInTheDocument()
    expect(enviarMensagemChat).toHaveBeenLastCalledWith({
      usuario: cliente,
      sessaoId: "sessao-1",
      mensagem: "Mais uma sugestão",
    })
    expect(
      screen.getAllByRole("button", { name: "Avaliar resposta como útil" }),
    ).toHaveLength(2)
  })
})
