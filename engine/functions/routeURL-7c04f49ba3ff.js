function routeURL(){
 const address=new URL(location.href);
 ['region','highlight','system','planet','object','focus'].forEach(key=>address.searchParams.delete(key));
 const record=resolveSystem(selected);
 if(highlightedRegion)address.searchParams.set('highlight',highlightedRegion);
 if(!record?.unplottedSystem)address.searchParams.set('region',view);
 if(record){address.searchParams.set('system',record.slug||record.id);address.searchParams.set('object',selectedWorld||'');if(!systemFocused)address.searchParams.set('focus','region');}
 if(stationOverview&&systemFocused)address.searchParams.set('focus','station');
 if(systemFocused&&planetFocus)address.searchParams.set('planet',planetFocus);
 if(widgetMode){address.searchParams.set('view','widget');address.searchParams.delete('embed')}else if(embedMode)address.searchParams.set('embed','1');else address.searchParams.delete('embed');
 address.hash=encodeURIComponent(record?selectedWorld||record.name:DATA.regions[view]?.name||'all');return address;
}
