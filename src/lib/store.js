export const store = {
  get(key, def){
    try { return JSON.parse(localStorage.getItem(key)) ?? def } catch { return def }
  },
  set(key, value){ localStorage.setItem(key, JSON.stringify(value)) }
}

export function seed(){
  const existing = store.get('quizzes', [])
  if(existing && existing.length) return
  store.set('quizzes', [
    {
      id:'demo-1',
      title:'Noções de Acessibilidade',
      description:'Boas práticas de inclusão digital para PCDs.',
      timePerQuestion: 20,
      questions:[
        { q:'Qual atalho ativa o NVDA?', opts:['Ctrl+Alt+L','Ctrl+Alt+N','Ctrl+Alt+S','Ctrl+Alt+P'], correct:1},
        { q:'Atributo essencial em imagens para leitores de tela:', opts:['title','alt','name','desc'], correct:1},
        { q:'WCAG significa:', opts:['World Content Access Guide','Web Content Accessibility Guidelines','Wide Content Accessibility Group','Web Compliance and Access Guide'], correct:1}
      ]
    }
  ])
}
