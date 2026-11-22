import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "@/shared/api/api"

import { clienteService } from "./clienteService"

vi.mock("@/shared/api/api", () => ({
  api: {
    get: vi.fn(),

    put: vi.fn(),
  },
}))

describe("preferências literárias do cliente", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("consulta as preferências pelo endpoint do cliente", async () => {
    api.get.mockResolvedValue({
      categoriaIds: [12],
      temasDeInteresse: [],
      precoMinimo: null,
      precoMaximo: null,
    })

    await clienteService.buscarPreferenciasLiterarias(
      "b6f0f8ca-6e16-4e8e-b8a0-d74871ef2912",
    )

    expect(api.get).toHaveBeenCalledWith(
      "/clientes/b6f0f8ca-6e16-4e8e-b8a0-d74871ef2912/preferencias-literarias",
    )
  })

  it("salva categorias, temas e faixa de preço no contrato acordado", async () => {
    const dados = {
      categoriaIds: [12, 34],

      temasDeInteresse: ["mistério"],

      precoMinimo: null,

      precoMaximo: 80,
    }

    api.put.mockResolvedValue(dados)

    await clienteService.atualizarPreferenciasLiterarias(
      "b6f0f8ca-6e16-4e8e-b8a0-d74871ef2912",
      dados,
    )

    expect(api.put).toHaveBeenCalledWith(
      "/clientes/b6f0f8ca-6e16-4e8e-b8a0-d74871ef2912/preferencias-literarias",

      dados,
    )
  })
})
