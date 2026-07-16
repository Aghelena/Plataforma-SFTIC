<div align="center">

# 🧠 Plataforma Inclusiva

### Software como Agente de Dignidade

Uma plataforma web de jogos terapêuticos, construída do zero com acessibilidade como requisito central — não como um extra.

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white&labelColor=20232a)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![WCAG 2.1](https://img.shields.io/badge/WCAG-2.1_AA-005A9C?logo=accessibility&logoColor=white)](https://www.w3.org/WAI/WCAG21/quickref/)
[![Deploy](https://img.shields.io/badge/Deploy-Render-46E3B7?logo=render&logoColor=white)](https://render.com/)
[![Licença](https://img.shields.io/badge/Licença-Acadêmica-lightgrey)](#-licença)

[Sobre](#-sobre-o-projeto) •
[Jogos](#-jogos-disponíveis) •
[Acessibilidade](#-acessibilidade) •
[Tecnologias](#️-tecnologias) •
[Como rodar](#-como-rodar-localmente) •
[Estrutura](#-estrutura-do-projeto)

</div>

---

## 📖 Sobre o Projeto

A **Plataforma Inclusiva** é um Trabalho de Conclusão de Curso que nasceu de uma pergunta simples e incômoda: por que a maioria das plataformas de estimulação cognitiva não pensa, desde o início, em pessoas com deficiência e idosos com dependência?

Este projeto é uma resposta prática a essa pergunta — uma plataforma de jogos terapêuticos onde a **navegação independente por leitor de tela, teclado e narração automática não é um recurso adicional, é a base de tudo.**

> *"Software como Agente de Dignidade"* — porque tecnologia acessível não é sobre compliance, é sobre devolver autonomia a quem sempre teve que se adaptar ao mundo, em vez de o mundo se adaptar a ela.

### 🎯 Objetivos

- Oferecer jogos de estimulação cognitiva **realmente jogáveis** por pessoas com deficiência visual, motora e cognitiva, e por idosos
- Validar, através de estudo de caso com protocolo de usabilidade, se o objetivo de **navegação 100% independente** é alcançado na prática
- Fornecer à terapeuta responsável um painel de acompanhamento de desempenho e evolução de cada usuário

---

## 🎮 Jogos Disponíveis

| Jogo | Estímulo trabalhado | Destaques de acessibilidade |
|---|---|---|
| 🧩 **Quiz Acessível** | Linguagem / Conhecimento | Narração de perguntas e alternativas, bloqueio sincronizado com a fala |
| 🃏 **Jogo da Memória** | Memória | 3 níveis de dificuldade, navegação por setas (roving tabindex) |
| 🔤 **Forca** | Linguagem | +160 palavras, sistema de dicas, teclado físico funcional |
| 🔍 **Encontre o Intruso** | Atenção | 17 categorias temáticas, posição do intruso sempre embaralhada |
| 🧩 **Quebra-Cabeça** | Raciocínio / Espacial | Alternativa 100% por teclado ao arrastar-e-soltar |

Todos os jogos compartilham o mesmo padrão de acessibilidade: **narração automática de comandos**, **bloqueio de ações sincronizado com o tempo de fala**, **foco gerenciado** e **compatibilidade nativa com NVDA e outros leitores de tela**.

---

## ♿ Acessibilidade

Este não é um projeto com "modo acessível" — a acessibilidade é a arquitetura.

- ✅ Conformidade **WCAG 2.1** auditada com cálculo real de contraste (não estimativa visual)
- ✅ Narração própria (TTS) sincronizada com leitores de tela nativos, sem sobreposição de vozes
- ✅ `aria-live`, `aria-label`, `aria-disabled` aplicados de forma consistente — nunca `disabled` nativo onde isso quebraria o fluxo de foco
- ✅ Navegação 100% por teclado em todas as telas, incluindo alternativas a interações de arrastar-e-soltar
- ✅ Testado com **NVDA**
- ✅ Protocolo de teste de usabilidade formal, com escala adaptada de nível de assistência e questionário **SUS** (System Usability Scale) traduzido e validado para português

📄 O style guide de cores e componentes, com cada combinação testada contra contraste mínimo WCAG, está documentado em [`docs/style-guide-sfitc.md`](./docs/style-guide-sfitc.md).

---

## 🛠️ Tecnologias

<div align="center">

| Camada | Tecnologia |
|---|---|
| **Frontend** | React.js + Vite, Tailwind CSS, React Router |
| **Backend** | Node.js, Express |
| **Banco de dados** | PostgreSQL |
| **Autenticação (admin)** | Firebase Authentication |
| **Hospedagem** | Render (frontend + backend + banco) |
| **Ícones** | Lucide React |

</div>

---

## 🚀 Como Rodar Localmente

### Pré-requisitos
- Node.js 18+
- PostgreSQL rodando localmente (ou uma connection string de um banco remoto)
- Uma conta no Firebase (para autenticação do painel admin)

### Passo a passo

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/plataforma-inclusiva.git
cd plataforma-inclusiva

# Instale as dependências do frontend
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Preencha DATABASE_URL, credenciais do Firebase, etc.

# Rode o servidor de desenvolvimento
npm run dev
```

A aplicação vai abrir em `http://localhost:5173` (ou a porta configurada pelo Vite).

### Backend

```bash
cd server
npm install
npm run dev
```

O backend cria as tabelas automaticamente na primeira execução (`CREATE TABLE IF NOT EXISTS`), sem necessidade de rodar migrations manuais.

---

## 📂 Estrutura do Projeto

```
plataforma-inclusiva/
├── src/
│   ├── pages/              # Telas principais (Landing, Quiz, Memory, Forca, Intruso, QuebraCabeca, Admin...)
│   ├── components/         # Componentes reutilizáveis (TtsToggleButton, etc.)
│   ├── lib/                # Lógica compartilhada (speech.js, player.js, store.js, api.js)
│   └── assets/             # Logos e imagens estáticas
├── server/                 # API Node.js + conexão PostgreSQL
├── docs/
│   └── style-guide-sfitc.md
└── README.md
```

---

## 👩‍🔬 Estudo de Caso

O projeto inclui um protocolo formal de teste de usabilidade, aplicado com participantes reais (idosos e pessoas com deficiência), medindo:

- **Taxa de conclusão de tarefas** de navegação independente
- **Nível de assistência necessário** (escala adaptada de 0 a 4, inspirada na lógica da Functional Independence Measure)
- **Pontuação SUS** (System Usability Scale, versão validada em português do Brasil)
- **Relatos qualitativos** coletados via protocolo de verbalização (think-aloud) adaptado

---

## 👤 Autoria

<div align="center">

**Agnyh Helena Souza**

TCC apresentado ao curso de Engenharia de Software/Computação — SFITC

Orientador: **Prof. Me. Márcio Maestrelo Funes**

</div>

---

## 📜 Licença

Projeto acadêmico desenvolvido para fins de Trabalho de Conclusão de Curso (TCC). Uso e reprodução sujeitos a autorização da autora.

---

<div align="center">

*Feito com dedicação, muitos testes de contraste de cor, e a convicção de que acessibilidade não é feature — é o mínimo.*

</div>
