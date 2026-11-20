/* ================= GITHUB: conexión, subida y publicación ================= */
const KEY='para_ti_mi_amor_config', GH_KEY='gh_cfg_cynthia';
const GH=(()=>{
  let c={};try{c=JSON.parse(localStorage.getItem(GH_KEY)||'{}')}catch(e){}
  if(!c.owner&&/github\.io$/.test(location.hostname)){      // autodetecta en GitHub Pages
    const p=location.pathname.split('/').filter(Boolean);
    c.owner=location.hostname.replace('.github.io','');c.repo=p[0]||'';c.folder=p.slice(1,-1).join('/');
  }
  return {owner:'',repo:'',folder:'',token:'',...c,branch:c.branch||'main'};
})();
const ghSave=()=>{try{localStorage.setItem(GH_KEY,JSON.stringify(GH))}catch(e){}};
const ghReady=()=>GH.owner&&GH.repo&&GH.token;
const ghPath=p=>(GH.folder?GH.folder.replace(/^\/+|\/+$/g,'')+'/':'')+p;
const ghUrl=p=>`https://api.github.com/repos/${GH.owner}/${GH.repo}/contents/${ghPath(p).split('/').map(encodeURIComponent).join('/')}`;
const ghHead=()=>({Authorization:'Bearer '+GH.token,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'});
const b64=u8=>{let s='';for(let i=0;i<u8.length;i+=0x8000)s+=String.fromCharCode.apply(null,u8.subarray(i,i+0x8000));return btoa(s)};
const blob64=b=>new Promise((ok,no)=>{const r=new FileReader;r.onload=()=>ok(r.result.split(',')[1]);r.onerror=no;r.readAsDataURL(b)});
function toast(t,warn){
  let e=$('#toast');
  if(!e){e=document.createElement('div');e.id='toast';e.style.cssText='position:fixed;left:50%;bottom:calc(76px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:500;max-width:92vw;padding:11px 18px;border-radius:10px;font:500 13px Poppins,sans-serif;color:#fff;box-shadow:0 8px 25px #000a;text-align:center';document.body.appendChild(e)}
  e.textContent=t;e.style.background=warn?'#8a4b00':'#1b6b3a';e.style.display='block';clearTimeout(e._t);e._t=setTimeout(()=>e.style.display='none',6000);
}
let ghQ=Promise.resolve();   // cola: GitHub rechaza commits simultáneos a la misma rama
function ghPut(path,content64,msg){
  const job=ghQ.then(async()=>{
    const url=ghUrl(path);let sha;
    const g=await fetch(url+'?ref='+encodeURIComponent(GH.branch),{headers:ghHead(),cache:'no-store'});
    if(g.ok)sha=(await g.json()).sha;else if(g.status!==404)throw new Error('GitHub '+g.status+' al revisar '+path);
    const r=await fetch(url,{method:'PUT',headers:ghHead(),body:JSON.stringify({message:msg,content:content64,branch:GH.branch,...(sha?{sha}:{})})});
    if(!r.ok)throw new Error('GitHub '+r.status+': '+((await r.json().catch(()=>({}))).message||''));
  });
  ghQ=job.catch(()=>{});return job;
}
const slug=n=>String(n||'archivo').replace(/\.[^.]+$/,'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,30)||'archivo';
const rid=()=>Math.random().toString(16).slice(2,8);
async function storeFile(blob,path){
  PENDING[path]=URL.createObjectURL(blob);            // se ve al instante, aunque Pages tarde en actualizar
  if(ghReady()){
    toast('⏳ Subiendo '+path+'…');
    try{await ghPut(path,await blob64(blob),'Subir '+path);toast('✓ Subido '+path+' (en la web en ~1 min)')}
    catch(e){toast('⚠ '+e.message,true)}
  }else{
    const a=document.createElement('a');a.href=PENDING[path];a.download=path.split('/').pop();document.body.appendChild(a);a.click();a.remove();
    toast('⬇ Sin token: se descargó '+a.download+'. Súbelo a la carpeta '+path.split('/')[0]+'/ del repo.',true);
  }
  return path;
}
const img2url=f=>new Promise(res=>{                    // comprime y devuelve la RUTA (no base64)
  const i=new Image,u=URL.createObjectURL(f);
  i.onload=()=>{
    const k=Math.min(1,1280/Math.max(i.width,i.height)),c=document.createElement('canvas');
    c.width=Math.round(i.width*k);c.height=Math.round(i.height*k);
    c.getContext('2d').drawImage(i,0,0,c.width,c.height);URL.revokeObjectURL(u);
    c.toBlob(b=>res(storeFile(b,`img/${slug(f.name)}-${rid()}.jpg`)),'image/jpeg',.8);
  };
  i.onerror=()=>res('');i.src=u;
});
const f2url=f=>{                                       // audio / video -> ruta
  const kind=f.type.startsWith('video')?'video':'audio',mb=f.size/1048576;
  if(mb>(kind==='video'?50:25)){toast('⚠ '+kind+' muy pesado ('+mb.toFixed(0)+' MB). Comprímelo antes.',true);return Promise.resolve('')}
  const ext=(f.name.match(/\.[a-z0-9]+$/i)||[kind==='video'?'.mp4':'.mp3'])[0].toLowerCase();
  return storeFile(f,`${kind}/${slug(f.name)}-${rid()}${ext}`);
};
async function publish(){
  if(!ghReady()){toast('Primero conecta GitHub (sección 9).',true);return}
  const btn=$('#pub');btn.disabled=true;
  try{
    const clean=a=>a.filter(x=>String(x).trim());
    const out={...D,ytid:normalizeYouTubeId(D.ytid),reasons:clean(D.reasons),quotes:clean(D.quotes)};delete out.exported;
    await ghPut('data/config.json',b64(new TextEncoder().encode(JSON.stringify(out,null,2))),'Actualizar contenido de la sorpresa');
    try{localStorage.removeItem(KEY)}catch(e){}
    setSave('✓ Publicado · sin cambios pendientes');toast('✓ Publicado. En ~1 minuto estará en línea (recarga con Ctrl+F5).');
  }catch(e){toast('⚠ '+e.message,true)}
  btn.disabled=false;
}
function wireGit(){
  ['owner','repo','folder','branch','token'].forEach(k=>{const i=$('#gh_'+k);i.value=GH[k]||'';i.oninput=()=>{GH[k]=i.value.trim();ghSave()}});
  $('#ghTest').onclick=async()=>{
    if(!ghReady()){toast('Completa usuario, repo y token.',true);return}
    try{
      const r=await fetch(`https://api.github.com/repos/${GH.owner}/${GH.repo}`,{headers:ghHead()}),j=await r.json();
      if(!r.ok)throw new Error(j.message||r.status);
      const ro=j.permissions&&!j.permissions.push;
      toast(ro?'⚠ Conecta, pero el token no puede escribir.':'✓ Conectado a '+j.full_name+(j.private?' (privado)':' (público)'),ro);
    }catch(e){toast('⚠ '+e.message,true)}
  };
  $('#pub').onclick=publish;
  $('#dlcfg').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(D,null,2)],{type:'application/json'}));a.download='config.json';a.click()};
}
function draftCheck(){
  try{const x=JSON.parse(localStorage.getItem(KEY)||'null');
    if(x&&JSON.stringify(normalize(clone(x)))!==JSON.stringify(D))setSave('⚠ Hay un borrador local distinto: usa ↻ Recuperar borrador (sección 9).',true)}catch(e){}
}

/* ---------- PANEL MAESTRO ---------- */
const pick=(acc,multi,cb)=>{const i=document.createElement('input');i.type='file';i.accept=acc;i.multiple=!!multi;i.onchange=()=>cb([...i.files]);i.click()};

/* Guardado automático */
let saveT;
function setSave(t,warn){const e=$('#saveStatus');if(e){e.textContent=t;e.classList.toggle('warn',!!warn)}}
function saveNow(auto){
  try{localStorage.setItem(KEY,JSON.stringify(D));setSave('✓ Borrador guardado · falta Publicar')}
  catch(e){setSave('⚠ No se pudo guardar el borrador local.',true)}
}
function changed(){setSave('Guardando…');clearTimeout(saveT);saveT=setTimeout(()=>saveNow(true),600)}

/* Editor de listas (razones y frases) */
function drawList(k,boxId,ph,addLabel){
  const box=$('#'+boxId);box.innerHTML='';
  const redraw=()=>{drawList(k,boxId,ph,addLabel);renderPage();changed()};
  D[k].forEach((txt,i)=>{
    const r=el(`<div class="li"><span class="n">${i+1}</span><textarea rows="2" placeholder="${esc(ph)}"></textarea><div class="ac"><button type="button" title="Subir"${i===0?' disabled':''}>↑</button><button type="button" title="Bajar"${i===D[k].length-1?' disabled':''}>↓</button><button type="button" title="Eliminar">🗑</button></div></div>`);
    const ta=r.querySelector('textarea');ta.value=txt;
    ta.oninput=()=>{D[k][i]=ta.value;renderPage();changed()};
    const [up,dn,rm]=r.querySelectorAll('.ac button');
    up.onclick=()=>{[D[k][i-1],D[k][i]]=[D[k][i],D[k][i-1]];redraw()};
    dn.onclick=()=>{[D[k][i+1],D[k][i]]=[D[k][i],D[k][i+1]];redraw()};
    rm.onclick=()=>{D[k].splice(i,1);redraw()};
    box.appendChild(r);
  });
  const add=el(`<button type="button" class="add">＋ ${esc(addLabel)}</button>`);
  add.onclick=()=>{D[k].push('');drawList(k,boxId,ph,addLabel);const t=[...$('#'+boxId).querySelectorAll('textarea')].pop();if(t){t.scrollIntoView({block:'center',behavior:'smooth'});t.focus()}changed()};
  box.appendChild(add);
}
/* Tocar una razón o frase en la página abre su editor */
function editAt(k,i){
  const p=$('#panel');if(!p)return;
  p.classList.add('on');
  const d=$('#sec_'+k);if(d)d.open=true;
  setTimeout(()=>{const t=$('#l_'+k)?.querySelectorAll('textarea')[i];if(t){t.scrollIntoView({block:'center',behavior:'smooth'});t.focus()}},80);
}
$('#r5').addEventListener('click',e=>{const c=e.target.closest('[data-i]');if(c&&$('#panel'))editAt('reasons',+c.dataset.i)});
$('#r4').addEventListener('click',e=>{const c=e.target.closest('[data-i]');if(c&&$('#panel'))editAt('quotes',+c.dataset.i)});

function buildPanel(open){
  $('#gear')?.remove();$('#panel')?.remove();
  const g=el('<button id="gear" type="button">✎ Editar</button>'),p=el('<aside id="panel" aria-label="Panel del director"></aside>');
  document.body.append(g,p);document.body.classList.add('editing');
  if(open)p.classList.add('on');
  g.onclick=()=>p.classList.toggle('on');
  const S=(id,title,body,op)=>`<details class="sec" id="sec_${id}"${op?' open':''}><summary>${title}</summary><div class="sb">${body}</div></details>`;
  p.innerHTML=`<div class="ph2"><div><h3>Panel del Director 🎬</h3><span class="pill" id="saveStatus">Edita y pulsa Publicar al terminar</span></div><button class="x2" id="pc" type="button">✕ Cerrar</button></div>
  <div class="pbody">
  <div class="note">Todo lo que cambies se ve al instante y queda como borrador en este navegador. Pulsa “Publicar” (sección 9) para subirlo al repositorio.</div>`
  + S('datos','1 · Datos y estreno',`
    <label>Nombre de él (sale en la portada)</label><input type="text" data-k="name">
    <label>Fecha en que empezaron (para el contador)</label><input type="text" data-k="since" placeholder="AAAA-MM-DD">
    <label>Fecha y hora de estreno (cuenta regresiva)</label>
    <div class="rw"><input type="datetime-local" id="dtUnlock"><button id="uset" class="p" type="button">Fijar</button><button id="uclr" type="button">Quitar</button></div>
    <label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" id="pl" style="width:16px;height:16px;margin:0"> Probar la pantalla de espera</label>`,1)
  + S('portada','2 · Sobre y portada',`
    <label>Mensaje que aparece antes de abrir el sobre</label><input type="text" data-k="introTitle">
    <label>Texto pequeño del sobre <small>(vacío = ocultar)</small></label><input type="text" data-k="cardSmall">
    <label>Primera línea del sobre</label><input type="text" data-k="cardLine1">
    <label>Segunda línea del sobre</label><input type="text" data-k="cardLine2">
    <label>Texto grande principal</label><input type="text" data-k="heroTitle">
    <label>Etiqueta superior</label><input type="text" data-k="heroTag">
    <label>Meta 1</label><input type="text" data-k="heroMeta1">
    <label>Meta 2</label><input type="text" data-k="heroMeta2">
    <label>Meta 3</label><input type="text" data-k="heroMeta3">
    <label>Descripción principal</label><textarea data-k="heroDesc" style="min-height:80px"></textarea>
    <div class="rw" style="margin-top:10px"><button id="bHero" type="button">🖼️ Elegir portada</button><button id="bHeroX" type="button">🗑️ Quitar</button></div>`)
  + S('carta','3 · La carta',`
    <label>Título de la carta</label><input type="text" data-k="letterTitle">
    <label>Texto de la carta <small>(deja una línea en blanco entre párrafos)</small></label><textarea data-k="letter" style="min-height:160px"></textarea>
    <label>Firma</label><input type="text" data-k="sign">`)
  + S('reasons','4 · Razones por las que te amo',`
    <div class="note">Edita cada razón, cambia el orden con ↑ ↓ o agrega las que quieras. También puedes tocar una razón directamente en la página para editarla.</div><div id="l_reasons"></div>`,1)
  + S('quotes','5 · Frases para ti',`
    <div class="note">Aparecen en el carrusel “Frases para ti”.</div><div id="l_quotes"></div>`)
  + S('eps','6 · Episodios (fotos)',`<div id="gs"></div>`)
  + S('musica','7 · Música y tráiler',`
    <div class="note">La música suena sola: empieza al abrir la página o con el primer toque (los celulares no dejan sonar nada antes de un toque). No se muestra ningún botón de música.</div>
    <div class="rw"><button id="am" type="button">🎵 Cargar MP3</button><button id="vm" type="button">🎬 Cargar video</button></div>
    <div class="note" style="margin-top:8px">El MP3 o video que cargues se sube como archivo a audio/ o video/ del repositorio (no engorda el HTML).</div>
    <label>Volumen: <b id="volLabel">25%</b></label>
    <input type="range" id="panelVol" min="0" max="100" value="25">
    <div class="rw" style="margin-top:8px"><button id="ax" type="button">Quitar MP3</button><button id="vx" type="button">Quitar video</button></div>
    <label>YouTube <small>(opcional, pega el enlace completo)</small></label><input type="text" data-k="ytid" placeholder="https://www.youtube.com/watch?v=XXXXXXXXXXX">
    <div class="note" style="margin-top:8px;background:none;padding:0">YouTube solo se usa si no hay MP3 cargado. Si el video no permite insertarse, usa otro o un MP3.</div>`)
  + S('regalo','8 · Regalo sorpresa (minijuego)',`
    <div class="note">Al anotar 3 goles en los penales, aparece esto:</div>
    <label>Mensaje final</label><textarea data-k="giftMsg" style="min-height:90px"></textarea>
    <div class="rw" style="margin-top:10px"><button id="bGift" type="button">🎫 Cargar imagen (entradas)</button><button id="bGiftX" type="button">🗑️ Quitar</button></div>
    <div class="note" id="gstat" style="margin-top:6px;background:none;padding:0"></div>`)
  + S('guardar','9 · GitHub y publicar',`
    <div class="note">Conecta tu repositorio una vez. El token se guarda solo en este navegador (nunca en el repo). Permiso: <b>Contents → Read and write</b>, solo sobre ese repo.</div>
    <label>Usuario de GitHub</label><input type="text" id="gh_owner" placeholder="tu-usuario">
    <label>Repositorio</label><input type="text" id="gh_repo" placeholder="mi-repo">
    <label>Carpeta de esta sorpresa</label><input type="text" id="gh_folder" placeholder="cynthia">
    <label>Rama</label><input type="text" id="gh_branch" placeholder="main">
    <label>Token (fine-grained)</label><input type="text" id="gh_token" placeholder="github_pat_…" autocomplete="off" style="-webkit-text-security:disc">
    <div class="rw" style="margin-top:10px"><button id="ghTest" type="button">🔌 Probar conexión</button></div>
    <div class="note" id="size" style="margin-top:12px"></div>
    <div class="rw"><button class="p" id="pub" type="button">🚀 Publicar en GitHub</button><button id="dlcfg" type="button">⬇ Bajar config.json</button></div>
    <div class="rw" style="margin-top:10px"><button id="saveCfg" type="button">💾 Guardar borrador</button><button id="reloadCfg" type="button">↻ Recuperar borrador</button><button id="clearCfg" type="button">🗑️ Descartar borrador</button></div>`,1)
  + `</div>`;

  $('#pc').onclick=()=>p.classList.remove('on');
  $('#saveCfg').onclick=()=>saveNow(false);
  $('#reloadCfg').onclick=()=>{
    try{const x=JSON.parse(localStorage.getItem(KEY)||'null');
      if(x){D=normalize(x);renderPage();buildPanel(true)}
      else setSave('No hay una configuración guardada.',true)}catch(e){setSave('No se pudo leer lo guardado.',true)}
  };
  $('#clearCfg').onclick=()=>{
    if(!confirm('¿Descartar el borrador local y volver a lo publicado en el repositorio?'))return;
    try{localStorage.removeItem(KEY)}catch(e){}
    loadConfig().then(c=>{D=c;renderPage();buildPanel(true)});
  };

  p.querySelectorAll('[data-k]').forEach(i=>{
    i.value=D[i.dataset.k] ?? '';
    i.oninput=()=>{
      let val=i.value;
      if(i.dataset.k==='ytid') val=normalizeYouTubeId(val);
      D[i.dataset.k]=val; renderPage(); stat(); changed();
    };
  });

  drawList('reasons','l_reasons','Escribe una razón…','Agregar razón');
  drawList('quotes','l_quotes','Escribe una frase…','Agregar frase');

  $('#panelVol').value=D.musicVolume??25;
  $('#volLabel').textContent=(D.musicVolume??25)+'%';
  $('#panelVol').oninput=e=>{setVolume(e.target.value);$('#volLabel').textContent=e.target.value+'%';changed()};

  if(D.unlock){
    const ud=new Date(D.unlock),pad=n=>String(n).padStart(2,'0');
    $('#dtUnlock').value=`${ud.getFullYear()}-${pad(ud.getMonth()+1)}-${pad(ud.getDate())}T${pad(ud.getHours())}:${pad(ud.getMinutes())}`;
  }
  $('#uset').onclick=()=>{if($('#dtUnlock').value){D.unlock=new Date($('#dtUnlock').value).toISOString();stat();changed()}};
  $('#uclr').onclick=()=>{D.unlock='';$('#dtUnlock').value='';stat();changed()};
  $('#pl').checked=previewLock;
  $('#pl').onchange=e=>{previewLock=e.target.checked;$('#env').classList.remove('open');$('#intro').classList.remove('gone');$('#lockbox').dataset.ok='';document.body.style.overflow='hidden';if(!previewLock){$('#intro').classList.add('gone');document.body.style.overflow=''}tick()};

  $('#bHero').onclick=()=>pick('image/*',0,async([f])=>{if(!f)return;D.heroImg=await img2url(f);renderPage();stat();changed()});
  $('#bHeroX').onclick=()=>{D.heroImg='';renderPage();stat();changed()};
  $('#bGift').onclick=()=>pick('image/*',0,async([f])=>{if(!f)return;D.giftImg=await img2url(f);stat();changed()});
  $('#bGiftX').onclick=()=>{D.giftImg='';stat();changed()};

  const gs=$('#gs');
  GROUPS.forEach(([k,lab])=>{
    gs.append(el(`<div style="margin-top:16px"><b style="color:#fff">${lab}</b><div id="g_${k}"></div><button id="a_${k}" type="button" style="margin-top:8px">＋ Agregar episodio</button></div>`));
    drawGroup(k);
    $('#a_'+k).onclick=()=>pick('image/*',1,async fs=>{for(const f of fs){D[k].push({t:'Título',d:'Descripción',img:await img2url(f)})}drawGroup(k);renderPage();stat();changed()});
  });

  $('#am').onclick=()=>pick('audio/*',0,async([f])=>{if(!f)return;D.audio=await f2url(f);renderPage();stat();changed();music(true)});
  $('#vm').onclick=()=>pick('video/*',0,async([f])=>{if(!f)return;D.video=await f2url(f);stat();changed()});
  $('#ax').onclick=()=>{D.audio='';bgm.pause();bgm.removeAttribute('src');stat();changed()};
  $('#vx').onclick=()=>{D.video='';stat();changed()};
  wireGit();
  stat();
}
function drawGroup(k){
  const box=$('#g_'+k);box.innerHTML='';
  D[k].forEach((o,i)=>{
    const r=el(`<div class="it"><div class="th" ${o.img?`style="background-image:url('${src(o.img)}')"`:''}>${o.img?'':'+'}</div><div class="fl"><input type="text" placeholder="Título" value="${esc(o.t)}"><input type="text" placeholder="Descripción" value="${esc(o.d)}"></div><button type="button" style="align-self:stretch">🗑</button></div>`);
    const [a,b]=r.querySelectorAll('input');
    a.oninput=()=>{o.t=a.value;renderPage();changed()};
    b.oninput=()=>{o.d=b.value;renderPage();changed()};
    r.querySelector('.th').onclick=()=>pick('image/*',0,async([f])=>{if(!f)return;o.img=await img2url(f);drawGroup(k);renderPage();stat();changed()});
    r.querySelector('button').onclick=()=>{D[k].splice(i,1);drawGroup(k);renderPage();stat();changed()};
    box.appendChild(r);
  });
}
function stat(){
  const kb=(JSON.stringify(D).length/1024).toFixed(1);
  $('#size').innerHTML=`<b>config.json: ${kb} KB</b> · las fotos van como archivos aparte`;
  $('#gstat').innerHTML=D.giftImg?'<b style="color:#46d369">✓ Imagen de entradas cargada</b>':'Sin imagen de regalo';
}

APP_READY.then(()=>{buildPanel();draftCheck()});
