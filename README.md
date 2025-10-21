# Quiz Inclusivo • React + Vite + Tailwind + VLibras

Painel **Admin** (CRUD) e **Usuário** (jogar quiz) com acessibilidade e VLibras integrado.

## Rodando
```bash
npm install
npm run dev
# abra o link do Vite
```
> O botão do VLibras aparece automaticamente (círculo com mão) no canto da página após carregar.

## Páginas
- `/` Home
- `/admin` Painel Admin (criar/editar/excluir quizzes)
- `/user` Painel do Usuário (lista e execução)

## Notas de acessibilidade
- Alto contraste (botão no painel do usuário).
- Leitura de perguntas (Web Speech API).
- VLibras carregado por componente React (`VLibrasProvider`).
