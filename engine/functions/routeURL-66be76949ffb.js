function routeURL(){
 const address=new URL(location.href);if(widgetMode&&!systemFocused)return address;
 ['region','system','planet','object','focus','chart','station'].forEach(key=>address.searchParams.delete(key));
 const record=resolveSystem(selected);
 if(!record?.unplottedSystem)address.searchParams.set('region',view);
 if(overviewMode&&(view!=='all'||record))address.searchParams.set('chart','overview');
 if(record){address.searchParams.set('system',record.id);address.searchParams.set('object',selectedWorld||'');if(!systemFocused)address.searchParams.set('focus','region');}
 if(systemFocused&&planetFocus)address.searchParams.set('planet',planetFocus);if(stationOverview)address.searchParams.set('station','1');
 if(widgetMode){address.searchParams.set('view','widget');address.searchParams.delete('embed')}else if(embedMode)address.searchParams.set('embed','1');else address.searchParams.delete('embed');
 address.hash=encodeURIComponent(record?selectedWorld||record.name:DATA.regions[view]?.name||'all');return address;
}
