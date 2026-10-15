const KEY='my_guitar_state_v1';
const DAILY_GOAL=10;
const STRINGS=[
  {label:'Mi grave',short:'E6',note:'Mi'},
  {label:'La',short:'A5',note:'La'},
  {label:'Ré',short:'D4',note:'Ré'},
  {label:'Sol',short:'G3',note:'Sol'},
  {label:'Si',short:'B2',note:'Si'},
  {label:'Mi aigu',short:'E1',note:'Mi'}
];
const NOTE_NAMES=['Do','Do♯','Ré','Ré♯','Mi','Fa','Fa♯','Sol','Sol♯','La','La♯','Si'];
const OPEN_NOTE_INDEX=[4,9,2,7,11,4];
const RIFF=[7,7,10,7,5,3,2];
const LESSONS=[
  {id:'l1',title:'Découvrir ta guitare',mins:6,skill:'Cordes',body:'Avant de jouer, repère simplement le manche, le corps, les six cordes et les frettes. Tu n’as rien à mémoriser d’un coup.',tip:'La corde la plus épaisse est le Mi grave. La plus fine est le Mi aigu.',visual:'strings'},
  {id:'l2',title:'Les 6 cordes',mins:8,skill:'Cordes',body:'Apprends l’ordre des cordes de la plus épaisse à la plus fine : Mi, La, Ré, Sol, Si, Mi.',tip:'Commence toujours par savoir où est le Mi grave. Le reste viendra très vite.',visual:'strings'},
  {id:'l3',title:'Comprendre les cases',mins:7,skill:'Cases',body:'Les barres métalliques sont les frettes. Une case est l’espace entre deux frettes. Case 1 juste après le sillet, puis 2, 3, 4…',tip:'Pose ton doigt juste derrière la frette, pas dessus.',visual:'frets'},
  {id:'l4',title:'Faire une note propre',mins:8,skill:'Technique',body:'Appuie avec le bout du doigt, près de la frette, puis gratte une seule corde. La note doit sonner sans friser.',tip:'Si ça grésille, rapproche le doigt de la frette et appuie un peu plus.',visual:'practice'},
  {id:'l5',title:'Premier déplacement',mins:8,skill:'Cases',body:'Sur la corde de Mi grave, joue case 3, puis 5, puis 7. Le but est de déplacer la main sans perdre la propreté du son.',tip:'Regarde d’abord la case, puis déplace la main. Pas besoin d’aller vite.',visual:'frets'},
  {id:'l6',title:'Ton premier riff',mins:10,skill:'Riffs',body:'Tu vas enchaîner un petit riff rock sur une seule corde : 7 · 7 · 10 · 7 · 5 · 3 · 2.',tip:'Joue lentement. La régularité compte plus que la vitesse.',visual:'riff'},
  {id:'l7',title:'Tenir le médiator',mins:7,skill:'Technique',body:'Tiens le médiator entre le pouce et le côté de l’index, en laissant dépasser seulement une petite pointe.',tip:'Ne serre pas trop fort : le médiator doit rester stable sans crisper la main.',visual:'practice'},
  {id:'l8',title:'Le rythme en 4 temps',mins:8,skill:'Rythme',body:'Compte 1-2-3-4 régulièrement. Chaque chiffre correspond à un battement. Utilise le métronome à 60 BPM.',tip:'À 60 BPM, tu as exactement une seconde entre chaque battement.',visual:'rhythm'},
  {id:'l9',title:'Premières descentes',mins:8,skill:'Rythme',body:'Joue quatre coups vers le bas : ↓ ↓ ↓ ↓, un par temps.',tip:'Le bras bouge de façon régulière même si tu rates une corde.',visual:'rhythm'},
  {id:'l10',title:'Premier accord : Em',mins:10,skill:'Accords',body:'Pose deux doigts sur les cordes de La et Ré à la case 2. Joue les six cordes : c’est Mi mineur (Em).',tip:'Vérifie chaque corde séparément avant de jouer l’accord entier.',visual:'em'},
  {id:'l11',title:'Deuxième accord : Am',mins:10,skill:'Accords',body:'Place les doigts pour La mineur (Am), puis entraîne-toi à passer doucement de Em à Am.',tip:'Cherche la précision avant la vitesse.',visual:'am'},
  {id:'l12',title:'Mini morceau',mins:12,skill:'Riffs',body:'Combine rythme, deux accords et un petit riff. Ton objectif : jouer 30 secondes sans t’arrêter.',tip:'Une erreur n’est pas une raison pour s’arrêter : garde le tempo.',visual:'practice'}
];

let state=loadState();
let installPrompt=null;
let lessonOpen=null;
let metro={bpm:60,playing:false,timer:null,beat:0,ctx:null};
let riffTimer=null;

function defaultState(){return {xp:0,completed:[],minutes:0,todayMinutes:0,todayKey:dayKey(),streak:0,lastPractice:null,challengeWins:0,lessonMinutes:{}}}
function loadState(){try{const s=JSON.parse(localStorage.getItem(KEY)||'null');return {...defaultState(),...(s||{})}}catch(e){return defaultState()}}
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function dayKey(d=new Date()){return d.toISOString().slice(0,10)}
function yesterdayKey(){const d=new Date();d.setDate(d.getDate()-1);return dayKey(d)}
function syncDay(){if(state.todayKey!==dayKey()){state.todayKey=dayKey();state.todayMinutes=0;save()}}
function practice(mins=1,xp=5){syncDay();const today=dayKey();if(state.lastPractice!==today){state.streak=state.lastPractice===yesterdayKey()?state.streak+1:1;state.lastPractice=today}state.minutes+=mins;state.todayMinutes+=mins;state.xp+=xp;save();renderAll()}
function nextLesson(){return LESSONS.find(l=>!state.completed.includes(l.id))||LESSONS[LESSONS.length-1]}
function level(){return Math.max(1,Math.floor(state.xp/250)+1)}
function esc(s){return String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

function showView(id){document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===id));document.querySelectorAll('.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===id));window.scrollTo({top:0,behavior:'smooth'})}
document.querySelectorAll('.bottom-nav button').forEach(b=>b.onclick=()=>showView(b.dataset.view));
document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>showView(b.dataset.go));

document.getElementById('startNextBtn').onclick=()=>openLesson(nextLesson().id);
document.querySelector('[data-action="challenge"]').onclick=()=>{showView('challenges');newChallenge()};
document.querySelector('[data-action="metronome"]').onclick=()=>showView('play');

function renderHome(){syncDay();const n=nextLesson();document.getElementById('levelLabel').textContent=`Niveau ${level()} · Débutant absolu`;document.getElementById('nextLessonText').textContent=`Prochaine mission : ${n.title} · ${n.mins} min`;document.getElementById('xpStat').textContent=state.xp;document.getElementById('streakStat').textContent=state.streak;document.getElementById('minutesStat').textContent=state.minutes;document.getElementById('goalText').textContent=`${Math.min(state.todayMinutes,DAILY_GOAL)} / ${DAILY_GOAL} min`;document.getElementById('dailyProgress').style.width=`${Math.min(100,state.todayMinutes/DAILY_GOAL*100)}%`}
function renderLessons(){const done=state.completed.length;document.getElementById('courseProgressLabel').textContent=`${done} / ${LESSONS.length}`;document.getElementById('lessonList').innerHTML=LESSONS.map((l,i)=>{const completed=state.completed.includes(l.id);const unlocked=i===0||state.completed.includes(LESSONS[i-1].id);return `<button class="lesson-item card ${completed?'done':''} ${unlocked?'':'locked'}" data-lesson="${l.id}" ${unlocked?'':'disabled'}><span class="lesson-num">${completed?'✓':i+1}</span><span><strong>${esc(l.title)}</strong><small>${l.mins} min · ${esc(l.skill)}</small></span><span class="chev">›</span></button>`}).join('');document.querySelectorAll('[data-lesson]').forEach(b=>b.onclick=()=>openLesson(b.dataset.lesson))}
function renderProgress(){document.getElementById('progressXp').textContent=state.xp;document.getElementById('progressLessons').textContent=state.completed.length;document.getElementById('progressMinutes').textContent=state.minutes;const skills=['Cordes','Cases','Technique','Rythme','Accords','Riffs'];document.getElementById('skillBars').innerHTML=skills.map(skill=>{const all=LESSONS.filter(l=>l.skill===skill).length||1;const done=LESSONS.filter(l=>l.skill===skill&&state.completed.includes(l.id)).length;const pct=Math.round(done/all*100);return `<div><div class="skill-head"><span>${skill}</span><strong>${pct}%</strong></div><div class="skill-track"><div style="width:${pct}%"></div></div></div>`}).join('')}
function renderBadges(){const badges=[['🎸','Première note',state.completed.length>=1],['🔥','3 jours de suite',state.streak>=3],['🎵','Premier riff',state.completed.includes('l6')],['⏱','30 min de pratique',state.minutes>=30],['🎯','10 défis réussis',state.challengeWins>=10],['⭐','500 XP',state.xp>=500]];document.getElementById('badges').innerHTML=badges.map(([ico,name,ok])=>`<div class="badge ${ok?'':'locked'}"><strong>${ico} ${name}</strong><small>${ok?'Débloqué':'À débloquer'}</small></div>`).join('')}
function renderAll(){renderHome();renderLessons();renderProgress();renderBadges()}

function openLesson(id){const l=LESSONS.find(x=>x.id===id);if(!l)return;lessonOpen=l;document.getElementById('lessonKicker').textContent=`Leçon ${LESSONS.indexOf(l)+1} · ${l.mins} min · ${l.skill}`;document.getElementById('lessonTitle').textContent=l.title;document.getElementById('lessonBody').textContent=l.body;document.getElementById('lessonTip').textContent='Astuce : '+l.tip;document.getElementById('lessonVisual').innerHTML=lessonVisual(l);document.getElementById('completeLessonBtn').textContent=state.completed.includes(l.id)?'✓ Déjà terminée':'✓ Terminer la leçon';document.getElementById('lessonDialog').showModal()}
function lessonVisual(l){if(l.visual==='strings')return `<div class="lesson-diagram">${STRINGS.map(s=>`<div><span>${s.label}</span></div>`).join('')}</div>`;if(l.visual==='frets')return `<div class="info-box"><strong>Exercice :</strong> joue lentement les cases 3 → 5 → 7 sur le Mi grave.</div>`;if(l.visual==='riff')return `<div class="riff-steps">${RIFF.map(n=>`<span class="riff-step">${n}</span>`).join('')}</div>`;if(l.visual==='rhythm')return `<div class="info-box" style="text-align:center;font-size:28px">↓ &nbsp; ↓ &nbsp; ↓ &nbsp; ↓<br><small>1 &nbsp; 2 &nbsp; 3 &nbsp; 4</small></div>`;if(l.visual==='em')return chordDiagram('Em',[0,2,2,0,0,0]);if(l.visual==='am')return chordDiagram('Am',['x',0,2,2,1,0]);return `<div class="info-box">Prends ta guitare et fais l’exercice tranquillement. Quand tu es à l’aise, valide la leçon.</div>`}
function chordDiagram(name,frets){return `<div class="info-box"><strong>${name}</strong><div class="riff-steps">${frets.map((f,i)=>`<span class="riff-step" title="${STRINGS[i].label}">${f}</span>`).join('')}</div><small>De la corde grave vers l’aiguë · x = ne pas jouer</small></div>`}
document.getElementById('closeLesson').onclick=()=>document.getElementById('lessonDialog').close();
document.getElementById('completeLessonBtn').onclick=()=>{if(!lessonOpen)return;if(!state.completed.includes(lessonOpen.id)){state.completed.push(lessonOpen.id);practice(lessonOpen.mins,50)}document.getElementById('lessonDialog').close();renderAll()};

function renderFretboard(){const fb=document.getElementById('fretboard');fb.innerHTML=STRINGS.map((s,si)=>`<div class="fret-row"><div class="string-name">${s.short}<br><small>${s.label}</small></div>${[0,1,2,3,4,5].map(f=>`<button data-string="${si}" data-fret="${f}">${f===0?'0':f}</button>`).join('')}</div>`).join('');fb.querySelectorAll('button').forEach(b=>b.onclick=()=>{fb.querySelectorAll('button').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');const si=+b.dataset.string,f=+b.dataset.fret;const note=NOTE_NAMES[(OPEN_NOTE_INDEX[si]+f)%12];document.getElementById('fretInfo').innerHTML=`<strong>${STRINGS[si].label}</strong> · ${f===0?'corde à vide':'case '+f} · note <strong>${note}</strong>`})}

function playRiff(delay){clearInterval(riffTimer);const steps=[...document.querySelectorAll('#riffSteps .riff-step')];let i=0;steps.forEach(s=>s.classList.remove('active'));const tick=()=>{steps.forEach(s=>s.classList.remove('active'));steps[i].classList.add('active');i++;if(i>=steps.length){setTimeout(()=>steps.forEach(s=>s.classList.remove('active')),delay);clearInterval(riffTimer)}};tick();riffTimer=setInterval(tick,delay)}
function renderRiff(){document.getElementById('riffSteps').innerHTML=RIFF.map(n=>`<span class="riff-step">${n}</span>`).join('')}
document.getElementById('riffSlow').onclick=()=>playRiff(900);document.getElementById('riffNormal').onclick=()=>playRiff(520);

function clickSound(accent=false){try{metro.ctx=metro.ctx||new (window.AudioContext||window.webkitAudioContext)();const o=metro.ctx.createOscillator(),g=metro.ctx.createGain();o.frequency.value=accent?1050:760;g.gain.setValueAtTime(.001,metro.ctx.currentTime);g.gain.exponentialRampToValueAtTime(.16,metro.ctx.currentTime+.002);g.gain.exponentialRampToValueAtTime(.001,metro.ctx.currentTime+.06);o.connect(g).connect(metro.ctx.destination);o.start();o.stop(metro.ctx.currentTime+.07)}catch(e){}}
function metroTick(){const dots=[...document.querySelectorAll('#beatDots span')];dots.forEach(x=>x.classList.remove('on'));dots[metro.beat].classList.add('on');clickSound(metro.beat===0);metro.beat=(metro.beat+1)%4}
function startMetro(){stopMetro();metro.playing=true;metro.beat=0;metroTick();metro.timer=setInterval(metroTick,60000/metro.bpm);document.getElementById('metroToggle').textContent='■'}
function stopMetro(){clearInterval(metro.timer);metro.timer=null;metro.playing=false;document.getElementById('metroToggle').textContent='▶';document.querySelectorAll('#beatDots span').forEach(x=>x.classList.remove('on'))}
function setBpm(v){metro.bpm=Math.min(180,Math.max(40,v));document.getElementById('bpmLabel').textContent=metro.bpm+' BPM';if(metro.playing)startMetro()}
document.getElementById('metroToggle').onclick=()=>metro.playing?stopMetro():startMetro();document.getElementById('bpmMinus').onclick=()=>setBpm(metro.bpm-5);document.getElementById('bpmPlus').onclick=()=>setBpm(metro.bpm+5);

let challengeAnswer=null;
function newChallenge(){const types=['string','fret'];const type=types[Math.floor(Math.random()*types.length)];const opts=document.getElementById('challengeOptions');document.getElementById('challengeResult').textContent='';if(type==='string'){const target=Math.floor(Math.random()*STRINGS.length);challengeAnswer=String(target);document.getElementById('challengeQuestion').textContent=`Trouve la corde : ${STRINGS[target].label}`;document.getElementById('challengeHelp').textContent='Choisis parmi les six cordes.';opts.innerHTML=STRINGS.map((s,i)=>`<button data-answer="${i}">${s.short}</button>`).join('')}else{const fret=1+Math.floor(Math.random()*5);challengeAnswer=String(fret);document.getElementById('challengeQuestion').textContent=`Trouve la case ${fret}`;document.getElementById('challengeHelp').textContent='Sur le manche, quelle case est demandée ?';opts.innerHTML=[1,2,3,4,5].map(n=>`<button data-answer="${n}">Case ${n}</button>`).join('')}opts.querySelectorAll('button').forEach(b=>b.onclick=()=>answerChallenge(b))}
function answerChallenge(btn){document.querySelectorAll('#challengeOptions button').forEach(b=>b.disabled=true);const ok=btn.dataset.answer===challengeAnswer;btn.classList.add(ok?'correct':'wrong');document.getElementById('challengeResult').textContent=ok?'✅ Correct · +10 XP':'❌ Pas encore. Regarde bien puis retente un nouveau défi.';if(ok){state.challengeWins++;practice(1,10)}else save();renderBadges()}
document.getElementById('newChallengeBtn').onclick=newChallenge;

function exportData(){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='my-guitar-progression.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
document.getElementById('exportBtn').onclick=exportData;document.getElementById('importInput').onchange=async e=>{const f=e.target.files?.[0];if(!f)return;try{const data=JSON.parse(await f.text());state={...defaultState(),...data};save();renderAll();alert('Progression restaurée.')}catch(err){alert('Fichier invalide.')}};

window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;document.getElementById('installBtn').hidden=false});document.getElementById('installBtn').onclick=async()=>{if(!installPrompt)return;installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;document.getElementById('installBtn').hidden=true};
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));

renderRiff();renderFretboard();renderAll();newChallenge();
