const $=s=>document.querySelector(s);
const ADMIN=!!window.ADMIN_MODE;
const clone=o=>JSON.parse(JSON.stringify(o));
function normalize(d){d=d||{};['chapters','trips','alianza','quotes','reasons'].forEach(k=>{if(!Array.isArray(d[k]))d[k]=[]});['letter','since','giftMsg'].forEach(k=>{if(typeof d[k]!=='string')d[k]=''});return d}
let D=normalize({});
const PENDING={};                       // vista previa de archivos recién subidos
const src=p=>PENDING[p]||p||'';         // ruta -> URL usable
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const el=h=>{const t=document.createElement('template');t.innerHTML=h.trim();return t.content.firstChild};
const GROUPS=[['chapters','Capítulos de nuestra historia'],['trips','Nuestros viajes'],['alianza','Alianza Lima']];
let previewLock=false;

/* ---------- OBSERVADORES DE ANIMACIÓN PARA LA CARTA ---------- */
const letterObs = new IntersectionObserver((entries) => {
   entries.forEach(entry => {
      if(entry.isIntersecting) {
         entry.target.classList.add('visible');
         setTimeout(()=> entry.target.classList.add('floating'), 1100);
         letterObs.unobserve(entry.target);
      }
   });
}, { threshold: 0.1 });

const textObs = new IntersectionObserver((entries) => {
   entries.forEach(entry => {
      if(entry.isIntersecting) {
         setTimeout(()=> entry.target.classList.add('show'), entry.target.dataset.delay || 0);
         textObs.unobserve(entry.target);
      }
   });
}, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });

/* ---------- Render de la página ---------- */
function cardHtml(o,i,ep){return `<div class="ph" ${o.img?`style="background-image:url('${src(o.img)}')"`:''}></div><div class="cap">${ep?`<div class="ep">E${i+1}</div>`:''}<b>${esc(o.t)}</b><span>${esc(o.d)}</span></div>`}
function renderPage(){
  // Intro / envelope
  $('#introTitle').textContent = D.introTitle ?? '';
  $('#cardSmall').textContent = D.cardSmall ?? '';
  $('#cardLine1').textContent = D.cardLine1 ?? '';
  $('#cardLine2').textContent = D.cardLine2 ?? '';
  $('#cardSmall').hidden = !String(D.cardSmall ?? '').trim();
  $('#cardLine1').hidden = !String(D.cardLine1 ?? '').trim();
  $('#cardLine2').hidden = !String(D.cardLine2 ?? '').trim();
  $('#cardTitle').hidden = !String(D.cardLine1 ?? '').trim() && !String(D.cardLine2 ?? '').trim();
  $('#introTitle').hidden = !String(D.introTitle ?? '').trim();

  // Main hero
  $('#heroTitle').textContent = D.heroTitle ?? '';
  $('#heroTitle').hidden = !String(D.heroTitle ?? '').trim();
  $('#nom').textContent = D.name ?? '';
  $('#heroTag').textContent = D.heroTag ?? '';
  $('#heroTag').hidden = !String(D.heroTag ?? '').trim();
  $('#heroMeta1').textContent = D.heroMeta1 ?? '';
  $('#heroMeta2').textContent = D.heroMeta2 ?? '';
  $('#heroMeta3').textContent = D.heroMeta3 ?? '';
  $('#heroMeta1').hidden = !String(D.heroMeta1 ?? '').trim();
  $('#heroMeta2').hidden = !String(D.heroMeta2 ?? '').trim();
  $('#heroMeta3').hidden = !String(D.heroMeta3 ?? '').trim();
  $('#heroDesc').textContent = D.heroDesc ?? '';
  $('#heroDesc').hidden = !String(D.heroDesc ?? '').trim();

  $('#letterTitle').textContent = D.letterTitle ?? '';
  $('#letterTitle').hidden = !String(D.letterTitle ?? '').trim();

  const heroBg = D.heroImg || D.chapters.find(o=>o.img)?.img || D.trips.find(o=>o.img)?.img || D.alianza.find(o=>o.img)?.img;
  $('#hero').style.backgroundImage=heroBg?`url("${src(heroBg)}")`:`linear-gradient(135deg,#0b3a9c33,#141414)`;

  [['r1','chapters',1],['r2','trips'],['r3','alianza']].forEach(([id,k,ep])=>{
    const b=$('#'+id);b.innerHTML='';
    D[k].forEach((o,i)=>{
      const c=document.createElement('div');c.className='c';c.innerHTML=cardHtml(o,i,ep);b.appendChild(c)
    })
  });

  const vis=a=>a.map((t,i)=>({t,i})).filter(o=>String(o.t).trim());
  $('#r4').innerHTML=vis(D.quotes).map((o,n)=>`<div class="q script ${['','w','l'][n%3]}" data-i="${o.i}">${esc(o.t)}</div>`).join('');
  $('#r5').innerHTML=vis(D.reasons).map((o,n)=>`<div data-i="${o.i}"><b style="color:var(--red);font-size:18px">#${n+1}</b><br>${esc(o.t)}</div>`).join('');

  // Carta
  $('#letter').innerHTML=D.letter.split(/\n\s*\n/).filter(Boolean).map((p,i)=>`<p class="hid" data-delay="${i*250}">${esc(p)}</p>`).join('');
  $('#sign').textContent=D.sign ?? '';
  $('#sign').hidden=!String(D.sign ?? '').trim();

  letterObs.observe($('#paper-doc'));
  document.querySelectorAll('#letter p.hid').forEach(el => textObs.observe(el));

  // Keep external MP3 URL working after every render.
  if(D.audio){
    if(bgm.getAttribute('src')!==src(D.audio))bgm.src=src(D.audio); // no reiniciar la canción en cada edición
    bgm.volume=(D.musicVolume??25)/100;
  }else if(bgm.hasAttribute('src')){
    bgm.removeAttribute('src');
  }

  tick();
}
function tick(){
  const dateStr = D.since.includes('T') ? D.since : D.since + 'T00:00:00';
  const s=new Date(dateStr),ms=Date.now()-s;
  if(!isNaN(ms)&&ms>=0)$('#count').innerHTML=[[Math.floor(ms/864e5),'días'],[Math.floor(ms/36e5)%24,'hrs'],[Math.floor(ms/6e4)%60,'min'],[Math.floor(ms/1e3)%60,'seg']].map(([v,l])=>`<div><b>${v}</b><span>${l}</span></div>`).join('');
  lockUI();
}

const lockMs=()=>{if(!D.unlock||!(!ADMIN||previewLock))return 0;return Math.max(0,new Date(D.unlock).getTime()-Date.now())};
function lockUI(){
  const ms=lockMs(),b=$('#lockbox');
  if(ms>0){
    const d=Math.floor(ms/864e5),h=Math.floor(ms/36e5)%24,m=Math.floor(ms/6e4)%60,s=Math.floor(ms/1e3)%60;
    b.innerHTML=`<div>LA SERIE SE ESTRENA EN</div><div class="cd">${[[d,'DÍAS'],[h,'HRS'],[m,'MIN'],[s,'SEG']].map(([v,l])=>`<div><b>${String(v).padStart(2,'0')}</b><span>${l}</span></div>`).join('')}</div>`;
    $('#env').style.opacity=.9; $('#env').style.pointerEvents='none';
  }else{
    if(!b.dataset.ok){b.innerHTML='<span class="pulse" style="color:#fff;font-weight:600">TOCA EL SOBRE PARA ABRIRLO ♥</span>';b.dataset.ok=1;$('#env').style.opacity=1;$('#env').style.pointerEvents='auto'}
  }
  if(ms>0)delete b.dataset.ok;
}
setInterval(tick,1000);

// Abrir el sobre: este era el controlador que faltaba.
$('#env').onclick=()=>{
  const ms=lockMs();
  if(ms>0){
    $('#env').classList.remove('shake');
    void $('#env').offsetWidth;
    $('#env').classList.add('shake');
    return;
  }
  if($('#env').classList.contains('open')) return;
  $('#env').classList.add('open');
  music(true);
  setTimeout(()=>{
    $('#intro').classList.add('gone');
    document.body.style.overflow='';
  },850);
};
addEventListener('scroll',()=>$('#nav').classList.toggle('sc',scrollY>30),{passive:true});

/* ---------- Música: MP3 local + YouTube con API ---------- */
const bgm=$('#bgm');
let ytPlayer=null, ytReady=false, musicWanted=false, ytCurrent='', gestureArmed=false;

function normalizeYouTubeId(value){
  const v=String(value||'').trim();
  if(!v) return '';
  if(/^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
  try{
    const u=new URL(v);
    if(u.hostname.includes('youtu.be')) return (u.pathname.split('/').filter(Boolean)[0]||'').slice(0,11);
    if(u.hostname.includes('youtube.com')){
      const q=u.searchParams.get('v');
      if(q) return q.slice(0,11);
      const parts=u.pathname.split('/').filter(Boolean);
      const i=parts.findIndex(x=>['embed','shorts','live'].includes(x));
      if(i>=0 && parts[i+1]) return parts[i+1].slice(0,11);
    }
  }catch(e){}
  const m=v.match(/(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([a-zA-Z0-9_-]{11})/);
  return m?m[1]:'';
}
function setMusicStatus(t){const e=$('#musicStatus');if(e)e.textContent=t}
function setVolume(v){
  v=Math.max(0,Math.min(100,Number(v)||0)); D.musicVolume=v;
  bgm.volume=v/100;
  if(ytPlayer && ytReady){try{ytPlayer.setVolume(v); if(v===0)ytPlayer.mute(); else ytPlayer.unMute()}catch(e){}}
  const r=$('#musicVol'); if(r)r.value=v;
}
function ensureYouTubeApi(){
  if(window.YT && YT.Player) return Promise.resolve();
  return new Promise(resolve=>{
    const old=window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady=()=>{if(old)old();resolve()};
    if(!document.querySelector('script[src*="youtube.com/iframe_api"]')){
      const sc=document.createElement('script');sc.src='https://www.youtube.com/iframe_api';document.head.appendChild(sc);
    }
    setTimeout(resolve,5000);
  });
}
async function initYouTube(){
  const id=normalizeYouTubeId(D.ytid);
  if(!id){setMusicStatus('YouTube no válido');return false}
  await ensureYouTubeApi();
  if(!window.YT || !YT.Player){setMusicStatus('YouTube no disponible');return false}
  if(ytPlayer){
    if(ytCurrent!==id){try{ytPlayer.loadVideoById(id);ytCurrent=id}catch(e){}}
    return true;
  }
  ytCurrent=id;
  const host=document.createElement('div');
  host.id='ytMusicPlayer';
  host.style.cssText='position:fixed;width:1px;height:1px;left:-100px;top:-100px;opacity:.01;pointer-events:none';
  document.body.appendChild(host);
  ytPlayer=new YT.Player(host,{
    width:'1',height:'1',videoId:id,
    playerVars:{autoplay:1,controls:0,loop:1,playlist:id,playsinline:1,rel:0},
    events:{
      onReady:e=>{ytReady=true;setVolume(D.musicVolume??25);if(musicWanted)e.target.playVideo()},
      onStateChange:e=>{
        if(window.YT&&e.data===YT.PlayerState.PLAYING){setMusicStatus('Reproduciendo');$('#musicToggle').textContent='❚❚'}
        else if(window.YT&&e.data===YT.PlayerState.PAUSED){setMusicStatus('Pausada');$('#musicToggle').textContent='▶'}
      },
      onAutoplayBlocked:()=>setMusicStatus('El navegador bloqueó el autoplay'),
      onError:()=>setMusicStatus('YouTube no permite reproducir este video')
    }
  });
  return true;
}
// Si el navegador bloquea el autoplay, la música arranca con el primer toque en cualquier parte.
function armGesture(){
  if(gestureArmed)return; gestureArmed=true;
  const evs=['pointerdown','touchend','click','keydown'];
  const go=async()=>{
    if(!musicWanted){off();return}
    await music(true);
    let ok=false;
    if(D.audio)ok=!bgm.paused;
    else if(ytPlayer&&ytReady){try{ok=ytPlayer.getPlayerState()===1}catch(e){}}
    if(ok)off();
  };
  function off(){evs.forEach(e=>removeEventListener(e,go,true));gestureArmed=false}
  evs.forEach(e=>addEventListener(e,go,true));
}
async function music(on){
  musicWanted=!!on;
  if(D.audio){
    if(bgm.getAttribute('src')!==src(D.audio))bgm.src=src(D.audio);
    bgm.volume=(D.musicVolume??25)/100;
    if(on){
      try{await bgm.play();setMusicStatus('Reproduciendo');$('#musicToggle').textContent='❚❚'}
      catch(e){setMusicStatus('Pulsa ▶ para reproducir');armGesture()}
    }else{bgm.pause();setMusicStatus('Pausada');$('#musicToggle').textContent='▶'}
    return;
  }
  const id=normalizeYouTubeId(D.ytid);
  if(!id){setMusicStatus('Sin música');return}
  const ok=await initYouTube();
  if(!ok)return;
  setVolume(D.musicVolume??25);
  if(ytPlayer && ytReady){try{on?ytPlayer.playVideo():ytPlayer.pauseVideo()}catch(e){}}
  if(on)armGesture();
}
$('#musicToggle').onclick=()=>music(!musicWanted);
$('#musicVol').oninput=e=>setVolume(e.target.value);
setVolume(D.musicVolume??25);

/* ---------- Película ---------- */
let ftimer,filmOn=false;
function closeFilm(toLetter){clearTimeout(ftimer);filmOn=false;const f=$('#film');f.className='';f.innerHTML='';music(true);if(toLetter)location.hash='#carta'}
function playFilm(){
  const f=$('#film');filmOn=true;f.className='on';
  f.innerHTML='<div class="l"></div><div class="l"></div><div class="bar t"></div><div class="bar bt"></div><div class="fc"></div><button class="x" aria-label="Cerrar">✕</button><div class="pg"><i></i></div>';
  f.querySelector('.x').onclick=()=>closeFilm();
  if(D.video){music(false);const v=document.createElement('video');v.src=src(D.video);v.playsInline=true;v.autoplay=true;v.controls=true;v.onended=()=>closeFilm(true);f.insertBefore(v,f.firstChild);v.play().catch(()=>{});return}
  const S=[{m:1,t:'Una historia de amor',s:'Para '+D.name}];
  GROUPS.forEach(([k])=>D[k].forEach(o=>S.push({img:o.img,t:o.t,s:o.d})));
  S.push({m:1,t:'Y esto apenas empieza…',s:D.sign});
  const L=f.querySelectorAll('.l'),fc=f.querySelector('.fc'),pg=f.querySelector('.pg i');let i=0;
  const show=()=>{
    if(!filmOn)return;if(i>=S.length){closeFilm(true);return}
    const sc=S[i],l=L[i%2],o=L[(i+1)%2];
    l.style.background=sc.img?`center/cover url("${src(sc.img)}")`:`linear-gradient(${120+i*37}deg,#0b3a9c,#2a0813)`;
    l.style.animation='none';void l.offsetWidth;l.style.animation='kb 7s ease-out forwards';
    l.classList.add('s');o.classList.remove('s');
    fc.className='fc'+(sc.m?' mid':'');fc.innerHTML=`<h4 class="script">${esc(sc.t)}</h4><p>${esc(sc.s)}</p>`;
    pg.style.width=((i+1)/S.length*100)+'%';i++;ftimer=setTimeout(show,sc.m?4200:5200)};
  show();
}
$('#playBtn').onclick=()=>{ music(true); playFilm(); };


/* ---------- LÓGICA MINIJUEGO RETRO (DIFÍCIL) ---------- */
let gkInt, gScore=0, isShooting=false;

// Función para abrir el juego
$('#love').onclick = () => {
   $('#minigame').classList.add('on');
   document.body.style.overflow='hidden';
   gScore = 0; $('#g-score').textContent = gScore;
   isShooting = false;
   resetBall();
   startKeeper();
};

// Función para cerrar el juego (Botón X)
$('#btn-close-game').onclick = () => {
   clearInterval(gkInt);
   $('#minigame').classList.remove('on');
   document.body.style.overflow='';
};

function resetBall() {
   const ball = $('#ball');
   ball.style.transition = 'none';
   ball.style.left = '46%'; 
   ball.style.bottom = '10%';
   ball.style.transform = 'scale(1)';
   void ball.offsetWidth;
}

function startKeeper() {
   clearInterval(gkInt);
   const gk = $('#gk');
   let targetX = 42; // Posición base inicial (centro)
   
   gkInt = setInterval(()=>{
      if(isShooting) return; // Se queda quieto mientras la pelota vuela (o podrías hacer que se tire)
      
      let currentX = parseFloat(gk.style.left || 42);
      
      // Si el arquero está cerca de su objetivo, elige uno nuevo al azar
      if(Math.abs(currentX - targetX) < 2) {
         // El arquero se moverá rápidamente a posiciones aleatorias (Dificultad Alta)
         targetX = 15 + Math.random() * 55; 
      }
      
      // Velocidad del arquero (rápido)
      currentX += (targetX > currentX) ? 4 : -4;
      gk.style.left = currentX + '%';
   }, 40);
}

$('#pitch').onclick = (e) => {
   if(isShooting) return;
   isShooting = true;
   
   let pRect = $('#pitch').getBoundingClientRect();
   let clickX = e.clientX - pRect.left;
   let targetPct = (clickX / pRect.width) * 100;
   
   // Si toca muy a los bordes, corregimos para que no se salga de pantalla
   if(targetPct < 5) targetPct = 5;
   if(targetPct > 95) targetPct = 95;
   
   let ball = $('#ball');
   // La pelota viaja rápido hacia el fondo (bottom 75%) y se achica un poco para simular distancia
   ball.style.transition = 'left 0.3s linear, bottom 0.3s cubic-bezier(0.1, 0.7, 0.4, 1), transform 0.3s linear';
   ball.style.left = targetPct + '%';
   ball.style.bottom = '75%'; 
   ball.style.transform = 'scale(0.6)';

   // Validar impacto (300ms)
   setTimeout(()=>{
      let bRect = ball.getBoundingClientRect();
      let gRect = $('#gk').getBoundingClientRect();
      let goalRect = $('.goal-area').getBoundingClientRect();

      // Colisión (el arquero bloquea si el balón toca su recuadro central)
      // Ajustamos el Hitbox del arquero para que sea un poco más generoso para él (más difícil para ti)
      let hitGk = !(bRect.right < gRect.left - 10 || 
                    bRect.left > gRect.right + 10 || 
                    bRect.bottom < gRect.top || 
                    bRect.top > gRect.bottom + 10);

      // Entró en la zona de la red
      let inGoal = (bRect.left + bRect.width/2) > goalRect.left && (bRect.right - bRect.width/2) < goalRect.right;

      if(inGoal && !hitGk) {
         // ¡GOL!
         gScore++;
         $('#g-score').textContent = gScore;
         $('#pitch').style.backgroundColor = '#2e7d32'; // Verde más oscuro
         setTimeout(()=>$('#pitch').style.backgroundColor = '#4caf50', 200);
      } else {
         // FALLO
         $('#pitch').style.backgroundColor = '#7a1530'; // Rojo
         setTimeout(()=>$('#pitch').style.backgroundColor = '#4caf50', 300);
      }

      if(gScore >= 3) {
         clearInterval(gkInt);
         setTimeout(()=>{
            $('#minigame').classList.remove('on');
            document.body.style.overflow='';
            showReward();
         }, 800);
      } else {
         // Preparar siguiente tiro
         setTimeout(()=>{
            resetBall();
            isShooting = false;
         }, 600);
      }
   }, 300); // 300ms exactos, coincide con el CSS transition
};

/* ---------- MODAL RECOMPENSA ---------- */
function showReward(){
   $('#reward').classList.add('on');
   if(D.giftImg) { 
       $('#r-img').src = src(D.giftImg); 
       $('#r-img').style.display = 'block'; 
   } else { 
       $('#r-img').style.display = 'none'; 
   }
   $('#r-msg').innerHTML = esc(D.giftMsg).replace(/\n/g, '<br>');
   
   for(let i=0;i<30;i++){
      const h=document.createElement('div');
      h.className='heart';
      h.textContent=['🎫','💙','🎉'][i%3];
      h.style.left=Math.random()*90+5+'vw';
      h.style.bottom='5vh';
      h.style.animationDelay=Math.random()*.8+'s';
      document.body.appendChild(h);
      setTimeout(()=>h.remove(),3000);
   }
}
$('#close-reward').onclick = () => $('#reward').classList.remove('on');


/* ---------- Carga del contenido desde data/config.json ---------- */
async function loadConfig(){
  const r=await fetch('data/config.json?v='+(ADMIN?Date.now():Math.floor(Date.now()/30000)),{cache:'no-store'});
  if(!r.ok)throw new Error('config '+r.status);
  return normalize(await r.json());
}
window.APP_READY=(async()=>{
  try{D=await loadConfig()}
  catch(e){console.error(e);document.body.insertAdjacentHTML('afterbegin','<div style="position:fixed;z-index:999;top:0;left:0;right:0;background:#7a1530;color:#fff;padding:8px;font:13px sans-serif">No se pudo cargar data/config.json (abre el sitio desde GitHub Pages o un servidor, no con doble clic).</div>')}
  renderPage();setVolume(D.musicVolume??25);music(true);
})();
