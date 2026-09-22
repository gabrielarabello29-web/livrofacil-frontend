import React from 'react'
import FavoriteButton from '../../src/features/favoritos/components/FavoriteButton'
import { FavoriteProviders } from './providers'

describe('FavoriteButton', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
  })

  it('adiciona um livro aos favoritos', () => {
    cy.mount(<FavoriteProviders><FavoriteButton livro={{ id: 1, titulo: 'Livro' }} /></FavoriteProviders>)
    cy.findByRole('button', { name: 'Adicionar aos favoritos' }).click()
    cy.findByRole('button', { name: 'Remover dos favoritos' }).should('exist')
  })

  it('exibe remoção quando o livro já é favorito', () => {
    cy.window().then((window) => window.localStorage.setItem('favoritos', JSON.stringify([{ id: 1 }])))
    cy.mount(<FavoriteProviders><FavoriteButton livro={{ id: 1 }} /></FavoriteProviders>)
    cy.findByRole('button', { name: 'Remover dos favoritos' }).should('be.visible')
  })
})
