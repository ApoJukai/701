
import React, { useMemo, useState, useEffect } from 'react';
import roadmap from './data/roadmap.json';
import questions from './data/questions.json';
import flashcards from './data/flashcards.json';
import './style.css';

const STORAGE_KEY = 'secplus701-progress-v2';
const defaultProgress = { lessons:{}, unitTests:{}, attempts:[], weak:{}, xp:0, streak:1 };
function loadProgress(){ try { return {...defaultProgress, ...(JSON.parse(localStorage.getItem(STORAGE_KEY))||{})}; } catch { return defaultProgress; } }
function saveProgress(p){ localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); }
function shuffle(arr){ return [...arr].sort(()=>Math.random()-0.5); }
function pct(n,d){ return d ? Math.round((n/d)*100) : 0; }

export default function App(){
  const [tab,setTab] = useState('learn');
  const [progress,setProgress] = useState(loadProgress);
  const [activeLesson,setActiveLesson] = useState(null);
  const [lessonStep,setLessonStep] = useState(0);
  const [quizAnswers,setQuizAnswers] = useState({});
  const [mode,setMode]=useState(null);
  const [order,setOrder]=useState([]);
  const [idx,setIdx]=useState(0);
  const [selected,setSelected]=useState(null);
  const [checked,setChecked]=useState(false);
  const [score,setScore]=useState(0);
  const [seconds,setSeconds]=useState(5400);
  const [card,setCard]=useState(0);
  const [showBack,setShowBack]=useState(false);

  useEffect(()=>saveProgress(progress),[progress]);
  useEffect(()=>{ if(mode!=='exam') return; const t=setInterval(()=>setSeconds(s=>Math.max(0,s-1)),1000); return()=>clearInterval(t); },[mode]);

  const allLessons = roadmap.flatMap(u=>u.lessons.map(l=>({...l, unit:u.id, unitTitle:u.title, unitColor:u.color})));
  const completedLessons = allLessons.filter(l=>progress.lessons[l.id]?.completed).length;
  const totalXp = progress.xp || 0;
  const overall = pct(completedLessons, allLessons.length);
  const weak = Object.entries(progress.weak||{}).sort((a,b)=>b[1]-a[1]);

  function isUnitUnlocked(unitIndex){
    if(unitIndex === 0) return true;
    const prev = roadmap[unitIndex-1];
    return prev.lessons.every(l=>progress.lessons[l.id]?.completed) && (progress.unitTests[prev.id]?.score || 0) >= prev.requiredScore;
  }
  function isLessonUnlocked(unitIndex, lessonIndex){
    if(!isUnitUnlocked(unitIndex)) return false;
    if(lessonIndex === 0) return true;
    return !!progress.lessons[roadmap[unitIndex].lessons[lessonIndex-1].id]?.completed;
  }
  function openLesson(lesson){ setActiveLesson(lesson); setLessonStep(0); setQuizAnswers({}); setTab('lesson'); }
  function finishLesson(){
    let correct = 0;
    activeLesson.quiz.forEach((q,i)=>{ if(quizAnswers[i]===q.answerIndex) correct++; });
    const scorePct = pct(correct, activeLesson.quiz.length);
    const passed = scorePct >= 70;
    setProgress(p=>({
      ...p,
      xp: p.xp + (passed && !p.lessons[activeLesson.id]?.completed ? activeLesson.xp : 0),
      lessons:{...p.lessons, [activeLesson.id]:{completed:passed, score:scorePct, completedAt: passed ? new Date().toISOString() : null}}
    }));
    setLessonStep(3);
  }
  function unitMastery(unit){
    const pool = questions.filter(q => q.domain === 'Mixed Review' || q.domain === 'Threats & Vulnerabilities' || q.domain === 'Architecture & Operations' || q.domain === 'Governance & Crypto');
    setMode('unit'); setOrder(shuffle(pool).slice(0,10)); setIdx(0); setScore(0); setSelected(null); setChecked(false); setTab('quiz');
  }
  function start(m){ const qs=m==='exam'?questions:shuffle(questions).slice(0,20); setMode(m); setOrder(qs); setIdx(0); setSelected(null); setChecked(false); setScore(0); setSeconds(5400); setTab('quiz'); }
  const current = order[idx];
  function submit(){
    if(selected===null) return;
    const correct=selected===current.answerIndex;
    setChecked(true); if(correct) setScore(s=>s+1);
    setProgress(p=>({ ...p, attempts:[...p.attempts,{id:current.id, correct, at:new Date().toISOString()}], weak:{...p.weak,[current.domain]:(p.weak[current.domain]||0)+(correct?0:1)} }));
  }
  function next(){
    if(idx+1 < order.length){ setSelected(null); setChecked(false); setIdx(i=>i+1); }
    else {
      if(mode==='unit'){
        const finalScore = pct(score + (selected===current?.answerIndex ? 1 : 0), order.length);
        const unit = roadmap.find(u=>u.lessons.every(l=>progress.lessons[l.id]?.completed) && !progress.unitTests[u.id]?.score);
        if(unit) setProgress(p=>({...p, unitTests:{...p.unitTests,[unit.id]:{score:finalScore, at:new Date().toISOString()}}, xp:p.xp+(finalScore>=unit.requiredScore?50:0)}));
      }
      setTab('learn');
    }
  }
  function fmt(s){ const m=Math.floor(s/60), r=s%60; return `${m}:${String(r).padStart(2,'0')}`; }
  const nav = [['learn','Roadmap'],['dashboard','Dashboard'],['practice','Practice'],['exam','Exam'],['flashcards','Flashcards'],['weak','Weak Areas']];

  return <main>
    <header className="hero"><div><h1>🔐 Security+ SY0-701 Academy</h1><p>Duolingo-style roadmap, lessons, quizzes, flashcards, and 100-question exam simulator.</p></div><div className="level"><b>{totalXp} XP</b><span>{overall}% complete</span></div></header>
    <nav>{nav.map(([key,label])=><button key={key} className={tab===key?'active':''} onClick={()=> key==='practice'?start('practice'):key==='exam'?start('exam'):setTab(key)}>{label}</button>)}</nav>

    {tab==='learn' && <section className="roadmap">
      <div className="progress-card"><h2>Learning Roadmap</h2><p>Complete lessons in order. Finish each unit mastery check to unlock the next topic.</p><div className="bar"><i style={{width:`${overall}%`}} /></div><small>{completedLessons}/{allLessons.length} lessons completed • {totalXp} XP</small></div>
      {roadmap.map((unit,ui)=>{
        const unlocked = isUnitUnlocked(ui);
        const done = unit.lessons.filter(l=>progress.lessons[l.id]?.completed).length;
        const unitReady = unlocked && done === unit.lessons.length;
        return <div className={`unit ${!unlocked?'locked':''}`} key={unit.id} style={{'--unit':unit.color}}>
          <div className="unit-head"><span className="unit-emoji">{unit.emoji}</span><div><h2>{unit.title}</h2><p>{unit.description}</p><small>{done}/{unit.lessons.length} lessons • Mastery target {unit.requiredScore}%</small></div></div>
          <div className="path">
            {unit.lessons.map((lesson,li)=>{
              const lUnlocked = isLessonUnlocked(ui,li);
              const lDone = progress.lessons[lesson.id]?.completed;
              return <button key={lesson.id} className={`node ${lDone?'done':''} ${!lUnlocked?'disabled':''}`} disabled={!lUnlocked} onClick={()=>openLesson({...lesson, unit:unit.id, unitTitle:unit.title, unitColor:unit.color})} title={lesson.title}>
                <span>{lDone?'✓':lUnlocked?'▶':'🔒'}</span><b>{lesson.title}</b><small>{lesson.minutes} min • {lesson.xp} XP</small>
              </button>
            })}
            <button className={`boss ${unitReady?'':'disabled'}`} disabled={!unitReady} onClick={()=>unitMastery(unit)}><span>🏆</span><b>Unit Mastery</b><small>{progress.unitTests[unit.id]?.score ? `Best: ${progress.unitTests[unit.id].score}%` : '10-question check'}</small></button>
          </div>
        </div>
      })}
    </section>}

    {tab==='lesson' && activeLesson && <section className="card lesson">
      <div className="topline"><button onClick={()=>setTab('learn')}>← Roadmap</button><span>{activeLesson.unitTitle}</span><span>{activeLesson.xp} XP</span></div>
      {lessonStep===0 && <><h2>{activeLesson.title}</h2><p className="lead">{activeLesson.summary}</p><button onClick={()=>setLessonStep(1)}>Start lesson</button></>}
      {lessonStep===1 && <><h2>{activeLesson.title}: Key Points</h2><ul className="study-list">{activeLesson.bullets.map(b=><li key={b}>{b}</li>)}</ul><button onClick={()=>setLessonStep(2)}>Take mini quiz</button></>}
      {lessonStep===2 && <><h2>Mini Quiz</h2>{activeLesson.quiz.map((q,qi)=><div className="mini" key={q.q}><h3>{qi+1}. {q.q}</h3>{q.options.map((o,oi)=><label className="option" key={o}><input type="radio" checked={quizAnswers[qi]===oi} onChange={()=>setQuizAnswers({...quizAnswers,[qi]:oi})}/>{o}</label>)}</div>)}<button disabled={Object.keys(quizAnswers).length<activeLesson.quiz.length} onClick={finishLesson}>Finish lesson</button></>}
      {lessonStep===3 && <LessonResult lesson={activeLesson} answers={quizAnswers} onRetry={()=>{setLessonStep(1);setQuizAnswers({});}} onDone={()=>setTab('learn')} />}
    </section>}

    {tab==='dashboard' && <section className="card"><h2>Dashboard</h2><div className="grid"><div><b>{overall}%</b><span>Roadmap complete</span></div><div><b>{completedLessons}/{allLessons.length}</b><span>Lessons completed</span></div><div><b>{totalXp}</b><span>Total XP</span></div></div><button onClick={()=>setTab('learn')}>Continue Roadmap</button><button onClick={()=>start('practice')}>Practice 20 Questions</button><button onClick={()=>start('exam')}>Start Timed Exam</button></section>}

    {tab==='quiz' && current && <section className="card"><div className="topline"><b>{mode==='exam'?'Exam mode':mode==='unit'?'Unit mastery':'Practice mode'}</b><span>{mode==='exam' && `⏱ ${fmt(seconds)}`}</span><span>Question {idx+1}/{order.length}</span><span>Score {score}</span></div><h2>{current.question}</h2>{current.options.map((o,i)=><label key={o} className={`option ${checked && i===current.answerIndex?'right':''} ${checked && selected===i && i!==current.answerIndex?'wrong':''}`}><input type="radio" disabled={checked} checked={selected===i} onChange={()=>setSelected(i)} />{String.fromCharCode(65+i)}. {o}</label>)}{!checked?<button onClick={submit}>Submit answer</button>:<div className="explain"><h3>{selected===current.answerIndex?'✅ Correct':'❌ Incorrect'}</h3><p>{current.explanation}</p><button onClick={next}>{idx+1<order.length?'Next':'Finish'}</button></div>}</section>}

    {tab==='flashcards' && <section className="card"><h2>Flashcards</h2><div className="bigcard" onClick={()=>setShowBack(!showBack)}>{showBack?flashcards[card].back:flashcards[card].front}</div><button onClick={()=>{setCard((card+1)%flashcards.length);setShowBack(false)}}>Next card</button></section>}
    {tab==='weak' && <section className="card"><h2>Weak Areas</h2>{weak.length===0?<p>No weak areas yet. Take a quiz first.</p>:weak.map(([d,n])=><p key={d}><b>{d}</b>: {n} missed question(s)</p>)}</section>}
  </main>
}

function LessonResult({lesson,answers,onRetry,onDone}){
  let correct=0; lesson.quiz.forEach((q,i)=>{ if(answers[i]===q.answerIndex) correct++; });
  const score=pct(correct,lesson.quiz.length); const passed=score>=70;
  return <div className="result"><h2>{passed?'🎉 Lesson Complete!':'💪 Try Again'}</h2><p>Your score: <b>{score}%</b></p><p>{passed?`You earned ${lesson.xp} XP and unlocked the next step.`:'Review the key points and retake the mini quiz to unlock progress.'}</p><button onClick={passed?onDone:onRetry}>{passed?'Back to Roadmap':'Retry Lesson'}</button></div>
}
