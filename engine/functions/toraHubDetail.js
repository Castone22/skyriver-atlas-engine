function toraHubDetail(){
 const modules=[[-40,276,9,20],[-29,294,10,28],[-15,276,6,15],[25,272,12,25],[44,281,6,18],[33,308,6,13],[12,326,5,26],[-9,381,4,22],[-9,117,3,21],[13,142,5,16]];
 return modules.map(([offset,y,w,h])=>{
  const x=330+offset;
  return hardware(y<190?0:y>=294?4:3,`<g stroke="#5792a2" stroke-width=".8"><path d="M${x} ${y}l4 -3h${w}v${h}l-4 3h${-w}Z" fill="#11303e"/><path d="M${x} ${y}h${w}v${h}M${x+w} ${y}l4 -3" fill="none"/><path d="M${x+2} ${y+4}h${w*.48}" stroke="#9ef7ff" stroke-width="1.6"/></g>`);
 }).join('')+hardware(3,`<path d="M282 256 Q330 282 378 256" fill="none" stroke="#76f1ff" stroke-width="2" filter="url(#toraGlow)"/>`);
}
