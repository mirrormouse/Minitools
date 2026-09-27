const RECALL_BLANK_MAP='https://upload.wikimedia.org/wikipedia/commons/3/31/Provinces_of_Japan.svg';
const RECALL_NAMES_MAP='https://upload.wikimedia.org/wikipedia/commons/d/d9/Provinces_of_Japan_with_names.svg';
const RECALL_SUFFIX={
  awa_kanto:'Awa (Chiba)',awa_shikoku:'Awa (Tokushima)',shimousa:'Shimosa',
  yamashiro:'Yamashiro',yamato:'Yamato',kawachi:'Kawachi',izumi:'Izumi',settsu:'Settsu',iga:'Iga',ise:'Ise',shima:'Shima',owari:'Owari',mikawa:'Mikawa',totomi:'Totomi',suruga:'Suruga',izu:'Izu',kai:'Kai',sagami:'Sagami',musashi:'Musashi',kazusa:'Kazusa',hitachi:'Hitachi',omi:'Omi',mino:'Mino',hida:'Hida',shinano:'Shinano',kozuke:'Kozuke',shimotsuke:'Shimotsuke',mutsu:'Mutsu',dewa:'Dewa',wakasa:'Wakasa',echizen:'Echizen',kaga:'Kaga',noto:'Noto',etchu:'Etchu',echigo:'Echigo',sado:'Sado',tamba:'Tamba',tango:'Tango',tajima:'Tajima',inaba:'Inaba',hoki:'Hoki',izumo:'Izumo',iwami:'Iwami',oki:'Oki',harima:'Harima',mimasaka:'Mimasaka',bizen:'Bizen',bitchu:'Bitchu',bingo:'Bingo',aki:'Aki',suo:'Suo',nagato:'Nagato',kii:'Kii',awaji:'Awaji',sanuki:'Sanuki',iyo:'Iyo',tosa:'Tosa',chikuzen:'Chikuzen',chikugo:'Chikugo',buzen:'Buzen',bungo:'Bungo',hizen:'Hizen',higo:'Higo',hyuga:'Hyuga',osumi:'Osumi',satsuma:'Satsuma',iki:'Iki',tsushima:'Tsushima'
};
let recallLabels=true;
const $=id=>document.getElementById(id);
const preloadedMaps=new Set();
let preloadStarted=false;

function recallHighlightedUrl(p){
  const suffix=RECALL_SUFFIX[p.id]||p.id.charAt(0).toUpperCase()+p.id.slice(1);
  return 'https://commons.wikimedia.org/wiki/Special:Redirect/file/'+encodeURIComponent('Provinces of Japan-'+suffix+'.svg');
}
function recallMap(url,alt){
  return `<div class="recallMap"><img src="${url}" alt="${alt}" loading="eager" decoding="async" onload="this.classList.add('loaded')" onerror="this.style.display='none';this.nextElementSibling.classList.add('show')"><div class="mapError">地図を読み込めませんでした。通信状態を確認して再読み込みしてください。</div></div>`;
}
function layeredRecallMap(url,alt){
  return `<div class="recallMap layeredMap"><img class="mapBase loaded" src="${RECALL_BLANK_MAP}" alt="" aria-hidden="true" loading="eager" decoding="async"><img class="mapHighlight" src="${url}" alt="${alt}" loading="eager" decoding="async" onload="this.classList.add('loaded')" onerror="this.style.display='none';this.nextElementSibling.classList.add('show')"><div class="mapError">強調地図を読み込めませんでした。通信状態を確認して再読み込みしてください。</div><div class="mapLoadingBadge">地図を準備中…</div></div>`;
}
function preloadUrl(url){
  if(preloadedMaps.has(url))return Promise.resolve();
  return new Promise(resolve=>{
    const img=new Image();
    img.decoding='async';
    img.onload=img.onerror=()=>{preloadedMaps.add(url);resolve();};
    img.src=url;
  });
}
async function preloadAllHighlightedMaps(){
  if(preloadStarted)return;
  preloadStarted=true;
  await preloadUrl(RECALL_BLANK_MAP);
  const urls=P.map(recallHighlightedUrl);
  let index=0;
  const worker=async()=>{
    while(index<urls.length){
      const url=urls[index++];
      await preloadUrl(url);
    }
  };
  await Promise.all([worker(),worker(),worker()]);
}
function schedulePreload(){
  const run=()=>preloadAllHighlightedMaps();
  if('requestIdleCallback' in window)requestIdleCallback(run,{timeout:1800});
  else setTimeout(run,350);
}

function normalizeMapLabel(value){
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z]/g,'');
}
function japaneseMapLabelTable(){
  const table={
    ezo:'蝦夷',
    kasuza:'上総',shimofusa:'下総',wasaka:'若狭',tanba:'丹波',kawa:'河内',
    ibana:'因幡',mimakasa:'美作',suwo:'周防',chizuken:'筑前'
  };
  P.forEach(p=>{
    table[normalizeMapLabel(p.id)]=p.name;
    table[normalizeMapLabel(RECALL_SUFFIX[p.id]||p.id)]=p.name;
  });
  return table;
}
function svgNumber(value){
  const n=parseFloat(String(value||'').replace(/[^0-9.+-]/g,''));
  return Number.isFinite(n)&&n>0?n:null;
}
function ensureSvgViewport(svg){
  const originalWidth=svgNumber(svg.getAttribute('width'));
  const originalHeight=svgNumber(svg.getAttribute('height'));
  if(!svg.getAttribute('viewBox')&&originalWidth&&originalHeight)svg.setAttribute('viewBox',`0 0 ${originalWidth} ${originalHeight}`);
  if(!svg.getAttribute('viewBox'))svg.setAttribute('viewBox','0 0 960 1003');
  svg.removeAttribute('width');
  svg.removeAttribute('height');
  svg.setAttribute('preserveAspectRatio','xMidYMid meet');
  svg.style.width='100%';
  svg.style.height='auto';
  svg.style.maxWidth='100%';
  svg.style.display='block';
}
function nodeCoordinate(node,axis){
  let target=node;
  while(target&&target.nodeType===1){
    const raw=target.getAttribute(axis);
    if(raw){const n=parseFloat(raw);if(Number.isFinite(n))return n;}
    target=target.parentElement;
  }
  return null;
}
function replaceJapaneseLabels(doc,svg){
  const table=japaneseMapLabelTable();
  const vb=(svg.getAttribute('viewBox')||'0 0 960 1003').trim().split(/[ ,]+/).map(Number);
  const width=vb[2]||960;
  doc.querySelectorAll('text,tspan').forEach(node=>{
    if(node.children.length)return;
    const raw=(node.textContent||'').trim();
    const key=normalizeMapLabel(raw);
    if(!key)return;
    if(key==='awa'){
      const x=nodeCoordinate(node,'x');
      node.textContent=x!==null&&x>width*.62?'安房':'阿波';
      return;
    }
    const ja=table[key];
    if(ja)node.textContent=ja;
  });
  injectIslandLabel(svg,'対馬',.063,.738);
  injectIslandLabel(svg,'壱岐',.095,.785);
}
function injectIslandLabel(svg,label,xRatio,yRatio){
  const vb=(svg.getAttribute('viewBox')||'0 0 960 1003').trim().split(/[ ,]+/).map(Number);
  const x=(vb[0]||0)+(vb[2]||960)*xRatio;
  const y=(vb[1]||0)+(vb[3]||1003)*yRatio;
  const ns='http://www.w3.org/2000/svg';
  const text=document.createElementNS(ns,'text');
  text.setAttribute('x',x.toFixed(1));
  text.setAttribute('y',y.toFixed(1));
  text.setAttribute('text-anchor','middle');
  text.setAttribute('font-size',String((vb[2]||960)*.0135));
  text.setAttribute('font-weight','600');
  text.setAttribute('fill','#2a2a2a');
  text.setAttribute('paint-order','stroke');
  text.setAttribute('stroke','#fff');
  text.setAttribute('stroke-width',String((vb[2]||960)*.0022));
  text.textContent=label;
  svg.appendChild(text);
}
async function renderJapaneseNamesMap(container){
  container.innerHTML='<div class="mapLoading">日本語地図を読み込み中…</div>';
  try{
    const response=await fetch(RECALL_NAMES_MAP,{mode:'cors',cache:'force-cache'});
    if(!response.ok)throw new Error('map fetch failed');
    const source=await response.text();
    const doc=new DOMParser().parseFromString(source,'image/svg+xml');
    if(doc.querySelector('parsererror'))throw new Error('map parse failed');
    const svg=doc.documentElement;
    ensureSvgViewport(svg);
    replaceJapaneseLabels(doc,svg);
    svg.setAttribute('role','img');
    svg.setAttribute('aria-label','日本語の旧国名を記した旧国境地図');
    const wrap=document.createElement('div');
    wrap.className='recallMap japaneseMap';
    wrap.style.aspectRatio='auto';
    wrap.style.overflow='visible';
    wrap.appendChild(document.importNode(svg,true));
    container.replaceChildren(wrap);
  }catch(error){
    container.innerHTML=recallMap(RECALL_BLANK_MAP,'旧国境の空白地図')+'<div class="mapFallbackNote">日本語ラベルを読み込めなかったため、ラベルなし地図を表示しています。</div>';
  }
}

window.startStudy=function(mode){
  session={mode,count:0,target:12};
  document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));
  $('study').classList.add('active');
  document.querySelectorAll('.bottom button').forEach(x=>x.classList.remove('active'));
  if(mode==='mapName'||mode==='nameMap')preloadAllHighlightedMaps();
  nextRecall();
};
window.nextQuestion=nextRecall;
function nextRecall(){
  if(!session)return;
  if(session.count>=session.target){alert('このセットは終了です。記録に反映しました。');finishStudy();return;}
  const item=session.mode==='smart'?pickSmart():pickFor(session.mode);
  current={...item};answered=false;session.count++;renderRecall();
  if(current.s==='mapName'||current.s==='nameMap')preloadUrl(recallHighlightedUrl(current.p));
}
function renderRecall(){
  const p=current.p,s=current.s;
  const studyModeEl=$('studyMode'),studyCountEl=$('studyCount'),studyProgressEl=$('studyProgress');
  const choicesEl=$('choices'),answerBoxEl=$('answerBox'),ratingEl=$('rating'),feedbackEl=$('feedback');
  const studyMapEl=$('studyMap'),promptEl=$('prompt'),questionLabelEl=$('questionLabel'),subpromptEl=$('subprompt'),studyCardEl=$('studyCard');
  studyModeEl.textContent=session.mode==='smart'?'おすすめ復習':LABELS[session.mode];
  studyCountEl.textContent=session.count+' / '+session.target;
  studyProgressEl.style.width=((session.count-1)/session.target*100)+'%';
  choicesEl.innerHTML='';choicesEl.style.display='none';answerBoxEl.classList.remove('show');ratingEl.classList.remove('show');feedbackEl.className='feedback';studyMapEl.innerHTML='';studyMapEl.style.display='none';promptEl.className='prompt';
  let q='',sub='',label='';
  if(s==='reading'){label='読みを思い出す';q=p.name;sub='この旧国名をどう読む？';}
  if(s==='kanji'){label='漢字を思い出す';q=p.reading;sub='どの旧国名の漢字？';promptEl.className='prompt reading';}
  if(s==='modern'){label='現在地を思い出す';q=p.name;sub='現在のおおよその都道府県は？';}
  if(s==='circuit'){label='五畿七道を思い出す';q=p.name;sub='どの区分に属する？';}
  if(s==='mapName'){
    label='位置から国名';q='この旧国は？';sub='色が付いた範囲の国名を思い出す';studyMapEl.style.display='block';
    studyMapEl.innerHTML=layeredRecallMap(recallHighlightedUrl(p),'対象の旧国を強調した地図');
  }
  if(s==='nameMap'){
    label='国名から位置';q=p.name;sub='この国が地図のどこかを思い浮かべる';studyMapEl.style.display='block';
    studyMapEl.innerHTML=recallMap(RECALL_BLANK_MAP,'旧国境の空白地図');
  }
  questionLabelEl.textContent=label;promptEl.textContent=q;subpromptEl.textContent=sub;
  let hint=$('recallHint');
  if(!hint){hint=document.createElement('div');hint.id='recallHint';hint.className='recallHint';studyCardEl.insertBefore(hint,answerBoxEl);}
  hint.textContent='タップして答えと解説を表示';hint.style.display='block';
}
window.revealRecall=function(ev){
  if(answered)return;if(ev&&ev.target.closest('.rate,.back'))return;answered=true;
  const p=current.p,s=current.s,studyMapEl=$('studyMap');
  if(s==='nameMap')studyMapEl.innerHTML=layeredRecallMap(recallHighlightedUrl(p),'正解の旧国を強調した地図');
  const answers={reading:p.reading,kanji:p.name,modern:p.modern,circuit:p.circuit,mapName:p.name,nameMap:p.name};
  $('answerMain').textContent=answers[s];$('answerReading').textContent=(s==='reading'||s==='kanji')?`${p.name}（${p.reading}）`:p.reading;
  $('answerDetails').innerHTML=`<strong>${p.circuit}</strong> ／ ${p.modern}<br>${p.note}`;$('answerBox').classList.add('show');$('rating').classList.add('show');
  const hint=$('recallHint');if(hint)hint.style.display='none';
};
window.rateRecall=function(level){if(!answered)return;data.total++;if(level===2)data.correct++;applyResult(level===0?0:level===1?1:3);nextRecall();};
window.renderFreeMap=async function(){
  const freeMapEl=$('freeMap');
  if(recallLabels)await renderJapaneseNamesMap(freeMapEl);else freeMapEl.innerHTML=recallMap(RECALL_BLANK_MAP,'旧国境の空白地図');
  $('labelOn').classList.toggle('active',recallLabels);$('labelOff').classList.toggle('active',!recallLabels);
};
window.setLabels=function(on){recallLabels=on;renderFreeMap();};
window.openDetail=function(id){
  const p=P.find(x=>x.id===id);$('dName').textContent=p.name;$('dReading').textContent=p.reading;$('dCircuit').textContent=p.circuit;$('dModern').textContent=p.modern;$('dNote').textContent=p.note;$('dMastery').textContent=Math.round(avgLevel(p)*100)+'%';$('dMap').innerHTML=layeredRecallMap(recallHighlightedUrl(p),p.name+'を強調した地図');$('detailModal').classList.add('show');
};
window.renderStats=function(){
  $('statAnswered').textContent=data.total;$('statAccuracy').textContent=data.total?Math.round(data.correct/data.total*100)+'%':'—';$('statMastery').textContent=Math.round(overall()*100)+'%';
  $('skillRows').innerHTML=SKILLS.map(s=>{const v=P.reduce((n,p)=>n+data.countries[p.id][s].level,0)/(P.length*5);return `<div class="skillRow"><div class="skillTop"><span>${LABELS[s]}</span><span>${Math.round(v*100)}%</span></div><div class="miniBar"><div style="width:${v*100}%"></div></div></div>`;}).join('');
  let weak=[];P.forEach(p=>SKILLS.forEach(s=>{const x=data.countries[p.id][s];if(x.seen)weak.push({p,s,x,score:x.level-x.lapses*.6});}));weak.sort((a,b)=>a.score-b.score);
  $('weakList').innerHTML=weak.length?weak.slice(0,10).map(w=>`<div class="weak"><span><b>${w.p.name}</b>　${LABELS[w.s]}</span><span>Lv.${w.x.level}</span></div>`).join(''):'<div class="empty">まだ学習記録がありません</div>';
};

schedulePreload();
