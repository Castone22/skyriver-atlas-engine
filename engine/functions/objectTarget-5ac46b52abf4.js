function objectTarget(name,attrs,parent){
 if(!widgetMode)return svg('g',attrs,parent);
 return svg('a',{...attrs,...(DATA.worlds[name]?{'data-planet-link':name}:{}),role:'link',href:url(name),target:'_blank',rel:'noopener',
  'aria-label':'Open '+planetName(name)+' in the Codex'},parent);
}
