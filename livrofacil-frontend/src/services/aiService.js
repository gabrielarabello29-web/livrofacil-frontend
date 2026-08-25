import { livros_mock } from './livroService'

const respostas_demo = {
  saudacao: 'Olá! Sou o Assistente LivroFácil. Posso ajudar você a encontrar o livro perfeito! O que você está procurando hoje?',
  ficção: 'Tenho ótimas sugestões de ficção para você!',
  negócios: 'Para negócios e finanças, temos excelentes opções:',
  autoajuda: 'Para desenvolvimento pessoal, recomendo:',
  default: 'Deixe-me buscar algumas sugestões para você!',
}

export const aiService = {
  obterRecomendacoes: async (categoria) => {
    const filtro = categoria
      ? livros_mock.filter(l => l.categoria.toLowerCase().includes(categoria.toLowerCase())).slice(0, 3)
      : livros_mock.sort(() => Math.random() - 0.5).slice(0, 3)
    return filtro
  },

  enviarMensagem: async (mensagem) => {
    await new Promise(r => setTimeout(r, 800))
    const msg = mensagem.toLowerCase()
    let texto = respostas_demo.default
    let livrosSugeridos = []

    if (msg.includes('oi') || msg.includes('olá') || msg.includes('bom dia')) {
      texto = respostas_demo.saudacao
    } else if (msg.includes('ficção') || msg.includes('ficao') || msg.includes('romance') || msg.includes('fantasia')) {
      texto = 'Ótima escolha! Veja algumas opções de ficção:'
      livrosSugeridos = livros_mock.filter(l => l.categoria === 'Ficção').slice(0, 3)
    } else if (msg.includes('negócio') || msg.includes('negocio') || msg.includes('finanç') || msg.includes('financ')) {
      texto = respostas_demo.negócios
      livrosSugeridos = livros_mock.filter(l => l.categoria === 'Negócios').slice(0, 3)
    } else if (msg.includes('autoajuda') || msg.includes('desenvolvimento') || msg.includes('hábito') || msg.includes('habito')) {
      texto = respostas_demo.autoajuda
      livrosSugeridos = livros_mock.filter(l => l.categoria === 'Desenvolvimento Pessoal').slice(0, 3)
    } else if (msg.includes('mais vendid') || msg.includes('popular') || msg.includes('recomend')) {
      texto = 'Aqui estão nossos livros mais populares:'
      livrosSugeridos = livros_mock.sort((a, b) => b.avaliacoes - a.avaliacoes).slice(0, 3)
    } else if (msg.includes('preço') || msg.includes('preco') || msg.includes('barato') || msg.includes('desconto')) {
      texto = 'Temos ótimas ofertas! Confira os livros com melhor custo-benefício:'
      livrosSugeridos = livros_mock.sort((a, b) => a.preco - b.preco).slice(0, 3)
    } else {
      const busca = livros_mock.filter(l =>
        l.titulo.toLowerCase().includes(msg) || l.autor.toLowerCase().includes(msg)
      )
      if (busca.length > 0) {
        texto = `Encontrei ${busca.length} resultado(s) para "${mensagem}":`
        livrosSugeridos = busca.slice(0, 3)
      } else {
        texto = `Não encontrei resultados específicos para "${mensagem}", mas posso sugerir nossos destaques:`
        livrosSugeridos = livros_mock.slice(0, 3)
      }
    }
    return { texto, livros: livrosSugeridos }
  },
}
