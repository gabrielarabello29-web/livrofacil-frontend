import { livros_mock } from './livroService'

const normalizarTexto = (texto) => {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

const categorias = {
  'Ficção': {
    palavras: [
      'ficcao',
      'ficção'
    ],
    resposta:
      '📚 Ótima escolha! A categoria de Ficção reúne histórias imaginativas e envolventes. Separei algumas opções do nosso catálogo para você:'
  },

  'Não-Ficção': {
    palavras: [
      'nao ficcao',
      'não ficção',
      'nao-ficcao',
      'não-ficção',
      'nao ficção'
    ],
    resposta:
      '📖 Se você prefere histórias e conteúdos baseados em fatos, conhecimentos e experiências reais, confira algumas opções de Não-Ficção do nosso catálogo:'
  },

  'Desenvolvimento Pessoal': {
    palavras: [
      'desenvolvimento pessoal',
      'desenvolvimento',
      'autoajuda',
      'auto ajuda',
      'habito',
      'habitos',
      'hábito',
      'hábitos',
      'produtividade',
      'motivacao',
      'motivação',
      'foco',
      'mentalidade',
      'crescimento pessoal'
    ],
    resposta:
      '🌱 Quer investir no seu desenvolvimento? Separei algumas opções de Desenvolvimento Pessoal que podem ajudar com hábitos, produtividade, foco e crescimento:'
  },

  'Negócios': {
    palavras: [
      'negocio',
      'negócio',
      'negocios',
      'negócios',
      'empreendedorismo',
      'empreendedor',
      'empreendedorismo',
      'financa',
      'finanças',
      'financeiro',
      'investimento',
      'investimentos',
      'gestao',
      'gestão',
      'lideranca',
      'liderança',
      'marketing'
    ],
    resposta:
      '💼 Se você está buscando conhecimento sobre negócios, gestão, finanças ou empreendedorismo, encontrei algumas opções interessantes para você:'
  },

  'Tecnologia': {
    palavras: [
      'tecnologia',
      'programacao',
      'programação',
      'programador',
      'software',
      'computacao',
      'computação',
      'informatica',
      'informática',
      'java',
      'javascript',
      'python',
      'react',
      'programar',
      'desenvolvimento de software'
    ],
    resposta:
      '💻 Para quem gosta de Tecnologia, temos opções sobre programação, desenvolvimento de software e outros assuntos da área. Confira algumas sugestões:'
  },

  'Romance': {
    palavras: [
      'romance',
      'romances',
      'romantico',
      'romântica',
      'romantica',
      'amor',
      'historia de amor',
      'histórias de amor'
    ],
    resposta:
      '❤️ Procurando uma história de amor? Separei alguns livros da categoria Romance que podem ser exatamente o que você procura:'
  },

  'Infantil': {
    palavras: [
      'infantil',
      'crianca',
      'criança',
      'criancas',
      'crianças',
      'livro infantil',
      'livros infantis',
      'para crianca',
      'para criança',
      'filho',
      'filha'
    ],
    resposta:
      '🧸 Procurando um livro para crianças? Separei algumas opções da nossa categoria Infantil:'
  },

  'Suspense': {
    palavras: [
      'suspense',
      'suspenses',
      'thriller',
      'investigacao',
      'investigação',
      'detetive',
      'misterio',
      'mistério'
    ],
    resposta:
      '🔎 Se você gosta de mistério, tensão e histórias que prendem a atenção, confira estas opções de Suspense:'
  },

  'Biografias': {
    palavras: [
      'biografia',
      'biografias',
      'biografico',
      'biográfico',
      'autobiografia',
      'autobiografias',
      'historia real',
      'história real'
    ],
    resposta:
      '👤 Gosta de conhecer histórias de pessoas reais? Separei algumas opções da categoria Biografias para você:'
  }
}

const respostasGerais = {
  saudacao:
    'Olá! 👋 Sou o Assistente LivroFácil. Posso ajudar você a encontrar livros por categoria, preço, popularidade, título ou autor. O que você está procurando?',

  ajuda:
    'Posso ajudar você a encontrar livros! 📚 Você pode perguntar, por exemplo: "quero um romance", "me indique livros de tecnologia", "quais são os mais baratos?" ou "quais são os mais vendidos?",',

  maisVendidos:
    '🔥 Estes são alguns dos livros mais populares do nosso catálogo:',

  baratos:
    '💰 Encontrei algumas opções com os menores preços do nosso catálogo:',

  recomendacoes:
    '⭐ Separei algumas recomendações para você:',

  nenhumResultado:
    (mensagem) =>
      `Não encontrei um resultado específico para "${mensagem}". 😕 Posso procurar por categoria, título, autor, preço ou popularidade.`
}

const encontrarCategoria = (mensagem) => {
  const categoriasEncontradas = Object.entries(categorias)

  return categoriasEncontradas.find(([categoria, dados]) =>
    dados.palavras.some((palavra) =>
      mensagem.includes(normalizarTexto(palavra))
    )
  )
}

const buscarLivrosPorCategoria = (categoria) => {
  return livros_mock
    .filter(
      (livro) =>
        normalizarTexto(livro.categoria) === normalizarTexto(categoria)
    )
    .slice(0, 3)
}

export const aiService = {
  obterRecomendacoes: async (categoria) => {
    if (categoria) {
      return buscarLivrosPorCategoria(categoria)
    }

    return [...livros_mock]
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
  },

  enviarMensagem: async (mensagem) => {
    await new Promise((resolve) => setTimeout(resolve, 800))

    const msg = normalizarTexto(mensagem)

    // ==========================================
    // SAUDAÇÃO
    // ==========================================

    if (
      msg === 'oi' ||
      msg === 'ola' ||
      msg.includes('bom dia') ||
      msg.includes('boa tarde') ||
      msg.includes('boa noite')
    ) {
      return {
        texto: respostasGerais.saudacao,
        livros: []
      }
    }

    // ==========================================
    // AJUDA
    // ==========================================

    if (
      msg.includes('ajuda') ||
      msg.includes('o que voce pode fazer') ||
      msg.includes('como voce pode ajudar')
    ) {
      return {
        texto: respostasGerais.ajuda,
        livros: []
      }
    }

    // ==========================================
    // MAIS VENDIDOS
    // ==========================================

    if (
      msg.includes('mais vendido') ||
      msg.includes('mais vendidos') ||
      msg.includes('popular') ||
      msg.includes('populares') ||
      msg.includes('mais avaliado') ||
      msg.includes('mais avaliados')
    ) {
      const livros = [...livros_mock]
        .sort((a, b) => b.avaliacoes - a.avaliacoes)
        .slice(0, 3)

      return {
        texto: respostasGerais.maisVendidos,
        livros
      }
    }

    // ==========================================
    // PREÇO
    // ==========================================

    if (
      msg.includes('barato') ||
      msg.includes('baratos') ||
      msg.includes('mais barato') ||
      msg.includes('menor preco') ||
      msg.includes('menor preço') ||
      msg.includes('preco') ||
      msg.includes('preço') ||
      msg.includes('desconto')
    ) {
      const livros = [...livros_mock]
        .sort((a, b) => a.preco - b.preco)
        .slice(0, 3)

      return {
        texto: respostasGerais.baratos,
        livros
      }
    }

    // ==========================================
    // CATEGORIAS
    // ==========================================

    const categoriaEncontrada = encontrarCategoria(msg)

    if (categoriaEncontrada) {
      const [categoria, dados] = categoriaEncontrada

      const livros = buscarLivrosPorCategoria(categoria)

      return {
        texto:
          livros.length > 0
            ? dados.resposta
            : `No momento não encontrei livros disponíveis na categoria ${categoria}.`,
        livros
      }
    }

    // ==========================================
    // BUSCA POR TÍTULO OU AUTOR
    // ==========================================

    const busca = livros_mock.filter((livro) => {
      const titulo = normalizarTexto(livro.titulo)
      const autor = normalizarTexto(livro.autor)

      return (
        titulo.includes(msg) ||
        autor.includes(msg)
      )
    })

    if (busca.length > 0) {
      return {
        texto: `🔎 Encontrei ${busca.length} resultado(s) para "${mensagem}":`,
        livros: busca.slice(0, 3)
      }
    }

    // ==========================================
    // RECOMENDAÇÃO GERAL
    // ==========================================

    if (
      msg.includes('recomende') ||
      msg.includes('recomendacao') ||
      msg.includes('recomendacoes') ||
      msg.includes('indique') ||
      msg.includes('sugestao') ||
      msg.includes('sugestoes') ||
      msg.includes('quero ler')
    ) {
      const livros = [...livros_mock]
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)

      return {
        texto: respostasGerais.recomendacoes,
        livros
      }
    }

    // ==========================================
    // NENHUM RESULTADO
    // ==========================================

    const livros = [...livros_mock]
      .sort((a, b) => b.avaliacoes - a.avaliacoes)
      .slice(0, 3)

    return {
      texto: respostasGerais.nenhumResultado(mensagem),
      livros
    }
  }
}