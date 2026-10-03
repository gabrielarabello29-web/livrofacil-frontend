import Header from '@/shared/components/Header'
import Footer from '@/shared/components/Footer'
import LivroCard from '@/features/livros/components/LivroCard'
import { useFavoritos } from '../context/FavoritosContext'

export default function Favoritos() {
  const { favoritos } = useFavoritos()

  return (
    <div>
      <Header />
      <main className="page-container" style={{ paddingTop: 32, paddingBottom: 80 }}>
        <h1>Meus favoritos</h1>
        {favoritos.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>Você ainda não adicionou livros aos favoritos.</p> : <div className="book-grid">{favoritos.map((livro) => <LivroCard key={livro.id} livro={livro} />)}</div>}
      </main>
      <Footer />
    </div>
  )
}
