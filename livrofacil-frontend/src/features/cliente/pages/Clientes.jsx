import { useEffect, useState } from 'react'
import AdminSidebar from '../../components/AdminSidebar'
import { ApiError } from '../../services/api'
import { clienteService } from '../../services/clienteService'

const formularioInicial = { nome: '', email: '', telefone: '' }

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
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  return ok ? '' : 'Informe um e-mail válido.'
}

function validarTelefone(telefone) {
  if (!telefone || !telefone.trim()) return 'Informe o telefone no formato (11) 99999-9999.'
  const valor = telefone.trim()
  const ok = /^\(\d{2}\)\s?\d{4,5}-\d{4}$/.test(valor)
  return ok ? '' : 'Informe o telefone no formato (11) 99999-9999.'
}

function formatarData(dataIso) {
  if (!dataIso) return '—'

  const data = new Date(dataIso)
  if (Number.isNaN(data.getTime())) return dataIso

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(data)
}

function mensagemErro(error) {
  if (error instanceof ApiError) {
    if (error.status === 0) return 'Não foi possível conectar ao servidor.'
    if (error.status === 404) return 'Cliente não encontrado.'
    if (error.status === 400 || error.status === 409 || error.status === 500) return error.message || 'Não foi possível realizar esta operação.'
  }

  return error?.message || 'Ocorreu um erro inesperado.'
}

function aplicarErroDuplicidade(error, setErrosCampos, setErro) {
  const mensagem = error?.message || ''
  const temEmailDuplicado = /e[- ]?mail/i.test(mensagem)
  const temTelefoneDuplicado = /telefone/i.test(mensagem)

  setErrosCampos((atual) => ({
    ...atual,
    ...(temEmailDuplicado ? { email: 'Este e-mail já está cadastrado.' } : {}),
    ...(temTelefoneDuplicado ? { telefone: 'Este telefone já está cadastrado.' } : {}),
  }))

  if (temEmailDuplicado || temTelefoneDuplicado) {
    setErro('Não foi possível salvar o cliente. Verifique os dados informados.')
    return
  }

  if (error instanceof ApiError && error.erros && Object.keys(error.erros).length > 0) {
    setErrosCampos((atual) => ({ ...atual, ...error.erros }))
  }

  setErro(mensagemErro(error))
}

export default function AdminClientes() {
  const [clientes, setClientes] = useState([])
  const [clienteEditando, setClienteEditando] = useState(null)
  const [clienteVisualizado, setClienteVisualizado] = useState(null)
  const [formulario, setFormulario] = useState(formularioInicial)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [inativandoId, setInativandoId] = useState(null)
  const [tipoBusca, setTipoBusca] = useState('Nome')
  const [valorBusca, setValorBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('Todos')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [errosCampos, setErrosCampos] = useState({})

  function atualizarFormulario(campo, valor) {
    const proximo = { ...formulario, [campo]: campo === 'telefone' ? aplicarMascaraTelefone(valor) : valor }
    setFormulario(proximo)

    if (campo === 'email') {
      setErrosCampos((atual) => ({ ...atual, email: validarEmail(proximo.email) }))
    }

    if (campo === 'telefone') {
      setErrosCampos((atual) => ({ ...atual, telefone: validarTelefone(proximo.telefone) }))
    }
  }

  function validarFormulario(dados) {
    const erros = {
      email: validarEmail(dados.email),
      telefone: validarTelefone(dados.telefone),
    }

    const camposComErro = Object.fromEntries(
      Object.entries(erros).filter(([, mensagem]) => Boolean(mensagem)),
    )

    setErrosCampos(camposComErro)
    return Object.keys(camposComErro).length === 0
  }

  async function carregarClientes(filtros = {}) {
    setCarregando(true)
    setErro('')

    try {
      const resultado = Object.keys(filtros).length > 0
        ? await clienteService.buscarClientes(filtros)
        : await clienteService.listarClientes()

      setClientes(Array.isArray(resultado) ? resultado : [])
    } catch (error) {
      setErro(mensagemErro(error))
      setClientes([])
    } finally {
      setCarregando(false)
    }
  }

  async function pesquisarClientes(event) {
    event?.preventDefault()
    const valor = valorBusca.trim()

    if (!valor) {
      await carregarClientes()
      return
    }

    try {
      setCarregando(true)
      setErro('')

      let resultado = []
      if (tipoBusca === 'ID') {
        const cliente = await clienteService.buscarClientePorId(Number(valor))
        resultado = cliente ? [cliente] : []
      } else if (tipoBusca === 'Nome') {
        resultado = await clienteService.buscarClientes({ nome: valor })
      } else {
        resultado = await clienteService.buscarClientes({ email: valor })
      }

      setClientes(Array.isArray(resultado) ? resultado : [])
    } catch (error) {
      setErro(mensagemErro(error))
      setClientes([])
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    const valor = valorBusca.trim()
    if (!valor) {
      carregarClientes()
      return
    }

    const timer = setTimeout(async () => {
      try {
        setCarregando(true)
        setErro('')

        let resultado = []
        if (tipoBusca === 'ID') {
          const cliente = await clienteService.buscarClientePorId(Number(valor))
          resultado = cliente ? [cliente] : []
        } else if (tipoBusca === 'Nome') {
          resultado = await clienteService.buscarClientes({ nome: valor })
        } else {
          resultado = await clienteService.buscarClientes({ email: valor })
        }

        setClientes(Array.isArray(resultado) ? resultado : [])
      } catch (error) {
        setErro(mensagemErro(error))
        setClientes([])
      } finally {
        setCarregando(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [tipoBusca, valorBusca])

  function limparFiltros() {
    setTipoBusca('Nome')
    setValorBusca('')
    setStatusFiltro('Todos')
    carregarClientes()
  }

  useEffect(() => {
    carregarClientes()
  }, [])

  function abrirEdicao(cliente) {
    setClienteEditando(cliente)
    setFormulario({
      nome: cliente.nome || '',
      email: cliente.email || '',
      telefone: cliente.telefone || '',
    })
    setErrosCampos({})
    setErro('')
    setSucesso('')
  }

  async function salvarEdicao(event) {
    event.preventDefault()
    if (salvando) return

    const payload = {
      nome: formulario.nome.trim(),
      email: formulario.email.trim(),
      telefone: formulario.telefone.trim(),
    }

    if (!payload.nome) {
      setErro('Preencha o nome do cliente.')
      return
    }

    if (!validarFormulario(payload)) {
      setErro('Corrija os campos inválidos antes de salvar.')
      return
    }

    setSalvando(true)
    setErro('')
    setSucesso('')

    try {
      const atualizado = await clienteService.atualizarCliente(clienteEditando.id, payload)
      setClientes((atuais) => atuais.map((cliente) => (cliente.id === clienteEditando.id ? { ...cliente, ...atualizado } : cliente)))
      setClienteEditando(null)
      setFormulario(formularioInicial)
      setErrosCampos({})
      setSucesso('Cliente atualizado com sucesso.')
    } catch (error) {
      aplicarErroDuplicidade(error, setErrosCampos, setErro)
    } finally {
      setSalvando(false)
    }
  }

  async function inativar(cliente) {
    if (salvando || inativandoId || !window.confirm(`Inativar o cliente ${cliente.nome}?`)) return

    setInativandoId(cliente.id)
    setErro('')
    setSucesso('')

    try {
      await clienteService.inativarCliente(cliente.id)
      setClientes((atuais) => atuais.map((item) => (item.id === cliente.id ? { ...item, ativo: false } : item)))
      setSucesso('Cliente inativado com sucesso.')
    } catch (error) {
      setErro(mensagemErro(error))
    } finally {
      setInativandoId(null)
    }
  }

  const clientesFiltrados = clientes.filter((cliente) => {
    const status = cliente.ativo ? 'Ativo' : 'Inativo'
    if (statusFiltro !== 'Todos' && status !== statusFiltro) return false
    return true
  })

  const placeholder = {
    ID: 'Digite o ID do cliente',
    Nome: 'Digite o nome do cliente',
    'E-mail': 'Digite o e-mail do cliente',
  }[tipoBusca]

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <div style={{ padding: '28px 32px' }}>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800 }}>Clientes</h1>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>{clientes.length} clientes cadastrados</p>
          </div>

          {(erro || sucesso) && (
            <div role="alert" style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 8, background: erro ? '#FEE2E2' : '#D1FAE5', color: erro ? '#991B1B' : '#065F46', fontSize: 14 }}>
              {erro || sucesso}
            </div>
          )}

          <form onSubmit={pesquisarClientes} className="card" style={{ padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <select value={tipoBusca} onChange={(event) => setTipoBusca(event.target.value)} className="input-field" style={{ width: 140, minWidth: 140, flex: '0 0 140px' }}>
              <option>ID</option>
              <option>Nome</option>
              <option>E-mail</option>
            </select>

            <input
              value={valorBusca}
              onChange={(event) => setValorBusca(event.target.value)}
              placeholder={placeholder}
              className="input-field"
              style={{ flex: '1 1 220px', minWidth: 160 }}
            />

            <button type="submit" className="btn-primary" disabled={carregando || salvando}>
              Buscar
            </button>

            <button type="button" className="btn-secondary" onClick={limparFiltros} disabled={carregando || salvando}>
              Limpar filtros
            </button>

            {['Todos', 'Ativo', 'Inativo'].map((status) => (
              <button key={status} type="button" onClick={() => setStatusFiltro(status)} style={{ padding: '7px 16px', borderRadius: 24, border: `1.5px solid ${statusFiltro === status ? 'var(--primary)' : '#E5E7EB'}`, background: statusFiltro === status ? 'var(--primary)' : '#fff', color: statusFiltro === status ? '#fff' : 'var(--text)', fontSize: 13, cursor: 'pointer' }}>
                {status}
              </button>
            ))}
          </form>

          <div className="card" style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>E-mail</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {carregando && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Carregando clientes...</td>
                  </tr>
                )}

                {!carregando && clientesFiltrados.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum cliente encontrado.</td>
                  </tr>
                )}

                {!carregando && clientesFiltrados.map((cliente) => (
                  <tr key={cliente.id}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong>{cliente.nome}</strong>
                        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{cliente.telefone || 'Sem telefone'}</span>
                      </div>
                    </td>
                    <td>{cliente.email}</td>
                    <td>
                      <span className={`badge ${cliente.ativo ? 'badge-green' : 'badge-gray'}`}>{cliente.ativo ? 'Ativo' : 'Inativo'}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button className="btn-secondary" onClick={() => setClienteVisualizado(cliente)} style={{ padding: '5px 10px', fontSize: 12 }}>
                          Ver
                        </button>
                        <button className="btn-secondary" onClick={() => abrirEdicao(cliente)} style={{ padding: '5px 10px', fontSize: 12 }}>
                          Editar
                        </button>
                        {cliente.ativo && (
                          <button className="btn-danger" disabled={inativandoId === cliente.id || salvando} onClick={() => inativar(cliente)} style={{ padding: '5px 10px', fontSize: 12 }}>
                            {inativandoId === cliente.id ? 'Inativando...' : 'Inativar'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {clienteEditando && (
            <div className="card" style={{ padding: 20, marginTop: 20 }}>
              <h2 style={{ margin: '0 0 16px', fontSize: 17 }}>Editar cliente</h2>
              <form onSubmit={salvarEdicao} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                {['nome', 'email', 'telefone'].map((campo) => (
                  <label key={campo} className="label" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {campo === 'nome' ? 'Nome' : campo === 'email' ? 'E-mail' : 'Telefone'}
                    <input
                      className="input-field"
                      value={formulario[campo]}
                      onChange={(event) => atualizarFormulario(campo, event.target.value)}
                      autoComplete={campo === 'email' ? 'email' : 'off'}
                      style={{ borderColor: errosCampos[campo] ? '#DC2626' : undefined }}
                    />
                    {errosCampos[campo] && (
                      <span style={{ color: '#DC2626', fontSize: 12 }}>{errosCampos[campo]}</span>
                    )}
                  </label>
                ))}

                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="btn-primary" disabled={salvando}>
                    {salvando ? 'Salvando...' : 'Salvar alterações'}
                  </button>
                  <button type="button" className="btn-ghost" onClick={() => setClienteEditando(null)} disabled={salvando}>
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          {clienteVisualizado && (
            <div role="dialog" aria-modal="true" className="card" style={{ position: 'fixed', inset: 20, maxWidth: 460, height: 'fit-content', margin: 'auto', padding: 24, zIndex: 200, boxShadow: 'var(--shadow-lg)' }}>
              <h2 style={{ margin: '0 0 16px', fontSize: 18 }}>Dados do cliente</h2>
              <p><strong>Nome:</strong> {clienteVisualizado.nome}</p>
              <p><strong>E-mail:</strong> {clienteVisualizado.email}</p>
              <p><strong>Telefone:</strong> {clienteVisualizado.telefone || '-'}</p>
              <p><strong>Data de cadastro:</strong> {formatarData(clienteVisualizado.dataCadastro)}</p>
              <p><strong>Status:</strong> {clienteVisualizado.ativo ? 'Ativo' : 'Inativo'}</p>
              <button className="btn-secondary" onClick={() => setClienteVisualizado(null)}>Fechar</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
