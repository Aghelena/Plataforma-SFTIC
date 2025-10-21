import Topbar from '../components/Topbar.jsx'
import { store } from '../lib/store.js'
import { useEffect, useState } from 'react'

function speak(text){
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'pt-BR'
  window.speechSynthesis.speak(u)
}

/* normaliza perguntas para garantir correct como número */
function normalizeQuiz(qz) {
  return {
    ...qz,
    questions: (qz.questions || []).map(p => ({ ...p, correct: Number(p.correct) }))
  }
}

/* lê quizzes do localStorage com fallback ao store.get */
function readQuizzes() {
  try {
    const raw = localStorage.getItem('quizzes')
    if (raw) {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed.map(normalizeQuiz) : []
    }
  } catch (e) {
    // ignora e cai no store
  }
  const fromStore = store.get('quizzes', [])
  return Array.isArray(fromStore) ? fromStore.map(normalizeQuiz) : []
}

/* -------- Dialog genérico para pop-ups -------- */
function Dialog({ open, title, children, actions, onClose }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="card w-full max-w-lg p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          <button className="text-slate-400 hover:text-white" onClick={onClose} aria-label="Fechar">✕</button>
        </div>
        <div className="mt-3 text-slate-200">{children}</div>
        <div className="mt-4 flex items-center justify-end gap-2">
          {actions}
        </div>
      </div>
    </div>
  )
}

export default function User(){
  // carrega e mantém sincronizado com o localStorage
  const [quizzes, setQuizzes] = useState([])
  useEffect(() => {
    const load = () => setQuizzes(readQuizzes())
    load()
    // atualiza ao focar a aba, ao mudar o localStorage, e quando o Admin avisar
    window.addEventListener('focus', load)
    window.addEventListener('storage', load)
    window.addEventListener('quizzes-updated', load)
    return () => {
      window.removeEventListener('focus', load)
      window.removeEventListener('storage', load)
      window.removeEventListener('quizzes-updated', load)
    }
  }, [])

  const [current, setCurrent] = useState(null)
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const [reading, setReading] = useState(false)

  /* pop-ups: prévia e resultado */
  const [preview, setPreview] = useState(null) // { title, lines: string[] }
  const [result, setResult] = useState(null)   // { title, text }

  useEffect(()=>{
    if(!current) return
    setRemaining(current.timePerQuestion)
    const t = setInterval(()=> setRemaining(r => {
      if(r<=1){ clearInterval(t); next() }
      return r-1
    }), 1000)
    if(reading){
      const q = current.questions[idx]
      speak(`Questão ${idx+1}. ${q.q}. Opções: ${q.opts.join(', ')}`)
    }
    return ()=> clearInterval(t)
  // eslint-disable-next-line
  }, [current, idx])

  function start(id){
    const qz = quizzes.find(q=>q.id===id); if(!qz) return
    setCurrent(normalizeQuiz(qz)); setIdx(0); setScore(0)
  }

  function answer(i){
    const q = current.questions[idx]
    if (i === Number(q.correct)) setScore(s => s+1)
    next()
  }

  function next(){
    if(idx+1 >= current.questions.length){
      const scores = store.get('scores', [])
      scores.push({ quizId: current.id, title: current.title, when: new Date().toISOString(), score, total: current.questions.length })
      store.set('scores', scores)
      setResult({ title: 'Resultado', text: `Você acertou ${score} de ${current.questions.length}` }) // em vez de alert()
      setCurrent(null); setIdx(0)
    } else {
      setIdx(i=>i+1)
    }
  }

  const history = store.get('scores', []).slice(-20).reverse()

  return (
    <div className="min-h-screen">
      <Topbar />
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {!current && (
          <section>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold mb-3">Quizzes disponíveis</h2>
              <div className="flex gap-2 items-center">
                <button className="px-2 py-1 rounded bg-slate-800" onClick={()=>document.body.classList.toggle('hc')}>Alto Contraste</button>
                <button className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700" onClick={()=>setReading(v=>!v)}>{reading ? 'Leitor: ON' : 'Leitor: OFF'}</button>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {quizzes.map(q=>(
                <div key={q.id} className="card p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg font-semibold">{q.title}</h3>
                    <span className="stat-pill ok">{q.questions.length} questões</span>
                  </div>
                  <p className="text-slate-300 text-sm">{q.description||''}</p>
                  <div className="text-slate-400 text-xs">Tempo: {q.timePerQuestion}s</div>
                  <div className="mt-2 flex gap-2">
                    <button className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-700" onClick={()=>start(q.id)}>Iniciar</button>
                    <button
                      className="px-3 py-2 rounded bg-slate-700 hover:bg-slate-600"
                      onClick={()=>{
                        // em vez de alert() para prévia: pop-up com a lista
                        setPreview({
                          title: `Prévia — ${q.title}`,
                          lines: q.questions.map((x,i)=> `${i+1}. ${x.q}\n- ${x.opts.join('\n- ')}`)
                        })
                      }}
                    >
                      Prévia
                    </button>
                  </div>
                </div>
              ))}
              {quizzes.length === 0 && (
                <div className="text-slate-400">Nenhum quiz disponível ainda.</div>
              )}
            </div>

            <div className="card p-4 mt-6">
              <h3 className="font-semibold mb-2">Últimas pontuações</h3>
              <div className="overflow-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-left text-slate-400">
                    <tr className="border-b border-slate-700/50">
                      <th className="py-2 px-2">Quando</th>
                      <th className="py-2 px-2">Quiz</th>
                      <th className="py-2 px-2 text-center">Acertos</th>
                      <th className="py-2 px-2 text-center">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((s,i)=>(
                      <tr key={i} className="border-b border-slate-700/50">
                        <td className="py-2 px-2">{new Date(s.when).toLocaleString()}</td>
                        <td className="py-2 px-2">{s.title}</td>
                        <td className="py-2 px-2 text-center">{s.score}/{s.total}</td>
                        <td className="py-2 px-2 text-center">{Math.round(s.score/s.total*100)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {current && (
          <section className="card p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Questão {idx+1} de {current.questions.length}</h2>
              <div className="stat-pill warn">Tempo: {remaining}s</div>
            </div>
            <p className="mt-3 text-lg">{current.questions[idx].q}</p>
            <div className="grid md:grid-cols-2 gap-3 mt-4">
              {current.questions[idx].opts.map((op,i)=>(
                <button key={i} className="px-4 py-3 rounded bg-slate-800 hover:bg-slate-700 text-left" onClick={()=>answer(i)}>{'ABCD'[i]}) {op}</button>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* pop-up de prévia */}
      <Dialog
        open={!!preview}
        title={preview?.title || ''}
        onClose={()=> setPreview(null)}
        actions={<button className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700" onClick={()=>setPreview(null)}>Fechar</button>}
      >
        <div className="space-y-3 text-sm whitespace-pre-line">
          {preview?.lines?.map((ln, idx)=> <pre key={idx}>{ln}</pre>)}
        </div>
      </Dialog>

      {/* pop-up de resultado */}
      <Dialog
        open={!!result}
        title={result?.title || 'Resultado'}
        onClose={()=> setResult(null)}
        actions={<button className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700" onClick={()=>setResult(null)}>OK</button>}
      >
        <p>{result?.text}</p>
      </Dialog>
    </div>
  )
}
