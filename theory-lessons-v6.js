/* My Guitar v6 — playful theory lessons: strings, note names, tablature reading and quiz */
(function(){
  const THEORY=[
    {id:'t1',title:'Pourquoi la tablature paraît inversée',mins:6,skill:'Tablature'},
    {id:'t2',title:'Mi La Ré Sol Si Mi ↔ E A D G B E',mins:7,skill:'Notes'},
    {id:'t3',title:'Lire une tablature de gauche à droite',mins:7,skill:'Tablature'},
    {id:'t4',title:'Quiz express · cordes, lettres et frettes',mins:5,skill:'Mémoire'}
  ];
  const OPEN_STRINGS=[
    {n:6,fr:'Mi grave',letter:'E',hz:82.41},
    {n:5,fr:'La',letter:'A',hz:110.00},
    {n:4,fr:'Ré',letter:'D',hz:146.83},
    {n:3,fr:'Sol',letter:'G',hz:196.00},
    {n:2,fr:'Si',letter:'B',hz:246.94},
    {n:1,fr:'Mi aigu',letter:'e',hz:329.63}
  ];
  let audioCtx=null;
  let current=null;
  let quizAnswer=null;

  function escT(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function ensureAudio(){
    if(!audioCtx)audioCtx=new (window.AudioContext||window.webkitAudioContext)();
    if(audioCtx.state==='suspended')audioCtx.resume().catch(()=>{});
    return audioCtx;
  }
  function pluckHz(freq,duration=.7){
    try{
      const ac=ensureAudio(),start=ac.currentTime+.01;
      const o=ac.createOscillator(),o2=ac.createOscillator(),g=ac.createGain(),g2=ac.createGain(),f=ac.createBiquadFilter();
      o.type='triangle';o.frequency.setValueAtTime(freq,start);
      o2.type='sine';o2.frequency.setValueAtTime(freq*2,start);
      f.type='lowpass';f.frequency.setValueAtTime(Math.min(2600,freq*8),start);
      g.gain.setValueAtTime(.0001,start);g.gain.exponentialRampToValueAtTime(.28,start+.008);g.gain.exponentialRampToValueAtTime(.0001,start+duration);
      g2.gain.setValueAtTime(.0001,start);g2.gain.exponentialRampToValueAtTime(.07,start+.006);g2.gain.exponentialRampToValueAtTime(.0001,start+Math.min(.3,duration));
      o.connect(g).connect(f).connect(ac.destination);o2.connect(g2).connect(f);
      o.start(start);o2.start(start);o.stop(start+duration+.03);o2.stop(start+duration+.03);
    }catch(e){}
  }
  function playString(n){const s=OPEN_STRINGS.find(x=>x.n===Number(n));if(s)pluckHz(s.hz);}
  function playAFret(fret){pluckHz(110*Math.pow(2,Number(fret)/12));}
  function completed(id){return Array.isArray(state?.completed)&&state.completed.includes(id);}
  function markDone(id){
    const l=THEORY.find(x=>x.id===id);if(!l||completed(id))return;
    state.completed.push(id);
    if(typeof practice==='function')practice(l.mins,40);else if(typeof save==='function')save();
    renderTheory();
  }

  function injectSection(){
    const learn=document.getElementById('learn');
    const list=document.getElementById('lessonList');
    if(!learn||!list||document.getElementById('theoryLessons'))return;
    const section=document.createElement('div');
    section.id='theoryLessons';
    section.innerHTML=`
      <div class="section-head theory-head"><div><div class="eyebrow">THÉORIE LUDIQUE</div><h2>Comprendre ce que tu joues</h2></div><span id="theoryProgress"></span></div>
      <p class="muted">Courtes leçons interactives avec sons. Tu peux les faire dans n’importe quel ordre.</p>
      <div id="theoryLessonList" class="stack"></div>`;
    list.parentNode.insertBefore(section,list);
  }

  function renderTheory(){
    const host=document.getElementById('theoryLessonList');if(!host)return;
    const done=THEORY.filter(x=>completed(x.id)).length;
    const p=document.getElementById('theoryProgress');if(p)p.textContent=`${done} / ${THEORY.length}`;
    host.innerHTML=THEORY.map((l,i)=>`<button class="lesson-item card theory-item ${completed(l.id)?'done':''}" data-theory="${l.id}"><span class="lesson-num">${completed(l.id)?'✓':'T'+(i+1)}</span><span><strong>${escT(l.title)}</strong><small>${l.mins} min · ${escT(l.skill)}</small></span><span class="chev">›</span></button>`).join('');
    host.querySelectorAll('[data-theory]').forEach(b=>b.onclick=()=>openTheory(b.dataset.theory));
  }

  function ensureDialog(){
    if(document.getElementById('theoryDialog'))return;
    const d=document.createElement('dialog');d.id='theoryDialog';
    d.innerHTML=`<div class="dialog-inner theory-dialog-inner"><button id="closeTheory" class="close">×</button><div class="eyebrow" id="theoryKicker"></div><h2 id="theoryTitle"></h2><div id="theoryBody"></div><button id="completeTheoryBtn" class="primary big">✓ Terminer la leçon</button></div>`;
    document.body.appendChild(d);
    document.getElementById('closeTheory').onclick=()=>d.close();
    document.getElementById('completeTheoryBtn').onclick=()=>{if(current)markDone(current.id);d.close();};
  }

  function tabLines(highlight=5){
    const tabOrder=[1,2,3,4,5,6];
    return `<div class="theory-tab">${tabOrder.map(n=>{const s=OPEN_STRINGS.find(x=>x.n===n);return `<button class="tab-line ${n===highlight?'hot':''}" data-string="${n}"><span>${s.letter}</span><i></i><b>corde ${n}</b></button>`}).join('')}</div>`;
  }
  function noteMap(){
    return `<div class="note-map">${OPEN_STRINGS.map(s=>`<button class="note-pair" data-string="${s.n}"><small>corde ${s.n}</small><strong>${s.fr.replace(' grave','').replace(' aigu','')} = ${s.letter.toUpperCase()}</strong><span>🔊 écouter</span></button>`).join('')}</div>`;
  }
  function riffTab(){
    return `<div class="mini-tab"><div>e|---------------------------|</div><div>B|---------------------------|</div><div>G|---------------------------|</div><div>D|---------------------------|</div><button class="riff-tab-line" id="theoryRiffPlay">A|--7--7--10--7--5--3--2----| <span>▶ écouter</span></button><div>E|---------------------------|</div></div>`;
  }

  function contentFor(id){
    if(id==='t1')return `
      <p>Une tablature est dessinée comme si le manche était posé devant toi. C’est pour ça que la <strong>corde la plus fine (1)</strong> est en haut, et la <strong>plus grosse (6)</strong> en bas.</p>
      <div class="theory-rule"><strong>Guitare dans tes mains :</strong> grosse corde en haut.<br><strong>Tablature :</strong> grosse corde en bas.</div>
      ${tabLines(5)}
      <p class="muted">Touche une ligne : tu entends la corde correspondante. Pour Seven Nation Army, la 5e corde = <strong>La / A</strong>, donc la 2e ligne en partant du bas.</p>`;
    if(id==='t2')return `
      <p>Les lettres ne sont pas des abréviations : c’est la notation internationale des notes. Pour tes cordes à vide :</p>
      <div class="mnemo-box"><strong>Mi – La – Ré – Sol – Si – Mi</strong><span>E – A – D – G – B – E</span><small>de la grosse corde (6) vers la fine (1)</small></div>
      ${noteMap()}
      <div class="theory-rule"><strong>Astuce :</strong> apprends-les par paires : Mi/E · La/A · Ré/D · Sol/G · Si/B · Mi/E.</div>`;
    if(id==='t3')return `
      <p>Tu lis une tablature <strong>de gauche à droite</strong>. Le chiffre indique la <strong>frette</strong>, et la ligne indique la <strong>corde</strong>.</p>
      ${riffTab()}
      <div class="read-steps"><div><b>1</b><span>Ligne A = corde de La = 5e corde</span></div><div><b>2</b><span>7 = appuie à la frette 7</span></div><div><b>3</b><span>Puis 7 → 10 → 7 → 5 → 3 → 2</span></div></div>
      <p class="muted">Touche la ligne A ci-dessus pour entendre la suite.</p>`;
    return `<p>Petit jeu pour vérifier que les repères commencent à devenir automatiques.</p><div id="theoryQuiz" class="theory-quiz"><h3 id="theoryQuizQuestion">Question</h3><div id="theoryQuizOptions" class="challenge-options"></div><div id="theoryQuizResult" class="result"></div><button id="theoryQuizNext" class="secondary">Nouvelle question</button></div>`;
  }

  function bindLessonInteractions(id){
    document.querySelectorAll('#theoryBody [data-string]').forEach(b=>b.onclick=()=>{
      document.querySelectorAll('#theoryBody [data-string]').forEach(x=>x.classList.remove('playing'));
      b.classList.add('playing');playString(b.dataset.string);setTimeout(()=>b.classList.remove('playing'),450);
    });
    if(id==='t3')document.getElementById('theoryRiffPlay')?.addEventListener('click',()=>{
      const seq=[7,7,10,7,5,3,2];seq.forEach((f,i)=>setTimeout(()=>playAFret(f),i*520));
    });
    if(id==='t4'){
      document.getElementById('theoryQuizNext').onclick=newQuiz;
      newQuiz();
    }
  }

  const QUIZ=[
    {q:'Quelle lettre correspond à La ?',a:'A',o:['A','D','G']},
    {q:'Quelle note correspond à la lettre E ?',a:'Mi',o:['Mi','La','Ré']},
    {q:'Sur une tablature, où se trouve la grosse corde Mi grave ?',a:'Tout en bas',o:['Tout en bas','Tout en haut','Au milieu']},
    {q:'Que signifie 7 écrit sur la ligne A ?',a:'5e corde, frette 7',o:['5e corde, frette 7','7e corde','Jouer 7 fois']},
    {q:'La 5e corde à vide est…',a:'La / A',o:['La / A','Ré / D','Mi / E']},
    {q:'On lit une tablature…',a:'De gauche à droite',o:['De gauche à droite','De bas en haut','De droite à gauche']}
  ];
  function newQuiz(){
    const q=QUIZ[Math.floor(Math.random()*QUIZ.length)];quizAnswer=q.a;
    document.getElementById('theoryQuizQuestion').textContent=q.q;
    document.getElementById('theoryQuizResult').textContent='';
    const opts=[...q.o].sort(()=>Math.random()-.5);
    document.getElementById('theoryQuizOptions').innerHTML=opts.map(x=>`<button class="secondary" data-answer="${escT(x)}">${escT(x)}</button>`).join('');
    document.querySelectorAll('#theoryQuizOptions [data-answer]').forEach(b=>b.onclick=()=>{
      const ok=b.dataset.answer===quizAnswer;
      document.getElementById('theoryQuizResult').textContent=ok?'✓ Exact':'Pas encore — bonne réponse : '+quizAnswer;
      if(ok){b.classList.add('quiz-good');if(quizAnswer.includes('La / A'))playString(5);}
    });
  }

  function openTheory(id){
    ensureDialog();current=THEORY.find(x=>x.id===id);if(!current)return;
    document.getElementById('theoryKicker').textContent=`Théorie · ${current.mins} min · ${current.skill}`;
    document.getElementById('theoryTitle').textContent=current.title;
    document.getElementById('theoryBody').innerHTML=contentFor(id);
    document.getElementById('completeTheoryBtn').textContent=completed(id)?'✓ Déjà terminée':'✓ Terminer la leçon';
    bindLessonInteractions(id);
    document.getElementById('theoryDialog').showModal();
  }

  const style=document.createElement('style');
  style.textContent=`
    #theoryLessons{margin:18px 0 24px}.theory-head{align-items:flex-end}.theory-item{border-color:rgba(96,165,250,.22)}
    .theory-dialog-inner{max-width:560px}.theory-rule,.mnemo-box{background:rgba(96,165,250,.09);border:1px solid rgba(96,165,250,.22);border-radius:14px;padding:13px;margin:12px 0;line-height:1.5}
    .mnemo-box{display:grid;text-align:center;gap:5px}.mnemo-box strong{font-size:19px}.mnemo-box span{font-size:20px;font-weight:900;letter-spacing:2px}.mnemo-box small{color:var(--muted)}
    .theory-tab{display:grid;gap:6px;margin:14px 0}.tab-line{display:grid;grid-template-columns:28px 1fr 64px;align-items:center;gap:8px;background:transparent;border:0;color:var(--text);padding:4px 0;text-align:left}.tab-line span{font-weight:900}.tab-line i{height:2px;background:currentColor;opacity:.45}.tab-line b{font-size:10px;color:var(--muted)}.tab-line.hot{color:#93c5fd}.tab-line.playing{color:#fff;transform:scale(1.01)}
    .note-map{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:14px 0}.note-pair{display:grid;gap:3px;text-align:left;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:11px;color:var(--text)}.note-pair small,.note-pair span{font-size:10px;color:var(--muted)}.note-pair strong{font-size:16px}.note-pair.playing{outline:2px solid #93c5fd}
    .mini-tab{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;background:#080b0e;border:1px solid var(--line);border-radius:12px;padding:12px;overflow:auto;line-height:1.65;font-size:12px}.riff-tab-line{display:block;width:100%;font:inherit;text-align:left;background:rgba(96,165,250,.09);border:1px solid rgba(96,165,250,.22);color:#bfdbfe;border-radius:8px;padding:3px 5px;white-space:nowrap}.riff-tab-line span{float:right;font-family:inherit}
    .read-steps{display:grid;gap:8px;margin:14px 0}.read-steps div{display:grid;grid-template-columns:30px 1fr;gap:8px;align-items:center}.read-steps b{display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:rgba(96,165,250,.15);color:#bfdbfe}.read-steps span{font-size:13px}
    .theory-quiz{margin-top:12px}.theory-quiz .challenge-options{display:grid;gap:8px}.quiz-good{outline:2px solid #34d399}
    @media(max-width:430px){.note-map{grid-template-columns:1fr}.theory-dialog-inner{padding-bottom:24px}}
  `;
  document.head.appendChild(style);

  injectSection();ensureDialog();renderTheory();
})();
