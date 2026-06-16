import React, { useEffect, useMemo, useState } from 'react';
import roadmap from './data/roadmap.json';
import questions from './data/questions.json';
import flashcards from './data/flashcards.json';
import './style.css';

const STORAGE_KEY = 'secplus701-progress-v3';
const defaultProgress = { lessons:{}, attempts:[], weak:{}, xp:0 };
function loadProgress(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress;
    const parsed = JSON.parse(raw);
    return { ...defaultProgress, ...parsed, lessons: parsed.lessons || {}, weak: parsed.weak || {}, attempts: parsed.attempts || [] };
  } catch { return defaultProgress; }
}
function saveProgress(p){ try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch {} }
function shuffle(a){ return [...a].sort(()=>Math.random()-0.5); }
function percent(a,b){ return b ? Math.round((a/b)*100) : 0; }

class ErrorBoundary extends React.Component{
  constructor(props){ super(props); this.state={error:null}; }
  static getDerivedStateFromError(error){ return {error}; }
  render(){
    if(this.state.error){
      return <main className="app"><section className="card danger"><h1>App loading error</h1><p>The site loaded, but React hit an error.</p><pre>{String(this.state.error?.message || this.state.error)}</pre><p>Try clearing browser site data/localStorage, then reload.</p><button onClick={()=>{localStorage.clear(); location.reload();}}>Clear local progress and reload</button></section></main>;
    }
    return this.props.children;
  }
}

function CoreApp(){
  const safeRoadmap = Array.isArray(roadmap) ? roadmap : [];
  const safeQuestions = Array.isArray(questions) ? questions : [];
  const safeFlashcards = Array.isArray(flashcards) ? flashcards : [];

  const [tab,setTab] = useState('learn');
  const [progress,setProgress] = useState(loadProgress);
  const [activeLesson,setActiveLesson] = useState(null);
  const [lessonStage,setLessonStage] = useState('read');
  const [answers,setAnswers] = useState({});
  const [quiz,setQuiz] = useState([]);
  const [qIndex,setQIndex] = useState(0);
  const [selected,setSelected] = useState(null);
  const [checked,setChecked] = useState(false);
  const [score,setScore] = useState(0);
  const [card,setCard] = useState(0);
  const [showBack,setShowBack] = useState(false);

  useEffect(()=>saveProgress(progress),[progress]);

  const lessons = useMemo(()=>safeRoadmap.flatMap(unit => (unit.lessons||[]).map(l => ({...l, unitId:unit.id, unitTitle:unit.title, unitColor:unit.color, unitEmoji:unit.emoji}))), [safeRoadmap]);
  const completed = lessons.filter(l=>progress.lessons?.[l.id]?.completed).length;
  const completion = percent(completed, lessons.length);
  const weak = Object.entries(progress.weak || {}).sort((a,b)=>b[1]-a[1]);

  function isLessonUnlocked(unitIndex, lessonIndex){
    if(unitIndex === 0 && lessonIndex === 0) return true;
    if(lessonIndex > 0){
      const prev = safeRoadmap[unitIndex].lessons[lessonIndex-1];
      return !!progress.lessons?.[prev.id]?.completed;
    }
    const prevUnit = safeRoadmap[unitIndex-1];
    return !!prevUnit && (prevUnit.lessons||[]).every(l=>progress.lessons?.[l.id]?.completed);
  }
  function openLesson(lesson){ setActiveLesson(lesson); setLessonStage('read'); setAnswers({}); setTab('lesson'); }
  function finishLesson(){
    let right = 0;
    (activeLesson.quiz||[]).forEach((q,i)=>{ if(answers[i] === q.answerIndex) right++; });
    const s = percent(right, (activeLesson.quiz||[]).length);
    const passed = s >= 70;
    setProgress(p=>({ ...p, xp: p.xp + (passed && !p.lessons?.[activeLesson.id]?.completed ? (activeLesson.xp||10) : 0), lessons:{...(p.lessons||{}), [activeLesson.id]:{completed:passed, score:s}} }));
    setLessonStage(passed ? 'passed' : 'failed');
  }
  function startPractice(count=20){
    setQuiz(shuffle(safeQuestions).slice(0, Math.min(count, safeQuestions.length)));
    setQIndex(0); setSelected(null); setChecked(false); setScore(0); setTab('quiz');
  }
  function submitQuiz(){
    const q = quiz[qIndex];
    if(selected === null || !q) return;
    const correct = selected === q.answerIndex;
    setChecked(true); if(correct) setScore(s=>s+1);
    setProgress(p=>({ ...p, attempts:[...(p.attempts||[]), {id:q.id, correct, at:new Date().toISOString()}], weak:{...(p.weak||{}), [q.domain || 'Review']:(p.weak?.[q.domain || 'Review']||0)+(correct?0:1)} }));
  }
  function nextQuiz(){
    if(qIndex+1 < quiz.length){ setQIndex(i=>i+1); setSelected(null); setChecked(false); }
    else setTab('dashboard');
  }

  if(!safeRoadmap.length || !safeQuestions.length){
    return <main className="app"><section className="card danger"><h1>Missing data files</h1><p>Check that these files exist exactly:</p><pre>src/data/roadmap.json\nsrc/data/questions.json\nsrc/data/flashcards.json</pre></section></main>;
  }

  const current = quiz[qIndex];

  return <main className="app">
    <header className="hero"><div><h1>🔐 Security+ SY0-701 Academy</h1><p>Topic roadmap, lessons, mini-quizzes, flashcards, and exam practice.</p></div><div className="pill"><b>{progress.xp || 0} XP</b><span>{completion}% complete</span></div></header>
    <nav className="tabs">
      <button className={tab==='learn'?'active':''} onClick={()=>setTab('learn')}>Roadmap</button>
      <button className={tab==='dashboard'?'active':''} onClick={()=>setTab('dashboard')}>Dashboard</button>
      <button onClick={()=>startPractice(20)}>Practice</button>
      <button onClick={()=>startPractice(100)}>100Q Exam</button>
      <button className={tab==='flashcards'?'active':''} onClick={()=>setTab('flashcards')}>Flashcards</button>
      <button className={tab==='weak'?'active':''} onClick={()=>setTab('weak')}>Weak Areas</button>
    </nav>

    {tab==='learn' && <section>
      <div className="card"><h2>Completion Roadmap</h2><div className="bar"><i style={{width:`${completion}%`}} /></div><p>{completed}/{lessons.length} lessons completed</p></div>
      {safeRoadmap.map((unit,ui)=><div className="unit card" key={unit.id} style={{borderColor: unit.color || '#136f63'}}>
        <h2>{unit.emoji} {unit.title}</h2><p>{unit.description}</p>
        <div className="path">{(unit.lessons||[]).map((l,li)=>{
          const unlocked = isLessonUnlocked(ui,li);
          const done = progress.lessons?.[l.id]?.completed;
          return <button key={l.id} disabled={!unlocked} className={`node ${done?'done':''}`} onClick={()=>openLesson({...l, unitTitle:unit.title})}><span>{done?'✅':unlocked?'▶️':'🔒'}</span><b>{l.title}</b><small>{l.minutes} min • {l.xp} XP</small></button>
        })}</div>
      </div>)}
    </section>}

    {tab==='lesson' && activeLesson && <section className="card"><button onClick={()=>setTab('learn')}>← Back</button><h2>{activeLesson.title}</h2>
      {lessonStage==='read' && <><p className="lead">{activeLesson.summary}</p><ul>{(activeLesson.bullets||[]).map(b=><li key={b}>{b}</li>)}</ul><button onClick={()=>setLessonStage('quiz')}>Take mini quiz</button></>}
      {lessonStage==='quiz' && <>{(activeLesson.quiz||[]).map((q,qi)=><div className="mini" key={q.q}><h3>{qi+1}. {q.q}</h3>{q.options.map((o,oi)=><label className="option" key={o}><input type="radio" checked={answers[qi]===oi} onChange={()=>setAnswers({...answers,[qi]:oi})}/>{o}</label>)}</div>)}<button onClick={finishLesson}>Finish lesson</button></>}
      {lessonStage==='passed' && <div className="result"><h2>🎉 Complete!</h2><p>You earned XP and unlocked the next lesson.</p><button onClick={()=>setTab('learn')}>Back to Roadmap</button></div>}
      {lessonStage==='failed' && <div className="result"><h2>Try again</h2><p>You need 70% to complete the lesson.</p><button onClick={()=>setLessonStage('read')}>Review Again</button></div>}
    </section>}

    {tab==='dashboard' && <section className="card"><h2>Dashboard</h2><div className="grid"><div><b>{completion}%</b><span>Complete</span></div><div><b>{completed}/{lessons.length}</b><span>Lessons</span></div><div><b>{progress.xp||0}</b><span>XP</span></div></div></section>}

    {tab==='quiz' && current && <section className="card"><h2>Question {qIndex+1}/{quiz.length}</h2><p className="lead">{current.question}</p>{current.options.map((o,i)=><label className={`option ${checked && i===current.answerIndex?'right':''} ${checked && selected===i && i!==current.answerIndex?'wrong':''}`} key={o}><input disabled={checked} type="radio" checked={selected===i} onChange={()=>setSelected(i)}/>{String.fromCharCode(65+i)}. {o}</label>)}{!checked?<button onClick={submitQuiz}>Submit</button>:<div className="explain"><h3>{selected===current.answerIndex?'✅ Correct':'❌ Incorrect'}</h3><p>{current.explanation}</p><button onClick={nextQuiz}>{qIndex+1<quiz.length?'Next':'Finish'}</button></div>}</section>}

    {tab==='flashcards' && <section className="card"><h2>Flashcards</h2><div className="bigcard" onClick={()=>setShowBack(!showBack)}>{safeFlashcards.length ? (showBack?safeFlashcards[card%safeFlashcards.length].back:safeFlashcards[card%safeFlashcards.length].front) : 'No flashcards found'}</div><button onClick={()=>{setCard(c=>c+1);setShowBack(false)}}>Next</button></section>}
    {tab==='weak' && <section className="card"><h2>Weak Areas</h2>{weak.length?weak.map(([d,n])=><p key={d}><b>{d}</b>: {n} missed</p>):<p>No weak areas yet.</p>}</section>}
  </main>
}

export default function App(){ return <ErrorBoundary><CoreApp /></ErrorBoundary>; }
