// Fine-tune the two island labels that are injected after the Wikimedia SVG is localized.
// This override keeps the original map-label typography by cloning a nearby province label.
window.injectIslandLabel=function(svg,label,xRatio,yRatio){
  const vb=(svg.getAttribute('viewBox')||'0 0 960 1003').trim().split(/[ ,]+/).map(Number);
  const width=vb[2]||960;
  const height=vb[3]||1003;

  // Coordinates are aligned to the actual island shapes in the Wikimedia base map.
  // Iki: the small island north-west of Chikuzen.
  // Tsushima: the long island farther north-west between Kyushu and the Korean peninsula.
  if(label==='壱岐'){
    xRatio=.075;
    yRatio=.770;
  }else if(label==='対馬'){
    xRatio=.046;
    yRatio=.713;
  }

  const x=(vb[0]||0)+width*xRatio;
  const y=(vb[1]||0)+height*yRatio;
  const ns='http://www.w3.org/2000/svg';

  // Clone an existing nearby province label so typography stays identical.
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

  const parent=reference&&reference.parentElement&&!reference.parentElement.getAttribute('transform')
    ? reference.parentElement
    : svg;
  parent.appendChild(text);
};
