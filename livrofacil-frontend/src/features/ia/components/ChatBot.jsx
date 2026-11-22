import React, { useEffect, useRef, useState } from "react"

import { Link } from "react-router-dom"

import { obterClienteId, useAuth } from "@/features/auth/context/AuthContext"

import {
  enviarMensagemChat,
  registrarFeedbackChat,
} from "@/features/ia/api/chatService"

import { formatarDinheiro } from "@/features/livros/utils/livroFormatters"

const mensagemInicial = {
  tipo: "bot",

  texto:
    "Olá! Sou o Assistente LivroFácil. Posso ajudar você a encontrar o livro perfeito! Experimente perguntar sobre ficção, negócios, autoajuda...",

  livros: [],
}

function IconeFeedback({ negativo }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {negativo ? (
        <>
          <path d="M17 14V2" />
          <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H19a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.5a2 2 0 0 0-1.8 1.1l-2.2 4.4a1.8 1.8 0 0 1-3.5-.88Z" />
        </>
      ) : (
        <>
          <path d="M7 10v12" />
          <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.5a2 2 0 0 0 1.8-1.1l2.2-4.4a1.8 1.8 0 0 1 3.5.88Z" />
        </>
      )}
    </svg>
  )
}

export default function ChatBot() {
  const { usuario, isCliente } = useAuth()

  const clienteId = obterClienteId(usuario)

  const [aberto, setAberto] = useState(false)

  const [mensagens, setMensagens] = useState([mensagemInicial])

  const [input, setInput] = useState("")

  const [carregando, setCarregando] = useState(false)

  const [sessaoId, setSessaoId] = useState(null)

  const fimRef = useRef(null)

  const clienteAtualRef = useRef(clienteId)

  const requisicaoRef = useRef(0)

  clienteAtualRef.current = clienteId

  useEffect(() => {
    requisicaoRef.current += 1

    setAberto(false)

    setMensagens([mensagemInicial])

    setSessaoId(null)

    setCarregando(false)
  }, [clienteId, isCliente, usuario?.ativo, usuario?.perfil])

  useEffect(() => {
    fimRef.current?.scrollIntoView?.({ behavior: "smooth" })
  }, [mensagens])

  useEffect(() => {
    const abrirChat = () => {
      if (
        isCliente &&
        usuario?.perfil === "CLIENTE" &&
        usuario?.ativo !== false &&
        clienteId
      ) {
        setAberto(true)
      }
    }

    window.addEventListener("livrofacil:abrir-chat", abrirChat)

    return () => window.removeEventListener("livrofacil:abrir-chat", abrirChat)
  }, [clienteId, isCliente, usuario?.ativo, usuario?.perfil])

  async function enviar(event) {
    event.preventDefault()

    if (
      !isCliente ||
      usuario?.perfil !== "CLIENTE" ||
      usuario?.ativo === false ||
      !clienteId ||
      !input.trim() ||
      carregando
    )
      return

    const texto = input.trim()

    const clienteIdDaRequisicao = clienteId

    const requisicaoId = requisicaoRef.current + 1

    requisicaoRef.current = requisicaoId

    setInput("")

    setMensagens((atuais) => [...atuais, { tipo: "usuario", texto }])

    setCarregando(true)

    try {
      const resposta = await enviarMensagemChat({
        usuario,
        sessaoId,
        mensagem: texto,
      })

      if (
        requisicaoRef.current !== requisicaoId ||
        clienteAtualRef.current !== clienteIdDaRequisicao
      )
        return

      setSessaoId(resposta.sessaoId)

      setMensagens((atuais) => [
        ...atuais,
        {
          tipo: "bot",

          texto: resposta.texto,

          livros: resposta.livros,

          mensagemId: resposta.mensagemId,

          avaliacao: null,

          estadoFeedback: "",
        },
      ])
    } catch (error) {
      if (
        requisicaoRef.current !== requisicaoId ||
        clienteAtualRef.current !== clienteIdDaRequisicao
      )
        return

      setMensagens((atuais) => [
        ...atuais,
        {
          tipo: "erro",

          texto:
            error?.message ||
            "Não foi possível enviar sua mensagem. Tente novamente.",
        },
      ])
    } finally {
      if (
        requisicaoRef.current === requisicaoId &&
        clienteAtualRef.current === clienteIdDaRequisicao
      ) {
        setCarregando(false)
      }
    }
  }

  async function avaliar(mensagemId, avaliacao) {
    if (
      !isCliente ||
      usuario?.perfil !== "CLIENTE" ||
      usuario?.ativo === false ||
      !clienteId
    )
      return

    const mensagem = mensagens.find((item) => item.mensagemId === mensagemId)

    if (
      !mensagem ||
      mensagem.estadoFeedback === "salvando" ||
      mensagem.avaliacao === avaliacao
    )
      return

    const avaliacaoAnterior = mensagem.avaliacao

    setMensagens((atuais) =>
      atuais.map((item) =>
        item.mensagemId === mensagemId
          ? { ...item, avaliacao, estadoFeedback: "salvando", erroFeedback: "" }
          : item,
      ),
    )

    try {
      await registrarFeedbackChat({ usuario, mensagemId, avaliacao })

      if (clienteAtualRef.current !== clienteId) return

      setMensagens((atuais) =>
        atuais.map((item) =>
          item.mensagemId === mensagemId
            ? { ...item, estadoFeedback: "registrado", erroFeedback: "" }
            : item,
        ),
      )
    } catch (error) {
      if (clienteAtualRef.current !== clienteId) return

      setMensagens((atuais) =>
        atuais.map((item) =>
          item.mensagemId === mensagemId
            ? {
                ...item,

                avaliacao: avaliacaoAnterior,

                estadoFeedback: "erro",

                erroFeedback:
                  error?.message || "Não foi possível registrar sua avaliação.",
              }
            : item,
        ),
      )
    }
  }

  if (
    !isCliente ||
    usuario?.perfil !== "CLIENTE" ||
    usuario?.ativo === false ||
    !clienteId
  )
    return null

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto((valor) => !valor)}
        aria-label={aberto ? "Fechar assistente" : "Abrir assistente"}
        aria-expanded={aberto}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 999,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "var(--primary)",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 8px 24px rgba(124,58,237,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "transform 0.2s",
        }}
        onMouseEnter={(event) => {
          event.currentTarget.style.transform = "scale(1.08)"
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.transform = "none"
        }}
      >
        {aberto ? (
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2.5"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>

      {aberto && (
        <div
          className="chatbot-window animate-fadein"
          style={{
            position: "fixed",
            bottom: 92,
            right: 24,
            zIndex: 998,
            width: "min(360px, calc(100vw - 32px))",
            maxHeight: 520,
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              background: "var(--primary)",
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <p
                style={{
                  margin: 0,
                  fontWeight: 700,
                  fontSize: 14,
                  color: "#fff",
                }}
              >
                Assistente LivroFácil
              </p>
              <p style={{ margin: 0, fontSize: 12, color: "#DDD6FE" }}>
                Sempre online
              </p>
            </div>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              maxHeight: 360,
            }}
          >
            {mensagens.map((mensagem, indice) => (
              <div
                key={mensagem.mensagemId || `${mensagem.tipo}-${indice}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems:
                    mensagem.tipo === "usuario" ? "flex-end" : "flex-start",
                  gap: 8,
                }}
              >
                <div
                  role={mensagem.tipo === "erro" ? "alert" : undefined}
                  style={{
                    maxWidth: "85%",

                    padding: "10px 14px",

                    borderRadius:
                      mensagem.tipo === "usuario"
                        ? "14px 14px 4px 14px"
                        : "14px 14px 14px 4px",

                    background:
                      mensagem.tipo === "usuario"
                        ? "var(--primary)"
                        : mensagem.tipo === "erro"
                          ? "#FEF2F2"
                          : "#F3F4F6",

                    color:
                      mensagem.tipo === "usuario"
                        ? "#fff"
                        : mensagem.tipo === "erro"
                          ? "#991B1B"
                          : "var(--text)",

                    fontSize: 13,

                    lineHeight: 1.5,
                  }}
                >
                  {mensagem.texto}
                </div>

                {mensagem.livros?.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      width: "100%",
                    }}
                  >
                    {mensagem.livros.map((livro) => (
                      <Link
                        key={livro.livroId}
                        to={livro.url || `/livros/${livro.livroId}`}
                        onClick={() => setAberto(false)}
                        style={{
                          display: "flex",
                          gap: 10,
                          background: "#fff",
                          border: "1px solid #E5E7EB",
                          borderRadius: 10,
                          padding: 10,
                          textDecoration: "none",
                          alignItems: "center",
                        }}
                      >
                        {livro.imagemUrl && (
                          <img
                            src={livro.imagemUrl}
                            alt={`Capa de ${livro.titulo}`}
                            style={{
                              width: 40,
                              height: 56,
                              objectFit: "cover",
                              borderRadius: 4,
                            }}
                          />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p
                            style={{
                              margin: 0,
                              fontSize: 12,
                              fontWeight: 700,
                              color: "var(--text)",
                              lineHeight: 1.2,
                            }}
                          >
                            {livro.titulo}
                          </p>
                          <p
                            style={{
                              margin: "2px 0 0",
                              fontSize: 11,
                              color: "var(--text-muted)",
                            }}
                          >
                            {livro.autor}
                          </p>
                          <p
                            style={{
                              margin: "4px 0 0",
                              fontSize: 13,
                              fontWeight: 700,
                              color: "var(--primary)",
                            }}
                          >
                            {formatarDinheiro(livro.preco)}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {mensagem.tipo === "bot" && mensagem.mensagemId && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      flexWrap: "wrap",
                    }}
                  >
                    {[
                      { avaliacao: "UTIL", rotulo: "Útil", negativo: false },

                      {
                        avaliacao: "NAO_UTIL",
                        rotulo: "Não útil",
                        negativo: true,
                      },
                    ].map((opcao) => {
                      const selecionada = mensagem.avaliacao === opcao.avaliacao

                      const salvando = mensagem.estadoFeedback === "salvando"

                      return (
                        <button
                          key={opcao.avaliacao}
                          type="button"
                          aria-label={`Avaliar resposta como ${opcao.rotulo.toLowerCase()}`}
                          aria-pressed={selecionada}
                          disabled={salvando}
                          onClick={() =>
                            avaliar(mensagem.mensagemId, opcao.avaliacao)
                          }
                          style={{
                            display: "inline-flex",

                            alignItems: "center",

                            gap: 5,

                            padding: "5px 8px",

                            borderRadius: 16,

                            border: `1px solid ${
                              selecionada ? "var(--primary)" : "#E5E7EB"
                            }`,

                            background: selecionada
                              ? "var(--primary-light)"
                              : "#fff",

                            color: selecionada
                              ? "var(--primary-dark)"
                              : "var(--text-muted)",

                            fontSize: 11,

                            cursor: salvando ? "wait" : "pointer",
                          }}
                        >
                          <IconeFeedback negativo={opcao.negativo} />
                          {opcao.rotulo}
                        </button>
                      )
                    })}
                    {mensagem.estadoFeedback === "registrado" && (
                      <span
                        role="status"
                        style={{ fontSize: 11, color: "var(--text-muted)" }}
                      >
                        Feedback registrado
                      </span>
                    )}
                    {mensagem.estadoFeedback === "erro" && (
                      <span
                        role="alert"
                        style={{ fontSize: 11, color: "#991B1B" }}
                      >
                        {mensagem.erroFeedback}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}

            {carregando && (
              <div
                aria-label="Assistente respondendo"
                style={{
                  display: "flex",
                  gap: 4,
                  padding: "10px 14px",
                  background: "#F3F4F6",
                  borderRadius: "14px 14px 14px 4px",
                  width: 64,
                }}
              >
                {[0, 1, 2].map((indice) => (
                  <div
                    key={indice}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "var(--text-muted)",
                      animation: `bounce 1.2s ${indice * 0.2}s infinite`,
                    }}
                  />
                ))}
              </div>
            )}
            <div ref={fimRef} />
          </div>

          <form
            onSubmit={enviar}
            style={{
              padding: "12px 16px",
              borderTop: "1px solid #F3F4F6",
              display: "flex",
              gap: 8,
            }}
          >
            <input
              aria-label="Mensagem para o assistente"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Pergunte sobre livros..."
              style={{
                flex: 1,
                padding: "9px 14px",
                border: "1.5px solid #E5E7EB",
                borderRadius: 24,
                fontSize: 13,
                outline: "none",
                fontFamily: "inherit",
              }}
              onFocus={(event) => {
                event.target.style.borderColor = "var(--primary)"
              }}
              onBlur={(event) => {
                event.target.style.borderColor = "#E5E7EB"
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || carregando}
              aria-label="Enviar mensagem"
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "var(--primary)",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                opacity: !input.trim() || carregando ? 0.5 : 1,
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      )}
      <style>
        {
          "@keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }"
        }
      </style>
    </>
  )
}
