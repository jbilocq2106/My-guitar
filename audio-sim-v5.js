/* My Guitar v5 — audio simulator for current exercises */
(function(){
  const OPEN_A_HZ=110; // 5e corde à vide (La)
  let ctx=null;
  let activeSources=[];
  let playToken=0;

  function ensureAudio(){
    if(!ctx)ctx=new (window.AudioContext||window.webkitAudioContext)();
    if(ctx.state==='suspended')ctx.resume().catch(()=>{});
    return ctx;
  }

  function stopAudio(){
    playToken++;
    activeSources.forEach(s=>{try{s.stop()}catch(e){}});
    activeSources=[];
    document.querySelectorAll('.riff-step.audio-active').forEach(x=>x.classList.remove('audio-active'));
    const status=document.getElementById('audioSimStatus');
    if(status)status.textContent='Prêt';
  }

  function pluckFret(fret,when=0,duration=.55){
    const ac=ensureAudio();
    const start=Math.max(ac.currentTime+.01,when||ac.currentTime+.01);
    const freq=OPEN_A_HZ*Math.pow(2,Number(fret)/12);

    const osc=ac.createOscillator();
    const overtone=ac.createOscillator();
    const gain=ac.createGain();
    const overtoneGain=ac.createGain();
    const filter=ac.createBiquadFilter();

    osc.type='triangle';
    osc.frequency.setValueAtTime(freq,start);
    overtone.type='sine';
    overtone.frequency.setValueAtTime(freq*2,start);
    filter.type='lowpass';
    filter.frequency.setValueAtTime(Math.min(2400,freq*8),start);
    filter.Q.value=.7;

    gain.gain.setValueAtTime(.0001,start);
    gain.gain.exponentialRampToValueAtTime(.32,start+.008);
    gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
    overtoneGain.gain.setValueAtTime(.0001,start);
    overtoneGain.gain.exponentialRampToValueAtTime(.09,start+.006);
    overtoneGain.gain.exponentialRampToValueAtTime(.0001,start+Math.min(duration,.30));

    osc.connect(gain).connect(filter).connect(ac.destination);
    overtone.connect(overtoneGain).connect(filter);
    osc.start(start); overtone.start(start);
    osc.stop(start+duration+.03); overtone.stop(start+duration+.03);
    activeSources.push(osc,overtone);
  }

  function sequenceFrom(container){
    return [...container.querySelectorAll('.riff-step')]
      .map(x=>Number(x.textContent.trim()))
      .filter(Number.isFinite);
  }

  function playSequence(seq,stepMs=650,visualRoot=null){
    if(!seq?.length)return;
    stopAudio();
    const token=++playToken;
    const ac=ensureAudio();
    const base=ac.currentTime+.06;
    const steps=visualRoot?[...visualRoot.querySelectorAll('.riff-step')]:[];
    const status=document.getElementById('audioSimStatus');
    if(status)status.textContent='Lecture…';

    seq.forEach((fret,i)=>{
      const at=base+(i*stepMs/1000);
      pluckFret(fret,at,Math.min(.72,stepMs/1000*.9));
      setTimeout(()=>{
        if(token!==playToken)return;
        steps.forEach(x=>x.classList.remove('audio-active'));
        steps[i]?.classList.add('audio-active');
      },Math.max(0,(at-ac.currentTime)*1000));
    });

    setTimeout(()=>{
      if(token!==playToken)return;
      steps.forEach(x=>x.classList.remove('audio-active'));
      if(status)status.textContent='Prêt';
    },seq.length*stepMs+180);
  }

  function injectSimulator(){
    const playView=document.getElementById('play');
    const riffCard=playView?.querySelector('.riff-card');
    if(!riffCard||document.getElementById('audioSimulator'))return;

    const card=document.createElement('div');
    card.id='audioSimulator';
    card.className='card';
    card.innerHTML=`
      <div class="section-head"><h2>🔊 Simulateur sonore</h2><span id="audioSimStatus">Prêt</span></div>
      <p class="muted">Écoute le rendu de l’exercice avant de le jouer. Son synthétique basé sur la 5e corde.</p>
      <div class="row">
        <button id="audioSlow" class="secondary">🔊 Écouter lentement</button>
        <button id="audioNormal" class="primary">▶ Écouter normal</button>
      </div>
      <button id="audioStop" class="ghost">■ Stop</button>`;
    riffCard.insertAdjacentElement('afterend',card);

    document.getElementById('audioSlow').onclick=()=>playSequence(window.RIFF||[7,7,10,7,5,3,2],900,document.getElementById('riffSteps'));
    document.getElementById('audioNormal').onclick=()=>playSequence(window.RIFF||[7,7,10,7,5,3,2],520,document.getElementById('riffSteps'));
    document.getElementById('audioStop').onclick=stopAudio;
  }

  function bindExistingRiffButtons(){
    const slow=document.getElementById('riffSlow');
    const normal=document.getElementById('riffNormal');
    slow?.addEventListener('click',()=>playSequence(sequenceFrom(document.getElementById('riffSteps')),900,document.getElementById('riffSteps')));
    normal?.addEventListener('click',()=>playSequence(sequenceFrom(document.getElementById('riffSteps')),520,document.getElementById('riffSteps')));
  }

  function bindFretboard(){
    const board=document.getElementById('fretboard');
    board?.addEventListener('click',e=>{
      const btn=e.target.closest('button[data-fret]');
      if(!btn)return;
      pluckFret(Number(btn.dataset.fret));
    });
  }

  function addLessonListenButton(){
    const visual=document.getElementById('lessonVisual');
    if(!visual)return;
    visual.querySelector('.lesson-audio-btn')?.remove();
    const seq=sequenceFrom(visual);
    if(!seq.length)return;
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='secondary lesson-audio-btn';
    btn.textContent='🔊 Écouter cet exercice';
    btn.onclick=()=>playSequence(seq,700,visual);
    visual.appendChild(btn);
  }

  const style=document.createElement('style');
  style.textContent=`
    #audioSimulator{display:grid;gap:12px}
    #audioSimulator .row{display:grid;grid-template-columns:1fr 1fr;gap:8px}
    #audioSimulator button{min-height:44px}
    .lesson-audio-btn{width:100%;margin-top:12px}
    .riff-step.audio-active{transform:translateY(-3px) scale(1.06);box-shadow:0 0 0 2px rgba(255,255,255,.55),0 8px 24px rgba(0,0,0,.25)}
    @media(max-width:430px){#audioSimulator .row{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  injectSimulator();
  bindExistingRiffButtons();
  bindFretboard();

  const visual=document.getElementById('lessonVisual');
  if(visual)new MutationObserver(addLessonListenButton).observe(visual,{childList:true,subtree:true});

  window.addEventListener('pagehide',stopAudio);
})();
