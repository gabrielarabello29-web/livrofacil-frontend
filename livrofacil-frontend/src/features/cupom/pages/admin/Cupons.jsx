import { useEffect, useState } from 'react'
import AdminSidebar from '@/shared/layouts/admin/AdminSidebar'
import Modal from '@/shared/components/Modal'
import { cupomService } from '@/features/cupom/api/cupomService'

const formPadrao = {
  codigo: '',
  tipoDesconto: 'PERCENTUAL',
  percentualDesconto: '',
  valorDesconto: '',
  dataFimVigencia: '',
  numeroUsoMaximo: '',
}

function formatarData(data) {
  if (!data) return 'Sem vigência'
  const valor = typeof data === 'string' ? data : String(data)
  const dataLocal = new Date(`${valor}T00:00:00`)
  if (Number.isNaN(dataLocal.getTime())) return valor
  return dataLocal.toLocaleDateString('pt-BR')
}

function tipoDescontoDoCupom(cupom) {
  const valor = String(cupom?.tipoDesconto || cupom?.tipo || '').trim().toUpperCase()
  if (valor) return valor
  return cupom?.percentualDesconto !== null && cupom?.percentualDesconto !== undefined ? 'PERCENTUAL' : 'FIXO'
}

function valorDescontoDoCupom(cupom) {
  const tipo = tipoDescontoDoCupom(cupom)
  const valor = tipo === 'PERCENTUAL' ? cupom?.percentualDesconto : cupom?.valorDesconto
  if (valor === null || valor === undefined || valor === '') return '—'
  if (tipo === 'PERCENTUAL') return `${Number(valor).toFixed(2).replace('.', ',')}%`
  return `R$ ${Number(valor).toFixed(2).replace('.', ',')}`
}

function cupomEstaAtivo(cupom) {
  const usoAtual = Number(cupom?.numeroUsoAtual ?? 0)
  const usoMaximo = Number(cupom?.numeroUsoMaximo ?? 0)
  const atingiuUsoMaximo = usoMaximo > 0 && usoAtual >= usoMaximo
  const expirou = Boolean(cupom?.dataFimVigencia) && new Date(`${cupom.dataFimVigencia}T00:00:00`) < new Date(new Date().setHours(0, 0, 0, 0))

  return Boolean(cupom?.ativo) && !atingiuUsoMaximo && !expirou
}

export default function AdminCupons() {
  const [cuponsCriados, setCuponsCriados] = useState([])
  const [modalAberto, setModalAberto] = useState(false)
  const [modoEdicao, setModoEdicao] = useState(false)
  const [cupomEditandoId, setCupomEditandoId] = useState(null)
  const [form, setForm] = useState(formPadrao)
  const [salvando, setSalvando] = useState(false)
  const [acaoEmAndamentoId, setAcaoEmAndamentoId] = useState(null)
  const [erro, setErro] = useState('')

  async function carregarCupons() {
    try {
      const resposta = await cupomService.listarCuponsAdmin()
      const lista = Array.isArray(resposta) ? resposta : Array.isArray(resposta?.data) ? resposta.data : []
      setCuponsCriados(lista)
    } catch (error) {
      setCuponsCriados([])
      setErro(error?.message || error?.mensagem || 'Não foi possível carregar os cupons.')
    }
  }

  useEffect(() => {
    carregarCupons()
  }, [])

  function prepararModalNovo() {
    setErro('')
    setModoEdicao(false)
    setCupomEditandoId(null)
    setForm(formPadrao)
    setModalAberto(true)
  }

  function prepararModalEdicao(cupom) {
    const tipo = tipoDescontoDoCupom(cupom)
    setErro('')
    setModoEdicao(true)
    setCupomEditandoId(cupom.id)
    setForm({
      codigo: cupom.codigo || '',
      tipoDesconto: tipo,
      percentualDesconto: tipo === 'PERCENTUAL' ? cupom.percentualDesconto ?? '' : '',
      valorDesconto: tipo === 'FIXO' ? cupom.valorDesconto ?? '' : '',
      dataFimVigencia: cupom.dataFimVigencia || '',
      numeroUsoMaximo: cupom.numeroUsoMaximo ?? '',
    })
    setModalAberto(true)
  }

  function setCampo(chave) {
    return (event) => {
      const valor = chave === 'codigo' ? event.target.value.toUpperCase() : event.target.value
      setForm((atual) => ({ ...atual, [chave]: valor }))
      setErro('')
    }
  }

  function fecharModal() {
    setModalAberto(false)
    setErro('')
    setModoEdicao(false)
    setCupomEditandoId(null)
    setForm(formPadrao)
  }

  function validarFormulario() {
    const codigo = form.codigo.trim()
    if (!codigo) throw new Error('O código do cupom é obrigatório.')
    if (!form.tipoDesconto) throw new Error('O tipo de desconto é obrigatório.')
    if (form.tipoDesconto === 'PERCENTUAL') {
      const percentual = Number(form.percentualDesconto)
      if (!Number.isFinite(percentual) || percentual < 0.01 || percentual > 100) {
        throw new Error('O percentual de desconto deve estar entre 0,01 e 100.')
      }
    }
    if (form.tipoDesconto === 'FIXO') {
      const valor = Number(form.valorDesconto)
      if (!Number.isFinite(valor) || valor <= 0) {
        throw new Error('O valor fixo do desconto deve ser maior que zero.')
      }
    }
    if (form.numeroUsoMaximo !== '' && Number(form.numeroUsoMaximo) <= 0) {
      throw new Error('O número máximo de usos deve ser maior que zero.')
    }
    if (form.dataFimVigencia) {
      const dataFim = new Date(`${form.dataFimVigencia}T00:00:00`)
      const hoje = new Date(new Date().setHours(0, 0, 0, 0))
      if (dataFim < hoje) {
        throw new Error('A data de fim de vigência deve ser igual ou posterior a hoje.')
      }
    }
  }

  async function salvarCupom(event) {
    event.preventDefault()
    setErro('')
    try {
      validarFormulario()
      const payload = {
        codigo: form.codigo.trim(),
        tipoDesconto: form.tipoDesconto,
        percentualDesconto: form.tipoDesconto === 'PERCENTUAL' && form.percentualDesconto !== '' ? Number(form.percentualDesconto) : null,
        valorDesconto: form.tipoDesconto === 'FIXO' && form.valorDesconto !== '' ? Number(form.valorDesconto) : null,
        dataFimVigencia: form.dataFimVigencia || undefined,
        numeroUsoMaximo: form.numeroUsoMaximo === '' ? undefined : Number(form.numeroUsoMaximo),
      }

      setSalvando(true)
      let resposta
      if (modoEdicao) {
        resposta = await cupomService.editarCupom(cupomEditandoId, payload)
        setCuponsCriados((atuais) =>
          atuais.map((cupom) => (cupom.id === cupomEditandoId ? { ...cupom, ...resposta } : cupom)),
        )
      } else {
        resposta = await cupomService.criarCupom(payload)
        setCuponsCriados((atuais) => [resposta, ...atuais])
      }
      await carregarCupons()
      fecharModal()
    } catch (error) {
      setErro(error?.message || error?.mensagem || 'Não foi possível salvar o cupom.')
    } finally {
      setSalvando(false)
    }
  }

  async function alternarStatus(cupom, ativar) {
    if (!cupom?.id) return
    const acao = ativar ? 'reativar' : 'inativar'
    const confirmado = window.confirm(`Deseja ${acao} o cupom ${cupom.codigo}?`)
    if (!confirmado) return

    setAcaoEmAndamentoId(cupom.id)
    setErro('')
    try {
      if (ativar) {
        await cupomService.ativarCupom(cupom.id)
      } else {
        await cupomService.inativarCupom(cupom.id)
      }
      await carregarCupons()
    } catch (error) {
      setErro(error?.message || error?.mensagem || `Não foi possível ${acao} o cupom.`)
    } finally {
      setAcaoEmAndamentoId(null)
    }
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <div style={{ padding: '28px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800 }}>Cupons</h1>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>Cupons cadastrados: {cuponsCriados.length}</p>
            </div>
            <button onClick={prepararModalNovo} className="btn-primary" style={{ padding: '10px 20px' }}>+ Novo cupom</button>
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Tipo</th>
                  <th>Valor</th>
                  <th>Vigência</th>
                  <th>Usos</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {cuponsCriados.map((cupom) => {
                  const tipo = tipoDescontoDoCupom(cupom)
                  const ativo = cupomEstaAtivo(cupom)
                  return (
                    <tr key={cupom.id}>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14, background: '#F3F4F6', padding: '3px 10px', borderRadius: 4 }}>{cupom.codigo}</span>
                      </td>
                      <td>{tipo === 'PERCENTUAL' ? 'Percentual' : 'Fixo'}</td>
                      <td>{valorDescontoDoCupom(cupom)}</td>
                      <td>{formatarData(cupom.dataFimVigencia)}</td>
                      <td>{`${Number(cupom.numeroUsoAtual ?? 0)}/${cupom.numeroUsoMaximo ?? '∞'}`}</td>
                      <td><span className={`badge ${ativo ? 'badge-green' : 'badge-gray'}`}>{ativo ? 'Ativo' : 'Inativo'}</span></td>
                      <td style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button type="button" className="btn-secondary" onClick={() => prepararModalEdicao(cupom)} disabled={salvando}>Editar</button>
                        {ativo ? (
                          <button type="button" className="btn-danger" onClick={() => alternarStatus(cupom, false)} disabled={acaoEmAndamentoId === cupom.id}>{acaoEmAndamentoId === cupom.id ? 'Aguarde...' : 'Inativar'}</button>
                        ) : (
                          <button type="button" className="btn-secondary" onClick={() => alternarStatus(cupom, true)} disabled={acaoEmAndamentoId === cupom.id}>{acaoEmAndamentoId === cupom.id ? 'Aguarde...' : 'Reativar'}</button>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {cuponsCriados.length === 0 && (
                  <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>Nenhum cupom cadastrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal isOpen={modalAberto} onClose={() => !salvando && fecharModal()} title={modoEdicao ? 'Editar cupom' : 'Novo cupom'}>
        <form onSubmit={salvarCupom} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="label" htmlFor="cupom-codigo">Código</label>
            <input id="cupom-codigo" data-testid="cupom-codigo" className="input-field" value={form.codigo} onChange={setCampo('codigo')} placeholder="EX: DESCONTO20" minLength={3} required />
          </div>

          <div>
            <label className="label" htmlFor="cupom-tipo-desconto">Tipo de desconto</label>
            <select id="cupom-tipo-desconto" data-testid="cupom-tipo-desconto" className="input-field" value={form.tipoDesconto} onChange={setCampo('tipoDesconto')}>
              <option value="PERCENTUAL">Percentual</option>
              <option value="FIXO">Fixo</option>
            </select>
          </div>

          {form.tipoDesconto === 'PERCENTUAL' && (
            <div>
              <label className="label" htmlFor="cupom-percentual">Percentual de desconto</label>
              <input id="cupom-percentual" data-testid="cupom-percentual" className="input-field" type="number" min="0.01" max="100" step="0.01" value={form.percentualDesconto} onChange={setCampo('percentualDesconto')} placeholder="10,00" required />
            </div>
          )}

          {form.tipoDesconto === 'FIXO' && (
            <div>
              <label className="label" htmlFor="cupom-valor-fixo">Valor de desconto</label>
              <input id="cupom-valor-fixo" data-testid="cupom-valor-fixo" className="input-field" type="number" min="0.01" step="0.01" value={form.valorDesconto} onChange={setCampo('valorDesconto')} placeholder="20,00" required />
            </div>
          )}

          <div>
            <label className="label" htmlFor="cupom-data-fim-vigencia">Data de fim de vigência</label>
            <input id="cupom-data-fim-vigencia" data-testid="cupom-data-fim-vigencia" className="input-field" type="date" value={form.dataFimVigencia} onChange={setCampo('dataFimVigencia')} />
          </div>

          <div>
            <label className="label" htmlFor="cupom-numero-uso-maximo">Número máximo de usos</label>
            <input id="cupom-numero-uso-maximo" data-testid="cupom-numero-uso-maximo" className="input-field" type="number" min="1" step="1" value={form.numeroUsoMaximo} onChange={setCampo('numeroUsoMaximo')} placeholder="50" />
          </div>

          {erro && <div className="checkout-error" role="alert">{erro}</div>}

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="button" onClick={fecharModal} className="btn-secondary" style={{ flex: 1 }} disabled={salvando}>Cancelar</button>
            <button type="submit" data-testid="criar-cupom" className="btn-primary" style={{ flex: 1 }} disabled={salvando || !form.codigo.trim()}>{salvando ? 'Salvando...' : modoEdicao ? 'Salvar cupom' : 'Criar cupom'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
