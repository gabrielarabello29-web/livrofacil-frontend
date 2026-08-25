import { useState } from 'react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import ClienteSidebar from '../../components/ClienteSidebar'
import { useAuth } from '../../context/AuthContext'

export default function Perfil() {
  const { usuario, atualizarUsuario } = useAuth()
  const [form, setForm] = useState({ nome: usuario?.nome || '', email: usuario?.email || '', telefone: usuario?.telefone || '', dataNascimento: usuario?.dataNascimento || '' })
  const [senhas, setSenhas] = useState({ atual: '', nova: '', confirmar: '' })
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState('')

  function set(field) { return e => setForm(p => ({ ...p, [field]: e.target.value })) }

  async function salvarPerfil(e) {
    e.preventDefault()
    setSalvando(true)
    await new Promise(r => setTimeout(r, 600))
    atualizarUsuario({ nome: form.nome, telefone: form.telefone, dataNascimento: form.dataNascimento })
    setSalvando(false)
    setSucesso('Perfil atualizado com sucesso!')
    setTimeout(() => setSucesso(''), 3000)
  }

  async function salvarSenha(e) {
    e.preventDefault()
    if (senhas.nova !== senhas.confirmar) return
    setSalvando(true)
    await new Promise(r => setTimeout(r, 600))
    setSalvando(false)
    setSucesso('Senha alterada com sucesso!')
    setSenhas({ atual: '', nova: '', confirmar: '' })
    setTimeout(() => setSucesso(''), 3000)
  }

  return (
    <div>
      <Header />
      <main className="page-container" style={{ paddingTop: 40, paddingBottom: 80 }}>
        <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
          <ClienteSidebar />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
            {sucesso && (
              <div style={{ padding: '12px 16px', background: '#D1FAE5', border: '1px solid #A7F3D0', borderRadius: 8, fontSize: 14, color: '#065F46', fontWeight: 500 }}>
                ✓ {sucesso}
              </div>
            )}

            {/* Avatar + dados */}
            <div className="card" style={{ padding: 28 }}>
              <h2 style={{ margin: '0 0 24px', fontSize: 17, fontWeight: 700 }}>Meu Perfil</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, flexShrink: 0 }}>
                  {usuario?.nome?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 17 }}>{usuario?.nome}</p>
                  <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--text-muted)' }}>{usuario?.email}</p>
                  <button className="btn-ghost" style={{ fontSize: 13, padding: '6px 14px', border: '1px solid #E5E7EB' }}>Alterar foto</button>
                </div>
              </div>
              <form onSubmit={salvarPerfil}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div><label className="label">Nome completo</label><input className="input-field" value={form.nome} onChange={set('nome')} required /></div>
                  <div><label className="label">E-mail</label><input className="input-field" type="email" value={form.email} disabled style={{ background: '#F9FAFB', cursor: 'not-allowed' }} /></div>
                  <div><label className="label">Telefone</label><input className="input-field" value={form.telefone} onChange={set('telefone')} placeholder="(11) 99999-0000" /></div>
                  <div><label className="label">Data de nascimento</label><input className="input-field" type="date" value={form.dataNascimento} onChange={set('dataNascimento')} /></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn-primary" style={{ padding: '10px 24px' }} disabled={salvando}>
                    {salvando ? 'Salvando...' : 'Salvar alterações'}
                  </button>
                </div>
              </form>
            </div>

            {/* Senha */}
            <div className="card" style={{ padding: 28 }}>
              <h2 style={{ margin: '0 0 24px', fontSize: 17, fontWeight: 700 }}>Alterar senha</h2>
              <form onSubmit={salvarSenha}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 400 }}>
                  <div><label className="label">Senha atual</label><input className="input-field" type="password" value={senhas.atual} onChange={e => setSenhas(p => ({ ...p, atual: e.target.value }))} required /></div>
                  <div><label className="label">Nova senha</label><input className="input-field" type="password" value={senhas.nova} onChange={e => setSenhas(p => ({ ...p, nova: e.target.value }))} required /></div>
                  <div><label className="label">Confirmar nova senha</label><input className="input-field" type="password" value={senhas.confirmar} onChange={e => setSenhas(p => ({ ...p, confirmar: e.target.value }))} required /></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                  <button type="submit" className="btn-primary" style={{ padding: '10px 24px' }} disabled={salvando}>Alterar senha</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
