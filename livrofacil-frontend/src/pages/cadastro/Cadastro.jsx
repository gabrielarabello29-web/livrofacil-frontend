import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Cadastro() {
  const { registrar } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', cpf: '', senha: '', confirmarSenha: '' })
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  function set(field) { return e => setForm(p => ({ ...p, [field]: e.target.value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    if (form.senha !== form.confirmarSenha) { setErro('As senhas não coincidem.'); return }
    if (form.senha.length < 6) { setErro('A senha deve ter pelo menos 6 caracteres.'); return }
    setCarregando(true)
    await new Promise(r => setTimeout(r, 400))
    const resultado = registrar({ nome: form.nome, email: form.email, telefone: form.telefone, cpf: form.cpf, senha: form.senha })
    setCarregando(false)
    if (resultado.sucesso) navigate('/')
    else setErro(resultado.mensagem)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 64px', maxWidth: 560 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginBottom: 40 }}>
          <div style={{ width: 36, height: 36, background: 'var(--primary)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: 20, color: 'var(--primary)' }}>LivroFácil</span>
        </Link>

        <h1 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 800, color: 'var(--text)' }}>Crie sua conta</h1>
        <p style={{ margin: '0 0 28px', fontSize: 15, color: 'var(--text-muted)' }}>Junte-se a milhares de leitores apaixonados.</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="label">Nome completo</label>
            <input className="input-field" value={form.nome} onChange={set('nome')} placeholder="Seu nome completo" required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="label">E-mail</label>
              <input className="input-field" type="email" value={form.email} onChange={set('email')} placeholder="seu@email.com" required />
            </div>
            <div>
              <label className="label">Telefone</label>
              <input className="input-field" value={form.telefone} onChange={set('telefone')} placeholder="(11) 99999-0000" />
            </div>
          </div>
          <div>
            <label className="label">CPF</label>
            <input className="input-field" value={form.cpf} onChange={set('cpf')} placeholder="000.000.000-00" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="label">Senha</label>
              <input className="input-field" type="password" value={form.senha} onChange={set('senha')} placeholder="Mínimo 6 caracteres" required />
            </div>
            <div>
              <label className="label">Confirmar senha</label>
              <input className="input-field" type="password" value={form.confirmarSenha} onChange={set('confirmarSenha')} placeholder="Repita a senha" required />
            </div>
          </div>

          {erro && (
            <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, fontSize: 13, color: '#991B1B' }}>{erro}</div>
          )}

          <button type="submit" className="btn-primary" style={{ padding: '12px', fontSize: 15, marginTop: 4 }} disabled={carregando}>
            {carregando ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-muted)', marginTop: 20 }}>
          Já possui uma conta?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Entrar</Link>
        </p>
      </div>

      <div style={{ flex: 1, background: 'linear-gradient(135deg, #5B21B6 0%, #7C3AED 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }} className="cad-right">
        <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 72, marginBottom: 20 }}>🎉</div>
          <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 800, margin: '0 0 12px' }}>Bem-vindo à família<br/>LivroFácil!</h2>
          <p style={{ color: '#DDD6FE', fontSize: 15, margin: '0 0 28px', lineHeight: 1.6 }}>Crie sua conta e comece a explorar um universo de conhecimento e aventuras literárias.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
            {['⚡ Compra rápida e segura', '🎁 Cupons exclusivos para novos usuários', '⭐ Recomendações personalizadas'].map(t => (
              <div key={t} style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 24, padding: '8px 18px', color: '#EDE9FE', fontSize: 14 }}>{t}</div>
            ))}
          </div>
        </div>
      </div>
      <style>{`@media(max-width:768px){.cad-right{display:none}}`}</style>
    </div>
  )
}
