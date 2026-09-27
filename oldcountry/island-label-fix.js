// Fine-tune the two island labels that are injected after the Wikimedia SVG is localized.
// This override keeps the original map-label typography by cloning a nearby province label.
window.injectIslandLabel=function(svg,label,xRatio,yRatio){
  const vb=(svg.getAttribute('viewBox')||'0 0 960 1003').trim().split(/[ ,]+/).map(Number);
  const width=vb[2]||960;
  const height=vb[3]||1003;

  // Iki sits east-southeast of Tsushima and north of Chikuzen.
  // The previous .095 x-ratio placed it noticeably too far west.
  if(label==='壱岐'){
    xRatio=.128;
    yRatio=.789;
  }else if(label==='対馬'){
    xRatio=.063;
    yRatio=.738;
  }

  const x=(vb[0]||0)+width*xRatio;
  const y=(vb[1]||0)+height*yRatio;
  const ns='http://www.w3.org/2000/svg';

  // By this point the ordinary province labels have already been translated.
  // Clone one of them so font family, size, weight and any SVG class/style stay identical.
  const reference=[...svg.querySelectorAll('text')].find(node=>{
    const t=(node.textContent||'').trim();
    return t==='筑前'||t==='肥前'||t==='長門'||t==='周防';
  })||svg.querySelector('text');

  let text;
  if(reference){
    text=reference.cloneNode(false);
    ['id','x','y','dx','dy','transform'].forEach(name=>text.removeAttribute(name));
  }else{
    text=document.createElementNS(ns,'text');
    text.setAttribute('font-family','sans-serif');
    text.setAttribute('font-size',String(width*.0135));
    text.setAttribute('fill','#2a2a2a');
  }

  text.setAttribute('x',x.toFixed(1));
  text.setAttribute('y',y.toFixed(1));
  text.setAttribute('text-anchor','middle');
  text.textContent=label;

  // Prefer the same label group when it has no coordinate transform, preserving inherited styling.
  const parent=reference&&reference.parentElement&&!reference.parentElement.getAttribute('transform')
    ? reference.parentElement
    : svg;
  parent.appendChild(text);
};
