import React from 'react'
import { obterEstoqueDisponivel, useCarrinho } from '@/features/carrinho/context/CarrinhoContext'
import LivroCover from '@/features/livros/components/LivroCover'

export default function CarrinhoItem({ item }) {
  const { atualizarQuantidade, removerItem } = useCarrinho()
  const estoqueDisponivel = obterEstoqueDisponivel(item)
  const atingiuEstoque = estoqueDisponivel !== null && item.quantidade >= estoqueDisponivel

  return (
    <div className="cart-item" style={{ display: 'flex', gap: 16, padding: '20px 0', borderBottom: '1px solid #F3F4F6', alignItems: 'flex-start' }}>
      <LivroCover src={item.imagemUrl} alt={`Capa de ${item.titulo}`} style={{ width: 72, height: 100, borderRadius: 8, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <h4 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: 'var(--text)', lineHeight: 1.3 }}>{item.titulo}</h4>
        <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-muted)' }}>{item.valorUnitario ? `R$ ${Number(item.valorUnitario).toFixed(2).replace('.', ',')} cada` : ''}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden' }}>
            <button onClick={() => atualizarQuantidade(item.id, Math.max(1, item.quantidade - 1))} disabled={item.quantidade <= 1}
              style={{ padding: '6px 12px', background: '#F9FAFB', border: 'none', cursor: item.quantidade <= 1 ? 'not-allowed' : 'pointer', opacity: item.quantidade <= 1 ? 0.45 : 1, fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>−</button>
            <span style={{ padding: '6px 14px', fontSize: 14, fontWeight: 600, color: 'var(--text)', borderLeft: '1px solid #E5E7EB', borderRight: '1px solid #E5E7EB' }}>{item.quantidade}</span>
            <button onClick={() => atualizarQuantidade(item.id, item.quantidade + 1)} disabled={atingiuEstoque}
              style={{ padding: '6px 12px', background: '#F9FAFB', border: 'none', cursor: atingiuEstoque ? 'not-allowed' : 'pointer', opacity: atingiuEstoque ? 0.45 : 1, fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>+</button>
          </div>
          {estoqueDisponivel !== null && <small style={{ color: 'var(--text-muted)' }}>Estoque disponível: {estoqueDisponivel}</small>}
          <button onClick={() => removerItem(item.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
            Remover
          </button>
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--primary)' }}>
          R$ {Number(item.subtotal ?? Number(item.valorUnitario || 0) * item.quantidade).toFixed(2).replace('.', ',')}
        </p>
        {item.quantidade > 1 && (
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>R$ {Number(item.valorUnitario || 0).toFixed(2).replace('.', ',')} cada</p>
        )}
      </div>
    </div>
  )
}
