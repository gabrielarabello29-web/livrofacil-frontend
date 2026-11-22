import { obterClienteId } from "@/features/auth/context/AuthContext"

import { api } from "@/shared/api/api"

function obterClienteAutenticado(usuario) {
  if (usuario?.perfil !== "CLIENTE") {
    throw new Error(
      "O assistente está disponível apenas para clientes autenticados.",
    )
  }

  if (usuario?.ativo === false) throw new Error("Esta conta não está ativa.")

  const clienteId = obterClienteId(usuario)

  if (!clienteId)
    throw new Error("Não foi possível identificar o cliente autenticado.")

  return clienteId
}

export async function enviarMensagemChat({
  usuario,
  sessaoId = null,
  mensagem,
}) {
  const clienteId = obterClienteAutenticado(usuario)

  const texto = String(mensagem || "").trim()

  if (!texto) throw new Error("Digite uma mensagem para o assistente.")

  const resposta = await api.post("/chat/mensagens", {
    clienteId,

    sessaoId,

    mensagem: texto,
  })

  if (
    !resposta ||
    typeof resposta.sessaoId !== "string" ||
    typeof resposta.mensagemId !== "string" ||
    typeof resposta.texto !== "string" ||
    !Array.isArray(resposta.livros)
  ) {
    throw new Error("O servidor retornou uma resposta inválida para o chat.")
  }

  return resposta
}

export async function registrarFeedbackChat({
  usuario,
  mensagemId,
  avaliacao,
  comentario = "",
}) {
  const clienteId = obterClienteAutenticado(usuario)

  if (!mensagemId)
    throw new Error("A resposta avaliada não possui um identificador.")

  if (avaliacao !== "UTIL" && avaliacao !== "NAO_UTIL")
    throw new Error("A avaliação informada é inválida.")

  return api.post("/chat/feedback", {
    clienteId,

    mensagemId,

    avaliacao,

    comentario: String(comentario ?? ""),
  })
}
