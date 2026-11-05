function toraElevation(){
 // Fore and aft panel pairs have different projected lengths and pitches.
 const panels=[[-27,.98,1],[4,1,.85],[24,.9,.79]];
 const wing=(angle,length,depth)=>`<g transform="rotate(${angle}) scale(${length} ${depth})">
  <path d="M28 -6 L85 -11 197 -15 211 -9 202 0 137 5 74 9 28 6Z" fill="#102c3c" stroke="#71bccc"/>
  <path d="M63 -5 L94 -16 182 -23 215 -16 198 -5 107 2 74 5Z" fill="#1c4858" stroke="#b5f2ef"/>
  <path d="M65 7L80 12 139 7 194 5 203 -1 M84 6L96 -16 M118 1L129 -19 M149 -1L159 -21 M181 -4L191 -21 M199 -6L208 -18" fill="none" stroke="#65a7b8"/>
  <path d="M38 -9L78 -15 88 -10 44 -3Z M45 8L80 6 84 10 48 14Z" fill="#24404b" stroke="#528fa1"/>
  <path d="M77 6l14 -1 M136 2l10 -1 M194 -6l10 -1" stroke="#90ffff" stroke-width="3" filter="url(#toraGlow)"/></g>`;
 const pair=(args)=>[1,-1].map(f=>`<g transform="translate(330 254) scale(${f} 1)">${wing(...args)}</g>`).join('');
 function band(y,rx,ry,thickness,edge,face){
  return `<g stroke="${edge}" stroke-width="1"><path d="M${330-rx} ${y}a${rx} ${ry} 0 1 0 ${2*rx} 0v${thickness}a${rx} ${ry} 0 0 1 ${-2*rx} 0Z" fill="${face}"/><ellipse cx="330" cy="${y}" rx="${rx}" ry="${ry}" fill="${face}"/></g>`;
 }
 const spindle=(profile)=>profile.slice(1).map(([y2,r2],i)=>{
  const [y1,r1]=profile[i];
  const xs=[-1,-.66,-.22,.32,.73,1],fills=['#123343','#1b4959','#285e6c','#183e50','#0f2839'];
  return fills.map((fill,j)=>`<path d="M${330+r1*xs[j]} ${y1}L${330+r1*xs[j+1]} ${y1} ${330+r2*xs[j+1]} ${y2} ${330+r2*xs[j]} ${y2}Z" fill="${fill}" stroke="#69a5b2" stroke-width=".72"/>`).join('');
 }).join('');
 const lower=spindle([[269,49],[288,43],[299,42],[304,47],[313,45],[323,32],[337,27],[353,23],[360,26],[369,22],[402,17],[428,13],[448,7],[469,4],[489,1]]);
 const upper=spindle([[35,1],[59,3],[67,6],[88,8],[93,11],[119,14],[128,19],[146,21],[152,25],[166,22],[171,30],[178,29],[184,16],[189,15]]);
 const seams=[[-1,18,333,408],[1,24,307,376],[-1,32,296,359],[1,37,283,326],[-1,9,363,450],[1,9,87,129]].map(([dir,w,y,end])=>hardware(y<190?0:4,`<path d="M${330+dir*w} ${y}v${end-y}l${-dir*3} 4v${-(end-y)/2}" fill="#193e50" stroke="#71b9cd" stroke-width="1.4"/>`)).join('');
 const machine=[
  hardware(2,pair(panels[0])+pair(panels[1])),
  hardware(4,lower),seams,
  hardware(4,band(302,44,10,6,'#5796a8','#102f3c')),
  hardware(3,band(279,47,13,7,'#78bac7','#163d4c')),
  hardware(2,pair(panels[2])),
  hardware(3,spindle([[196,18],[216,20],[224,29],[234,36],[245,44],[260,48],[273,42]])+band(252,54,14,7,'#65d7e7','#103f52')+band(257,51,13,2,'#90f8ff','#12617a')),
  toraHubDetail(),hardware(3,band(231,35,8,5,'#78c0cf','#163b4c')),
  hardware(0,upper+band(173,31,7,3,'#7dc3d3','#163849')),
  hardware(1,band(192,59,12,3,'#a4e4ef','#1d4756')+`<ellipse cx="330" cy="192" rx="59" ry="12" fill="none" stroke="#93edfa" stroke-width="2.8" filter="url(#toraGlow)"/><ellipse cx="330" cy="192" rx="21" ry="5" fill="#285e6c" stroke="#a7e6ef"/>`),
  hardware(0,'<path d="M330 31V54" stroke="#96faff" stroke-width="2"/>'),
  hardware(4,'<path d="M330 472v20" stroke="#96faff" stroke-width="2"/>')
 ].join('');
 const marks=toraParts.map((p,i)=>{
  const sign=p.lx>330?1:-1;
  return `<g class="tora-mark" data-part="${i}" role="button" tabindex="0" aria-label="Inspect ${esc(p.title)}" aria-pressed="false"><title>${esc(p.title)}</title><path d="M${p.x} ${p.y} L${p.lx-sign*15} ${p.ly} H${p.lx+sign*8}" fill="none"/><circle cx="${p.x}" cy="${p.y}" r="6.5" fill="#09212c"/><circle cx="${p.x}" cy="${p.y}" r="3.4" fill="currentColor"/><circle cx="${p.x}" cy="${p.y}" r="18" fill="#ffffff" fill-opacity="0" stroke="none" pointer-events="all"/><text x="${p.lx+sign*13}" y="${p.ly+4}" text-anchor="${sign===1?'start':'end'}">0${i+1} / ${p.label}</text></g>`;
 }).join('');
 return `<svg class="tora-plate" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 660 520" role="group" aria-label="Holographic elevation of the Terranos array with five component markers"><defs><pattern id="toraGrid" width="22" height="22" patternUnits="userSpaceOnUse"><path d="M22 0H0V22" fill="none" stroke="#325566" stroke-width=".5"/></pattern><radialGradient id="toraBackdrop"><stop stop-color="#133443"/><stop offset="1" stop-color="#08131e"/></radialGradient><filter id="toraAmber" filterUnits="userSpaceOnUse" x="0" y="0" width="660" height="520" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 1.35 0 0 .06  0 .82 0 0 .01  0 .30 0 0 0  0 0 0 1 0"/></filter><filter id="toraGlow" x="-60%" y="-100%" width="220%" height="300%"><feGaussianBlur stdDeviation="2"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
 <rect width="660" height="520" fill="url(#toraBackdrop)"/><rect width="660" height="520" fill="url(#toraGrid)" opacity=".45"/><g fill="none" stroke="#345464" stroke-width=".65"><path d="M330 19V502 M47 254H613" stroke-dasharray="3 7"/><ellipse cx="330" cy="256" rx="224" ry="48" stroke-dasharray="5 8"/><path d="M40 35h-8v454h8 M620 35h8v454h-8"/></g>
 <g class="tora-build">${machine}</g><g class="tora-scan" pointer-events="none"><path d="M102 484H558" stroke="#a1f6ff" opacity=".7"/></g><g class="tora-marks">${marks}</g>
 <g fill="#88aab7" font-family="monospace" font-size="9" letter-spacing="1.3"><text x="22" y="19">FIG. 01 / ARRAY ELEVATION</text><text x="638" y="19" text-anchor="end">CLASS PLATE · 134 CE</text><text x="22" y="508">EXTERNAL GEOMETRY</text><text x="638" y="508" text-anchor="end">SCHEMATIC / NTS</text></g></svg>`;
}
