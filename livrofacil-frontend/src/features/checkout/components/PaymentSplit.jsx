import { useState } from 'react'

export default function PaymentSplit({ splits, setSplits, cartoes }) {
  // splits: [{ id, tipo, cartaoId, valor, codigo }]
  function adicionarSplit() {
    setSplits(prev => [...prev, { id: Date.now(), tipo: 'cartao', cartaoId: cartoes?.[0]?.id || null, valor: 0 }])
  }
  function atualizarSplit(idx, campo, valor) {
    setSplits(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], [campo]: valor }
      return next
    })
  }
  function removerSplit(idx) {
    setSplits(prev => prev.filter((_, i) => i !== idx))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {splits.map((s, i) => (
        <div key={s.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={s.tipo} onChange={e => atualizarSplit(i, 'tipo', e.target.value)} style={{ padding: 8 }}>
            <option value="cartao">Cartão</option>
            <option value="pix">Pix</option>
            <option value="boleto">Boleto</option>
            <option value="cupom">Cupom</option>
          </select>

          {s.tipo === 'cartao' && (
            <select value={s.cartaoId || ''} onChange={e => atualizarSplit(i, 'cartaoId', e.target.value)} style={{ padding: 8 }}>
              {cartoes?.map(c => <option key={c.id} value={c.id}>{c.bandeira} ****{c.ultimos4}</option>)}
            </select>
          )}

          {s.tipo === 'cupom' && (
            <input placeholder="Código do cupom" value={s.codigo || ''} onChange={e => atualizarSplit(i, 'codigo', e.target.value)} style={{ padding: 8 }} />
          )}

          <input type="number" value={s.valor} onChange={e => atualizarSplit(i, 'valor', Number(e.target.value))} min="0" step="0.01" style={{ width: 120, padding: 8 }} />

          <button onClick={() => removerSplit(i)} className="btn-ghost" style={{ padding: '6px 10px' }}>Remover</button>
        </div>
      ))}

      <button onClick={adicionarSplit} className="btn-ghost" style={{ padding: '10px 12px', marginTop: 6 }}>
        + Adicionar forma de pagamento
      </button>
    </div>
  )
}