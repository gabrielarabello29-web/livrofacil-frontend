import React from "react"

import { beforeEach, describe, expect, it, vi } from "vitest"

import { render, screen, waitFor } from "@testing-library/react"

import userEvent from "@testing-library/user-event"

import { MemoryRouter } from "react-router-dom"

import { clienteService } from "@/features/cliente/api/clienteService"

import { useAuth } from "@/features/auth/context/AuthContext"

import { listarCategorias } from "@/features/livros/api/livrosApi"

import Perfil from "./Perfil"

vi.mock("@/features/auth/context/AuthContext", () => ({
  useAuth: vi.fn(),

  obterClienteId: (usuario) => usuario?.uuid || null,
}))

vi.mock("@/features/cliente/api/clienteService", () => ({
  clienteService: {
    buscarPreferenciasLiterarias: vi.fn(),

    atualizarPreferenciasLiterarias: vi.fn(),
  },
}))

vi.mock("@/features/livros/api/livrosApi", () => ({
  listarCategorias: vi.fn(),
}))

vi.mock("@/shared/components/Header", () => ({ default: () => null }))

vi.mock("@/shared/components/Footer", () => ({ default: () => null }))

vi.mock("@/shared/layouts/cliente/ClienteSidebar", () => ({
  default: () => null,
}))

const cliente = {
  perfil: "CLIENTE",

  uuid: "b6f0f8ca-6e16-4e8e-b8a0-d74871ef2912",

  nome: "Cliente",

  email: "cliente@example.com",
}

describe("Preferências Literárias no perfil", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    useAuth.mockReturnValue({
      usuario: cliente,

      isCliente: true,

      atualizarUsuario: vi.fn(),

      excluirConta: vi.fn(),
    })

    clienteService.buscarPreferenciasLiterarias.mockResolvedValue({
      categoriaIds: [],

      temasDeInteresse: [],

      precoMinimo: null,

      precoMaximo: null,
    })

    clienteService.atualizarPreferenciasLiterarias.mockResolvedValue({})

    listarCategorias.mockResolvedValue([{ id: 12, nome: "Fantasia" }])
  })

  it("carrega categorias do catálogo e salva preferências com IDs e faixa de preço", async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <Perfil />
      </MemoryRouter>,
    )

    const categoria = await screen.findByRole("checkbox", { name: "Fantasia" })

    await user.click(categoria)

    await user.type(
      screen.getByRole("textbox", { name: "Temas de interesse" }),
      "mistério, ficção histórica",
    )

    await user.type(screen.getByLabelText("Mínimo (R$)"), "10")

    await user.type(screen.getByLabelText("Máximo (R$)"), "80")

    await user.click(
      screen.getByRole("button", { name: "Salvar preferências" }),
    )

    await waitFor(() =>
      expect(
        clienteService.atualizarPreferenciasLiterarias,
      ).toHaveBeenCalledWith(
        cliente.uuid,

        {
          categoriaIds: [12],

          temasDeInteresse: ["mistério", "ficção histórica"],

          precoMinimo: 10,

          precoMaximo: 80,
        },
      ),
    )

    expect(
      await screen.findByText("Preferências literárias salvas com sucesso."),
    ).toBeInTheDocument()
  })
})
