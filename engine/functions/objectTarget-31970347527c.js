function objectTarget(name,attrs,parent){
 if(!widgetMode)return svg('g',attrs,parent);
 return svg('a',{...attrs,role:'link',href:url(name),target:'_blank',rel:'noopener',
  'aria-label':'Open '+name+' in the Codex'},parent);
}
