import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', senha: '' })
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    await new Promise(r => setTimeout(r, 400))
    const resultado = login(form.email, form.senha)
    setCarregando(false)
    if (resultado.sucesso) {
      navigate(resultado.usuario?.perfil === 'ADMIN' ? '/admin' : '/')
    } else {
      setErro(resultado.mensagem)
    }
  }

  function preencher(email, senha) {
    setForm({ email, senha })
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Left - form */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 64px', maxWidth: 520 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginBottom: 48 }}>
          <div style={{ width: 36, height: 36, background: 'var(--primary)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: 20, color: 'var(--primary)' }}>LivroFácil</span>
        </Link>

        <h1 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 800, color: 'var(--text)' }}>Bem-vindo de volta!</h1>
        <p style={{ margin: '0 0 32px', fontSize: 15, color: 'var(--text-muted)' }}>Entre para continuar sua jornada literária.</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label className="label">E-mail</label>
            <input className="input-field" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="seu@email.com" required />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <label className="label" style={{ margin: 0 }}>Senha</label>
              <a href="#" style={{ fontSize: 13, color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>Esqueceu sua senha?</a>
            </div>
            <input className="input-field" type="password" value={form.senha} onChange={e => setForm(p => ({ ...p, senha: e.target.value }))} placeholder="••••••" required />
          </div>

          {erro && (
            <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, fontSize: 13, color: '#991B1B' }}>{erro}</div>
          )}

          <button type="submit" className="btn-primary" style={{ padding: '12px', fontSize: 15, marginTop: 4 }} disabled={carregando}>
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-muted)', marginTop: 24 }}>
          Não tem uma conta?{' '}
          <Link to="/cadastro" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Cadastre-se</Link>
        </p>

        {/* Demo hints */}
        <div style={{ marginTop: 32, padding: 16, background: '#F9F8FF', border: '1px dashed #DDD6FE', borderRadius: 10 }}>
          <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Ambiente de demonstração</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => preencher('cliente@email.com', '123456')} style={{ padding: '6px 12px', border: '1px solid #DDD6FE', borderRadius: 6, background: '#fff', fontSize: 12, cursor: 'pointer', color: 'var(--text)' }}>
              👤 Cliente
            </button>
            <button onClick={() => preencher('admin@email.com', '123456')} style={{ padding: '6px 12px', border: '1px solid #DDD6FE', borderRadius: 6, background: '#fff', fontSize: 12, cursor: 'pointer', color: 'var(--text)' }}>
              🛠 Admin
            </button>
          </div>
        </div>
      </div>

      {/* Right - illustration */}
      <div style={{ flex: 1, background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }} className="login-right">
        <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 80, marginBottom: 24 }}>📚</div>
          <h2 style={{ color: '#fff', fontSize: 26, fontWeight: 800, margin: '0 0 12px', lineHeight: 1.3 }}>Sua próxima história<br/>começa aqui</h2>
          <p style={{ color: '#DDD6FE', fontSize: 16, margin: '0 0 32px', lineHeight: 1.6 }}>Milhares de livros esperando por você. Do best-seller ao clássico, encontre sua leitura perfeita.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
            {['📦 Entrega para todo o Brasil', '💳 Parcela em até 12x', '🔄 Troca garantida em 7 dias'].map(t => (
              <div key={t} style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 24, padding: '8px 18px', color: '#EDE9FE', fontSize: 14, backdropFilter: 'blur(8px)' }}>{t}</div>
            ))}
          </div>
        </div>
      </div>
      <style>{`@media(max-width:768px){.login-right{display:none}}`}</style>
    </div>
  )
}
