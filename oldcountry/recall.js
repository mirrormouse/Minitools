const RECALL_BLANK_MAP='https://upload.wikimedia.org/wikipedia/commons/3/31/Provinces_of_Japan.svg';
const RECALL_NAMES_MAP='https://upload.wikimedia.org/wikipedia/commons/d/d9/Provinces_of_Japan_with_names.svg';
const RECALL_SUFFIX={
  awa_kanto:'Awa (Chiba)',awa_shikoku:'Awa (Tokushima)',shimousa:'Shimosa',
  yamashiro:'Yamashiro',yamato:'Yamato',kawachi:'Kawachi',izumi:'Izumi',settsu:'Settsu',iga:'Iga',ise:'Ise',shima:'Shima',owari:'Owari',mikawa:'Mikawa',totomi:'Totomi',suruga:'Suruga',izu:'Izu',kai:'Kai',sagami:'Sagami',musashi:'Musashi',kazusa:'Kazusa',hitachi:'Hitachi',omi:'Omi',mino:'Mino',hida:'Hida',shinano:'Shinano',kozuke:'Kozuke',shimotsuke:'Shimotsuke',mutsu:'Mutsu',dewa:'Dewa',wakasa:'Wakasa',echizen:'Echizen',kaga:'Kaga',noto:'Noto',etchu:'Etchu',echigo:'Echigo',sado:'Sado',tamba:'Tamba',tango:'Tango',tajima:'Tajima',inaba:'Inaba',hoki:'Hoki',izumo:'Izumo',iwami:'Iwami',oki:'Oki',harima:'Harima',mimasaka:'Mimasaka',bizen:'Bizen',bitchu:'Bitchu',bingo:'Bingo',aki:'Aki',suo:'Suo',nagato:'Nagato',kii:'Kii',awaji:'Awaji',sanuki:'Sanuki',iyo:'Iyo',tosa:'Tosa',chikuzen:'Chikuzen',chikugo:'Chikugo',buzen:'Buzen',bungo:'Bungo',hizen:'Hizen',higo:'Higo',hyuga:'Hyuga',osumi:'Osumi',satsuma:'Satsuma',iki:'Iki',tsushima:'Tsushima'
};
let recallLabels=true;
function recallHighlightedUrl(p){
  const suffix=RECALL_SUFFIX[p.id]||p.id.charAt(0).toUpperCase()+p.id.slice(1);
  return 'https://commons.wikimedia.org/wiki/Special:Redirect/file/'+encodeURIComponent('Provinces of Japan-'+suffix+'.svg');
}
function recallMap(url,alt){return `<div class="recallMap"><img src="${url}" alt="${alt}" loading="eager"><div class="mapError">地図を読み込めませんでした。通信状態を確認して再読み込みしてください。</div></div>`}
window.startStudy=function(mode){
  session={mode,count:0,target:12};
  document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));
  document.getElementById('study').classList.add('active');
  document.querySelectorAll('.bottom button').forEach(x=>x.classList.remove('active'));
  nextRecall();
};
window.nextQuestion=nextRecall;
function nextRecall(){
  if(!session)return;
  if(session.count>=session.target){alert('このセットは終了です。記録に反映しました。');finishStudy();return;}
  const item=session.mode==='smart'?pickSmart():pickFor(session.mode);
  current={...item}; answered=false; session.count++;
  renderRecall();
}
function renderRecall(){
  const p=current.p,s=current.s;
  studyMode.textContent=session.mode==='smart'?'おすすめ復習':LABELS[session.mode];
  studyCount.textContent=session.count+' / '+session.target;
  studyProgress.style.width=((session.count-1)/session.target*100)+'%';
  choices.innerHTML=''; choices.style.display='none';
  answerBox.classList.remove('show'); rating.classList.remove('show'); feedback.className='feedback';
  studyMap.innerHTML=''; studyMap.style.display='none';
  prompt.className='prompt';
  let q='',sub='',label='';
  if(s==='reading'){label='読みを思い出す';q=p.name;sub='この旧国名をどう読む？';}
  if(s==='kanji'){label='漢字を思い出す';q=p.reading;sub='どの旧国名の漢字？';prompt.className='prompt reading';}
  if(s==='modern'){label='現在地を思い出す';q=p.name;sub='現在のおおよその都道府県は？';}
  if(s==='circuit'){label='五畿七道を思い出す';q=p.name;sub='どの区分に属する？';}
  if(s==='mapName'){
    label='位置から国名';q='この旧国は？';sub='色が付いた範囲の国名を思い出す';
    studyMap.style.display='block';studyMap.innerHTML=recallMap(recallHighlightedUrl(p),'対象の旧国を強調した地図');
  }
  if(s==='nameMap'){
    label='国名から位置';q=p.name;sub='この国が地図のどこかを思い浮かべる';
    studyMap.style.display='block';studyMap.innerHTML=recallMap(RECALL_BLANK_MAP,'旧国境の空白地図');
  }
  questionLabel.textContent=label;prompt.textContent=q;subprompt.textContent=sub;
  let hint=document.getElementById('recallHint');
  if(!hint){hint=document.createElement('div');hint.id='recallHint';hint.className='recallHint';studyCard.insertBefore(hint,answerBox);}
  hint.textContent='タップして答えと解説を表示';hint.style.display='block';
}
window.revealRecall=function(ev){
  if(answered)return;
  if(ev&&ev.target.closest('.rate,.back'))return;
  answered=true;
  const p=current.p,s=current.s;
  if(s==='nameMap')studyMap.innerHTML=recallMap(recallHighlightedUrl(p),'正解の旧国を強調した地図');
  const answers={reading:p.reading,kanji:p.name,modern:p.modern,circuit:p.circuit,mapName:p.name,nameMap:p.name};
  answerMain.textContent=answers[s];
  answerReading.textContent=(s==='reading'||s==='kanji')?`${p.name}（${p.reading}）`:p.reading;
  answerDetails.innerHTML=`<strong>${p.circuit}</strong> ／ ${p.modern}<br>${p.note}`;
  answerBox.classList.add('show');rating.classList.add('show');
  const hint=document.getElementById('recallHint');if(hint)hint.style.display='none';
};
window.rateRecall=function(level){
  if(!answered)return;
  data.total++;
  if(level===2)data.correct++;
  applyResult(level===0?0:level===1?1:3);
  nextRecall();
};
window.renderFreeMap=function(){
  freeMap.innerHTML=recallMap(recallLabels?RECALL_NAMES_MAP:RECALL_BLANK_MAP,recallLabels?'旧国名入り地図':'旧国境の空白地図');
  labelOn.classList.toggle('active',recallLabels);labelOff.classList.toggle('active',!recallLabels);
};
window.setLabels=function(on){recallLabels=on;renderFreeMap();};
window.openDetail=function(id){
  const p=P.find(x=>x.id===id);dName.textContent=p.name;dReading.textContent=p.reading;dCircuit.textContent=p.circuit;dModern.textContent=p.modern;dNote.textContent=p.note;dMastery.textContent=Math.round(avgLevel(p)*100)+'%';dMap.innerHTML=recallMap(recallHighlightedUrl(p),p.name+'を強調した地図');detailModal.classList.add('show');
};
window.renderStats=function(){
  statAnswered.textContent=data.total;
  statAccuracy.textContent=data.total?Math.round(data.correct/data.total*100)+'%':'—';
  statMastery.textContent=Math.round(overall()*100)+'%';
  skillRows.innerHTML=SKILLS.map(s=>{let v=P.reduce((n,p)=>n+data.countries[p.id][s].level,0)/(P.length*5);return`<div class="skillRow"><div class="skillTop"><span>${LABELS[s]}</span><span>${Math.round(v*100)}%</span></div><div class="miniBar"><div style="width:${v*100}%"></div></div></div>`}).join('');
  let weak=[];P.forEach(p=>SKILLS.forEach(s=>{let x=data.countries[p.id][s];if(x.seen)weak.push({p,s,x,score:x.level-x.lapses*.6})}));weak.sort((a,b)=>a.score-b.score);
  weakList.innerHTML=weak.length?weak.slice(0,10).map(w=>`<div class="weak"><span><b>${w.p.name}</b>　${LABELS[w.s]}</span><span>Lv.${w.x.level}</span></div>`).join(''):'<div class="empty">まだ学習記録がありません</div>';
};
