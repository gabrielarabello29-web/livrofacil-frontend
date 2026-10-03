import React from 'react'
import { afterEach, describe, it, expect, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import LivrosPage from '../pages/LivrosPage'
import LivroForm from '../components/LivroForm'
import { buildLivroPayload, parseDecimal, validarLivroForm } from '../utils/livroFormatters'

const mockLivros = [
  {
    id: 1,
    codigo: 'LIV-001',
    titulo: 'Clean Code',
    isbn: '9788576082675',
    codigoBarras: '9788576082675',
    ano: 2024,
    edicao: 1,
    numeroPaginas: 464,
    sinopse: 'Livro de referência sobre qualidade de software.',
    valorVenda: 89.9,
    ativo: true,
    autorId: 1,
    autorNome: 'Robert C. Martin',
    editoraId: 1,
    editoraNome: 'Alta Books',
    grupoPrecificacaoId: 1,
    grupoPrecificacaoNome: 'Livros gerais',
    categoriaIds: [1, 2],
    dimensao: { altura: 2, largura: 16, profundidade: 23, peso: 0.6 },
  },
]

vi.mock('../api/livrosApi', () => ({
  tratarResposta: vi.fn(),
  listarLivrosAtivos: vi.fn(async () => mockLivros),
  buscarLivrosPorTitulo: vi.fn(async (titulo) => (titulo === 'Clean' ? mockLivros : [])),
  buscarLivroPorId: vi.fn(async () => mockLivros[0]),
  criarLivro: vi.fn(async () => ({ id: 99 })),
  atualizarLivro: vi.fn(async () => ({ ok: true })),
  ativarLivro: vi.fn(async () => ({ ok: true })),
  inativarLivro: vi.fn(async () => ({ ok: true })),
}))

vi.mock('../../catalogo/api/catalogoApi', () => ({
  listarCatalogo: vi.fn(async () => mockLivros),
  buscarCatalogoPorTitulo: vi.fn(async (titulo) => (titulo === 'Clean' ? mockLivros : [])),
}))

vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: () => ({ usuario: null, logout: vi.fn() }),
}))

vi.mock('@/features/carrinho/context/CarrinhoContext', () => ({
  useCarrinho: () => ({ itens: [], adicionarItem: vi.fn(), operando: false, totalItens: 0 }),
}))

vi.mock('@/features/favoritos/context/FavoritosContext', () => ({
  useFavoritos: () => ({ favoritos: [], isFavorito: () => false, toggleFavorito: vi.fn() }),
}))

vi.mock('@/shared/components/Header', () => ({ default: () => null }))
vi.mock('@/shared/components/Footer', () => ({ default: () => null }))
vi.mock('@/features/ia/components/ChatBot', () => ({ default: () => null }))
vi.mock('@/features/livros/components/LivroCard', () => ({ default: ({ livro }) => <div>{livro.titulo}</div> }))

const opcoes = {
  autores: [{ id: 7, nome: 'Autor real' }],
  editoras: [{ id: 8, nome: 'Editora real' }],
  grupos: [{ id: 9, nome: 'Grupo real', percentualMargem: 30 }],
  categorias: [{ id: 10, nome: 'Tecnologia' }, { id: 11, nome: 'Programação' }],
}

describe('módulo de livros', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('lista livros ativos', async () => {
    render(
      <MemoryRouter>
        <LivrosPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Clean Code')).toBeInTheDocument()
  })

  it('pesquisa por título', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <LivrosPage />
      </MemoryRouter>,
    )

    const input = screen.getByPlaceholderText('Buscar por título...')
    await user.type(input, 'Clean')
    await user.click(screen.getByRole('button', { name: 'Pesquisar' }))
    await waitFor(() => {
      expect(screen.getByText('Clean Code')).toBeInTheDocument()
    })
  })

  it('renderiza lista vazia', async () => {
    const { listarCatalogo } = await import('../../catalogo/api/catalogoApi')
    listarCatalogo.mockResolvedValueOnce([])

    render(
      <MemoryRouter>
        <LivrosPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Nenhum livro encontrado')).toBeInTheDocument()
  })

  it('valida campos obrigatórios do formulário', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <LivroForm
          initialValues={{}}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
          opcoes={opcoes}
        />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: /cadastrar livro/i }))

    expect(screen.getByText('Código é obrigatório.')).toBeInTheDocument()
  })

  it('seleciona categorias', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <LivroForm
          initialValues={{}}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
          opcoes={opcoes}
        />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'Tecnologia' }))
    expect(screen.getByText('Tecnologia')).toBeInTheDocument()
  })

  it('converte decimais e envia IDs reais no payload', () => {
    expect(parseDecimal('89.90')).toBe(89.9)
    expect(parseDecimal('89,90')).toBe(89.9)

    expect(buildLivroPayload({
      codigo: ' LIV-001 ',
      titulo: ' Clean Code ',
      imagemUrl: ' https://exemplo.com/capas/clean-code.jpg ',
      ano: '2024',
      edicao: '1',
      isbn: '9788576082675',
      numeroPaginas: '464',
      sinopse: 'Resumo',
      codigoBarras: '9788576082675',
      valorVenda: '89,90',
      ativo: true,
      autorId: '7',
      editoraId: '8',
      grupoPrecificacaoId: '9',
      categoriaIds: ['10', '10', '11'],
      dimensao: { altura: '2,00', largura: '16,00', profundidade: '23,00', peso: '0,60' },
    })).toMatchObject({
      codigo: 'LIV-001',
      imagemUrl: 'https://exemplo.com/capas/clean-code.jpg',
      valorVenda: 89.9,
      autorId: 7,
      editoraId: 8,
      grupoPrecificacaoId: 9,
      categoriaIds: [10, 11],
      dimensao: { altura: 2, largura: 16, profundidade: 23, peso: 0.6 },
    })
  })

  it('exige uma URL de capa HTTP ou HTTPS válida', () => {
    const base = {
      codigo: 'LIV-001', titulo: 'Livro', ano: 2024, edicao: 1, isbn: '123', numeroPaginas: 1,
      sinopse: 'Resumo', codigoBarras: '123', valorVenda: '10', ativo: true,
      autorId: 7, editoraId: 8, grupoPrecificacaoId: 9, categoriaIds: [10],
      dimensao: { altura: '2', largura: '16', profundidade: '23', peso: '0,6' },
    }

    expect(validarLivroForm({ ...base, imagemUrl: '' }).imagemUrl).toBe('URL da capa é obrigatória.')
    expect(validarLivroForm({ ...base, imagemUrl: 'ftp://exemplo.com/capa.jpg' }).imagemUrl).toBe('A URL da imagem da capa deve iniciar com http:// ou https://.')
    expect(validarLivroForm({ ...base, imagemUrl: `https://${'a'.repeat(500)}` }).imagemUrl).toBe('A URL da capa deve ter no máximo 500 caracteres.')
    expect(validarLivroForm({ ...base, imagemUrl: ' https://exemplo.com/capa.jpg ' }).imagemUrl).toBeUndefined()
  })

  it('rejeita categoria ausente e dimensões inválidas', () => {
    const erros = validarLivroForm({
      codigo: 'LIV-001', titulo: 'Livro', ano: 2024, edicao: 1, isbn: '123', numeroPaginas: 1,
      sinopse: 'Resumo', codigoBarras: '123', valorVenda: '0', ativo: true,
      autorId: 7, editoraId: 8, grupoPrecificacaoId: 9, categoriaIds: [],
      dimensao: { altura: '0', largura: '-1', profundidade: '', peso: '0' },
    })

    expect(erros.categoriaIds).toBeTruthy()
    expect(erros['dimensao.altura']).toBeTruthy()
    expect(erros['dimensao.largura']).toBeTruthy()
    expect(erros['dimensao.profundidade']).toBeTruthy()
    expect(erros['dimensao.peso']).toBeTruthy()
    expect(erros.valorVenda).toBeTruthy()
  })
})
