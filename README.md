# Plataforma Inclusiva — SFTIC

> Software como Agente de Dignidade — uma plataforma web acessível desenvolvida como Trabalho de Conclusão de Curso, pensada para promover autonomia e inclusão digital através de jogos e atividades acessíveis.

![status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)
![licença](https://img.shields.io/badge/licença-acadêmico-blue)
![acessibilidade](https://img.shields.io/badge/WCAG-2.1%20AA-2F6FED)

---

## 📖 Sobre o projeto

A **Plataforma Inclusiva** é uma aplicação web desenvolvida como Trabalho de Conclusão de Curso do curso de Engenharia de Software do Uni-FACEF, sob orientação do Prof. Me. Márcio Maestrelo Funes, em parceria com a SFITC.

O projeto nasceu da ideia de que acessibilidade não deve ser um ajuste posterior, mas um alicerce do desenvolvimento de software. A plataforma reúne jogos e atividades educativas construídos desde o início com foco em leitores de tela, navegação por teclado e feedback sonoro, permitindo que pessoas com deficiência visual e outras necessidades de acessibilidade utilizem a ferramenta com autonomia real.

## ✨ Funcionalidades

- 🎮 **Jogos acessíveis**: Quiz, Jogo da Memória, Forca, Intruso e Quebra-Cabeça, todos navegáveis por teclado e com narração em tempo real
- 🔊 **Sistema de leitura por voz (TTS)**: anúncios contextuais de cada ação, com preferência de ativação salva pelo usuário
- ⌨️ **Navegação 100% por teclado**: roving tabindex, atalhos e comandos anunciados em cada tela
- 🧑‍💼 **Painel administrativo**: métricas de uso, filtros por período, exportação em CSV, busca de usuários e gráficos de desempenho por jogo
- 🔐 **Autenticação simples para participantes** (apenas nome, sem senha) e autenticação protegida para a equipe administrativa via Firebase
- 📊 **Registro de sessões**: cada partida é registrada no banco de dados e alimenta as métricas de assertividade do painel

## 🛠️ Tecnologias

**Frontend**
- React + Vite
- React Router
- Tailwind CSS

**Backend**
- Node.js + Express
- PostgreSQL
- Firebase Authentication (equipe/admin)
- Swagger / OpenAPI (documentação dos endpoints)

## 📂 Estrutura do projeto
Plataforma-SFTIC/
├── src/
│ ├── pages/ # Telas: Landing, UserLogin, Quiz, Memory, Forca, Admin...
│ ├── lib/ # api.js, player.js, speech.js, store.js
│ └── assets/
├── server/
│ ├── routes/ # userRoutes, analyticsRoutes, ...
│ ├── controllers/ # analyticsController, ...
│ ├── middleware/ # auth.js (verifyToken, requireAdmin)
│ └── db.js
└── README.md


## 🚀 Como rodar localmente

### Pré-requisitos
- Node.js 18+
- PostgreSQL

### Backend

```bash
cd server
npm install
```

Crie um arquivo `.env` na pasta `server/` com as variáveis do seu banco e do Firebase (URL do banco, credenciais do Firebase Admin, porta do servidor).

```bash
npm run dev
```

A documentação interativa da API fica disponível em `/api-docs` (Swagger).

### Frontend

```bash
npm install
npm run dev
```

A aplicação estará disponível em `http://localhost:5173` (ou na porta indicada pelo Vite).

## ♿ Acessibilidade

O desenvolvimento seguiu as diretrizes **WCAG 2.1 nível AA**, com testes de compatibilidade com o leitor de tela **NVDA**. Cada tela conta com:

- Anúncios sonoros (`aria-live`) sincronizados com a narração por voz
- Rótulos (`aria-label`) descritivos em todos os elementos interativos
- Foco gerenciado manualmente nas transições entre telas
- Contraste de cores validado

## 👩‍💻 Autora

**Agnyh Helena B. R. B. de Souza**
Engenharia de Software — Uni-FACEF
Orientação: Prof. Me. Márcio Maestrelo Funes

## 📄 Licença

Projeto acadêmico desenvolvido para fins de Trabalho de Conclusão de Curso.
