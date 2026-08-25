# 🚀 Guia de Setup Local - LivroFácil Frontend

Este guia vai ajudá-lo a rodar o projeto localmente sem erros.

## Pré-requisitos

- **Node.js**: v18+ ([Download](https://nodejs.org/))
- **npm**: v10+ (vem com Node.js)
- **Git**: ([Download](https://git-scm.com/))

## Passo 1: Clonar o Repositório

```bash
git clone https://github.com/gabrielarabello29-web/livrofacil-frontend.git
cd livrofacil-frontend
```

## Passo 2: Verificar a Branch Correta

```bash
git checkout feature/estrutura-front
```

## Passo 3: Instalar as Dependências

```bash
npm install
```

Se encontrar erros de permissão, tente:
```bash
npm install --no-optional
```

## Passo 4: Configurar Variáveis de Ambiente

Copie o arquivo de exemplo:
```bash
cp .env.example .env.local
```

O arquivo `.env.local` já vem pré-configurado para desenvolvimento local.

## Passo 5: Rodar o Servidor de Desenvolvimento

```bash
npm run dev
```

Você verá uma mensagem como:
```
  VITE v8.0.5  ready in 234 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

Abra `http://localhost:5173/` no seu navegador! 🎉

## 📝 Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento (com hot reload) |
| `npm run build` | Cria build para produção |
| `npm run preview` | Visualiza build de produção localmente |
| `npm run format` | Formata código com oxfmt |

## 🔧 Troubleshooting

### Erro: "Cannot find module '.figma/make/site.json'"
✅ **Resolvido**: Atualizamos o `vite.config.ts` para tornar este arquivo opcional.

### Erro: "Port 5173 is already in use"
Mude a porta no `.env.local`:
```
PORT=3000
```

Depois rode `npm run dev` novamente.

### Erro: "ENOENT: no such file or directory"
Tente limpar o cache:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Página em branco ou erro de compilação
1. Verifique o console do navegador (F12 → Console)
2. Verifique o terminal onde rodou `npm run dev`
3. Tente um hard refresh: `Ctrl+Shift+R` (ou `Cmd+Shift+R` no Mac)

## 📦 Dependências Principais

- **React 19**: Framework UI
- **Vite 8**: Build tool e dev server
- **Tailwind CSS 4**: Utility-first CSS framework
- **React Router 7**: Roteamento
- **Recharts 3**: Gráficos

## 📁 Estrutura do Projeto

```
livrofacil-frontend/
├── src/
│   ├── components/     # Componentes React reutilizáveis
│   ├── pages/          # Páginas da aplicação
│   ├── App.tsx         # Componente raiz
│   └── main.tsx        # Ponto de entrada
├── index.html          # HTML principal
├── vite.config.ts      # Configuração do Vite
├── tailwind.config.ts  # Configuração do Tailwind
├── package.json        # Dependências
└── tsconfig.json       # Configuração TypeScript
```

## 🎨 Desenvolvendo com Figma

Para usar componentes sincronizados com Figma:

1. Mantenha `FIGMA_ENABLED=false` no `.env.local` para desenvolvimento local
2. Os estilos do Figma já estão incorporados nos componentes (via Tailwind)
3. Para sincronizar mudanças do Figma, use a plataforma oficial

## ❓ Perguntas Frequentes

**P: Posso usar outras portas?**  
R: Sim! Mude `PORT` no `.env.local`

**P: Como adiciono um novo componente?**  
R: Crie em `src/components/` e importe em sua página

**P: Funciona sem internet?**  
R: Não, algumas dependências precisam de download inicial. Após `npm install`, funciona offline.

## 🤝 Próximos Passos

1. ✅ Verifique se a app está rodando em `http://localhost:5173/`
2. 📝 Explore a estrutura em `src/`
3. 🎨 Customize componentes conforme precisar
4. 🚀 Quando pronto, faça build: `npm run build`

## 📞 Ajuda

Se continuar com problemas, verifique:
- [ ] Node.js está na versão 18+? `node --version`
- [ ] npm está na versão 10+? `npm --version`
- [ ] Deletou `node_modules` e fez `npm install` novamente?
- [ ] Está na branch correta? `git branch`
- [ ] `.env.local` existe? `ls .env.local`

---

**Bom desenvolvimento! 🚀**
