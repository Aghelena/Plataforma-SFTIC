import { store } from '../lib/store.js'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Chart as ChartJS, LineElement, PointElement, LinearScale, CategoryScale, ArcElement, Tooltip, Legend } from 'chart.js'
import { Line, Doughnut } from 'react-chartjs-2'

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, ArcElement, Tooltip, Legend)

function Radial({ percent=76 }){
  const r = 15
  const circ = 2*Math.PI*r
  const offset = circ*(1 - percent/100)
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
        <circle cx="18" cy="18" r={r} strokeWidth="4" fill="none" className="stroke-slate-600/30"></circle>
        <circle cx="18" cy="18" r={r} strokeWidth="4" fill="none" className="stroke-green-500" style={{strokeDasharray:circ, strokeDashoffset:offset}}></circle>
      </svg>
      <div>
        <div className="text-2xl font-bold">{percent}%</div>
        <div className="text-slate-400 text-sm">Uso de memória</div>
      </div>
    </div>
  )
}

/* -------- Dialog genérico para pop-ups -------- */
function Dialog({ open, title, children, actions, onClose }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="card w-full max-w-md p-4">
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

export default function Admin(){
  const [quizzes, setQuizzes] = useState(()=> store.get('quizzes', []))
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ id:'', title:'', description:'', timePerQuestion:20, questions:[] })

  /* estados para pop-ups */
  const [info, setInfo] = useState(null)        // { title, message }
  const [confirmDel, setConfirmDel] = useState(null) // { id, title, message }

  useEffect(() => {
    const fixed = store.get('quizzes', []).map(qz => ({
      ...qz,
      questions: (qz.questions || []).map(p => ({ ...p, correct: Number(p.correct) }))
    }))
    store.set('quizzes', fixed)
    setQuizzes(fixed)
  }, [])

  /* >>> ADIÇÃO: sempre que 'quizzes' mudar, persiste no store e avisa a outra tela <<< */
  useEffect(() => {
    store.set('quizzes', quizzes)
    window.dispatchEvent(new Event('quizzes-updated'))
  }, [quizzes])

  // const activityData = useMemo(()=> ({
  //   labels:['2018','2019','2020','2021','2022','2023','2024','2025'],
  //   datasets:[{ label:'Sessões', data:[7,4,3,5,4,4,5,6], borderWidth:3, tension:.3 }]
  // }),[])

  const doughnutData = useMemo(()=> ({
    labels:['Acertos','Erros'],
    datasets:[{ data:[72,28] }]
  }),[])

  function resetForm(){ setForm({ id:'', title:'', description:'', timePerQuestion:20, questions:[] }) }
  function addQuestion(){ setForm(f=>({...f, questions:[...f.questions, { q:'', opts:['','','',''], correct:0 }]})) }
  function updateQuestion(i, patch){ setForm(f=>{ const qs=[...f.questions]; qs[i]={...qs[i], ...patch}; return {...f, questions:qs} }) }

  function editQuiz(id){
    const q = quizzes.find(x=>x.id===id); if(!q) return
    setForm(q); setModalOpen(true)
  }
  function removeQuiz(id){
    /* em vez de confirm(): abre pop-up de confirmação */
    setConfirmDel({
      id,
      title: 'Excluir quiz?',
      message: 'Tem certeza que deseja excluir este quiz? Esta ação não pode ser desfeita.'
    })
  }
  function saveQuiz(){
    if(!form.title || form.questions.length===0){
      /* em vez de alert(): pop-up informativo */
      setInfo({ title: 'Atenção', message: 'Preencha título e pelo menos 1 pergunta.' })
      return
    }
    const data = {
      ...form,
      // normaliza para número antes de salvar
      questions: form.questions.map(p => ({ ...p, correct: Number(p.correct) })),
      id: form.id || (Date.now().toString(36))
    }
    setQuizzes(list=>{
      const idx = list.findIndex(x=>x.id===form.id)
      if(idx>=0){ const copy=[...list]; copy[idx]=data; return copy }
      return [...list, data]
    })
    setModalOpen(false); resetForm()
  }

  return (
    <>
      <div className="min-h-screen">
        <main className="max-w-7xl mx-auto px-4 py-6 space-y-4">
          {/* Activity */}
          {/* <section className="card p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Atividade</h2>
              <button className="px-2 py-1 text-xs rounded bg-slate-800">⚙</button>
            </div>
            <div className="mt-3"><Line options={{ plugins:{legend:{display:false}}, scales:{x:{grid:{display:false}}, y:{beginAtZero:true, ticks:{stepSize:1}}}}} data={activityData} /></div>
          </section> */}

          {/* Stats */}
          {/* <section className="grid md:grid-cols-4 gap-4">
            <div className="card p-4"><div className="flex items-center justify-between"><div className="stat-pill warn">LIVE 15%</div><div className="text-slate-400 text-sm">Projetos</div></div><div className="text-3xl font-bold mt-2">837</div></div>
            <div className="card p-4"><Radial percent={78} /></div>
            <div className="card p-4"><div className="flex items-center justify-between"><div className="stat-pill danger">-40%</div><div className="text-slate-400 text-sm">Visitantes hoje</div></div><div className="text-3xl font-bold mt-2">976</div></div>
            <div className="card p-4"><div className="flex items-center justify-between"><div className="stat-pill ok">94%</div><div className="text-slate-400 text-sm">Sessões mensais</div></div><div className="text-3xl font-bold mt-2">3922</div></div>
          </section> */}

          {/* <section className="grid md:grid-cols-2 gap-4">
            <div className="card p-4">
              <h3 className="font-semibold mb-2">Daily Sales</h3>
              <Doughnut data={doughnutData} options={{ plugins:{ legend:{ position:'bottom' }}}} />
            </div>
          </section> */}

          <section>
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Quizzes <span className="text-slate-400 text-sm">({quizzes.length})</span></h3>
                <button className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-700" onClick={()=>{resetForm(); setModalOpen(true)}}>Novo Quiz</button>
              </div>
              <div className="overflow-auto mt-3">
                <table className="min-w-full text-sm">
                  <thead className="text-left text-slate-400">
                    <tr className="border-b border-slate-700/50">
                      <th className="py-2 px-2">#</th>
                      <th className="py-2 px-2">Título</th>
                      <th className="py-2 px-2 hidden md:table-cell">Descrição</th>
                      <th className="py-2 px-2 text-center">Perguntas</th>
                      <th className="py-2 px-2 text-center">Tempo</th>
                      <th className="py-2 px-2">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quizzes.map((q, i)=>(
                      <tr key={q.id} className="border-b border-slate-700/50">
                        <td className="py-2 px-2">{i+1}</td>
                        <td className="py-2 px-2">{q.title}</td>
                        <td className="py-2 px-2 hidden md:table-cell">{q.description||'-'}</td>
                        <td className="py-2 px-2 text-center">{q.questions.length}</td>
                        <td className="py-2 px-2 text-center">{q.timePerQuestion}s</td>
                        <td className="py-2 px-2">
                          <div className="flex gap-2">
                            <button className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700" onClick={()=>editQuiz(q.id)}>Editar</button>
                            <button className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-700" onClick={()=>removeQuiz(q.id)}>Excluir</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </main>

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/60 overflow-y-auto flex items-start justify-center py-8 px-4">
            <div className="card w-full max-w-3xl p-4 max-h-[90vh] overflow-y-auto overscroll-contain">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Criar/Editar Quiz</h3>
                <button className="text-slate-400 hover:text-white" onClick={()=>setModalOpen(false)}>✕</button>
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Título</label>
                  <input
                    value={form.title}
                    onChange={e=>setForm(f=>({...f, title:e.target.value}))}
                    className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700"
                    placeholder="Ex: Acessibilidade Web"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-1">Descrição</label>
                  <input
                    value={form.description}
                    onChange={e=>setForm(f=>({...f, description:e.target.value}))}
                    className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700"
                    placeholder="Resumo do tema"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Tempo por questão (s)</label>
                    <input
                      type="number"
                      value={form.timePerQuestion}
                      onChange={e=>setForm(f=>({...f, timePerQuestion:+e.target.value}))}
                      onWheel={(e)=> e.currentTarget.blur()}
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700"
                    />
                  </div>
                  <div className="md:col-span-2 flex items-end">
                    <button className="px-3 py-2 rounded bg-slate-700 hover:bg-slate-600" onClick={addQuestion}>
                      Adicionar pergunta
                    </button>
                  </div>
                </div>

                <ol className="space-y-3">
                  {form.questions.map((q, i)=>(
                    <li key={i} className="rounded-lg p-4 bg-slate-800/50 border border-slate-700">
                      <label className="block text-sm text-slate-300 mb-1">Pergunta</label>
                      <input
                        value={q.q}
                        onChange={e=>updateQuestion(i,{q:e.target.value})}
                        className="w-full mb-3 px-3 py-2 rounded bg-slate-900 border border-slate-700"
                        placeholder="Digite a pergunta"
                      />

                      {/* bloco único de opções com rádio + input (seleciona a correta) */}
                      <div className="space-y-2">
                        {q.opts.map((op, j)=>(
                          <div key={j} className="flex items-center gap-2">
                            {/* Radio para marcar a correta */}
                            <input
                              type="radio"
                              name={`correct-${i}`}           // um grupo por pergunta
                              checked={Number(q.correct) === j}
                              onChange={()=> updateQuestion(i, { correct: j })}
                              aria-label={`Marcar opção ${"ABCD"[j]} como correta`}
                              className="shrink-0"
                            />
                            <div className="flex-1">
                              <label className="block text-xs text-slate-400 mb-1">
                                Opção {"ABCD"[j]}
                              </label>
                              <input
                                value={op}
                                onChange={e=> updateQuestion(i, {
                                  opts: q.opts.map((o,k)=> k===j ? e.target.value : o)
                                })}
                                className={
                                  "w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 " +
                                  (Number(q.correct) === j ? "ring-2 ring-blue-600" : "")
                                }
                                placeholder={`Opção ${"ABCD"[j]}`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 flex items-center">
                        <button
                          className="ml-auto text-rose-400 hover:text-rose-300"
                          onClick={()=> setForm(f=>({...f, questions: f.questions.filter((_,k)=>k!==i)}))}
                        >
                          Remover
                        </button>
                      </div>
                    </li>
                  ))}
                </ol>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <button className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700" onClick={saveQuiz}>Salvar</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pop-up informativo (substitui alert) */}
      <Dialog
        open={!!info}
        title={info?.title||''}
        onClose={()=> setInfo(null)}
        actions={<button className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700" onClick={()=>setInfo(null)}>OK</button>}
      >
        <p>{info?.message}</p>
      </Dialog>

      {/* Pop-up de confirmação (substitui confirm) */}
      <Dialog
        open={!!confirmDel}
        title={confirmDel?.title||''}
        onClose={()=> setConfirmDel(null)}
        actions={
          <>
            <button className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600" onClick={()=> setConfirmDel(null)}>Cancelar</button>
            <button
              className="px-4 py-2 rounded bg-rose-600 hover:bg-rose-700"
              onClick={()=>{
                setQuizzes(q=> q.filter(x=> x.id !== confirmDel.id))
                setConfirmDel(null)
              }}
            >
              Excluir
            </button>
          </>
        }
      >
        <p>{confirmDel?.message}</p>
      </Dialog>
    </>
  )
}
