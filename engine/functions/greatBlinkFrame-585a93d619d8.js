function greatBlinkFrame(planet){
 if(DATA.worlds[planet]?.appearance!=='great-blink')return '';
 const bands=[[3,12,71],[18,3,92],[25,17,36],[48,5,78],[58,11,55],[76,3,100],[85,9,48]];
 const rails=['left','top','right','bottom'].map((side,index)=>{
  const strips=bands.map(([at,length,reach],i)=>{
   const lag=-(i*.014+index*.071);
   return `<i class="blink-fragment" style="--at:${at}%;--length:${length}%;--reach:${reach}%;--lag:${lag}s"></i>`;
  }).join('');
  return `<span class="blink-rail blink-${side}">${strips}</span>`;
 });
 return `<div class="blink-frame" aria-hidden="true">${rails.join('')}</div>`;
}
