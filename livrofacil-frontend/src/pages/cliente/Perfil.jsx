import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import ClienteSidebar from '../../components/ClienteSidebar'
import { useAuth } from '../../context/AuthContext'

export default function Perfil() {
  const { usuario, atualizarUsuario, excluirConta } = useAuth()
  const navigate = useNavigate()
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

  async function handleExcluirConta() {
    if (!confirm('Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.')) return
    const res = await Promise.resolve(excluirConta())
    if (res.sucesso) {
      alert('Conta excluída com sucesso. Você será deslogado.')
      navigate('/')
    } else {
      alert('Erro ao excluir conta: ' + (res.mensagem || 'Tente novamente.'))
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
                  <div style={{ marginTop: 8 }}>
                    <button className="btn-danger" onClick={handleExcluirConta} style={{ padding: '10px 14px' }}>Excluir conta</button>
                  </div>
                </div>
              </div>
