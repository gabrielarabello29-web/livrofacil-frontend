import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import React from 'react'
import PaymentSplit from './PaymentSplit'

describe('PaymentSplit', () => {
  it('adiciona uma forma de pagamento', () => {
    const setSplits = vi.fn()
    render(<PaymentSplit splits={[]} setSplits={setSplits} cartoes={[]} />)
    fireEvent.click(screen.getByRole('button', { name: '+ Adicionar forma de pagamento' }))
    expect(setSplits).toHaveBeenCalledWith(expect.any(Function))
  })

  it('mostra código para pagamento por cupom e altera o valor', () => {
    const setSplits = vi.fn()
    render(<PaymentSplit splits={[{ id: 1, tipo: 'cupom', valor: 0 }]} setSplits={setSplits} cartoes={[]} />)
    expect(screen.getByPlaceholderText('Código do cupom')).toBeInTheDocument()
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '25' } })
    expect(setSplits).toHaveBeenCalledWith(expect.any(Function))
  })
})
