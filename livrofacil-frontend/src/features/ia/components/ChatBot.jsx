import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { aiService } from '../services/aiService'

export default function ChatBot() {
  const [aberto, setAberto] = useState(false)
  const [mensagens, setMensagens] = useState([
    { tipo: 'bot', texto: 'Olá! Sou o Assistente LivroFácil. Posso ajudar você a encontrar o livro perfeito! Experimente perguntar sobre ficção, negócios, autoajuda...', livros: [] }
  ])
  const [input, setInput] = useState('')
  const [carregando, setCarregando] = useState(false)
  const fimRef = useRef(null)

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens])

  async function enviar(e) {
    e.preventDefault()
    if (!input.trim() || carregando) return
    const texto = input.trim()
    setInput('')
    setMensagens(prev => [...prev, { tipo: 'usuario', texto }])
    setCarregando(true)
    try {
      const res = await aiService.enviarMensagem(texto)
      setMensagens(prev => [...prev, { tipo: 'bot', texto: res.texto, livros: res.livros }])
    } catch {
      setMensagens(prev => [...prev, { tipo: 'bot', texto: 'Desculpe, ocorreu um erro. Tente novamente!', livros: [] }])
    } finally {
      setCarregando(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      <button onClick={() => setAberto(v => !v)}
        style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 999, width: 56, height: 56, borderRadius: '50%', background: 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px rgba(124,58,237,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
        {aberto ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        )}
      </button>

      {/* Chat window */}
      {aberto && (
        <div style={{ position: 'fixed', bottom: 92, right: 24, zIndex: 998, width: 360, maxHeight: 520, background: '#fff', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} className="animate-fadein">
          <div style={{ background: 'var(--primary)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
              </svg>
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#fff' }}>Assistente LivroFácil</p>
              <p style={{ margin: 0, fontSize: 12, color: '#DDD6FE' }}>Sempre online</p>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 360 }}>
            {mensagens.map((msg, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.tipo === 'usuario' ? 'flex-end' : 'flex-start', gap: 8 }}>
                <div style={{ maxWidth: '85%', padding: '10px 14px', borderRadius: msg.tipo === 'usuario' ? '14px 14px 4px 14px' : '14px 14px 14px 4px', background: msg.tipo === 'usuario' ? 'var(--primary)' : '#F3F4F6', color: msg.tipo === 'usuario' ? '#fff' : 'var(--text)', fontSize: 13, lineHeight: 1.5 }}>
                  {msg.texto}
                </div>
                {msg.livros?.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
                    {msg.livros.map(livro => (
                      <Link key={livro.id} to={`/livros/${livro.id}`} onClick={() => setAberto(false)}
                        style={{ display: 'flex', gap: 10, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: 10, textDecoration: 'none', alignItems: 'center' }}>
                        <img src={livro.capa} alt={livro.titulo} style={{ width: 40, height: 56, objectFit: 'cover', borderRadius: 4 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>{livro.titulo}</p>
                          <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>{livro.autor}</p>
                          <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>R$ {livro.preco.toFixed(2).replace('.', ',')}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {carregando && (
              <div style={{ display: 'flex', gap: 4, padding: '10px 14px', background: '#F3F4F6', borderRadius: '14px 14px 14px 4px', width: 64 }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)', animation: `bounce 1.2s ${i * 0.2}s infinite` }} />
                ))}
              </div>
            )}
            <div ref={fimRef} />
          </div>

          <form onSubmit={enviar} style={{ padding: '12px 16px', borderTop: '1px solid #F3F4F6', display: 'flex', gap: 8 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Pergunte sobre livros..."
              style={{ flex: 1, padding: '9px 14px', border: '1.5px solid #E5E7EB', borderRadius: 24, fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor = '#E5E7EB'}
            />
            <button type="submit" disabled={!input.trim() || carregando}
              style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: (!input.trim() || carregando) ? 0.5 : 1 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </form>
        </div>
      )}
      <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }`}</style>
    </>
  )
}
