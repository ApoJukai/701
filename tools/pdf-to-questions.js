
// Browser/Node starter converter. Paste extracted PDF text or wire this to pdfjs-dist.
// It detects numbered multiple-choice questions and outputs JSON compatible with src/data/questions.json.
export function parseSecurityPlusQuestions(text){
  const blocks = text.split(/(?=\b\d+\.\s*\*?\*?\s+)/g).filter(Boolean);
  return blocks.map((b,idx)=>{
    const qMatch=b.match(/^\s*(\d+)\.\s*\*?\*?\s*([\s\S]*?)(?=\s+[○●]?\s*A\))/);
    const opts=[...b.matchAll(/[○●]?\s*([A-D])\)\s*([\s\S]*?)(?=\s+[○●]?\s*[A-D]\)|$)/g)]
      .slice(0,4).map(m=>m[2].replace(/\s+/g,' ').trim());
    return {id:idx+1, domain:'Imported', question:(qMatch?.[2]||'').replace(/\s+/g,' ').trim(), options:opts, answerIndex:0, explanation:'Imported from PDF. Set answerIndex after review.'};
  }).filter(q=>q.question && q.options.length===4);
}
