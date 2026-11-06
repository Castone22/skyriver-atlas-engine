// The query string that shows the current view as a widget, without the leading "?" (the AtlasEmbed
// tag takes it that way): a system and its planet or object, else a region, else the bare widget.
function widgetQuery(){
 const from=routeURL().searchParams,q=new URLSearchParams({view:'widget'});
 if(from.get('system')){
  q.set('system',from.get('system'));
  for(const key of ['object','planet','station'])if(from.get(key))q.set(key,from.get(key));
 }else if(from.get('region')&&from.get('region')!=='all')q.set('region',from.get('region'));
 return q.toString();
}
