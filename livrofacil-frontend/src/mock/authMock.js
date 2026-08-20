import { usuarios } from './usuarios'

export function autenticar(email, senha) {
  const usuario = usuarios.find(
    (u) => u.email === email && u.senha === senha
  )
  if (!usuario) return { sucesso: false, mensagem: 'E-mail ou senha incorretos.' }
  const { senha: _, ...usuarioSemSenha } = usuario
  return { sucesso: true, usuario: usuarioSemSenha }
}

export function cadastrar(dados) {
  const existe = usuarios.find((u) => u.email === dados.email)
  if (existe) return { sucesso: false, mensagem: 'E-mail já cadastrado.' }
  const novo = {
    id: usuarios.length + 1,
    ...dados,
    perfil: 'CLIENTE',
    avatar: null,
    enderecos: [],
    cartoes: [],
  }
  usuarios.push(novo)
  const { senha: _, ...semSenha } = novo
  return { sucesso: true, usuario: semSenha }
}
