import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Cadastro from '@/features/auth/pages/Cadastro'
import { useAuth } from '@/features/auth/context/AuthContext'

export default function Login({ initialMode = 'login' }) {
  const { login, usuario } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [modo, setModo] = useState(initialMode)
  const [form, setForm] = useState({ email: '', senha: '' })
  const [erro, setErro] = useState('')
  const [errosCampos, setErrosCampos] = useState({})
  const [sucesso, setSucesso] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [mostrarSenha, setMostrarSenha] = useState(false)

  useEffect(() => {
    if (usuario) {
      navigate(usuario.perfil?.toUpperCase() === 'ADMIN' ? '/admin' : '/', { replace: true })
    }
  }, [usuario, navigate])

  useEffect(() => {
    if (location.state?.mensagem) {
      setErro(location.state.mensagem)
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [location.state])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('success') === '1') {
      setSucesso('Cadastro realizado com sucesso. Faça login para continuar.')
      setModo('login')
    }
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    setErrosCampos({})

    const emailValido = /\S+@\S+\.\S+/.test(form.email)
    if (!form.email.trim()) {
      setErrosCampos((prev) => ({ ...prev, email: 'E-mail é obrigatório.' }))
      return
    }
    if (!emailValido) {
      setErrosCampos((prev) => ({ ...prev, email: 'Informe um e-mail válido.' }))
      return
    }
    if (!form.senha.trim()) {
      setErrosCampos((prev) => ({ ...prev, senha: 'Senha é obrigatória.' }))
      return
    }

    setCarregando(true)
    const resultado = await login(form.email, form.senha)
    setCarregando(false)

    if (resultado.sucesso) {
      const perfil = String(resultado.usuario?.perfil || '').toUpperCase()
      navigate(perfil === 'ADMIN' ? '/admin' : '/', { replace: true })
    } else {
      setErro(resultado.mensagem)
      setErrosCampos(resultado.erros || {})
    }
  }

  function preencher(email, senha) {
    setForm({ email, senha })
  }

  if (modo === 'cadastro') {
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' }}>
        <div style={{ width: '100%', maxWidth: 620, marginBottom: 20, display: 'flex', justifyContent: 'center', gap: 12 }}>
          <button type="button" onClick={() => setModo('login')} style={{ border: '1px solid #E5E7EB', background: '#fff', color: 'var(--text)', padding: '12px 24px', borderRadius: 999, fontWeight: 700, cursor: 'pointer' }}>
            Entrar
          </button>
          <button type="button" onClick={() => setModo('cadastro')} style={{ border: '1px solid var(--primary)', background: 'var(--primary)', color: '#fff', padding: '12px 24px', borderRadius: 999, fontWeight: 700, cursor: 'pointer' }}>
            Cadastrar-se
          </button>
        </div>
        <div style={{ width: '100%', maxWidth: 620, background: '#fff', borderRadius: 18, boxShadow: '0 10px 30px rgba(15,23,42,.08)' }}>
          <Cadastro compact onBackToLogin={() => setModo('login')} onSuccess={() => { setSucesso('Cadastro realizado com sucesso. Faça login para continuar.'); setModo('login') }} />
        </div>
      </div>
    )
  }

  return (
    <div className="auth-shell" style={{ minHeight: '100vh', background: '#F4F0EE', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' }}>
      <div className="login-card" style={{ width: '100%', maxWidth: 1100, display: 'flex', background: '#fff', borderRadius: 28, overflow: 'hidden', boxShadow: '0 22px 60px rgba(62, 31, 89, 0.12)', border: '1px solid rgba(124, 58, 237, 0.08)' }}>
        <div style={{ flex: 1.08, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 32px 28px', background: '#fff' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 28 }}>
            <div style={{ width: 34, height: 34, background: 'var(--primary)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
            </div>
            <span style={{ fontWeight: 800, fontSize: 22, color: 'var(--primary)' }}>LivroFácil</span>
          </Link>

          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            <button type="button" onClick={() => setModo('login')} style={{ flex: 1, border: '1px solid var(--primary)', background: 'var(--primary)', color: '#fff', padding: '12px 18px', borderRadius: 999, fontWeight: 700, cursor: 'pointer', fontSize: 15 }}>
              Entrar
            </button>
            <button type="button" onClick={() => setModo('cadastro')} style={{ flex: 1, border: '1px solid #E5E7EB', background: '#fff', color: 'var(--text)', padding: '12px 18px', borderRadius: 999, fontWeight: 700, cursor: 'pointer', fontSize: 15 }}>
              Cadastrar-se
            </button>
          </div>

          <h1 style={{ margin: '0 0 8px', fontSize: 30, fontWeight: 800, color: 'var(--text)' }}>Bem-vindo de volta!</h1>
          <p style={{ margin: '0 0 24px', fontSize: 15, color: 'var(--text-muted)' }}>Entre para continuar sua jornada literária.</p>

          {sucesso && (
            <div style={{ marginBottom: 16, padding: '10px 14px', background: '#D1FAE5', border: '1px solid #A7F3D0', borderRadius: 8, fontSize: 13, color: '#065F46' }}>{sucesso}</div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label className="label">E-mail</label>
              <input
                className="input-field"
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="seu@email.com"
                aria-invalid={Boolean(errosCampos.email)}
              />
              {errosCampos.email && <small style={{ color: '#b91c1c', display: 'block', marginTop: 6 }}>{errosCampos.email}</small>}
            </div>
            <div>
              <label className="label" style={{ margin: 0 }}>Senha</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input-field"
                  type={mostrarSenha ? 'text' : 'password'}
                  value={form.senha}
                  onChange={e => setForm(p => ({ ...p, senha: e.target.value }))}
                  placeholder="••••••"
                  aria-invalid={Boolean(errosCampos.senha)}
                  style={{ paddingRight: 42 }}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha((prev) => !prev)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12 }}
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {mostrarSenha ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              {errosCampos.senha && <small style={{ color: '#b91c1c', display: 'block', marginTop: 6 }}>{errosCampos.senha}</small>}
            </div>

            {erro && (
              <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, fontSize: 13, color: '#991B1B' }}>{erro}</div>
            )}

            <button type="submit" className="btn-primary" style={{ padding: '12px', fontSize: 15, marginTop: 4 }} disabled={carregando}>
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div style={{ marginTop: 28, padding: 16, background: '#F9F8FF', border: '1px dashed #DDD6FE', borderRadius: 12 }}>
            <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.4 }}>ACESSO RÁPIDO</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" onClick={() => preencher('cliente@livrofacil.com', 'LivroFacil@2026')} style={{ padding: '8px 12px', border: '1px solid #DDD6FE', borderRadius: 8, background: '#fff', fontSize: 12, cursor: 'pointer', color: 'var(--text)', fontWeight: 600 }}>
                👤 Cliente
              </button>
              <button type="button" onClick={() => preencher('admin@livrofacil.com', 'Admin@123')} style={{ padding: '8px 12px', border: '1px solid #DDD6FE', borderRadius: 8, background: '#fff', fontSize: 12, cursor: 'pointer', color: 'var(--text)', fontWeight: 600 }}>
                🛠 Admin
              </button>
            </div>
          </div>
        </div>

        <div style={{ flex: 0.96, background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', minHeight: 580 }} className="login-right">
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at top left, rgba(255,255,255,0.2), transparent 28%), radial-gradient(circle at bottom right, rgba(255,255,255,0.12), transparent 25%)' }} />
          <div style={{ position: 'absolute', top: 54, right: 52, width: 150, height: 150, borderRadius: 22, background: 'rgba(255,255,255,0.12)', transform: 'rotate(12deg)' }} />
          <div style={{ position: 'absolute', bottom: 58, left: 52, width: 140, height: 140, borderRadius: 22, background: 'rgba(255,255,255,0.08)', transform: 'rotate(-10deg)' }} />
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'left', padding: '48px 42px 52px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
              <div style={{ width: 82, height: 82, borderRadius: 20, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.14)' }}>
                <span style={{ fontSize: 38 }}>📚</span>
              </div>
            </div>
            <h2 style={{ color: '#fff', fontSize: 36, fontWeight: 800, margin: '0 0 16px', lineHeight: 1.1 }}>Sua próxima história<br/>começa aqui</h2>
            <p style={{ color: '#E9D5FF', fontSize: 16, margin: '0 0 28px', lineHeight: 1.6, maxWidth: 280 }}>Milhares de livros esperando por você. Descubra histórias que vão acompanhar sua rotina e seu momento.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 300 }}>
              {['📦 Entrega para todo o Brasil', '💳 Parcela em até 12x', '🔄 Troca garantida em 7 dias'].map((t) => (
                <div key={t} style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 16, padding: '10px 14px', color: '#F5F3FF', fontSize: 15, fontWeight: 600, backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.08)' }}>{t}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`@media (max-width: 820px){.auth-shell{display:flex!important;padding:20px 14px!important}.login-card{display:flex!important;flex-direction:column!important;border-radius:20px!important}.login-right{display:none!important}.auth-shell>div{width:100%}}`}</style>
    </div>
  )
}
