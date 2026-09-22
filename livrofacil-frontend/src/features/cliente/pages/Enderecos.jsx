import { useState } from 'react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import ClienteSidebar from '../../components/ClienteSidebar'
import Modal from '../../components/Modal'
import { useAuth } from '../../context/AuthContext'

const estadosBR = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

const vazio = { identificacao: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: '', principal: false }

export default function Enderecos() {
  const { usuario, atualizarUsuario } = useAuth()
  const [enderecos, setEnderecos] = useState(usuario?.enderecos || [])
  const [modalAberto, setModalAberto] = useState(false)
  const [form, setForm] = useState(vazio)
  const [editandoId, setEditandoId] = useState(null)

  function set(field) { return e => setForm(p => ({ ...p, [field]: e.target.value })) }

  function abrirNovo() { setForm(vazio); setEditandoId(null); setModalAberto(true) }
  function abrirEditar(end) { setForm(end); setEditandoId(end.id); setModalAberto(true) }

  function salvar() {
    let novos
    if (editandoId) {
      novos = enderecos.map(e => e.id === editandoId ? { ...form, id: editandoId } : e)
    } else {
      novos = [...enderecos, { ...form, id: Date.now() }]
    }
    if (form.principal) novos = novos.map(e => ({ ...e, principal: e.id === (editandoId || novos[novos.length - 1].id) }))
    setEnderecos(novos)
    atualizarUsuario({ enderecos: novos })
    setModalAberto(false)
  }

  function remover(id) {
    const novos = enderecos.filter(e => e.id !== id)
    setEnderecos(novos)
    atualizarUsuario({ enderecos: novos })
  }

  function tornarPrincipal(id) {
    const novos = enderecos.map(e => ({ ...e, principal: e.id === id }))
    setEnderecos(novos)
    atualizarUsuario({ enderecos: novos })
  }

  return (
    <div>
      <Header />
      <main className="page-container" style={{ paddingTop: 40, paddingBottom: 80 }}>
        <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
          <ClienteSidebar />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Meus Endereços</h1>
              <button onClick={abrirNovo} className="btn-primary" style={{ padding: '9px 18px' }}>+ Adicionar endereço</button>
            </div>

            {enderecos.length === 0 ? (
              <div className="card" style={{ padding: 60, textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📍</div>
                <p style={{ margin: '0 0 20px', fontSize: 16, color: 'var(--text-muted)' }}>Nenhum endereço cadastrado ainda.</p>
                <button onClick={abrirNovo} className="btn-primary">Adicionar endereço</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                {enderecos.map(end => (
                  <div key={end.id} className="card" style={{ padding: 20, borderColor: end.principal ? 'var(--primary)' : undefined, borderWidth: end.principal ? 2 : 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 15, fontWeight: 700 }}>🏠 {end.identificacao}</span>
                        {end.principal && <span className="badge badge-purple">Principal</span>}
                      </div>
                    </div>
                    <p style={{ margin: '0 0 4px', fontSize: 14, color: 'var(--text)' }}>{end.logradouro}, {end.numero}{end.complemento ? ` - ${end.complemento}` : ''}</p>
                    <p style={{ margin: '0 0 4px', fontSize: 14, color: 'var(--text-muted)' }}>{end.bairro}</p>
                    <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--text-muted)' }}>{end.cidade}/{end.estado} · CEP {end.cep}</p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button onClick={() => abrirEditar(end)} className="btn-secondary" style={{ padding: '6px 14px', fontSize: 13 }}>Editar</button>
                      {!end.principal && (
                        <button onClick={() => tornarPrincipal(end.id)} className="btn-ghost" style={{ padding: '6px 14px', fontSize: 13, border: '1px solid #E5E7EB' }}>Tornar principal</button>
                      )}
                      <button onClick={() => remover(end.id)} className="btn-danger" style={{ padding: '6px 14px', fontSize: 13, marginLeft: 'auto' }}>Excluir</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />

      <Modal isOpen={modalAberto} onClose={() => setModalAberto(false)} title={editandoId ? 'Editar endereço' : 'Novo endereço'} width={520}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label className="label">Identificação</label><input className="input-field" value={form.identificacao} onChange={set('identificacao')} placeholder="Casa, Trabalho..." /></div>
          <div><label className="label">CEP</label><input className="input-field" value={form.cep} onChange={set('cep')} placeholder="00000-000" /></div>
          <div><label className="label">Logradouro</label><input className="input-field" value={form.logradouro} onChange={set('logradouro')} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
            <div><label className="label">Número</label><input className="input-field" value={form.numero} onChange={set('numero')} /></div>
            <div><label className="label">Complemento</label><input className="input-field" value={form.complemento} onChange={set('complemento')} placeholder="Apto, sala..." /></div>
          </div>
          <div><label className="label">Bairro</label><input className="input-field" value={form.bairro} onChange={set('bairro')} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <div><label className="label">Cidade</label><input className="input-field" value={form.cidade} onChange={set('cidade')} /></div>
            <div>
              <label className="label">Estado</label>
              <select className="input-field" value={form.estado} onChange={set('estado')}>
                <option value="">UF</option>
                {estadosBR.map(uf => <option key={uf}>{uf}</option>)}
              </select>
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.principal} onChange={e => setForm(p => ({ ...p, principal: e.target.checked }))} style={{ accentColor: 'var(--primary)' }} />
            Definir como endereço principal
          </label>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button onClick={() => setModalAberto(false)} className="btn-secondary" style={{ flex: 1 }}>Cancelar</button>
            <button onClick={salvar} className="btn-primary" style={{ flex: 1 }}>Salvar</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
