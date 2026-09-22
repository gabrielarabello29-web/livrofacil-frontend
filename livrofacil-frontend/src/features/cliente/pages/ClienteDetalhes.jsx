import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import ClienteSidebar from '../../components/ClienteSidebar'
import { clienteService } from '../../services/clienteService'
import { enderecoService } from '../../services/enderecoService'
import { formaPagamentoService } from '../../services/formaPagamentoService'

const bandeirasCartao = {
  VISA: 'Visa',
  MASTERCARD: 'Mastercard',
  ELO: 'Elo',
  AMEX: 'American Express',
  HIPERCARD: 'Hipercard',
}

const bandeirasCartaoValidas = Object.keys(bandeirasCartao)
const tiposCartao = {
  CREDITO: 'Cartão de crédito',
  DEBITO: 'Cartão de débito',
}
const tiposCartaoValidos = Object.keys(tiposCartao)
function validarNumeroEndereco(numero) {
  const valor = String(numero || '').trim()
  if (!valor) return 'Informe o número.'
  if (!/^(?:\d+[A-Za-z]?|S\/N)$/i.test(valor)) return 'O número deve ser como 100, 100A ou S/N.'
  return ''
}

function validarEnderecoForm(dados) {
  const errors = {}

  if (!dados.tipoEndereco || !dados.tipoEndereco.trim()) {
    errors.tipoEndereco = 'Selecione o tipo de endereço.'
  }

  if (!dados.logradouro || !dados.logradouro.trim()) {
    errors.logradouro = 'Informe o logradouro.'
  } else if (dados.logradouro.trim().length > 150) {
    errors.logradouro = 'O logradouro deve ter no máximo 150 caracteres.'
  }

  const numeroError = validarNumeroEndereco(dados.numero)
  if (numeroError) errors.numero = numeroError

  if (dados.complemento && dados.complemento.trim().length > 100) {
    errors.complemento = 'O complemento deve ter no máximo 100 caracteres.'
  }

  if (!dados.bairro || !dados.bairro.trim()) {
    errors.bairro = 'Informe o bairro.'
  } else if (dados.bairro.trim().length > 100) {
    errors.bairro = 'O bairro deve ter no máximo 100 caracteres.'
  }

  if (!dados.cidade || !dados.cidade.trim()) {
    errors.cidade = 'Informe a cidade.'
  } else if (dados.cidade.trim().length > 100) {
    errors.cidade = 'A cidade deve ter no máximo 100 caracteres.'
  }

  if (!dados.estado || !/^[A-Z]{2}$/.test(String(dados.estado || '').trim())) {
    errors.estado = 'O estado deve possuir duas letras maiúsculas.'
  }

  if (!dados.cep || !/^\d{5}-\d{3}$/.test(String(dados.cep || '').trim())) {
    errors.cep = 'O CEP deve seguir o formato 00000-000.'
  }

  return errors
}

function validarNumeroCartao(numeroCartao) {
  const digitos = String(numeroCartao || '').replace(/\D/g, '')
  if (!digitos) return 'Informe o número do cartão.'
  if (digitos.length !== 16) return 'O número do cartão deve possuir exatamente 16 dígitos.'
  return ''
}

function mascararCpf(valor) {
  const digitos = String(valor || '').replace(/\D/g, '').slice(0, 11)
  if (digitos.length <= 3) return digitos
  if (digitos.length <= 6) return `${digitos.slice(0, 3)}.${digitos.slice(3)}`
  if (digitos.length <= 9) return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6)}`
  return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}`
}

function validarValidade(validade) {
  if (!/^\d{2}\/\d{2}$/.test(String(validade || '').trim())) return 'A validade deve seguir o formato MM/AA.'
  const mes = Number(validade.slice(0, 2))
  return mes >= 1 && mes <= 12 ? '' : 'A validade deve conter um mês entre 01 e 12.'
}

function validarFormaPagamentoForm(dados) {
  const errors = {}

  if (!dados.nomeTitular || !dados.nomeTitular.trim()) {
    errors.nomeTitular = 'Informe o nome do titular.'
  } else if (dados.nomeTitular.trim().length > 100) {
    errors.nomeTitular = 'O nome do titular deve ter no máximo 100 caracteres.'
  }

  const numeroError = validarNumeroCartao(dados.numeroCartao)
  if (numeroError) errors.numeroCartao = numeroError

  const validadeError = validarValidade(dados.validade)
  if (validadeError) errors.validade = validadeError

  if (!dados.bandeira || !bandeirasCartaoValidas.includes(dados.bandeira)) {
    errors.bandeira = 'Selecione a bandeira do cartão.'
  }

  if (!dados.tipoCartao || !tiposCartaoValidos.includes(dados.tipoCartao)) {
    errors.tipoCartao = 'Selecione o tipo do cartão.'
  }

  return errors
}

function mascararNumeroCartao(valor) {
  const digitos = String(valor || '').replace(/\D/g, '').slice(0, 16)
  return digitos.replace(/(\d{4})(?=\d)/g, '$1 ').trim()
}

function mascararValidade(valor) {
  const digitos = String(valor || '').replace(/\D/g, '').slice(0, 4)
  return digitos.length > 2 ? `${digitos.slice(0, 2)}/${digitos.slice(2)}` : digitos
}

function obterErrosBackend(error) {
  const erros = error?.details?.erros || error?.erros || {}
  const mapa = {}

  Object.entries(erros).forEach(([campo, mensagem]) => {
    if (typeof mensagem === 'string' && mensagem.trim()) {
      mapa[campo] = mensagem
    }
  })

  return mapa
}

const vazioEndereco = {
  tipoEndereco: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  cep: '',
  principal: false,
}

const vazioFormaPagamento = {
  nomeTitular: '',
  numeroCartao: '',
  validade: '',
  bandeira: 'VISA',
  tipoCartao: 'CREDITO',
  preferencial: false,
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

function formatarDataNascimento(dataIso) {
  if (!dataIso) return '—'
  const partes = String(dataIso).slice(0, 10).split('-')
  return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : dataIso
}

function mascararCep(valor) {
  const somenteDigitos = (valor || '').replace(/\D/g, '').slice(0, 8)
  if (!somenteDigitos) return ''
  if (somenteDigitos.length <= 5) return somenteDigitos
  return `${somenteDigitos.slice(0, 5)}-${somenteDigitos.slice(5)}`
}

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
  if (!telefone || !telefone.trim()) return 'Informe um telefone válido.'
  return /^\(\d{2}\)\s?\d{4,5}-\d{4}$/.test(telefone.trim()) ? '' : 'Informe um telefone válido.'
}

function validarCep(cep) {
  if (!cep || !cep.trim()) return 'Informe o CEP no formato 00000-000.'
  return /^\d{5}-?\d{3}$/.test(cep.trim()) ? '' : 'Informe o CEP no formato 00000-000.'
}

export default function ClienteDetalhes() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const secao = searchParams.get('secao')
  const mostrarPerfil = !secao || secao === 'perfil'
  const mostrarEnderecos = !secao || secao === 'enderecos'
  const mostrarCartoes = !secao || secao === 'cartoes'
  const [cliente, setCliente] = useState(null)
  const [enderecos, setEnderecos] = useState([])
  const [formasPagamento, setFormasPagamento] = useState([])
  const [loadingCliente, setLoadingCliente] = useState(true)
  const [loadingEnderecos, setLoadingEnderecos] = useState(true)
  const [loadingPagamentos, setLoadingPagamentos] = useState(true)
  const [erroCliente, setErroCliente] = useState('')
  const [erroEnderecos, setErroEnderecos] = useState('')
  const [erroPagamentos, setErroPagamentos] = useState('')
  const [editandoCliente, setEditandoCliente] = useState(false)
  const [clienteForm, setClienteForm] = useState({ nome: '', email: '', cpf: '', telefone: '', dataNascimento: '', genero: '' })
  const [clienteErros, setClienteErros] = useState({})
  const [salvandoCliente, setSalvandoCliente] = useState(false)
  const [enderecoEditandoId, setEnderecoEditandoId] = useState(null)
  const [enderecoFormAberto, setEnderecoFormAberto] = useState(false)
  const [enderecoForm, setEnderecoForm] = useState(vazioEndereco)
  const [enderecoErros, setEnderecoErros] = useState({})
  const [salvandoEndereco, setSalvandoEndereco] = useState(false)
  const [formaEditandoId, setFormaEditandoId] = useState(null)
  const [formaFormAberto, setFormaFormAberto] = useState(false)
  const [formaForm, setFormaForm] = useState(vazioFormaPagamento)
  const [formaErros, setFormaErros] = useState({})
  const [salvandoForma, setSalvandoForma] = useState(false)
  const [formaAcaoId, setFormaAcaoId] = useState(null)

  const clienteId = Number(id)

  const clienteLabel = useMemo(() => cliente ? cliente.nome : 'Cliente', [cliente])

  async function carregarCliente() {
    setLoadingCliente(true)
    setErroCliente('')
    try {
      const dados = await clienteService.buscarClientePorId(clienteId)
      if (!dados?.id || Number(dados.id) !== clienteId) {
        throw new Error('O cliente retornado não corresponde ao cliente selecionado.')
      }
      setCliente(dados)
      setClienteForm({
        nome: dados.nome || '',
        email: dados.email || '',
        cpf: dados.cpf || '',
        telefone: dados.telefone || '',
        dataNascimento: dados.dataNascimento || '',
        genero: dados.genero || '',
      })
    } catch (error) {
      setErroCliente(error?.message || 'Cliente não encontrado.')
    } finally {
      setLoadingCliente(false)
    }
  }

  async function carregarEnderecos() {
    setLoadingEnderecos(true)
    setErroEnderecos('')
    try {
      const dados = await enderecoService.listarEnderecos(clienteId)
      const registros = Array.isArray(dados) ? dados : []
      const invalidos = registros.filter((item) => item.clienteId != null && Number(item.clienteId) !== clienteId)
      if (invalidos.length > 0) {
        setErroEnderecos('Este registro não pertence ao cliente selecionado.')
      }
      setEnderecos(registros.filter((item) => item.clienteId == null || Number(item.clienteId) === clienteId))
    } catch (error) {
      setErroEnderecos(error?.message || 'Não foi possível carregar os endereços.')
      setEnderecos([])
    } finally {
      setLoadingEnderecos(false)
    }
  }

  async function carregarFormasPagamento() {
    setLoadingPagamentos(true)
    setErroPagamentos('')
    try {
      const dados = await formaPagamentoService.listarFormasPagamento(clienteId)
      const registros = Array.isArray(dados) ? dados : []
      const invalidos = registros.filter((item) => item.clienteId != null && Number(item.clienteId) !== clienteId)
      if (invalidos.length > 0) {
        setErroPagamentos('Este registro não pertence ao cliente selecionado.')
      }
      setFormasPagamento(registros.filter((item) => item.clienteId == null || Number(item.clienteId) === clienteId))
    } catch (error) {
      setErroPagamentos(error?.message || 'Não foi possível carregar as formas de pagamento.')
      setFormasPagamento([])
    } finally {
      setLoadingPagamentos(false)
    }
  }

  useEffect(() => {
    if (!Number.isNaN(clienteId)) {
      carregarCliente()
      carregarEnderecos()
      carregarFormasPagamento()
    }
  }, [clienteId])

  function atualizarClienteForm(campo, valor) {
    const proximo = { ...clienteForm, [campo]: campo === 'telefone' ? aplicarMascaraTelefone(valor) : valor }
    setClienteForm(proximo)
    if (campo === 'email') setClienteErros((atual) => ({ ...atual, email: validarEmail(proximo.email) }))
    if (campo === 'telefone') setClienteErros((atual) => ({ ...atual, telefone: validarTelefone(proximo.telefone) }))
  }

  async function salvarCliente(event) {
    event.preventDefault()
    if (salvandoCliente) return

    const payload = {
      nome: clienteForm.nome.trim(),
      email: clienteForm.email.trim(),
      cpf: String(clienteForm.cpf || '').replace(/\D/g, ''),
      telefone: clienteForm.telefone.trim(),
      dataNascimento: clienteForm.dataNascimento,
      genero: clienteForm.genero,
    }
    const erros = {
      email: validarEmail(payload.email),
      telefone: validarTelefone(payload.telefone),
      dataNascimento: payload.dataNascimento && payload.dataNascimento > new Date().toISOString().slice(0, 10) ? 'A data de nascimento não pode ser futura.' : '',
    }
    const camposComErro = Object.fromEntries(Object.entries(erros).filter(([, valor]) => Boolean(valor)))
    setClienteErros(camposComErro)
    if (Object.keys(camposComErro).length > 0) return

    setSalvandoCliente(true)
    try {
      const atualizado = await clienteService.atualizarCliente(clienteId, payload)
      setCliente((atual) => ({ ...atual, ...atualizado }))
      setEditandoCliente(false)
    } catch (error) {
      const mensagem = error?.message || 'Não foi possível salvar o cliente. Verifique os dados informados.'
      if (/e[- ]?mail/i.test(mensagem)) {
        setClienteErros({ email: 'Este e-mail já está cadastrado.' })
      } else if (/telefone/i.test(mensagem)) {
        setClienteErros({ telefone: 'Este telefone já está cadastrado.' })
      } else {
        setClienteErros({ geral: mensagem })
      }
    } finally {
      setSalvandoCliente(false)
    }
  }

  function abrirNovoEndereco() {
    setEnderecoEditandoId(null)
    setEnderecoFormAberto(true)
    setEnderecoForm(vazioEndereco)
    setEnderecoErros({})
  }

  function abrirEditarEndereco(endereco) {
    if (endereco.clienteId != null && Number(endereco.clienteId) !== clienteId) {
      setErroEnderecos('Este registro não pertence ao cliente selecionado.')
      return
    }
    setEnderecoEditandoId(endereco.id)
    setEnderecoFormAberto(true)
    setEnderecoForm({
      tipoEndereco: endereco.tipoEndereco || '',
      logradouro: endereco.logradouro || '',
      numero: endereco.numero || '',
      complemento: endereco.complemento || '',
      bairro: endereco.bairro || '',
      cidade: endereco.cidade || '',
      estado: endereco.estado || '',
      cep: endereco.cep || '',
      principal: Boolean(endereco.principal),
    })
    setEnderecoErros({})
  }

  async function salvarEndereco(event) {
    event.preventDefault()
    if (salvandoEndereco) return

    const estado = String(enderecoForm.estado || '').trim().toUpperCase()
    const payload = {
      tipoEndereco: String(enderecoForm.tipoEndereco || '').trim(),
      logradouro: String(enderecoForm.logradouro || '').trim(),
      numero: String(enderecoForm.numero || '').trim(),
      complemento: String(enderecoForm.complemento || '').trim(),
      bairro: String(enderecoForm.bairro || '').trim(),
      cidade: String(enderecoForm.cidade || '').trim(),
      estado,
      cep: String(enderecoForm.cep || '').trim(),
      principal: Boolean(enderecoForm.principal),
    }

    const erros = validarEnderecoForm(payload)
    setEnderecoErros(erros)
    if (Object.keys(erros).length > 0) return

    setSalvandoEndereco(true)
    try {
      if (enderecoEditandoId) {
        const atualizado = await enderecoService.atualizarEndereco(clienteId, enderecoEditandoId, payload)
        setEnderecos((atuais) => atuais.map((endereco) => endereco.id === enderecoEditandoId ? { ...endereco, ...atualizado } : endereco))
      } else {
        await enderecoService.criarEndereco(clienteId, payload)
        await carregarEnderecos()
      }
      setEnderecoEditandoId(null)
      setEnderecoFormAberto(false)
      setEnderecoForm(vazioEndereco)
      setEnderecoErros({})
    } catch (error) {
      const backendErros = obterErrosBackend(error)
      const mensagemGeral = Object.keys(backendErros).length === 0 ? (error?.message || 'Não foi possível salvar o endereço.') : ''
      setEnderecoErros({ ...backendErros, geral: mensagemGeral })
    } finally {
      setSalvandoEndereco(false)
    }
  }

  async function excluirEndereco(enderecoId) {
    if (!window.confirm('Deseja excluir este endereço?')) return
    const endereco = enderecos.find((item) => item.id === enderecoId)
    if (endereco?.clienteId != null && Number(endereco.clienteId) !== clienteId) {
      setErroEnderecos('Este registro não pertence ao cliente selecionado.')
      return
    }
    try {
      await enderecoService.excluirEndereco(clienteId, enderecoId)
      setEnderecos((atuais) => atuais.filter((endereco) => endereco.id !== enderecoId))
    } catch (error) {
      setErroEnderecos(error?.message || 'Endereço não encontrado.')
    }
  }

  async function definirEnderecoPrincipal(enderecoId) {
    const atual = enderecos.find((endereco) => endereco.id === enderecoId)
    if (!atual) return
    if (atual.clienteId != null && Number(atual.clienteId) !== clienteId) {
      setErroEnderecos('Este registro não pertence ao cliente selecionado.')
      return
    }
    try {
      await enderecoService.atualizarEndereco(clienteId, enderecoId, {
        logradouro: atual.logradouro,
        numero: atual.numero,
        complemento: atual.complemento || '',
        tipoEndereco: atual.tipoEndereco,
        bairro: atual.bairro,
        cidade: atual.cidade,
        estado: atual.estado,
        cep: atual.cep,
        principal: true,
      })
      setEnderecos((atuais) => atuais.map((endereco) => ({ ...endereco, principal: endereco.id === enderecoId })))
    } catch (error) {
      setErroEnderecos(error?.message || 'Não foi possível atualizar o endereço principal.')
    }
  }

  function abrirNovaFormaPagamento() {
    setFormaEditandoId(null)
    setFormaFormAberto(true)
    setFormaForm(vazioFormaPagamento)
    setFormaErros({})
  }

  function abrirEditarFormaPagamento(formaPagamento) {
    if (formaPagamento.clienteId != null && Number(formaPagamento.clienteId) !== clienteId) {
      setErroPagamentos('Este registro não pertence ao cliente selecionado.')
      return
    }
    setFormaEditandoId(formaPagamento.id)
    setFormaFormAberto(true)
    setFormaForm({
      nomeTitular: formaPagamento.nomeTitular || '',
      numeroCartao: '',
      validade: formaPagamento.validade || '',
      bandeira: formaPagamento.bandeira || 'VISA',
      tipoCartao: formaPagamento.tipoCartao || 'CREDITO',
      preferencial: Boolean(formaPagamento.preferencial),
    })
    setFormaErros({})
  }

  async function salvarFormaPagamento(event) {
    event.preventDefault()
    if (salvandoForma) return

    const payload = {
      nomeTitular: String(formaForm.nomeTitular || '').trim(),
      numeroCartao: String(formaForm.numeroCartao || '').replace(/\D/g, ''),
      validade: String(formaForm.validade || '').trim(),
      bandeira: String(formaForm.bandeira || '').trim(),
      tipoCartao: String(formaForm.tipoCartao || '').trim(),
      preferencial: Boolean(formaForm.preferencial),
    }

    const erros = validarFormaPagamentoForm(payload)
    setFormaErros(erros)
    if (Object.keys(erros).length > 0) return

    setSalvandoForma(true)
    try {
      if (formaEditandoId) {
        const atualizado = await formaPagamentoService.atualizarFormaPagamento(clienteId, formaEditandoId, payload)
        setFormasPagamento((atuais) => atuais.map((forma) => forma.id === formaEditandoId ? { ...forma, ...atualizado } : forma))
      } else {
        await formaPagamentoService.criarFormaPagamento(clienteId, payload)
        await carregarFormasPagamento()
      }
      setFormaEditandoId(null)
      setFormaFormAberto(false)
      setFormaForm(vazioFormaPagamento)
      setFormaErros({})
    } catch (error) {
      const backendErros = obterErrosBackend(error)
      const mensagemGeral = Object.keys(backendErros).length === 0 ? (error?.message || 'Não foi possível salvar a forma de pagamento.') : ''
      setFormaErros({ ...backendErros, geral: mensagemGeral })
    } finally {
      setSalvandoForma(false)
    }
  }

  async function inativarFormaPagamento(formaPagamentoId) {
    if (!window.confirm('Deseja inativar esta forma de pagamento?')) return
    const forma = formasPagamento.find((item) => item.id === formaPagamentoId)
    if (forma?.clienteId != null && Number(forma.clienteId) !== clienteId) {
      setErroPagamentos('Este registro não pertence ao cliente selecionado.')
      return
    }
    setFormaAcaoId(formaPagamentoId)
    try {
      await formaPagamentoService.inativarFormaPagamento(clienteId, formaPagamentoId)
      await carregarFormasPagamento()
    } catch (error) {
      setErroPagamentos(error?.message || 'Não foi possível inativar a forma de pagamento.')
    } finally {
      setFormaAcaoId(null)
    }
  }

  async function definirFormaPreferencial(formaPagamentoId) {
    const atual = formasPagamento.find((forma) => forma.id === formaPagamentoId)
    if (!atual) return
    if (atual.clienteId != null && Number(atual.clienteId) !== clienteId) {
      setErroPagamentos('Este registro não pertence ao cliente selecionado.')
      return
    }
    abrirEditarFormaPagamento(atual)
    setFormaForm((formulario) => ({ ...formulario, preferencial: true }))
    setFormaErros({ numeroCartao: 'Informe o número completo do cartão para atualizar.' })
  }

  async function reativarFormaPagamento(formaPagamentoId) {
    const forma = formasPagamento.find((item) => item.id === formaPagamentoId)
    if (!forma) return
    if (forma.clienteId != null && Number(forma.clienteId) !== clienteId) {
      setErroPagamentos('Este registro não pertence ao cliente selecionado.')
      return
    }
    setFormaAcaoId(formaPagamentoId)
    try {
      await formaPagamentoService.reativarFormaPagamento(clienteId, formaPagamentoId)
      await carregarFormasPagamento()
    } catch (error) {
      setErroPagamentos(error?.status === 404 ? 'Registro não encontrado.' : error?.message || 'Não foi possível reativar o cartão.')
    } finally {
      setFormaAcaoId(null)
    }
  }

  async function excluirFormaPagamento(formaPagamentoId) {
    if (!window.confirm('Deseja excluir definitivamente este cartão?')) return
    const forma = formasPagamento.find((item) => item.id === formaPagamentoId)
    if (!forma) return
    if (forma.clienteId != null && Number(forma.clienteId) !== clienteId) {
      setErroPagamentos('Este registro não pertence ao cliente selecionado.')
      return
    }
    setFormaAcaoId(formaPagamentoId)
    try {
      await formaPagamentoService.excluirFormaPagamento(clienteId, formaPagamentoId)
      await carregarFormasPagamento()
    } catch (error) {
      setErroPagamentos(error?.status === 404 ? 'Registro não encontrado.' : error?.message || 'Não foi possível excluir o cartão.')
    } finally {
      setFormaAcaoId(null)
    }
  }

  if (loadingCliente) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Carregando cliente...</div>
  }

  if (erroCliente) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#991B1B' }}>{erroCliente}</div>
  }

  return (
    <>
      <Header />
      <main className="page-container" style={{ paddingTop: 40, paddingBottom: 80 }}>
        <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
          <ClienteSidebar />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>Cliente</p>
                <h1 style={{ margin: '4px 0 0', fontSize: 24, fontWeight: 800 }}>{clienteLabel}</h1>
              </div>
              <Link to="/admin/clientes" className="btn-secondary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '10px 16px' }}>
                Voltar para clientes
              </Link>
            </div>

            {mostrarPerfil && <section className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Dados pessoais</h2>
                {!editandoCliente && (
                  <button className="btn-secondary" onClick={() => setEditandoCliente(true)}>Editar</button>
                )}
              </div>

              {editandoCliente ? (
                <form onSubmit={salvarCliente} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                    <div>
                      <label className="label">Nome</label>
                      <input className="input-field" value={clienteForm.nome} onChange={(event) => setClienteForm((atual) => ({ ...atual, nome: event.target.value }))} />
                    </div>
                    <div>
                      <label className="label">E-mail</label>
                      <input className="input-field" type="email" value={clienteForm.email} onChange={(event) => atualizarClienteForm('email', event.target.value)} style={{ borderColor: clienteErros.email ? '#DC2626' : undefined }} />
                      {clienteErros.email && <div style={{ color: '#DC2626', fontSize: 12, marginTop: 4 }}>{clienteErros.email}</div>}
                    </div>
                    <div>
                      <label className="label">CPF</label>
                      <input className="input-field" inputMode="numeric" maxLength={14} pattern="[0-9.\-]*" value={mascararCpf(clienteForm.cpf)} onChange={(event) => setClienteForm((atual) => ({ ...atual, cpf: mascararCpf(event.target.value) }))} />
                    </div>
                    <div>
                      <label className="label">Telefone</label>
                      <input className="input-field" value={clienteForm.telefone} onChange={(event) => atualizarClienteForm('telefone', event.target.value)} style={{ borderColor: clienteErros.telefone ? '#DC2626' : undefined }} />
                      {clienteErros.telefone && <div style={{ color: '#DC2626', fontSize: 12, marginTop: 4 }}>{clienteErros.telefone}</div>}
                    </div>
                    <div>
                      <label className="label">Data de nascimento</label>
                      <input className="input-field" type="date" max={new Date().toISOString().slice(0, 10)} value={clienteForm.dataNascimento} onChange={(event) => setClienteForm((atual) => ({ ...atual, dataNascimento: event.target.value }))} style={{ borderColor: clienteErros.dataNascimento ? '#DC2626' : undefined }} />
                      {clienteErros.dataNascimento && <div style={{ color: '#DC2626', fontSize: 12, marginTop: 4 }}>{clienteErros.dataNascimento}</div>}
                    </div>
                    <div>
                      <label className="label">Gênero</label>
                      <select className="input-field" value={clienteForm.genero} onChange={(event) => setClienteForm((atual) => ({ ...atual, genero: event.target.value }))}>
                        <option value="">Selecione</option>
                        <option value="MASCULINO">Masculino</option>
                        <option value="FEMININO">Feminino</option>
                        <option value="OUTRO">Outro</option>
                        <option value="PREFIRO_NAO_INFORMAR">Prefiro não informar</option>
                      </select>
                    </div>
                  </div>
                  {clienteErros.geral && <div style={{ color: '#991B1B', background: '#FEF2F2', padding: '10px 12px', borderRadius: 8 }}>{clienteErros.geral}</div>}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button type="submit" className="btn-primary" disabled={salvandoCliente}>{salvandoCliente ? 'Salvando...' : 'Salvar'}</button>
                    <button type="button" className="btn-secondary" onClick={() => { setEditandoCliente(false); setClienteErros({}) }}>Cancelar</button>
                  </div>
                </form>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                  <div><strong>Nome:</strong><div>{cliente.nome}</div></div>
                  <div><strong>E-mail:</strong><div>{cliente.email}</div></div>
                  <div><strong>CPF:</strong><div>{cliente.cpf || '—'}</div></div>
                  <div><strong>Telefone:</strong><div>{cliente.telefone || '—'}</div></div>
                  <div><strong>Gênero:</strong><div>{cliente.genero || '—'}</div></div>
                  <div><strong>Data de nascimento:</strong><div>{formatarDataNascimento(cliente.dataNascimento)}</div></div>
                  <div><strong>Data de cadastro:</strong><div>{formatarData(cliente.dataCadastro)}</div></div>
                  <div><strong>Status:</strong><div>{cliente.ativo ? 'Ativo' : 'Inativo'}</div></div>
                </div>
              )}
            </section>}

            {mostrarEnderecos && <section className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, gap: 12, flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Endereços</h2>
                <button className="btn-primary" onClick={abrirNovoEndereco}>+ Novo endereço</button>
              </div>

              {enderecoFormAberto ? (
                <form onSubmit={salvarEndereco} style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                    <div>
                      <label className="label">Tipo de endereço</label>
                      <input className="input-field" maxLength={50} placeholder="Ex.: Casa, trabalho, entrega" value={enderecoForm.tipoEndereco} onChange={(event) => setEnderecoForm((atual) => ({ ...atual, tipoEndereco: event.target.value }))} style={{ borderColor: enderecoErros.tipoEndereco ? '#DC2626' : undefined }} />
                      {enderecoErros.tipoEndereco && <div style={{ color: '#DC2626', fontSize: 12, marginTop: 4 }}>{enderecoErros.tipoEndereco}</div>}
                    </div>
                    <div>
                      <label className="label">Logradouro</label>
                      <input className="input-field" value={enderecoForm.logradouro} onChange={(event) => setEnderecoForm((atual) => ({ ...atual, logradouro: event.target.value }))} style={{ borderColor: enderecoErros.logradouro ? '#DC2626' : undefined }} />
                      {enderecoErros.logradouro && <div style={{ color: '#DC2626', fontSize: 12, marginTop: 4 }}>{enderecoErros.logradouro}</div>}
                    </div>
                    <div>
                      <label className="label">Número</label>
                      <input className="input-field" value={enderecoForm.numero} onChange={(event) => setEnderecoForm((atual) => ({ ...atual, numero: event.target.value }))} style={{ borderColor: enderecoErros.numero ? '#DC2626' : undefined }} />
                      {enderecoErros.numero && <div style={{ color: '#DC2626', fontSize: 12, marginTop: 4 }}>{enderecoErros.numero}</div>}
                    </div>
                    <div>
                      <label className="label">Complemento</label>
                      <input className="input-field" value={enderecoForm.complemento} onChange={(event) => setEnderecoForm((atual) => ({ ...atual, complemento: event.target.value }))} />
                    </div>
                    <div>
                      <label className="label">Bairro</label>
                      <input className="input-field" value={enderecoForm.bairro} onChange={(event) => setEnderecoForm((atual) => ({ ...atual, bairro: event.target.value }))} style={{ borderColor: enderecoErros.bairro ? '#DC2626' : undefined }} />
                      {enderecoErros.bairro && <div style={{ color: '#DC2626', fontSize: 12, marginTop: 4 }}>{enderecoErros.bairro}</div>}
                    </div>
                    <div>
                      <label className="label">Cidade</label>
                      <input className="input-field" value={enderecoForm.cidade} onChange={(event) => setEnderecoForm((atual) => ({ ...atual, cidade: event.target.value }))} style={{ borderColor: enderecoErros.cidade ? '#DC2626' : undefined }} />
                      {enderecoErros.cidade && <div style={{ color: '#DC2626', fontSize: 12, marginTop: 4 }}>{enderecoErros.cidade}</div>}
                    </div>
                    <div>
                      <label className="label">Estado</label>
                      <input className="input-field" maxLength={2} value={enderecoForm.estado} onChange={(event) => setEnderecoForm((atual) => ({ ...atual, estado: event.target.value.toUpperCase() }))} style={{ borderColor: enderecoErros.estado ? '#DC2626' : undefined }} />
                      {enderecoErros.estado && <div style={{ color: '#DC2626', fontSize: 12, marginTop: 4 }}>{enderecoErros.estado}</div>}
                    </div>
                    <div>
                      <label className="label">CEP</label>
                      <input className="input-field" value={enderecoForm.cep} onChange={(event) => setEnderecoForm((atual) => ({ ...atual, cep: mascararCep(event.target.value) }))} style={{ borderColor: enderecoErros.cep ? '#DC2626' : undefined }} />
                      {enderecoErros.cep && <div style={{ color: '#DC2626', fontSize: 12, marginTop: 4 }}>{enderecoErros.cep}</div>}
                    </div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" checked={enderecoForm.principal} onChange={(event) => setEnderecoForm((atual) => ({ ...atual, principal: event.target.checked }))} />
                    Definir como principal
                  </label>
                  {enderecoErros.geral && <div style={{ color: '#991B1B', background: '#FEF2F2', padding: '10px 12px', borderRadius: 8 }}>{enderecoErros.geral}</div>}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button type="submit" className="btn-primary" disabled={salvandoEndereco}>{salvandoEndereco ? 'Salvando...' : (enderecoEditandoId ? 'Salvar endereço' : 'Cadastrar endereço')}</button>
                    <button type="button" className="btn-secondary" onClick={() => { setEnderecoEditandoId(null); setEnderecoFormAberto(false); setEnderecoForm(vazioEndereco); setEnderecoErros({}) }}>Cancelar</button>
                  </div>
                </form>
              ) : null}

              {loadingEnderecos ? <div>Carregando endereços...</div> : erroEnderecos ? <div style={{ color: '#991B1B' }}>{erroEnderecos}</div> : enderecos.length === 0 ? <div>Nenhum endereço cadastrado.</div> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                  {enderecos.map((endereco) => (
                    <div key={endereco.id} className="card" style={{ padding: 18, borderColor: endereco.principal ? 'var(--primary)' : '#E5E7EB', borderWidth: endereco.principal ? 2 : 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <div>
                          <strong style={{ display: 'block' }}>{endereco.tipoEndereco || 'Endereço'}</strong>
                          <span style={{ display: 'block', marginTop: 4 }}>{endereco.logradouro}, {endereco.numero}</span>
                        </div>
                        {endereco.principal && <span className="badge badge-purple">Principal</span>}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                        <div>{endereco.bairro}</div>
                        <div>{endereco.cidade} / {endereco.estado}</div>
                        <div>CEP: {endereco.cep}</div>
                        {endereco.complemento && <div>Complemento: {endereco.complemento}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                        <button className="btn-secondary" onClick={() => abrirEditarEndereco(endereco)}>Editar</button>
                        {!endereco.principal && <button className="btn-ghost" onClick={() => definirEnderecoPrincipal(endereco.id)}>Principal</button>}
                        <button className="btn-danger" onClick={() => excluirEndereco(endereco.id)}>Excluir</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>}

            {mostrarCartoes && <section className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, gap: 12, flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Formas de pagamento</h2>
                <button className="btn-primary" onClick={abrirNovaFormaPagamento}>+ Nova forma</button>
              </div>

              {formaFormAberto ? (
                <form onSubmit={salvarFormaPagamento} style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                    <div>
                      <label className="label">Nome do titular</label>
                      <input className="input-field" maxLength={100} value={formaForm.nomeTitular} onChange={(event) => setFormaForm((atual) => ({ ...atual, nomeTitular: event.target.value }))} style={{ borderColor: formaErros.nomeTitular ? '#DC2626' : undefined }} />
                      {formaErros.nomeTitular && <div style={{ color: '#DC2626', fontSize: 12, marginTop: 4 }}>{formaErros.nomeTitular}</div>}
                    </div>
                    <div>
                      <label className="label">Número do cartão</label>
                      <input className="input-field" inputMode="numeric" maxLength={19} pattern="[0-9 ]*" placeholder="0000 0000 0000 0000" value={formaForm.numeroCartao} onChange={(event) => setFormaForm((atual) => ({ ...atual, numeroCartao: mascararNumeroCartao(event.target.value) }))} style={{ borderColor: formaErros.numeroCartao ? '#DC2626' : undefined }} />
                      {formaErros.numeroCartao && <div style={{ color: '#DC2626', fontSize: 12, marginTop: 4 }}>{formaErros.numeroCartao}</div>}
                    </div>
                    <div>
                      <label className="label">Validade</label>
                      <input className="input-field" inputMode="numeric" maxLength={5} placeholder="MM/AA" value={formaForm.validade} onChange={(event) => setFormaForm((atual) => ({ ...atual, validade: mascararValidade(event.target.value) }))} style={{ borderColor: formaErros.validade ? '#DC2626' : undefined }} />
                      {formaErros.validade && <div style={{ color: '#DC2626', fontSize: 12, marginTop: 4 }}>{formaErros.validade}</div>}
                    </div>
                    <div>
                      <label className="label">Bandeira</label>
                      <select className="input-field" value={formaForm.bandeira} onChange={(event) => setFormaForm((atual) => ({ ...atual, bandeira: event.target.value }))} style={{ borderColor: formaErros.bandeira ? '#DC2626' : undefined }}>
                        {bandeirasCartaoValidas.map((bandeira) => <option key={bandeira} value={bandeira}>{bandeirasCartao[bandeira]}</option>)}
                      </select>
                      {formaErros.bandeira && <div style={{ color: '#DC2626', fontSize: 12, marginTop: 4 }}>{formaErros.bandeira}</div>}
                    </div>
                    <div>
                      <label className="label">Tipo do cartão</label>
                      <select className="input-field" value={formaForm.tipoCartao} onChange={(event) => setFormaForm((atual) => ({ ...atual, tipoCartao: event.target.value }))} style={{ borderColor: formaErros.tipoCartao ? '#DC2626' : undefined }}>
                        {tiposCartaoValidos.map((tipo) => <option key={tipo} value={tipo}>{tiposCartao[tipo]}</option>)}
                      </select>
                      {formaErros.tipoCartao && <div style={{ color: '#DC2626', fontSize: 12, marginTop: 4 }}>{formaErros.tipoCartao}</div>}
                    </div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" checked={formaForm.preferencial} onChange={(event) => setFormaForm((atual) => ({ ...atual, preferencial: event.target.checked }))} />
                    Definir como preferencial
                  </label>
                  {formaErros.geral && <div style={{ color: '#991B1B', background: '#FEF2F2', padding: '10px 12px', borderRadius: 8 }}>{formaErros.geral}</div>}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button type="submit" className="btn-primary" disabled={salvandoForma}>{salvandoForma ? 'Salvando...' : (formaEditandoId ? 'Salvar cartão' : 'Cadastrar cartão')}</button>
                    <button type="button" className="btn-secondary" onClick={() => { setFormaEditandoId(null); setFormaFormAberto(false); setFormaForm(vazioFormaPagamento); setFormaErros({}) }}>Cancelar</button>
                  </div>
                </form>
              ) : null}

              {loadingPagamentos ? <div>Carregando formas de pagamento...</div> : erroPagamentos ? <div style={{ color: '#991B1B' }}>{erroPagamentos}</div> : formasPagamento.length === 0 ? <div>Nenhuma forma de pagamento cadastrada.</div> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                  {formasPagamento.map((forma) => (
                    <div key={forma.id} className="card" style={{ padding: 18, borderColor: forma.preferencial ? 'var(--primary)' : '#E5E7EB', borderWidth: forma.preferencial ? 2 : 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <strong>{bandeirasCartao[forma.bandeira] || forma.bandeira || 'Cartão'}</strong>
                        {forma.preferencial && <span className="badge badge-purple">Preferencial</span>}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                        <div>{forma.nomeTitular || 'Titular não informado'}</div>
                        <div>**** {forma.ultimosDigitos || '----'} · {tiposCartao[forma.tipoCartao] || forma.tipoCartao || 'Tipo não informado'} · Validade {forma.validade || '—'}</div>
                        <div>Status: {forma.ativo ? 'Ativa' : 'Inativa'}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                        <button className="btn-secondary" onClick={() => abrirEditarFormaPagamento(forma)}>Editar</button>
                        {forma.ativo && !forma.preferencial && <button className="btn-ghost" onClick={() => definirFormaPreferencial(forma.id)}>Preferencial</button>}
                        {forma.ativo ? <button className="btn-ghost" disabled={formaAcaoId === forma.id} onClick={() => inativarFormaPagamento(forma.id)}>{formaAcaoId === forma.id ? 'Desativando...' : 'Desativar'}</button> : <button className="btn-secondary" disabled={formaAcaoId === forma.id} onClick={() => reativarFormaPagamento(forma.id)}>{formaAcaoId === forma.id ? 'Ativando...' : 'Ativar'}</button>}
                        <button className="btn-danger" disabled={formaAcaoId === forma.id} onClick={() => excluirFormaPagamento(forma.id)}>{formaAcaoId === forma.id ? 'Excluindo...' : 'Excluir'}</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
