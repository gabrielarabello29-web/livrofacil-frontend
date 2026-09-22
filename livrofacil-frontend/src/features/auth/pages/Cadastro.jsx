import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/AuthContext'

function aplicarMascaraTelefone(valor) {
  const apenasDigitos = (valor || '').replace(/\D/g, '').slice(0, 11)
  if (!apenasDigitos) return ''

  const ddd = apenasDigitos.slice(0, 2)
  const resto = apenasDigitos.slice(2)

  if (!resto) return `(${ddd}`
  if (resto.length <= 4) return `(${ddd}) ${resto}`
  if (resto.length <= 5) return `(${ddd}) ${resto.slice(0, 5)}`
  if (resto.length <= 8) return `(${ddd}) ${resto.slice(0, 4)}-${resto.slice(4)}`
  return `(${ddd}) ${resto.slice(0, 5)}-${resto.slice(5, 9)}`
}

function validarEmail(email) {
  if (!email || !email.trim()) return 'Informe um e-mail válido.'
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? '' : 'Informe um e-mail válido.'
}

function validarTelefone(telefone) {
  if (!telefone || !telefone.trim()) return 'Informe o telefone no formato (11) 99999-9999.'
  return /^\(\d{2}\)\s?\d{4,5}-\d{4}$/.test(telefone.trim()) ? '' : 'Informe o telefone no formato (11) 99999-9999.'
}

function aplicarMascaraCpf(valor) {
  const digitos = (valor || '').replace(/\D/g, '').slice(0, 11)
  if (digitos.length <= 3) return digitos
  if (digitos.length <= 6) return `${digitos.slice(0, 3)}.${digitos.slice(3)}`
  if (digitos.length <= 9) return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6)}`
  return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}`
}

function validarCpf(cpf) {
  return /^\d{11}$/.test(String(cpf || '').replace(/\D/g, '')) ? '' : 'O CPF deve possuir exatamente 11 números.'
}

function validarSenha(senha) {
  return /^(?=.{8,}$)(?=.*[A-Z])(?=.*[^A-Za-z0-9]).*$/.test(senha)
    ? ''
    : 'A senha deve ter no mínimo 8 caracteres, uma letra maiúscula e um caractere especial.'
}

function validarDataNascimento(dataNascimento) {
  if (!dataNascimento) return 'Informe a data de nascimento.'
  const hoje = new Date()
  const data = new Date(`${dataNascimento}T00:00:00`)
  const limite = new Date(hoje.getFullYear() - 18, hoje.getMonth(), hoje.getDate())
  if (Number.isNaN(data.getTime()) || dataNascimento > hoje.toISOString().slice(0, 10)) return 'Informe uma data de nascimento válida.'
  return data > limite ? 'Você precisa ter pelo menos 18 anos.' : ''
}

function dataMaximaNascimento() {
  const hoje = new Date()
  return `${hoje.getFullYear() - 18}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`
}

export default function Cadastro({ compact = false, onSuccess, onBackToLogin }) {
  const { registrar } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ nome: '', email: '', cpf: '', telefone: '', dataNascimento: '', genero: '', senha: '', confirmarSenha: '', endereco: { tipoEndereco: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: '' } })
  const [erros, setErros] = useState({})
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  function setCampo(field, valor) {
    const proximoValor = field === 'telefone' ? aplicarMascaraTelefone(valor) : field === 'cpf' ? aplicarMascaraCpf(valor) : valor
    const proximo = { ...form, [field]: proximoValor }
    setForm(proximo)

    if (field === 'email') {
      setErros((atual) => ({ ...atual, email: validarEmail(proximo.email) }))
    }
    if (field === 'telefone') {
      setErros((atual) => ({ ...atual, telefone: validarTelefone(proximo.telefone) }))
    }
    if (field === 'cpf') setErros((atual) => ({ ...atual, cpf: validarCpf(proximo.cpf) }))
    if (field === 'dataNascimento') setErros((atual) => ({ ...atual, dataNascimento: validarDataNascimento(proximo.dataNascimento) }))
    if (field === 'senha') {
      setErros((atual) => ({
        ...atual,
        senha: validarSenha(proximo.senha),
        confirmarSenha: proximo.confirmarSenha && proximo.confirmarSenha !== proximo.senha ? 'As senhas não coincidem.' : '',
      }))
    }
    if (field === 'confirmarSenha') {
      setErros((atual) => ({
        ...atual,
        confirmarSenha: proximo.confirmarSenha !== proximo.senha ? 'As senhas não coincidem.' : '',
      }))
    }
  }

  function setEnderecoCampo(campo, valor) {
    const proximoEndereco = { ...form.endereco, [campo]: campo === 'estado' ? valor.toUpperCase() : valor }
    setForm((atual) => ({ ...atual, endereco: proximoEndereco }))
  }

  function mascararCep(valor) {
    const digitos = valor.replace(/\D/g, '').slice(0, 8)
    return digitos.length > 5 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : digitos
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')

    const payload = {
      nome: form.nome.trim(),
      email: form.email.trim(),
      cpf: form.cpf.replace(/\D/g, ''),
      telefone: form.telefone.trim(),
      dataNascimento: form.dataNascimento,
      genero: form.genero,
      senha: form.senha,
      confirmarSenha: form.confirmarSenha,
      endereco: { ...form.endereco, principal: true, estado: form.endereco.estado.toUpperCase() },
    }

    const validacoes = {
      nome: !payload.nome ? 'Informe o nome.' : payload.nome.length > 100 ? 'O nome deve ter no máximo 100 caracteres.' : '',
      email: validarEmail(payload.email),
      cpf: validarCpf(payload.cpf),
      telefone: validarTelefone(payload.telefone),
      dataNascimento: validarDataNascimento(payload.dataNascimento),
      genero: payload.genero ? '' : 'Selecione o gênero.',
      senha: validarSenha(payload.senha),
      confirmarSenha: payload.senha !== payload.confirmarSenha ? 'As senhas não coincidem.' : '',
      'endereco.tipoEndereco': payload.endereco.tipoEndereco.trim() ? '' : 'Informe o tipo de endereço.',
      'endereco.tipoEndereco.tamanho': payload.endereco.tipoEndereco.trim().length > 50 ? 'O tipo de endereço deve ter no máximo 50 caracteres.' : '',
      'endereco.logradouro': payload.endereco.logradouro.trim() ? '' : 'Informe o logradouro.',
      'endereco.logradouro.tamanho': payload.endereco.logradouro.trim().length > 150 ? 'O logradouro deve ter no máximo 150 caracteres.' : '',
      'endereco.numero': /^(?:\d+[A-Za-z]?|S\/N)$/i.test(payload.endereco.numero.trim()) ? '' : 'O número deve ser como 100, 100A ou S/N.',
      'endereco.complemento.tamanho': payload.endereco.complemento.trim().length > 100 ? 'O complemento deve ter no máximo 100 caracteres.' : '',
      'endereco.bairro': payload.endereco.bairro.trim() ? '' : 'Informe o bairro.',
      'endereco.bairro.tamanho': payload.endereco.bairro.trim().length > 100 ? 'O bairro deve ter no máximo 100 caracteres.' : '',
      'endereco.cidade': payload.endereco.cidade.trim() ? '' : 'Informe a cidade.',
      'endereco.cidade.tamanho': payload.endereco.cidade.trim().length > 100 ? 'A cidade deve ter no máximo 100 caracteres.' : '',
      'endereco.estado': /^[A-Z]{2}$/.test(payload.endereco.estado) ? '' : 'O estado deve possuir duas letras maiúsculas.',
      'endereco.cep': /^\d{5}-\d{3}$/.test(payload.endereco.cep) ? '' : 'O CEP deve seguir o formato 00000-000.',
    }

    const camposComErro = Object.fromEntries(
      Object.entries(validacoes).filter(([, mensagem]) => Boolean(mensagem)),
    )

    setErros(camposComErro)

    if (Object.keys(camposComErro).length > 0) {
      setErro('Corrija os campos inválidos antes de continuar.')
      return
    }

    setCarregando(true)

    try {
      const resultado = await registrar(payload)

      if (resultado.sucesso) {
        if (onSuccess) {
          onSuccess()
          return
        }
        navigate('/login?success=1')
        return
      }

      setErros(resultado.erros || {})
      setErro(resultado.mensagem)
    } finally {
      setCarregando(false)
    }
  }

  const content = (
    <>
      <h1 style={{ margin: '0 0 8px', fontSize: compact ? 24 : 26, fontWeight: 800, color: 'var(--text)' }}>Crie sua conta</h1>
      <p style={{ margin: '0 0 28px', fontSize: 15, color: 'var(--text-muted)' }}>Junte-se a milhares de leitores apaixonados.</p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label className="label">Nome completo</label>
          <input className="input-field" value={form.nome} onChange={(e) => setCampo('nome', e.target.value)} placeholder="Seu nome completo" required />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : '1fr 1fr', gap: 12 }}>
          <div>
            <label className="label">E-mail</label>
            <input className="input-field" type="email" value={form.email} onChange={(e) => setCampo('email', e.target.value)} placeholder="seu@email.com" required style={{ borderColor: erros.email ? '#DC2626' : undefined }} />
            {erros.email && <div style={{ marginTop: 6, color: '#DC2626', fontSize: 12 }}>{erros.email}</div>}
          </div>
          <div>
            <label className="label">Data de nascimento</label>
            <input className="input-field" type="date" value={form.dataNascimento} onChange={(e) => setCampo('dataNascimento', e.target.value)} max={dataMaximaNascimento()} required style={{ borderColor: erros.dataNascimento ? '#DC2626' : undefined }} />
            {erros.dataNascimento && <div style={{ marginTop: 6, color: '#DC2626', fontSize: 12 }}>{erros.dataNascimento}</div>}
          </div>
          <div>
            <label className="label">Telefone</label>
            <input className="input-field" value={form.telefone} onChange={(e) => setCampo('telefone', e.target.value)} placeholder="(11) 99999-9999" style={{ borderColor: erros.telefone ? '#DC2626' : undefined }} />
            {erros.telefone && <div style={{ marginTop: 6, color: '#DC2626', fontSize: 12 }}>{erros.telefone}</div>}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : '1fr 1fr', gap: 12 }}>
          <div>
            <label className="label">CPF</label>
            <input className="input-field" inputMode="numeric" maxLength={14} pattern="[0-9.\-]*" value={form.cpf} onChange={(e) => setCampo('cpf', e.target.value)} placeholder="000.000.000-00" required style={{ borderColor: erros.cpf ? '#DC2626' : undefined }} />
            {erros.cpf && <div style={{ marginTop: 6, color: '#DC2626', fontSize: 12 }}>{erros.cpf}</div>}
          </div>
          <div>
            <label className="label">Gênero</label>
            <select className="input-field" value={form.genero} onChange={(e) => setCampo('genero', e.target.value)} required style={{ borderColor: erros.genero ? '#DC2626' : undefined }}>
              <option value="">Selecione</option>
              <option value="MASCULINO">Masculino</option>
              <option value="FEMININO">Feminino</option>
              <option value="OUTRO">Outro</option>
              <option value="PREFIRO_NAO_INFORMAR">Prefiro não informar</option>
            </select>
            {erros.genero && <div style={{ marginTop: 6, color: '#DC2626', fontSize: 12 }}>{erros.genero}</div>}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : '1fr 1fr', gap: 12 }}>
          <div>
            <label className="label">Senha</label>
            <input className="input-field" type="password" value={form.senha} onChange={(e) => setCampo('senha', e.target.value)} placeholder="Mínimo 6 caracteres" required style={{ borderColor: erros.senha ? '#DC2626' : undefined }} />
            {erros.senha && <div style={{ marginTop: 6, color: '#DC2626', fontSize: 12 }}>{erros.senha}</div>}
          </div>
          <div>
            <label className="label">Confirmar senha</label>
            <input className="input-field" type="password" value={form.confirmarSenha} onChange={(e) => setCampo('confirmarSenha', e.target.value)} placeholder="Repita a senha" required style={{ borderColor: erros.confirmarSenha ? '#DC2626' : undefined }} />
            {erros.confirmarSenha && <div style={{ marginTop: 6, color: '#DC2626', fontSize: 12 }}>{erros.confirmarSenha}</div>}
          </div>
        </div>

        <div style={{ paddingTop: 8, borderTop: '1px solid #E5E7EB' }}>
          <h2 style={{ margin: '8px 0 14px', fontSize: 17 }}>Endereço principal</h2>
          <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : '1fr 1fr', gap: 12 }}>
            {[
              ['tipoEndereco', 'Tipo de endereço', 'Ex.: Casa'],
              ['logradouro', 'Logradouro', 'Rua das Flores'],
              ['numero', 'Número', '100, 100A ou S/N'],
              ['complemento', 'Complemento (opcional)', 'Apto 202'],
              ['bairro', 'Bairro', 'Centro'],
              ['cidade', 'Cidade', 'São Paulo'],
            ].map(([campo, label, placeholder]) => (
              <div key={campo}>
                <label className="label">{label}</label>
                <input className="input-field" maxLength={campo === 'tipoEndereco' ? 50 : campo === 'logradouro' ? 150 : campo === 'complemento' ? 100 : 100} value={form.endereco[campo]} onChange={(e) => setEnderecoCampo(campo, e.target.value)} placeholder={placeholder} required={campo !== 'complemento'} style={{ borderColor: erros[`endereco.${campo}`] ? '#DC2626' : undefined }} />
                {erros[`endereco.${campo}`] && <div style={{ marginTop: 6, color: '#DC2626', fontSize: 12 }}>{erros[`endereco.${campo}`]}</div>}
              </div>
            ))}
            <div>
              <label className="label">Estado</label>
              <input className="input-field" maxLength={2} value={form.endereco.estado} onChange={(e) => setEnderecoCampo('estado', e.target.value)} placeholder="SP" required style={{ borderColor: erros['endereco.estado'] ? '#DC2626' : undefined }} />
              {erros['endereco.estado'] && <div style={{ marginTop: 6, color: '#DC2626', fontSize: 12 }}>{erros['endereco.estado']}</div>}
            </div>
            <div>
              <label className="label">CEP</label>
              <input className="input-field" inputMode="numeric" maxLength={9} value={form.endereco.cep} onChange={(e) => setEnderecoCampo('cep', mascararCep(e.target.value))} placeholder="00000-000" required style={{ borderColor: erros['endereco.cep'] ? '#DC2626' : undefined }} />
              {erros['endereco.cep'] && <div style={{ marginTop: 6, color: '#DC2626', fontSize: 12 }}>{erros['endereco.cep']}</div>}
            </div>
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
        <button type="button" onClick={onBackToLogin || (() => navigate('/login'))} style={{ border: 'none', background: 'transparent', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', padding: 0 }}>
          Entrar
        </button>
      </p>
    </>
  )

  if (compact) {
    return (
      <div style={{ maxWidth: 560, width: '100%', margin: '0 auto', padding: '32px 20px 40px' }}>
        {content}
      </div>
    )
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
        {content}
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
