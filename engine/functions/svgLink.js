function svgLink(name,label,attrs,parent){
 const f=__ATLAS__.flags,world=DATA.worlds[name],sameName=label===name;
 const group=parent.tagName.toLowerCase()==='a'?svg('g',{},parent):
  svg('a',{href:url(name),...(f.planetLinkAttributes&&world?{'data-planet-link':name}:{}),target:'_blank',rel:'noopener'},parent);
 const synced=f.linkTitleSync==='all'?sameName:f.linkTitleSync==='worlds'&&world&&sameName;
 textSVG(synced?planetName(name):label,f.planetLinkAttributes&&world&&sameName?{...attrs,'data-planet-title':name}:attrs,group);
 group.addEventListener('pointerdown',event=>event.stopPropagation());
 return group;
}
