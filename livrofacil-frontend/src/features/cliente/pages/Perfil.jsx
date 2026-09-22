import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '@/shared/components/Header'
import Footer from '@/shared/components/Footer'
import ClienteSidebar from '@/shared/layouts/cliente/ClienteSidebar'
import { useAuth } from '@/features/auth/context/AuthContext'
import { clienteService } from '@/features/cliente/api/clienteService'

function validarSenha(senha) {
  return /^(?=.{8,}$)(?=.*[A-Z])(?=.*[^A-Za-z0-9]).*$/.test(senha)
}

function mascararCpf(valor) {
  const digitos = String(valor || '').replace(/\D/g, '').slice(0, 11)
  if (digitos.length <= 3) return digitos
  if (digitos.length <= 6) return `${digitos.slice(0, 3)}.${digitos.slice(3)}`
  if (digitos.length <= 9) return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6)}`
  return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}`
}

export default function Perfil() {
  const { usuario, atualizarUsuario, excluirConta } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    nome: usuario?.nome || '',
    email: usuario?.email || '',
    cpf: usuario?.cpf || '',
    telefone: usuario?.telefone || '',
    dataNascimento: usuario?.dataNascimento || '',
    genero: usuario?.genero || '',
  })
  const [senhas, setSenhas] = useState({ atual: '', nova: '', confirmar: '' })
  const [salvando, setSalvando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  const [sucesso, setSucesso] = useState('')
  const [erro, setErro] = useState('')

  function setField(field) {
    return (e) => setForm((p) => ({ ...p, [field]: e.target.value }))
  }

  function setSenha(field) {
    return (e) => setSenhas((p) => ({ ...p, [field]: e.target.value }))
  }

  async function salvarPerfil(e) {
    e.preventDefault()
    if (usuario?.ativo === false) { setErro('Esta conta já foi excluída.'); return }
    setErro('')
    if (form.dataNascimento && form.dataNascimento > new Date().toISOString().slice(0, 10)) {
      setErro('A data de nascimento não pode ser futura.')
      return
    }
    setSalvando(true)
    try {
        const atualizado = await clienteService.atualizarCliente(usuario.id, {
        nome: form.nome.trim(),
        email: form.email,
          cpf: form.cpf.replace(/\D/g, ''),
        telefone: form.telefone,
        dataNascimento: form.dataNascimento,
          genero: form.genero,
      })
        atualizarUsuario({ ...atualizado, nome: form.nome, cpf: form.cpf, telefone: form.telefone, dataNascimento: form.dataNascimento, genero: form.genero })
      setSucesso('Perfil atualizado com sucesso!')
      setTimeout(() => setSucesso(''), 3000)
    } catch (error) {
      setErro(error?.status === 404 ? 'Registro não encontrado.' : error?.message || 'Não foi possível atualizar o perfil.')
    } finally {
      setSalvando(false)
    }
  }

  async function salvarSenha(e) {
    e.preventDefault()
    if (usuario?.ativo === false) { setErro('Esta conta já foi excluída.'); return }
    if (!senhas.atual) {
      setErro('Informe a senha atual.')
      return
    }
    if (!validarSenha(senhas.nova)) {
      setErro('A nova senha deve ter no mínimo 8 caracteres, uma letra maiúscula e um caractere especial.')
      return
    }
    if (senhas.nova !== senhas.confirmar) {
      setErro('As senhas não coincidem.')
      return
    }
    setSalvando(true)
    setErro('')
    try {
      await clienteService.alterarSenha(usuario.id, {
        senhaAtual: senhas.atual,
        novaSenha: senhas.nova,
        confirmarNovaSenha: senhas.confirmar,
      })
      setSucesso('Senha alterada com sucesso!')
      setSenhas({ atual: '', nova: '', confirmar: '' })
      setTimeout(() => setSucesso(''), 3000)
    } catch (error) {
      setErro(error?.message || 'Não foi possível alterar a senha.')
    } finally {
      setSalvando(false)
    }
  }

  async function handleExcluirConta() {
    if (excluindo) return
    const confirmacao = window.confirm('Excluir minha conta?\n\nA conta ficará inativa imediatamente e será mantida por 30 dias. Depois desse prazo, os dados pessoais serão anonimizados. Não será possível reativar a conta. Seus pedidos históricos não serão excluídos.\n\nDeseja continuar?')
    if (!confirmacao) return
    setExcluindo(true)
    setErro('')
    try {
      const res = await excluirConta()
      if (res && res.sucesso) {
        navigate('/login', { replace: true, state: { mensagem: 'Sua conta foi excluída e a sessão foi encerrada.' } })
      } else {
        setErro(res?.mensagem || 'Não foi possível excluir a conta. Tente novamente.')
      }
    } catch (err) {
      console.error(err)
      setErro('Não foi possível excluir a conta. Tente novamente.')
    } finally {
      setExcluindo(false)
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
            {erro && <div style={{ padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, fontSize: 14, color: '#991B1B' }}>{erro}</div>}

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
                    <button className="btn-danger" onClick={handleExcluirConta} disabled={excluindo || salvando} style={{ padding: '10px 14px' }}>
                      {excluindo ? 'Excluindo conta...' : 'Excluir minha conta'}
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
                  <div>
                    <label className="label">CPF</label>
                    <input className="input-field" inputMode="numeric" pattern="[0-9.\-]*" value={mascararCpf(form.cpf)} onChange={(e) => setForm((atual) => ({ ...atual, cpf: mascararCpf(e.target.value) }))} maxLength={14} />
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
                  <div>
                    <label className="label">Gênero</label>
                    <select className="input-field" value={form.genero} onChange={setField('genero')}>
                      <option value="">Selecione</option>
                      <option value="MASCULINO">Masculino</option>
                      <option value="FEMININO">Feminino</option>
                      <option value="OUTRO">Outro</option>
                      <option value="PREFIRO_NAO_INFORMAR">Prefiro não informar</option>
                    </select>
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

          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}