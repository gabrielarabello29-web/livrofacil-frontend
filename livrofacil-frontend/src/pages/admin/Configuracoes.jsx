import { useState } from 'react'
import AdminSidebar from '../../components/AdminSidebar'

const abas = ['Geral', 'Pagamentos', 'E-mail', 'Frete', 'Segurança']

export default function AdminConfiguracoes() {
  const [aba, setAba] = useState('Geral')
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  async function salvar(e) {
    e.preventDefault()
    setSalvando(true)
    await new Promise(r => setTimeout(r, 600))
    setSalvando(false)
    setSucesso(true)
    setTimeout(() => setSucesso(false), 3000)
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <div style={{ padding: '28px 32px', maxWidth: 800 }}>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800 }}>Configurações</h1>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>Gerencie as configurações da loja</p>
          </div>

          {sucesso && (
            <div style={{ padding: '12px 16px', background: '#D1FAE5', border: '1px solid #A7F3D0', borderRadius: 8, fontSize: 14, color: '#065F46', fontWeight: 500, marginBottom: 16 }}>
              ✓ Configurações salvas com sucesso!
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '2px solid #F3F4F6', marginBottom: 28, gap: 2 }}>
            {abas.map(a => (
              <button key={a} onClick={() => setAba(a)}
                style={{ padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, borderBottom: aba === a ? '2px solid var(--primary)' : '2px solid transparent', color: aba === a ? 'var(--primary)' : 'var(--text-muted)', marginBottom: -2 }}>
                {a}
              </button>
            ))}
          </div>

          <form onSubmit={salvar}>
            {aba === 'Geral' && (
              <div className="card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700 }}>Informações da loja</h3>
                <div><label className="label">Nome da loja</label><input className="input-field" defaultValue="LivroFácil" /></div>
                <div><label className="label">E-mail de contato</label><input className="input-field" type="email" defaultValue="contato@livrofacil.com.br" /></div>
                <div><label className="label">Telefone</label><input className="input-field" defaultValue="(11) 3000-0000" /></div>
                <div><label className="label">CNPJ</label><input className="input-field" defaultValue="00.000.000/0001-00" /></div>
                <div><label className="label">Endereço da sede</label><textarea className="input-field" defaultValue="Av. Paulista, 1000 - Bela Vista, São Paulo/SP - CEP 01310-200" rows={2} style={{ resize: 'vertical' }} /></div>
              </div>
            )}

            {aba === 'Pagamentos' && (
              <div className="card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700 }}>Métodos de pagamento</h3>
                {[['Cartão de crédito', true], ['Cartão de débito', true], ['Pix', true], ['Boleto bancário', false]].map(([m, ativo]) => (
                  <label key={m} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#F9FAFB', borderRadius: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{m}</span>
                    <input type="checkbox" defaultChecked={ativo} style={{ accentColor: 'var(--primary)', width: 18, height: 18 }} />
                  </label>
                ))}
                <div><label className="label">Parcelas máximas sem juros</label>
                  <select className="input-field" defaultValue="12">
                    {[1,2,3,6,10,12].map(n => <option key={n} value={n}>{n}x</option>)}
                  </select>
                </div>
                <div><label className="label">Desconto Pix (%)</label><input className="input-field" type="number" defaultValue="5" min="0" max="20" /></div>
              </div>
            )}

            {aba === 'E-mail' && (
              <div className="card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700 }}>Configurações de e-mail</h3>
                <div><label className="label">Servidor SMTP</label><input className="input-field" defaultValue="smtp.gmail.com" /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><label className="label">Porta</label><input className="input-field" defaultValue="587" /></div>
                  <div>
                    <label className="label">Segurança</label>
                    <select className="input-field"><option>TLS</option><option>SSL</option></select>
                  </div>
                </div>
                <div><label className="label">E-mail remetente</label><input className="input-field" type="email" defaultValue="noreply@livrofacil.com.br" /></div>
                <div><label className="label">Nome do remetente</label><input className="input-field" defaultValue="LivroFácil" /></div>
              </div>
            )}

            {aba === 'Frete' && (
              <div className="card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700 }}>Configurações de frete</h3>
                <div><label className="label">Valor mínimo para frete grátis (R$)</label><input className="input-field" type="number" defaultValue="150" /></div>
                <div><label className="label">Frete padrão (R$)</label><input className="input-field" type="number" defaultValue="19.90" step="0.01" /></div>
                <div><label className="label">Prazo de entrega padrão (dias)</label><input className="input-field" type="number" defaultValue="5" /></div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                  <input type="checkbox" defaultChecked style={{ accentColor: 'var(--primary)' }} />
                  Calcular frete via Correios (integração back-end)
                </label>
              </div>
            )}

            {aba === 'Segurança' && (
              <div className="card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700 }}>Configurações de segurança</h3>
                <div><label className="label">Tempo de sessão (minutos)</label><input className="input-field" type="number" defaultValue="60" /></div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                  <input type="checkbox" defaultChecked style={{ accentColor: 'var(--primary)' }} />
                  Exigir autenticação em duas etapas para admin
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                  <input type="checkbox" defaultChecked style={{ accentColor: 'var(--primary)' }} />
                  Registrar log de ações administrativas
                </label>
                <div style={{ padding: 14, background: '#FEF3C7', borderRadius: 8, fontSize: 13, color: '#92400E' }}>
                  ⚠️ Configurações de segurança críticas são gerenciadas pelo Spring Security no back-end.
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <button type="submit" className="btn-primary" style={{ padding: '11px 28px' }} disabled={salvando}>
                {salvando ? 'Salvando...' : 'Salvar configurações'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
