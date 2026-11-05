function svgLink(name,label,attrs,parent){
 const group=parent.tagName.toLowerCase()==='a'?svg('g',{},parent):
  svg('a',{href:url(name),...(DATA.worlds[name]?{'data-planet-link':name}:{}),target:'_blank',rel:'noopener'},parent);
 textSVG(label===name?planetName(name):label,{...attrs,...(DATA.worlds[name]&&label===name?{'data-planet-title':name}:{})},group);
 group.addEventListener('pointerdown',event=>event.stopPropagation());
 return group;
}
