import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import ClienteSidebar from '../../components/ClienteSidebar'
import { useAuth } from '../../context/AuthContext'

export default function Perfil() {
  const { usuario, atualizarUsuario, excluirConta } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    nome: usuario?.nome || '',
    email: usuario?.email || '',
    telefone: usuario?.telefone || '',
    dataNascimento: usuario?.dataNascimento || '',
  })
  const [senhas, setSenhas] = useState({ atual: '', nova: '', confirmar: '' })
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState('')

  function setField(field) {
    return (e) => setForm((p) => ({ ...p, [field]: e.target.value }))
  }

  function setSenha(field) {
    return (e) => setSenhas((p) => ({ ...p, [field]: e.target.value }))
  }

  async function salvarPerfil(e) {
    e.preventDefault()
    setSalvando(true)
    await new Promise((r) => setTimeout(r, 600))
    atualizarUsuario({ nome: form.nome, telefone: form.telefone, dataNascimento: form.dataNascimento })
    setSalvando(false)
    setSucesso('Perfil atualizado com sucesso!')
    setTimeout(() => setSucesso(''), 3000)
  }

  async function salvarSenha(e) {
    e.preventDefault()
    if (!senhas.nova || senhas.nova !== senhas.confirmar) {
      alert('As senhas não conferem.')
      return
    }
    setSalvando(true)
    await new Promise((r) => setTimeout(r, 600))
    // mock: não alteramos a senha real no mock; apenas mostra sucesso
    setSalvando(false)
    setSucesso('Senha alterada com sucesso!')
    setSenhas({ atual: '', nova: '', confirmar: '' })
    setTimeout(() => setSucesso(''), 3000)
  }

  async function handleExcluirConta() {
    if (!confirm('Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.')) return
    try {
      // excluirConta pode ser síncrono no mock; await funciona para ambos casos
      const res = await excluirConta()
      if (res && res.sucesso) {
        alert('Conta excluída com sucesso. Você será deslogado.')
        navigate('/')
      } else {
        alert('Erro ao excluir conta: ' + (res?.mensagem || 'Tente novamente.'))
      }
    } catch (err) {
      console.error(err)
      alert('Erro ao excluir conta: tente novamente.')
    }
  }

  return (
    <div>
      <Header />
      <main className="page-container" style={{ paddingTop: 40, paddingBottom: 80 }}>
        <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
          <ClienteSidebar />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
            {sucesso && (
              <div
                style={{
                  padding: '12px 16px',
                  background: '#D1FAE5',
                  border: '1px solid #A7F3D0',
                  borderRadius: 8,
                  fontSize: 14,
                  color: '#065F46',
                  fontWeight: 500,
                }}
              >
                ✓ {sucesso}
              </div>
            )}

            {/* Avatar + dados */}
            <div className="card" style={{ padding: 28 }}>
              <h2 style={{ margin: '0 0 24px', fontSize: 17, fontWeight: 700 }}>Meu Perfil</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 28,
                  }}
                >
                  {usuario?.nome?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 17 }}>{usuario?.nome}</p>
                  <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--text-muted)' }}>{usuario?.email}</p>

                  <div style={{ marginTop: 8 }}>
                    <button className="btn-danger" onClick={handleExcluirConta} style={{ padding: '10px 14px' }}>
                      Excluir conta
                    </button>
                  </div>
                </div>
              </div>

              {/* Formulário de edição do perfil */}
              <form onSubmit={salvarPerfil} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="label">Nome</label>
                    <input className="input-field" value={form.nome} onChange={setField('nome')} required />
                  </div>
                  <div>
                    <label className="label">Telefone</label>
                    <input className="input-field" value={form.telefone} onChange={setField('telefone')} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 12 }}>
                  <div>
                    <label className="label">E-mail</label>
                    <input className="input-field" value={form.email} disabled />
                  </div>
                  <div>
                    <label className="label">Data de nascimento</label>
                    <input className="input-field" type="date" value={form.dataNascimento} onChange={setField('dataNascimento')} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button className="btn-primary" type="submit" disabled={salvando} style={{ padding: '8px 14px' }}>
                    {salvando ? 'Salvando...' : 'Salvar perfil'}
                  </button>
                </div>
              </form>
            </div>

            {/* Alterar senha */}
            <div className="card" style={{ padding: 28 }}>
              <h3 style={{ marginTop: 0 }}>Alterar senha</h3>
              <form onSubmit={salvarSenha} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label className="label">Senha atual</label>
                  <input className="input-field" type="password" value={senhas.atual} onChange={setSenha('atual')} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="label">Nova senha</label>
                    <input className="input-field" type="password" value={senhas.nova} onChange={setSenha('nova')} />
                  </div>
                  <div>
                    <label className="label">Confirmar nova senha</label>
                    <input className="input-field" type="password" value={senhas.confirmar} onChange={setSenha('confirmar')} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button className="btn-ghost" type="submit" disabled={salvando} style={{ padding: '8px 14px' }}>
                    {salvando ? 'Salvando...' : 'Alterar senha'}
                  </button>
                </div>
              </form>
            </div>

            {/* Links rápidos (endereços, cartões, pedidos) */}
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ marginTop: 0 }}>Preferências e histórico</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button className="btn-secondary" onClick={() => navigate('/enderecos')} style={{ textAlign: 'left' }}>
                  Meus endereços
                </button>
                <button className="btn-secondary" onClick={() => navigate('/cartoes')} style={{ textAlign: 'left' }}>
                  Meus cartões
                </button>
                <button className="btn-secondary" onClick={() => navigate('/meus-pedidos')} style={{ textAlign: 'left' }}>
                  Meus pedidos
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}