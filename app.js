const KEY='my_guitar_state_v1';
const DAILY_GOAL=10;
const STRINGS=[
  {label:'Mi grave',short:'E6'},
  {label:'La',short:'A5'},
  {label:'Ré',short:'D4'},
  {label:'Sol',short:'G3'},
  {label:'Si',short:'B2'},
  {label:'Mi aigu',short:'E1'}
];
const FOCUS_STRING_INDEX=1;
const FOCUS_FRETS=[2,3,5,7,10];
const RIFF=[7,7,10,7,5,3,2];
const LESSONS=[
  {id:'l1',title:'Repérer la 5e corde',mins:5,skill:'Cordes',body:'Pour l’instant, ne t’occupe que d’une corde : la 5e corde, la corde de La. C’est celle que tu utilises pour Seven Nation Army.',tip:'Compte les cordes depuis la plus fine : 1, 2, 3, 4, 5. Tu arrives sur la corde de La.',visual:'focusString'},
  {id:'l2',title:'Les frettes du riff',mins:6,skill:'Cases',body:'Sur la 5e corde, repère seulement les frettes utiles : 2, 3, 5, 7 et 10. Pas besoin d’apprendre les notes.',tip:'Regarde le numéro de frette et place ton doigt juste derrière la barrette métallique.',visual:'focusFrets'},
  {id:'l3',title:'Premier motif',mins:6,skill:'Riffs',body:'Joue le début du riff sur la 5e corde : 7 · 7 · 10 · 7.',tip:'Fais sonner chaque frette proprement avant de chercher la vitesse.',visual:'riffStart'},
  {id:'l4',title:'Fin du motif',mins:6,skill:'Riffs',body:'Travaille maintenant la fin : 5 · 3 · 2, toujours sur la 5e corde.',tip:'Descends tranquillement le manche sans crisper la main.',visual:'riffEnd'},
  {id:'l5',title:'Seven Nation Army · lentement',mins:8,skill:'Riffs',body:'Enchaîne tout le motif : 7 · 7 · 10 · 7 · 5 · 3 · 2. Une seule corde, uniquement les frettes.',tip:'Si tu rates une frette, recommence plus lentement sans te presser.',visual:'riff'},
  {id:'l6',title:'Seven Nation Army · en continu',mins:10,skill:'Riffs',body:'Répète le riff plusieurs fois sans t’arrêter. Le but est d’avoir un mouvement régulier et des notes propres.',tip:'La régularité compte plus que la vitesse.',visual:'riff'},
  {id:'l7',title:'Tenir le médiator',mins:7,skill:'Technique',body:'Tiens le médiator entre le pouce et le côté de l’index, en laissant dépasser seulement une petite pointe.',tip:'Ne serre pas trop fort : garde la main souple.',visual:'practice'},
  {id:'l8',title:'Garder un tempo simple',mins:8,skill:'Rythme',body:'Joue le riff lentement avec un tempo régulier. Le métronome peut rester à 60 BPM pour commencer.',tip:'N’accélère que lorsque les frettes sont propres.',visual:'rhythm'},
  {id:'l9',title:'Riff sans regarder tout le temps',mins:8,skill:'Technique',body:'Essaie de jouer une partie du riff en regardant moins souvent la main gauche.',tip:'Commence par mémoriser le trajet 7 → 10 → 7.',visual:'riff'},
  {id:'l10',title:'Premier accord simple : Em',mins:10,skill:'Accords',body:'Quand le riff devient facile, découvre un premier accord simple : Em. Pas de solfège, uniquement la position des doigts.',tip:'Vérifie les cordes une par une avant de gratter l’accord entier.',visual:'em'},
  {id:'l11',title:'Deuxième accord simple : Am',mins:10,skill:'Accords',body:'Ajoute Am et entraîne-toi à passer doucement de Em à Am.',tip:'Cherche un changement propre, pas rapide.',visual:'am'},
  {id:'l12',title:'Mini morceau',mins:12,skill:'Riffs',body:'Mélange ton riff, un rythme simple et quelques accords pour jouer quelque chose de musical sans passer par le solfège.',tip:'Le but est de jouer et de prendre du plaisir, pas de tout connaître.',visual:'practice'}
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
function riffHtml(seq){return `<div class="riff-steps">${seq.map(n=>`<span class="riff-step">${n}</span>`).join('')}</div>`}

function showView(id){document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===id));document.querySelectorAll('.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===id));window.scrollTo({top:0,behavior:'smooth'})}
document.querySelectorAll('.bottom-nav button').forEach(b=>b.onclick=()=>showView(b.dataset.view));
document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>showView(b.dataset.go));

document.getElementById('startNextBtn').onclick=()=>showView('play');
document.querySelector('[data-action="challenge"]').onclick=()=>{showView('challenges');newChallenge()};
document.querySelector('[data-action="metronome"]').onclick=()=>showView('play');

function renderHome(){syncDay();document.getElementById('levelLabel').textContent=`Niveau ${level()} · Débutant absolu`;document.getElementById('nextLessonText').textContent='5e corde (La) · frettes 7 · 7 · 10 · 7 · 5 · 3 · 2';document.getElementById('xpStat').textContent=state.xp;document.getElementById('streakStat').textContent=state.streak;document.getElementById('minutesStat').textContent=state.minutes;document.getElementById('goalText').textContent=`${Math.min(state.todayMinutes,DAILY_GOAL)} / ${DAILY_GOAL} min`;document.getElementById('dailyProgress').style.width=`${Math.min(100,state.todayMinutes/DAILY_GOAL*100)}%`}
function renderLessons(){const done=state.completed.length;document.getElementById('courseProgressLabel').textContent=`${done} / ${LESSONS.length}`;document.getElementById('lessonList').innerHTML=LESSONS.map((l,i)=>{const completed=state.completed.includes(l.id);const unlocked=i===0||state.completed.includes(LESSONS[i-1].id);return `<button class="lesson-item card ${completed?'done':''} ${unlocked?'':'locked'}" data-lesson="${l.id}" ${unlocked?'':'disabled'}><span class="lesson-num">${completed?'✓':i+1}</span><span><strong>${esc(l.title)}</strong><small>${l.mins} min · ${esc(l.skill)}</small></span><span class="chev">›</span></button>`}).join('');document.querySelectorAll('[data-lesson]').forEach(b=>b.onclick=()=>openLesson(b.dataset.lesson))}
function renderProgress(){document.getElementById('progressXp').textContent=state.xp;document.getElementById('progressLessons').textContent=state.completed.length;document.getElementById('progressMinutes').textContent=state.minutes;const skills=['Cordes','Cases','Technique','Rythme','Accords','Riffs'];document.getElementById('skillBars').innerHTML=skills.map(skill=>{const all=LESSONS.filter(l=>l.skill===skill).length||1;const done=LESSONS.filter(l=>l.skill===skill&&state.completed.includes(l.id)).length;const pct=Math.round(done/all*100);return `<div><div class="skill-head"><span>${skill}</span><strong>${pct}%</strong></div><div class="skill-track"><div style="width:${pct}%"></div></div></div>`}).join('')}
function renderBadges(){const badges=[['🎸','5e corde repérée',state.completed.includes('l1')],['🔥','3 jours de suite',state.streak>=3],['🎵','Seven Nation Army',state.completed.includes('l6')],['⏱','30 min de pratique',state.minutes>=30],['🎯','10 défis réussis',state.challengeWins>=10],['⭐','500 XP',state.xp>=500]];document.getElementById('badges').innerHTML=badges.map(([ico,name,ok])=>`<div class="badge ${ok?'':'locked'}"><strong>${ico} ${name}</strong><small>${ok?'Débloqué':'À débloquer'}</small></div>`).join('')}
function renderAll(){renderHome();renderLessons();renderProgress();renderBadges()}

function openLesson(id){const l=LESSONS.find(x=>x.id===id);if(!l)return;lessonOpen=l;document.getElementById('lessonKicker').textContent=`Leçon ${LESSONS.indexOf(l)+1} · ${l.mins} min · ${l.skill}`;document.getElementById('lessonTitle').textContent=l.title;document.getElementById('lessonBody').textContent=l.body;document.getElementById('lessonTip').textContent='Astuce : '+l.tip;document.getElementById('lessonVisual').innerHTML=lessonVisual(l);document.getElementById('completeLessonBtn').textContent=state.completed.includes(l.id)?'✓ Déjà terminée':'✓ Terminer la leçon';document.getElementById('lessonDialog').showModal()}
function lessonVisual(l){if(l.visual==='focusString')return `<div class="info-box"><strong>5e corde = La (A5)</strong><br>Pour cet exercice, ignore les 5 autres cordes.</div>`;if(l.visual==='focusFrets')return `<div class="info-box"><strong>Frettes utiles :</strong>${riffHtml(FOCUS_FRETS)}</div>`;if(l.visual==='riffStart')return riffHtml([7,7,10,7]);if(l.visual==='riffEnd')return riffHtml([5,3,2]);if(l.visual==='riff')return riffHtml(RIFF);if(l.visual==='rhythm')return `<div class="info-box" style="text-align:center;font-size:28px">7 &nbsp; 7 &nbsp; 10 &nbsp; 7<br><small>garde un mouvement régulier</small></div>`;if(l.visual==='em')return chordDiagram('Em',[0,2,2,0,0,0]);if(l.visual==='am')return chordDiagram('Am',['x',0,2,2,1,0]);return `<div class="info-box">Prends ta guitare et fais l’exercice tranquillement. Quand tu es à l’aise, valide la leçon.</div>`}
function chordDiagram(name,frets){return `<div class="info-box"><strong>${name}</strong><div class="riff-steps">${frets.map((f,i)=>`<span class="riff-step" title="${STRINGS[i].label}">${f}</span>`).join('')}</div><small>De la corde grave vers l’aiguë · x = ne pas jouer</small></div>`}
document.getElementById('closeLesson').onclick=()=>document.getElementById('lessonDialog').close();
document.getElementById('completeLessonBtn').onclick=()=>{if(!lessonOpen)return;if(!state.completed.includes(lessonOpen.id)){state.completed.push(lessonOpen.id);practice(lessonOpen.mins,50)}document.getElementById('lessonDialog').close();renderAll()};

function renderFretboard(){const fb=document.getElementById('fretboard');const s=STRINGS[FOCUS_STRING_INDEX];fb.innerHTML=`<div class="fret-row"><div class="string-name">${s.short}<br><small>5e corde</small></div>${FOCUS_FRETS.map(f=>`<button data-fret="${f}">${f}</button>`).join('')}</div>`;fb.querySelectorAll('button').forEach(b=>b.onclick=()=>{fb.querySelectorAll('button').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');const f=+b.dataset.fret;document.getElementById('fretInfo').innerHTML=`<strong>5e corde</strong> · frette <strong>${f}</strong> · joue seulement cette corde`})}

function playRiff(delay){clearInterval(riffTimer);const steps=[...document.querySelectorAll('#riffSteps .riff-step')];let i=0;steps.forEach(s=>s.classList.remove('active'));const tick=()=>{steps.forEach(s=>s.classList.remove('active'));steps[i].classList.add('active');i++;if(i>=steps.length){setTimeout(()=>steps.forEach(s=>s.classList.remove('active')),delay);clearInterval(riffTimer)}};tick();riffTimer=setInterval(tick,delay)}
function renderRiff(){document.getElementById('riffSteps').innerHTML=RIFF.map(n=>`<span class="riff-step">${n}</span>`).join('')}
document.getElementById('riffSlow').onclick=()=>playRiff(900);document.getElementById('riffNormal').onclick=()=>playRiff(520);
document.getElementById('riffDone').onclick=()=>{practice(5,20);const b=document.getElementById('riffDone');b.textContent='✓ 5 min enregistrées';setTimeout(()=>b.textContent='✓ J’ai pratiqué 5 min',1500)};

function clickSound(accent=false){try{metro.ctx=metro.ctx||new (window.AudioContext||window.webkitAudioContext)();const o=metro.ctx.createOscillator(),g=metro.ctx.createGain();o.frequency.value=accent?1050:760;g.gain.setValueAtTime(.001,metro.ctx.currentTime);g.gain.exponentialRampToValueAtTime(.16,metro.ctx.currentTime+.002);g.gain.exponentialRampToValueAtTime(.001,metro.ctx.currentTime+.06);o.connect(g).connect(metro.ctx.destination);o.start();o.stop(metro.ctx.currentTime+.07)}catch(e){}}
function metroTick(){const dots=[...document.querySelectorAll('#beatDots span')];dots.forEach(x=>x.classList.remove('on'));dots[metro.beat].classList.add('on');clickSound(metro.beat===0);metro.beat=(metro.beat+1)%4}
function startMetro(){stopMetro();metro.playing=true;metro.beat=0;metroTick();metro.timer=setInterval(metroTick,60000/metro.bpm);document.getElementById('metroToggle').textContent='■'}
function stopMetro(){clearInterval(metro.timer);metro.timer=null;metro.playing=false;document.getElementById('metroToggle').textContent='▶';document.querySelectorAll('#beatDots span').forEach(x=>x.classList.remove('on'))}
function setBpm(v){metro.bpm=Math.min(180,Math.max(40,v));document.getElementById('bpmLabel').textContent=metro.bpm+' BPM';if(metro.playing)startMetro()}
document.getElementById('metroToggle').onclick=()=>metro.playing?stopMetro():startMetro();document.getElementById('bpmMinus').onclick=()=>setBpm(metro.bpm-5);document.getElementById('bpmPlus').onclick=()=>setBpm(metro.bpm+5);

let challengeAnswer=null;
function newChallenge(){const opts=document.getElementById('challengeOptions');document.getElementById('challengeResult').textContent='';const askNext=Math.random()<0.5;if(askNext){const i=Math.floor(Math.random()*(RIFF.length-1));const current=RIFF[i],next=RIFF[i+1];challengeAnswer=String(next);document.getElementById('challengeQuestion').textContent=`Après ${current}, quelle frette vient ensuite ?`;document.getElementById('challengeHelp').textContent='Toujours sur la 5e corde.';const choices=[...new Set([next,...FOCUS_FRETS].slice(0,5))].sort(()=>Math.random()-.5).slice(0,4);if(!choices.includes(next))choices[0]=next;opts.innerHTML=choices.map(n=>`<button data-answer="${n}">Frette ${n}</button>`).join('')}else{const fret=FOCUS_FRETS[Math.floor(Math.random()*FOCUS_FRETS.length)];challengeAnswer=String(fret);document.getElementById('challengeQuestion').textContent=`Trouve la frette ${fret}`;document.getElementById('challengeHelp').textContent='Parmi les frettes utilisées dans Seven Nation Army.';opts.innerHTML=FOCUS_FRETS.map(n=>`<button data-answer="${n}">${n}</button>`).join('')}opts.querySelectorAll('button').forEach(b=>b.onclick=()=>answerChallenge(b))}
function answerChallenge(btn){document.querySelectorAll('#challengeOptions button').forEach(b=>b.disabled=true);const ok=btn.dataset.answer===challengeAnswer;btn.classList.add(ok?'correct':'wrong');document.getElementById('challengeResult').textContent=ok?'✅ Correct · +10 XP':'❌ Pas encore. Regarde le riff puis retente.';if(ok){state.challengeWins++;practice(1,10)}else save();renderBadges()}
document.getElementById('newChallengeBtn').onclick=newChallenge;

function exportData(){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='my-guitar-progression.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
document.getElementById('exportBtn').onclick=exportData;document.getElementById('importInput').onchange=async e=>{const f=e.target.files?.[0];if(!f)return;try{const data=JSON.parse(await f.text());state={...defaultState(),...data};save();renderAll();alert('Progression restaurée.')}catch(err){alert('Fichier invalide.')}};

window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;document.getElementById('installBtn').hidden=false});document.getElementById('installBtn').onclick=async()=>{if(!installPrompt)return;installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;document.getElementById('installBtn').hidden=true};
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));

renderRiff();renderFretboard();renderAll();newChallenge();
