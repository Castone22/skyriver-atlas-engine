function svgLink(name,label,attrs,parent){
 const group=parent.tagName.toLowerCase()==='a'?svg('g',{},parent):svg('a',{href:url(name),target:'_blank',rel:'noopener'},parent);
 textSVG(label===name?planetName(name):label,attrs,group);
 group.addEventListener('pointerdown',event=>event.stopPropagation());
 return group;
}
