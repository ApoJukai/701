
import React, { useMemo, useState, useEffect } from 'react';
import questions from './data/questions.json';
import flashcards from './data/flashcards.json';
import './style.css';

const STORAGE_KEY = 'secplus701-progress-v1';
function shuffle(arr){ return [...arr].sort(()=>Math.random()-0.5); }
function loadProgress(){ try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||{attempts:[], weak:{}}}catch{return {attempts:[], weak:{}}} }
function saveProgress(p){ localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); }

export default function App(){
  const [tab,setTab]=useState('dashboard');
  const [progress,setProgress]=useState(loadProgress);
  const [mode,setMode]=useState(null);
  const [order,setOrder]=useState([]);
  const [idx,setIdx]=useState(0);
  const [selected,setSelected]=useState(null);
  const [checked,setChecked]=useState(false);
  const [score,setScore]=useState(0);
  const [seconds,setSeconds]=useState(5400);
  const [card,setCard]=useState(0);
  const [showBack,setShowBack]=useState(false);

  useEffect(()=>{ saveProgress(progress); },[progress]);
  useEffect(()=>{
    if(mode!=='exam') return;
    const t=setInterval(()=>setSeconds(s=>Math.max(0,s-1)),1000);
    return()=>clearInterval(t);
  },[mode]);
  const current = order[idx];
  const stats = useMemo(()=>{
    const total=progress.attempts.length;
    const correct=progress.attempts.filter(a=>a.correct).length;
    return {total, correct, pct: total?Math.round(correct/total*100):0};
  },[progress]);
  function start(m){
    const qs = m==='exam' ? questions : shuffle(questions).slice(0,20);
    setMode(m); setOrder(qs); setIdx(0); setSelected(null); setChecked(false); setScore(0); setSeconds(5400); setTab('quiz');
  }
  function submit(){
    if(selected===null) return;
    const correct=selected===current.answerIndex;
    setChecked(true); if(correct) setScore(s=>s+1);
    setProgress(p=>({
      attempts:[...p.attempts,{id:current.id, correct, at:new Date().toISOString()}],
      weak:{...p.weak,[current.domain]:(p.weak[current.domain]||0)+(correct?0:1)}
    }));
  }
  function next(){ setSelected(null); setChecked(false); setIdx(i=>i+1); }
  function fmt(s){ const m=Math.floor(s/60), r=s%60; return `${m}:${String(r).padStart(2,'0')}`; }
  const weak = Object.entries(progress.weak).sort((a,b)=>b[1]-a[1]);

  return <main>
    <header><h1>🔐 CompTIA Security+ SY0-701 Study App</h1><p>Practice, flashcards, weak-area tracking, and a 100-question timed exam simulator.</p></header>
    <nav>{['dashboard','practice','exam','flashcards','weak'].map(x=><button className={tab===x?'active':''} onClick={()=> x==='practice'?start('practice'):x==='exam'?start('exam'):setTab(x)} key={x}>{x}</button>)}</nav>

    {tab==='dashboard'&&<section className="card"><h2>Dashboard</h2><div className="grid"><div><b>{stats.pct}%</b><span>Overall score</span></div><div><b>{stats.correct}/{stats.total}</b><span>Answered correctly</span></div><div><b>{questions.length}</b><span>Question bank</span></div></div><button onClick={()=>start('practice')}>Start 20-question practice</button><button onClick={()=>start('exam')}>Start 100-question timed exam</button></section>}

    {tab==='quiz'&& current && <section className="card"><div className="topline"><b>{mode==='exam'?'Exam mode':'Practice mode'}</b><span>{mode==='exam' && `⏱ ${fmt(seconds)}`}</span><span>Question {idx+1}/{order.length}</span><span>Score {score}</span></div><h2>{current.question}</h2>{current.options.map((o,i)=><label key={o} className={`option ${checked && i===current.answerIndex?'right':''} ${checked && selected===i && i!==current.answerIndex?'wrong':''}`}><input type="radio" disabled={checked} checked={selected===i} onChange={()=>setSelected(i)} />{String.fromCharCode(65+i)}. {o}</label>)}{!checked?<button onClick={submit}>Submit answer</button>:<div className="explain"><h3>{selected===current.answerIndex?'✅ Correct':'❌ Incorrect'}</h3><p>{current.explanation}</p>{idx+1<order.length?<button onClick={next}>Next</button>:<button onClick={()=>setTab('dashboard')}>Finish</button>}</div>}</section>}

    {tab==='flashcards'&&<section className="card"><h2>Flashcards</h2><div className="bigcard" onClick={()=>setShowBack(!showBack)}>{showBack?flashcards[card].back:flashcards[card].front}</div><button onClick={()=>{setCard((card+1)%flashcards.length);setShowBack(false)}}>Next card</button></section>}

    {tab==='weak'&&<section className="card"><h2>Weak Areas</h2>{weak.length===0?<p>No weak areas yet. Take a quiz first.</p>:weak.map(([d,n])=><p key={d}><b>{d}</b>: {n} missed question(s)</p>)}</section>}
  </main>
}
