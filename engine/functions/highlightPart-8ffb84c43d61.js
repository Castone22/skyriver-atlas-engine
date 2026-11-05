function highlightPart(index){
 const part=toraParts[index];if(!part)return;
 document.querySelectorAll('[data-part]').forEach(el=>el.setAttribute('aria-pressed',String(Number(el.dataset.part)===index)));
 for(const el of document.querySelectorAll('[data-hardware]')){
  if(Number(el.dataset.hardware)===index)el.setAttribute('filter','url(#toraAmber)');
  else el.removeAttribute('filter');
 }
 $('partReadout').innerHTML=`<b>0${index+1} / ${esc(part.title)}</b><p>${esc(part.note)}</p>`;
}
