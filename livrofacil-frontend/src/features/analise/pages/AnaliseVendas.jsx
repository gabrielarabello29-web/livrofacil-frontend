import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/features/auth/context/AuthContext'
import AdminSidebar from '@/shared/layouts/admin/AdminSidebar'
import { listarCategorias } from '@/features/livros/api/livrosApi'
import { analiseService } from '../api/analiseService'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const CORES_CATEGORIA = ['#7C3AED', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#14B8A6', '#F97316']
const FORMATO_DATA = /^\d{4}-\d{2}-\d{2}$/
const UUID_VALIDO = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(valor ?? 0))
}

function formatarMes(mes) {
  const correspondencia = /^(\d{4})-(\d{2})$/.exec(String(mes || ''))
  if (!correspondencia) return String(mes || '')
  return new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(Number(correspondencia[1]), Number(correspondencia[2]) - 1, 1)))
    .replace('.', '')
}

function calcularPeriodoPadrao() {
  const dataFim = new Date()
  const dataInicio = new Date(dataFim.getFullYear(), dataFim.getMonth() - 2, 1)
  const formatar = (data) => {
    const ano = data.getFullYear()
    const mes = String(data.getMonth() + 1).padStart(2, '0')
    const dia = String(data.getDate()).padStart(2, '0')
    return `${ano}-${mes}-${dia}`
  }
  return { dataInicio: formatar(dataInicio), dataFim: formatar(dataFim) }
}

function extrairCategorias(resposta) {
  if (Array.isArray(resposta)) return resposta
  if (Array.isArray(resposta?.data)) return resposta.data
  if (Array.isArray(resposta?.content)) return resposta.content
  return []
}

function erroLegivel(erro) {
  return erro?.mensagem || erro?.message || 'Não foi possível carregar o relatório. Tente novamente.'
}

function obterAdminId(usuario) {
  const candidato = usuario?.uuid || (typeof usuario?.id === 'string' ? usuario.id : '')
  return UUID_VALIDO.test(candidato) ? candidato : null
}

function obterSeries(relatorio) {
  return Array.isArray(relatorio?.series) ? relatorio.series : []
}

function obterMeses(relatorio) {
  return Array.isArray(relatorio?.meses) ? relatorio.meses : []
}

function valorDaSerie(serie, indice) {
  const valor = Number(serie?.valores?.[indice] ?? 0)
  return Number.isFinite(valor) ? valor : 0
}

function validarPeriodo(dataInicio, dataFim) {
  if (!dataInicio || !dataFim) return 'Informe as datas inicial e final.'
  if (!FORMATO_DATA.test(dataInicio) || !FORMATO_DATA.test(dataFim)) return 'Informe as datas no formato válido.'
  const dataValida = (valor) => {
    const data = new Date(`${valor}T00:00:00Z`)
    return Number.isFinite(data.getTime()) && data.toISOString().slice(0, 10) === valor
  }
  const dataInicioValida = dataValida(dataInicio)
  const dataFimValida = dataValida(dataFim)
  if (!dataInicioValida || !dataFimValida) return 'Informe datas válidas no calendário.'
  if (dataInicio > dataFim) return 'A data inicial não pode ser posterior à data final.'
  return ''
}

export default function AdminAnalise() {
  const { usuario } = useAuth()
  const adminId = obterAdminId(usuario)
  const periodoPadrao = useMemo(() => calcularPeriodoPadrao(), [])
  const [dataInicio, setDataInicio] = useState(periodoPadrao.dataInicio)
  const [dataFim, setDataFim] = useState(periodoPadrao.dataFim)
  const [categorias, setCategorias] = useState([])
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState([])
  const [filtrosAplicados, setFiltrosAplicados] = useState(() => ({
    dataInicio: periodoPadrao.dataInicio,
    dataFim: periodoPadrao.dataFim,
    categorias: [],
  }))
  const [relatorio, setRelatorio] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [carregandoCategorias, setCarregandoCategorias] = useState(true)
  const [erroCategorias, setErroCategorias] = useState('')
  const [erro, setErro] = useState('')
  const [erroFiltros, setErroFiltros] = useState('')
  const [versaoConsulta, setVersaoConsulta] = useState(0)
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 768 : false))

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    let ativo = true
    setCarregandoCategorias(true)
    setErroCategorias('')

    listarCategorias()
      .then((resposta) => {
        if (ativo) setCategorias(extrairCategorias(resposta))
      })
      .catch((error) => {
        if (ativo) {
          setCategorias([])
          setErroCategorias(erroLegivel(error))
        }
      })
      .finally(() => {
        if (ativo) setCarregandoCategorias(false)
      })

    return () => { ativo = false }
  }, [])

  useEffect(() => {
    let ativo = true
    setRelatorio(null)
    setErro('')

    const erroPeriodo = validarPeriodo(filtrosAplicados.dataInicio, filtrosAplicados.dataFim)
    if (erroPeriodo) {
      setErro(erroPeriodo)
      setCarregando(false)
      return () => { ativo = false }
    }

    if (!adminId) {
      setErro('Não foi possível identificar o UUID do administrador conectado.')
      setCarregando(false)
      return () => { ativo = false }
    }

    setCarregando(true)
    const parametros = {
      dataInicio: filtrosAplicados.dataInicio,
      dataFim: filtrosAplicados.dataFim,
      adminId,
    }
    if (filtrosAplicados.categorias.length > 0) parametros.categorias = filtrosAplicados.categorias

    analiseService.buscarVendasPorCategoria(parametros)
      .then((resposta) => {
        if (ativo) setRelatorio(resposta || { meses: [], series: [] })
      })
      .catch((error) => {
        if (ativo) {
          setRelatorio(null)
          setErro(erroLegivel(error))
        }
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => { ativo = false }
  }, [adminId, filtrosAplicados, versaoConsulta])

  function alternarCategoria(categoriaId) {
    const id = Number(categoriaId)
    if (!Number.isInteger(id) || id <= 0) return
    setCategoriasSelecionadas((anteriores) => anteriores.includes(id)
      ? anteriores.filter((selecionada) => selecionada !== id)
      : [...anteriores, id])
    setErroFiltros('')
  }

  function aplicarFiltros(event) {
    event.preventDefault()
    const erroPeriodo = validarPeriodo(dataInicio, dataFim)
    if (erroPeriodo) {
      setErroFiltros(erroPeriodo)
      return
    }
    if (!adminId) {
      setErroFiltros('Não foi possível identificar o UUID do administrador conectado.')
      return
    }

    setErroFiltros('')
    setRelatorio(null)
    setErro('')
    setCarregando(true)
    setFiltrosAplicados({
      dataInicio,
      dataFim,
      categorias: [...categoriasSelecionadas],
    })
  }

  function tentarNovamente() {
    setRelatorio(null)
    setErro('')
    setCarregando(true)
    setVersaoConsulta((versao) => versao + 1)
  }

  const meses = obterMeses(relatorio)
  const series = obterSeries(relatorio)
  const chartData = useMemo(() => meses.map((mes, indice) => {
    const linha = { mes, mesLabel: formatarMes(mes) }
    series.forEach((serie, serieIndex) => {
      const nome = serie?.categoriaNome || `Categoria ${serieIndex + 1}`
      linha[nome] = valorDaSerie(serie, indice)
    })
    return linha
  }), [meses, series])
  const semEstruturaDeDados = meses.length === 0 || series.length === 0
  const semVendas = !carregando && !erro && !semEstruturaDeDados &&
    !series.some((serie) => meses.some((_, indice) => valorDaSerie(serie, indice) !== 0))
  const resumoTexto = useMemo(() => {
    if (!meses.length || !series.length) return 'O relatório não retornou meses nem séries de vendas para os filtros aplicados.'
    return series.map((serie) => {
      const nome = serie?.categoriaNome || `Série ${series.indexOf(serie) + 1}`
      const valores = meses.map((mes, indice) => `${formatarMes(mes)}: ${formatarMoeda(valorDaSerie(serie, indice))}`)
      return `${nome}: ${valores.join('; ')}`
    }).join('. ')
  }, [meses, series])
  const chartHeight = isMobile ? 280 : 360

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <main className="admin-report-content" style={{ padding: isMobile ? '72px 14px 20px' : '28px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h1 style={{ margin: '0 0 4px', fontSize: isMobile ? 20 : 22, fontWeight: 800 }}>Relatórios</h1>
              <p style={{ margin: 0, fontSize: isMobile ? 13 : 14, color: 'var(--text-muted)' }}>Vendas de pedidos entregues ou finalizados, conforme os valores retornados pelo backend</p>
            </div>
          </div>

          <form onSubmit={aplicarFiltros} className="card" style={{ padding: isMobile ? '14px 12px' : '18px 20px', marginBottom: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(190px, 1fr) minmax(190px, 1fr)', gap: 12, marginBottom: 16 }}>
              <div>
                <label className="label" htmlFor="relatorio-data-inicio">Data inicial</label>
                <input id="relatorio-data-inicio" type="date" className="input-field" value={dataInicio} onChange={(event) => { setDataInicio(event.target.value); setErroFiltros('') }} />
              </div>
              <div>
                <label className="label" htmlFor="relatorio-data-fim">Data final</label>
                <input id="relatorio-data-fim" type="date" className="input-field" value={dataFim} onChange={(event) => { setDataFim(event.target.value); setErroFiltros('') }} />
              </div>
            </div>

            <fieldset style={{ border: 0, margin: '0 0 16px', padding: 0 }}>
              <legend className="label" style={{ marginBottom: 10 }}>Categorias (opcional)</legend>
              <p style={{ margin: '0 0 10px', color: 'var(--text-muted)', fontSize: 12 }}>
                Sem categorias selecionadas, o backend retorna o Total geral, incluindo livros sem categoria.
              </p>
              {carregandoCategorias ? (
                <small role="status" style={{ color: 'var(--text-muted)' }}>Carregando categorias...</small>
              ) : erroCategorias ? (
                <div role="alert" style={{ color: '#991B1B', fontSize: 13 }}>{erroCategorias}</div>
              ) : categorias.length === 0 ? (
                <small style={{ color: 'var(--text-muted)' }}>Nenhuma categoria disponível. O Total geral continua disponível.</small>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {categorias.map((categoria, index) => {
                    const id = Number(categoria?.id ?? categoria?.categoriaId)
                    if (!Number.isInteger(id) || id <= 0) return null
                    const nome = categoria?.nome || categoria?.categoriaNome || `Categoria ${id}`
                    const selecionada = categoriasSelecionadas.includes(id)
                    return (
                      <button
                        key={`${id}-${index}`}
                        type="button"
                        aria-pressed={selecionada}
                        onClick={() => alternarCategoria(id)}
                        style={{
                          border: `1px solid ${selecionada ? '#7C3AED' : '#D1D5DB'}`,
                          background: selecionada ? '#F3E8FF' : '#fff',
                          color: selecionada ? '#4C1D95' : 'var(--text)',
                          padding: isMobile ? '8px 11px' : '8px 12px',
                          borderRadius: 999,
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontSize: isMobile ? 12 : 13,
                          lineHeight: 1.2,
                        }}
                      >
                        {nome}
                      </button>
                    )
                  })}
                </div>
              )}
            </fieldset>

            {erroFiltros && <p role="alert" style={{ margin: '0 0 12px', color: '#991B1B', fontSize: 13 }}>{erroFiltros}</p>}
            <button type="submit" className="btn-primary" disabled={carregandoCategorias || carregando}>
              {carregando ? 'Carregando relatório...' : 'Aplicar filtros'}
            </button>
          </form>

          {erro && (
            <div className="card" role="alert" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, padding: 16, marginBottom: 20, borderColor: '#FECACA', background: '#FEF2F2', color: '#991B1B' }}>
              <span>{erro}</span>
              <button type="button" className="btn-secondary" onClick={tentarNovamente}>Tentar novamente</button>
            </div>
          )}

          {carregando && (
            <div className="card" role="status" aria-live="polite" style={{ padding: isMobile ? '22px 16px' : '32px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              Carregando relatório...
            </div>
          )}

          {!carregando && !erro && semEstruturaDeDados && (
            <div className="card" role="status" style={{ padding: isMobile ? '22px 16px' : '32px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              O relatório não retornou meses ou séries para os filtros selecionados.
            </div>
          )}

          {!carregando && !erro && semVendas && (
            <div className="card" role="status" style={{ padding: '12px 16px', marginBottom: 16, color: 'var(--text-muted)', fontSize: 14 }}>
              Não houve vendas de pedidos entregues ou finalizados no período.
            </div>
          )}

          {!carregando && !erro && !semEstruturaDeDados && chartData.length > 0 && (
            <div className="card" style={{ padding: isMobile ? 14 : 20 }}>
              <h2 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700 }}>Vendas por mês</h2>
              <p style={{ margin: '0 0 16px', color: 'var(--text-muted)', fontSize: 12 }}>
                Valores mensais fornecidos pela API, agrupados pelo mês de criação dos pedidos entregues ou finalizados. Cada pedido é considerado uma única vez pelo status atual.
              </p>
              <div role="img" aria-label={`Gráfico de vendas por mês. ${resumoTexto}`}>
                <ResponsiveContainer width="100%" height={chartHeight}>
                  <LineChart data={chartData} margin={{ top: 8, right: 12, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="mesLabel" tick={{ fontSize: isMobile ? 10 : 12, fill: '#667085' }} axisLine={false} tickLine={false} minTickGap={isMobile ? 12 : 20} />
                    <YAxis tick={{ fontSize: isMobile ? 10 : 11, fill: '#667085' }} axisLine={false} tickLine={false} width={isMobile ? 66 : 78} tickFormatter={formatarMoeda} />
                    <Tooltip formatter={(valor, nome) => [formatarMoeda(valor), nome]} labelFormatter={(label) => `Mês: ${label}`} />
                    <Legend wrapperStyle={{ fontSize: isMobile ? 11 : 13 }} />
                    {series.map((serie, index) => {
                      const nome = serie?.categoriaNome || `Categoria ${index + 1}`
                      return (
                        <Line
                          key={`${nome}-${index}`}
                          type="monotone"
                          dataKey={nome}
                          name={nome}
                          stroke={CORES_CATEGORIA[index % CORES_CATEGORIA.length]}
                          strokeWidth={2.5}
                          dot={{ r: isMobile ? 3 : 4 }}
                          activeDot={{ r: 6 }}
                        />
                      )
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <details style={{ marginTop: 16 }}>
                <summary style={{ cursor: 'pointer', color: 'var(--primary)', fontSize: 13, fontWeight: 600 }}>Ver dados do gráfico em tabela</summary>
                <div style={{ overflowX: 'auto', marginTop: 12 }}>
                  <table className="data-table" aria-label="Valores mensais do relatório de vendas">
                    <thead>
                      <tr>
                        <th>Mês</th>
                        {series.map((serie, index) => (
                          <th key={`${serie?.categoriaNome || 'serie'}-${index}`}>{serie?.categoriaNome || `Categoria ${index + 1}`}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {chartData.map((linha) => (
                        <tr key={linha.mes}>
                          <th scope="row">{linha.mesLabel}</th>
                          {series.map((serie, index) => (
                            <td key={`${serie?.categoriaNome || 'serie'}-${index}`}>{formatarMoeda(valorDaSerie(serie, meses.indexOf(linha.mes)))}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}