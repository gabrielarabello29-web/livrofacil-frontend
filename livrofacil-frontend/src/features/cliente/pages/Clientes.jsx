import { useEffect, useState } from 'react'
import AdminSidebar from '@/shared/layouts/admin/AdminSidebar'
import { ApiError } from '@/shared/api/api'
import { clienteService } from '@/features/cliente/api/clienteService'
import { listarMeusPedidos } from '@/features/checkout/api/checkoutApi'

const formularioInicial = { nome: '', email: '', cpf: '', telefone: '', dataNascimento: '', genero: '' }
const filtrosIniciais = { registro: '', nome: '', email: '', cpf: '', telefone: '', dataNascimento: '', genero: '', tipoEndereco: '', endereco: '', complemento: '', bairro: '', cidade: '', estado: '', cep: '' }
const camposBusca = [['registro', 'Nº de registro'], ['nome', 'Nome'], ['email', 'E-mail'], ['cpf', 'CPF'], ['telefone', 'Telefone'], ['dataNascimento', 'Data de nascimento'], ['genero', 'Gênero'], ['tipoEndereco', 'Tipo de endereço'], ['endereco', 'Endereço (logradouro e número)'], ['complemento', 'Complemento'], ['bairro', 'Bairro'], ['cidade', 'Cidade'], ['estado', 'Estado'], ['cep', 'CEP']]

function contaExpirada(cliente) {
  return !cliente.ativo && cliente.dataRemocaoDefinitiva && new Date(cliente.dataRemocaoDefinitiva).getTime() <= Date.now()
}

function clientesVisiveis(lista) { return lista.filter((cliente) => !contaExpirada(cliente)) }

function contaExcluida(cliente) { return !cliente.ativo && Boolean(cliente.dataExclusao) }

function diasRestantes(cliente) {
  if (!cliente.dataRemocaoDefinitiva) return null
  return Math.max(0, Math.ceil((new Date(cliente.dataRemocaoDefinitiva).getTime() - Date.now()) / 86400000))
}

function dataMaximaNascimento() {
  const hoje = new Date()
  return `${hoje.getFullYear() - 18}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`
}

function validarDataNascimento(data) {
  if (!data) return ''
  return data > dataMaximaNascimento() ? 'Você precisa ter pelo menos 18 anos.' : ''
}

const statusPedidoNomes = { EM_PROCESSAMENTO: 'Em processamento', PAGAMENTO_APROVADO: 'Pagamento aprovado', EM_SEPARACAO: 'Em separação', NA_TRANSPORTADORA: 'Na transportadora', EM_ROTA_DE_ENTREGA: 'Em rota de entrega', ENTREGUE: 'Entregue', FINALIZADO: 'Finalizado', CANCELADO: 'Cancelado' }

function textoStatusPedido(status) { return statusPedidoNomes[status] || 'Não informado' }

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

function aplicarMascaraCpf(valor) {
  const digitos = String(valor || '').replace(/\D/g, '').slice(0, 11)
  if (digitos.length <= 3) return digitos
  if (digitos.length <= 6) return `${digitos.slice(0, 3)}.${digitos.slice(3)}`
  if (digitos.length <= 9) return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6)}`
  return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}`
}

function aplicarMascaraCep(valor) {
  const digitos = String(valor || '').replace(/\D/g, '').slice(0, 8)
  return digitos.length > 5 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : digitos
}

function formatarCidade(valor) {
  return String(valor || '').replace(/\s+/g, ' ').replace(/^\s+/, '').replace(/\b\w/g, (letra) => letra.toUpperCase())
}

function normalizarBusca(campo, valor) {
  if (campo === 'registro') return String(valor || '').replace(/\D/g, '')
  if (campo === 'telefone') return aplicarMascaraTelefone(valor)
  if (campo === 'cpf') return aplicarMascaraCpf(valor)
  if (campo === 'cep') return aplicarMascaraCep(valor)
  if (campo === 'estado') return String(valor || '').replace(/[^a-z]/gi, '').slice(0, 2).toUpperCase()
  if (campo === 'cidade') return formatarCidade(valor)
  return valor
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

function nomeComRegistro(cliente) {
  const registro = Number(cliente?.numeroRegistro)
  return Number.isInteger(registro) && registro > 0 ? `#${registro} ${cliente.nome || ''}`.trim() : (cliente.nome || '')
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
  const [pedidosCliente, setPedidosCliente] = useState([])
  const [carregandoPedidos, setCarregandoPedidos] = useState(false)
  const [erroPedidos, setErroPedidos] = useState('')
  const [formulario, setFormulario] = useState(formularioInicial)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [inativandoId, setInativandoId] = useState(null)
  const [filtrosBusca, setFiltrosBusca] = useState(filtrosIniciais)
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
    if (campo === 'dataNascimento') setErrosCampos((atual) => ({ ...atual, dataNascimento: validarDataNascimento(proximo.dataNascimento) }))
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

      setClientes(clientesVisiveis(Array.isArray(resultado) ? resultado : []))
    } catch (error) {
      setErro(mensagemErro(error))
      setClientes([])
    } finally {
      setCarregando(false)
    }
  }

  async function pesquisarClientes(event) {
    event?.preventDefault()
    const filtros = Object.fromEntries(Object.entries(filtrosBusca).map(([campo, valor]) => [campo, String(valor || '').trim()]).filter(([, valor]) => valor))
    if (!Object.keys(filtros).length) {
      await carregarClientes()
      return
    }

    try {
      setCarregando(true)
      setErro('')

      const resultado = await clienteService.buscarClientes(filtros)
      setClientes(clientesVisiveis(Array.isArray(resultado) ? resultado : []))
    } catch (error) {
      setErro(mensagemErro(error))
      setClientes([])
    } finally {
      setCarregando(false)
    }
  }

  function limparFiltros() {
    setFiltrosBusca(filtrosIniciais)
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
      cpf: cliente.cpf || '',
      telefone: cliente.telefone || '',
      dataNascimento: cliente.dataNascimento || '',
      genero: cliente.genero || '',
    })
    setErrosCampos({})
    setErro('')
    setSucesso('')
  }

  async function visualizarCliente(cliente) {
    setClienteVisualizado(cliente)
    setPedidosCliente([])
    setErroPedidos('')
    setCarregandoPedidos(true)
    try {
      const resposta = await listarMeusPedidos(cliente.id)
      const lista = resposta?.data || resposta
      setPedidosCliente(Array.isArray(lista) ? lista : [])
    } catch (error) {
      setErroPedidos(error?.mensagem || error?.message || 'Não foi possível carregar as compras deste cliente.')
    } finally {
      setCarregandoPedidos(false)
    }
  }

  async function salvarEdicao(event) {
    event.preventDefault()
    if (salvando) return

    const payload = {
      nome: formulario.nome.trim(),
      email: formulario.email.trim(),
      cpf: formulario.cpf.replace(/\D/g, ''),
      telefone: formulario.telefone.trim(),
      dataNascimento: formulario.dataNascimento,
      genero: formulario.genero,
    }

    if (!payload.nome) {
      setErro('Preencha o nome do cliente.')
      return
    }

    const erroData = validarDataNascimento(payload.dataNascimento)
    if (erroData) { setErrosCampos((atual) => ({ ...atual, dataNascimento: erroData })); setErro(erroData); return }

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
      const errosBackend = error?.details?.erros || error?.erros || {}
      setErrosCampos(errosBackend)
      setErro(Object.keys(errosBackend).length ? 'Corrija os campos indicados.' : mensagemErro(error))
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
      const resposta = await clienteService.inativarCliente(cliente.id)
      setClientes((atuais) => atuais.map((item) => (item.id === cliente.id ? { ...item, ...(resposta || {}), ativo: false } : item)))
      setSucesso('Cliente inativado com sucesso.')
    } catch (error) {
      setErro(mensagemErro(error))
    } finally {
      setInativandoId(null)
    }
  }

  const clientesFiltrados = clientes.filter((cliente) => {
    const status = cliente.ativo ? 'Ativo' : contaExcluida(cliente) ? 'Conta inativa' : 'Outro bloqueio'
    if (statusFiltro !== 'Todos' && status !== statusFiltro) return false
    return true
  })

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

          <form onSubmit={pesquisarClientes} className="card admin-client-filters" style={{ padding: '16px 20px', marginBottom: 20, display: 'grid', gridTemplateColumns: 'repeat(8, minmax(0, 1fr))', gap: 12, alignItems: 'end' }}>
            {camposBusca.map(([campo, label]) => <label key={campo} className="label" style={{ display: 'flex', flexDirection: 'column', gap: 6, minHeight: 74 }}><span style={{ minHeight: 30, display: 'block' }}>{label}</span><input className="input-field" type={campo === 'dataNascimento' ? 'date' : 'text'} max={campo === 'dataNascimento' ? dataMaximaNascimento() : undefined} value={filtrosBusca[campo]} onChange={(event) => setFiltrosBusca((atual) => ({ ...atual, [campo]: normalizarBusca(campo, event.target.value) }))} /></label>)}

            <button type="submit" className="btn-primary" disabled={carregando || salvando} style={{ width: '100%',marginBottom: 6, height: 42, alignSelf: 'end', boxSizing: 'border-box' }}>
              Buscar
            </button>
            <button type="button" className="btn-secondary" onClick={limparFiltros} disabled={carregando || salvando} style={{ width: '100%', marginBottom: 6, height: 42, alignSelf: 'end', boxSizing: 'border-box' }}>
              Limpar filtros
            </button>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {['Todos', 'Ativo', 'Conta inativa', 'Outro bloqueio'].map((status) => (
                <button key={status} type="button" onClick={() => setStatusFiltro(status)} style={{ width: 180, height: 42, padding: '7px 16px', borderRadius: 24, border: `1.5px solid ${statusFiltro === status ? 'var(--primary)' : '#E5E7EB'}`, background: statusFiltro === status ? 'var(--primary)' : '#fff', color: statusFiltro === status ? '#fff' : 'var(--text)', fontSize: 13, cursor: 'pointer', boxSizing: 'border-box' }}>
                  {status}
                </button>
              ))}
            </div>
          </form>

          <div className="card" style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>E-mail</th>
                  <th>Status</th>
                  <th>Exclusão</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {carregando && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Carregando clientes...</td>
                  </tr>
                )}

                {!carregando && clientesFiltrados.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum cliente encontrado.</td>
                  </tr>
                )}

                {!carregando && clientesFiltrados.map((cliente) => (
                  <tr key={cliente.id}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong>{nomeComRegistro(cliente)}</strong>
                        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{cliente.telefone || 'Sem telefone'}</span>
                      </div>
                    </td>
                    <td>{cliente.email}</td>
                    <td><span className={`badge ${cliente.ativo ? 'badge-green' : 'badge-gray'}`}>{cliente.ativo ? 'Ativo' : contaExcluida(cliente) ? 'Conta inativa por exclusão do cliente' : 'Outro bloqueio'}</span></td>
                    <td>{contaExcluida(cliente) ? <span style={{ fontSize: 12 }}>{formatarData(cliente.dataExclusao)}<br />Remoção: {formatarData(cliente.dataRemocaoDefinitiva)}<br />{diasRestantes(cliente)} dia(s) restante(s)</span> : '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button className="btn-secondary" onClick={() => visualizarCliente(cliente)} style={{ padding: '5px 10px', fontSize: 12 }}>
                          Ver
                        </button>
                        <button className="btn-secondary" disabled={!cliente.ativo} onClick={() => abrirEdicao(cliente)} style={{ padding: '5px 10px', fontSize: 12 }}>
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
                {['nome', 'email', 'cpf', 'telefone', 'dataNascimento', 'genero'].map((campo) => (
                  <label key={campo} className="label" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {campo === 'nome' ? 'Nome' : campo === 'email' ? 'E-mail' : campo === 'cpf' ? 'CPF' : campo === 'telefone' ? 'Telefone' : campo === 'dataNascimento' ? 'Data de nascimento' : 'Gênero'}
                    <input
                      className="input-field"
                      type={campo === 'dataNascimento' ? 'date' : 'text'}
                      max={campo === 'dataNascimento' ? dataMaximaNascimento() : undefined}
                      value={formulario[campo]}
                      onChange={(event) => atualizarFormulario(campo, campo === 'cpf' ? event.target.value.replace(/\D/g, '') : event.target.value)}
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
            <div role="dialog" aria-modal="true" className="card" style={{ position: 'fixed', inset: 20, maxWidth: 760, maxHeight: 'calc(100vh - 40px)', overflowY: 'auto', height: 'fit-content', margin: 'auto', padding: 24, zIndex: 200, boxShadow: 'var(--shadow-lg)' }}>
              <h2 style={{ margin: '0 0 16px', fontSize: 18 }}>Dados do cliente</h2>
              <p><strong>Registro:</strong> {Number.isInteger(Number(clienteVisualizado.numeroRegistro)) ? `#${clienteVisualizado.numeroRegistro}` : '—'}</p>
              <p><strong>UUID:</strong> {clienteVisualizado.uuid || '—'}</p>
              <p><strong>Nome:</strong> {clienteVisualizado.nome}</p>
              <p><strong>E-mail:</strong> {clienteVisualizado.email}</p>
              <p><strong>Telefone:</strong> {clienteVisualizado.telefone || '-'}</p>
              <p><strong>CPF:</strong> {clienteVisualizado.cpf || '-'}</p>
              <p><strong>Data de nascimento:</strong> {formatarData(clienteVisualizado.dataNascimento)}</p>
              <p><strong>Gênero:</strong> {clienteVisualizado.genero || '-'}</p>
              <p><strong>Cidade:</strong> {clienteVisualizado.cidade || clienteVisualizado.endereco?.cidade || '-'}</p>
              <p><strong>Estado:</strong> {clienteVisualizado.estado || clienteVisualizado.endereco?.estado || '-'}</p>
              <p><strong>Data de cadastro:</strong> {formatarData(clienteVisualizado.dataCadastro)}</p>
              <p><strong>Status:</strong> {clienteVisualizado.ativo ? 'Ativo' : 'Inativo'}</p>
              <h3 style={{ margin: '24px 0 12px', fontSize: 16 }}>Compras realizadas</h3>
              {carregandoPedidos && <p style={{ color: 'var(--text-muted)' }}>Carregando compras...</p>}
              {erroPedidos && <p role="alert" style={{ color: '#991B1B' }}>{erroPedidos}</p>}
              {!carregandoPedidos && !erroPedidos && pedidosCliente.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Nenhuma compra encontrada para este cliente.</p>}
              {!carregandoPedidos && !erroPedidos && pedidosCliente.length > 0 && <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{pedidosCliente.map((pedido) => <div key={pedido.id} style={{ border: '1px solid #E5E7EB', borderRadius: 8, padding: 12, display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, alignItems: 'center' }}><div><strong>Pedido #{pedido.id}</strong><small style={{ display: 'block', color: 'var(--text-muted)' }}>{formatarData(pedido.criadoEm || pedido.dataCriacao || pedido.dataPedido || pedido.createdAt)}</small></div><span className="badge badge-gray">{textoStatusPedido(pedido.status)}</span><strong>R$ {Number(pedido.total || 0).toFixed(2).replace('.', ',')}</strong></div>)}</div>}
              <button className="btn-secondary" onClick={() => setClienteVisualizado(null)}>Fechar</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
