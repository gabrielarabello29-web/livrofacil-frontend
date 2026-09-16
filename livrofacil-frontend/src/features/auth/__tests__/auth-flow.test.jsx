import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

import { AuthProvider, useAuth } from '../../../context/AuthContext'
import ProtectedRoute from '../components/ProtectedRoute'

function LoginStub() {
  const { login } = useAuth()
  return (
    <button onClick={() => login('admin@livrofacil.com', 'Admin@123')}>
      Login
    </button>
  )
}

describe('fluxo de autenticação', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('salva usuário no localStorage e usa o perfil retornado pelo backend para decidir a rota', async () => {
    const user = userEvent.setup()

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<LoginStub />} />
            <Route path="/admin" element={<div>Admin</div>} />
            <Route path="/" element={<div>Home</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    )

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 1,
        nome: 'Administrador',
        email: 'admin@livrofacil.com',
        ativo: true,
        perfil: 'ADMIN',
      }),
    })

    await user.click(screen.getByRole('button', { name: /login/i }))

    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem('usuario'))?.perfil).toBe('ADMIN')
    })
  })

  it('bloqueia cliente em rota administrativa', async () => {
    localStorage.setItem(
      'usuario',
      JSON.stringify({
        id: 2,
        nome: 'Cliente Padrao',
        email: 'cliente@livrofacil.com',
        perfil: 'CLIENTE',
      }),
    )

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredProfile="ADMIN">
                  <div>Admin area</div>
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<div>Home</div>} />
            <Route path="/login" element={<div>Login page</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Home')).toBeInTheDocument()
    })
  })
})
